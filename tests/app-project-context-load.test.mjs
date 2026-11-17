import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../app/project-context.js',import.meta.url),'utf8').replaceAll('export function','function');
const flush=()=>new Promise(r=>setImmediate(r));
function setup(){
 const node=()=>({dataset:{},append(){},replaceChildren(){},querySelector(){return null;}});
 const cards=Array.from({length:40},(_,i)=>{const contact=node(),tasks=node(),box={querySelector:s=>s==='.pc-contact'?contact:tasks};return {dataset:{appId:'p'+i,crmDealId:'deal_'+i},querySelector:s=>s==='.project-context'?box:null,querySelectorAll:()=>[]};});
 const requests=[],observed=new Set(),events={};let callback;
 const doc={hidden:false,querySelectorAll:()=>cards,createElement:node,addEventListener:(event,fn)=>events[event]=fn};
 const ctx=vm.createContext({document:doc,Date,Map,Set,Promise,AbortSignal,setTimeout,clearTimeout,fetch:async url=>{requests.push(url);return {ok:true,json:async()=>url.includes('/deals/')?{contactId:'shared'}:{name:'Contact',phones:[]}};},IntersectionObserver:class{constructor(cb){callback=cb;}observe(el){observed.add(el)}unobserve(el){observed.delete(el)}}});
 vm.runInContext(source,ctx);
 vm.runInContext('var controller=initProjectContext({getToken:()=>"test",getTasks:()=>[]});controller.render()',ctx);
 return {requests,doc,events,ctx,show:(i)=>callback([{target:cards[i],isIntersecting:true}])};
}
test('40 cards cause no CRM reads until visible; shared contacts and rerenders are deduplicated',async()=>{
 const x=setup();await flush();assert.equal(x.requests.length,0);
 x.show(0);x.show(1);await flush();await flush();
 assert.equal(x.requests.filter(u=>u.includes('/deals/')).length,2);
 assert.equal(x.requests.filter(u=>u.includes('/contacts/')).length,1);
 vm.runInContext('controller.render()',x.ctx);await flush();assert.equal(x.requests.length,3);
});
test('background tabs pause queued contact reads and resume when visible',async()=>{
 const x=setup();x.doc.hidden=true;x.show(0);await flush();assert.equal(x.requests.length,0);
 x.doc.hidden=false;x.events.visibilitychange();await flush();assert.equal(x.requests.length,2);
});
