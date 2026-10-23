import test from 'node:test';
import assert from 'node:assert/strict';
import { PinballModel, PADS, PADDLE_Y, BUMPER_RADIUS, TOWERS, type Ball, type TowerType } from '../src/pinball/model';
import { simulate } from '../qa/pinball-balance';

type Harness = { queue: {type:string;lane:number}[]; spawnTimer:number; makeBall(x:number,y:number,vx:number,vy:number):Ball; spawn(type:string,lane:number):void };
const internal = (m:PinballModel) => m as unknown as Harness;
const step = 1 / 180;
function combat() {
  const m = new PinballModel(0, 1234);
  m.phase='wave'; m.wave=1;
  // A distant future spawn prevents the wave ending while testing one collision.
  internal(m).queue=[{type:'swarm',lane:0}]; internal(m).spawnTimer=10000;
  m.events=[];
  return m;
}
function ball(m:PinballModel,x:number,y:number,vx:number,vy:number) {
  const b=internal(m).makeBall(x,y,vx,vy);m.balls.push(b);return b;
}
function strike(m:PinballModel,pad:number,previous:number|null=null) {
  const p=PADS[pad],b=ball(m,p.x-BUMPER_RADIUS-9,p.y,620,0);
  b.lastPad=previous;b.elementTime=8;
  if(previous!==null){const t=m.towers.find(t=>t.pad===previous)!;b.element=t.type==='prism'?'neutral':t.type;}
  m.update(step);return b;
}

test('pinball: construction, upgrade and sale obey economy and phase limits',()=>{
  const m=new PinballModel(0,1),gold=m.gold;
  assert.equal(m.build(-1,'fire'),false);assert.equal(m.build(0,'fire'),false);assert.equal(m.gold,gold);
  assert.equal(m.build(2,'storm'),true);assert.equal(m.gold,gold-TOWERS.storm.cost);
  m.gold=1000;m.selectedPad=2;assert.equal(m.upgrade(),true);assert.equal(m.upgrade(),true);
  const remaining=m.gold;assert.equal(m.upgrade(),false);assert.equal(m.gold,remaining);
  const refund=m.sellValue(m.selectedTower()!);assert.equal(m.sell(),true);assert.equal(m.gold,remaining+refund);
  m.phase='victory';assert.equal(m.build(2,'storm'),false);assert.equal(m.sell(),false);
});

test('pinball: wall reflects fast ball without losing energy or escaping rails',()=>{
  const m=combat(),b=ball(m,54,440,-840,-150),before=Math.hypot(b.vx,b.vy);
  m.update(step);
  assert.ok(b.vx>0);assert.ok(b.x>=45+b.radius);
  assert.ok(Math.abs(Math.hypot(b.vx,b.vy)-before)<.001);
  assert.ok(m.events.some(e=>e.type==='wall'));
});

test('pinball: top rail redirects downwards and horizontal orbits acquire useful vertical motion',()=>{
  const m=combat(),b=ball(m,810,64,200,-800);m.update(step);
  assert.ok(b.vy>0);assert.ok(b.y>=55+b.radius);
  const flat=ball(m,810,400,700,0);m.update(step);assert.ok(Math.abs(flat.vy)>=135);
  assert.ok(Number.isFinite(flat.vx)&&Number.isFinite(flat.vy));
});

test('pinball: fast bumper hit kicks out, charges tower and cannot farm repeat contacts',()=>{
  const m=combat(),b=strike(m,0),t=m.towers[0];
  assert.equal(m.bumperHits,1);assert.equal(t.hits,1);assert.equal(b.element,'fire');assert.ok(b.vx<0);
  assert.ok(Math.hypot(b.x-PADS[0].x,b.y-PADS[0].y)>=BUMPER_RADIUS+b.radius);
  assert.ok(Math.hypot(b.vx,b.vy)>=620);assert.ok(t.charge>=1);
  // Force overlap during the collision cooldown: a second frame must not grant another hit.
  b.x=PADS[0].x-35;b.y=PADS[0].y;b.vx=620;b.vy=0;m.update(step);
  assert.equal(m.bumperHits,1);
});

