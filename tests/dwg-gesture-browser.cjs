const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});try{
 const page=await browser.newPage({viewport:{width:1200,height:1000}});page.setDefaultTimeout(120000);const errors=[];let readers=0;page.on('pageerror',e=>errors.push(e.message));page.on('worker',w=>{if(w.url().includes('native-reader'))readers++;});
 await page.route('**/app/gate.js',r=>r.fulfill({body:''}));
 await page.route('**/editor.mjs*',async r=>{const response=await r.fetch();await r.fulfill({response,body:await response.text()+`\nwindow.gestureTest={leader:()=>doc.executiveProject.sheets.flatMap(s=>s.routes).flatMap(r=>r.leaders)[0],position:()=>screen(gestureTest.leader().label),focus:()=>{setTool('object');const s=doc.executiveProject.sheets[0],p=gestureTest.leader().label;view={s:2/s.paperUnit,x:width*.4-p[0]*2/s.paperUnit,y:height*.4+p[1]*2/s.paperUnit};draw();},history:()=>history.length};`});});
 await page.goto('http://127.0.0.1:8817/app/stroy/dwg/');await page.locator('#file').setInputFiles(process.env.DWG_TEST_FILE);await page.waitForFunction(()=>document.querySelector('#busy').hidden);await page.evaluate(()=>gestureTest.focus());await page.waitForTimeout(200);
 const before=await page.evaluate(()=>structuredClone(gestureTest.leader())),count=await page.evaluate(()=>gestureTest.history()),initialReaders=readers,box=await page.locator('#canvas').boundingBox();
 let p=await page.evaluate(()=>gestureTest.position());await page.mouse.move(box.x+p[0],box.y+p[1]);
 for(let i=0;i<20;i++)await page.mouse.wheel(0,i%2?180:-180);
 await page.waitForTimeout(250);p=await page.evaluate(()=>gestureTest.position());await page.mouse.move(box.x+p[0],box.y+p[1]);await page.mouse.down();await page.mouse.move(box.x+p[0]+15,box.y+p[1]+15);await page.mouse.wheel(0,-200);await page.mouse.up();await page.waitForTimeout(200);
 assert.deepEqual(await page.evaluate(()=>gestureTest.leader()),before);assert.equal(await page.evaluate(()=>gestureTest.history()),count);
 await page.evaluate(()=>gestureTest.focus());await page.waitForTimeout(200);p=await page.evaluate(()=>gestureTest.position());
 const cdp=await page.context().newCDPSession(page),a={x:box.x+p[0],y:box.y+p[1],id:1},b={x:box.x+p[0]+100,y:box.y+p[1]+50,id:2};
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[a]});await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[a,b]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...a,x:a.x-30},{...b,x:b.x+30}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(200);
 assert.deepEqual(await page.evaluate(()=>gestureTest.leader()),before);assert.equal(await page.evaluate(()=>gestureTest.history()),count);assert.equal(readers,initialReaders,'gestures never reopen DWG');
 assert.equal(await page.evaluate(()=>document.querySelector('#busy').hidden),true);assert.deepEqual(errors,[]);console.log('PASS repeated zoom, wheel interruption, two-finger cancellation: unchanged leader/history, no DWG reload');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
