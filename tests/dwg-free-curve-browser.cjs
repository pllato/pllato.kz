const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});try{
 const page=await browser.newPage({viewport:{width:1400,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.route('**/app/gate.js',r=>r.fulfill({body:''}));
 await page.route('**/editor.mjs*',async r=>{const response=await r.fetch();await r.fulfill({response,body:await response.text()+`\nglobalThis.curveTest={count:()=>doc.entities.length,curves:()=>doc.entities.filter(r=>r.type==='LWPOLYLINE').map(r=>r.pairs.filter(p=>[10,20].includes(p[0])).map(p=>[p[0],Number(p[1])]))};`});});
 await page.goto('http://127.0.0.1:8817/app/stroy/dwg/');await page.locator('#file').setInputFiles(process.env.DWG_CLONE_FIXTURE);await page.waitForFunction(()=>document.querySelector('#busy').hidden);
 const initial=await page.evaluate(()=>curveTest.count());await page.locator('#cwDraw').click();assert.equal(await page.locator('#cwDraw').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('[data-tool="line"]').getAttribute('aria-pressed'),'false');await page.waitForFunction(()=>!document.querySelector('#drawingPresets').hidden);
 const b=await page.locator('#canvas').boundingBox();for(const [x,y]of [[.3,.5],[.4,.3],[.5,.3],[.6,.5]])await page.mouse.click(b.x+b.width*x,b.y+b.height*y);
 assert.equal(await page.evaluate(()=>curveTest.count()),initial+1);const curves=await page.evaluate(()=>curveTest.curves()),curve=curves.at(-1);assert.equal(curve.length,194);
 await page.locator('#undo').click();assert.equal(await page.evaluate(()=>curveTest.count()),initial);await page.locator('#redo').click();assert.deepEqual(await page.evaluate(()=>curveTest.curves()),curves);
 await page.locator('#save').click();const waiting=page.waitForEvent('download');await page.locator('#confirmExport').click();const download=await waiting,dir=fs.mkdtempSync('/private/tmp/dwg-free-curve-'),file=dir+'/curve.dwg';await download.saveAs(file);
 await page.locator('#file').setInputFiles(file);await page.waitForFunction(()=>document.querySelector('#busy').hidden);assert.ok((await page.evaluate(()=>curveTest.curves())).some(r=>JSON.stringify(r)===JSON.stringify(curve)));assert.deepEqual(errors,[]);console.log('PASS free curve button, four points, undo/redo, native DWG roundtrip');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
