// Opt-in local DWG; output only performance numbers and pixel equality.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:2});page.setDefaultTimeout(240000);
 await page.route('**/app/gate.js',r=>r.fulfill({body:''}));
 await page.route('**/editor.mjs*',async r=>{const response=await r.fetch();await r.fulfill({response,body:await response.text()+`
 globalThis.rasterProbe={
  ready:()=>!rasterTask.key&&cached?.drawing===drawing&&cached.view.s===view.s&&cached.view.x===view.x,
  async compare(){
   const a=document.createElement('canvas'),b=document.createElement('canvas');a.width=b.width=width;a.height=b.height=height;
   const ac=a.getContext('2d',{willReadFrequently:true}),bc=b.getContext('2d',{willReadFrequently:true}),options={view:{...view},width,height,hidden,selected:null,colors};
   const candidates=viewportShapes(drawing.shapes,view,width,height);
   let t=performance.now();paintShapes(ac,candidates,options);const synchronousMs=performance.now()-t;
   const iterator=paintShapeSteps(bc,candidates,options),slices=[];let ticks=0;const timer=setInterval(()=>ticks++,0);t=performance.now();
   try{for(;;){const start=performance.now(),done=iterator.next().done;slices.push(performance.now()-start);if(done)break;await new Promise(r=>setTimeout(r,0));}}finally{clearInterval(timer);}
   const elapsedMs=performance.now()-t,ap=ac.getImageData(0,0,width,height).data,bp=bc.getImageData(0,0,width,height).data;let differences=0;
   for(let i=0;i<ap.length;i++)if(ap[i]!==bp[i])differences++;
   let maxChannelDifference=0;for(let i=0;i<ap.length;i++)maxChannelDifference=Math.max(maxChannelDifference,Math.abs(ap[i]-bp[i]));
   return {shapes:drawing.shapes.length,synchronousMs,elapsedMs,maxSliceMs:Math.max(...slices),slices:slices.length,ticks,differences,maxChannelDifference};
  },
  interrupt:async()=>{for(let i=0;i<8;i++){zoom(i%2?1/1.12:1.12);await new Promise(r=>setTimeout(r,20));}zoom(4);},
  cacheMatches(){const c=document.createElement('canvas');c.width=canvas.width;c.height=canvas.height;const context=c.getContext('2d');context.setTransform(canvas.width/width,0,0,canvas.height/height,0,0);paintShapes(context,viewportShapes(drawing.shapes,view,width,height),{view,width,height,hidden,selected:null,colors});
   const a=context.getImageData(0,0,c.width,c.height).data,b=previewContext.getImageData(0,0,c.width,c.height).data;let differences=0;for(let i=0;i<a.length;i++)if(a[i]!==b[i])differences++;return {differences,channels:a.length};}
 };`});});
 await page.goto('http://127.0.0.1:8817/app/stroy/dwg/');
 await page.locator('#file').setInputFiles(process.env.DWG_PERF_FIXTURE);await page.waitForFunction(()=>document.querySelector('#busy').hidden&&rasterProbe.ready());
 await page.evaluate(()=>document.fonts.ready);
 const result=await page.evaluate(()=>rasterProbe.compare());console.log(JSON.stringify(result));assert.equal(result.differences,0);assert.ok(result.ticks>0,'input/timers run during raster work');
 await page.evaluate(()=>rasterProbe.interrupt());await page.waitForFunction(()=>rasterProbe.ready());const cache=await page.evaluate(()=>rasterProbe.cacheMatches());console.log({cache});
 // GPU flushes across tasks and the extra transparent-canvas blit can change
 // edge antialiasing. The CPU comparison above must remain bit-exact.
 assert.ok(cache.differences/cache.channels<.002,'Retina cache agrees with latest viewport within GPU edge rounding');
 console.log('PASS exact CPU pixels, cooperative yields, rapid zoom cancellation, Retina cache');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
