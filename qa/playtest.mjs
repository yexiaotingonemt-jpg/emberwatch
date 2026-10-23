import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:4173');await page.waitForSelector('canvas');
const read=fn=>page.evaluate(fn);
const state=()=>read(()=>{const m=window.__emberwatch.model;return{gold:m.gold,towers:m.towers.length,phase:m.phase,paused:m.paused,wave:m.wave,speed:m.speed,cooldown:m.abilityCooldown,kills:m.kills,map:m.map.id};});
async function clickWorld(x,y){const r=await page.locator('canvas').boundingBox();await page.mouse.click(r.x+x/1100*r.width,r.y+y/740*r.height);}
// read helper with argument for canvas positions.
async function clickPad(index){const xy=await page.evaluate(i=>window.__emberwatch.model.map.pads[i],index);await clickWorld(...xy);}
await page.locator('[data-type="arrow"]').click();await clickPad(0);
assert.equal((await state()).gold,280);assert.equal((await state()).towers,1);
await clickWorld(140,220);assert.equal(await read(()=>window.__emberwatch.model.selectedPad),0,'tower upper body is selectable');
await page.locator('[data-type="cannon"]').click();await clickPad(4);
await page.locator('[data-type="frost"]').click();await clickPad(7);
assert.equal((await state()).gold,60);
await page.locator('[data-type="storm"]').click();await clickPad(8);await page.waitForTimeout(150);
assert.equal((await state()).towers,3);assert.match(await page.locator('#toast').innerText(),/金币不足/);
// Real key binding and real combat render.
await page.keyboard.press('Space');await page.waitForTimeout(200);assert.equal((await state()).phase,'wave');
await page.locator('[data-action="speed"]').click();assert.equal((await state()).speed,2);
await page.keyboard.press('p');assert.equal((await state()).paused,true);await page.locator('#pause-shade').waitFor({state:'visible'});
await page.locator('#pause-shade [data-action="pause"]').click();assert.equal((await state()).paused,false);
await page.locator('[data-action="help"]').first().click();assert.equal((await state()).paused,true);
await page.keyboard.press('Escape');assert.equal((await state()).paused,false);
await page.keyboard.press('f');await clickWorld(180,200);assert.ok((await state()).cooldown>35);
// Right click cancels a pending cast without consuming cooldown.
await page.evaluate(()=>{window.__emberwatch.model.abilityCooldown=0;});await page.keyboard.press('f');
const canvas=await page.locator('canvas').boundingBox();await page.mouse.click(canvas.x+300,canvas.y+200,{button:'right'});
assert.equal(await page.evaluate(()=>window.__emberwatch.model.targeting),false);assert.equal((await state()).cooldown,0);
// Inspector branch choice and sell use visible UI.
await page.evaluate(()=>{window.__emberwatch.model.gold=500;});await clickPad(0);
await page.locator('[data-action="upgrade"][data-branch="b"]').click();
assert.equal(await page.evaluate(()=>window.__emberwatch.model.towers[0].branch),'b');
await page.locator('[data-action="upgrade"][data-branch="b"]').click();
assert.equal(await page.evaluate(()=>window.__emberwatch.model.towers[0].level),3);
await page.locator('[data-action="sell"]').click();assert.equal((await state()).towers,2);
// Map dialog switches the underlying scene and resets run.
await page.locator('[data-action="maps"]').first().click();await page.locator('[data-action="choose-map"][data-map="1"]').click();
assert.equal((await state()).map,1);assert.equal((await state()).wave,0);assert.equal((await state()).towers,0);
await page.waitForTimeout(300);await page.screenshot({path:'qa/wetland.png'});
// Stage a busy representative wave and ensure all renderer variants work together.
await page.evaluate(()=>{const{model:m,actions:a}=window.__emberwatch;m.restart(0);m.gold=5000;['arrow','cannon','frost','storm','arrow','storm','frost','cannon'].forEach((type,i)=>{m.build([0,2,4,7,8,10,12,13][i],type);m.upgrade(i%2?'a':'b');m.upgrade(i%2?'a':'b');});m.wave=11;m.startWave();m.speed=1;});
await page.evaluate(()=>window.__emberwatch.step(20));await page.waitForTimeout(300);
await page.screenshot({path:'qa/battle.png'});
assert.ok((await state()).kills>0);
// Perk modal offers actual choices and dismisses only after selection.
await page.evaluate(()=>{const m=window.__emberwatch.model;m.phase='build';m.perkChoices=['keen','fury','fortune'];});
await page.waitForTimeout(150);await page.locator('[data-action="perk"][data-perk="fury"]').click();
assert.equal(await page.evaluate(()=>window.__emberwatch.model.perks.includes('fury')),true);
// Defeat and restart.
await page.evaluate(()=>{const m=window.__emberwatch.model;m.phase='defeat';m.hp=0;});await page.waitForTimeout(200);
assert.match(await page.locator('.result-modal').innerText(),/守望|余烬|光/);await page.screenshot({path:'qa/defeat.png'});
await page.locator('[data-action="restart"]').click();assert.equal((await state()).phase,'build');
// Actual result event saves stars, reload reads local records.
await page.evaluate(()=>{const m=window.__emberwatch.model;m.build(0,'arrow');m.wave=14;m.startWave();m.enemies=[];m.queue=[];m.update(.01);});
await page.waitForTimeout(200);assert.match(await page.locator('.result-modal').innerText(),/守望|余烬|光/);
await page.screenshot({path:'qa/victory.png'});
assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('emberwatch-best-v1'))['0']),3);
await page.reload();await page.waitForSelector('canvas');assert.match(await page.locator('#best-value').innerText(),/★★★/);
// Small laptop and narrow mobile keep controls reachable without horizontal overflow.
await page.setViewportSize({width:1280,height:720});await page.waitForTimeout(200);await page.screenshot({path:'qa/laptop.png'});
assert.ok(await page.locator('#start-button').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight));
await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);await page.screenshot({path:'qa/mobile.png',fullPage:true});
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
await page.locator('[data-type="arrow"]').click();await clickPad(0);assert.equal((await state()).towers,1);
assert.deepEqual(errors,[]);
console.log('PASS: actual pointer/keyboard build, insufficient gold, combat, pause/resume, help, meteor/cancel, upgrades, sell, map switch, perks, results, storage, laptop & mobile. No page errors.');
await browser.close();
