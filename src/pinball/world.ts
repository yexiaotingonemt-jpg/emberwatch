import Phaser from 'phaser';
import { PinballModel, PADS } from './model';
import { WIDTH, PALETTE, makeBoard, makeBumper, makeEnemy, makeBall } from './art';

type Point = { x: number; y: number };
export interface PinballWorldOptions {
  model: PinballModel;
  onTick: (dt: number) => void;
  onPointer: (x: number, y: number) => void;
  onClick: (x: number, y: number) => void;
  onRelease?: () => void;
}
const TAU = Math.PI * 2;
const COLOR:Record<string,number> = { ...PALETTE, steam:0xaff4ff,conduct:0xafb8ff,plasma:0xff9cdd,spectrum:0xffde8d,resonance:0x76f4da };
const clamp = (n:number,lo:number,hi:number)=>Math.min(hi,Math.max(lo,n));

/** The simulation is authoritative. This scene only paints and routes input. */
export class PinballWorld extends Phaser.Scene {
  private opts: PinballWorldOptions;
  private floor!: Phaser.GameObjects.Graphics;
  private linksLayer!: Phaser.GameObjects.Graphics;
  private machine!: Phaser.GameObjects.Graphics;
  private glows!: Phaser.GameObjects.Graphics;
  private sparks!: Phaser.GameObjects.Graphics;
  private hud!: Phaser.GameObjects.Graphics;
  private towerSprites = new Map<string,Phaser.GameObjects.Image>();
  private enemySprites = new Map<string,Phaser.GameObjects.Image>();
  private ballSprites = new Map<string,Phaser.GameObjects.Image>();
  private labels = new Map<string,Phaser.GameObjects.Text>();
  private ghost?: Phaser.GameObjects.Image;
  private hoverPad: number|null = null;
  private pointer:Point = {x:-100,y:-100};
  private reducedMotion = false;
  private drawTime = 0;

  constructor(opts:PinballWorldOptions){ super({key:'pinball'});this.opts=opts; }

  create(){
    this.cameras.main.setBackgroundColor('#071321');
    this.reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(!this.textures.exists('pb-board'))this.textures.addCanvas('pb-board',makeBoard());
    for(const type of ['fire','frost','storm','prism'])if(!this.textures.exists('pb-tower-'+type))this.textures.addCanvas('pb-tower-'+type,makeBumper(type));
    for(const type of ['swarm','runner','brute','shield','boss'])if(!this.textures.exists('pb-enemy-'+type))this.textures.addCanvas('pb-enemy-'+type,makeEnemy(type));
    if(!this.textures.exists('pb-ball'))this.textures.addCanvas('pb-ball',makeBall());
    this.add.image(0,0,'pb-board').setOrigin(0).setDepth(0);
    this.floor=this.add.graphics().setDepth(1);
    this.linksLayer=this.add.graphics().setDepth(2);
    this.machine=this.add.graphics().setDepth(19);
    this.glows=this.add.graphics().setDepth(25).setBlendMode(Phaser.BlendModes.ADD);
    this.sparks=this.add.graphics().setDepth(40).setBlendMode(Phaser.BlendModes.ADD);
    this.hud=this.add.graphics().setDepth(45);
    this.input.mouse?.disableContextMenu();
    this.input.on('pointermove',(p:Phaser.Input.Pointer)=>this.movePointer(p));
    this.input.on('pointerdown',(p:Phaser.Input.Pointer)=>{
      this.movePointer(p);
      if(p.rightButtonDown())this.opts.onClick(-1,-1);
      else if(p.leftButtonDown()||p.wasTouch)this.opts.onClick(p.worldX,p.worldY);
    });
    this.input.on('pointerup',()=>this.opts.onRelease?.());
    this.input.on('gameout',()=>{
      this.hoverPad=null;this.pointer={x:-100,y:-100};
      this.opts.onRelease?.();this.game.canvas.style.cursor='default';
    });
    this.game.canvas.style.touchAction='none';
    this.events.once('shutdown',()=>{
      this.towerSprites.clear();this.enemySprites.clear();this.ballSprites.clear();this.labels.clear();
    });
  }

