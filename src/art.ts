/** Procedural illustration assets. Everything is generated locally, without image requests. */
export const W = 1100;
export const H = 740;
type Point = [number, number];
type Ctx = CanvasRenderingContext2D;

function rng(seed: number) {
  return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
}
function poly(c: Ctx, pts: number[][], fill: string, stroke = '#172725', line = 2) {
  c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath();
  c.fillStyle = fill; c.fill(); if (line) { c.strokeStyle = stroke; c.lineWidth = line; c.lineJoin = 'round'; c.stroke(); }
}
function ellipse(c: Ctx, x: number, y: number, rx: number, ry: number, color: string) {
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fillStyle = color; c.fill();
}
function distance(x: number, y: number, a: Point, b: Point) {
  const vx = b[0] - a[0], vy = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((x - a[0]) * vx + (y - a[1]) * vy) / (vx * vx + vy * vy)));
  return Math.hypot(x - a[0] - t * vx, y - a[1] - t * vy);
}
function tree(c: Ctx, x: number, y: number, size: number, variant: number) {
  c.save(); c.translate(x, y); c.scale(size, size);
  ellipse(c, 9, 2, 24, 9, '#0b191c55');
  poly(c, [[-4,2],[-3,-35],[4,-35],[6,2]], '#534a35', '#1b3029', 1.5);
  if (variant < .65) {
    poly(c, [[0,-94],[-17,-60],[-9,-60],[-27,-33],[-15,-34],[-33,-6],[-4,0],[26,-9],[12,-33],[22,-33],[8,-60],[15,-60]], '#254a42', '#132c2b', 2);
    poly(c, [[0,-91],[-14,-62],[-5,-63],[-22,-35],[-10,-37],[-27,-10],[-2,-4],[-6,-35],[-1,-32],[-3,-60],[2,-57]], '#356354', '#356354', 0);
    poly(c, [[3,-78],[2,-56],[12,-53],[7,-61]], '#4b7460', '#4b7460', 0);
    c.strokeStyle = '#4c776021'; c.lineWidth = 1; c.beginPath(); c.moveTo(-18,-22);c.lineTo(3,-17);c.moveTo(-10,-49);c.lineTo(5,-44);c.stroke();
  } else {
    for (const [cx,cy,r] of [[-15,-35,20],[15,-37,22],[-16,-56,17],[6,-65,22],[0,-39,25]]) {
      ellipse(c,cx,cy,r,r*.83,'#193b35');
      ellipse(c,cx-2,cy-4,r-2,r*.65,variant>.9?'#50664a':'#325a47');
      ellipse(c,cx-5,cy-8,r*.6,r*.35,variant>.9?'#647853':'#42694e');
    }
  }
  c.restore();
}
function stone(c: Ctx, x: number, y: number, s: number, variant: number) {
  c.save();c.translate(x,y);c.scale(s,s);
  ellipse(c,2,3,14,5,'#122b2b55');
  poly(c,[[-13,0],[-11,-12],[-4,-18],[8,-15],[15,-6],[11,3],[-4,5]],'#50605a','#253d38',1.5);
  poly(c,[[-11,-11],[-4,-18],[8,-15],[4,-6],[-5,-3]],'#778174','#778174',0);
  if(variant>.4)poly(c,[[-12,0],[-4,-3],[3,1],[0,5]],'#526747','#526747',0);
  c.restore();
}
function cliff(c: Ctx, x: number, y: number, s: number) {
  c.save();c.translate(x,y);c.scale(s,s);
  ellipse(c,6,2,35,12,'#15272366');
  poly(c,[[-31,0],[-26,-33],[-12,-52],[-6,-71],[12,-66],[19,-35],[30,-21],[34,2],[0,11]],'#62675e','#293c36',2);
  poly(c,[[-26,-33],[-12,-52],[-6,-71],[12,-66],[3,-39],[-6,-12],[-31,0]],'#8b8c79','#8b8c79',0);
  poly(c,[[12,-66],[19,-35],[30,-21],[34,2],[12,-8],[3,-39]],'#4d5750','#4d5750',0);
  c.strokeStyle='#c4aa6b66';c.lineWidth=1;c.beginPath();c.moveTo(-6,-59);c.lineTo(-3,-42);c.lineTo(-10,-28);c.moveTo(7,-39);c.lineTo(16,-17);c.lineTo(11,-8);c.stroke();
  poly(c,[[-31,0],[-13,-7],[-3,2],[15,5],[0,11]],'#586448','#586448',0);c.restore();
}
function pond(c: Ctx, x: number, y: number, rx: number, ry: number) {
  c.save();c.translate(x,y);
  const points=Array.from({length:14},(_,i)=>{const a=i/14*Math.PI*2,r=.91+Math.sin(i*2.8)*.12;return[Math.cos(a)*rx*r,Math.sin(a)*ry*r];});
  const outline=()=>{c.beginPath();const last=points[points.length-1];c.moveTo((last[0]+points[0][0])/2,(last[1]+points[0][1])/2);points.forEach((p,i)=>{const next=points[(i+1)%points.length];c.quadraticCurveTo(p[0],p[1],(p[0]+next[0])/2,(p[1]+next[1])/2);});c.closePath();};
  outline();c.lineWidth=12;c.strokeStyle='#152f32aa';c.stroke();c.lineWidth=5;c.strokeStyle='#77867566';c.stroke();
  const water=c.createLinearGradient(0,-ry,0,ry);water.addColorStop(0,'#193b47');water.addColorStop(.5,'#2b5660');water.addColorStop(1,'#486e70');c.fillStyle=water;c.fill();
  c.save();outline();c.clip();
  for(let i=0;i<9;i++){const yy=-ry+i*ry/4;const xx=Math.sin(i*9.3)*rx*.6;c.strokeStyle=i%2?'#abc8af2b':'#94c2bd1c';c.lineWidth=1;c.beginPath();c.moveTo(xx-16,yy);c.lineTo(xx+10+i*3,yy);c.stroke();}
  c.restore();
  for(let i=0;i<6;i++){const a=i*2.399;const xx=Math.cos(a)*rx,yy=Math.sin(a)*ry;c.strokeStyle='#9bac7944';c.lineWidth=1;c.beginPath();c.moveTo(xx,yy);c.lineTo(xx-3,yy-11);c.moveTo(xx+2,yy);c.lineTo(xx+6,yy-8);c.stroke();}
  ellipse(c,rx*.22,ry*.3,5,2.4,'#79987a');ellipse(c,rx*.4,ry*.22,4,2,'#91a98a');c.restore();
}
function castle(c: Ctx, x: number, y: number, scale = 1) {
  c.save(); c.translate(x,y);c.scale(scale,scale);
  ellipse(c,9,19,81,27,'#0a1e2180');
  poly(c,[[-69,9],[-56,-8],[55,-10],[75,10],[65,26],[-61,29]],'#637569','#293e36',3);
  poly(c,[[-48,-9],[-48,-63],[40,-63],[40,-8],[24,8],[-36,8]],'#a6a78b','#2d4138',3);
  poly(c,[[40,-63],[53,-55],[53,-3],[40,9]],'#717b68','#2d4138',2);
  for(const xx of [-52,30]){
    poly(c,[[xx-15,6],[xx-15,-69],[xx+14,-69],[xx+14,8]],'#929b83','#2d4138',3);
    poly(c,[[xx+14,-69],[xx+23,-63],[xx+23,0],[xx+14,8]],'#637967','#2d4138',2);
    poly(c,[[xx-20,-66],[xx-1,-96],[xx+20,-66]],'#604d3a','#24392f',3);
    poly(c,[[xx-16,-68],[xx-1,-91],[xx+2,-68]],'#a07645','#a07645',0);
    c.fillStyle='#233e36';c.fillRect(xx-3,-46,7,16);c.fillStyle='#e5b761';c.fillRect(xx-1,-43,3,8);
  }
  poly(c,[[-19,6],[-19,-23],[-15,-31],[-7,-36],[2,-31],[7,-23],[7,6]],'#243a30','#6a795d',2);
  c.fillStyle='#c99d56';c.fillRect(-10,-24,2,27);c.fillRect(-3,-24,2,27);
  poly(c,[[-29,-61],[-29,-91],[22,-91],[22,-61]],'#bbc0a1','#324639',3);
  poly(c,[[-36,-90],[-5,-124],[30,-90]],'#795c39','#263c32',3);
  poly(c,[[-31,-92],[-5,-119],[-2,-93]],'#b98948','#b98948',0);
  c.fillStyle='#273e33';c.fillRect(-11,-81,11,15);c.fillStyle='#f2cd77';c.fillRect(-8,-79,5,10);
  c.strokeStyle='#cbb674';c.lineWidth=3;c.beginPath();c.moveTo(-5,-122);c.lineTo(-5,-152);c.stroke();
  poly(c,[[-4,-151],[23,-146],[-4,-132]],'#c58346','#2b3e32',2);
  for(const xx of [-59,55]){
    c.strokeStyle='#433d2d';c.lineWidth=3;c.beginPath();c.moveTo(xx,5);c.lineTo(xx,-14);c.stroke();
    const glow=c.createRadialGradient(xx,-16,0,xx,-16,26);glow.addColorStop(0,'#ffd16d99');glow.addColorStop(1,'#ffd16d00');c.fillStyle=glow;c.fillRect(xx-27,-43,54,54);
    ellipse(c,xx,-17,4,8,'#f1bc62');ellipse(c,xx,-17,2,5,'#fff1b5');
  }
  c.restore();
}

