import test from 'node:test';import assert from 'node:assert/strict';
import {resizeView,usableViewport} from '../app/stroy/dwg/viewport-size.mjs';
import {downloadLink} from '../app/stroy/dwg/download.mjs';
import {renderTask} from '../app/stroy/dwg/render-task.mjs';
test('portrait/tablet/landscape resizing retains CAD centre and complete sheet extent',()=>{
 for(const [w,h]of [[390,719],[844,300],[768,850],[1024,650]]){
  const old={x:-100000,y:200000,s:.01},next=resizeView(old,390,719,w,h);
  assert.ok(Math.abs((390/2-old.x)/old.s-(w/2-next.x)/next.s)<1e-7);
  assert.ok(Math.abs((719/2-old.y)/old.s-(h/2-next.y)/next.s)<1e-7);
  assert.ok(next.s/old.s<=w/390+1e-12);assert.ok(next.s/old.s<=h/719+1e-12);
 }
});
test('download retains the exact CAD blob and named link until explicitly released',()=>{
 const blob=new Blob(['AC1032']),revoked=[],anchor={remove(){this.removed=true;}};
 const file=downloadLink(blob,'чертёж.dwg',{document:{createElement(tag){assert.equal(tag,'a');return anchor;}},url:{createObjectURL(value){assert.equal(value,blob);return 'blob:test';},revokeObjectURL(value){revoked.push(value);}}});
 assert.equal(anchor.download,'чертёж.dwg');assert.equal(anchor.href,'blob:test');assert.deepEqual(revoked,[]);
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
 assert.equal(clicks,0);assert.equal(dialog.open,true);link.click();link.click();assert.equal(clicks,2);assert.deepEqual(revoked,[]);dialog.close();assert.deepEqual(revoked,['blob:cad']);
 }finally{Object.assign(globalThis,original);}
});

test('startup ignores collapsed canvas before calculating CAD scale',()=>{for(const size of [[390,0],[0,844],[NaN,844]])assert.equal(usableViewport(...size),false);assert.equal(usableViewport(390,719),true);});
