const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 try{
 for(const mobile of [false,true]){
 const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},hasTouch:mobile,isMobile:mobile});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 // Только локальный UI-тест, без изготовления токенов доступа.
 await page.route('http://127.0.0.1:8816/app/gate.js',r=>r.fulfill({body:'',contentType:'application/javascript'}));
 await page.goto('http://127.0.0.1:8816/app/stroy/dwg/');await page.waitForFunction(()=>document.querySelector('#report').textContent.includes('4 видимых'));
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await page.locator('[data-tool=line]').click();const box=await page.locator('#canvas').boundingBox();
 await page.mouse.click(box.x+box.width*.3,box.y+box.height*.4);await page.mouse.click(box.x+box.width*.6,box.y+box.height*.5);
 assert.match(await page.locator('#report').textContent(),/5 видимых/);
 await page.locator('#undo').click();assert.match(await page.locator('#report').textContent(),/4 видимых/);await page.locator('#redo').click();
 await page.locator('[data-tool=select]').click();
 await page.mouse.click(box.x+box.width*.45,box.y+box.height*.45);
 if(mobile)await page.locator('#panel').click();
 await page.locator('#dx').fill('100');await page.locator('#props button[type=submit]').click();
 await page.locator('#save').click();const downloaded=page.waitForEvent('download');await page.locator('#confirmExport').click();
 const download=await downloaded;const stream=await download.createReadStream();let parts=[];for await(const p of stream)parts.push(p);
 const body=Buffer.concat(parts).toString();assert.match(body,/SECTION/);assert.match(body,/AcDbLine/);
 if(mobile)await page.locator('#panel').click();
 await page.locator('#file').setInputFiles({name:'roundtrip.dxf',mimeType:'application/dxf',buffer:Buffer.from(body)});
 await page.waitForFunction(()=>document.querySelector('#filename').textContent==='roundtrip');
 assert.match(await page.locator('#report').textContent(),/5 видимых/);
 if(!mobile&&process.env.DWG_TEST_FILE){
 await page.locator('#file').setInputFiles(process.env.DWG_TEST_FILE);
 await page.waitForFunction(()=>document.querySelector('#busy').hidden,{},{timeout:100000});
 const result=await page.locator('#status').textContent();assert.match(result,/Открыт/);console.log('REAL DWG:',(await page.locator('#report').textContent()).slice(0,600));
 }
 await page.screenshot({path:'/private/tmp/dwg-prototype-'+(mobile?'mobile':'desktop')+'.png'});
 assert.deepEqual(errors,[]);console.log('PASS',mobile?'mobile':'desktop','edit / move / undo / export / reimport');await page.close();
 }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
