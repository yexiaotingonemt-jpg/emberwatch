import Phaser from 'phaser';
import { TOWERS, type GameModel } from './model';
import { W, H, makeBackground, makeEnemy, makeTower } from './art';

export interface WorldOptions {
  model: GameModel;
  onPad: (index: number) => void;
  onGround: (x: number, y: number) => void;
  onTick: (dt: number) => void;
}

const TOWER_COLORS: Record<string, number> = { arrow: 0xe4bd70, cannon: 0xe3a169, frost: 0x8be2d3, storm: 0xbca1ee };
const hex = (n: number) => '#' + n.toString(16).padStart(6, '0');

/** A purely illustrative view: all rules and state remain in the model. */
export class World extends Phaser.Scene {
  private opts: WorldOptions;
  private mapKey: number | null = null;
  private backdrop?: Phaser.GameObjects.Image;
  private under!: Phaser.GameObjects.Graphics;
  private overlay!: Phaser.GameObjects.Graphics;
  private towerSprites = new Map<string, Phaser.GameObjects.Image>();
  private enemySprites = new Map<string, Phaser.GameObjects.Image>();
  private floatTexts = new Map<string, Phaser.GameObjects.Text>();
  private ghost?: Phaser.GameObjects.Image;
  private hoverPad: number | null = null;
  private pointerPos = { x: -100, y: -100 };
  private motes: {x:number;y:number;r:number;speed:number;phase:number}[] = [];

  constructor(opts: WorldOptions) { super({ key: 'world' }); this.opts = opts; }

