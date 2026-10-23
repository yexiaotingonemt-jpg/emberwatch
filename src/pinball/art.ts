/** Locally drawn arcade cabinet artwork. The physics geometry is kept in model.ts. */
export const WIDTH = 900;
export const HEIGHT = 1000;
export const PALETTE = {
  navy: 0x071321, teal: 0x54f0d0, fire: 0xff775e, frost: 0x8ae8ff,
  storm: 0xd1a1ff, prism: 0xffd479, neutral: 0xf1fff6,
};
type Ctx = CanvasRenderingContext2D;
const TAU = Math.PI * 2;

function canvas(w: number, h: number) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  return { canvas: c, c: c.getContext('2d')! };
}
function line(c: Ctx, points: number[][], color: string, width = 1) {
  c.beginPath(); points.forEach(([x,y],i) => i ? c.lineTo(x,y) : c.moveTo(x,y));
  c.strokeStyle=color; c.lineWidth=width; c.lineJoin='round';c.lineCap='round';c.stroke();
}
function disc(c: Ctx,x:number,y:number,r:number,fill:string,stroke?:string,width=1) {
  c.beginPath();c.arc(x,y,r,0,TAU);c.fillStyle=fill;c.fill();
  if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}
}
function shape(c:Ctx, points:number[][], fill:string, stroke?:string,width=1){
  c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();
  c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.lineJoin='round';c.stroke();}
}
function glow(c:Ctx,x:number,y:number,r:number,color:string){
  const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');
  c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);
}
function rr(c:Ctx,x:number,y:number,w:number,h:number,r:number,fill:string,stroke?:string,width=1){
  c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();
  if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}
}
function text(c:Ctx,value:string,x:number,y:number,size:number,color:string,align:CanvasTextAlign='left'){
  c.font=`600 ${size}px "Space Grotesk", "Segoe UI", sans-serif`;c.textAlign=align;c.fillStyle=color;c.fillText(value,x,y);
}

export function makeBoard(): HTMLCanvasElement {
  const {canvas:out,c}=canvas(WIDTH,HEIGHT);
  const bg=c.createLinearGradient(0,0,WIDTH,HEIGHT);
  bg.addColorStop(0,'#101f30');bg.addColorStop(.45,'#050c17');bg.addColorStop(1,'#16232c');
  c.fillStyle=bg;c.fillRect(0,0,WIDTH,HEIGHT);
  // The cabinet's layered steel rails and recessed playfield.
  rr(c,9,9,882,982,43,'#040b13','#253d4c',2);
  rr(c,20,20,860,960,35,'#182b39','#49626b',1);
  rr(c,27,27,846,946,29,'#0b1621','#050a11',3);
  const field=c.createLinearGradient(0,45,0,954);
  field.addColorStop(0,'#132b38');field.addColorStop(.45,'#0a1b28');field.addColorStop(1,'#081522');
  rr(c,45,45,810,912,22,field as unknown as string,'#4d716e',2);
  c.save();c.beginPath();c.roundRect(48,48,804,906,20);c.clip();
  glow(c,450,70,480,'#21575338');glow(c,450,560,400,'#22405915');
  // Quiet technical grid and grain; never competes with balls or creatures.
  for(let y=70;y<950;y+=26)for(let x=67;x<850;x+=26)disc(c,x,y,.65,'#92c4bc19');
  for(let i=0;i<2200;i++){
    const x=((i*193.31)%804)+48,y=((i*367.73)%906)+48;
    c.fillStyle=i%2?'#ffffff03':'#00000006';c.fillRect(x,y,1,2);
  }
  for(const x of [200,450,700]){
    const lane=c.createLinearGradient(0,80,0,860);lane.addColorStop(0,'#ff8d6d0b');lane.addColorStop(1,'#ff8d6d00');
    c.fillStyle=lane;c.fillRect(x-34,76,68,750);
    c.setLineDash([2,17]);line(c,[[x,134],[x,830]],'#81abb31a');c.setLineDash([]);
    for(let y=150;y<790;y+=164){
      line(c,[[x-8,y],[x,y+6],[x+8,y]],'#88adad19',1);
      line(c,[[x-8,y+7],[x,y+13],[x+8,y+7]],'#88adad0e',1);
    }
    // Incoming hostile gates.
    rr(c,x-45,49,90,32,5,'#111a24','#785248',1);
    line(c,[[x-34,62],[x-22,67],[x-10,62],[x+2,67],[x+14,62],[x+26,67],[x+34,63]],'#fc987564',2);
    glow(c,x,77,72,'#ff70471d');
  }
  // Art deco circuitry on the edge of the field.
  for(const side of [-1,1]){
    c.save();c.translate(side<0?0:900,0);c.scale(side<0?1:-1,1);
    line(c,[[72,160],[88,176],[88,322],[72,338]],'#5c898d32');
    line(c,[[72,380],[82,390],[82,600],[73,610]],'#5c898d24');
    line(c,[[73,650],[85,662],[85,792],[72,805]],'#5c898d24');
    for(const y of [160,338,380,610,650,805])disc(c,72,y,2,'#769a9a50');
    c.restore();
  }
  // Goal line: an electric field, not a solid reflecting wall.
  const shield=c.createLinearGradient(0,839,0,881);shield.addColorStop(0,'#66efd800');shield.addColorStop(.5,'#66efd80d');shield.addColorStop(1,'#66efd800');
  c.fillStyle=shield;c.fillRect(50,839,800,42);
  c.setLineDash([9,7]);line(c,[[65,860],[835,860]],'#61d8ca40',1);c.setLineDash([]);
  for(const x of [70,830]){
    rr(c,x-6,843,12,34,3,'#163b40','#5e9c96',1);
    rr(c,x-2,850,4,19,2,'#72edcf');
  }
  text(c,'CORE SHIELD',450,853,9,'#83c8bd65','center');
  // Lower launch apron.
  const apron=c.createLinearGradient(0,880,0,957);apron.addColorStop(0,'#0c202b00');apron.addColorStop(1,'#1a333e');
  c.fillStyle=apron;c.fillRect(49,880,802,78);
  for(let x=105;x<810;x+=23)line(c,[[x,949],[x+9,940]],'#ffbd7425',3);
  text(c,'RETURN / REBOUND',450,948,10,'#90acb080','center');
  c.restore();
  // Steel edge highlights. The playable rail is x = 45 and x = 855.
  line(c,[[45,830],[45,72],[56,55],[844,55],[855,72],[855,830]],'#9bcbc34a',2);
  line(c,[[40,832],[40,70],[54,49]],'#03080d',3);
  line(c,[[860,832],[860,70],[846,49]],'#03080d',3);
  for(let i=0;i<16;i++){
    const y=106+i*49;
    for(const x of [32,868]){
      glow(c,x,y,13,i%4===0?'#f8c77c35':'#d6f1c61b');
      rr(c,x-3,y-7,6,14,3,'#050a0f','#36535b',1);
      rr(c,x-1.5,y-4,3,8,1.5,i%4===0?'#f5c887':'#9db7a6');
    }
  }
  for(const [x,y] of [[25,25],[875,25],[25,975],[875,975]]){
    disc(c,x,y,7,'#09111b','#40545c',1);disc(c,x,y,4,'#1d2e37');
    line(c,[[x-2,y+2],[x+2,y-2]],'#7b959d',1);
  }
  text(c,'R / B',66,30,9,'#bdcdb7');text(c,'REACTOR FIELD  •  07',834,30,9,'#92adb0','right');
  text(c,'BALLISTICS LAB',66,978,9,'#698991');text(c,'KINETIC ARRAY',834,978,9,'#698991','right');
  return out;
}

