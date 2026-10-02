const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/app/gate.js',r=>r.fulfill({body:''}));
 await page.goto('http://127.0.0.1:8817/app/stroy/dwg/');await page.waitForSelector('#moreTools');
 for(const width of [1600,800,390]){
  await page.setViewportSize({width,height:1000});
  assert.equal(await page.locator('#drawingToolbar').evaluate(e=>e.firstElementChild.id),'historyActions');
  assert.ok(await page.locator('#drawingToolbar').evaluate(e=>e.scrollWidth<=e.clientWidth+1),'toolbar must wrap');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no page horizontal overflow');
  assert.equal(await page.locator('#shxFonts').isVisible(),false);
  await page.locator('#moreTools>summary').click();
  for(const s of ['#shxFonts','#panel','[data-tool=text]','[data-tool=measure]'])assert.ok(await page.locator(s).isVisible());
  assert.equal(await page.locator('#moreTools summary').filter({hasText:'Лист'}).count(),1);
  assert.equal(await page.locator('#moreTools summary').filter({hasText:'Калибровка длины'}).count(),1);
  await page.screenshot({path:`/private/tmp/dwg-toolbar-${width}.png`});
  await page.locator('[data-tool=measure]').click();assert.equal(await page.locator('#moreTools').getAttribute('open'),null);
  await page.locator('[data-tool=object]').click();
 }
 assert.deepEqual(errors,[]);console.log('PASS history left, rare tools menu, 1600/800/390px wrapping and usable actions');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
