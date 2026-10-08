// Serial writes preserve edits made while an earlier request is in flight.
export function createPlanAutosave({snapshot,write,accepted,onState,delay=400}){
 let generation=0,saved=0,timer=null,pending=null,error=null,stopped=false;
 async function flush(){
  clearTimeout(timer);timer=null;
  if(pending){await pending;if(error)throw error;if(generation>saved)return flush();return;}
  if(generation===saved)return;
  const version=generation,payload=structuredClone(snapshot());error=null;onState('saving');
  pending=(async()=>{try{const result=await write(payload);accepted(result);saved=version;onState(saved===generation?'saved':'pending');}catch(e){error=e;onState('error',e);throw e;}finally{pending=null;}})();
  await pending;
  if(generation>saved&&!stopped)return flush();
 }
 return {mark(){generation++;error=null;onState('pending');clearTimeout(timer);timer=setTimeout(()=>flush().catch(()=>{}),delay);},flush,isDirty:()=>generation>saved,isBusy:()=>!!pending,reset(){if(pending)throw Error('Сохранение ещё выполняется');generation=0;saved=0;error=null;clearTimeout(timer);},stop(){stopped=true;clearTimeout(timer);}};
}