const INK:Record<string,string>={fire:'#ff8465',frost:'#91eaff',storm:'#c59bff',prism:'#ffd480'};
export function makeBumper(type:string):HTMLCanvasElement {
  const {canvas:out,c}=canvas(124,124),color=INK[type]||INK.prism;
  c.translate(62,62);
  glow(c,0,0,56,color+'16');
  disc(c,0,5,36,'#020810a8');
  // Six bolted mounting tabs remain subdued around the bright impact ring.
  for(let i=0;i<6;i++){
    const a=i*TAU/6,x=Math.cos(a)*33,y=Math.sin(a)*33;
    disc(c,x,y,4,'#243846','#060b12',1);disc(c,x,y,1.1,'#93a8ad');
  }
  disc(c,0,0,32,'#07101a','#375360',2);
  const steel=c.createLinearGradient(-30,-28,25,30);
  steel.addColorStop(0,'#8fa0a6');steel.addColorStop(.24,'#253d47');steel.addColorStop(.6,'#172c38');steel.addColorStop(1,'#7b9399');
  disc(c,0,0,29,steel as unknown as string,'#b4d1cf',1);
  disc(c,0,0,25,'#071722',color,2.2);
  glow(c,0,-3,27,color+'30');
  const core=c.createRadialGradient(-7,-10,0,0,0,24);core.addColorStop(0,'#294456');core.addColorStop(1,'#0c1d29');
  disc(c,0,0,21,core as unknown as string,'#223e4a',1);
  c.shadowColor=color;c.shadowBlur=9;c.lineWidth=2.2;c.strokeStyle=color;c.lineCap='round';c.lineJoin='round';
  if(type==='fire'){
    shape(c,[[0,-14],[7,-5],[6,-11],[13,3],[10,11],[2,15],[-7,13],[-12,5],[-8,-4],[-7,2]],color);
    shape(c,[[1,0],[5,6],[3,11],[-3,10],[-4,6]],'#fff3c7');
  } else if(type==='frost'){
    for(let i=0;i<3;i++){
      c.save();c.rotate(i*Math.PI/3);line(c,[[-14,0],[14,0]],color,2);
      for(const s of [-1,1])line(c,[[s*8,-5],[s*5,0],[s*8,5]],color,1.5);c.restore();
    }
    disc(c,0,0,2,'#e8fcff');
  } else if(type==='storm'){
    shape(c,[[3,-16],[-10,3],[-1,3],[-4,16],[11,-5],[2,-5]],color);
  } else {
    shape(c,[[0,-16],[14,9],[-14,9]],'#ffd48011',color,2);
    line(c,[[0,-15],[0,2],[-13,9]],'#fff4c6',1.5);line(c,[[0,2],[13,9]],color,1.5);
    disc(c,0,2,2.5,'#fff4c6');
  }
  c.shadowBlur=0;
  c.beginPath();c.arc(0,0,27,Math.PI*1.14,Math.PI*1.77);c.strokeStyle='#ffffff96';c.lineWidth=1.4;c.stroke();
  return out;
}

