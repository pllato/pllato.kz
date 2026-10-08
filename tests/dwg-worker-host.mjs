// Optional Node host for the actual browser workers; no exporter replacement.
import {parentPort,workerData} from 'node:worker_threads';
globalThis.self={postMessage:(m,t)=>parentPort.postMessage(m,t),addEventListener:(_,f)=>parentPort.on('message',f),removeEventListener:(_,f)=>parentPort.off('message',f)};
// Adapt ack events to the browser worker's event shape.
const listeners=new Map();self.addEventListener=(_,f)=>{const g=data=>f({data});listeners.set(f,g);parentPort.on('message',g);};self.removeEventListener=(_,f)=>{parentPort.off('message',listeners.get(f));listeners.delete(f);};
await import(workerData.module);
parentPort.on('message',data=>{if(data.nativeAck===undefined)Promise.resolve(self.onmessage({data})).catch(e=>parentPort.postMessage({error:e.message}));});
parentPort.postMessage({ready:true});
