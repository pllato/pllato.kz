const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});try{
 const page=await browser.newPage({viewport:{width:1400,height:1000}});page.setDefaultTimeout(120000);const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.route('**/app/gate.js',r=>r.fulfill({body:''}));
 await page.addInitScript(()=>{window.paintedLabels=[];const original=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(text,...args){if(String(text).startsWith('С учётом отпусков'))window.paintedLabels.push(text);return original.call(this,text,...args);};});
 await page.route('**/editor.mjs*',async r=>{const response=await r.fetch();await r.fulfill({response,body:await response.text()+'\nwindow.dropTest={state:()=>doc,debug:()=>({tool,preview:executiveUI.preview()}),screen,select:id=>{setTool("object");executiveUI.selectRoute(id);draw();}};'});});
 await page.goto('http://127.0.0.1:8817/app/stroy/dwg/');await page.locator('#file').setInputFiles(process.env.DWG_TEST_FILE);await page.waitForFunction(()=>document.querySelector('#busy').hidden);
 const count=await page.evaluate(()=>dropTest.state().executiveProject.sheets[0].routes.length);
 for(const selector of ['[data-tool="line"]','[data-tool="poly3"]','#cwDraw']){
  const before=await page.evaluate(()=>dropTest.state().executiveProject.sheets[0].routes.length);
  await page.locator(selector).click();const box=await page.locator('#canvas').boundingBox();
  for(let i=0;i<7;i++){await page.mouse.click(box.x+box.width*(.25+i*.055),box.y+box.height*(.3+(i%2)*.04));assert.equal(await page.evaluate(()=>dropTest.debug().tool),'executive');}
  assert.equal(await page.evaluate(()=>dropTest.state().executiveProject.sheets[0].routes.length),before,'no auto-finish after four points');
  await page.locator(selector).click();assert.equal(await page.evaluate(()=>dropTest.state().executiveProject.sheets[0].routes.length),before+1);
  assert.equal(await page.evaluate(()=>dropTest.state().executiveProject.sheets[0].routes.at(-1).controls.length),7);
 }
 const route=await page.evaluate(()=>structuredClone(dropTest.state().executiveProject.sheets[0].routes.at(-1)));await page.evaluate(id=>dropTest.select(id),route.id);
 await page.locator('#cwDrops').click();
 for(const length of ['1.2','2.3','.5']){await page.locator('#addCableDrop').click();await page.locator('.dropRows input[type=number]').last().fill(length);}
 await page.setViewportSize({width:800,height:1100});assert.equal(await page.locator('#cableDropsDialog').evaluate(e=>e.scrollWidth<=e.clientWidth),true);
 await page.screenshot({path:'/private/tmp/dwg-drops-tablet.png'});await page.setViewportSize({width:390,height:844});assert.equal(await page.locator('#cableDropsDialog').evaluate(e=>e.scrollWidth<=e.clientWidth),true);await page.screenshot({path:'/private/tmp/dwg-drops-phone.png'});await page.setViewportSize({width:800,height:1100});await page.locator('#saveCableDrops').click();
 let saved=await page.evaluate(()=>structuredClone(dropTest.state().executiveProject.sheets[0].routes.at(-1)));assert.equal(saved.extraMetres,4);assert.equal(saved.drops.length,3);assert.deepEqual(saved.points,route.points);
 await page.waitForFunction(()=>paintedLabels.some(s=>s.endsWith('(+4 м)')));
 await page.evaluate(()=>{paintedLabels=[];});await page.locator('#showCableLengths').check();
 await page.waitForFunction(()=>paintedLabels.some(s=>s.endsWith('(+4 м)')));await page.locator('#showCableLengths').uncheck();
 await page.locator('#undo').click();assert.equal(await page.evaluate(()=>dropTest.state().executiveProject.sheets[0].routes.at(-1).extraMetres),0);await page.locator('#redo').click();
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.copiedLedger=text;}}}));await page.locator('#copyCableLedger').click();assert.match(await page.evaluate(()=>copiedLedger),/^Кабель\tСечение\tДлина, м\n/);
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'dwg-drops-')),file=path.join(dir,'edited.dwg');await page.locator('#save').click();const pending=page.waitForEvent('download');await page.locator('#confirmExport').click();await(await pending).saveAs(file);
 await page.locator('#file').setInputFiles(file);await page.waitForFunction(()=>document.querySelector('#busy').hidden);const restored=await page.evaluate(id=>dropTest.state().executiveProject.sheets[0].routes.find(r=>r.id===id),route.id);
 assert.equal(restored.extraMetres,4);assert.deepEqual(restored.drops,saved.drops);assert.deepEqual(restored.points,saved.points);assert.equal(await page.evaluate(()=>dropTest.state().executiveProject.sheets[0].routes.length),count+3);assert.deepEqual(errors,[]);
 console.log('PASS seven-point drawing for all tools, drops, unchanged geometry, undo/redo, tablet layout, clipboard, DWG metadata reopen',dir);
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
