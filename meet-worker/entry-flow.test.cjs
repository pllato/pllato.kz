const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
const source=readFileSync(path.join(__dirname,'../meet.html'),'utf8');
const storageSource=readFileSync(path.join(__dirname,'../meet-storage.js'),'utf8').replace('export ','');
const {createMeetStorage}=vm.runInNewContext(storageSource+';({createMeetStorage})');
const backing=new Map([['host','old']]);
const persistent={getItem:k=>backing.get(k)??null,setItem(){throw Error('QuotaExceededError')}};
const tempMap=new Map();
const temporary={getItem:k=>tempMap.get(k)??null,setItem:(k,v)=>tempMap.set(k,v),removeItem:k=>tempMap.delete(k)};
let storage=createMeetStorage(()=>persistent,()=>temporary);
storage.setItem('host','new');assert.equal(storage.getItem('host'),'new');
storage=createMeetStorage(()=>persistent,()=>temporary);assert.equal(storage.getItem('host'),'new');
const denied=()=>{throw Error('SecurityError')};storage=createMeetStorage(denied,denied);storage.setItem('host','memory');assert.equal(storage.getItem('host'),'memory');
assert.ok(!/\blocalStorage\./.test(source),'all meeting credentials use safe storage');
const handler=source.slice(source.indexOf("$('btn-enter').onclick = async ()=>{"),source.indexOf("$('pre-name').addEventListener('keydown'"));
async function check({name='Client',allowed=true,throws=false}={}){
 let ready=false,joins=0,requests=0,builds=0;
 const nodes={'pre-name':{value:name,style:{},focus(){}},'btn-enter':{disabled:false}};
 const ctx=vm.createContext({$:id=>nodes[id],sessionUser:()=>null,state:{},peerId:'peer',LS:{name:'name'},meetStorage:storage,toast(){},canEnterWithCamera:()=>ready,async getLocalMedia(){requests++;ready=allowed;return{}},showMediaStatus(){nodes['btn-enter'].disabled=false},getMixAudioContext:()=>({async resume(){}}),async buildOutStream(){builds++;if(throws)throw Error('build failed')},enterRoom(){joins++}});
 vm.runInContext(handler,ctx);await nodes['btn-enter'].onclick();
 assert.equal(joins,name&&allowed&&!throws?1:0);assert.equal(requests,name?1:0);assert.equal(nodes['btn-enter'].disabled,false);
 if(!allowed)assert.equal(builds,0);
}
(async()=>{await check();await check({name:''});await check({allowed:false});await check({throws:true});console.log('PASS: full/disabled storage, reload fallback, one-click join, empty name, denied camera, retry after failure');})();