  private movePointer(p:Phaser.Input.Pointer){
    this.pointer={x:p.worldX,y:p.worldY};
    this.hoverPad=this.padAt(p.worldX,p.worldY);
    this.opts.onPointer(p.worldX,p.worldY);
    this.game.canvas.style.cursor=this.hoverPad!==null?'pointer':this.opts.model.ballReady?'crosshair':'default';
  }
  private padAt(x:number,y:number):number|null{
    let closest:number|null=null,d=39;
    PADS.forEach((p,i)=>{const dd=Math.hypot(x-p.x,y-p.y);if(dd<d){d=dd;closest=i;}});
    return closest;
  }

  update(_time:number,delta:number){
    if(!this.floor)return;
    this.drawTime+=Math.min(delta/1000,.05);
    this.opts.onTick(Math.min(delta/1000,.05));
    const m=this.opts.model;
    this.floor.clear();this.linksLayer.clear();this.machine.clear();this.glows.clear();this.sparks.clear();this.hud.clear();
    const shake=this.reducedMotion||m.paused?0:clamp(m.shake,0,7)*.45;
    this.cameras.main.setScroll(Math.sin(this.drawTime*91)*shake,Math.cos(this.drawTime*103)*shake*.7);
    this.drawPads();this.drawLinks();this.drawTowers();this.drawEnemies();this.drawPaddle();
    this.drawBalls();this.drawShots();this.drawEffects();this.drawPreview();this.drawAtmosphere();
  }

  private drawPads(){
    const m=this.opts.model,g=this.floor;
    for(let i=0;i<PADS.length;i++){
      const p=PADS[i],occupied=m.towers.some(t=>t.pad===i),selected=m.selectedPad===i,hover=this.hoverPad===i;
      if(occupied)continue;
      const active=selected||hover;
      g.fillStyle(active?0x142f3c:0x0b1722,active?.92:.8).fillCircle(p.x,p.y,30);
      g.lineStyle(active?1.5:1,active?PALETTE.teal:0x6a8b94,active?.72:.32).strokeCircle(p.x,p.y,29);
      g.lineStyle(1,0x5e8790,.15).strokeCircle(p.x,p.y,24);
      g.lineStyle(1,active?PALETTE.teal:0x6a8b94,active?.7:.35);
      g.lineBetween(p.x-6,p.y,p.x+6,p.y);g.lineBetween(p.x,p.y-6,p.x,p.y+6);
      for(let k=0;k<4;k++){
        const a=k*Math.PI/2;
        g.lineBetween(p.x+Math.cos(a)*34,p.y+Math.sin(a)*34,p.x+Math.cos(a)*38,p.y+Math.sin(a)*38);
      }
    }
    const hover=this.hoverPad;
    const canGhost=hover!==null&&!!m.buildType&&!m.towers.some(t=>t.pad===hover)&&m.phase!=='defeat'&&m.phase!=='victory';
    if(canGhost){
      const p=PADS[hover!],color=COLOR[m.buildType!]||PALETTE.teal;
      if(!this.ghost)this.ghost=this.add.image(p.x,p.y,'pb-tower-'+m.buildType).setDepth(9);
      this.ghost.setTexture('pb-tower-'+m.buildType).setPosition(p.x,p.y).setAlpha(.52).setVisible(true);
      this.glows.lineStyle(2,color,.65).strokeCircle(p.x,p.y,35+Math.sin(this.drawTime*4)*1.5);
    }else this.ghost?.setVisible(false);
    if(m.selectedPad!==null){
      const tower=m.towers.find(t=>t.pad===m.selectedPad),p=PADS[m.selectedPad];
      if(tower&&p){
        const range=m.stats(tower).range,color=COLOR[tower.type];
        g.fillStyle(color,.025).fillCircle(p.x,p.y,range);
        g.lineStyle(1,color,.19).strokeCircle(p.x,p.y,range);
        this.hud.lineStyle(2,color,.9).strokeCircle(p.x,p.y,39);
        for(let j=0;j<4;j++){
          const a=this.drawTime*.3+j*TAU/4;
          this.hud.lineStyle(3,color,.8).beginPath().arc(p.x,p.y,39,a,a+.22).strokePath();
        }
      }
    }
  }

