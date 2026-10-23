import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[];
try{
const page=await browser.newPage({viewport:{width:1440,height:1000}});
page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:4173/');await page.waitForSelector('canvas');
assert.match(await page.title(),/弹珠防线/);
const state=()=>page.evaluate(()=>{const m=window.__pinball.model;return{phase:m.phase,gold:m.gold,towers:m.towers.length,balls:m.balls.length,paused:m.paused,wave:m.wave,fusions:m.fusionCount,ballReady:m.ballReady,paddleX:m.paddleX,score:m.score};});
async function point(x,y,click=false){const r=await page.locator('canvas').boundingBox();const px=r.x+x/900*r.width,py=r.y+y/1000*r.height;if(click)await page.mouse.click(px,py);else await page.mouse.move(px,py);}
async function pad(i){const p=await page.evaluate(async index=>(await import('/src/pinball/model.ts')).PADS[index],i);await point(p.x,p.y,true);}
await page.screenshot({path:'qa/pinball-desktop.png'});
assert.equal((await state()).towers,2);
await page.locator('#main-action').click();assert.equal((await state()).phase,'wave');assert.equal((await state()).balls,1);
await page.waitForTimeout(2500);assert.ok((await state()).fusions>=1,'first serve demonstrates the starter elemental link');
await page.keyboard.press('p');assert.equal((await state()).paused,true);
const time=await page.evaluate(()=>window.__pinball.model.time);await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>window.__pinball.model.time),time);
await page.locator('#pause-shade [data-action="pause"]').click();assert.equal((await state()).paused,false);
await point(680,900);await page.waitForTimeout(150);assert.ok((await state()).paddleX>620);
await page.keyboard.down('ArrowLeft');await page.waitForTimeout(150);await page.keyboard.up('ArrowLeft');assert.ok((await state()).paddleX<620);
await page.locator('[data-action="help"]').first().click();assert.equal((await state()).paused,true);await page.keyboard.press('Escape');assert.equal((await state()).paused,false);
// Build + inspect + upgrade + sell through actual pointer/UI.
await page.keyboard.press('3');await pad(3);assert.equal((await state()).towers,3);assert.equal(await page.evaluate(()=>window.__pinball.model.towers.at(-1).type),'storm');
await pad(0);await page.locator('[data-action="upgrade"]').click();assert.equal(await page.evaluate(()=>window.__pinball.model.towers[0].level),2);
await page.locator('[data-action="sell"]').click();assert.equal((await state()).towers,2);
await page.keyboard.press('4');await pad(4);await page.waitForTimeout(100);assert.equal((await state()).towers,2);assert.match(await page.locator('#toast').innerText(),/不足/);
await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>window.__pinball.model.buildType),null);
// Energy and terminal fixtures exercise UI states; campaign rules are tested separately without fixtures.
await page.evaluate(()=>{const m=window.__pinball.model;m.overdrive=100;window.__pinball.ui.render();});await page.keyboard.press('f');assert.ok(await page.evaluate(()=>window.__pinball.model.overdriveActive>7));
await page.evaluate(()=>{const m=window.__pinball.model;m.balls=[];m.ballReady=true;});await page.keyboard.press('Space');assert.equal((await state()).balls,1);
await page.evaluate(()=>{const m=window.__pinball.model;m.phase='build';m.perkChoices=['wide','echo','catalyst'];});await page.locator('[data-action="perk"][data-perk="echo"]').waitFor();await page.locator('[data-action="perk"][data-perk="echo"]').click();assert.equal(await page.evaluate(()=>window.__pinball.model.perks.includes('echo')),true);
// Real-money campaign simulation through player actions, then render a busy midpoint.
await page.evaluate(()=>{const{model:m}=window.__pinball;m.restart();const types=['storm','prism','fire','frost','fire','storm','prism','storm','frost','fire'];const order=[3,4,2,6,5,7,8,9,10,11];let ticks=0;
while(m.wave<6&&ticks++<12000){if(m.perkChoices.length)m.choosePerk(m.perkChoices.includes('echo')?'echo':m.perkChoices[0]);const next=order.find(p=>!m.towers.some(t=>t.pad===p));const weak=m.towers.find(t=>t.level<3);if(m.towers.length<6&&next!==undefined)m.build(next,types[order.indexOf(next)]);else if(weak){m.selectedPad=weak.pad;m.upgrade();}if(m.phase==='build')m.startWave();if(m.ballReady)m.launch();const b=m.balls.filter(b=>b.vy>0).sort((a,b)=>b.y-a.y)[0];if(b)m.movePaddle(b.x);if(m.overdrive>=100)m.activateOverdrive();m.update(1/60);m.events=[];}
for(let t=0;t<4;t+=1/60){const b=m.balls.filter(b=>b.vy>0).sort((a,b)=>b.y-a.y)[0];if(b)m.movePaddle(b.x);if(m.ballReady)m.launch();m.update(1/60);}m.paused=true;window.__pinball.ui.render();});
await page.waitForTimeout(100);await page.locator('#pause-shade').evaluate(e=>e.style.visibility='hidden');await page.screenshot({path:'qa/pinball-midgame.png'});await page.locator('#pause-shade').evaluate(e=>e.style.visibility='');
await page.evaluate(()=>{const m=window.__pinball.model;m.paused=false;m.phase='defeat';m.hp=0;m.bestScore=Math.max(m.bestScore,m.score);});await page.locator('.result-modal').waitFor();await page.screenshot({path:'qa/pinball-result.png'});
await page.locator('[data-action="restart"]').click();assert.equal((await state()).phase,'build');assert.equal((await state()).towers,2);
await page.evaluate(()=>{const m=window.__pinball.model;m.phase='wave';m.wave=12;m.queue=[];m.enemies=[];m.update(.1);});await page.locator('.result-modal').waitFor();assert.match(await page.locator('.result-modal').innerText(),/全部 12 波/);
await page.locator('[data-action="restart"]').click();await page.waitForTimeout(100);assert.ok(await page.evaluate(()=>Number(localStorage.getItem('pinball-best-v2'))>0));
await page.setViewportSize({width:1280,height:720});await page.waitForTimeout(150);await page.screenshot({path:'qa/pinball-laptop.png'});assert.ok(await page.locator('#main-action').evaluate(e=>e.getBoundingClientRect().bottom<=innerHeight));
await page.setViewportSize({width:390,height:844});await page.waitForTimeout(200);await page.screenshot({path:'qa/pinball-mobile.png',fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
// A touch-enabled context actually routes Phaser pointer input to the paddle.
const touch=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const mobile=await touch.newPage();mobile.on('pageerror',e=>errors.push(e.message));await mobile.goto('http://127.0.0.1:4173/');await mobile.waitForSelector('canvas');await mobile.locator('#main-action').tap();const rect=await mobile.locator('canvas').boundingBox();await mobile.touchscreen.tap(rect.x+rect.width*.72,rect.y+rect.height*.85);await mobile.waitForTimeout(120);assert.ok(await mobile.evaluate(()=>window.__pinball.model.paddleX>550));await touch.close();
assert.deepEqual(errors,[]);console.log('PASS: live serve fusion, paddle pointer/keyboard/touch, build/upgrade/sell/economy, pause/help, overdrive, re-serve, perks, midgame renderer, win/lose, best-score persistence, laptop/mobile. No page errors.');
}finally{await browser.close();}
