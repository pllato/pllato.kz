// Isolated performance regression; logs counts/hashes only, never drawing data.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/app/gate.js',r=>r.fulfill({body:''}));
 const baseline=process.env.DWG_LOAD_BASELINE==='1';
 if(process.env.DWG_LOAD_OLD_SCENE)await page.context().route('**/cad.mjs*',r=>r.fulfill({contentType:'text/javascript',body:execFileSync('git',['show','e693bbc:app/stroy/dwg/cad.mjs'],{encoding:'utf8'})}));
 if(baseline)for(const name of ['native-reader.mjs','native-adapter.mjs','cad.mjs'])await page.context().route('**/'+name+'*',r=>r.fulfill({contentType:'text/javascript',body:execFileSync('git',['show','e693bbc:app/stroy/dwg/'+name],{encoding:'utf8'})}));
 await page.route('**/editor.mjs*',async r=>{const response=await r.fetch(),source=baseline?execFileSync('git',['show','e693bbc:app/stroy/dwg/editor.mjs'],{encoding:'utf8'}):await response.text();await r.fulfill({response,body:source+`
 const timingAdopt=adopt,timingRebuild=rebuild,timingFit=fit;globalThis.mainTimings=[];
 adopt=(...args)=>{const t=performance.now();const value=timingAdopt(...args);mainTimings.push({stage:'adopt',ms:performance.now()-t});return value;};
 rebuild=(...args)=>{const t=performance.now();const value=timingRebuild(...args);mainTimings.push({stage:'rebuild',ms:performance.now()-t});return value;};
 fit=(...args)=>{const t=performance.now();const value=timingFit(...args);mainTimings.push({stage:'fit',ms:performance.now()-t});return value;};
 globalThis.loadFingerprint=async()=>{const hashes=[];for(let i=0;i<doc.records.length;i+=2048){const bytes=new TextEncoder().encode(JSON.stringify(doc.records.slice(i,i+2048).map(r=>Object.fromEntries(Object.entries(r).sort(([a],[b])=>a.localeCompare(b))))));hashes.push(Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).join(','));}return {records:doc.records.length,shapes:drawing.shapes.length,unsupported:drawing.unsupported,mainTimings,hash:Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(hashes.join('|'))))).map(n=>n.toString(16).padStart(2,'0')).join('')};};`});});
 await page.addInitScript(()=>{globalThis.loadStages=[];const Base=Worker;globalThis.Worker=class extends Base{constructor(...args){super(...args);const start=performance.now();let last='';this.addEventListener('message',e=>{const d=e.data,key=d.progress?.replace(/[\d\s/…:]+/g,'')||(d.nativeChunk!==undefined?'transfer':d.nativeComplete||d.doc?'complete':null);if(key&&key!==last){last=key;loadStages.push({phase:key,ms:Math.round(performance.now()-start)});}});}};});
 await page.goto('http://127.0.0.1:8817/app/stroy/dwg/');let client;if(process.env.DWG_LOAD_CPU){client=await page.context().newCDPSession(page);await client.send('Profiler.enable');await client.send('Profiler.start');}const start=Date.now();await page.locator('#file').setInputFiles(process.env.DWG_TEST_FILE);await page.waitForFunction(()=>document.querySelector('#busy').hidden,{},{timeout:300000});
 assert.match(await page.locator('#status').textContent(),/^Открыт/);const openMs=Date.now()-start;
 if(client){const {profile}=await client.send('Profiler.stop'),nodes=new Map(profile.nodes.map(n=>[n.id,n.callFrame.functionName])),counts={};for(let i=0;i<profile.samples.length;i++){const name=nodes.get(profile.samples[i]);counts[name]=(counts[name]||0)+profile.timeDeltas[i];}console.log('CPU_US',Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,20));}
 const result=await page.evaluate(()=>loadFingerprint());assert.deepEqual(errors,[]);
 console.log(JSON.stringify({baseline,openMs,stages:await page.evaluate(()=>loadStages),...result}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