export function makeEnemy(type:string):HTMLCanvasElement{
  const {canvas:out,c}=canvas(120,120);c.translate(60,60);
  const boss=type==='boss',brute=type==='brute',shield=type==='shield',healer=type==='healer';
  const color=healer?'#f1a8ff':shield?'#ffce85':boss?'#ff625c':brute?'#ff9673':'#ffa98b';
  glow(c,0,0,51,color+'15');disc(c,1,7,34,'#02070b80');
  c.shadowColor=color;c.shadowBlur=8;
  if(boss){
    for(let i=0;i<6;i++){
      c.save();c.rotate(i*TAU/6);shape(c,[[19,-8],[39,-15],[35,6],[21,13]],'#39232e','#b96962',1.5);c.restore();
    }
    shape(c,[[0,-34],[28,-17],[28,18],[0,35],[-28,18],[-28,-17]],'#2c1b2c',color,2);
    shape(c,[[0,-22],[18,-11],[18,12],[0,24],[-18,12],[-18,-11]],'#641f31','#e78d7a',1);
    shape(c,[[-14,-6],[0,2],[14,-6],[7,12],[-7,12]],'#ffe3bd');
    line(c,[[-10,-14],[0,-8],[10,-14]],'#ff605c',3);
  }else if(brute){
    shape(c,[[-25,-24],[20,-29],[35,-4],[27,25],[-17,32],[-33,7]],'#3d2b2c',color,2);
    shape(c,[[-17,-15],[13,-21],[25,-1],[17,16],[-12,20],[-22,4]],'#70403a','#af6556',1);
    rr(c,-16,-5,32,10,3,'#251d2c',color,1);line(c,[[-9,0],[9,0]],'#ffdfb0',3);
    for(const x of [-20,20])disc(c,x,16,2.3,'#e8ad86');
  }else if(shield){
    shape(c,[[0,-35],[29,-20],[26,15],[0,34],[-26,15],[-29,-20]],'#3a3032',color,2);
    shape(c,[[0,-25],[19,-15],[17,11],[0,24],[-17,11],[-19,-15]],'#4d4140','#bd8b5b',1);
    line(c,[[-13,0],[13,0]],'#ffe0a1',3);line(c,[[0,-12],[0,15]],'#e7ad70',2);
  }else if(healer){
    for(let i=0;i<4;i++){c.save();c.rotate(i*TAU/4);shape(c,[[-6,-23],[0,-39],[6,-23]],'#8b5984',color,1);c.restore();}
    disc(c,0,0,25,'#30233f',color,2);disc(c,0,0,17,'#5e3d68','#b485b5',1);
    rr(c,-4,-13,8,26,2,'#ffe6ff');rr(c,-13,-4,26,8,2,'#ffe6ff');
  }else if(type==='beetle'||type==='swarm'){
    for(const s of [-1,1])for(const y of [-15,0,15])line(c,[[s*18,y],[s*35,y-5],[s*39,y+5]],'#c88576',3);
    c.beginPath();c.ellipse(0,0,24,31,0,0,TAU);c.fillStyle='#4f2830';c.fill();c.strokeStyle=color;c.lineWidth=2;c.stroke();
    line(c,[[0,-26],[0,25]],'#bb6965',2);disc(c,-9,-13,3,'#ffe5bb');disc(c,9,-13,3,'#ffe5bb');
    line(c,[[-14,-25],[-20,-35]],color,2);line(c,[[14,-25],[20,-35]],color,2);
  }else{
    // A directional scout with a readable hostile chevron silhouette.
    shape(c,[[0,33],[-29,-8],[-23,-24],[0,-15],[23,-24],[29,-8]],'#4b2b34',color,2);
    shape(c,[[0,23],[-15,-6],[0,-1],[15,-6]],'#a5514b','#e58c73',1);
    line(c,[[-16,-14],[-7,-9]],'#ffe5bf',3);line(c,[[16,-14],[7,-9]],'#ffe5bf',3);
    disc(c,0,4,4,'#ffd9a6');
  }
  c.shadowBlur=0;return out;
}

export function makeBall():HTMLCanvasElement{
  const {canvas:out,c}=canvas(48,48);
  glow(c,24,24,23,'#c9faff42');
  const g=c.createRadialGradient(21,20,1,24,24,8);g.addColorStop(0,'#ffffff');g.addColorStop(.3,'#f2fff9');g.addColorStop(.65,'#87c6d4');g.addColorStop(1,'#193b50');
  disc(c,24,24,8,g as unknown as string,'#ddffff',.6);disc(c,21,20,2.4,'#ffffff');
  return out;
}
