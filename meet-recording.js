// Локальная копия хранится до подтверждения видео И метаданных сервером.
const PART_SIZE = 5 * 1024 * 1024;
let database;
function db(){
  if(!database) database=new Promise((resolve,reject)=>{
    const request=indexedDB.open('pllato-meet-recordings',1);
    request.onupgradeneeded=()=>{
      request.result.createObjectStore('meetings',{keyPath:'id'});
      request.result.createObjectStore('chunks',{keyPath:['id','seq']});
    };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
  return database;
}
async function transaction(stores, mode, run){
  const database=await db();
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
  remove:id=>transaction(['meetings','chunks'],'readwrite',tx=>{
    tx.objectStore('meetings').delete(id); tx.objectStore('chunks').delete(chunkRange(id));
  }),
};
export async function pendingRecordings(owner){
  return transaction(['meetings'],'readonly',tx=>{
    const r=tx.objectStore('meetings').getAll(); return ()=>r.result.filter(m=>m.owner===owner);
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
    this.localError=null;
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
  async init(){await this.store.meta(this.meta);}
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
    if(!this.uploadId){
      const j=await this.request('/archive/rec-init/'+this.key,{method:'POST',headers:{'Content-Type':this.meta.mime}});
      if(!j.uploadId) throw new Error('Сервер не начал загрузку');
      this.uploadId=j.uploadId;
    }
    while(this.buffer.size>=PART_SIZE || (final && this.buffer.size)){
      const blob=this.buffer.slice(0,PART_SIZE,this.meta.mime);
      const partNumber=this.parts.length+1;
      const part=await this.request('/archive/rec-part/'+this.key+'/'+encodeURIComponent(this.uploadId)+'/'+partNumber,{method:'PUT',body:blob});
      if(!part.etag || part.partNumber!==partNumber) throw new Error('Не подтверждён фрагмент записи');
      this.parts.push(part);
      // Только после подтверждения; повтор запроса использует тот же номер части.
      this.buffer=this.buffer.slice(blob.size);
    }
  }
  async finish(meta){
    this.meta={...meta};
    await this.persistChain;
    if(this.localError) throw new Error('Не удалось записать локальную копию: '+this.localError.message);
    await this.chain.catch(()=>{});
    await this.store.meta(this.meta);
    if(!this.completed){
      await this.flush(true);
      if(!this.parts.length) throw new Error('Запись пока пуста');
      const result=await this.request('/archive/rec-complete/'+this.key+'/'+encodeURIComponent(this.uploadId),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(this.parts)});
      if(!result.ok) throw new Error('Видео не подтверждено сервером');
      this.completed=true; this.meta.size=result.size;
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
  upload.buffer=blob;
  await upload.finish(meta);
}