export function makeBackground(path: Point[], pads: Point[], seedString: string, tint = 0x29443a) {
  const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
  const c=canvas.getContext('2d')!;
  const seed=[...seedString].reduce((a,v)=>a*31+v.charCodeAt(0),43)>>>0;
  const r=rng(seed);
  const wetland=tint===0x253d48,ashen=tint===0x403934;
  const gradient=c.createLinearGradient(0,0,W,H);gradient.addColorStop(0,wetland?'#2c454a':ashen?'#49483c':'#263f39');gradient.addColorStop(.5,wetland?'#3e5d57':ashen?'#54523f':'#385244');gradient.addColorStop(1,wetland?'#263e49':ashen?'#313d38':'#1d3735');
  c.fillStyle=gradient;c.fillRect(0,0,W,H);
  for(let i=0;i<300;i++){
    const x=r()*W,y=r()*H,s=r()*45+10;
    ellipse(c,x,y,s,s*.45, r()>.5?'#73845b0a':'#091e2610');
  }
  // Fine organic ground grain, deliberately below the readability of the road.
  for(let i=0;i<7500;i++){
    c.fillStyle=r()>.5?'#a6ad7310':'#0c28201d';c.fillRect(r()*W,r()*H,r()*2+1,r()*2+1);
  }
  const road=()=>{c.beginPath();path.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.lineCap='round';c.lineJoin='round';};
  road();c.strokeStyle='#0d282b66';c.lineWidth=82;c.stroke();
  road();c.strokeStyle='#5c6a47';c.lineWidth=73;c.stroke();
  road();c.strokeStyle='#968b60';c.lineWidth=64;c.stroke();
  road();c.strokeStyle='#b4a37a';c.lineWidth=54;c.stroke();
  road();c.strokeStyle='#c9b68b';c.lineWidth=44;c.stroke();
  road();c.strokeStyle='#c5b28b';c.lineWidth=31;c.stroke();
  const dist=(x:number,y:number)=>Math.min(...path.slice(1).map((p,i)=>distance(x,y,path[i],p)));
  for(let i=0;i<10000;i++){
    const x=r()*W,y=r()*H,d=dist(x,y);
    if(d<28){
      c.fillStyle=r()>.4?'#635c3e22':'#f9e9bb22';ellipse(c,x,y,r()*1.7+.3,r()*.8+.2,c.fillStyle);
    }else if(d<39&&r()>.5){c.strokeStyle='#40533d88';c.lineWidth=1;c.beginPath();c.moveTo(x,y);c.lineTo(x+r()*4-2,y-3-r()*4);c.stroke();}
  }
  const lakeSites:[number,number,number,number][]=[];
  if(wetland){
    for(const [x,y,rx,ry] of [[85,85,70,44],[415,415,51,34],[925,49,64,37],[420,715,55,32],[1055,69,46,35]]){
      if(dist(x,y)<rx+42||pads.some(p=>Math.hypot(x-p[0],y-p[1])<rx+35))continue;
      pond(c,x,y,rx,ry);lakeSites.push([x,y,rx,ry]);
    }
  }
  // Small paving stones mark the route into the keep.
  const end=path[path.length-1];
  for(let i=0;i<13;i++){const x=end[0]-80+r()*140,y=end[1]-25+r()*50;if(dist(x,y)<23)poly(c,[[x-4,y-2],[x+3,y-3],[x+5,y+2],[x-3,y+3]],'#9c9879','#77795b',.6);}
  // Slight forest clearings around build foundations.
  for(const [x,y] of pads){
    const g=c.createRadialGradient(x,y,8,x,y,50);g.addColorStop(0,'#82916b44');g.addColorStop(1,'#82916b00');c.fillStyle=g;c.fillRect(x-50,y-50,100,100);
    ellipse(c,x,y+7,31,14,'#102a2955');
    poly(c,[[x-28,y-8],[x-18,y-20],[x+15,y-22],[x+28,y-8],[x+24,y+13],[x-18,y+17]],'#737d5d','#344e3c',2);
    poly(c,[[x-24,y-8],[x-15,y-16],[x+14,y-18],[x+24,y-7],[x+20,y+8],[x-16,y+12]],'#9aa07a','#a6aa7f',1);
    c.strokeStyle='#677653';c.lineWidth=1;c.beginPath();c.moveTo(x-19,y+3);c.lineTo(x+18,y-5);c.moveTo(x-3,y-16);c.lineTo(x+3,y+11);c.stroke();
  }
  const props:{x:number,y:number,s:number,v:number,kind:string}[]=[];
  for(let y=-2;y<H+95;y+=37){for(let x=-15;x<W+30;x+=39){
    const xx=x+r()*36,yy=y+r()*25,scale=.65+r()*.55;
    const d=Math.min(dist(xx,yy-20),dist(xx,yy-65*scale));
    const padCovered=pads.some(p=>Math.abs(xx-p[0])<35*scale+36&&p[1]>yy-100*scale-23&&p[1]<yy+24);
    const inLake=lakeSites.some(([lx,ly,rx,ry])=>Math.min(...[yy,yy-55*scale].map(cy=>Math.pow((xx-lx)/(rx+22),2)+Math.pow((cy-ly)/(ry+14),2)))<1);
    if(d<57||padCovered||inLake||Math.hypot(xx-end[0],yy-end[1]+35)<105)continue;
    if(r()>.19)props.push({x:xx,y:yy,s:scale,v:r(),kind:ashen&&r()>.63?'cliff':r()>.14?'tree':'rock'});
  }}
  props.sort((a,b)=>a.y-b.y);
  for(const p of props){
    if(p.kind==='tree')tree(c,p.x,p.y,p.s,p.v);else if(p.kind==='cliff')cliff(c,p.x,p.y,p.s);else stone(c,p.x,p.y,p.s,p.v);
  }
  // Ferns, pale flowers, and tiny amber mushroom colonies in clearings.
  for(let i=0;i<110;i++){
    const x=r()*W,y=r()*H;if(dist(x,y)<44||pads.some(p=>Math.hypot(x-p[0],y-p[1])<34))continue;
    if(r()>.53){
      c.strokeStyle='#73916a77';c.lineWidth=1;c.beginPath();c.moveTo(x,y);c.lineTo(x,y-10);c.moveTo(x,y-2);c.lineTo(x-7,y-7);c.moveTo(x,y-2);c.lineTo(x+7,y-8);c.stroke();
    }else{
      c.fillStyle='#c2af6a';c.fillRect(x,y-3,1,5);ellipse(c,x,y-3,3.5,2,'#ca8a4d');ellipse(c,x-5,y+1,2.5,1.5,'#e1b66c');
    }
  }
  // The first keep sits below its approach so its roof clears the nearby build pad.
  if(seedString==='0'){
    c.strokeStyle='#717a55';c.lineWidth=48;c.lineCap='round';c.beginPath();c.moveTo(end[0],end[1]);c.lineTo(end[0]-5,end[1]+49);c.stroke();
    c.strokeStyle='#bba97f';c.lineWidth=34;c.stroke();
    castle(c,end[0]-5,end[1]+60,.75);
  }else castle(c,end[0]-20,end[1]+4,.85);
  // Two weathered waystones frame the enemy entrance.
  const start=path[0];
  for(const sign of [-1,1]){
    const x=Math.max(23,start[0]+70),y=start[1]+sign*46;
    poly(c,[[x-9,y+9],[x-8,y-18],[x-1,y-29],[x+8,y-21],[x+10,y+9]],'#626e62','#2d413b',2);
    poly(c,[[x-7,y-16],[x-1,y-26],[x+5,y-20],[x+2,y+5]],'#7e8874','#7e8874',0);
    c.strokeStyle='#c7aa77';c.lineWidth=1.4;c.beginPath();c.moveTo(x-1,y-17);c.lineTo(x+3,y-9);c.lineTo(x-3,y-5);c.lineTo(x+2,y+1);c.stroke();
  }
  if(tint!==0x29443a){c.fillStyle=tint===0x253d48?'#244b751e':'#98623b25';c.fillRect(0,0,W,H);}
  // Field vignette frames the battlefield without obscuring it.
  const vg=c.createRadialGradient(W*.5,H*.5,180,W*.5,H*.5,660);vg.addColorStop(0,'#081b2000');vg.addColorStop(.7,'#081b2000');vg.addColorStop(1,'#071b2366');c.fillStyle=vg;c.fillRect(0,0,W,H);
  return canvas;
}

