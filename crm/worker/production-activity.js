export const PRODUCTION_COLLECTION='_production_activity_private';
const HOUR=3600000,DAY=24*HOUR;
export function normalizeActivity(body,now=Date.now()){
 const observedAt=Number(body.observedAt),coverageStart=Number(body.coverageStart);
 if(!Number.isFinite(observedAt)||observedAt>now+5*60000||observedAt<now-DAY)throw new Error('Некорректное время снимка');
 if(body.available===false)return {observedAt,available:false};
 if(!Number.isFinite(coverageStart)||coverageStart<now-366*DAY||coverageStart>observedAt)throw new Error('Некорректное начало истории');
 if(!Array.isArray(body.buckets)||body.buckets.length>9000)throw new Error('Некорректные интервалы');
 const seen=new Set(),buckets=body.buckets.map(b=>{
  const at=Number(b.at),count=Number(b.count);
  if(!Number.isSafeInteger(at)||at%HOUR||at<Math.floor(coverageStart/HOUR)*HOUR||at>observedAt||!Number.isSafeInteger(count)||count<0||count>10000||seen.has(at))throw new Error('Некорректный счётчик');
  seen.add(at);return {at,count};
 }).sort((a,b)=>a.at-b.at);
 return {observedAt,coverageStart,available:true,buckets};
}
async function digest(token){
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));
 return Array.from(new Uint8Array(bytes),v=>v.toString(16).padStart(2,'0')).join('');
}
async function readBody(request,fail,limit=400000){
 const reader=request.body?.getReader();if(!reader)fail(400,'Нет данных');let size=0;const chunks=[];
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit){await reader.cancel();fail(413,'Слишком большой снимок');}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 try{return JSON.parse(new TextDecoder().decode(bytes));}catch{fail(400,'Некорректный JSON');}
}
export async function handleProductionActivity(request,env,actor,{get,save,list,HttpError,sources}){
 const fail=(status,text)=>{throw new HttpError(status,text)},path=new URL(request.url).pathname;
 const token=(request.headers.get('Authorization')||'').replace(/^Bearer /,'');
 if(path.endsWith('/register')){
  if(request.method!=='POST')fail(405,'Метод не поддерживается');
  if(token.length<32||token.length>128)fail(401,'Нет доступа');
  const hash=await digest(token),issuer=sources.find(d=>d.enrollment&&d.tokenHash===hash);
  if(!issuer)fail(401,'Нет доступа');
  const b=await readBody(request,fail,4096);
  if(!/^[a-f0-9-]{36}$/.test(b.machineId||'')||!['codex','claude'].includes(b.source)||!/^device_[a-f0-9-]{36}_(codex|claude)$/.test(b.id||'')||b.id!==`device_${b.machineId}_${b.source}`||!/^[a-f0-9]{64}$/.test(b.tokenHash||''))fail(400,'Некорректное устройство');
  const name=typeof b.name==='string'?b.name.trim():'';
  if(!name||name.length>80||/[\x00-\x1f]/.test(name))fail(400,'Укажите имя компьютера');
  const existing=await get(env,PRODUCTION_COLLECTION,'key_'+b.id);
  if(existing){
   if(existing.tokenHash!==b.tokenHash)fail(409,'Устройство уже зарегистрировано с другим ключом');
   return {ok:true,id:b.id};
  }
  await save(env,PRODUCTION_COLLECTION,{id:'key_'+b.id,deviceId:b.id,machineId:b.machineId,name,source:b.source,tokenHash:b.tokenHash,createdAt:Date.now()},'activity-enrollment');
  return {ok:true,id:b.id};
 }
 if(path.endsWith('/ingest')){
  if(request.method!=='POST')fail(405,'Метод не поддерживается');
  const id=request.headers.get('X-Activity-Device');
  if(!/^[a-zA-Z0-9_-]{1,100}$/.test(id||'')||token.length<32||token.length>128)fail(401,'Нет доступа');
  const device=sources.find(d=>d.id===id&&!d.enrollment)||await get(env,PRODUCTION_COLLECTION,'key_'+id);
  if(!device||await digest(token)!==device.tokenHash)fail(401,'Нет доступа');
  const body=await readBody(request,fail);let next;
  try{next=normalizeActivity(body);}catch(e){fail(400,e.message);}
  const old=await get(env,PRODUCTION_COLLECTION,id);
  if(old?.observedAt>next.observedAt)return {ok:true,ignored:true};
  // A missing journal must not extend the time range of known counts.
  await save(env,PRODUCTION_COLLECTION,{...(old||{}),...next,id,machineId:device.machineId||id,name:device.name||id,source:device.source,dataObservedAt:next.available?next.observedAt:(old?.dataObservedAt||old?.observedAt||0),updatedAt:Date.now()},'activity-collector');
  return {ok:true,source:device.source,observedAt:next.observedAt};
 }
 const admin=!!(actor?.isRoot||actor?.user?.isSuperAdmin);
 const settings=await get(env,PRODUCTION_COLLECTION,'settings')||{viewers:[],scales:{}};
 if(path.endsWith('/settings')){
  if(!admin)fail(403,'Настройки доступны супер-администратору');
  if(request.method!=='PUT')fail(405,'Метод не поддерживается');
  const b=await readBody(request,fail,40000),scales={};
  if(!Array.isArray(b.viewers)||b.viewers.length>500)fail(400,'Некорректный список сотрудников');
  const viewers=[...new Set(b.viewers.map(v=>typeof v==='string'?v.trim().toLowerCase():''))];
  if(viewers.some(v=>!/^\S+@\S+\.\S+$/.test(v)||v.length>254))fail(400,'Некорректный email');
  for(const period of ['day','week','month']){
   const value=b.scales?.[period];
   if(value==null||value===''){scales[period]=null;continue;}
   if(!Number.isSafeInteger(value)||value<1||value>100000000)fail(400,'Максимум должен быть положительным целым числом');
   scales[period]=value;
  }
  await save(env,PRODUCTION_COLLECTION,{id:'settings',viewers,scales,updatedAt:Date.now()},actor.email);
  return {ok:true};
 }
 if(request.method!=='GET')fail(405,'Метод не поддерживается');
 if(!admin&&!(settings.viewers||[]).includes(String(actor?.email||'').toLowerCase()))fail(403,'Нет доступа к графику');
 const all=list?await list(env,PRODUCTION_COLLECTION,10000):[];
 const devices=[...sources.filter(d=>!d.enrollment),...all.filter(r=>r.id.startsWith('key_')).map(r=>({...r,id:r.deviceId}))];
 const result=await Promise.all(devices.map(async device=>{
  const r=await get(env,PRODUCTION_COLLECTION,device.id);
  return {id:device.id,machineId:device.machineId||device.id,name:device.name||device.id,source:device.source,connected:!!r,available:r?.available===true,observedAt:r?.observedAt||0,dataObservedAt:r?.dataObservedAt||r?.observedAt||0,coverageStart:r?.coverageStart||0,buckets:r?.buckets||[]};
 }));
 return {ok:true,sources:result,canManage:admin,settings:{scales:settings.scales||{},...(admin?{viewers:settings.viewers||[]}: {})}};
}
