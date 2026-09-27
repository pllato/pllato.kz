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
 await page.waitForFunction(()=>document.querySelector('#busy').hidden,{},{timeout:330000});
 const result=await page.locator('#status').textContent();assert.match(result,/Открыт/);console.log('REAL DWG:',(await page.locator('#report').textContent()).slice(0,600));
 assert.doesNotMatch(await page.locator('#report').textContent(),/достигнут предел/);
 if(process.env.DWG_LARGE_ROUNDTRIP){
 const originalReport=await page.locator('#report').textContent();
 await page.locator('#save').click();const pending=page.waitForEvent('download',{timeout:330000});await page.locator('#confirmExport').click();const out=await pending;
 assert.match(out.suggestedFilename(),/\.dwg$/);
 const fs=require('node:fs'),path=require('node:path'),dir=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'dwg-roundtrip-')),saved=path.join(dir,'large-roundtrip.dwg');await out.saveAs(saved);console.log('EXPORTED BYTES:',fs.statSync(saved).size);assert.match(fs.readFileSync(saved).subarray(0,6).toString(),/^AC10\d\d$/);
 await page.locator('#file').setInputFiles(saved);
 await page.waitForFunction(()=>document.querySelector('#filename').textContent==='large-roundtrip',{},{timeout:180000});
 assert.equal(await page.locator('#report').textContent(),originalReport);
 await page.locator('#plus').click();await page.locator('#minus').click();
 console.log('PASS native DWG export / reopen / identical scene report');
 await page.locator('#fit').click();await page.waitForTimeout(450);
 const beforePan=await page.locator('#canvas').screenshot();
 const viewport=await page.locator('#canvas').boundingBox();
 await page.mouse.move(viewport.x+viewport.width/2,viewport.y+viewport.height/2);await page.mouse.down();await page.mouse.move(viewport.x+viewport.width/2+80,viewport.y+viewport.height/2+50,{steps:10});await page.mouse.up();
 await page.locator('#fit').click();await page.waitForTimeout(450);
 assert.deepEqual(await page.locator('#canvas').screenshot(),beforePan);
 console.log('PASS large-view preview settles to identical exact pixels');
 fs.unlinkSync(saved);fs.rmdirSync(dir);
 }
 }
 await page.screenshot({path:'/private/tmp/dwg-prototype-'+(mobile?'mobile':'desktop')+'.png'});
 const retainedName=await page.locator('#filename').textContent(),retainedReport=await page.locator('#report').textContent();
 await page.locator('#file').setInputFiles({name:'broken.dxf',mimeType:'application/dxf',buffer:Buffer.from('broken')});
 await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Не удалось открыть'));
 assert.equal(await page.locator('#filename').textContent(),retainedName);assert.equal(await page.locator('#report').textContent(),retainedReport);
 await page.route('**/dwg/native-reader.mjs*',r=>r.fulfill({body:'self.onmessage=()=>{};',contentType:'application/javascript'}));
 await page.locator('#file').setInputFiles({name:'cancel.dwg',mimeType:'application/octet-stream',buffer:Buffer.from('AC1032')});await page.locator('#cancel').click();
 assert.equal(await page.locator('#filename').textContent(),retainedName);assert.equal(await page.locator('#report').textContent(),retainedReport);assert.equal(await page.locator('#file').isEnabled(),true);
 assert.deepEqual(errors,[]);console.log('PASS',mobile?'mobile':'desktop','edit / move / undo / export / reimport');await page.close();
 }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
