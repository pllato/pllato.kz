const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});try{
 const page=await browser.newPage();await page.route('**/app/gate.js',r=>r.fulfill({body:''}));
 await page.goto('http://127.0.0.1:8817/app/stroy/dwg/');await page.evaluate(()=>{const input=document.createElement('input');input.id='transferFixture';input.type='file';document.body.append(input);});await page.locator('#transferFixture').setInputFiles(process.env.DWG_CLONE_FIXTURE);
 const result=await page.evaluate(async()=>{
  const {nativeTransferReceiver}=await import('./native-transfer.mjs'),{scene}=await import('./cad.mjs');
  const read=async(compact,cancel=false)=>{const buffer=await document.querySelector('#transferFixture').files[0].arrayBuffer();return new Promise((resolve,reject)=>{const worker=new Worker('./native-reader.mjs',{type:'module'}),receive=nativeTransferReceiver(worker);worker.onerror=e=>{worker.terminate();reject(Error(e.message));};worker.onmessage=e=>{try{if(e.data.progress)return;if(e.data.error)throw Error(e.data.error);if(cancel&&e.data.nativeChunk!==undefined){worker.terminate();resolve('cancelled');return;}const value=receive(e.data);if(value){worker.terminate();resolve(value);}}catch(error){worker.terminate();reject(error);}};worker.postMessage(compact?{buffer,compact:true}:buffer,[buffer]);});};
  const a=await read(false),b=await read(true),canonical=value=>JSON.stringify(value,(_,v)=>v instanceof Map?[...v]:v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
  if(canonical(a)!==canonical(b))throw Error('Native protocol data mismatch');
  if(canonical(scene(a.doc))!==canonical(scene(b.doc)))throw Error('Native protocol scene mismatch');
  if(await read(true,true)!=='cancelled')throw Error('Cancel failed');
  const retry=await read(true);if(canonical(retry)!==canonical(b))throw Error('Retry mismatch');
  return {records:b.doc.records.length,shapes:scene(b.doc).shapes.length};
 });assert.ok(result.records>0);console.log('PASS legacy/compact exact data, scene, cancellation and retry',result);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
