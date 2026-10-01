const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,args:['--disable-gpu'],executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});try{
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/app/gate.js',r=>r.fulfill({body:''}));
 await page.route('**/editor.mjs*',async r=>{const response=await r.fetch();await r.fulfill({response,body:await response.text()+`\nwindow.noteTest={doc:()=>doc,current:()=>current(),focus:()=>{const kind=${JSON.stringify(process.env.DWG_NOTE_KIND||'MTEXT')};const s=drawing.shapes.find(s=>s.text&&(kind!=='MTEXT'||s.text.includes('Труба'))&&recordById(s.entityId)?.type===kind);if(!s)throw Error('No note');view={s:30/s.height,x:width/2-s.pts[0][0]*30/s.height,y:height/2+s.pts[0][1]*30/s.height};draw();return {point:screen(s.pts[0]),text:s.text};}};`});});
 await page.goto('http://127.0.0.1:8817/app/stroy/dwg/');
 await page.locator('#file').setInputFiles(process.env.DWG_TEST_FILE);await page.waitForFunction(()=>document.querySelector('#busy').hidden,null,{timeout:120000});
 const info=await page.evaluate(()=>noteTest.focus()),b=await page.locator('#canvas').boundingBox();
 await page.mouse.click(b.x+info.point[0]+5,b.y+info.point[1]+5);
 await page.locator('#noteDialog').waitFor({state:'visible'});
 const original=await page.locator('#noteValue').inputValue();assert.ok(original.length);
 for(const width of [800,390,1280]){await page.setViewportSize({width,height:900});const box=await page.locator('#noteDialog').evaluate(d=>({overflow:d.scrollWidth>d.clientWidth+1,right:d.getBoundingClientRect().right}));assert.equal(box.overflow,false);assert.ok(box.right<=width);}
 await page.locator('#noteValue').fill('Труба ПНД %%C16мм\nНовая запись');await page.locator('#noteHeight').fill('275');
 await page.screenshot({path:'/private/tmp/dwg-note-edit-dialog.png'});
 await page.getByRole('button',{name:'Применить',exact:true}).filter({visible:true}).click();
 assert.equal(await page.evaluate(()=>noteTest.doc().nativeOps.at(-1).text),'Труба ПНД %%C16мм\\PНовая запись');
 await page.locator('#undo').click();await page.locator('#redo').click();
 assert.equal(await page.evaluate(()=>noteTest.doc().nativeOps.at(-1).textHeight),275);
 const result=await page.evaluate(async()=>{const {captureRecovery,replayRecovery}=await import('./recovery.mjs');return captureRecovery(noteTest.doc()).ops.at(-1);});assert.equal(result.textHeight,275);
 await page.locator('#save').click();const download=page.waitForEvent('download',{timeout:120000});await page.locator('#confirmExport').click();const file=await download;await file.saveAs('/private/tmp/dwg-note-ui-output.dwg');
 assert.deepEqual(errors,[]);console.log('Real MTEXT click / textarea / size / undo / redo / recovery op / DWG download PASS');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
