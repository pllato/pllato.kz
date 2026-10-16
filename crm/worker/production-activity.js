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
export async function handleProductionActivity(request,env,actor,{get,save,HttpError,sources}){
 const fail=(status,text)=>{throw new HttpError(status,text)},path=new URL(request.url).pathname;
 if(path.endsWith('/ingest')){
  if(request.method!=='POST')fail(405,'Метод не поддерживается');
  const id=request.headers.get('X-Activity-Device'),device=sources.find(d=>d.id===id);
  const token=(request.headers.get('Authorization')||'').replace(/^Bearer /,'');
  if(!device||token.length<32||token.length>128)fail(401,'Нет доступа');
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));
  const hash=Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
  if(hash!==device.tokenHash)fail(401,'Нет доступа');
  // Stream with a hard limit before JSON parsing.
  const reader=request.body?.getReader();if(!reader)fail(400,'Нет данных');let size=0;const chunks=[];
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>400000){await reader.cancel();fail(413,'Слишком большой снимок');}chunks.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  let next;try{next=normalizeActivity(JSON.parse(new TextDecoder().decode(bytes)));}catch(e){fail(400,e.message);}
  const old=await get(env,PRODUCTION_COLLECTION,id);
  if(old?.observedAt>next.observedAt)return {ok:true,ignored:true};
  await save(env,PRODUCTION_COLLECTION,{...(old||{}),...next,id,source:device.source,updatedAt:Date.now()},'activity-collector');
  return {ok:true,source:device.source,observedAt:next.observedAt};
 }
 if(request.method!=='GET')fail(405,'Метод не поддерживается');
 if(!(actor?.isRoot||actor?.user?.isSuperAdmin))fail(403,'График доступен супер-администратору');
 const result=await Promise.all(sources.map(async device=>{
  const r=await get(env,PRODUCTION_COLLECTION,device.id);
  return {source:device.source,connected:!!r,available:r?.available===true,observedAt:r?.observedAt||0,coverageStart:r?.coverageStart||0,buckets:r?.buckets||[]};
 }));
 return {ok:true,sources:result};
}