test('pinball: central paddle rebound goes up and edge positions steer opposite directions',()=>{
  const m=combat();
  const center=ball(m,450,890,0,620);m.update(step);assert.ok(center.vy<-600);assert.ok(Math.abs(center.vx)<1);
  const left=ball(m,390,890,0,620),right=ball(m,510,890,0,620);m.update(step);
  assert.ok(left.vx<-350&&left.vy<0);assert.ok(right.vx>350&&right.vy<0);
  assert.ok(Math.abs(left.vx+right.vx)<.01);
});

test('pinball: moving paddle adds directional English without exceeding speed cap',()=>{
  const stationary=combat(),moving=combat();
  const a=ball(stationary,450,890,0,700);stationary.update(step);
  moving.movePaddle(700);const b=ball(moving,450+1600*step,890,0,700);moving.update(step);
  assert.ok(b.vx>a.vx+100);assert.ok(b.vy<0);assert.ok(Math.hypot(b.vx,b.vy)<=850.001);
  moving.movePaddle(Infinity);assert.ok(Number.isFinite(moving.paddleTarget));
});

for(const hp of [2,20])test(`pinball: missing paddle at ${hp} HP keeps the re-serve instruction usable`,()=>{
  const m=combat();m.hp=hp;ball(m,790,1024,100,620);m.update(step);
  assert.equal(m.balls.length,0);assert.equal(m.hp,hp-1);assert.equal(m.drains,1);assert.equal(m.ballReady,true);
  m.update(.1);assert.equal(m.hp,hp-1);assert.equal(m.drains,1);
  assert.equal(m.launch(),true);assert.equal(m.launch(),false);assert.equal(m.balls.length,1);
  assert.match(m.events.find(e=>e.type==='drain')?.text??'',/重新发射/);
});

test('pinball: fatal drain gives restart guidance, blocks re-serve and allows a new run',()=>{
  const m=combat();m.hp=1;ball(m,790,1024,100,620);m.update(step);
  assert.equal(m.hp,0);assert.equal(m.phase,'defeat');assert.equal(m.ballReady,false);
  const message=m.events.find(e=>e.type==='drain')?.text??'';
  assert.match(message,/再来一局.*重新开局/);assert.doesNotMatch(message,/重新发射|按空格/);
  assert.equal(m.launch(),false);assert.equal(m.balls.length,0);
  m.update(.1);assert.equal(m.events.filter(e=>e.type==='lose').length,1);
  m.restart();assert.equal(m.hp,20);assert.equal(m.phase,'build');
  assert.equal(m.launch(),true);assert.equal(m.phase,'wave');assert.equal(m.balls.length,1);
});

test('pinball: pause and pending perk freeze simulation and reject spending and serve',()=>{
  const m=combat(),b=ball(m,400,600,200,620);m.paused=true;const snapshot=JSON.stringify([b.x,b.y,m.time,m.hp,m.gold]);
  m.update(.1);assert.equal(JSON.stringify([b.x,b.y,m.time,m.hp,m.gold]),snapshot);
  assert.equal(m.build(3,'fire'),false);m.ballReady=true;assert.equal(m.launch(),false);
  m.paused=false;m.perkChoices=['wide','recovery','bounty'];m.update(.1);assert.equal(b.x,400);
  assert.equal(m.choosePerk('catalyst'),false);assert.equal(m.choosePerk('wide'),true);assert.equal(m.paddleWidth,196);
});

for(const [a,b,event] of [['fire','frost','steam'],['frost','storm','conduct'],['fire','storm','plasma']] as const){
  for(const reverse of [false,true])test(`pinball: ${a}/${b} fusion works in ${reverse?'reverse':'forward'} order through real collisions`,()=>{
    const m=combat();m.towers=[];m.gold=500;m.build(0,reverse?b:a);m.build(1,reverse?a:b);
    assert.ok(m.links.some(l=>l.type===event));
    internal(m).spawn('brute',1);const e=m.enemies[0];e.x=PADS[1].x;e.y=PADS[1].y+60;e.hp=1000;
    const before=e.hp;strike(m,1,0);
    assert.equal(m.fusionCount,1);assert.ok(m.events.some(e=>e.type===event));assert.ok(e.hp<before);
    if(event==='conduct')assert.ok(e.freeze>0);if(event==='steam')assert.ok(e.slow>0&&e.burn>0);
  });
}

