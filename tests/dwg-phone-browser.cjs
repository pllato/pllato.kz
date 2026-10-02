const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});try{
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/app/gate.js',r=>r.fulfill({body:''}));
 await page.goto('http://127.0.0.1:8817/app/stroy/dwg/');await page.waitForSelector('#phoneTools');
 for(const size of [{width:390,height:844},{width:360,height:740},{width:600,height:800},{width:844,height:390}]){
  await page.setViewportSize(size);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  const box=await page.locator('#canvas').boundingBox();assert.ok(box.height>size.height*.5,JSON.stringify(box));
  await page.locator('#phoneTools>summary').tap();await page.locator('#showCableMarking').check();await page.locator('#showCableLengths').check();await page.screenshot({path:`/private/tmp/dwg-phone-tools-${size.width}.png`});
  await page.locator('[data-tool=line]').tap();assert.equal(await page.locator('#phoneTools').getAttribute('open'),null);
  await page.locator('[data-tool=object]').tap();
  await page.locator('#cableNavigator>.phonePanelToggle').tap();assert.equal(await page.locator('#cableNavigator>.phonePanelToggle').getAttribute('aria-expanded'),'true');await page.locator('#cableNavigator>.phonePanelToggle').tap();
  await page.screenshot({path:`/private/tmp/dwg-phone-${size.width}.png`});
 }
 await page.setViewportSize({width:1000,height:700});await page.locator('#historyButton').waitFor({state:'visible'});assert.equal(await page.locator('#phoneTools').isVisible(),false);assert.ok(await page.locator('#showCableMarking').isChecked());assert.ok(await page.locator('#historyButton').isVisible());
 await page.setViewportSize({width:390,height:844});await page.locator('#moreTools>summary').tap();assert.ok(await page.locator('#historyButton').isVisible());
 assert.deepEqual(errors,[]);console.log('PASS phone touch controls, canvas space, menus, catalog, breakpoint restoration');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
