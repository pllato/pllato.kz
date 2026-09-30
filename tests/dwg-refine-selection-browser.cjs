const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});try{
 const page=await browser.newPage({viewport:{width:1600,height:1000}});await page.route('**/app/gate.js',r=>r.fulfill({body:''}));
 await page.route('**/editor.mjs*',async r=>{const response=await r.fetch();await r.fulfill({response,body:await response.text()+`\nglobalThis.refineTest={setup:()=>{doc=demo();doc.records=doc.records.filter(r=>!doc.entities.includes(r));doc.entities=[];doc.blocks=new Map();doc.executiveProject=null;const ids=[];for(const [a,b] of [[[2000,0],[2100,0]],[[2100,0],[2100,100]],[[2100,100],[2200,100]]])ids.push(addEntity(doc,'LINE',[[10,a[0]],[20,a[1]],[11,b[0]],[21,b[1]],[62,5]]).id);rebuild();view={x:-1800,y:400,s:1};draw();pick(screen([2050,0]));return ids;},forget:()=>{selectedChain.universe=new Set(selectedChain.keys);},point:p=>screen(p),state:()=>({keys:selectedChain?.measureKeys.size,length:pathLength(selectionPaths().paths),count:doc.entities.length,targets:editTargets(true).map(t=>t.id)}),move:()=>applyObjectEdit({delta:[0,10]}),exists:id=>doc.records.some(r=>r.id===id)};`});});
 await page.goto('http://127.0.0.1:8817/app/stroy/dwg/');await page.waitForFunction(()=>globalThis.refineTest);
 const ids=await page.evaluate(()=>refineTest.setup()),before=await page.evaluate(()=>refineTest.state());assert.equal(before.keys,3);
 async function click(p,shift=false){const q=await page.evaluate(p=>refineTest.point(p),p),box=await page.locator('#canvas').boundingBox();if(shift)await page.keyboard.down('Shift');await page.mouse.click(box.x+q[0],box.y+q[1]);if(shift)await page.keyboard.up('Shift');}
 await click([2100,50],true);let state=await page.evaluate(()=>refineTest.state());assert.equal(state.keys,2);assert.equal(state.length,200);assert.equal(state.count,before.count);assert.deepEqual(state.targets.sort(),[ids[0],ids[2]].sort());
 await page.locator('#cwRefine').click();await click([2100,50]);assert.equal((await page.evaluate(()=>refineTest.state())).keys,3);assert.equal(await page.locator('#cwRefine').getAttribute('aria-pressed'),'true');
 await click([2050,0]);assert.equal((await page.evaluate(()=>refineTest.state())).keys,2);assert.equal(await page.locator('#cwRefine').getAttribute('aria-pressed'),'true');await page.locator('#cwRefine').click();
 await page.evaluate(()=>refineTest.move());assert.equal((await page.evaluate(()=>refineTest.state())).keys,2);
 await page.locator('#cwDelete').click();assert.equal(await page.evaluate(id=>refineTest.exists(id),ids[0]),true);for(const id of ids.slice(1))assert.equal(await page.evaluate(id=>refineTest.exists(id),id),false);
 await page.locator('#undo').click();for(const id of ids)assert.equal(await page.evaluate(id=>refineTest.exists(id),id),true);
 // Simulate an ambiguous initial chain which never included the middle part.
 await page.evaluate(()=>refineTest.setup());await click([2100,50],true);
 await page.evaluate(()=>refineTest.forget());
 await page.locator('#cwRefine').click();await click([2100,50]);assert.equal((await page.evaluate(()=>refineTest.state())).keys,3);
 console.log('PASS Shift refinement, toolbar toggle/restore, length, move preserves subset, scoped delete/undo');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
