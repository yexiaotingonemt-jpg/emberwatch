import {chromium} from '@playwright/test';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';

const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[],requests=[];
try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},offline:true});
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',request=>{if(/^https?:/i.test(request.url()))requests.push(request.url());});
  await page.goto(pathToFileURL(resolve('release/弹珠防线.html')).href);
  await page.waitForSelector('canvas');
  assert.match(await page.title(),/弹珠防线/);
  assert.equal(await page.evaluate(()=>typeof window.__pinball),'undefined');
  assert.equal(await page.locator('#gold-value').innerText(),'220');

  // Launch the unmodified starter serve without a production debug hook.
  await page.locator('#main-action').click();
  await page.waitForFunction(()=>document.querySelector('#wave-value')?.textContent==='01 / 12');
  await page.waitForTimeout(2500);
  assert.match(await page.locator('#wave-value').innerText(),/01 \/ 12/);
  assert.match(await page.locator('#main-label').innerText(),/接住/);
  await page.screenshot({path:'qa/pinball-offline-serve.png'});
  await page.keyboard.press('p');
  assert.equal(await page.locator('#pause-shade').isVisible(),true);
  await page.locator('#pause-shade [data-action="pause"]').click();
  assert.equal(await page.locator('#pause-shade').isVisible(),false);
  await page.locator('[data-action="help"]').first().click();
  assert.match(await page.locator('.help-modal').innerText(),/弹珠|反弹/);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.help-modal').count(),0);
  assert.equal(await page.locator('#pause-shade').isVisible(),false);

  // Start fresh so the construction cost is checked against exactly 220 coins.
  await page.locator('[data-action="restart-confirm"]').click();
  await page.locator('[data-action="restart"]').click();
  assert.equal(await page.locator('#gold-value').innerText(),'220');
  await page.locator('[data-action="build"][data-type="storm"]').click();
  const rect=await page.locator('canvas').boundingBox();
  assert.ok(rect,'offline canvas exists');
  await page.mouse.click(rect.x+310/900*rect.width,rect.y+390/1000*rect.height);
  await page.waitForFunction(()=>document.querySelector('#gold-value')?.textContent==='90');
  assert.equal(await page.locator('#gold-value').innerText(),'90');
  assert.match(await page.locator('#selected-panel').innerText(),/雷霆线圈/);
  await page.screenshot({path:'qa/pinball-offline-desktop.png'});

  await page.setViewportSize({width:390,height:844});
  await page.waitForTimeout(200);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:'qa/pinball-offline-mobile.png',fullPage:true});
  assert.deepEqual(errors,[]);
  assert.deepEqual(requests,[]);
  console.log('PASS: 弹珠防线 file:// offline boot; production debug hook absent; starter serve, wave launch, pause/help, restart, storm construction 220→90, mobile layout; no HTTP requests or page errors.');
}finally{
  await browser.close();
}
