const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
try{
 const [width,height]=String(process.env.DWG_VIEWPORT||'1280x900').split('x').map(Number),touch=process.env.DWG_TOUCH!=='0';const page=await browser.newPage({viewport:{width,height},hasTouch:touch}),errors=[];let writers=0;
 page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE',e.message);});page.on('requestfailed',r=>console.error('REQUEST',r.url(),r.failure()?.errorText));await page.addInitScript(()=>localStorage.setItem('pllato_dwg_guide_v1','{"seen":true}'));
 await page.route('**/app/gate.js',r=>r.fulfill({body:''}));
 await page.route('**/editor.mjs*',async r=>{const response=await r.fetch();await r.fulfill({response,body:await response.text()+'\nglobalThis.pendingTest={doc:()=>doc,drawing:()=>drawing,fit,save:saveDwg,restore:()=>undo(false)};'});});
 await page.route('**/executive-worker.mjs*',r=>{writers++;return r.fulfill({contentType:'application/javascript',body:'self.onmessage=()=>self.postMessage({error:"Проверочный отказ DWG"});'});});
 await page.route('**/test-times.ttf',r=>r.fulfill({contentType:'font/ttf',body:fs.readFileSync(process.env.DWG_TEST_TTF||'/System/Library/Fonts/Supplemental/Times New Roman.ttf')}));
 await page.goto('http://127.0.0.1:8817/app/stroy/dwg/');await page.waitForFunction(()=>globalThis.pendingTest);
 await page.locator('#file').setInputFiles(process.env.DWG_SYNTHETIC_FIXTURE);
 await page.waitForFunction(()=>document.querySelector('#busy').hidden&&pendingTest.doc().native);
 await page.locator('#units').selectOption('.001',{force:true});
 for(let i=1;i<=3;i++){
  await page.evaluate(()=>pendingTest.fit());if(await page.locator('#phoneTools>summary').isVisible())await page.locator('#phoneTools').evaluate(e=>e.open=true);await page.locator('#exCreateIcon').click();
  const b=await page.locator('#canvas').boundingBox();if(touch){const cdp=await page.context().newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+2,y:b.y+2}]});for(let k=1;k<=10;k++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:b.x+2+(b.width-4)*k/10,y:b.y+2+(b.height-4)*k/10}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();}else{await page.mouse.move(b.x+2,b.y+2);await page.mouse.down();await page.mouse.move(b.x+b.width-2,b.y+b.height-2,{steps:10});await page.mouse.up();}
  await page.waitForFunction(n=>pendingTest.doc().executiveProject?.sheets.length===n&&document.querySelector('#busy').hidden,i);
  assert.equal(writers,0);assert.equal(await page.locator('#exError').isVisible(),false);
 }
 const pdfInfo=await page.evaluate(async()=>{
  const {importTtf}=await import('./local-ttf.mjs');await importTtf(new File([await (await fetch('./test-times.ttf')).arrayBuffer()],'Times New Roman.ttf'));
  const {executivePdf,executivePages}=await import('./executive-export.mjs');const p=pendingTest.doc().executiveProject;const blob=await executivePdf(p,pendingTest.drawing().shapes,()=>{});
  const bytes=new Uint8Array(await blob.arrayBuffer());return {header:new TextDecoder().decode(bytes.subarray(0,5)),size:bytes.length,plans:executivePages(p,pendingTest.drawing().shapes).every(page=>page.shapes.some(s=>s.id==='executive-preview-'+page.sheet.id))};
 });assert.equal(pdfInfo.plans,true);assert.equal(pdfInfo.header,'%PDF-');assert.ok(pdfInfo.size>1000);
 assert.equal(await page.evaluate(()=>pendingTest.doc().executiveProject.sheets.every(s=>s.sourcePlan&&s.nativeHandles.length===0)),true);
 assert.ok(await page.evaluate(()=>pendingTest.drawing().shapes.some(s=>s.id.startsWith('executive-preview-'))));
 await page.evaluate(async()=>{const {offerDownload}=await import('./download.mjs?v=0.17.96');offerDownload(new Blob(['old']), 'previous.dwg',{touch:true});});
 await page.locator('.downloadReady .formatClose').click();await page.locator('.downloadRetry').waitFor({state:'visible'});assert.equal(await page.locator('.downloadRetry:visible').count(),1);
 await page.evaluate(()=>pendingTest.save());await page.waitForSelector('.downloadReady',{state:'visible'});
 assert.match(await page.locator('.downloadReady').innerText(),/Файл не сохранён/);assert.equal(writers,1);
 assert.equal(await page.evaluate(()=>pendingTest.doc().executiveProject.sheets.length),3);
 assert.equal(await page.locator('.downloadRetry:visible').count(),0);
 await page.locator('.downloadReady button').click();await page.evaluate(()=>pendingTest.restore());
 await page.waitForFunction(()=>pendingTest.doc().executiveProject?.sheets.length===2&&document.querySelector('#busy').hidden);
 assert.ok(await page.evaluate(()=>pendingTest.drawing().shapes.some(s=>s.id.startsWith('executive-preview-'))));
 await page.unroute('**/executive-worker.mjs*');
 const actualDownload=page.waitForEvent('download',{timeout:120000});
 const saving=page.evaluate(()=>pendingTest.save());
 await page.locator('.downloadReady .downloadReadyLink').waitFor({state:'visible',timeout:120000});
 await page.locator('.downloadReady .downloadReadyLink').click();
 const download=await actualDownload;await saving;
 const out=process.env.DWG_BROWSER_OUTPUT||'/tmp/pending-'+width+'x'+height+'-v96.dwg';await download.saveAs(out);
 assert.equal(fs.readFileSync(out).subarray(0,6).toString(),'AC1032');
 assert.equal(await page.evaluate(()=>pendingTest.doc().executiveProject.sheets.length),2);
 assert.deepEqual(errors,[]);console.log(width+'x'+height+' '+(touch?'touch':'desktop')+' PDF '+pdfInfo.size+' bytes; PASS: three immediate area creates without writer; retained preview/recovery on DWG refusal; no stale output; undo restores two sheets; real full DWG download succeeds');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
