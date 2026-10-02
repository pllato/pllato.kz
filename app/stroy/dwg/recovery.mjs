import {get,move,set,addEntity} from './cad.mjs?v=0.17.66';
import {installDeferredBlocks} from './deferred-copy.mjs?v=0.17.66';
import {setSplineControl,setEntityVertex} from './control-edit.mjs?v=0.17.66';
import {planDimensionEdit,planDimensionMove,applyDimensionPlan} from './dimension-edit.mjs?v=0.17.66';
import {applyNotePatch} from './note-edit.mjs?v=0.17.66';
import {installDimensionBlock} from './dimension-create.mjs?v=0.17.66';
export function captureRecovery(doc){
 if(!doc.native)throw Error('Ожидается DWG');
 return {ops:structuredClone(doc.nativeOps||[]),added:doc.entities.filter(r=>r.id.startsWith('new-')).map(r=>({id:r.id,type:r.type,pairs:structuredClone(r.pairs),...(r.type==='DIMENSION'?{dimensionBlock:structuredClone(doc.blocks.get(get(r,2)).records)}:{}),...(r.deferredCopy?{deferredCopy:structuredClone(r.deferredCopy)}:{})})),project:structuredClone(doc.executiveProject||null)};
}
export function replayRecovery(doc,state){
 const byHandle=new Map(doc.records.map(r=>[get(r,5),r])),removed=new Set();
 for(const op of state.ops){const r=byHandle.get(op.handle);if(!r)throw Error('Восстановление: объект '+op.handle+' не найден');
  if(op.dimension){applyDimensionPlan(planDimensionEdit({...doc,nativeOps:state.ops.slice(0,state.ops.indexOf(op))},r,op.dimension));continue;}
  if(op.dimensionMove){applyDimensionPlan(planDimensionMove(doc,r,op.dimensionMove,{detach:op.detachDimension===true||state.ops.slice(0,state.ops.indexOf(op)).some(p=>p.handle===op.handle&&p.detachDimension===true)}));continue;}
  if(op.styleFont!==undefined){if(r.type!=='STYLE'||typeof op.styleFont!=='string')throw Error('Восстановление: неверный стиль');set(r,3,op.styleFont);const style=doc.textStyles.get(get(r,2));if(!style)throw Error('Стиль не найден');style.font=op.styleFont;continue;}
  if(op.layerOff!==undefined){if(r.type!=='LAYER')throw Error('Восстановление: неверный слой');const color=Math.abs(Number(get(r,62,7)))||7;set(r,62,op.layerOff?-color:color);const layer=doc.layers.get(get(r,2));if(layer)layer.color=op.layerOff?-color:color;continue;}
  if(op.remove){removed.add(r);if(r.type==='INSERT')for(const a of doc.records)if(a.type==='ATTRIB'&&get(a,330)===op.handle)removed.add(a);continue;}
  if(op.dx||op.dy){move(r,op.dx,op.dy);if(r.type==='INSERT')for(const a of doc.records)if(a.type==='ATTRIB'&&get(a,330)===op.handle)move(a,op.dx,op.dy);}
  if(op.text!==undefined||op.textHeight!==undefined)applyNotePatch(r,op);
  if(op.node)setSplineControl(r,op.node.index,op.node.x,op.node.y);
  if(op.vertex)setEntityVertex(r,op.vertex.index,op.vertex.x,op.vertex.y);
  if(op.angle!==undefined)set(r,50,op.angle*180/Math.PI);
  if(op.color!==undefined){r.pairs=r.pairs.filter(p=>p[0]!==420);set(r,62,op.color);}
 }
 doc.records=doc.records.filter(r=>!removed.has(r));doc.entities=doc.entities.filter(r=>!removed.has(r));for(const b of doc.blocks.values())b.records=b.records.filter(r=>!removed.has(r));
 for(const r of state.added){const added=addEntity(doc,r.type,r.pairs);if(r.id)added.id=r.id;if(r.dimensionBlock)installDimensionBlock(doc,added,structuredClone(r.dimensionBlock));if(r.deferredCopy){added.deferredCopy=structuredClone(r.deferredCopy);installDeferredBlocks(doc,added.deferredCopy);}}
 doc.nativeOps=structuredClone(state.ops);doc.executiveProject=structuredClone(state.project);return doc;
}
export function recoveryStore(){
 let database;const sourceIds=new WeakMap();
 const open=()=>database??=new Promise((resolve,reject)=>{const r=indexedDB.open('pllato_dwg_recovery',1);r.onupgradeneeded=()=>{r.result.createObjectStore('sources');r.result.createObjectStore('revisions',{keyPath:'id'});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
 return {
  async hasRevisions(){const db=await open();return new Promise((resolve,reject)=>{const r=db.transaction('revisions').objectStore('revisions').count();r.onsuccess=()=>resolve(r.result>0);r.onerror=()=>reject(r.error);});},
  async save(file,state,meta){const db=await open();let sourceId=sourceIds.get(file),fresh=!sourceId;if(fresh)sourceId=crypto.randomUUID();
   const revision={...meta,id:crypto.randomUUID(),time:Date.now(),sourceId,state};
   await new Promise((resolve,reject)=>{const tx=db.transaction(['sources','revisions'],'readwrite');if(fresh)tx.objectStore('sources').put(file,sourceId);tx.objectStore('revisions').put(revision);tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error||Error('Автосохранение прервано'));tx.onerror=()=>{};});
   sourceIds.set(file,sourceId);return revision;
  },
  async list(){const db=await open();return new Promise((resolve,reject)=>{const rows=[],r=db.transaction('revisions').objectStore('revisions').openCursor();r.onsuccess=()=>{const cursor=r.result;if(!cursor)return resolve(rows.sort((a,b)=>b.time-a.time));const {state,...meta}=cursor.value;rows.push(meta);cursor.continue();};r.onerror=()=>reject(r.error);});},
  async revision(id){const db=await open();return new Promise((resolve,reject)=>{const r=db.transaction('revisions').objectStore('revisions').get(id);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});},
  async source(id){const db=await open();return new Promise((resolve,reject)=>{const r=db.transaction('sources').objectStore('sources').get(id);r.onsuccess=()=>{if(r.result)sourceIds.set(r.result,id);resolve(r.result);};r.onerror=()=>reject(r.error);});}
 };
}
