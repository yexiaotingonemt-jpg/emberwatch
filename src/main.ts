import Phaser from 'phaser';
import {GameModel, TOWERS, type TowerType} from './model';
import {World} from './world';
import {GameUI, type UIActions} from './ui';
import {AudioEngine} from './audio';
import './style.css';

function readBest():Record<string,number>{try {const data=JSON.parse(localStorage.getItem('emberwatch-best-v1')||'{}');const best:Record<string,number>={};for(const [k,v] of Object.entries(data))if(['0','1','2'].includes(k)&&typeof v==='number'&&v>=0&&v<=3)best[k]=v;return best;}catch{return {};}}
const model=new GameModel(0,readBest());
const audio=new AudioEngine();
try{if(localStorage.getItem('emberwatch-sound')==='off')audio.toggle();}catch{/* Private mode can block storage. */}
let ui:GameUI;
const usable=()=>['wave','build'].includes(model.phase)&&!model.perkChoices.length;
const wakeAudio=()=>audio.unlock();
function clearSelection(){model.selectedPad=null;model.buildType=null;model.targeting=false;}
function selectPad(pad:number){wakeAudio();if(model.targeting){model.meteor(...model.map.pads[pad]);return;}if(!usable())return;
  if(model.towers.some(t=>t.pad===pad)){model.selectedPad=pad;model.buildType=null;audio.play('click');}
  else if(model.buildType){if(model.build(pad,model.buildType))model.buildType=null;}
  else{model.selectedPad=pad;ui.toast('选择右侧防御塔，再点击营地即可建造。');}ui.render();}
const actions:UIActions={
  build(type:TowerType){wakeAudio();if(!usable())return;model.buildType=type;model.selectedPad=null;model.targeting=false;audio.play('click');ui.render();},
  startWave(){wakeAudio();model.startWave();ui.render();},
  selectPad(pad:number|null){if(pad===null)clearSelection();else selectPad(pad);ui.render();},
  upgrade(branch){wakeAudio();model.upgrade(branch);ui.render();},
  sell(){wakeAudio();model.sell();ui.render();},
  speed(){model.speed=model.speed===1?2:model.speed===2?3:1;audio.play('click');ui.render();},
  pause(){wakeAudio();if(!usable())return;model.paused=!model.paused;audio.play('click');ui.render();},
  ability(){wakeAudio();if(model.phase!=='wave'){ui.toast('陨星将在敌人来袭时可用。');return;}if(model.paused)return;if(model.abilityCooldown>0){ui.toast(`陨星正在凝聚，剩余 ${Math.ceil(model.abilityCooldown)} 秒。`);return;}model.targeting=!model.targeting;model.buildType=null;model.selectedPad=null;if(model.targeting)ui.toast('点击战场投下陨星 · Esc 取消');ui.render();},
  restart(){wakeAudio();model.restart();audio.setIntensity(false);ui.render();ui.toast('灯火已重新点亮。建造防御，迎接长夜。');},
  chooseMap(id){wakeAudio();model.restart(id);audio.setIntensity(false);ui.render();ui.toast(`抵达${model.map.name} · 建造防御塔，守住 15 波进攻。`);},
  choosePerk(id){wakeAudio();model.choosePerk(id);ui.render();},
  toggleSound(){wakeAudio();const enabled=audio.toggle();try{localStorage.setItem('emberwatch-sound',enabled?'on':'off');}catch{}ui.toast(enabled?'森林之声已开启':'声音已关闭');}
};
ui=new GameUI(model,actions);
let lastRender=0, lastPhase=model.phase;
function tick(dt:number){model.update(dt);for(const event of model.events.splice(0)){
  audio.play(event.type);
  if(event.text)ui.toast(event.text);
  if(event.type==='victory'){try{localStorage.setItem('emberwatch-best-v1',JSON.stringify(model.best));}catch{}}
}
  if(lastPhase!==model.phase){audio.setIntensity(model.phase==='wave');lastPhase=model.phase;}
  lastRender+=dt;if(lastRender>.08){ui.render();lastRender=0;}
}
const world=new World({model,onPad:selectPad,onGround(x,y){if(x<0||y<0){clearSelection();ui.render();return;}if(model.targeting){model.meteor(x,y);ui.render();}else{clearSelection();ui.render();}},onTick:tick});
const game=new Phaser.Game({type:Phaser.AUTO,parent:'battlefield',width:1100,height:740,backgroundColor:'#1e302a',antialias:true,
  scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[world],audio:{noAudio:true},render:{roundPixels:false},fps:{target:60,smoothStep:true}});
const resize=new ResizeObserver(()=>game.scale.refresh());resize.observe(document.getElementById('battlefield')!);
document.addEventListener('pointerdown',wakeAudio,{once:true});
document.addEventListener('keydown',e=>{
  if(e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement||e.target instanceof HTMLSelectElement)return;
  if(e.key==='Escape'){clearSelection();ui.render();return;}
  if(document.querySelector('dialog[open], .modal:not([hidden]):not(.hidden)'))return;
  if(e.repeat)return;
  if(['1','2','3','4'].includes(e.key)){e.preventDefault();actions.build((Object.keys(TOWERS) as TowerType[])[Number(e.key)-1]);}
  else if(e.code==='Space'){e.preventDefault();actions.startWave();}
  else if(e.key.toLowerCase()==='p')actions.pause();
  else if(e.key.toLowerCase()==='f')actions.ability();
});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&model.phase==='wave'&&!model.paused){model.paused=true;ui.render();}});
window.addEventListener('beforeunload',()=>{audio.dispose();resize.disconnect();});
// Repeatable playtest access is compiled out of release builds.
if(import.meta.env.DEV){
  Object.assign(window,{__emberwatch:{model,actions,game,step:(seconds:number)=>{for(let t=0;t<seconds;t+=.05)model.update(.05);ui.render();}}});
}
ui.render();