export function makeTower(type: string, level: number, branch: string | null) {
  const cv=document.createElement('canvas');cv.width=144;cv.height=166;const c=cv.getContext('2d')!;
  c.translate(72,136);
  ellipse(c,3,4,31,12,'#0a191b60');
  const stoneColor=level===3?'#a7ae96':'#929b85';
  poly(c,[[-26,-1],[-26,-18],[0,-30],[26,-18],[26,-1],[0,13]],stoneColor,'#20382f',3);
  poly(c,[[0,-11],[26,-18],[26,-1],[0,13]],'#697e68','#20382f',2);
  poly(c,[[-26,-18],[0,-30],[26,-18],[0,-4]],'#b3b49a','#20382f',2);
  if(type==='arrow'){
    poly(c,[[-17,-17],[-17,-69],[15,-69],[15,-18],[0,-9]],'#a7a48a','#293c31',3);
    poly(c,[[15,-69],[23,-62],[23,-21],[15,-18]],'#6c7c65','#293c31',2);
    c.fillStyle='#52624a';c.fillRect(-15,-43,28,2);c.fillRect(-15,-59,28,2);c.fillRect(-1,-58,2,14);
    poly(c,[[-25,-68],[-24,-84],[24,-84],[27,-68]],'#adab8c','#253c30',3);
    for(const x of [-24,-7,11]){poly(c,[[x,-81],[x,-92],[x+11,-92],[x+11,-81]],'#bbbaa0','#2b4132',2);}
    c.strokeStyle='#ddbc75';c.lineWidth=3;c.beginPath();c.moveTo(0,-90);c.lineTo(0,-112);c.stroke();
    poly(c,[[1,-111],[22,-107],[1,-97]],branch==='b'?'#7cb278':'#d1954d','#263a2d',2);
    c.fillStyle='#2d4938';c.fillRect(-4,-35,9,17);c.fillStyle='#e7c778';c.fillRect(-2,-33,5,10);
    c.strokeStyle='#523d2b';c.lineWidth=4;c.beginPath();c.moveTo(-14,-90);c.lineTo(17,-77);c.stroke();
    c.strokeStyle='#dec480';c.lineWidth=2;c.beginPath();c.arc(2,-84,14,-2.4,.8);c.stroke();
  }else if(type==='cannon'){
    poly(c,[[-22,-12],[-22,-40],[0,-51],[22,-40],[22,-12],[0,-3]],'#84917a','#253b30',3);
    poly(c,[[-26,-39],[0,-52],[27,-40],[0,-27]],'#b1ad86','#263b30',3);
    ellipse(c,0,-44,20,12,'#374b3b');ellipse(c,-1,-49,17,10,'#8b8d67');
    c.save();c.translate(0,-52);c.rotate(-.6);
    c.fillStyle=branch==='b'?'#8e7860':'#b29d69';c.strokeStyle='#243b32';c.lineWidth=3;c.beginPath();c.roundRect(-10,-35,20,40,4);c.fill();c.stroke();
    c.fillStyle='#243b32';c.fillRect(-11,-35,22,7);c.fillStyle='#d2bd7d';c.fillRect(-8,-25,16,4);c.restore();
    ellipse(c,-15,-24,6,6,'#c0ac6c');ellipse(c,17,-25,5,5,'#c0ac6c');
  }else if(type==='frost'){
    poly(c,[[-16,-13],[-14,-42],[0,-51],[15,-42],[17,-14],[0,-5]],'#6f9890','#213b38',3);
    poly(c,[[-22,-41],[0,-53],[23,-41],[0,-29]],'#adcfbe','#28463f',3);
    const glow=c.createRadialGradient(0,-66,0,0,-66,43);glow.addColorStop(0,'#9cf7e780');glow.addColorStop(1,'#76e9db00');c.fillStyle=glow;c.fillRect(-43,-109,86,86);
    poly(c,[[0,-106],[-14,-75],[-10,-53],[1,-42],[14,-67]],'#83dcd0','#254e49',3);
    poly(c,[[0,-106],[-3,-69],[1,-42],[14,-67]],'#b4fae5','#b4fae5',0);
    poly(c,[[-16,-82],[-26,-68],[-21,-48],[-12,-42],[-11,-63]],'#68b9b6','#264740',2);
    poly(c,[[23,-89],[13,-66],[14,-45],[27,-59]],'#a0e6d5','#264740',2);
    c.strokeStyle='#d0fff0';c.lineWidth=1;c.beginPath();c.moveTo(-4,-76);c.lineTo(4,-79);c.moveTo(19,-68);c.lineTo(23,-70);c.stroke();
  }else{
    poly(c,[[-15,-10],[-12,-52],[0,-62],[13,-52],[16,-10],[0,-2]],'#7e8390','#273841',3);
    poly(c,[[-21,-51],[0,-63],[22,-51],[0,-39]],'#b3adbe','#2b3c40',3);
    const glow=c.createRadialGradient(0,-78,0,0,-78,46);glow.addColorStop(0,'#cdadff66');glow.addColorStop(1,'#b990ff00');c.fillStyle=glow;c.fillRect(-46,-124,92,92);
    ellipse(c,0,-78,17,19,'#4f4567');ellipse(c,-2,-81,13,14,'#b29adc');ellipse(c,-5,-86,5,5,'#e6dbff');
    c.strokeStyle='#b6a4d1';c.lineWidth=5;c.beginPath();c.arc(0,-78,25,.3,2.85);c.stroke();
    poly(c,[[-25,-70],[-26,-95],[-17,-84]],'#b4a9c5','#344142',2);
    poly(c,[[25,-70],[26,-95],[17,-84]],'#b4a9c5','#344142',2);
    c.strokeStyle='#e5d7ff';c.lineWidth=2;c.beginPath();c.moveTo(-5,-91);c.lineTo(2,-80);c.lineTo(-5,-75);c.lineTo(4,-65);c.stroke();
  }
  if(level>1){for(let i=0;i<level;i++){poly(c,[[-10+i*10,6],[-7+i*10,1],[-4+i*10,6],[-7+i*10,10]],'#e7c47c','#4c5739',1);}}
  return cv;
}

