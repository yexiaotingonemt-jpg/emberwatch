import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { PinballModel, PADS, PADDLE_Y, TOWERS, type TowerType } from '../src/pinball/model';

// Campaigns use only player actions. No HP, damage, money or wave overrides.
type Strategy='mixed'|'elemental'|'fire'|'passive'|'idle';
const order=[3,4,2,6,5,7,8,9,10,11];
const mixed:TowerType[]=['storm','prism','fire','frost','fire','storm','prism','storm','frost','fire'];
const elemental:TowerType[]=['storm','frost','fire','storm','fire','frost','storm','fire','frost','storm'];
const priority=['wide','echo','catalyst','fury','cold','prism','bounty','heavy','recovery'];
function fold(x:number,min:number,max:number){const width=max-min,period=width*2;const p=((x-min)%period+period)%period;return min+(p>width?period-p:p);}

export function simulate(seed:number,strategy:Strategy){
  const m=new PinballModel(0,seed),dt=1/60;
  let ticks=0,launches=0,overdrives=0,peakBalls=0,peakEffects=0;
  const events:Record<string,number>={};
  m.setAim(-4.8);
  while(!['victory','defeat'].includes(m.phase)&&ticks++<180000){
    if(m.perkChoices.length){
      const choice=(m.hp<10&&m.perkChoices.includes('recovery'))?'recovery':priority.find(p=>m.perkChoices.includes(p))!;
      m.choosePerk(choice);
    }
    if(strategy!=='idle'){
      const next=order.find(pad=>!m.towers.some(t=>t.pad===pad));
      // First make a useful linked circuit, then strengthen it before expanding.
      const weakest=m.towers.filter(t=>t.level<3).sort((a,b)=>a.level-b.level||a.pad-b.pad)[0];
      if(m.towers.length>=6&&weakest){if(m.gold>=m.upgradeCost(weakest)){m.selectedPad=weakest.pad;m.upgrade();}}
      else if(next!==undefined){const type=strategy==='fire'?'fire':(strategy==='mixed'||strategy==='passive'?mixed:elemental)[order.indexOf(next)];if(m.gold>=TOWERS[type].cost)m.build(next,type);}
    }
    if(m.phase==='build')m.startWave();
    if(m.ballReady&&strategy!=='passive'){if(m.launch())launches++;}
    if(strategy!=='idle'&&strategy!=='passive'){
      const descending=m.balls.filter(b=>b.vy>0&&b.y<PADDLE_Y).sort((a,b)=>(PADDLE_Y-a.y)/a.vy-(PADDLE_Y-b.y)/b.vy)[0];
      if(descending){
        const b=descending,time=Math.max(0,(PADDLE_Y-10-b.radius-b.y)/b.vy);
        const hit=fold(b.x+b.vx*time,45+b.radius,855-b.radius);
        // Offset the intercept to steer the return toward a different linked bumper.
        const target=m.towers.map(t=>PADS[t.pad]).filter(p=>Math.abs(p.x-hit)<430).sort((a,b)=>Math.abs(a.x-hit)-Math.abs(b.x-hit))[ticks%3]??PADS[1];
        const contact=Math.max(-.8,Math.min(.8,Math.atan2(target.x-hit,PADDLE_Y-24-target.y)/1.08));
        m.movePaddle(hit-contact*m.paddleWidth/2);
      }
      if(m.overdrive>=100&&m.enemies.length>=3){if(m.activateOverdrive())overdrives++;}
    }
    m.update(dt);
    for(const event of m.events)events[event.type]=(events[event.type]??0)+1;
    m.events=[];peakBalls=Math.max(peakBalls,m.balls.length);peakEffects=Math.max(peakEffects,m.effects.length);
    for(const b of m.balls)if(![b.x,b.y,b.vx,b.vy].every(Number.isFinite))throw Error(`Invalid physics: ${seed}/${strategy}`);
  }
  return {seed,strategy,phase:m.phase,wave:m.wave,hp:m.hp,gold:m.gold,kills:m.kills,score:m.score,
    seconds:Math.round(m.runTime),ticks,drains:m.drains,launches,overdrives,bestCombo:m.bestCombo,
    bumperHits:m.bumperHits,fusions:m.fusionCount,peakBalls,peakEffects,towers:m.towers.length,events};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const results=[];
  for(const strategy of ['mixed','elemental','fire','passive','idle'] as const)for(const seed of [1,73,2026]){
    const result=simulate(seed,strategy);results.push(result);console.log(JSON.stringify(result));
  }
  writeFileSync(fileURLToPath(new URL('./pinball-balance-results.json',import.meta.url)),JSON.stringify(results,null,2)+'\n');
  if(results.some(r=>r.ticks>=180000))throw Error('Campaign did not reach a terminal state within 50 minutes.');
}
