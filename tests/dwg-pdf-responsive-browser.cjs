const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});try{
 const page=await browser.newPage();await page.route('**/app/gate.js',r=>r.fulfill({body:''}));await page.goto('http://127.0.0.1:8817/app/stroy/dwg/');
 const result=await page.evaluate(async()=>{
  const {createExecutiveProject,createExecutive}=await import('./executive-project.mjs'),{executivePdf}=await import('./executive-export.mjs'),{vectorPdf}=await import('./vector-pdf.mjs');
  const project=createExecutiveProject();createExecutive(project,{id:'a',font:'osifont.ttf',nativeHandles:['AA'],metresPerUnit:1,paperUnit:1});
  const shapes=Array.from({length:100000},(_,i)=>({id:'outside-'+i,layer:'0',bounds:[-100,-100,-50,-50],get text(){throw Error('Must not measure unrelated source text');}}));
  shapes.push({id:'dwg-AA',layer:'0',bounds:[10,10,20,20],text:null,color:5,pts:[[10,10],[20,20]]});
  let ticks=0,progress=0;const timer=setInterval(()=>ticks++,0);
  try{const blob=await executivePdf(project,shapes,()=>progress++,{ids:['a']});const bytes=new Uint8Array(await blob.arrayBuffer());if(bytes.length<1000)throw Error('Empty PDF');
   let cancelled=false;try{await executivePdf(project,shapes,()=>{throw Error('CANCEL');},{ids:['a']});}catch(e){cancelled=e.message==='CANCEL';}
   const hatch={text:null,color:7,bounds:[0,0,100,100],matrix:[1,0,0,1,0,0],pts:[],hatch:{loops:[[[0,0],[100,0],[100,100],[0,100]]],solid:false,lines:[{angle:0,base:{x:0,y:0},offset:{x:0,y:.003},dashLengths:[1,-1]}]}};
   let hatchCancelled=false,calls=0;try{await vectorPdf([{shapes:[hatch],bounds:[0,0,100,100]}],()=>{if(++calls>2)throw Error('CANCEL_HATCH');});}catch(e){hatchCancelled=e.message==='CANCEL_HATCH';}
   return {ticks,progress,cancelled,hatchCancelled};
  }finally{clearInterval(timer);}
 });assert.ok(result.ticks>2);assert.ok(result.progress>2);assert.ok(result.cancelled);assert.ok(result.hatchCancelled);console.log('PASS unrelated text excluded, responsive preparation, cancellation including a single dense hatch',result);
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
