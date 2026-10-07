import test from 'node:test';import assert from 'node:assert/strict';
import {resizeView,usableViewport} from '../app/stroy/dwg/viewport-size.mjs';
import {downloadLink,shareFile} from '../app/stroy/dwg/download.mjs';
import {renderTask} from '../app/stroy/dwg/render-task.mjs';
test('portrait/tablet/landscape resizing retains CAD centre and complete sheet extent',()=>{
 for(const [w,h]of [[390,719],[844,300],[768,850],[1024,650]]){
  const old={x:-100000,y:200000,s:.01},next=resizeView(old,390,719,w,h);
  assert.ok(Math.abs((390/2-old.x)/old.s-(w/2-next.x)/next.s)<1e-7);
  assert.ok(Math.abs((719/2-old.y)/old.s-(h/2-next.y)/next.s)<1e-7);
  assert.ok(next.s/old.s<=w/390+1e-12);assert.ok(next.s/old.s<=h/719+1e-12);
 }
});
test('download retains the exact CAD blob and named link until explicitly released',async()=>{
 let payload;const blob=new Blob(['AC1032']),revoked=[],anchor={remove(){this.removed=true;}};
 const file=downloadLink(blob,'чертёж.dwg',{document:{createElement(tag){assert.equal(tag,'a');return anchor;}},url:{createObjectURL(value){payload=value;assert.equal(value.type,'application/octet-stream');assert.equal(value.size,blob.size);return 'blob:test';},revokeObjectURL(value){revoked.push(value);}}});
 assert.equal(await payload.text(),'AC1032');assert.equal(anchor.download,'чертёж.dwg');assert.equal(anchor.href,'blob:test');assert.deepEqual(revoked,[]);
 file.release();assert.deepEqual(revoked,['blob:test']);assert.equal(anchor.removed,true);
});
test('large raster publishes partial drawing between slices and cancels stale progress',()=>{
 const queue=[],events=[];const task=renderTask({schedule:fn=>(queue.push(fn),fn),cancel:()=>{}});
 task.start('sheet',(function*(){yield;yield;})(),()=>events.push('complete'),assert.fail,()=>events.push('visible'));
 queue.shift()();assert.deepEqual(events,['visible']);task.stop();while(queue.length)queue.shift()();assert.deepEqual(events,['visible']);
});
test('touch output waits for user click and permits retry before URL cleanup',async()=>{
 const {offerDownload}=await import('../app/stroy/dwg/download.mjs');
 const original={document:globalThis.document,URL:globalThis.URL};const nodes=[],revoked=[];let clicks=0;
 globalThis.document={createElement(tag){const n={tag,children:[],events:{},append(...xs){this.children.push(...xs);},setAttribute(){},remove(){this.removed=true;},showModal(){this.open=true;},close(){this.open=false;this.events.close?.();},addEventListener(k,fn){this.events[k]=fn;},click(){this.onclick?.();}};nodes.push(n);return n;},body:{append(){}}};
 globalThis.URL={createObjectURL:()=> 'blob:cad',revokeObjectURL:x=>revoked.push(x)};
 try{offerDownload(new Blob(['AC1032']),'plan.dwg',{touch:true,onStart:()=>clicks++});
 const link=nodes.find(n=>n.tag==='a'),dialog=nodes.find(n=>n.tag==='dialog');
 assert.equal(clicks,0);assert.equal(dialog.open,true);link.click();link.click();assert.equal(clicks,2);assert.deepEqual(revoked,[]);dialog.close();assert.deepEqual(revoked,[]);nodes.find(n=>n.className==='downloadRetry').click();assert.equal(dialog.open,true);
 }finally{Object.assign(globalThis,original);}
});

test('startup ignores collapsed canvas before calculating CAD scale',()=>{for(const size of [[390,0],[0,844],[NaN,844]])assert.equal(usableViewport(...size),false);assert.equal(usableViewport(390,719),true);});

test('system save shares the exact file only after explicit activation',async()=>{
 let count=0,received;const nav={canShare:({files})=>files[0].name==='plan.dwg',share:async({files})=>{count++;received=files[0];}};
 const share=shareFile(new Blob(['AC1032']),'plan.dwg',{navigator:nav,File});assert.equal(count,0);await share();assert.equal(count,1);assert.equal(await received.text(),'AC1032');assert.equal(received.name,'plan.dwg');
 assert.equal(shareFile(new Blob(),'plan.dwg',{navigator:{}}),null);
 assert.equal(shareFile(new Blob(),'plan.dwg',{navigator:{...nav,canShare:()=>false}}),null);
});
test('creating an executive offers export without claiming a device download',async()=>{
 const {notifyExecutiveCreated}=await import('../app/stroy/dwg/download.mjs');const original=globalThis.document;const nodes=[];let called=0;
 globalThis.document={getElementById:()=>null,createElement(tag){const n={tag,append(){},setAttribute(){},remove(){this.removed=true;}};nodes.push(n);return n;},body:{append(){}}};
 try{notifyExecutiveCreated(()=>called++,{touch:true});assert.equal(called,0);assert.match(nodes.find(n=>n.tag==='strong').textContent,/ещё не скачан/);const button=nodes.find(n=>n.textContent==='Скачать весь DWG');button.onclick();assert.equal(called,1);assert.equal(nodes[0].removed,true);}finally{globalThis.document=original;}
});
