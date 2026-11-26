import {sendWebPush} from './task-webpush.js';
export const TASK_NOTICES='_chart_task_notices_private';
const SUBS='_chart_task_push_private';
const email=x=>String(x||'').trim().toLowerCase();
const prefix=x=>encodeURIComponent(email(x))+':';
export function taskRecipients(task,actor,mentions=[]){return [...new Set([...mentions,task.assigneeEmail,task.managerEmail,task.author].map(email).filter(x=>x&&x!==email(actor.email)))].slice(0,12);}
export function validateTaskSchedule(task,HttpError){
 const date=String(task.dueDate||''),time=String(task.dueTime||'');
 if((date&&!/^\d{4}-\d{2}-\d{2}$/.test(date))||(time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))||(!date&&time))throw new HttpError(400,'Укажите корректные дату и время дела');
 const ms=date?Date.parse(date+'T'+(time||'00:00')+':00+05:00'):null;
 if(date&&(!Number.isFinite(ms)||new Date(ms+5*3600000).toISOString().slice(0,10)!==date))throw new HttpError(400,'Некорректная дата дела');
 task.dueDate=date;task.dueTime=time;task.dueAt=ms;
}
export async function notifyTask(env,actor,task,{kind,eventId,text,recipients},deps){
 const notices=[];
 for(const recipient of [...new Set(recipients.map(email))].slice(0,12)){
  if(!recipient||recipient===email(actor.email)||!await deps.canReceive(recipient,task))continue;
  const id=prefix(recipient)+eventId,now=Date.now();
  const item={id,taskId:task.id,recipient,kind,text:String(text||'').slice(0,240),actor:email(actor.email),actorName:actor.user?.name||actor.email,createdAt:now,readAt:null};
  const r=await deps.db.prepare('INSERT OR IGNORE INTO store(team_id,collection,id,data,created_at,updated_at) VALUES(?,?,?,?,?,?)').bind(deps.teamId,TASK_NOTICES,id,JSON.stringify(item),now,now).run();
  if(r.meta?.changes)notices.push(item);
 }
 const push=async()=>{
  if(!env.VAPID_PRIVATE_JWK)return;
  for(const item of notices){
   const p=prefix(item.recipient);
   const {results}=await deps.db.prepare('SELECT id,data FROM store WHERE team_id=? AND collection=? AND id>=? AND id<? LIMIT 10').bind(deps.teamId,SUBS,p,p+'~').all();
   for(const row of results||[]){
    try{const sub=JSON.parse(row.data);const result=await sendWebPush(env,sub,{title:item.kind==='assigned'?'Вам назначено дело':item.kind==='mention'?'Вас упомянули в деле':'Новое в деле',body:'Откройте дело в панели команды',url:'https://pllato.kz/app?task='+encodeURIComponent(task.id),tag:'task-'+task.id,icon:'https://pllato.kz/pllato_icon.svg'});
     if(result.gone)await deps.db.prepare('DELETE FROM store WHERE team_id=? AND collection=? AND id=?').bind(deps.teamId,SUBS,row.id).run();
    }catch{console.warn('task push delivery failed');}
   }
  }
 };
 if(notices.length){if(deps.ctx)deps.ctx.waitUntil(push());else await push();}
}
export async function handleTaskReminders(request,env,actor,deps){
 const {db,teamId,HttpError}=deps,url=new URL(request.url),p=prefix(actor.email);
 if(url.pathname.endsWith('/push-key'))return {publicKey:env.VAPID_PUBLIC_KEY||null};
 if(url.pathname.endsWith('/subscribe')){
  if(request.method!=='POST')throw new HttpError(405,'Метод не поддерживается');
  const b=await request.json();let target;try{target=new URL(b.endpoint);}catch{throw new HttpError(400,'Некорректная подписка');}
  // Не разрешаем серверные запросы на произвольный адрес из тела подписки.
  if(target.protocol!=='https:'||!(target.hostname==='fcm.googleapis.com'||target.hostname==='updates.push.services.mozilla.com'||target.hostname.endsWith('.push.apple.com'))||target.port)throw new HttpError(400,'Неизвестный push-сервис');
  if(!/^[A-Za-z0-9_-]{86,88}$/.test(b.keys?.p256dh||'')||!/^[A-Za-z0-9_-]{22,24}$/.test(b.keys?.auth||''))throw new HttpError(400,'Некорректные ключи подписки');
  const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(b.endpoint)))].map(n=>n.toString(16).padStart(2,'0')).join('');
  const item={endpoint:b.endpoint,p256dh:b.keys.p256dh,auth:b.keys.auth};const now=Date.now();
  await db.prepare("DELETE FROM store WHERE team_id=? AND collection=? AND json_extract(data,'$.endpoint')=? AND id<>?").bind(teamId,SUBS,b.endpoint,p+hash).run();
  await db.prepare('INSERT INTO store(team_id,collection,id,data,created_at,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(team_id,collection,id) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at').bind(teamId,SUBS,p+hash,JSON.stringify(item),now,now).run();return {ok:true};
 }
 if(request.method==='POST'){
  const b=await request.json();if(!Array.isArray(b.ids)||b.ids.length>50||b.ids.some(id=>typeof id!=='string'||!id.startsWith(p)))throw new HttpError(400,'Некорректные уведомления');
  if(b.ids.length)await db.batch([...new Set(b.ids)].map(id=>db.prepare("UPDATE store SET data=json_set(data,'$.readAt',?),updated_at=? WHERE team_id=? AND collection=? AND id=?").bind(Date.now(),Date.now(),teamId,TASK_NOTICES,id)));
  return {ok:true};
 }
 if(request.method!=='GET')throw new HttpError(405,'Метод не поддерживается');
 const before=url.searchParams.get('before');if(before&&!before.startsWith(p))throw new HttpError(400,'Некорректный курсор');
 const {results}=await db.prepare('SELECT data FROM store WHERE team_id=? AND collection=? AND id>=? AND id<? ORDER BY id DESC LIMIT 51').bind(teamId,TASK_NOTICES,p,before||p+'~').all();
 const raw=(results||[]).map(r=>JSON.parse(r.data));const tasks=await deps.getTasks([...new Set(raw.map(n=>n.taskId))]);const allowed=new Map();
 for(const task of tasks)if(!task.deleted&&!task.__deleted&&await deps.canAccess(task))allowed.set(task.id,task);
 const items=raw.slice(0,50).filter(n=>allowed.has(n.taskId)).map(n=>({...n,task:allowed.get(n.taskId)}));
 const row=await db.prepare("SELECT COUNT(*) AS n FROM store WHERE team_id=? AND collection=? AND id>=? AND id<? AND json_extract(data,'$.readAt') IS NULL").bind(teamId,TASK_NOTICES,p,p+'~').first();
 return {ok:true,items,unread:Number(row?.n)||0,nextCursor:raw.length>50?raw[49].id:null};
}
