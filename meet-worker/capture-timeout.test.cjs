const vm=require('node:vm'),{readFileSync}=require('node:fs'),assert=require('node:assert/strict');
const source=readFileSync(__dirname+'/../meet.html','utf8');
let resolve,stopped=false;
const context=vm.createContext({setTimeout,clearTimeout,navigator:{mediaDevices:{getUserMedia:()=>new Promise(r=>resolve=r)}}});
vm.runInContext(source.slice(source.indexOf('async function captureMedia('),source.indexOf('async function getLocalMedia(){')),context);
(async()=>{
 await assert.rejects(context.captureMedia({},5),/не ответили/);
 resolve({getTracks:()=>[{stop(){stopped=true}}]});await new Promise(r=>setTimeout(r,0));assert.equal(stopped,true);
 context.navigator.mediaDevices.getUserMedia=async()=>({ok:true});assert.equal((await context.captureMedia({},20)).ok,true);
 console.log('PASS: capture timeout, late camera release and successful retry');
})();
