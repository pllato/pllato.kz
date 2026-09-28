const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});try{
 const page=await browser.newPage({viewport:{width:1600,height:1000}});await page.route('**/app/gate.js',r=>r.fulfill({body:''}));await page.goto('http://127.0.0.1:8817/app/stroy/dwg/');await page.waitForSelector('#focusWorkspace');
 const before=await page.locator('#canvas').boundingBox();assert.ok(before.width>1590);assert.ok(before.height>800,JSON.stringify(before));
 await page.locator('#panel').click();assert.ok(await page.locator('#sidebar').isVisible());assert.equal((await page.locator('#canvas').boundingBox()).width,before.width);await page.locator('.sidebarClose').click();assert.ok(!await page.locator('#sidebar').isVisible());
 await page.locator('#focusWorkspace').click();assert.ok((await page.locator('#canvas').boundingBox()).height>900);await page.locator('#focusWorkspace').click();
 await page.locator('.notice summary').click();assert.ok(await page.locator('.notice div').isVisible());await page.locator('.notice summary').click();
 await page.screenshot({path:'/private/tmp/dwg-compact-desktop.png'});
 await page.setViewportSize({width:390,height:844});assert.ok((await page.locator('#canvas').boundingBox()).height>580);await page.locator('#panel').click();await page.locator('.sidebarClose').click();await page.screenshot({path:'/private/tmp/dwg-compact-mobile.png'});console.log('PASS canvas area, overlay sidebar, focus mode, help, mobile');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
