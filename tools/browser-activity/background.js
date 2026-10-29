import {BASE,pageSource,requestSource,cleanName,addCount,snapshot,pairRequest} from './model.mjs';

// Serialize storage writes across tabs, alarms and popup. Survives worker suspension
// through durable snapshots; secrets are never exposed to content scripts.
const access=chrome.storage.local.setAccessLevel({accessLevel:'TRUSTED_CONTEXTS'});
let chain=Promise.resolve();
const run=fn=>{const next=chain.then(()=>access).then(fn);chain=next.catch(()=>{});return next;};
const get=async()=> (await chrome.storage.local.get('state')).state;
const save=state=>chrome.storage.local.set({state});
async function badge(state){
  await chrome.action.setBadgeText({text:!state?.name?'!':state.paused?'Ⅱ':state.error?'!':'ON'});
  await chrome.action.setBadgeBackgroundColor({color:state?.error?'#b45309':state?.paused?'#64748b':'#0f766e'});
}
async function post(path,token,body,device){
  const r=await fetch(BASE+path,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token,...(device?{'X-Activity-Device':device}:{})},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
  const data=await r.json();if(!r.ok||!data.ok)throw Error(r.status===401?'Подключение отклонено. Свяжитесь с администратором.':data.error||data.message||'Сервер временно недоступен. Повторим автоматически.');return data;
}
async function sync(){
  const state=await get();if(!state?.name||state.paused)return;
  let config;
  const errors=[];
  for(const source of ['codex','claude']){
    const item=state.services[source];
    try{
      if(!item.registered){
        config??=await (await fetch(chrome.runtime.getURL('config.json'))).json();
        const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(item.token))),v=>v.toString(16).padStart(2,'0')).join('');
        await post('/register',config.enrollmentToken,{id:item.id,machineId:state.machineId,source,name:state.name,tokenHash:hash});
        item.registered=true;
        await save(state);
      }
      const body=snapshot(state,source);
      await post('/ingest',item.token,body,item.id);
      item.lastSync=body.observedAt;item.syncedTotal=body.buckets.reduce((n,b)=>n+b.count,0);
    }catch(e){errors.push((source==='codex'?'Codex':'Claude')+': '+String(e.message).slice(0,240));}
  }
  state.error=errors.join('\n');await save(state);await badge(state);
}
async function session(){
  const saved=(await chrome.storage.session.get('activity')).activity;
  return saved||{id:crypto.randomUUID(),intents:[],requests:[]};
}
async function correlate(){
  const s=await session(),state=await get(),now=Date.now();
  if(!state?.name||state.paused)return;
  s.intents=s.intents.filter(i=>i.at>now-120000);
  s.requests=s.requests.filter(r=>r.at>now-120000);
  let changed=false;
  for(const r of s.requests){
    if(r.accepted===undefined||r.counted)continue;
    const i=pairRequest(r,s.intents);if(!i)continue;
    // Save count before session consumption; retries use the same request nonce.
    if(r.accepted){
      changed=addCount(state,r.source,s.id+':'+r.id,r.at)||changed;
      i.used=true;
    }
    r.counted=true;
  }
  if(changed){await save(state);await badge(state);}
  await chrome.storage.session.set({activity:s});
}
async function network(d,accepted){
  const source=requestSource(d);if(!source)return;
  const s=await session();let r=s.requests.find(r=>r.id===d.requestId);
  if(!r){r={id:d.requestId,tabId:d.tabId,source,at:d.timeStamp};s.requests.push(r);}
  if(accepted)r.accepted=d.statusCode>=200&&d.statusCode<300;
  s.requests=s.requests.filter(r=>r.at>Date.now()-120000).slice(-200);
  await chrome.storage.session.set({activity:s});await correlate();
}
const filter={urls:['https://claude.ai/api/*','https://chatgpt.com/backend-api/*'],types:['xmlhttprequest']};
chrome.webRequest.onBeforeRequest.addListener(d=>{run(()=>network(d,false)).catch(()=>{});},filter);
chrome.webRequest.onResponseStarted.addListener(d=>{run(()=>network(d,true)).catch(()=>{});},filter);
chrome.webRequest.onErrorOccurred.addListener(d=>{run(()=>network({...d,statusCode:0},true)).catch(()=>{});},filter);

chrome.runtime.onMessage.addListener((m,sender,reply)=>{
  run(async()=>{
    if(m?.type==='intent'){
      const source=pageSource(sender.url);if(!source||sender.frameId!==0||!Number.isInteger(sender.tab?.id)||!/^[-a-f0-9]{36}$/.test(m.id||''))return {ok:false};
      const state=await get();if(!state?.name||state.paused)return {ok:false};
      const at=Number(m.at);if(!Number.isFinite(at)||at>Date.now()+1000||at<Date.now()-120000)return {ok:false};
      const s=await session();if(!s.intents.some(i=>i.id===m.id))s.intents.push({id:m.id,tabId:sender.tab.id,source,at});
      s.intents=s.intents.filter(i=>i.at>Date.now()-120000).slice(-200);
      await chrome.storage.session.set({activity:s});await correlate();return {ok:true};
    }
    // Administrative popup messages must originate from our own extension page.
    if(sender.id!==chrome.runtime.id||!sender.url?.startsWith(chrome.runtime.getURL('popup.html')))throw Error('Нет доступа');
    let state=await get();
    if(m.type==='setup'){
      if(state?.name)throw Error('Этот браузер уже подключён.');
      const name=cleanName(m.name),machineId=crypto.randomUUID();
      const secret=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),v=>v.toString(16).padStart(2,'0')).join('');
      state={name,machineId,startedAt:Date.now(),paused:false,services:Object.fromEntries(['codex','claude'].map(source=>[source,{id:`device_${machineId}_${source}`,token:secret(),buckets:{}}]))};
      await save(state);await chrome.storage.session.remove('activity');await chrome.alarms.create('sync',{periodInMinutes:10});await sync();
    }else if(m.type==='pause'&&state?.name){
      state.paused=!!m.paused;await save(state);await chrome.storage.session.remove('activity');await badge(state);
      if(!state.paused)await sync();
    }else if(m.type==='sync')await sync();
    else if(m.type!=='status')throw Error('Неизвестная команда');
    state=await get();
    // Never return tokens or enrollment configuration to UI or content scripts.
    return {ok:true,name:state?.name||'',paused:!!state?.paused,error:state?.error||'',services:Object.fromEntries(['codex','claude'].map(source=>{
      const item=state?.services?.[source];return [source,{count:Object.values(item?.buckets||{}).reduce((n,v)=>n+v,0),lastSync:item?.lastSync||0,lastEvent:item?.lastEvent||0,syncedTotal:item?.syncedTotal||0}];
    }))};
  }).then(reply,e=>reply({ok:false,error:String(e.message)}));return true;
});
chrome.alarms.onAlarm.addListener(a=>{if(a.name==='sync')run(sync).catch(()=>{});});
chrome.runtime.onInstalled.addListener(()=>{run(async()=>{await chrome.alarms.create('sync',{periodInMinutes:10});await badge(await get());await chrome.runtime.openOptionsPage();}).catch(()=>{});});
chrome.runtime.onStartup.addListener(()=>{run(async()=>{await chrome.alarms.create('sync',{periodInMinutes:10});await sync();}).catch(()=>{});});