  create() {
    this.cameras.main.setBackgroundColor('#203b37');
    this.under = this.add.graphics().setDepth(2);
    this.overlay = this.add.graphics().setDepth(1000);
    this.input.mouse?.disableContextMenu();
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      this.pointerPos = { x: p.worldX, y: p.worldY };
      this.hoverPad = this.padAt(p.worldX, p.worldY);
      this.game.canvas.style.cursor = this.hoverPad !== null || this.opts.model.targeting ? 'pointer' : 'default';
    });
    this.input.on('gameout', () => { this.hoverPad = null; this.pointerPos = {x:-100,y:-100}; });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      const index = this.padAt(p.worldX,p.worldY);
      if(p.rightButtonReleased()) this.opts.onGround(-1,-1);
      else if(this.opts.model.targeting) this.opts.onGround(p.worldX,p.worldY);
      else if(index !== null) this.opts.onPad(index);
      else this.opts.onGround(p.worldX,p.worldY);
    });
    for(let i=0;i<26;i++)this.motes.push({x:(i*73+51)%W,y:(i*137+35)%H,r:.7+i%3*.35,speed:2+i%5,phase:i*2.71});
    this.rebuild();
  }

  private padAt(x: number, y: number) {
    const m=this.opts.model;
    // Test the visible tower body before its ground pad, from foreground to back.
    const towers=[...m.towers].sort((a,b)=>m.map.pads[b.pad][1]-m.map.pads[a.pad][1]);
    for(const t of towers){
      const p=m.map.pads[t.pad],scale=1+(t.level-1)*.035;
      if(Math.abs(x-p[0])<=30*scale&&y>=p[1]-115*scale&&y<=p[1]+16*scale)return t.pad;
    }
    let result: number | null = null, nearest = 34;
    this.opts.model.map.pads.forEach((p,i)=>{
      const d=Math.hypot(x-p[0],y-p[1]);
      if(d<nearest){ nearest=d; result=i; }
    });
    return result;
  }

  private rebuild() {
    const map = this.opts.model.map;
    this.mapKey = map.id;
    this.backdrop?.destroy();
    if (this.textures.exists('battlefield')) this.textures.remove('battlefield');
    this.textures.addCanvas('battlefield', makeBackground(map.path, map.pads, String(map.id), map.tint));
    this.backdrop = this.add.image(0,0,'battlefield').setOrigin(0).setDepth(0);
    for(const s of this.towerSprites.values())s.destroy();this.towerSprites.clear();
    for(const s of this.enemySprites.values())s.destroy();this.enemySprites.clear();
    this.hoverPad = null;
  }

  update(_time: number, delta: number) {
    this.opts.onTick(Math.min(delta / 1000,.05));
    const m=this.opts.model;
    if(this.mapKey!==m.map.id)this.rebuild();
    this.under.clear();this.overlay.clear();
    this.renderPads();
    this.renderTowers();
    this.renderGhost();
    this.renderEnemies();
    this.renderShots();
    this.renderEffects();
    this.renderAmbience();
    this.renderTarget();
  }

  private renderGhost() {
    const m=this.opts.model,pad=this.hoverPad;
    const canPreview=pad!==null&&m.buildType&&!m.targeting&&!m.paused&&!m.perkChoices.length&&!m.towers.some(t=>t.pad===pad)&&['build','wave'].includes(m.phase);
    if(canPreview){
      const type=m.buildType!,key=`tower-${type}-1-base`;
      if(!this.textures.exists(key))this.textures.addCanvas(key,makeTower(type,1,null));
      if(!this.ghost)this.ghost=this.add.image(0,0,key).setOrigin(.5,136/166).setAlpha(.48);
      const p=m.map.pads[pad!];
      this.ghost.setTexture(key).setPosition(p[0],p[1]).setDepth(19.9+p[1]*.1).setVisible(true);
      if(m.gold<TOWERS[type].cost)this.ghost.setTint(0x9a766b);else this.ghost.clearTint();
    }else this.ghost?.setVisible(false);
    this.game.canvas.style.cursor=m.targeting?'crosshair':canPreview&&m.gold<TOWERS[m.buildType!].cost?'not-allowed':pad!==null?'pointer':'default';
  }

  private renderPads() {
    const m=this.opts.model,g=this.under;
    m.map.pads.forEach(([x,y],index)=>{
      const occupied=m.towers.some(t=>t.pad===index);
      const selected=m.selectedPad===index;
      const hovered=this.hoverPad===index;
      if(!occupied){
        g.fillStyle(0x223e32,.45);g.fillEllipse(x,y,37,23);
        g.lineStyle(selected?2:1, selected?0xf0d18a:hovered?0xdfd6ab:0xc6c59b,selected||hovered?.95:.45);
        g.strokeEllipse(x,y,39,25);
        g.lineStyle(2,hovered||selected?0xf3d99c:0xc3c59a,hovered||selected?.95:.6);
        g.lineBetween(x-5,y,x+5,y);g.lineBetween(x,y-5,x,y+5);
        if(hovered||selected){g.fillStyle(0xe1c476,.11);g.fillEllipse(x,y,57,36);}
      } else if(selected||hovered){
        g.lineStyle(2,selected?0xe8c678:0xb7c99a,.85);g.strokeEllipse(x,y+2,69,36);
      }
    });
    const active=m.selectedPad ?? this.hoverPad;
    if(active===null)return;
    const tower=m.towers.find(t=>t.pad===active),pad=m.map.pads[active];
    if(!pad)return;
    const type=tower?.type ?? m.buildType;
    if(!type)return;
    const range=tower?m.range(tower):TOWERS[type].range*(m.perks.includes('keen')?1.18:1);
    const color=TOWER_COLORS[type]??0xe4bd70;
    g.fillStyle(color,.045);g.fillCircle(pad[0],pad[1],range);
    g.lineStyle(1.5,color,.33);g.strokeCircle(pad[0],pad[1],range);
    const theta=m.time*.3;
    for(let i=0;i<4;i++){
      const a=theta+i*Math.PI*.5;
      g.lineStyle(2,color,.65);g.beginPath();g.arc(pad[0],pad[1],range,a,a+.11);g.strokePath();
    }
  }

  private renderTowers() {
    const m=this.opts.model,alive=new Set<string>();
    for(const t of m.towers){
      const id=String(t.id),key=`tower-${t.type}-${t.level}-${t.branch??'base'}`;alive.add(id);
      if(!this.textures.exists(key))this.textures.addCanvas(key,makeTower(t.type,t.level,t.branch));
      let sprite=this.towerSprites.get(id);
      if(!sprite){sprite=this.add.image(0,0,key).setOrigin(.5,136/166);this.towerSprites.set(id,sprite);}
      if(sprite.texture.key!==key)sprite.setTexture(key);
      const p=m.map.pads[t.pad];sprite.setPosition(p[0],p[1]).setDepth(20+p[1]*.1);
      sprite.setScale(1+(t.level-1)*.035+(m.selectedPad===t.pad?.025:0));
      // The crystal cores breathe gently even between waves.
      if(t.type==='frost'||t.type==='storm'){
        const color=TOWER_COLORS[t.type],pulse=.13+Math.sin(m.time*2+t.pad)*.04;
        this.overlay.fillStyle(color,pulse);this.overlay.fillCircle(p[0],p[1]-60,15);
        this.overlay.fillStyle(color,.6);this.overlay.fillCircle(p[0]+Math.sin(m.time+t.pad)*16,p[1]-78+Math.cos(m.time*1.4+t.pad)*11,1.4);
      }
    }
    for(const [id,s]of this.towerSprites){if(!alive.has(id)){s.destroy();this.towerSprites.delete(id);}}
  }

  private renderEnemies() {
    const m=this.opts.model,g=this.overlay,alive=new Set<string>();
    for(const e of m.enemies){
      const id=String(e.id),key=`enemy-${e.type}`;alive.add(id);
      if(!this.textures.exists(key))this.textures.addCanvas(key,makeEnemy(e.type));
      let s=this.enemySprites.get(id);
      if(!s){s=this.add.image(e.x,e.y,key).setOrigin(.5,116/150);this.enemySprites.set(id,s);}
      s.setPosition(e.x,e.y+Math.sin(m.time*(e.type==='runner'?15:9)+Number(e.id)*2)*1.5).setDepth(20+e.y*.1);
      if(e.slow>0){s.setTint(0xb2f4ee);g.lineStyle(1,0x8eece3,.4);g.strokeEllipse(e.x,e.y+2,31,12);}else s.clearTint();
      if(e.burn>0){for(let i=0;i<3;i++){const p=(m.time*1.5+i*.33)%1;g.fillStyle(i===1?0xffd68b:0xf39860,(1-p)*.8);g.fillCircle(e.x+Math.sin(i*2.4+Number(e.id))*12,e.y-7-p*24,2*(1-p)+.5);}}
      if(e.stun>0){g.lineStyle(1,0xf3d798,.6);g.strokeEllipse(e.x,e.y-46,20,7);const a=m.time*4;g.fillStyle(0xf3d798,.9);g.fillCircle(e.x+Math.cos(a)*10,e.y-46+Math.sin(a)*3,1.8);}
      const full=e.hp>=e.maxHp-.1;
      if(!full||e.type==='boss'||m.phase==='defeat'){
        const width=e.type==='boss'?54:e.type==='brute'?34:27,y=e.y-(e.type==='boss'?86:e.type==='brute'?64:48);
        g.fillStyle(0x142825,.9);g.fillRoundedRect(e.x-width/2-1,y-1,width+2,6,2);
        g.fillStyle(e.type==='boss'?0xde9674:0xbad29b,1);g.fillRoundedRect(e.x-width/2,y,width*Math.max(0,e.hp/e.maxHp),4,1);
      }
    }
    for(const [id,s]of this.enemySprites){if(!alive.has(id)){s.destroy();this.enemySprites.delete(id);}}
  }

  private renderShots() {
    const m=this.opts.model,g=this.overlay;
    for(const s of m.shots){
      const color=TOWER_COLORS[s.type]??0xf3d58f;
      const a=Math.atan2(s.ty-s.y,s.tx-s.x),len=s.type==='arrow'?17:9;
      g.lineStyle(s.type==='arrow'?2:3,color,.8);g.lineBetween(s.x-Math.cos(a)*len,s.y-Math.sin(a)*len,s.x,s.y);
      if(s.type==='arrow'){
        g.fillStyle(0xf6e6ad);g.fillTriangle(s.x+Math.cos(a)*4,s.y+Math.sin(a)*4,s.x+Math.cos(a+2.5)*4,s.y+Math.sin(a+2.5)*4,s.x+Math.cos(a-2.5)*4,s.y+Math.sin(a-2.5)*4);
      }else{
        g.fillStyle(color,.13);g.fillCircle(s.x,s.y,10);g.fillStyle(color);g.fillCircle(s.x,s.y,s.type==='cannon'?4:3);
        g.fillStyle(0xf4ffe7,.8);g.fillCircle(s.x-1,s.y-1,1.5);
      }
    }
  }

  private renderEffects() {
    const m=this.opts.model,g=this.overlay,alive=new Set<string>();
    for(const e of m.effects){
      const id=String(e.id),ratio=Math.max(0,Math.min(1,e.life/e.maxLife)),p=1-ratio;
      const color=e.color??(e.type==='frost'?0x9ce7d8:e.type==='lightning'?0xcbb5f5:e.type==='heal'?0xb6e5a5:0xecc27d);
      if(e.text){
        alive.add(id);let t=this.floatTexts.get(id);
        if(!t){t=this.add.text(e.x,e.y,e.text,{fontFamily:'Georgia,serif',fontSize:'17px',fontStyle:'bold',color:hex(color),stroke:'#1b3430',strokeThickness:4}).setOrigin(.5).setDepth(1100);this.floatTexts.set(id,t);}
        t.setPosition(e.x,e.y-p*32).setAlpha(Math.min(1,ratio*3));
      }
      if(e.type==='lightning'){
        const tx=e.tx??e.x,ty=e.ty??e.y,dx=tx-e.x,dy=ty-e.y,length=Math.hypot(dx,dy)||1;
        g.lineStyle(6,color,ratio*.14);g.lineBetween(e.x,e.y,tx,ty);
        g.lineStyle(2,color,ratio);g.beginPath();g.moveTo(e.x,e.y);
        for(let i=1;i<7;i++){const a=i/7,offset=Math.sin(i*7+e.id)*12;g.lineTo(e.x+dx*a-dy/length*offset,e.y+dy*a+dx/length*offset);}
        g.lineTo(tx,ty);g.strokePath();
        g.lineStyle(1,color,ratio*.6);g.strokeCircle(tx,ty,9+p*22);
      }else if(e.type==='meteor'||e.type==='explosion'){
        if(e.type==='meteor'){
          const elapsed=e.maxLife-e.life,fall=Math.min(1,elapsed/.22);
          if(elapsed<.25){
            const x=e.x-(1-fall)*145,y=e.y-(1-fall)*270;
            g.lineStyle(13,0xf1a464,.13);g.lineBetween(x-80,y-150,x,y);
            g.lineStyle(5,0xf1b16c,.65);g.lineBetween(x-54,y-101,x,y);
            g.lineStyle(2,0xffe4a3,.95);g.lineBetween(x-28,y-52,x,y);
            g.fillStyle(0xffedbc,.95);g.fillCircle(x,y,5);
          }
          if(elapsed<.18)continue;
        }
        const size=e.radius??(e.type==='meteor'?90:44);
        g.fillStyle(color,ratio*.11);g.fillCircle(e.x,e.y,size*(.2+p*.8));
        g.lineStyle(3*ratio,color,ratio*.8);g.strokeCircle(e.x,e.y,size*p);
        for(let i=0;i<9;i++){const a=i*2.399;g.fillStyle(color,ratio);g.fillCircle(e.x+Math.cos(a)*size*p*.8,e.y+Math.sin(a)*size*p*.65,2.8*ratio);}
      }else if(e.type==='frost'||e.type==='build'||e.type==='heal'){
        g.lineStyle(2,color,ratio*.7);g.strokeCircle(e.x,e.y,10+p*(e.type==='frost'?55:33));
        for(let i=0;i<6;i++){const a=i*Math.PI/3+m.time*.5;const x=e.x+Math.cos(a)*(15+p*25),y=e.y+Math.sin(a)*(15+p*25);g.lineStyle(1.5,color,ratio);g.lineBetween(x-3,y,x+3,y);g.lineBetween(x,y-3,x,y+3);}
      }else{
        for(let i=0;i<5;i++){const a=i*2.399+Number(e.id);g.fillStyle(color,ratio*.8);g.fillCircle(e.x+Math.cos(a)*(4+p*22),e.y+Math.sin(a)*(4+p*22)-p*8,2*ratio+.3);}
      }
    }
    for(const [id,t]of this.floatTexts){if(!alive.has(id)){t.destroy();this.floatTexts.delete(id);}}
  }

  private renderAmbience() {
    const g=this.overlay,t=this.opts.model.time;
    for(const p of this.motes){
      const x=p.x+Math.sin(t*.2+p.phase)*15,y=(p.y-t*p.speed*.25+H*100)%H;
      const alpha=(Math.sin(t*1.5+p.phase)+1)*.15+.03;
      g.fillStyle(0xe3d797,alpha*.2);g.fillCircle(x,y,p.r*5);g.fillStyle(0xe5dca7,alpha);g.fillCircle(x,y,p.r);
    }
  }

  private renderTarget() {
    if(!this.opts.model.targeting||this.pointerPos.x<0)return;
    const {x,y}=this.pointerPos,g=this.overlay;
    g.fillStyle(0xedb67d,.08);g.fillCircle(x,y,115);g.lineStyle(1.5,0xf2c78d,.8);g.strokeCircle(x,y,115);
    g.strokeCircle(x,y,10);g.lineBetween(x-19,y,x-12,y);g.lineBetween(x+12,y,x+19,y);g.lineBetween(x,y-19,x,y-12);g.lineBetween(x,y+12,x,y+19);
  }
}