  private drawLinks(){
    const m=this.opts.model,g=this.linksLayer;
    for(const link of m.links){
      const a=PADS[link.a],b=PADS[link.b];if(!a||!b)continue;
      const color=COLOR[link.type]||PALETTE.teal,dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);
      const ux=dx/len,uy=dy/len,sx=a.x+ux*37,sy=a.y+uy*37,ex=b.x-ux*37,ey=b.y-uy*37;
      g.lineStyle(7,color,.018).lineBetween(sx,sy,ex,ey);
      g.lineStyle(1,color,.16).lineBetween(sx,sy,ex,ey);
      const f=(this.drawTime*.26+(link.a*.17))%1;
      const px=Phaser.Math.Linear(sx,ex,f),py=Phaser.Math.Linear(sy,ey,f);
      g.lineStyle(2,color,.52).lineBetween(px-ux*7,py-uy*7,px+ux*7,py+uy*7);
      g.fillStyle(color,.8).fillCircle(px,py,1.6);
      // Small diamond junction signals the elemental synergy.
      const mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
      g.lineStyle(1,color,.32).beginPath().moveTo(mx,my-4).lineTo(mx+4,my).lineTo(mx,my+4).lineTo(mx-4,my).closePath().strokePath();
    }
  }

  private drawTowers(){
    const m=this.opts.model,live=new Set<string>();
    for(const tower of m.towers){
      const key=String(tower.id),p=PADS[tower.pad];if(!p)continue;live.add(key);
      let s=this.towerSprites.get(key);
      if(!s){s=this.add.image(p.x,p.y,'pb-tower-'+tower.type).setDepth(10);this.towerSprites.set(key,s);}
      const flash=clamp(tower.flash*4,0,1);
      s.setPosition(p.x,p.y).setScale(1+flash*.07);
      const color=COLOR[tower.type],charge=clamp(tower.charge/Math.max(1,tower.maxCharge),0,1),g=this.hud;
      if(charge>0){
        this.glows.lineStyle(7,color,.05+charge*.08).beginPath().arc(p.x,p.y,33,-Math.PI/2,-Math.PI/2+TAU*charge).strokePath();
        g.lineStyle(2.8,color,.9).beginPath().arc(p.x,p.y,33,-Math.PI/2,-Math.PI/2+TAU*charge).strokePath();
      }
      if(flash>0){
        this.glows.fillStyle(color,flash*.22).fillCircle(p.x,p.y,28);
        this.glows.lineStyle(2,color,flash*.6).strokeCircle(p.x,p.y,32+(1-flash)*12);
      }
      for(let j=0;j<tower.level;j++){
        const x=p.x+(j-(tower.level-1)/2)*7;
        g.fillStyle(0x071321,1).fillCircle(x,p.y+43,2.9);g.fillStyle(color,.9).fillCircle(x,p.y+43,1.8);
      }
    }
    this.prune(this.towerSprites,live);
  }

  private drawEnemies(){
    const m=this.opts.model,g=this.hud,live=new Set<string>();
    for(const enemy of m.enemies){
      const key=String(enemy.id);live.add(key);
      let s=this.enemySprites.get(key);
      if(!s){
        const tex=this.textures.exists('pb-enemy-'+enemy.type)?enemy.type:'swarm';
        s=this.add.image(enemy.x,enemy.y,'pb-enemy-'+tex).setDepth(15);this.enemySprites.set(key,s);
      }
      // Art is drawn at a physical body radius of 32 inside a 120 px texture.
      const size=enemy.radius*3.55;
      s.setPosition(enemy.x,enemy.y).setDisplaySize(size,size).setRotation(Math.sin(this.drawTime*4+Number(enemy.id))* .04);
      s.clearTint();if(enemy.slow>0)s.setTint(0xa1eaff);else if(enemy.burn>0)s.setTint(0xffb08c);
      const radius=enemy.radius;
      if(enemy.type==='boss'){
        this.glows.lineStyle(1.5,PALETTE.fire,.25).strokeCircle(enemy.x,enemy.y,radius+10+Math.sin(this.drawTime*4)*2);
      }
      if(enemy.armor>0){
        g.lineStyle(1.8,PALETTE.prism,.55).beginPath().arc(enemy.x,enemy.y,radius+5,.17,Math.PI-.17).strokePath();
      }
      if(enemy.slow>0){
        this.glows.lineStyle(1,PALETTE.frost,.5).strokeCircle(enemy.x,enemy.y,radius+4);
        for(let j=0;j<3;j++){
          const a=j*TAU/3+this.drawTime*.5;
          this.glows.fillStyle(PALETTE.frost,.75).fillCircle(enemy.x+Math.cos(a)*(radius+4),enemy.y+Math.sin(a)*(radius+4),1.7);
        }
      }
      if(enemy.burn>0){
        for(let j=0;j<4;j++){
          const t=(this.drawTime*1.7+j*.27)%1,x=enemy.x+Math.sin(j*2.9)*radius*.65,y=enemy.y-radius*.1-t*(radius+16);
          this.glows.fillStyle(j%2?PALETTE.fire:PALETTE.prism,(1-t)*.8).fillCircle(x,y,(1-t)*2.5+.5);
        }
      }
      if(enemy.hp<enemy.maxHp||enemy.type==='boss'){
        const w=enemy.type==='boss'?76:Math.max(25,radius*2),y=enemy.y-radius-10;
        g.fillStyle(0x020811,.85).fillRoundedRect(enemy.x-w/2-1,y-1,w+2,5,2);
        g.fillStyle(enemy.type==='boss'?PALETTE.fire:0xf3ad88,.9).fillRoundedRect(enemy.x-w/2,y,w*clamp(enemy.hp/enemy.maxHp,0,1),3,1.5);
      }
    }
    this.prune(this.enemySprites,live);
  }

  private drawPaddle(){
    const m=this.opts.model,g=this.machine,x=m.paddleX,y=910,w=m.paddleWidth;
    const hit=m.effects.some(e=>e.type==='paddle'&&e.life/e.maxLife>.45);
    const active=m.overdriveActive>0,c=active?PALETTE.prism:PALETTE.teal,h=hit?13:17;
    g.fillStyle(0x020810,.8).fillRoundedRect(x-w/2-5,y-h/2+9,w+10,h+7,11);
    this.glows.fillStyle(c,active?.07:.035).fillEllipse(x,y+3,w+55,53);
    this.glows.lineStyle(7,c,hit?.22:.06).strokeRoundedRect(x-w/2,y-h/2,w,h,9);
    g.fillStyle(0x314955,1).fillRoundedRect(x-w/2-3,y-h/2-3,w+6,h+6,11);
    g.lineStyle(1,0xb6c4bc,.65).strokeRoundedRect(x-w/2-3,y-h/2-3,w+6,h+6,11);
    g.fillStyle(0x0b202b,1).fillRoundedRect(x-w/2,y-h/2,w,h,8);
    g.lineStyle(3,c,1).lineBetween(x-w/2+9,y-h/2+1,x+w/2-9,y-h/2+1);
    g.fillStyle(c,hit?.65:.2).fillRoundedRect(x-w/2+5,y-h/2+3,w-10,4,2);
    g.lineStyle(1,c,.4);
    for(let i=-1;i<=1;i++)g.lineBetween(x+i*13-3,y+3,x+i*13+3,y+3);
    for(const s of [-1,1]){
      g.fillStyle(0xe3d3ac,1).fillCircle(x+s*(w/2-10),y+1,2);
      g.lineStyle(1,0x172b35,1).lineBetween(x+s*(w/2-10)-1,y,x+s*(w/2-10)+1,y+2);
    }
    if(active)this.glows.lineStyle(1,PALETTE.prism,.5).strokeRoundedRect(x-w/2-9,y-h/2-8,w+18,h+16,15);
  }

  private drawBalls(){
    const m=this.opts.model,g=this.glows,live=new Set<string>();
    for(const ball of m.balls){
      const key=String(ball.id);live.add(key);
      const c=COLOR[ball.element]||PALETTE.neutral,trail=ball.trail;
      for(let i=1;i<trail.length;i++){
        const p=trail[i-1],q=trail[i],alpha=1-i/trail.length;
        g.lineStyle(ball.radius*1.8*alpha,c,.09*alpha).lineBetween(p.x,p.y,q.x,q.y);
        g.lineStyle(ball.radius*.7*alpha,c,.38*alpha).lineBetween(p.x,p.y,q.x,q.y);
      }
      g.fillStyle(c,.04).fillCircle(ball.x,ball.y,27);
      g.fillStyle(c,.075).fillCircle(ball.x,ball.y,17);
      g.lineStyle(1.2,c,.65).strokeCircle(ball.x,ball.y,10.5);
      let s=this.ballSprites.get(key);if(!s){s=this.add.image(ball.x,ball.y,'pb-ball').setDepth(30);this.ballSprites.set(key,s);}
      s.setPosition(ball.x,ball.y).setTint(c).setScale(ball.radius/8);
      // An elongated glint keeps speed readable even without a long trail.
      const speed=Math.hypot(ball.vx,ball.vy),ux=ball.vx/(speed||1),uy=ball.vy/(speed||1);
      g.lineStyle(1,c,.3).lineBetween(ball.x-ux*13,ball.y-uy*13,ball.x-ux*22,ball.y-uy*22);
    }
    this.prune(this.ballSprites,live);
  }

  private drawShots(){
    const g=this.sparks;
    for(const s of this.opts.model.shots){
      const alpha=clamp(s.life/s.maxLife,0,1);
      g.lineStyle(8,s.color,alpha*.09).lineBetween(s.x,s.y,s.tx,s.ty);
      g.lineStyle(2,s.color,alpha*.8).lineBetween(s.x,s.y,s.tx,s.ty);
      g.fillStyle(s.color,alpha*.8).fillCircle(s.tx,s.ty,3*alpha+1);
    }
  }

  private drawEffects(){
    const m=this.opts.model,g=this.sparks,liveLabels=new Set<string>();
    for(const e of m.effects){
      const p=1-clamp(e.life/e.maxLife,0,1),fade=1-p;
      const c=e.color??(e.type==='freeze'?PALETTE.frost:e.type==='death'?PALETTE.fire:PALETTE.teal);
      const seed=String(e.id).split('').reduce((n,ch)=>n+ch.charCodeAt(0),0);
      const powerful=['explosion','fusion','burst'].includes(e.type),r=e.radius??(powerful?83:e.type==='bumper'?34:23);
      if(e.type==='lightning'&&e.tx!==undefined&&e.ty!==undefined){
        g.lineStyle(6,c,fade*.1).lineBetween(e.x,e.y,e.tx,e.ty);
        g.lineStyle(1.5,c,fade*.9);g.beginPath().moveTo(e.x,e.y);
        for(let j=1;j<=8;j++){
          const t=j/8,offset=j===8?0:Math.sin(j*11+seed)*13*fade;
          g.lineTo(Phaser.Math.Linear(e.x,e.tx,t)+offset,Phaser.Math.Linear(e.y,e.ty,t)-offset*.5);
        }g.strokePath();
      }else if(e.type==='drain'){
        g.lineStyle(3,PALETTE.fire,fade*.6).strokeEllipse(e.x,e.y,40+p*80,7+p*16);
      }else{
        const radius=e.type==='bumper'?29+p*25:5+Math.pow(p,.6)*r;
        g.lineStyle(powerful?3:1.5,c,fade*(powerful?.8:.65)).strokeCircle(e.x,e.y,radius);
        if(powerful){g.lineStyle(1,c,fade*.3).strokeCircle(e.x,e.y,radius*.7);g.fillStyle(c,fade*fade*.09).fillCircle(e.x,e.y,radius);}
        if(p<.18)g.fillStyle(0xffffff,(1-p/.18)*.3).fillCircle(e.x,e.y,powerful?25:9);
      }
      const count=powerful?14:e.type==='death'?9:6;
      for(let j=0;j<count;j++){
        const a=j*TAU/count+seed*.17,d=(powerful?16:6)+p*(r+(j%3)*9);
        const x=e.x+Math.cos(a)*d,y=e.y+Math.sin(a)*d+p*p*14;
        const len=(1-p)*(powerful?9:5)+1;
        g.lineStyle(j%3===0?2:1,c,fade*.8).lineBetween(x,y,x+Math.cos(a)*len,y+Math.sin(a)*len);
        if(j%3===0)g.fillStyle(0xffffff,fade*.55).fillCircle(x,y,1.2);
      }
      if(e.text){
        const key='fx-'+e.id;liveLabels.add(key);let label=this.labels.get(key);
        if(!label){
          const color='#'+c.toString(16).padStart(6,'0');
          label=this.add.text(e.x,e.y-24,e.text,{fontFamily:'"Space Grotesk", "Microsoft YaHei", sans-serif',fontSize:powerful?'20px':'14px',fontStyle:'bold',color,stroke:'#071321',strokeThickness:4,align:'center'}).setOrigin(.5).setDepth(60);
          this.labels.set(key,label);
        }
        label.setPosition(clamp(e.x,70,WIDTH-70),e.y-24-p*35).setAlpha(clamp(fade*2,0,1));
        if(!this.reducedMotion)label.setScale(1+Math.max(0,.15-p)*1.5);
      }
    }
    this.prune(this.labels,liveLabels);
  }

  private drawPreview(){
    const m=this.opts.model;if((!m.ballReady&&m.phase!=='build')||m.phase==='defeat'||m.phase==='victory')return;
    const points=m.previewTrajectory(),g=this.hud;
    for(let i=1;i<points.length;i++){
      const a=points[i-1],b=points[i],d=Math.hypot(b.x-a.x,b.y-a.y),steps=Math.ceil(d/13);
      for(let k=0;k<steps;k++){
        const f=k/steps,x=Phaser.Math.Linear(a.x,b.x,f),y=Phaser.Math.Linear(a.y,b.y,f);
        const alpha=(1-(i-1+f)/points.length)*.47;
        g.fillStyle(PALETTE.teal,alpha).fillCircle(x,y,1.6);
      }
    }
    const origin=points.length?{x:m.paddleX,y:887}:null;if(origin){
      this.glows.fillStyle(PALETTE.teal,.06).fillCircle(origin.x,origin.y,25);
      g.lineStyle(1,PALETTE.teal,.7).strokeCircle(origin.x,origin.y,13+Math.sin(this.drawTime*4)*2);
      // A chrome ball is docked on the paddle while waiting to launch.
      g.fillStyle(0x9edfdc,1).fillCircle(origin.x,origin.y,8);
      g.fillStyle(0xf6fff8,1).fillCircle(origin.x-2,origin.y-2,3.5);
    }
  }

  private drawAtmosphere(){
    const m=this.opts.model,g=this.glows;
    if(m.phase==='wave'){
      for(let i=0;i<3;i++){
        const x=[200,450,700][i],pulse=.05+Math.sin(this.drawTime*3+i)*.025;
        g.fillStyle(PALETTE.fire,pulse).fillEllipse(x,75,100,35);
      }
    }
    if(m.hp<=6&&m.phase==='wave'){
      const a=.05+Math.sin(this.drawTime*5)*.025;
      g.lineStyle(12,PALETTE.fire,a).strokeRoundedRect(50,50,800,897,20);
    }
    if(m.overdriveActive>0){
      const p=this.drawTime*100%110;
      for(let y=90;y<840;y+=110){
        g.fillStyle(PALETTE.prism,.1).fillCircle(55,y+p,2);
        g.fillStyle(PALETTE.prism,.1).fillCircle(845,y+p,2);
      }
    }
    if(this.reducedMotion)return;
    for(let i=0;i<13;i++){
      const x=100+(i*163)%700,y=100+(i*173+this.drawTime*(4+i%4))%720;
      g.fillStyle(i%3?0x80bfc4:PALETTE.prism,.1+Math.sin(this.drawTime+i)*.05).fillCircle(x,y,.6);
    }
  }

  private prune<T extends {destroy:()=>void}>(map:Map<string,T>,live:Set<string>){
    for(const [key,value] of map)if(!live.has(key)){value.destroy();map.delete(key);}
  }
}
