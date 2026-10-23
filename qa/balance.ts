import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { GameModel, MAPS, type TowerType } from '../src/model';

// Deterministic campaigns against the actual production model, without overrides.
const orders = [[4,7,2,10,8,13,0,12,14,6,5,9,15,3,1,11],
  [2,5,8,10,7,11,9,0,4,6,13,14,15,1,3,12],
  [4,7,8,2,10,13,0,6,9,12,3,5,14,1,11,15]];
const mixed: TowerType[] = ['arrow','cannon','arrow','frost','storm','storm','arrow','cannon','frost','arrow'];
const branches: ('a'|'b')[] = ['a','a','b','a','a','b','a','b','b','b'];

function simulate(map: number, mix: boolean, limit: number, meteor: boolean) {
  const game = new GameModel(map);
  game.speed = 3;
  let ticks=0, meteors=0;
  const order = orders[map];
  while(game.phase!=='victory' && game.phase!=='defeat' && ticks++<70000) {
    if(game.perkChoices.length) game.choosePerk(game.perkChoices.includes('fury')?'fury':'haste');
    const nextPad=order.find(p=>!game.towers.some(t=>t.pad===p));
    const build = () => {
      if(nextPad!==undefined && game.towers.length<limit)
        game.build(nextPad,mix?mixed[game.towers.length % mixed.length]:'arrow');
    };
    if(game.towers.length<3) build();
    else {
      const tower=game.towers.find(t=>t.level<3);
      if(tower) {
        game.selectedPad=tower.pad;
        game.upgrade(mix?branches[order.indexOf(tower.pad)%branches.length]:order.indexOf(tower.pad)%3===2?'b':'a');
      } else build();
    }
    if(game.phase==='build') game.startWave();
    if(meteor && game.abilityCooldown<=0 && game.enemies.length) {
      const urgent=game.enemies.find(e=>e.type==='boss')??game.enemies.reduce((a,b)=>a.progress>b.progress?a:b);
      const count=game.enemies.filter(e=>Math.hypot(e.x-urgent.x,e.y-urgent.y)<115).length;
      if(urgent.type==='boss'||urgent.progress>game.pathLength*.75||count>=6) {
        game.targeting=true;
        if(game.meteor(urgent.x,urgent.y)) meteors++;
      }
    }
    game.update(.1); game.events=[];
  }
  return {map:MAPS[map].name,variant:'production',strategy:mix?'mixed':'arrows',limit,meteor,
    phase:game.phase,hp:game.hp,wave:game.wave,kills:game.kills,meteors,towers:game.towers.length,gold:game.gold};
}
const results: ReturnType<typeof simulate>[] = [];
for (const config of [
  {mix:false,limit:16,meteor:false},
  {mix:true,limit:10,meteor:false},
  {mix:true,limit:8,meteor:false},
  {mix:true,limit:8,meteor:true},
]) for(let map=0;map<MAPS.length;map++) {
  const result = simulate(map,config.mix,config.limit,config.meteor);
  results.push(result);
  console.log(JSON.stringify(result));
}
writeFileSync(fileURLToPath(new URL('./balance-results.json', import.meta.url)), JSON.stringify(results,null,2) + '\n');
