const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1400,height:900}});
  await page.route('**/app/gate.js',r=>r.fulfill({body:''}));
  await page.route('**/editor.mjs*',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+`
globalThis.chainTest={setup(){doc=demo();doc.records=doc.records.filter(r=>!doc.entities.includes(r));doc.entities=[];doc.blocks=new Map();doc.executiveProject=null;
addEntity(doc,'LINE',[[10,0],[20,0],[11,100],[21,0]]);
addEntity(doc,'ARC',[[10,100],[20,100],[40,100],[50,270],[51,360]]);
addEntity(doc,'LINE',[[10,200],[20,100],[11,200],[21,200]]);rebuild();fit();},point(){return screen([170.710678,29.289322]);},count(){return selectedShapes().length;}};`});});
  await page.goto((process.env.DWG_TEST_ORIGIN||'http://127.0.0.1:8817')+'/app/stroy/dwg/');
  await page.waitForFunction(()=>globalThis.chainTest);await page.evaluate(()=>chainTest.setup());
  await page.locator('[data-tool="object"]').click();
  const b=await page.locator('#canvas').boundingBox(),p=await page.evaluate(()=>chainTest.point());
  await page.mouse.click(b.x+p[0],b.y+p[1]);
  assert.equal(await page.evaluate(()=>chainTest.count()),3);
  assert.match(await page.locator('#status').textContent(),/Кабель: 3 участков/);
  assert.equal(await page.locator('#delete').isDisabled(),true,'Cannot delete just the anchor of a chain');
  await page.locator('[data-tool="select"]').click();await page.mouse.click(b.x+p[0],b.y+p[1]);
  assert.equal(await page.evaluate(()=>chainTest.count()),1,'Section mode remains individual');
  console.log('Cable-chain browser selection passed');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