export function makeEnemy(type: string) {
  const cv=document.createElement('canvas');cv.width=128;cv.height=150;const c=cv.getContext('2d')!;
  c.translate(64,116);
  const boss=/boss|king|titan|warden/i.test(type), brute=/brute|tank|ogre|armou?r/i.test(type), wisp=/wisp|ghost|spirit|fly/i.test(type), fast=/runner|wolf|fast|scout/i.test(type);
  const scale=boss?1.45:brute?1.15:.86;c.scale(scale,scale);
  ellipse(c,2,4,17,6,'#071a2166');
  if(type==='crawler'){
    for(let i=0;i<3;i++){
      const y=-9-i*7;c.strokeStyle='#272a33';c.lineWidth=3;c.beginPath();c.moveTo(-5,y);c.lineTo(-17,y-5);c.lineTo(-23,y+3);c.moveTo(5,y);c.lineTo(17,y-5);c.lineTo(23,y+3);c.stroke();
      c.strokeStyle='#79758b';c.lineWidth=1;c.beginPath();c.moveTo(-6,y-1);c.lineTo(-17,y-6);c.moveTo(6,y-1);c.lineTo(17,y-6);c.stroke();
    }
    ellipse(c,0,-16,12,19,'#777089');ellipse(c,-3,-19,7,15,'#9586a2');
    poly(c,[[-10,-26],[-7,-36],[8,-36],[12,-26],[7,-22],[-6,-22]],'#4b4b61','#252e35',2);
    c.fillStyle='#f7d59c';c.fillRect(-7,-30,4,3);c.fillRect(4,-30,4,3);
    c.strokeStyle='#252e35';c.lineWidth=2;c.beginPath();c.moveTo(-7,-34);c.lineTo(-13,-42);c.moveTo(7,-34);c.lineTo(13,-42);c.stroke();
  }else if(type==='runner'){
    c.strokeStyle='#3c3831';c.lineWidth=5;c.beginPath();c.moveTo(-12,-13);c.lineTo(-17,2);c.moveTo(8,-13);c.lineTo(14,2);c.stroke();
    poly(c,[[-19,-14],[-15,-28],[9,-29],[18,-18],[12,-9],[-11,-8]],'#aa7458','#2d3631',2.5);
    poly(c,[[-16,-23],[-31,-33],[-27,-16],[-17,-13]],'#c18f65','#2d3631',2);
    poly(c,[[5,-28],[7,-44],[16,-37],[25,-45],[27,-28],[35,-22],[22,-16],[11,-18]],'#b7805b','#2d3631',2.5);
    poly(c,[[20,-30],[32,-23],[23,-21],[13,-24]],'#d2af7b','#d2af7b',0);
    c.fillStyle='#ead9aa';c.fillRect(21,-33,4,3);c.fillStyle='#263b33';c.fillRect(31,-24,5,4);
  }else if(wisp){
    const g=c.createRadialGradient(0,-19,1,0,-19,29);g.addColorStop(0,'#b4f5cc66');g.addColorStop(1,'#74c9ad00');c.fillStyle=g;c.fillRect(-30,-50,60,60);
    poly(c,[[-13,-27],[-9,-38],[4,-42],[15,-29],[12,-11],[18,-1],[4,-5],[-2,0],[-9,-6],[-16,-5]],'#80b6ab','#345955',2);
    ellipse(c,0,-29,9,11,'#c5dfc1');c.fillStyle='#254d47';c.fillRect(-5,-31,3,5);c.fillRect(3,-31,3,5);
  }else{
    c.strokeStyle='#242e30';c.lineWidth=7;c.lineCap='round';c.beginPath();c.moveTo(-7,-9);c.lineTo(-10,3);c.moveTo(7,-9);c.lineTo(11,3);c.stroke();
    poly(c,[[-14,-26],[-8,-34],[9,-34],[15,-24],[12,-7],[-11,-7]],boss?'#8f634c':brute?'#716b5a':fast?'#75644a':'#6b7058','#1d3030',2.5);
    poly(c,[[-14,-26],[-21,-16],[-16,-12],[-7,-22]],'#7c8d6c','#243b33',2);
    poly(c,[[14,-25],[23,-16],[18,-11],[7,-22]],'#809276','#243b33',2);
    ellipse(c,0,-39,11,12,boss?'#9d8070':'#8fa37b');
    poly(c,[[-11,-44],[-19,-48],[-11,-35]],'#93a67c','#2b4035',1.5);poly(c,[[11,-44],[18,-49],[10,-35]],'#93a67c','#2b4035',1.5);
    poly(c,[[-12,-44],[-7,-52],[5,-53],[13,-45],[11,-38],[-11,-38]],boss?'#735750':brute?'#78847d':'#3c4e45','#263933',2);
    c.fillStyle=boss?'#ffe89c':'#edd78c';c.fillRect(-7,-39,4,3);c.fillRect(3,-39,4,3);
    if(type==='shield'){
      poly(c,[[-21,-33],[-5,-34],[2,-25],[-2,-6],[-13,2],[-24,-8],[-27,-25]],'#6a8a92','#24393a',3);
      poly(c,[[-20,-29],[-9,-30],[-4,-24],[-7,-9],[-14,-4],[-21,-11],[-23,-23]],'#94b0aa','#b0bba4',1);
      c.strokeStyle='#d6c68e';c.lineWidth=2;c.beginPath();c.moveTo(-14,-26);c.lineTo(-14,-8);c.moveTo(-20,-19);c.lineTo(-8,-19);c.stroke();
    }else if(type==='healer'){
      poly(c,[[-14,-26],[0,-31],[14,-25],[18,-1],[-18,-1]],'#668b6d','#253d33',2);
      c.strokeStyle='#ab9b6b';c.lineWidth=3;c.beginPath();c.moveTo(23,2);c.lineTo(23,-50);c.stroke();
      ellipse(c,23,-51,8,9,'#6a9e75');ellipse(c,21,-53,4,5,'#b9de9e');
      poly(c,[[-13,-40],[0,-57],[14,-40]],'#759273','#2e4337',2);
    }else if(brute||boss){poly(c,[[-20,-29],[-24,-17],[-20,-4],[-9,0],[-4,-17],[-9,-28]],boss?'#b29063':'#818b78','#283d36',2);}
    else{c.strokeStyle='#ad9a72';c.lineWidth=3;c.beginPath();c.moveTo(20,-8);c.lineTo(22,-34);c.stroke();poly(c,[[22,-45],[17,-33],[26,-32]],'#bcc4ae','#2b4037',1);}
    if(boss){poly(c,[[-12,-48],[-14,-60],[-5,-55],[0,-64],[6,-55],[14,-59],[11,-48]],'#c2a165','#3f4337',2);poly(c,[[-12,-47],[-23,-64],[-21,-45],[-12,-39]],'#bba87c','#3f4337',2);poly(c,[[12,-47],[23,-64],[21,-45],[12,-39]],'#bba87c','#3f4337',2);}
  }
  return cv;
}
