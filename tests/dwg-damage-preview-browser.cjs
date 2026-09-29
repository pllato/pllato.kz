const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});try{
 const page=await browser.newPage();await page.route('**/app/gate.js',r=>r.fulfill({body:''}));await page.goto('http://127.0.0.1:8817/app/stroy/dwg/');
 const result=await page.evaluate(async()=>{
  const {paintShapes}=await import('./renderer.mjs'),{repaintDamage}=await import('./damage-preview.mjs');
  const make=()=>{const c=document.createElement('canvas');c.width=800;c.height=600;return c.getContext('2d');},a=make(),b=make(),shapes=[];
  for(let i=0;i<100;i++)shapes.push({id:String(i),text:null,color:5,pts:[[i*7,0],[i*7+60,600]],bounds:[i*7,0,i*7+60,600]});
  const removed={id:'removed',text:null,color:1,pts:[[300,300],[350,350]],bounds:[300,300,350,350]},options={view:{s:1,x:0,y:600},width:800,height:600,hidden:new Set(),colors:{1:'#ff0000',5:'#0000ff'},selected:null};
  paintShapes(a,[...shapes,removed],options);const patched=repaintDamage(a,shapes,[removed],options);paintShapes(b,shapes,options);
  const aa=a.getImageData(0,0,800,600).data,bb=b.getImageData(0,0,800,600).data;let differences=0;for(let i=0;i<aa.length;i++)if(aa[i]!==bb[i])differences++;
  return {patched,differences};
 });assert.deepEqual(result,{patched:true,differences:0});console.log('PASS damage repaint pixel-identical to full redraw with crossing lines');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
