import {finalizeWebmHeader} from './meet-webm.js?v=20261027-delivery';
// Локальная копия хранится до подтверждения видео И метаданных сервером.
const PART_SIZE = 5 * 1024 * 1024;
let database;
function db(){
  if(!database) database=new Promise((resolve,reject)=>{
    const request=indexedDB.open('pllato-meet-recordings',1);
    request.onupgradeneeded=()=>{
      if(!request.result.objectStoreNames.contains('meetings'))request.result.createObjectStore('meetings',{keyPath:'id'});
      if(!request.result.objectStoreNames.contains('chunks'))request.result.createObjectStore('chunks',{keyPath:['id','seq']});
    };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
  return database;
}
let audioDatabase;
function audioDb(){
  if(!audioDatabase)audioDatabase=new Promise((resolve,reject)=>{
    const request=indexedDB.open('pllato-meet-audio',1);
    request.onupgradeneeded=()=>request.result.createObjectStore('audio',{keyPath:['id','seq']});
    request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
  });
  return audioDatabase;
}
async function transaction(stores, mode, run, source=db){
  const database=await source();
  return new Promise((resolve,reject)=>{
    const tx=database.transaction(stores,mode);
    let result;
    tx.oncomplete=()=>resolve(typeof result==='function'?result():result);
    tx.onerror=()=>reject(tx.error||new Error('Ошибка локального сохранения'));
    tx.onabort=()=>reject(tx.error||new Error('Локальное сохранение прервано'));
    result=run(tx);
  });
}
const chunkRange=id=>IDBKeyRange.bound([id,0],[id,Number.MAX_SAFE_INTEGER]);
const localStore={
  meta:meta=>transaction(['meetings'],'readwrite',tx=>{tx.objectStore('meetings').put(meta);}),
  append:(meta,seq,blob)=>transaction(['meetings','chunks'],'readwrite',tx=>{
    tx.objectStore('meetings').put(meta);
    tx.objectStore('chunks').put({id:meta.id,seq,blob});
  }),
  audio:(id,seq,blob)=>transaction(['audio'],'readwrite',tx=>{tx.objectStore('audio').put({id,seq,blob});},audioDb),
  audios:id=>transaction(['audio'],'readonly',tx=>{const r=tx.objectStore('audio').getAll(chunkRange(id));return ()=>r.result;},audioDb),
  remove:async id=>{await transaction(['audio'],'readwrite',tx=>{tx.objectStore('audio').delete(chunkRange(id));},audioDb);return transaction(['meetings','chunks'],'readwrite',tx=>{
    tx.objectStore('meetings').delete(id); tx.objectStore('chunks').delete(chunkRange(id));
  });},
};
export async function pendingRecordings(owner){
  return transaction(['meetings'],'readonly',tx=>{
    const r=tx.objectStore('meetings').getAll(); return ()=>r.result.filter(m=>!owner || m.owner===owner);
  });
}
export async function localRecordingBlob(meta){
  return transaction(['chunks'],'readonly',tx=>{
    const r=tx.objectStore('chunks').getAll(chunkRange(meta.id));
    return ()=>new Blob(r.result.map(c=>c.blob),{type:meta.mime});
  });
}
export class RecordingUpload{
  constructor(base,meta,token=()=>null,store=localStore){
    this.base=base; this.meta=meta; this.token=token; this.store=store;
    this.buffer=new Blob([]); this.parts=[]; this.uploadId=null; this.seq=0;
    this.chain=Promise.resolve(); this.persistChain=Promise.resolve(); this.completed=false;
    this.localError=null;this.audioCount=0;this.audioChain=Promise.resolve();this.audioUploaded=new Set();
  }
  async request(path,options={}){
    let failure;
    for(let attempt=0;attempt<3;attempt++){
      try{
        const r=await fetch(this.base+path,{...options,headers:{...options.headers,Authorization:'Bearer '+(this.token()||'')},signal:AbortSignal.timeout(45000)});
        if(!r.ok) throw new Error('Сервер сохранения: HTTP '+r.status);
        return await r.json();
      }catch(e){failure=e; if(attempt<2) await new Promise(r=>setTimeout(r,500*(attempt+1)));}
    }
    throw failure;
  }
  get key(){return encodeURIComponent(this.meta.owner)+'/'+encodeURIComponent(this.meta.id);}
  async init(){
    await this.store.meta(this.meta);
    if(this.meta.owner==='crm')await this.request('/archive/session/'+this.key,{method:'PUT'});
  }
  appendAudio(blob){
    const seq=this.audioCount++;
    this.audioChain=this.audioChain.catch(()=>{}).then(async()=>{
      await this.store.audio(this.meta.id,seq,blob);
      await this.request('/archive/audio/'+this.key+'/'+seq,{method:'PUT',body:blob});
      this.audioUploaded.add(seq);
    });
    this.audioChain.catch(()=>{});
  }
  append(blob,meta){
    this.meta={...meta};
    const seq=this.seq++;
    const savedMeta={...this.meta};
    // Запись на диск не ждёт сеть: даже при обрыве последние фрагменты остаются локально.
    this.persistChain=this.persistChain.then(()=>this.store.append(savedMeta,seq,blob)).catch(e=>{this.localError=e; throw e;});
    const persisted=this.persistChain;
    this.chain=this.chain.catch(()=>{}).then(async()=>{
      await persisted;
      this.buffer=new Blob([this.buffer,blob],{type:this.meta.mime});
      await this.flush(false);
    });
    this.chain.catch(()=>{}); // Сетевая ошибка повторяется на следующем фрагменте/при выходе.
    return persisted;
  }
  async flush(final){
    if(!this.buffer.size || (!final && this.buffer.size<PART_SIZE)) return;
    if(!this.headerReserved && /webm/i.test(this.meta.mime||'')){
      // Reserve Duration before splitting: every non-final R2 part stays exactly 5 MiB.
      this.buffer=await finalizeWebmHeader(this.buffer,1);this.headerReserved=true;
    }
    if(!this.uploadId){
      const j=await this.request('/archive/rec-init/'+this.key,{method:'POST',headers:{'Content-Type':this.meta.mime}});
      if(j.complete){this.completed=true;this.meta.size=j.size;this.buffer=new Blob([]);return;}
      if(!j.uploadId) throw new Error('Сервер не начал загрузку');
      this.uploadId=j.uploadId;
    }
    while(this.buffer.size>=PART_SIZE || (final && this.buffer.size)){
      const blob=this.buffer.slice(0,PART_SIZE,this.meta.mime);
      const partNumber=this.parts.length+1;
      const part=await this.request('/archive/rec-part/'+this.key+'/'+encodeURIComponent(this.uploadId)+'/'+partNumber,{method:'PUT',body:blob});
      if(!part.etag || part.partNumber!==partNumber) throw new Error('Не подтверждён фрагмент записи');
      if(partNumber===1)this.firstPart=blob;
      this.parts.push(part);
      // Только после подтверждения; повтор запроса использует тот же номер части.
      this.buffer=this.buffer.slice(blob.size);
    }
  }
  async finish(meta){
    this.meta={...meta,...(this.meta.owner==='crm'?{audioChunks:this.audioCount}: {})};
    await this.persistChain;
    if(this.localError) throw new Error('Не удалось записать локальную копию: '+this.localError.message);
    await this.chain.catch(()=>{});
    await this.store.meta(this.meta);
    if(!this.completed){
      await this.flush(true);
      if(!this.completed){
      if(!this.parts.length) throw new Error('Запись пока пуста');
      if(this.firstPart && /webm/i.test(this.meta.mime||'')){
        const finalized=await finalizeWebmHeader(this.firstPart,(this.meta.durationSec+1)*1000);
        const part=await this.request('/archive/rec-part/'+this.key+'/'+encodeURIComponent(this.uploadId)+'/1',{method:'PUT',body:finalized});
        if(!part.etag || part.partNumber!==1)throw new Error('Не подтверждён заголовок записи');
        this.parts[0]=part;
      }
      const result=await this.request('/archive/rec-complete/'+this.key+'/'+encodeURIComponent(this.uploadId),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(this.parts)});
      if(!result.ok) throw new Error('Видео не подтверждено сервером');
      this.completed=true; this.meta.size=result.size;
      }
    }
    if(this.meta.owner==='crm'){
      await this.audioChain.catch(()=>{});
      const audio=await this.store.audios(this.meta.id);
      if(audio.length!==this.audioCount)throw new Error('Не все фрагменты звука сохранены локально');
      for(const part of audio){if(!this.audioUploaded.has(part.seq))await this.request('/archive/audio/'+this.key+'/'+part.seq,{method:'PUT',body:part.blob});}
    }
    const saved=await this.request('/archive/meta/'+this.key,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(this.meta)});
    if(!saved.ok) throw new Error('Сведения о встрече не сохранены');
    await this.store.remove(this.meta.id);
  }
}
export async function recoverRecording(base,meta,token){
  const blob=await localRecordingBlob(meta);
  if(!blob.size) throw new Error('В локальной копии нет видео');
  const upload=new RecordingUpload(base,meta,token);
  await upload.init();
  upload.buffer=blob;
  if(meta.owner==='crm')upload.audioCount=(await localStore.audios(meta.id)).length;
  await upload.finish(meta);
}