test('pinball: connected neighbor receives energy, unrelated far tower does not',()=>{
  const m=combat();m.gold=500;m.build(11,'storm');const near=m.towers.find(t=>t.pad===1)!,far=m.towers.find(t=>t.pad===11)!;
  strike(m,0);assert.ok(near.charge>0);assert.equal(far.charge,0);
});

test('pinball: expired elements cannot trigger stale fusion',()=>{
  const m=combat(),p=PADS[1],b=ball(m,p.x-38,p.y,620,0);b.lastPad=0;b.element='fire';b.elementTime=.001;
  m.update(step);assert.equal(m.fusionCount,0);assert.equal(b.element,'frost');
});

test('pinball: prism makes a physical short-lived clone inheriting the element',()=>{
  const m=combat();m.gold=500;m.build(3,'prism');const b=strike(m,3,0);
  assert.equal(m.balls.length,2);const clone=m.balls.find(x=>x!==b)!;
  assert.equal(clone.element,'fire');assert.equal(clone.life,10);assert.notEqual(clone.vx,b.vx);
  const x=clone.x;m.update(step);assert.notEqual(clone.x,x);assert.ok(clone.life<10);
});

test('pinball: overdrive requires full charge and strengthens paddle for eight seconds',()=>{
  const m=combat();assert.equal(m.activateOverdrive(),false);m.overdrive=100;assert.equal(m.activateOverdrive(),true);
  assert.equal(m.overdrive,0);assert.equal(m.overdriveActive,8);assert.equal(m.activateOverdrive(),false);
  m.update(.1);assert.ok(m.paddleWidth>160);assert.ok(m.overdriveActive<8&&m.overdriveActive>7.8);
});

test('pinball: preview and invalid time steps cannot mutate run state',()=>{
  const m=new PinballModel(0,5),snapshot=JSON.stringify(m);const points=m.previewTrajectory();
  assert.ok(points.length>10);assert.equal(JSON.stringify(m),snapshot);
  for(const dt of [NaN,Infinity,-1])m.update(dt);assert.equal(JSON.stringify(m),snapshot);
});

test('pinball: final clear and zero-life defeat are terminal and restart preserves best score',()=>{
  const victory=combat();internal(victory).queue=[];victory.wave=12;victory.update(step);
  assert.equal(victory.phase,'victory');assert.ok(victory.bestScore>0);assert.equal(victory.startWave(),false);
  const best=victory.bestScore;victory.restart();assert.equal(victory.bestScore,best);assert.equal(victory.phase,'build');assert.equal(victory.wave,0);
  const defeat=combat();defeat.hp=1;ball(defeat,790,1024,100,620);defeat.update(step);
  assert.equal(defeat.phase,'defeat');assert.equal(defeat.ballReady,false);assert.equal(defeat.launch(),false);
});

test('pinball: seeded fixed-step run is deterministic across render rates',()=>{
  function run(frames:number,dt:number){const m=new PinballModel(0,77);m.launch();for(let i=0;i<frames;i++)m.update(dt);return m;}
  const a=run(240,1/60),b=run(480,1/120);
  assert.equal(a.kills,b.kills);assert.equal(a.hp,b.hp);assert.equal(a.bumperHits,b.bumperHits);
  assert.ok(Math.abs(a.time-b.time)<step*1.1);
  assert.equal(a.balls.length,b.balls.length);
  for(let i=0;i<a.balls.length;i++)assert.ok(Math.hypot(a.balls[i].x-b.balls[i].x,a.balls[i].y-b.balls[i].y)<6);
});

test('pinball: three seeded mixed campaigns win through real rebounds and linked circuits',()=>{
  for(const seed of [1,73,2026]){
    const result=simulate(seed,'mixed');
    assert.equal(result.phase,'victory',JSON.stringify(result));assert.equal(result.wave,12);
    assert.ok(result.fusions>20);assert.ok(result.bumperHits>100);assert.ok(result.peakBalls>1);
    assert.ok(result.events.paddle>20);assert.ok(result.hp>0);assert.ok(result.seconds<600);
  }
});

test('pinball: passive tower management and a neglected paddle cannot coast to victory',()=>{
  const passive=simulate(1,'passive'),idle=simulate(1,'idle');
  assert.equal(passive.phase,'defeat');assert.equal(passive.launches,0);assert.equal(passive.bumperHits,0);
  assert.ok(passive.wave<12);assert.equal(idle.phase,'defeat');assert.ok(idle.drains>10);
});
