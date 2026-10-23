export const WIDTH=900, HEIGHT=1000, PADDLE_Y=910, BUMPER_RADIUS=29;
export interface Point {x:number;y:number}
export type TowerType='fire'|'frost'|'storm'|'prism';
export type Element='neutral'|'fire'|'frost'|'storm';
export type EnemyType='swarm'|'runner'|'brute'|'shield'|'boss';
export const PADS:Point[]=[{x:190,y:250},{x:450,y:210},{x:710,y:250},{x:310,y:390},{x:590,y:390},{x:170,y:530},{x:450,y:530},{x:730,y:530},{x:300,y:680},{x:600,y:680},{x:140,y:760},{x:760,y:760}];
export const TOWERS:Record<TowerType,{name:string;label:string;description:string;cost:number;color:string;damage:number;range:number;threshold:number;passiveInterval:number;synergy:string}>={
  fire:{name:'熔火撞针',label:'燃烧 · 范围爆破',description:'撞击为弹珠附上烈焰。充满能量时引爆周围敌群。',cost:90,color:'#ff8b66',damage:17,range:190,threshold:3,passiveInterval:2.8,synergy:'接冰霜：蒸汽爆破；接雷霆：等离子链。'},
  frost:{name:'霜晶棱柱',label:'减速 · 控场',description:'冰霜弹珠减速敌人。充能脉冲冻结附近的进攻者。',cost:90,color:'#75e4ed',damage:11,range:185,threshold:3,passiveInterval:2.8,synergy:'接烈焰：蒸汽爆破；接雷霆：冰导连锁。'},
  storm:{name:'雷霆线圈',label:'闪电 · 连锁',description:'让弹珠带电，攻击沿敌群传导。满充能释放雷暴。',cost:130,color:'#bea3ff',damage:23,range:200,threshold:3,passiveInterval:3.1,synergy:'接冰霜：连锁冻结；接烈焰：等离子链。'},
  prism:{name:'分光核心',label:'分裂 · 能量中继',description:'撞击复制一颗短暂存在的弹珠，同时为相邻塔补充能量。',cost:150,color:'#f1d57f',damage:14,range:180,threshold:3,passiveInterval:3,synergy:'继承弹珠元素，分裂出真实参与碰撞的弹珠。'}
};
export const PERKS:Record<string,{name:string;description:string;icon:string}>={
  wide:{name:'加长挡板',description:'挡板宽度增加 36，边缘反弹更易掌握。',icon:'paddle'},
  heavy:{name:'重铸钢珠',description:'弹珠体积增大，直接撞击伤害 +30%。',icon:'ball'},
  echo:{name:'共振回路',description:'相连塔获得的传导能量翻倍，更容易连续充能。',icon:'link'},
  fury:{name:'高压电源',description:'所有防御塔的普通攻击与充能脉冲伤害 +25%。',icon:'bolt'},
  catalyst:{name:'元素催化',description:'蒸汽、冰导、等离子联动伤害 +45%。',icon:'fire'},
  recovery:{name:'紧急维修',description:'恢复 6 点核心生命，并立即充满超载。',icon:'heart'},
  prism:{name:'长寿光谱',description:'分裂弹珠持续时间从 10 秒延长至 18 秒，保留更多伤害。',icon:'prism'},
  bounty:{name:'赏金协议',description:'立即获得 180 金币，后续击杀金币 +25%。',icon:'coin'},
  cold:{name:'低温领域',description:'敌人行进速度降低 12%，弹珠元素保留更久。',icon:'snow'}
};
export interface Tower {id:number;pad:number;type:TowerType;level:number;charge:number;maxCharge:number;flash:number;hits:number;kills:number;cooldown:number;}
export interface Ball {id:number;x:number;y:number;vx:number;vy:number;radius:number;element:Element;power:number;trail:Point[];lastPad:number|null;elementTime:number;life:number;splitCooldown:number;contacts:Map<number,number>;}
export interface Enemy {id:number;type:EnemyType;x:number;y:number;hp:number;maxHp:number;radius:number;slow:number;burn:number;armor:number;speed:number;freeze:number;reward:number;leak:number;wobble:number;}
export interface Effect {id:number;type:string;x:number;y:number;life:number;maxLife:number;color?:number;text?:string;tx?:number;ty?:number;radius?:number;}
export interface Shot {x:number;y:number;tx:number;ty:number;life:number;maxLife:number;color:number;}
export interface Link {a:number;b:number;type:'steam'|'conduct'|'plasma'|'spectrum'|'resonance'}
export interface GameEvent {type:string;text?:string;combo?:number}
const COLORS={neutral:0xf5ebc9,fire:0xff8860,frost:0x75e4ed,storm:0xbea3ff};
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
const ENEMIES:Record<EnemyType,{hp:number;speed:number;radius:number;armor:number;reward:number;leak:number}>={
  swarm:{hp:70,speed:24,radius:14,armor:0,reward:12,leak:1},
  runner:{hp:57,speed:43,radius:12,armor:0,reward:13,leak:1},
  brute:{hp:205,speed:18,radius:22,armor:.24,reward:26,leak:2},
  shield:{hp:135,speed:23,radius:18,armor:.58,reward:21,leak:2},
  boss:{hp:750,speed:15,radius:38,armor:.2,reward:120,leak:5}
};

