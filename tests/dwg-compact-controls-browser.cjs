const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});try{
 const page=await browser.newPage({viewport:{width:1400,height:900}});await page.route('**/app/gate.js',r=>r.fulfill({body:''}));await page.goto('http://127.0.0.1:8817/app/stroy/dwg/');await page.waitForSelector('#cnSettings');
 assert.equal(await page.locator('#cnSettings').getAttribute('open'),null);
 assert.ok((await page.locator('#cableNavigator').boundingBox()).height<85);
 await page.locator('#cnSettings summary').click();assert.ok(await page.locator('#cnBrand').isVisible());
 for(const id of ['cnBrand','cnSection'])assert.ok(await page.locator('#'+id).evaluate(input=>document.getElementById(input.getAttribute('list'))?.options.length>3));
 const visits=await page.evaluate(async()=>{const {mountSheetNavigator}=await import('./sheet-navigator.mjs');const select=document.createElement('select');select.innerHTML='<option value="one">One</option><option value="two">Two</option>';document.body.append(select);let visits=[];select.onchange=()=>visits.push(select.value);mountSheetNavigator(select);const menu=select.nextElementSibling;menu.querySelector('button').click();menu.querySelector('button').click();menu.querySelectorAll('button')[1].click();menu.remove();select.remove();return visits;});
 assert.deepEqual(visits,['one','one','two']);console.log('PASS collapsed cable navigator, editable catalog, repeated current-sheet navigation');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
