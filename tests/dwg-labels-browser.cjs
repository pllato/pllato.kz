const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});try{
 const page=await browser.newPage({viewport:{width:1600,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('http://127.0.0.1:8816/app/gate.js',r=>r.fulfill({body:'',contentType:'application/javascript'}));
 await page.route('**/editor.mjs?*',async r=>{const response=await r.fetch();await r.fulfill({response,body:await response.text()+`\nwindow.__labels={get shapes(){return drawing.shapes},focus(x,y,w,h){view.s=Math.min(width/w,height/h);view.x=width/2-x*view.s;view.y=height/2+y*view.s;draw();}};`});});
 await page.goto('http://127.0.0.1:8816/app/stroy/dwg/');await page.locator('#file').setInputFiles(process.env.DWG_TEST_FILE);
 await page.waitForFunction(()=>document.querySelector('#busy').hidden,{},{timeout:300000});assert.match(await page.locator('#status').textContent(),/^Открыт/);
 const labels=await page.evaluate(()=>window.__labels.shapes.filter(s=>s.text?.includes('ВВГ')).map(s=>({text:s.text,point:s.pts[0],height:s.height,width:s.textWidth})));
 assert.ok(labels.length>0,'Cable labels must be displayed');console.log('CABLE LABELS',labels.length,JSON.stringify(labels.slice(0,2)));
 console.log('TITLES',await page.evaluate(()=>window.__labels.shapes.filter(s=>s.text?.includes('6 этажа')).map(s=>({text:s.text,point:s.pts[0]})).slice(0,12)));
 const targetCount=await page.evaluate(()=>{const shapes=window.__labels.shapes,title=shapes.find(s=>s.text?.includes('освещения сети 6 этажа (Блок 4)'));if(!title)throw Error('Target plan title not found');const [x,y]=title.pts[0];window.__labels.focus(x+7000,y-13000,44000,30000);return shapes.filter(s=>s.text?.includes('ВВГ')&&Math.abs(s.pts[0][0]-(x+7000))<22000&&Math.abs(s.pts[0][1]-(y-13000))<15000).length;});assert.ok(targetCount>10,'Target plan must contain cable labels');console.log('TARGET PLAN LABELS',targetCount);await page.waitForTimeout(500);
 await page.screenshot({path:'/private/tmp/dwg-labels-detail.png'});
 console.log('BLOCK 1',await page.evaluate(()=>{const shapes=window.__labels.shapes,title=shapes.find(s=>s.text?.includes('освещения сети 6 этажа (Блок 1)'));const [x,y]=title.pts[0];window.__labels.focus(x+9000,y-13000,42000,30000);return {hatches:shapes.filter(s=>s.hatch).length};}));await page.waitForTimeout(1000);await page.screenshot({path:'/private/tmp/dwg-block1-detail.png'});
 assert.deepEqual(errors,[]);console.log('PASS cable labels rendered in user DWG');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