/** Fixed-step gameplay, independent of Phaser. Distances are logical board pixels. */
export class PinballModel {
  phase:'build'|'wave'|'victory'|'defeat'='build';
  wave=0;maxWaves=12;hp=20;maxHp=20;gold=220;kills=0;score=0;bestScore=0;
  combo=0;bestCombo=0;comboTimer=0;time=0;runTime=0;paused=false;
  selectedPad:number|null=null;buildType:TowerType|null=null;
  paddleX=450;paddleTarget=450;paddleWidth=160;paddleVelocity=0;aimAngle=-1.619;
  ballReady=false;reserveBalls=0;overdrive=0;overdriveActive=0;
  shake=0;hitStop=0;perkChoices:string[]=[];perks:string[]=[];
  towers:Tower[]=[];balls:Ball[]=[];enemies:Enemy[]=[];effects:Effect[]=[];shots:Shot[]=[];links:Link[]=[];events:GameEvent[]=[];
  waveRemaining=0;waveTotal=0;drains=0;fusionCount=0;bumperHits=0;
  private queue:{type:EnemyType;lane:number}[]=[];private spawnTimer=0;private nextId=1;private accumulator=0;private rngState:number;
  private launchSerial=0;private fusionCooldown=0;private trailClock=0;
  constructor(bestScore=0,seed=Date.now()) {this.bestScore=bestScore;this.rngState=seed>>>0||1;this.addTower(0,'fire',false);this.addTower(1,'frost',false);this.rebuildLinks();}
  private random(){this.rngState=(Math.imul(this.rngState,1664525)+1013904223)>>>0;return this.rngState/4294967296;}
  restart(){const best=Math.max(this.bestScore,this.score);Object.assign(this,new PinballModel(best));}
  emit(type:string,text?:string){this.events.push({type,text,combo:this.combo});}
  effect(type:string,x:number,y:number,life=.5,extra:Partial<Effect>={}){this.effects.push({id:this.nextId++,type,x,y,life,maxLife:life,...extra});}
  selectedTower(){return this.towers.find(t=>t.pad===this.selectedPad);}
  stats(t:Tower){const data=TOWERS[t.type];return{damage:data.damage*(1+(t.level-1)*.85)*(this.perks.includes('fury')?1.25:1),range:data.range+(t.level-1)*12,threshold:3};}
  towerRange(t:Tower){return this.stats(t).range;}
  upgradeCost(t:Tower){return Math.round(TOWERS[t.type].cost*(t.level===1?1.15:1.65));}
  sellValue(t:Tower){const d=TOWERS[t.type].cost;return Math.floor((d+(t.level>=2?Math.round(d*1.15):0)+(t.level>=3?Math.round(d*1.65):0))*.65);}
  private addTower(pad:number,type:TowerType,paid=true){const t:Tower={id:this.nextId++,pad,type,level:1,charge:0,maxCharge:3,flash:0,hits:0,kills:0,cooldown:.8};this.towers.push(t);if(paid)this.gold-=TOWERS[type].cost;return t;}
  build(pad:number,type:TowerType){if(this.paused||this.perkChoices.length||!['build','wave'].includes(this.phase)||!PADS[pad]||!TOWERS[type]||this.towers.some(t=>t.pad===pad))return false;
    if(this.gold<TOWERS[type].cost){this.emit('error','能量币不足，击退敌人或拆除塔可获得能量币。');return false;}
    this.addTower(pad,type);this.rebuildLinks();this.selectedPad=pad;this.buildType=null;this.effect('build',PADS[pad].x,PADS[pad].y,.7);this.emit('build');return true;}
  upgrade(){const t=this.selectedTower();if(!t||t.level>=3||this.paused||this.perkChoices.length||!['build','wave'].includes(this.phase))return false;
    const cost=this.upgradeCost(t);if(this.gold<cost){this.emit('error','能量币不足，暂时无法升级。');return false;}this.gold-=cost;t.level++;t.flash=.6;this.effect('build',PADS[t.pad].x,PADS[t.pad].y,.7);this.emit('upgrade');return true;}
  sell(){const t=this.selectedTower();if(!t||this.paused||this.perkChoices.length||!['build','wave'].includes(this.phase))return false;this.gold+=this.sellValue(t);this.towers=this.towers.filter(x=>x!==t);this.rebuildLinks();this.selectedPad=null;this.emit('build');return true;}
  private linkType(a:TowerType,b:TowerType):Link['type']{if(a==='prism'||b==='prism')return'spectrum';if(a===b)return'resonance';if([a,b].includes('fire')&&[a,b].includes('frost'))return'steam';if([a,b].includes('frost')&&[a,b].includes('storm'))return'conduct';return'plasma';}
  private rebuildLinks(){this.links=[];for(let i=0;i<this.towers.length;i++)for(let j=i+1;j<this.towers.length;j++){const a=this.towers[i],b=this.towers[j];if(distance(PADS[a.pad],PADS[b.pad])<=335)this.links.push({a:a.pad,b:b.pad,type:this.linkType(a.type,b.type)});}}
  private neighbors(t:Tower){return this.links.filter(l=>l.a===t.pad||l.b===t.pad).map(l=>this.towers.find(o=>o.pad===(l.a===t.pad?l.b:l.a))!).filter(Boolean);}
  movePaddle(x:number){if(Number.isFinite(x))this.paddleTarget=clamp(x,45+this.paddleWidth/2,855-this.paddleWidth/2);}
  setAim(delta:number){if(!Number.isFinite(delta))return;this.aimAngle=clamp(this.aimAngle+delta*.04,-Math.PI+.48,-.48);}
  private makeBall(x:number,y:number,vx:number,vy:number):Ball{return{id:this.nextId++,x,y,vx,vy,radius:this.perks.includes('heavy')?10:8,element:'neutral',power:1,trail:[],lastPad:null,elementTime:0,life:Infinity,splitCooldown:0,contacts:new Map()};}
  launch(){if(this.phase==='build'){if(!this.startWave())return false;}if(this.phase!=='wave'||this.paused||this.perkChoices.length||!this.ballReady)return false;
    const speed=620;this.balls.push(this.makeBall(this.paddleX,PADDLE_Y-23,Math.cos(this.aimAngle)*speed,Math.sin(this.aimAngle)*speed));this.ballReady=false;this.launchSerial++;this.effect('launch',this.paddleX,PADDLE_Y-22,.4);this.emit('launch');return true;}
  nextWavePreview(){const n=Math.min(this.wave+1,12);return n%4===0?`第 ${n} 波 · 磁暴领主带领精锐来袭`:`第 ${n} 波 · ${7+n} 名敌人${n>=5?'，注意护盾重装':n>=2?'，疾行者已出现':'，熟悉反弹与充能'}`;}
  startWave(){if(this.phase!=='build'||this.paused||this.perkChoices.length)return false;this.wave++;this.phase='wave';this.ballReady=true;this.balls=[];this.queue=[];
    for(let i=0;i<7+this.wave;i++){let type:EnemyType='swarm';if(this.wave>=2&&i%4===1)type='runner';if(this.wave>=3&&i%5===3)type='brute';if(this.wave>=5&&i%5===2)type='shield';this.queue.push({type,lane:(i*2+this.wave)%3});}
    if(this.wave%4===0)this.queue.splice(Math.floor(this.queue.length/2),0,{type:'boss',lane:1});
    this.waveTotal=this.queue.length;this.waveRemaining=this.waveTotal;this.spawnTimer=.5;this.emit('wave',this.wave%4===0?'警报 · 磁暴领主正在进入战场':`第 ${this.wave} 波 · 弹射迎敌`);return true;}
  activateOverdrive(){if(this.phase!=='wave'||this.paused||this.perkChoices.length||this.overdrive<100)return false;this.overdrive=0;this.overdriveActive=8;for(const t of this.towers)t.charge=Math.min(t.maxCharge,t.charge+1.5);this.shake=6;this.effect('burst',450,510,1.2,{color:0xf4d384,radius:400,text:'超载启动'});this.emit('overdrive','超载 8 秒 · 加宽挡板 / 强化撞击 / 加速充能');return true;}
  choosePerk(id:string){if(!this.perkChoices.includes(id))return false;this.perks.push(id);this.perkChoices=[];if(id==='bounty')this.gold+=180;if(id==='recovery'){this.hp=Math.min(this.maxHp,this.hp+6);this.overdrive=100;}this.paddleWidth=160+(this.perks.includes('wide')?36:0);this.emit('upgrade',`获得改造：${PERKS[id].name}`);return true;}
  private spawn(type:EnemyType,lane:number){const d=ENEMIES[type],scale=1+(this.wave-1)*.2;const hp=Math.round(d.hp*scale);this.enemies.push({id:this.nextId++,type,x:[200,450,700][lane],y:68,hp,maxHp:hp,radius:d.radius,slow:0,burn:0,armor:d.armor,speed:d.speed,freeze:0,reward:d.reward,leak:d.leak,wobble:this.random()*6});}
  private hitCombo(){this.combo=this.comboTimer>0?this.combo+1:1;this.comboTimer=4.5;this.bestCombo=Math.max(this.bestCombo,this.combo);if(this.combo%10===0)this.effect('combo',450,450,1,{text:`${this.combo} 连击`,color:0xf4d384});}
  private damage(e:Enemy,amount:number,magic=false,towerId?:number){if(e.hp<=0)return;e.hp-=amount*(magic?1:1-e.armor);if(e.hp<=0){this.kills++;const bounty=Math.round(e.reward*(this.perks.includes('bounty')?1.25:1));this.gold+=bounty;this.overdrive=Math.min(100,this.overdrive+4);this.score+=Math.round((e.maxHp+bounty*8)*(1+Math.min(this.combo,40)*.025));const tower=this.towers.find(t=>t.id===towerId);if(tower)tower.kills++;this.effect('death',e.x,e.y,.65,{color:e.type==='boss'?0xffcb81:0xff8b8f,radius:e.radius});this.effect('gold',e.x,e.y,.65,{text:`+${bounty}`,color:0xf2d188});this.emit('kill');}}
  private chain(origin:Point,damage:number,limit:number,freeze=0,towerId?:number){let from=origin;const hit=new Set<number>();for(let i=0;i<limit;i++){const target=this.enemies.filter(e=>e.hp>0&&!hit.has(e.id)&&distance(e,from)<230).sort((a,b)=>distance(a,from)-distance(b,from))[0];if(!target)break;this.effect('lightning',from.x,from.y,.3,{tx:target.x,ty:target.y,color:freeze?0x8ce8ee:0xc6a5ff});this.damage(target,damage*Math.pow(.88,i),true,towerId);if(freeze){target.freeze=Math.max(target.freeze,target.type==='boss'?freeze*.35:freeze);target.slow=3;}hit.add(target.id);from=target;}}
  private pulse(t:Tower){const p=PADS[t.pad],stats=this.stats(t),damage=stats.damage*4.8;t.flash=.5;this.effect('burst',p.x,p.y,.6,{radius:stats.range,color:Number(TOWERS[t.type].color.replace('#','0x'))});
    if(t.type==='storm')this.chain(p,damage,6,0,t.id);else for(const e of this.enemies){if(e.hp>0&&distance(p,e)<stats.range+e.radius){this.damage(e,damage,t.type!=='fire',t.id);if(t.type==='frost'){e.freeze=e.type==='boss'?.35:1.15;e.slow=3;}if(t.type==='fire')e.burn=3;}}
    for(const other of this.neighbors(t))other.charge=Math.min(other.maxCharge,other.charge+(this.perks.includes('echo')?.65:.35));this.emit(t.type==='fire'?'plasma':t.type==='frost'?'conduct':t.type==='storm'?'storm':'spectrum');}
  private fusion(ball:Ball,t:Tower,previous:Tower){const type=this.linkType(previous.type,t.type),p=PADS[t.pad],damage=(75+this.wave*6)*(this.perks.includes('catalyst')?1.45:1);if(type==='resonance'){ball.power=Math.min(2.2,ball.power+.15);return;}if(type==='spectrum')return;
    this.fusionCount++;this.shake=Math.max(this.shake,4);this.hitStop=.023;const names={steam:'蒸汽爆破',conduct:'冰导连锁',plasma:'等离子链'};
    this.effect('fusion',p.x,p.y,1,{text:names[type],color:type==='steam'?0xf2d5c2:type==='conduct'?0x80eced:0xec9dff,radius:165});
    if(type==='steam'){for(const e of this.enemies)if(distance(e,p)<190+e.radius){this.damage(e,damage*1.25,true,t.id);e.slow=2.5;e.burn=2;}}
    else if(type==='conduct')this.chain(p,damage*.8,6,1.5,t.id);else this.chain(p,damage*1.2,5,0,t.id);
    this.emit(type);this.overdrive=Math.min(100,this.overdrive+6);}
  private bump(ball:Ball,t:Tower){this.hitCombo();this.bumperHits++;this.overdrive=Math.min(100,this.overdrive+1.8);t.hits++;t.charge=Math.min(t.maxCharge,t.charge+(this.overdriveActive>0?1.8:1));t.flash=.25;
    const previous=this.towers.find(x=>x.pad===ball.lastPad);const linked=previous&&this.links.some(l=>(l.a===previous.pad&&l.b===t.pad)||(l.b===previous.pad&&l.a===t.pad));
    if(previous&&previous!==t&&ball.elementTime>0&&linked&&this.fusionCooldown<=0){this.fusion(ball,t,previous);this.fusionCooldown=.35;}
    if(t.type!=='prism'){ball.element=t.type;ball.elementTime=this.perks.includes('cold')?12:8;}ball.lastPad=t.pad;
    for(const other of this.neighbors(t))other.charge=Math.min(other.maxCharge,other.charge+(this.perks.includes('echo')?.36:.18));
    if(t.type==='prism'&&ball.splitCooldown<=0&&this.balls.length<5){const a=Math.atan2(ball.vy,ball.vx)+((t.hits%2===0)?-.47:.47),speed=Math.hypot(ball.vx,ball.vy);const child=this.makeBall(ball.x,ball.y,Math.cos(a)*speed,Math.sin(a)*speed);child.element=ball.element;child.elementTime=ball.elementTime;child.lastPad=t.pad;child.life=this.perks.includes('prism')?18:10;child.power=ball.power*(this.perks.includes('prism')?1:.8);child.splitCooldown=1;child.contacts.set(t.id,this.time+.2);this.balls.push(child);ball.splitCooldown=1;this.effect('spectrum',ball.x,ball.y,.6,{text:'光谱分裂',color:0xf1d57f});this.emit('spectrum');}
    this.effect('bumper',PADS[t.pad].x,PADS[t.pad].y,.35,{color:Number(TOWERS[t.type].color.replace('#','0x')),radius:42});this.emit('bumper');this.shake=Math.max(this.shake,1.8);}
  private reflectCircle(ball:Ball,center:Point,radius:number){let dx=ball.x-center.x,dy=ball.y-center.y,d=Math.hypot(dx,dy);if(d>=ball.radius+radius)return false;if(d<.001){dx=0;dy=-1;d=1;}const nx=dx/d,ny=dy/d;ball.x=center.x+nx*(ball.radius+radius+.3);ball.y=center.y+ny*(ball.radius+radius+.3);const dot=ball.vx*nx+ball.vy*ny;if(dot<0){ball.vx-=2*dot*nx;ball.vy-=2*dot*ny;}return true;}
  /** A small prediction using the same wall/bumper normals as the real serve. */
  previewTrajectory():Point[]{if(!this.ballReady&&this.phase!=='build')return[];const b=this.makeBall(this.paddleX,PADDLE_Y-23,Math.cos(this.aimAngle)*620,Math.sin(this.aimAngle)*620);this.nextId--;const points:Point[]=[];for(let i=0;i<85;i++){b.x+=b.vx*.018;b.y+=b.vy*.018;if(b.x<53){b.x=53;b.vx=Math.abs(b.vx);}if(b.x>847){b.x=847;b.vx=-Math.abs(b.vx);}if(b.y<63){b.y=63;b.vy=Math.abs(b.vy);}for(const t of this.towers)this.reflectCircle(b,PADS[t.pad],BUMPER_RADIUS);if(i%3===0)points.push({x:b.x,y:b.y});if(b.y>PADDLE_Y)break;}return points;}
  update(realDt:number){if(!Number.isFinite(realDt)||realDt<0||this.paused||this.perkChoices.length)return;const dt=Math.min(realDt,.1);this.accumulator+=dt;const step=1/180;while(this.accumulator>=step){this.step(step);this.accumulator-=step;}}
  private step(dt:number){this.time+=dt;this.shake=Math.max(0,this.shake-dt*20);this.effects.forEach(e=>e.life-=dt);this.effects=this.effects.filter(e=>e.life>0);this.shots.forEach(s=>s.life-=dt);this.shots=this.shots.filter(s=>s.life>0);this.towers.forEach(t=>t.flash=Math.max(0,t.flash-dt));
    const targetWidth=160+(this.perks.includes('wide')?36:0)+(this.overdriveActive>0?48:0);this.paddleWidth+=(targetWidth-this.paddleWidth)*Math.min(1,dt*15);
    const oldX=this.paddleX;this.paddleX+=clamp(this.paddleTarget-this.paddleX,-1600*dt,1600*dt);this.paddleX=clamp(this.paddleX,45+this.paddleWidth/2,855-this.paddleWidth/2);this.paddleVelocity=(this.paddleX-oldX)/dt;
    if(this.phase!=='wave')return;if(this.hitStop>0){this.hitStop-=dt;return;}this.runTime+=dt;this.comboTimer=Math.max(0,this.comboTimer-dt);if(this.comboTimer<=0)this.combo=0;this.overdriveActive=Math.max(0,this.overdriveActive-dt);this.fusionCooldown=Math.max(0,this.fusionCooldown-dt);
    this.spawnTimer-=dt;while(this.queue.length&&this.spawnTimer<=0){const item=this.queue.shift()!;this.spawn(item.type,item.lane);this.spawnTimer+=Math.max(.7,1.32-this.wave*.03);}
    for(const enemy of this.enemies){if(enemy.hp<=0)continue;enemy.slow=Math.max(0,enemy.slow-dt);enemy.freeze=Math.max(0,enemy.freeze-dt);if(enemy.burn>0){enemy.burn-=dt;this.damage(enemy,(12+this.wave*2)*dt,true);if(enemy.hp<=0)continue;}enemy.y+=enemy.speed*dt*(enemy.freeze>0?0:enemy.slow>0?.48:1)*(this.perks.includes('cold')?.88:1);
      if(enemy.y>850){enemy.hp=0;this.hp=Math.max(0,this.hp-enemy.leak);this.effect('drain',enemy.x,850,.7,{text:`核心 -${enemy.leak}`,color:0xff7e83});this.emit('drain');this.shake=6;}}
    for(const t of this.towers){if(t.charge>=t.maxCharge-.0001){t.charge=0;this.pulse(t);}t.cooldown-=dt;if(t.cooldown<=0){const p=PADS[t.pad],stats=this.stats(t),target=this.enemies.filter(e=>e.hp>0&&distance(e,p)<stats.range+e.radius).sort((a,b)=>b.y-a.y)[0];if(target){this.damage(target,stats.damage,t.type==='storm'||t.type==='frost',t.id);if(t.type==='frost')target.slow=1.8;if(t.type==='fire')target.burn=Math.max(target.burn,1.1);this.shots.push({x:p.x,y:p.y,tx:target.x,ty:target.y,life:.16,maxLife:.16,color:Number(TOWERS[t.type].color.replace('#','0x'))});t.cooldown=TOWERS[t.type].passiveInterval/(1+(t.level-1)*.12);}}}
    this.trailClock+=dt;const addTrail=this.trailClock>=1/60;if(addTrail)this.trailClock=0;
    const originalBalls=[...this.balls];for(const b of originalBalls){if(b.life<=0)continue;if(Number.isFinite(b.life))b.life-=dt;b.elementTime-=dt;if(b.elementTime<=0){b.element='neutral';b.lastPad=null;}b.splitCooldown=Math.max(0,b.splitCooldown-dt);const previousY=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;
      const minX=45+b.radius,maxX=855-b.radius,minY=55+b.radius;if(b.x<minX){b.x=minX;b.vx=Math.abs(b.vx);this.effect('wall',b.x,b.y,.18);this.emit('wall');}if(b.x>maxX){b.x=maxX;b.vx=-Math.abs(b.vx);this.effect('wall',b.x,b.y,.18);this.emit('wall');}if(b.y<minY){b.y=minY;b.vy=Math.abs(b.vy);this.effect('wall',b.x,b.y,.18);this.emit('wall');}
      const paddleTop=PADDLE_Y-10-b.radius;if(b.vy>0&&previousY<=paddleTop&&b.y>=paddleTop&&Math.abs(b.x-this.paddleX)<this.paddleWidth/2+b.radius){const contact=clamp((b.x-this.paddleX)/(this.paddleWidth/2),-1,1),speed=clamp(Math.hypot(b.vx,b.vy)+14,620,850),angle=contact*1.08;let vx=Math.sin(angle)*speed+clamp(this.paddleVelocity,-1000,1000)*.16;vx=clamp(vx,-speed*.92,speed*.92);b.vx=vx;b.vy=-Math.sqrt(speed*speed-vx*vx);b.y=paddleTop-.5;this.effect('paddle',b.x,PADDLE_Y,.28,{color:COLORS[b.element]});this.emit('paddle');this.comboTimer=Math.max(this.comboTimer,2.8);this.overdrive=Math.min(100,this.overdrive+.8);}
      for(const t of this.towers){if(this.reflectCircle(b,PADS[t.pad],BUMPER_RADIUS)){if((b.contacts.get(t.id)||0)<=this.time){b.contacts.set(t.id,this.time+.14);this.bump(b,t);}const s=Math.hypot(b.vx,b.vy),target=clamp(s*1.025,620,850);b.vx=b.vx/s*target;b.vy=b.vy/s*target;}}
      for(const e of this.enemies){if(e.hp<=0)continue;if(this.reflectCircle(b,e,e.radius)&&(b.contacts.get(e.id)||0)<=this.time){b.contacts.set(e.id,this.time+.12);this.hitCombo();const dmg=(31+Math.min(this.combo,30)*1.4)*b.power*(this.perks.includes('heavy')?1.3:1)*(this.overdriveActive>0?1.65:1);this.damage(e,dmg,b.element!=='neutral');if(b.element==='fire')e.burn=3;if(b.element==='frost')e.slow=3;if(b.element==='storm')this.chain(e,dmg*.5,2);this.effect('hit',e.x,e.y,.25,{color:COLORS[b.element],radius:e.radius});this.emit('hit');this.shake=Math.max(this.shake,2);}}
      // Preserve the arcade rhythm: no near-horizontal orbits and no frame-sized jumps.
      let speed=Math.hypot(b.vx,b.vy);if(speed<1){b.vx=120;b.vy=-610;speed=Math.hypot(b.vx,b.vy);}if(Math.abs(b.vy)<135){b.vy=(b.vy>=0?1:-1)*135;const sign=b.vx>=0?1:-1;b.vx=sign*Math.sqrt(Math.max(0,speed*speed-135*135));}if(speed>900){b.vx*=900/speed;b.vy*=900/speed;}
      if(addTrail){b.trail.unshift({x:b.x,y:b.y});if(b.trail.length>16)b.trail.pop();}if(b.y>HEIGHT+25)b.life=0;
    }
    const hadBalls=this.balls.length>0;this.balls=this.balls.filter(b=>b.life>0&&b.y<=HEIGHT+25);
    if(hadBalls&&!this.balls.length){this.hp=Math.max(0,this.hp-1);this.drains++;this.ballReady=true;this.combo=0;this.comboTimer=0;this.effect('drain',this.paddleX,955,.8,{text:'弹珠落空 · 核心 -1',color:0xff7e83});this.emit('drain','按空格或点击战场重新发射 · 落空仅扣 1 点生命');this.shake=5;}
    this.enemies=this.enemies.filter(e=>e.hp>0);this.waveRemaining=this.queue.length+this.enemies.length;
    if(this.hp<=0){this.phase='defeat';this.balls=[];this.ballReady=false;this.bestScore=Math.max(this.bestScore,this.score);this.emit('lose');return;}
    if(!this.queue.length&&!this.enemies.length){this.balls=[];this.ballReady=false;this.combo=0;this.comboTimer=0;this.gold+=45+this.wave*6;this.score+=500+this.hp*15;if(this.wave>=this.maxWaves){this.phase='victory';this.score+=this.hp*300+this.gold;this.bestScore=Math.max(this.bestScore,this.score);this.emit('win');}else{this.phase='build';this.emit('clear',`第 ${this.wave} 波守住了 · 获得 ${45+this.wave*6} 能量币`);if(this.wave%3===0){const available=Object.keys(PERKS).filter(id=>!this.perks.includes(id));for(let i=available.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[available[i],available[j]]=[available[j],available[i]];}this.perkChoices=available.slice(0,3);}}}
  }
}
