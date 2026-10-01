// Private DWG and optional licensed TTF stay local; exports are temporary copies.
const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{if(!process.env.DWG_TEST_FILE)throw Error('Set DWG_TEST_FILE');const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});try{
 const page=await browser.newPage();page.setDefaultTimeout(180000);await page.route('**/app/gate.js',r=>r.fulfill({body:''}));await page.goto('http://127.0.0.1:8817/app/stroy/dwg/');
 if(process.env.DWG_TTF_FILE)await page.evaluate(async bytes=>{const {importTtf}=await import('./local-ttf.mjs');await importTtf(new File([new Uint8Array(bytes)],'times.ttf'));},[...fs.readFileSync(process.env.DWG_TTF_FILE)]);
 await page.locator('#file').setInputFiles(process.env.DWG_TEST_FILE);await page.waitForFunction(()=>document.querySelector('#busy').hidden);
 await page.locator('#executiveExports summary').click();await page.locator('#exportScope').selectOption('all');
 if(process.env.DWG_EXPECT_FONT_ERROR){await page.locator('#exportExecutivesPdf').click();await page.locator('#exportFailure').waitFor({state:'visible'});assert.match(await page.locator('#exportFailure').textContent(),/Times New Roman/);assert.ok(await page.locator('#busy').isHidden());console.log('PASS missing font displayed in export menu; editor unblocked');return;}
 const download=page.waitForEvent('download'),start=Date.now();await page.locator('#exportExecutivesPdf').click();const file=await download,dir=fs.mkdtempSync('/private/tmp/pllato-pdf-ui-');await file.saveAs(dir+'/export.pdf');await page.waitForFunction(()=>document.querySelector('#busy').hidden);assert.match(fs.readFileSync(dir+'/export.pdf').subarray(0,8).toString(),/^%PDF-1\./);console.log('PASS actual PDF button and download',{ms:Date.now()-start,dir});
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
