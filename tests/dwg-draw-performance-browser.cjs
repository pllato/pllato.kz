// Opt-in local DWG. Log timings/counts, never private geometry.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});try{
 const page=await browser.newPage({viewport:{width:1400,height:900}});page.setDefaultTimeout(240000);
 await page.route('**/app/gate.js',r=>r.fulfill({body:''}));
 await page.route('**/editor.mjs*',async r=>{const response=await r.fetch();const source=process.env.DWG_DRAW_BASELINE?require('node:child_process').execFileSync('git',['show','HEAD:app/stroy/dwg/editor.mjs'],{encoding:'utf8'}):await response.text();await r.fulfill({response,body:source+`
 globalThis.drawPerf={setup:()=>{document.querySelector('#guideWelcome')?.setAttribute('hidden','');zoom(8,[width*.5,height*.5]);setTool('line');},
 count:()=>doc.entities.length,shapes:()=>drawing.shapes.length,
 start:()=>tap([width*.4,height*.4]),finish:()=>tap([width*.6,height*.6]),
 hover:i=>{const p=[width*(.45+i*.002),height*.45],r=canvas.getBoundingClientRect();canvas.dispatchEvent(new PointerEvent('pointermove',{clientX:r.x+p[0],clientY:r.y+p[1]}));},
 undo:()=>undo(),redo:()=>undo(true),
 validate:()=>JSON.stringify(drawing.shapes)===JSON.stringify(scene(doc).shapes),
 poly:()=>{setTool('poly3');for(const p of [[.4,.4],[.45,.35],[.55,.35],[.6,.4]])tap([width*p[0],height*p[1]]);},
 lines:()=>doc.entities.filter(r=>r.type==='LINE').map(r=>[10,20,11,21,62,370].map(code=>num(r,code)))};`});});
 await page.goto('http://127.0.0.1:8817/app/stroy/dwg/');const open=Date.now();await page.locator('#file').setInputFiles(process.env.DWG_PERF_FIXTURE);await page.waitForFunction(()=>document.querySelector('#busy').hidden);
 console.log('openMs',Date.now()-open);await page.evaluate(()=>drawPerf.setup());
 const cdp=await page.context().newCDPSession(page);await cdp.send('Profiler.enable');await cdp.send('Profiler.start');
 const result=await page.evaluate(async iterations=>{const frame=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))),rows=[],initial=drawPerf.count();await frame();
  for(let i=0;i<iterations;i++){drawPerf.start();await frame();const hover=[];for(let j=0;j<4;j++){const t=performance.now();drawPerf.hover(j);await frame();hover.push(Math.round(performance.now()-t));}const t=performance.now();drawPerf.finish();const sync=performance.now()-t;await frame();rows.push({commitSyncMs:Math.round(sync),commitFrameMs:Math.round(performance.now()-t),hoverMs:hover});}
  const added=drawPerf.count()-initial;let t=performance.now();await drawPerf.undo();await frame();const undoMs=Math.round(performance.now()-t),undone=drawPerf.count();t=performance.now();await drawPerf.redo();await frame();return {rows,added,undoMs,redoMs:Math.round(performance.now()-t),undoRemoved:initial+iterations-undone,shapes:drawPerf.shapes()};
 },Number(process.env.DWG_DRAW_ITERATIONS||3));
 const {profile}=await cdp.send('Profiler.stop');console.log('CPU',JSON.stringify(profile.nodes.sort((a,b)=>(b.hitCount||0)-(a.hitCount||0)).slice(0,12).map(n=>({name:n.callFrame.functionName,line:n.callFrame.lineNumber,hits:n.hitCount}))));
 assert.equal(result.added,Number(process.env.DWG_DRAW_ITERATIONS||3));assert.equal(result.undoRemoved,1);console.log(JSON.stringify(result));
 if(process.env.DWG_DRAW_VERIFY){
  assert.equal(await page.evaluate(()=>drawPerf.validate()),true,'incremental scene equals full scene');
  await page.evaluate(()=>drawPerf.poly());assert.equal(await page.evaluate(()=>drawPerf.validate()),true,'four-point polyline equals full scene');
  const lines=await page.evaluate(()=>drawPerf.lines()),downloadPromise=page.waitForEvent('download');await page.locator('#save').click();await page.locator('#confirmExport').click();const download=await downloadPromise;
  const dir=require('node:fs').mkdtempSync('/private/tmp/dwg-line-roundtrip-'),file=dir+'/copy.dwg';await download.saveAs(file);page.on('dialog',d=>d.accept());await page.locator('#file').setInputFiles(file);await page.waitForFunction(()=>document.querySelector('#busy').hidden);
  const after=await page.evaluate(()=>drawPerf.lines());assert.equal(after.length,lines.length);for(const line of lines.slice(-Number(process.env.DWG_DRAW_ITERATIONS||3)))assert.ok(after.some(r=>JSON.stringify(r)===JSON.stringify(line)),'new line survives native save/readback');console.log('PASS incremental/full geometry and native LINE roundtrip');
 }
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
