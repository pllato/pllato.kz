const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,args:['--disable-gpu'],executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});try{
 const page=await browser.newPage({viewport:{width:1280,height:900},hasTouch:true});page.setDefaultTimeout(120000);page.on('dialog',d=>d.accept());const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/app/gate.js',r=>r.fulfill({body:''}));
 await page.route('**/editor.mjs*',async r=>{const response=await r.fetch();await r.fulfill({response,body:await response.text()+`\nwindow.offsetTest={state(){return doc.entities.filter(r=>r.type==='DIMENSION'&&get(r,2).startsWith('*DPLL')).map(r=>({id:r.id,f:dimensionDefinition(r),text:doc.blocks.get(get(r,2)).records.filter(c=>c.type==='TEXT').map(c=>get(c,1))}));}};`});});
 await page.goto('http://127.0.0.1:8817/app/stroy/dwg/');await page.locator('#file').setInputFiles(process.env.DWG_TEST_FILE);await page.waitForFunction(()=>document.querySelector('#busy').hidden);
 const initial=await page.evaluate(()=>offsetTest.state().length);
 for(const axis of ['horizontal','vertical']){
  await page.getByRole('button',{name:'Отступ',exact:true}).click();await page.getByLabel('Направление отступа').selectOption(axis);
  const box=await page.locator('#canvas').boundingBox();for(const [x,y] of [[220,180],[450,360],[180,390]]){if(axis==='vertical')await page.touchscreen.tap(box.x+x,box.y+y);else await page.mouse.click(box.x+x,box.y+y);}
  await page.locator('#dimensionWorkbench').waitFor({state:'visible'});await page.locator('#dimensionWorkbench input[name="length"]').fill('1234');await page.getByRole('button',{name:'Применить размер'}).click();
  const state=await page.evaluate(()=>offsetTest.state());assert.ok(Math.abs(state.at(-1).f.length-1234)<1e-6);assert.deepEqual(state.at(-1).text,['1234']);assert.equal(Math.round(state.at(-1).f.d[axis==='vertical'?1:0]),1);
  await page.locator('#undo').click();assert.notEqual((await page.evaluate(()=>offsetTest.state())).at(-1).f.length,1234);await page.locator('#redo').click();assert.ok(Math.abs((await page.evaluate(()=>offsetTest.state())).at(-1).f.length-1234)<1e-6);
 }
 assert.equal((await page.evaluate(()=>offsetTest.state())).length,initial+2);
 await page.getByRole('button',{name:'Отступ',exact:true}).click();await page.keyboard.press('Escape');assert.equal((await page.evaluate(()=>offsetTest.state())).length,initial+2);
 await page.locator('#save').click();const pending=page.waitForEvent('download');await page.locator('#confirmExport').click();await(await pending).saveAs('/private/tmp/dwg-offset-created-ui.dwg');await page.locator('#file').setInputFiles('/private/tmp/dwg-offset-created-ui.dwg');await page.waitForFunction(()=>document.querySelector('#busy').hidden);
 const restored=await page.evaluate(()=>offsetTest.state());assert.equal(restored.length,initial+2);for(const row of restored.slice(initial)){assert.ok(Math.abs(row.f.length-1234)<1e-6);assert.deepEqual(row.text,['1234']);}assert.deepEqual(errors,[]);console.log('PASS offset H/V mouse + touch, numeric edit, undo-redo, cancel, DWG save/reopen');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
