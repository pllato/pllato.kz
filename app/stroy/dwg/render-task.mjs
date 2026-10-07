// One cooperative raster job at a time. Superseded views never publish.
export function renderTask({schedule=fn=>setTimeout(fn,0),cancel=clearTimeout}={}){
 let active=null;
 function stop(){if(!active)return;cancel(active.timer);active.iterator.return?.();active=null;}
 return {
  get key(){return active?.key;},
  stop,
  start(key,iterator,complete,onError=error=>{throw error;},onProgress=()=>{}){
   stop();const job=active={key,iterator,timer:null};
   const step=()=>{if(active!==job)return;try{
    if(iterator.next().done){active=null;complete();}
    else {onProgress();if(active===job)job.timer=schedule(step);}
   }catch(error){active=null;onError(error);}};
   job.timer=schedule(step);
  }
 };
}
