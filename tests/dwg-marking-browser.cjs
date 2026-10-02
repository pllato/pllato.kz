const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/app/gate.js',r=>r.fulfill({body:''}));
 await page.goto('http://127.0.0.1:8817/app/stroy/dwg/');await page.waitForSelector('#showCableMarking');
 await page.locator('#showCableMarking').check();
 assert.ok(await page.getByText('Зелёный — заполнено · Красный пунктир — нет марки / сечения',{exact:true}).isVisible());
 const colors=await page.evaluate(async()=>{
  const {paintMarking,markingIndex}=await import('./cable-marking.mjs');const strokes=[];
  const ctx={save(){},restore(){},setLineDash(v){this.dash=v},beginPath(){},moveTo(){},lineTo(){},stroke(){strokes.push([this.strokeStyle,this.dash.length])}};
  const routes=[{brand:'ВВГ',section:'3×2,5',points:[[1,1],[5,5]]},{brand:'ВВГ',section:'',points:[[2,2],[6,6]]}];
  paintMarking(ctx,markingIndex(routes),[],new Set(),new Set(),p=>p,100,100);return strokes;
 });assert.deepEqual(colors,[['#168447',0],['#d32f2f',2]]);
 await page.locator('#showCableMarking').uncheck();assert.equal(await page.getByText('Зелёный — заполнено · Красный пунктир — нет марки / сечения',{exact:true}).isVisible(),false);
 assert.deepEqual(errors,[]);console.log('PASS marking toggle, legend, complete/incomplete colors and dash distinction');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
