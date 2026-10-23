import Phaser from 'phaser';
import {PinballModel,PADS,WIDTH,HEIGHT,type TowerType} from './pinball/model';
import {PinballWorld} from './pinball/world';
import {PinballUI,type UIActions} from './pinball/ui';
import {PinballAudio} from './pinball/audio';
import './pinball/style.css';

function readBest(){try{const n=Number(localStorage.getItem('pinball-best-v2'));return Number.isFinite(n)&&n>=0?n:0;}catch{return 0;}}
const model=new PinballModel(readBest());
const audio=new PinballAudio();
try{if(localStorage.getItem('pinball-sound')==='off')audio.toggle();}catch{}
let ui:PinballUI;
let savedBest=model.bestScore,saveClock=0;
function saveBest(){model.bestScore=Math.max(model.bestScore,model.score);if(model.bestScore>savedBest){try{localStorage.setItem('pinball-best-v2',String(model.bestScore));savedBest=model.bestScore;}catch{}}}
const held=new Set<string>();
const playable=()=>!model.paused&&!model.perkChoices.length&&['build','wave'].includes(model.phase);
const unlock=()=>audio.unlock();
const actions:UIActions={
  build(type){unlock();if(!playable())return;model.buildType=type;model.selectedPad=null;ui.render();},
  startWave(){unlock();if(model.startWave())model.launch();ui.render();},
  launch(){unlock();model.launch();ui.render();},
  pause(){unlock();if(!['build','wave'].includes(model.phase)||model.perkChoices.length)return;model.paused=!model.paused;held.clear();ui.render();},
  upgrade(){unlock();model.upgrade();ui.render();},
  sell(){unlock();model.sell();ui.render();},
  overdrive(){unlock();if(!model.activateOverdrive()&&model.phase==='wave'&&model.overdrive<100)ui.toast('碰撞与击杀可为超载蓄能，达到 100% 后按 F。');ui.render();},
  restart(){unlock();held.clear();saveBest();model.restart();audio.setIntensity(false);ui.render();ui.toast('机台已重置 · 空格发射，移动挡板接球。');},
  choosePerk(id){unlock();model.choosePerk(id);ui.render();},
  toggleSound(){unlock();const enabled=audio.toggle();try{localStorage.setItem('pinball-sound',enabled?'on':'off');}catch{}ui.toast(enabled?'撞击音效已开启':'声音已关闭');},
  cancel(){model.buildType=null;model.selectedPad=null;ui.render();},
  setAim(delta){if(!playable())return;model.setAim(delta);ui.render();}
};
ui=new PinballUI(model,actions);
let renderClock=0,lastPhase=model.phase;
function tick(dt:number){
  if(playable()&&!document.querySelector('.modal')){
    const direction=(held.has('ArrowRight')||held.has('d')?1:0)-(held.has('ArrowLeft')||held.has('a')?1:0);
    if(direction)model.movePaddle(model.paddleX+direction*1000*Math.min(dt,.05));
  }
  model.update(dt);
  for(const e of model.events.splice(0)){
    audio.play(e.type,e.combo);if(e.text)ui.toast(e.text);
    if(e.type==='win'||e.type==='lose')saveBest();
  }
  if(lastPhase!==model.phase){audio.setIntensity(model.phase==='wave');lastPhase=model.phase;}
  renderClock+=dt;if(renderClock>1/15){ui.render();renderClock=0;}
  saveClock+=dt;if(saveClock>=1){saveBest();saveClock=0;}
}
const world=new PinballWorld({model,onTick:tick,onPointer(x){if(playable()&&!document.querySelector('.modal'))model.movePaddle(x);},onClick(x,y){
  unlock();if(x<0||y<0){actions.cancel();return;}if(!playable()||document.querySelector('.modal'))return;
  const pad=PADS.findIndex(p=>Math.hypot(p.x-x,p.y-y)<39);
  if(pad>=0){if(model.towers.some(t=>t.pad===pad)){model.selectedPad=pad;model.buildType=null;}else if(model.buildType)model.build(pad,model.buildType);else{model.selectedPad=pad;ui.toast('按 1–4 或点击塔卡，选择要建造的撞针。');}}
  else if(model.buildType){actions.cancel();}else model.launch();ui.render();
}});
const game=new Phaser.Game({type:Phaser.AUTO,parent:'battlefield',width:WIDTH,height:HEIGHT,backgroundColor:'#071321',antialias:true,audio:{noAudio:true},
  scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[world],fps:{target:60,smoothStep:true},render:{roundPixels:false}});
const resize=new ResizeObserver(()=>game.scale.refresh());resize.observe(document.getElementById('battlefield')!);
document.addEventListener('keydown',e=>{
  if(e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement||e.target instanceof HTMLSelectElement||document.querySelector('.modal'))return;
  const key=e.key.length===1?e.key.toLowerCase():e.key;
  if(['ArrowLeft','ArrowRight','a','d'].includes(key)){e.preventDefault();held.add(key);return;}
  if(e.repeat)return;
  if(e.code==='Space'){e.preventDefault();unlock();if(model.phase==='build')actions.startWave();else actions.launch();}
  else if(key==='p')actions.pause();else if(key==='f')actions.overdrive();else if(key==='q')actions.setAim(-1);else if(key==='e')actions.setAim(1);
  else if(['1','2','3','4'].includes(key))actions.build((['fire','frost','storm','prism'] as TowerType[])[Number(key)-1]);
  else if(key==='Escape')actions.cancel();
});
document.addEventListener('keyup',e=>held.delete(e.key.length===1?e.key.toLowerCase():e.key));
window.addEventListener('blur',()=>held.clear());
document.addEventListener('visibilitychange',()=>{held.clear();if(document.hidden&&model.phase==='wave'&&!model.paused){model.paused=true;ui.render();}});
document.getElementById('battlefield')!.addEventListener('wheel',e=>{if(model.ballReady||model.phase==='build'){e.preventDefault();actions.setAim(Math.sign(e.deltaY));}},{passive:false});
window.addEventListener('beforeunload',()=>{audio.dispose();resize.disconnect();});
if(import.meta.env.DEV)Object.assign(window,{__pinball:{model,actions,game,ui,step(seconds:number){for(let t=0;t<seconds;t+=1/180)model.update(1/180);ui.render();}}});
ui.render();
