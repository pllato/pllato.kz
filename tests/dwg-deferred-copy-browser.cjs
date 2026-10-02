const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});try{
 const page=await browser.newPage({viewport:{width:1400,height:950}}),errors=[];let readers=0;
 page.setDefaultTimeout(120000);page.on('worker',w=>{if(w.url().includes('native-reader'))readers++;});page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.route('**/app/gate.js',r=>r.fulfill({body:''}));
 await page.route('**/editor.mjs*',async r=>{const response=await r.fetch();await r.fulfill({response,body:await response.text()+`
 globalThis.copyProbe={
  select(type){const root='dwg-'+doc.executiveProject.sheets[0].nativeHandles[0],device=type==='INSERT',shape=drawing.shapes.find(s=>s.id===root&&(device?s.deviceId!==root&&recordById(s.deviceId)?.type==='INSERT':s.entityType===type&&s.text===null));if(!shape)throw Error('fixture object missing: '+type);selected=device?shape.deviceId:shape.entityId;selectedMatrix=device?shape.deviceMatrix:shape.entityMatrix;selectedShapeKey=device?null:shape.entityKey;selectedChain=pickedDevice=null;sharedSelectedId=null;executiveUI.selectObject(selected,[selected]);properties();draw();return selected;},
  count:()=>doc.entities.filter(r=>r.deferredCopy).length,
  rotation(){const pivot=copyRotationCentre(),points=selectionPaths().paths.flat(),extent=Math.max(...points.map(p=>Math.hypot(p[0]-pivot[0],p[1]-pivot[1]))),scale=150/extent;view={s:scale,x:600-pivot[0]*scale,y:300+pivot[1]*scale};draw();const c=screen(pivot),top=Math.min(c[1],...points.map(p=>screen(p)[1]));return {c,p:[c[0],top-30]};},
  move:()=>applyObjectEdit({delta:[17,29]}),
  geometry:()=>drawing.shapes.filter(s=>s.id===selected).map(s=>({pts:s.pts,text:s.text})),
  async recover(){const state=captureRecovery(doc),id=selected;await openFile(sourceFile,{state,name});selected=id;properties();draw();},
  removeOriginal(id){selected=id;selectedMatrix=null;selectedShapeKey=null;selectedChain=pickedDevice=null;applyObjectEdit({remove:true});},
  matches:expected=>expected.every(e=>drawing.shapes.some(s=>s.text===e.text&&s.pts.length===e.pts.length&&s.pts.every((p,i)=>p.every((v,j)=>Math.abs(v-e.pts[i][j])<1e-6)))),
  sheets:()=>doc.executiveProject?.sheets.length||0
 };`});});
 await page.goto('http://127.0.0.1:8817/app/stroy/dwg/');await page.locator('#file').setInputFiles(process.env.DWG_CLONE_FIXTURE);await page.waitForFunction(()=>document.querySelector('#busy').hidden);
 if(!await page.evaluate(()=>copyProbe.sheets())){
  const dismiss=page.getByRole('button',{name:'Скрыть приглашение',exact:true});if(await dismiss.isVisible())await dismiss.click();await page.locator('#exCreateIcon').click();const b=await page.locator('#canvas').boundingBox();await page.mouse.move(b.x+3,b.y+3);await page.mouse.down();await page.mouse.move(b.x+b.width-3,b.y+b.height-3,{steps:5});await page.mouse.up();await page.waitForFunction(()=>copyProbe.sheets()>0&&document.querySelector('#busy').hidden);
 }
 const selectStart=Date.now();const original=await page.evaluate(type=>copyProbe.select(type),process.env.DWG_COPY_TYPE||'LINE');await page.waitForFunction(()=>!document.querySelector('#cwQuickCopy').hidden);console.log('selectionMs',Date.now()-selectStart);if(process.env.DWG_MOVE_PROBE){console.log('originalMoveMs',await page.evaluate(()=>{const t=performance.now();copyProbe.move();return performance.now()-t;}));await page.locator('#undo').click();await page.evaluate(type=>copyProbe.select(type),process.env.DWG_COPY_TYPE||'LINE');}const before=readers,start=Date.now();await page.locator('#cwQuickCopy').click();await page.waitForFunction(()=>copyProbe.count()===1);
 console.log('copyMs',Date.now()-start);assert.equal(readers,before,'copy cannot invoke native reader');assert.equal(await page.locator('#busy').isVisible(),false);
 const first=await page.evaluate(()=>copyProbe.geometry());
 if(process.env.DWG_COPY_TYPE==='INSERT'){const h=await page.evaluate(()=>copyProbe.rotation()),b=await page.locator('#canvas').boundingBox(),radius=h.c[1]-h.p[1];assert.ok(h.p[0]>=0&&h.p[0]<b.width&&h.p[1]>=0&&h.p[1]<b.height,'copy rotation handle must be on screen');await page.mouse.move(b.x+h.p[0],b.y+h.p[1]);await page.mouse.down();await page.mouse.move(b.x+h.c[0]+radius,b.y+h.c[1],{steps:8});await page.mouse.up();assert.notDeepEqual(await page.evaluate(()=>copyProbe.geometry()),first,'drag handle rotates copy');assert.equal(readers,before);await page.screenshot({path:'/private/tmp/dwg-copy-rotation.png'});}
 await page.evaluate(()=>copyProbe.move());const moved=await page.evaluate(()=>copyProbe.geometry());assert.notDeepEqual(moved,first);
 const steps=process.env.DWG_COPY_TYPE==='INSERT'?3:2;for(let i=0;i<steps;i++)await page.locator('#undo').click();assert.equal(await page.evaluate(()=>copyProbe.count()),0);for(let i=0;i<steps;i++)await page.locator('#redo').click();assert.equal(await page.evaluate(()=>copyProbe.count()),1);
 await page.evaluate(()=>copyProbe.recover());assert.equal(await page.evaluate(()=>copyProbe.count()),1);
 await page.evaluate(id=>copyProbe.removeOriginal(id),original);
 const waiting=page.waitForEvent('download');
 if(process.env.DWG_COPY_EXPORT_ONLY){await page.locator('#executiveExports summary').click();await page.locator('#exportScope').selectOption('selected');await page.locator('#exportExecutivesDwg').click();}
 else{await page.locator('#save').click();await page.locator('#confirmExport').click();}
 const download=await waiting,dir=fs.mkdtempSync('/private/tmp/dwg-deferred-copy-'),file=dir+'/copy.dwg';await download.saveAs(file);
 await page.locator('#file').setInputFiles(file);await page.waitForFunction(()=>document.querySelector('#busy').hidden);
 assert.equal(await page.evaluate(expected=>copyProbe.matches(expected),moved),true,'copy geometry survives DWG despite later deletion of source');
 assert.deepEqual(errors,[]);console.log('PASS native copy without reader/busy, movement, undo/redo, recovery, source deletion, DWG roundtrip',dir);
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
