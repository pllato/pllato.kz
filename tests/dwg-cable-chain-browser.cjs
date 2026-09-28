const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1400,height:900}});
  await page.route('**/app/gate.js',r=>r.fulfill({body:''}));
  await page.route('**/editor.mjs*',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+`
globalThis.chainTest={setup(duplicate=false){doc=demo();doc.records=doc.records.filter(r=>!doc.entities.includes(r));doc.entities=[];doc.blocks=new Map();doc.executiveProject=null;
addEntity(doc,'LINE',[[10,0],[20,0],[11,100],[21,0]]);
addEntity(doc,'ARC',[[10,100],[20,100],[40,100],[50,270],[51,360]]);
addEntity(doc,'LINE',[[10,200],[20,100],[11,200],[21,200]]);
if(duplicate)addEntity(doc,'ARC',[[10,100],[20,100],[40,100],[50,270],[51,360]]);
rebuild();fit();},fixture(shapes,key){drawing.shapes=shapes;const seed=shapes.find(s=>s.entityKey===key);const p=seed.pts[Math.floor(seed.pts.length/2)];view={s:.12,x:canvas.clientWidth/2-p[0]*.12,y:canvas.clientHeight/2+p[1]*.12};cached=null;draw();return screen(p);},point(){return screen([170.710678,29.289322]);},count(){return selectedShapes().length;},metrics(){return {length:pathLength(selectionPaths().paths),highlighted:renderSelection().size};}};`});});
  await page.goto((process.env.DWG_TEST_ORIGIN||'http://127.0.0.1:8817')+'/app/stroy/dwg/');
  await page.waitForFunction(()=>globalThis.chainTest);await page.evaluate(()=>chainTest.setup());
  assert.equal(await page.locator('[data-tool="select"]').count(),0);
  assert.equal(await page.locator('[data-tool="object"]').getAttribute('aria-pressed'),'true');
  const b=await page.locator('#canvas').boundingBox(),p=await page.evaluate(()=>chainTest.point());
  await page.mouse.click(b.x+p[0],b.y+p[1]);
  assert.equal(await page.evaluate(()=>chainTest.count()),3);
  assert.match(await page.locator('#status').textContent(),/Кабель: 3 участков/);
  assert.equal(await page.locator('#delete').isDisabled(),true,'Cannot delete just the anchor of a chain');
  const before=await page.evaluate(()=>chainTest.metrics());
  await page.evaluate(()=>chainTest.setup(true));
  await page.mouse.click(b.x+p[0],b.y+p[1]);
  assert.equal(await page.evaluate(()=>chainTest.count()),3,'Coincident arc does not create a false junction');
  const after=await page.evaluate(()=>chainTest.metrics());assert.equal(after.highlighted,4);assert.equal(after.length,before.length);
  assert.match(await page.locator('#status').textContent(),/совпадающих копий: 1/);
  await page.locator('[data-tool="pan"]').click();await page.keyboard.press('Escape');await page.mouse.click(b.x+p[0],b.y+p[1]);
  assert.equal(await page.evaluate(()=>chainTest.count()),3,'Escape restores whole cable selection');
  if(process.env.DWG_CHAIN_SHAPES){
   const shapes=JSON.parse(require('fs').readFileSync(process.env.DWG_CHAIN_SHAPES)),seed=shapes.find(s=>s.entityId===process.env.DWG_CHAIN_SEED);
   assert.ok(seed);const family=shapes.filter(s=>s.id===seed.id);
   await page.locator('[data-tool="object"]').click();const point=await page.evaluate(({family,key})=>chainTest.fixture(family,key),{family,key:seed.entityKey});
   await page.mouse.click(b.x+point[0],b.y+point[1]);
   assert.ok(await page.evaluate(()=>chainTest.count())>1,'Private fixture must select the bend continuation');
   console.log('Private fixture:',await page.locator('#status').textContent());
  }
  console.log('Cable-chain browser selection passed');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
