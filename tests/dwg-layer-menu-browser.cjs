const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});try{
 const page=await browser.newPage();await page.route('**/app/gate.js',r=>r.fulfill({body:''}));
 await page.route('**/editor.mjs*',async r=>{const response=await r.fetch();await r.fulfill({response,body:await response.text()+`
 globalThis.layerMenuProbe=()=>{const node=$('layers').firstChild,t=performance.now();for(let i=0;i<100;i++)renderLayers();const ms=performance.now()-t,same=node===$('layers').firstChild;const layer=[...doc.layers.keys()][0];hidden.add(layer);renderLayers();const checked=[...$('layers').children].find(l=>l.textContent===decode(layer)).firstChild.checked;hidden.delete(layer);renderLayers();return {ms,same,checked,count:$('layers').children.length,layers:doc.layers.size};};`});});
 await page.goto('http://127.0.0.1:8817/app/stroy/dwg/');await page.locator('#file').setInputFiles(process.env.DWG_TEST_FILE||process.env.DWG_CLONE_FIXTURE);await page.waitForFunction(()=>document.querySelector('#busy').hidden,null,{timeout:240000});
 const result=await page.evaluate(()=>layerMenuProbe());assert.equal(result.same,true);assert.equal(result.checked,false);assert.equal(result.count,result.layers);console.log('PASS unchanged layer DOM retained and visibility refreshed',result);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
