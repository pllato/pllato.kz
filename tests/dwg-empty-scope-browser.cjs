const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});try{
 const page=await browser.newPage();await page.route('**/app/gate.js',r=>r.fulfill({body:''}));
 await page.route('**/editor.mjs*',async r=>{const response=await r.fetch();await r.fulfill({response,body:await response.text()+'\nglobalThis.scopeTest=p=>{doc.executiveProject=p;changed("decoration");};'});});
 await page.goto('http://127.0.0.1:8817/app/stroy/dwg/');await page.waitForSelector('#cnScope');
 await page.evaluate(async()=>{const e=await import('./executive-project.mjs'),p=e.createExecutiveProject();e.createExecutive(p,{id:'empty',metresPerUnit:.001});e.createExecutive(p,{id:'filled',metresPerUnit:.001});e.addRoute(p,'filled',{id:'r',brand:'Кабель',section:'3×2,5',points:[[0,0],[1000,0]]});scopeTest(p);});
 await page.waitForFunction(()=>document.querySelector('#cnCount').textContent==='1');await page.locator('#cnScope').selectOption('sheet');await page.waitForFunction(()=>document.querySelector('#cnCount').textContent==='0');assert.equal(await page.locator('#cnGroup option').count(),1);await page.locator('#cnScope').selectOption('all');await page.waitForFunction(()=>document.querySelector('#cnCount').textContent==='1');console.log('PASS all-file to empty-sheet cable scope and back');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
