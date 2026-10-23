import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';

const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage({viewport:{width:1280,height:850}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const hp of [1,2]){
    await page.goto('http://127.0.0.1:4173/');await page.waitForSelector('canvas');
    await page.locator('#main-action').click();
    await page.evaluate(hp=>{const m=window.__pinball.model;m.hp=hp;m.balls=[m.makeBall(790,1024,100,620)];m.ballReady=false;},hp);
    if(hp===1){
      await page.locator('.result-modal').waitFor();
      const message=await page.locator('#toast').innerText();
      assert.match(message,/核心已失守.*再来一局/);assert.doesNotMatch(message,/重新发射|按空格/);
      assert.equal(await page.evaluate(()=>window.__pinball.model.balls.length),0);
      await page.screenshot({path:'qa/pinball-fatal-drain.png'});
      await page.locator('[data-action="restart"]').click();
    }else{
      await page.waitForFunction(()=>window.__pinball.model.hp===1&&window.__pinball.model.ballReady);
      assert.equal(await page.locator('.result-modal').count(),0);
      assert.match(await page.locator('#toast').innerText(),/按空格.*重新发射/);
      await page.keyboard.press('Space');
      assert.equal(await page.evaluate(()=>window.__pinball.model.balls.length),1);
      await page.locator('[data-action="restart-confirm"]').click();
      await page.locator('[data-action="restart"]').click();
    }
    assert.equal(await page.locator('#hp-value').innerText(),'20 / 20');
    await page.locator('#main-action').click();
    assert.equal(await page.evaluate(()=>window.__pinball.model.phase),'wave');
    assert.equal(await page.evaluate(()=>window.__pinball.model.balls.length),1);
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: 1 HP fatal drain shows restart guidance; 2 HP ordinary drain still supports Space re-serve; both restart and launch normally. No page errors.');
}finally{await browser.close();}
