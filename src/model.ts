export type TowerType = 'arrow' | 'cannon' | 'frost' | 'storm';
export type EnemyType = 'crawler' | 'runner' | 'brute' | 'shield' | 'healer' | 'boss';
export type Point = [number, number];
export const WORLD_W = 1100, WORLD_H = 740;
export interface MapData { id:number; name:string; subtitle:string; description:string; path:Point[]; pads:Point[]; tint:number; }
export const MAPS:MapData[] = [
  {id:0,name:'萤火之森',subtitle:'THE FIREFLY WOODS',description:'古老林道蜿蜒穿过萤火森林。利用中央的回弯，让火力覆盖更长的路程。',tint:0x29443a,
    path:[[-40,200],[180,200],[280,290],[280,440],[400,520],[600,520],[680,440],[680,260],[780,180],[920,180],[1000,260],[1000,420],[910,490],[910,610],[1040,610]],
    pads:[[140,300],[230,110],[380,220],[170,440],[400,410],[450,620],[590,620],[570,400],[570,220],[720,100],[800,300],[890,90],[900,360],[790,460],[790,610],[1015,530]]},
  {id:1,name:'沉月湿地',subtitle:'THE SUNKEN MOON',description:'月光洒落在沉没的遗迹上。长长的环线适合远程与连锁法术，迅捷的敌人却不容忽视。',tint:0x253d48,
    path:[[-40,550],[190,550],[260,460],[260,230],[370,140],[560,140],[640,230],[640,420],[530,500],[460,570],[550,650],[790,650],[870,550],[870,290],[1000,290],[1040,380]],
    pads:[[140,440],[150,650],[350,350],[150,220],[370,70],[490,250],[700,120],[750,330],[530,370],[350,560],[610,570],[760,540],[770,700],[970,550],[980,180],[1000,460]]},
  {id:2,name:'灰烬山隘',subtitle:'THE ASHEN PASS',description:'最后的灯火守住群山。道路更短、敌人更强，集中火力与精准陨星将决定这一夜的结局。',tint:0x403934,
    path:[[-40,180],[220,180],[340,280],[340,480],[450,570],[620,570],[730,480],[730,250],[850,170],[1000,170],[1020,300],[920,380],[920,560],[1040,610]],
    pads:[[160,290],[280,80],[450,200],[220,430],[450,420],[390,670],[590,680],[620,450],[620,270],[760,90],[850,280],[950,80],[1020,440],[810,490],[810,650],[1030,690]]}
];
interface TowerData { name:string; label:string; description:string; cost:number; color:string; range:number; damage:number; interval:number; branches:{a:{name:string;description:string};b:{name:string;description:string}}; }
export const TOWERS:Record<TowerType,TowerData> = {
  arrow:{name:'游侠哨塔',label:'精准 · 物理',description:'快速射击，优先清除行进最远的敌人。面对疾行兽群格外可靠。',cost:80,color:'#d6bc70',range:175,damage:18,interval:.64,branches:{a:{name:'风行连弩',description:'同时攻击 3 个目标、射速提高，单箭伤害降低。'},b:{name:'鹰眼重弩',description:'射程大幅提高，箭矢穿透护甲。'}}},
  cannon:{name:'余烬炮台',label:'范围 · 爆破',description:'发射重型炮弹，对密集敌群造成范围伤害。护甲会削减爆炸伤害。',cost:120,color:'#e58b57',range:165,damage:48,interval:1.9,branches:{a:{name:'炼狱火炮',description:'爆炸点燃敌人，持续造成真实伤害。'},b:{name:'震地重炮',description:'更大的爆炸半径与更强的冲击伤害。'}}},
  frost:{name:'霜语方尖碑',label:'减速 · 奥术',description:'冰霜脉冲无视护甲，减缓敌人脚步，为其他防御塔争取时间。',cost:100,color:'#88d5dc',range:150,damage:12,interval:1.15,branches:{a:{name:'永冬之心',description:'显著延长减速，并短暂冻结目标。'},b:{name:'碎冰诅咒',description:'提高伤害，使目标受到额外伤害。'}}},
  storm:{name:'雷鸣圣坛',label:'连锁 · 奥术',description:'召唤跳跃闪电，无视护甲，在相邻敌人间传导，最多命中 3 个目标。',cost:150,color:'#baa3ee',range:160,damage:27,interval:1.5,branches:{a:{name:'风暴回响',description:'闪电最多传导 6 次，跳跃距离提高。'},b:{name:'天罚之矛',description:'集中雷霆重创目标，并短暂眩晕。'}}}
};
export const PERKS:Record<string,{name:string;description:string;icon:string}> = {
  keen:{name:'鹰之视野',description:'所有防御塔射程 +18%。',icon:'eye'},
  fury:{name:'余烬之怒',description:'所有防御塔伤害 +20%。',icon:'fire'},
  haste:{name:'疾风祝福',description:'所有防御塔攻击间隔缩短 16%。',icon:'wind'},
  fortune:{name:'林地馈赠',description:'立即获得 180 金币，击杀金币 +20%。',icon:'gold'},
  renewal:{name:'灯火重燃',description:'恢复 6 点灯塔生命，并使陨星冷却缩短至 26 秒。',icon:'heart'},
  winter:{name:'长夜寒息',description:'减速效果更强、更持久，陨星伤害 +35%。',icon:'snow'}
};
export interface Tower {id:number;pad:number;type:TowerType;level:number;branch:'a'|'b'|null;invested:number;kills:number;angle:number;cooldown:number;}
export interface Enemy {id:number;type:EnemyType;x:number;y:number;hp:number;maxHp:number;progress:number;slow:number;radius:number;speed:number;armor:number;reward:number;burn:number;burnDamage:number;stun:number;vulnerable:number;healTimer:number;}
export interface Shot {id:number;x:number;y:number;tx:number;ty:number;type:TowerType;life:number;target:number;damage:number;towerId:number;branch:'a'|'b'|null;level:number;}
export interface Effect {id:number;x:number;y:number;type:string;life:number;maxLife:number;color?:number;text?:string;tx?:number;ty?:number;radius?:number;}
export interface GameEvent {type:string;text?:string;}
interface Spawn {type:EnemyType;delay:number;}
const ENEMIES:Record<EnemyType,{hp:number;speed:number;armor:number;reward:number;radius:number;leak:number}> = {
  crawler:{hp:55,speed:49,armor:0,reward:8,radius:11,leak:1},
  runner:{hp:42,speed:92,armor:0,reward:8,radius:11,leak:1},
  brute:{hp:240,speed:33,armor:.28,reward:19,radius:18,leak:2},
  shield:{hp:150,speed:44,armor:.58,reward:15,radius:14,leak:2},
  healer:{hp:125,speed:43,armor:.05,reward:20,radius:14,leak:1},
  boss:{hp:2200,speed:28,armor:.32,reward:130,radius:27,leak:8}
};
const WAVE_NAMES = ['林间低语','疾影初现','石肤来客','长夜奔袭','林地守卫','盾阵前行','暗潮涌动','荆棘之心','兽群奔腾','沉默巨像','暗月祭司','黑潮来袭','绝境回响','终夜行军','永夜之王'];
export class GameModel {
  map:MapData; gold=360; hp=20; maxHp=20; wave=0; maxWaves=15; kills=0;
  phase:'build'|'wave'|'victory'|'defeat'='build'; paused=false; speed=1;
  selectedPad:number|null=null;buildType:TowerType|null='arrow';targeting=false;abilityCooldown=0;
  perkChoices:string[]=[];perks:string[]=[];waveRemaining=0;waveTotal=0;time=0;
  towers:Tower[]=[];enemies:Enemy[]=[];shots:Shot[]=[];effects:Effect[]=[];
  best:Record<string,number>={};events:GameEvent[]=[];score=0;stars=0;
  private nextId=1; private queue:Spawn[]=[];private spawnTimer=0;private segments:number[]=[];pathLength=0;
  constructor(mapId=0,best:Record<string,number>={}) {this.map=MAPS[mapId]||MAPS[0];this.best={...best};this.measurePath();}
  private measurePath(){this.segments=[];this.pathLength=0;for(let i=1;i<this.map.path.length;i++){const a=this.map.path[i-1],b=this.map.path[i];const d=Math.hypot(b[0]-a[0],b[1]-a[1]);this.segments.push(d);this.pathLength+=d;}}
  restart(mapId=this.map.id){const best=this.best;Object.assign(this,new GameModel(mapId,best));}
  emit(type:string,text?:string){this.events.push({type,text});}
  effect(type:string,x:number,y:number,life=.5,extra:Partial<Effect>={}){this.effects.push({id:this.nextId++,type,x,y,life,maxLife:life,...extra});}
  selectedTower(){return this.towers.find(t=>t.pad===this.selectedPad);}
  stats(t:Tower){const d=TOWERS[t.type];let damage=d.damage*(t.level===1?1:t.level===2?1.7:2.9),range=d.range+(t.level-1)*12,interval=d.interval;
    if(t.branch==='a'){if(t.type==='arrow'){interval*=.86;damage*=.72;}if(t.type==='frost')range+=10;}
    if(t.branch==='b'){if(t.type==='arrow'){damage*=1.45;range+=65;interval*=1.15;}if(t.type==='cannon')damage*=1.25;if(t.type==='frost')damage*=1.9;if(t.type==='storm')damage*=2.7;}
    if(this.perks.includes('fury'))damage*=1.2;if(this.perks.includes('keen'))range*=1.18;if(this.perks.includes('haste'))interval*=.84;
    return {damage,range,interval};}
  range(t:Tower){return this.stats(t).range;}
  upgradeCost(t:Tower){return Math.round(TOWERS[t.type].cost*(t.level===1?1.3:2.1));}
  sellValue(t:Tower){return Math.floor(t.invested*.7);}
  build(pad:number,type:TowerType){if(this.paused||this.perkChoices.length||!['build','wave'].includes(this.phase)||!this.map.pads[pad]||this.towers.some(t=>t.pad===pad))return false;
    if(this.gold<TOWERS[type].cost){this.emit('error','金币不足，击败敌人或出售防御塔可获得金币。');return false;}
    this.gold-=TOWERS[type].cost;this.towers.push({id:this.nextId++,pad,type,level:1,branch:null,invested:TOWERS[type].cost,kills:0,angle:-Math.PI/2,cooldown:.1});this.selectedPad=pad;
    this.effect('build',...this.map.pads[pad],.8);this.emit('build');return true;}
  upgrade(branch:'a'|'b'){const t=this.selectedTower();if(!t||t.level>=3||this.paused||this.perkChoices.length||!['build','wave'].includes(this.phase))return false;const cost=this.upgradeCost(t);if(this.gold<cost){this.emit('error','金币不足，暂时无法升级。');return false;}
    this.gold-=cost;t.invested+=cost;if(t.level===1)t.branch=branch;t.level++;this.effect('build',...this.map.pads[t.pad],1);this.emit('upgrade');return true;}
  sell(){const t=this.selectedTower();if(!t||this.paused||this.perkChoices.length||!['build','wave'].includes(this.phase))return false;this.gold+=this.sellValue(t);this.towers=this.towers.filter(x=>x!==t);this.emit('sell');return true;}
  waveName(w=this.wave+1){return WAVE_NAMES[Math.min(14,Math.max(0,w-1))];}
  nextWavePreview(){const w=Math.min(15,this.wave+1);const q=this.makeWave(w);const types=[...new Set(q.map(x=>x.type))];const names:Record<EnemyType,string>={crawler:'暮影虫',runner:'疾行兽',brute:'岩甲巨兽',shield:'暗盾卫士',healer:'荆棘祭司',boss:'永夜领主'};return `${this.waveName(w)} · ${q.length} 名敌人 · ${types.map(t=>names[t]).join(' / ')}`;}
  private makeWave(w:number):Spawn[]{let types:EnemyType[]=[];const n=8+w*2;
    for(let i=0;i<n;i++){let t:EnemyType='crawler';if(w>=2&&i%4===1)t='runner';if(w>=3&&i%6===3)t='brute';if(w>=6&&i%5===2)t='shield';if(w>=8&&i%9===6)t='healer';if(w>=11&&i%4===0)t='runner';types.push(t);}
    if(w===5||w===10)types.push('boss');if(w===15)types.push('boss','brute','boss');
    return types.map((type,i)=>({type,delay:i===0?.7: type==='boss'?2:Math.max(.38,1.05-w*.032)}));}
  startWave(){if(this.phase!=='build'||this.paused||this.perkChoices.length)return false;if(this.towers.length===0){this.emit('error','先在空地上建造一座防御塔。');return false;}
    this.wave++;this.queue=this.makeWave(this.wave);this.waveTotal=this.queue.length;this.waveRemaining=this.queue.length;this.spawnTimer=this.queue[0].delay;this.phase='wave';this.targeting=false;this.emit('wave',`第 ${this.wave} 波 · ${this.waveName(this.wave)}`);return true;}
  choosePerk(id:string){if(!this.perkChoices.includes(id))return false;this.perks.push(id);this.perkChoices=[];if(id==='fortune')this.gold+=180;if(id==='renewal'){this.hp=Math.min(this.maxHp,this.hp+6);this.abilityCooldown=Math.min(this.abilityCooldown,26);}this.emit('upgrade',`获得祝福：${PERKS[id].name}`);return true;}
  meteor(x:number,y:number){if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||y<0||x>WORLD_W||y>WORLD_H||!this.targeting||this.abilityCooldown>0||this.phase!=='wave'||this.paused||this.perkChoices.length)return false;this.targeting=false;this.abilityCooldown=this.perks.includes('renewal')?26:40;this.effect('meteor',x,y,1.3,{radius:115});
    for(const e of [...this.enemies])if(Math.hypot(e.x-x,e.y-y)<115+e.radius){this.damage(e,(210+this.wave*18)*(this.perks.includes('winter')?1.35:1),'true');e.stun=.7;}
    this.emit('meteor');return true;}
  position(progress:number):Point{let remaining=progress;for(let i=0;i<this.segments.length;i++){const d=this.segments[i];if(remaining<=d){const a=this.map.path[i],b=this.map.path[i+1],f=remaining/d;return[a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f];}remaining-=d;}return this.map.path.at(-1)!;}
  private spawn(type:EnemyType){const data=ENEMIES[type],scale=(1+(this.wave-1)*.17)*[1,1.2,1.45][this.map.id];const bossScale=type==='boss'?(this.wave===5?.4:this.wave===10?.65:1):1;
    const hp=Math.round(data.hp*scale*bossScale);const [x,y]=this.map.path[0];this.enemies.push({id:this.nextId++,type,x,y,hp,maxHp:hp,progress:0,slow:0,radius:data.radius,speed:data.speed*(1+(this.map.id===2?.08:0)),armor:data.armor,reward:data.reward,burn:0,burnDamage:0,stun:0,vulnerable:0,healTimer:2});}
  private damage(e:Enemy,amount:number,kind:'physical'|'magic'|'true',towerId?:number){if(e.hp<=0)return;const dealt=amount*(kind==='physical'?1-e.armor:1)*(e.vulnerable>0?1.25:1);e.hp-=dealt;
    if(e.hp<=0){this.kills++;const reward=Math.round(e.reward*(this.perks.includes('fortune')?1.2:1));this.gold+=reward;this.score+=Math.round(e.maxHp+reward*5);const t=this.towers.find(t=>t.id===towerId);if(t)t.kills++;
      this.effect('death',e.x,e.y,.65,{color:e.type==='boss'?0xe3b76c:0xb490ce});this.effect('gold',e.x,e.y-18,.85,{text:`+${reward}`});if(e.type==='boss')this.emit('death','永夜领主已被击退！');}
  }
  private hit(shot:Shot){const e=this.enemies.find(e=>e.id===shot.target&&e.hp>0);
    if(shot.type==='cannon'){const radius=shot.branch==='b'?100:66;this.effect('explosion',shot.tx,shot.ty,.65,{radius,color:0xef9a55});for(const target of this.enemies){if(target.hp>0&&Math.hypot(target.x-shot.tx,target.y-shot.ty)<radius+target.radius){this.damage(target,shot.damage,'physical',shot.towerId);if(shot.branch==='a'){target.burn=4;target.burnDamage=shot.damage*.2;}}}return;}
    if(!e)return;
    this.damage(e,shot.damage,shot.type==='arrow'&&shot.branch!=='b'?'physical':'magic',shot.towerId);this.effect('hit',e.x,e.y,.25,{color:shot.type==='frost'?0x99e3ea:0xf4d499});
    if(shot.type==='frost'){e.slow=(shot.branch==='a'?4:2.3)*(this.perks.includes('winter')?1.4:1);if(shot.branch==='a')e.stun=e.type==='boss'?.1:.45;if(shot.branch==='b')e.vulnerable=3;this.effect('frost',e.x,e.y,.55,{radius:35});}
  }
  private fire(t:Tower,targets:Enemy[]){const [x,y]=this.map.pads[t.pad],stats=this.stats(t),first=targets[0];t.angle=Math.atan2(first.y-y,first.x-x);t.cooldown=stats.interval;this.emit(t.type);
    if(t.type==='storm'){const hit:Enemy[]=[first];let prev=first;const limit=t.branch==='a'?6:t.branch==='b'?1:3;
      for(let i=1;i<limit;i++){const near=this.enemies.filter(e=>e.hp>0&&!hit.includes(e)&&Math.hypot(e.x-prev.x,e.y-prev.y)<(t.branch==='a'?155:110)).sort((a,b)=>Math.hypot(a.x-prev.x,a.y-prev.y)-Math.hypot(b.x-prev.x,b.y-prev.y))[0];if(!near)break;hit.push(near);prev=near;}
      let from:Point=[x,y-65];hit.forEach((e,i)=>{this.effect('lightning',...from,.28,{tx:e.x,ty:e.y,color:0xc5afff});this.damage(e,stats.damage*Math.pow(.87,i),'magic',t.id);if(t.branch==='b')e.stun=e.type==='boss'?.18:.75;from=[e.x,e.y];});return;}
    for(const e of targets.slice(0,t.type==='arrow'&&t.branch==='a'?3:1)){this.shots.push({id:this.nextId++,x,y:y-60,tx:e.x,ty:e.y,type:t.type,life:2,target:e.id,damage:stats.damage,towerId:t.id,branch:t.branch,level:t.level});}
  }
  update(realDt:number){if(this.paused||this.perkChoices.length)return;const dt=Math.min(.1,Math.max(0,realDt))*this.speed;this.time+=dt;
    this.effects.forEach(e=>e.life-=dt);this.effects=this.effects.filter(e=>e.life>0);
    if(this.phase!=='wave')return;
    this.abilityCooldown=Math.max(0,this.abilityCooldown-dt);
    this.spawnTimer-=dt;while(this.queue.length&&this.spawnTimer<=0){const item=this.queue.shift()!;this.spawn(item.type);this.spawnTimer+=this.queue[0]?.delay||1;}
    for(const e of this.enemies){if(e.hp<=0)continue;e.slow=Math.max(0,e.slow-dt);e.stun=Math.max(0,e.stun-dt);e.vulnerable=Math.max(0,e.vulnerable-dt);
      if(e.burn>0){e.burn-=dt;this.damage(e,e.burnDamage*dt,'true');if(e.hp<=0)continue;}
      if(e.type==='healer'){e.healTimer-=dt;if(e.healTimer<=0){e.healTimer=2.8;for(const ally of this.enemies)if(ally.hp>0&&Math.hypot(e.x-ally.x,e.y-ally.y)<105){ally.hp=Math.min(ally.maxHp,ally.hp+ally.maxHp*.055);this.effect('heal',ally.x,ally.y,.5);}}}
      const slowFactor=e.type==='boss'?.75:this.perks.includes('winter')?.38:.5;e.progress+=e.speed*dt*(e.stun>0?0:e.slow>0?slowFactor:1);[e.x,e.y]=this.position(e.progress);
      if(e.progress>=this.pathLength){e.hp=-1;this.hp=Math.max(0,this.hp-ENEMIES[e.type].leak);this.effect('leak',e.x,e.y,.8);this.emit('leak');}
    }
    for(const t of this.towers){t.cooldown-=dt;if(t.cooldown<=0){const [x,y]=this.map.pads[t.pad],range=this.range(t);const targets=this.enemies.filter(e=>e.hp>0&&Math.hypot(e.x-x,e.y-y)<range+e.radius).sort((a,b)=>b.progress-a.progress);if(targets.length)this.fire(t,targets);}}
    for(const s of this.shots){s.life-=dt;const target=this.enemies.find(e=>e.id===s.target&&e.hp>0);if(target){s.tx=target.x;s.ty=target.y;}const d=Math.hypot(s.tx-s.x,s.ty-s.y),step=(s.type==='cannon'?380:s.type==='frost'?440:720)*dt;if(d<=step||d<5){this.hit(s);s.life=0;}else{s.x+=(s.tx-s.x)/d*step;s.y+=(s.ty-s.y)/d*step;}}
    this.shots=this.shots.filter(s=>s.life>0);this.enemies=this.enemies.filter(e=>e.hp>0);this.waveRemaining=this.queue.length+this.enemies.length;
    if(this.hp<=0){this.phase='defeat';this.targeting=false;this.stars=0;this.emit('defeat');return;}
    if(!this.queue.length&&!this.enemies.length){this.shots=[];if(this.wave>=this.maxWaves){this.phase='victory';this.targeting=false;this.stars=this.hp>=18?3:this.hp>=10?2:1;this.score+=this.hp*250+this.gold*2;this.best[String(this.map.id)]=Math.max(this.best[String(this.map.id)]||0,this.stars);this.emit('victory');}
      else{this.phase='build';const bonus=35+this.wave*4;this.gold+=bonus;this.emit('clear',`第 ${this.wave} 波已守住 · 获得 ${bonus} 金币`);if(this.wave===5||this.wave===10){this.perkChoices=(this.wave===5?['keen','fury','fortune']:['haste','renewal','winter']).filter(x=>!this.perks.includes(x));}}}
  }
}
