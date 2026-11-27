import {astanaAssignees} from './astana-assignees.js';
import {ASTANA_PIPELINE} from './astana-admissions.js';
export const VIEWER_CONFIG_KEY='security:restrictedViewers';
// Только данные, без cross-request promise/Request. Короткий кэш одного ключа
// не добавляет запрос к D1 на каждый запрос обычных сотрудников.
const configs=new WeakMap();
export async function restrictedViewer(env,email){
 const now=Date.now();let cached=configs.get(env.DB);
 if(!cached||cached.until<=now){
  const row=await env.DB.prepare('SELECT v FROM kv WHERE k=?').bind(VIEWER_CONFIG_KEY).first();
  const data=row?.v?JSON.parse(row.v):{};
  cached={data,until:now+25000};configs.set(env.DB,cached);
 }
 const p=cached.data[String(email||'').toLowerCase().trim()];
 return p&&p.mode==='astana-readonly'?p:null;
}
export function viewerRequestAllowed(request){
 const path=new URL(request.url).pathname;
 return request.method==='GET'&&(path==='/api/me'||path==='/api/astana-view');
}
export async function handleAstanaViewer(request,env,claims,profile,json){
 if(claims.email_verified!==true)return json({error:'Войдите через подтверждённый аккаунт Google'},403,request);
 if(!viewerRequestAllowed(request))return json({error:'Доступ только на просмотр ELC Astana'},403,request);
 const user=await env.DB.prepare('SELECT uid,email,name,active FROM users WHERE uid=? AND lower(email)=?').bind(profile.uid,String(claims.email||'').toLowerCase()).first();
 if(!user||user.active!==1)return json({error:'Доступ приостановлен'},403,request);
 if(new URL(request.url).pathname==='/api/me')return json({ok:true,isLinked:true,role:'viewer',readOnly:true,viewerUrl:'/astana-view.html',canonicalUid:user.uid,email:user.email,needsPhone:false,profile:{uid:user.uid,name:user.name},orgPerms:{pipelineIds:[ASTANA_PIPELINE],dealScope:'all',viewAllPipelineIds:[ASTANA_PIPELINE]}},200,request);
 const url=new URL(request.url),q=(url.searchParams.get('q')||'').trim().slice(0,200),stage=(url.searchParams.get('stage')||'').slice(0,100);
 const offset=Math.max(0,Math.min(50000,parseInt(url.searchParams.get('offset'),10)||0));
 const pipeline=await env.DB.prepare('SELECT id,name,stages FROM pipelines WHERE id=?').bind(ASTANA_PIPELINE).first();
 const where=['d.pipeline_id=?',"COALESCE(d.stage_id,'')!='__ARCHIVED__'"],args=[ASTANA_PIPELINE];
 const managers=(await astanaAssignees(env)).filter(u=>u.assignable);
 const selected=url.searchParams.get('assignee')||'';
 const assignee=selected==='mine'?user.uid:selected;
 if(assignee){
  // Неизвестный/отозванный менеджер не превращает запрос в «все».
  if(selected!=='mine'&&!managers.some(u=>u.uid===assignee))return json({error:'Ответственный не имеет доступа к ELC Astana'},400,request);
  where.push('d.responsible_uid=?');args.push(assignee);
 }
 if(stage){where.push('d.stage_id=?');args.push(stage);}
 if(q){where.push("(d.title LIKE ? ESCAPE '\\' OR c.name LIKE ? ESCAPE '\\' OR c.last_name LIKE ? ESCAPE '\\' OR d.custom_fields LIKE ? ESCAPE '\\' OR c.phones LIKE ? ESCAPE '\\')");const pattern='%'+q.replace(/[\\%_]/g,'\\$&')+'%';args.push(pattern,pattern,pattern,pattern,pattern);}
 const join=' FROM deals d LEFT JOIN contacts c ON c.id=d.contact_id';
 const clause=' WHERE '+where.join(' AND ');
 const count=await env.DB.prepare('SELECT COUNT(*) AS n'+join+clause).bind(...args).first();
 const {results}=await env.DB.prepare(`SELECT d.id,d.title,d.stage_id,d.custom_fields,d.comments,d.source_description,d.bitrix_date_create,c.name,c.last_name,c.phones,u.name AS owner_name,u.last_name AS owner_last_name${join} LEFT JOIN users u ON u.uid=d.responsible_uid${clause} ORDER BY d.bitrix_date_create DESC,d.id DESC LIMIT 100 OFFSET ?`).bind(...args,offset).all();
 const parse=(s,f)=>{try{return JSON.parse(s)||f;}catch{return f;}};
 const items=results.map(r=>{const cf=parse(r.custom_fields,{}),phones=parse(r.phones,[]);return {id:r.id,name:cf.astanaName||[r.name,r.last_name].filter(Boolean).join(' ')||r.title,phone:cf.astanaPhone||phones[0]?.value||'',stageId:r.stage_id,trialLessonAt:cf.trialLessonAt||'',source:cf.astanaSource||r.source_description||'',level:cf.astanaLevel||'',note:cf.astanaNote??r.comments??'',responsible:[r.owner_name,r.owner_last_name].filter(Boolean).join(' '),createdAt:r.bitrix_date_create};});
 const response=json({ok:true,readOnly:true,pipeline:{id:pipeline?.id,name:pipeline?.name||'ELC Astana',stages:parse(pipeline?.stages,[])},items,managers,total:count?.n||0,offset,pageSize:100},200,request);
 response.headers.set('Cache-Control','private, no-store');return response;
}
