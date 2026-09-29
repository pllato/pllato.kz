// Private fixture stays local. Only timings/counts leave the browser.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});await page.route('**/app/gate.js',r=>r.fulfill({body:''}));
 await page.route('**/editor.mjs*',async r=>{const response=await r.fetch();await r.fulfill({response,body:await response.text()+`
 globalThis.viewportProfile=()=>{
  const results=[],context=document.createElement('canvas');context.width=width;context.height=height;const c=context.getContext('2d');
  const base={...view},center=world([width/2,height/2]);
  for(const zoom of [1,8,32]){
   const v={s:base.s*zoom,x:width/2-center[0]*base.s*zoom,y:height/2+center[1]*base.s*zoom};
   const options={view:v,width,height,hidden,selected:null,colors},full=[],indexed=[];
   const drawAll=()=>{c.clearRect(0,0,width,height);paintShapes(c,drawing.shapes,options);};
   const drawIndexed=()=>{c.clearRect(0,0,width,height);paintShapes(c,viewportShapes(drawing.shapes,v,width,height),options);};
   drawAll();const a=c.getImageData(0,0,width,height).data;drawIndexed();const b=c.getImageData(0,0,width,height).data;
   let differences=0;for(let i=0;i<a.length;i++)if(a[i]!==b[i])differences++;
   for(let i=0;i<7;i++){let t=performance.now();drawAll();full.push(performance.now()-t);t=performance.now();drawIndexed();indexed.push(performance.now()-t);}
   full.sort((a,b)=>a-b);indexed.sort((a,b)=>a-b);results.push({zoom,candidates:viewportShapes(drawing.shapes,v,width,height).length,fullMs:full[3],indexedMs:indexed[3],differences});
  }return {shapes:drawing.shapes.length,results};
 };`});});
 await page.goto('http://127.0.0.1:8817/app/stroy/dwg/');await page.locator('#file').setInputFiles(process.env.DWG_TEST_FILE);await page.waitForFunction(()=>document.querySelector('#busy').hidden,{},{timeout:300000});
 const result=await page.evaluate(()=>viewportProfile());for(const r of result.results)assert.equal(r.differences,0);console.log(JSON.stringify(result));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
