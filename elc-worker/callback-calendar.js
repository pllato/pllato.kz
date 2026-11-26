export const CALLBACK_PIPELINE='pipeline_r22lrm';
export const CALLBACK_MARK='callback_call';
export async function validateCallbackTask(env,me,links,start,end,dealAccessSql){
 if(links.length!==1)return 'Выберите одну сделку Pllato Старт';
 if(!Number.isFinite(Date.parse(start))||!Number.isFinite(Date.parse(end))||Date.parse(end)<=Date.parse(start)||Date.parse(end)-Date.parse(start)>86400000)return 'Укажите дату, время и длительность звонка';
 const access=dealAccessSql(me);
 const row=await env.DB.prepare('SELECT id FROM deals WHERE id=? AND pipeline_id=?'+access.where).bind(links[0],CALLBACK_PIPELINE,...access.params).first();
 return row?null:'Нет доступа к сделке Pllato Старт';
}
export async function handleCallbackCalendar(request,env,deps){
 const {json,requireAuthFlexible,resolveCanonicalUser,dealAccessSql,rowToCamel}=deps;
 const auth=await requireAuthFlexible(request,env);if(auth.error)return json({error:auth.error},auth.status,request);
 const me=await resolveCanonicalUser(env,auth.claims);
 if((me.userRecord?.active===0||me.userRecord?.active===false)||(Array.isArray(me.orgPerms?.pipelineIds)&&!me.orgPerms.pipelineIds.includes(CALLBACK_PIPELINE)))return json({error:'Нет доступа к Pllato Старт'},403,request);
 const url=new URL(request.url),from=url.searchParams.get('from'),to=url.searchParams.get('to');
 if(!Number.isFinite(Date.parse(from))||!Number.isFinite(Date.parse(to))||Date.parse(to)<=Date.parse(from)||Date.parse(to)-Date.parse(from)>190*86400000)return json({error:'Укажите диапазон до 190 дней'},400,request);
 const access=dealAccessSql(me),where=access.where.replace(/\b(pipeline_id|responsible_uid|created_by_uid|modify_by_uid)\b/g,'d.$1');
 const ids=[...new Set([me.canonicalUid,...(me.matchUids||[])].filter(Boolean))],marks=ids.map(()=>'?').join(',')||"''";
 const own=`(t.responsible_uid IN (${marks}) OR t.created_by_uid IN (${marks}) OR EXISTS(SELECT 1 FROM json_each(CASE WHEN json_valid(t.accomplices) THEN t.accomplices ELSE '[]' END) a WHERE a.value IN (${marks})))`;
 const visibility=url.searchParams.get('scope')==='mine'?own:`(t.event_public=1 OR ${own})`;
 const {results}=await env.DB.prepare(`SELECT t.*,d.id AS linked_deal_id,d.title AS linked_deal_title FROM tasks t JOIN json_each(CASE WHEN json_valid(t.crm_links) THEN t.crm_links ELSE '[]' END) l ON l.type='text' JOIN deals d ON d.id=l.value WHERE t.mark=? AND t.start_date_plan>=? AND t.start_date_plan<? AND t.status IN (1,2,3) AND t.archived_at IS NULL AND d.pipeline_id=?${where} AND ${visibility} ORDER BY t.start_date_plan,t.id LIMIT 501`).bind(CALLBACK_MARK,from,to,CALLBACK_PIPELINE,...access.params,...ids,...ids,...ids).all();
 return json({items:results.slice(0,500).map(t=>({...rowToCamel(t,'tasks'),dealRecordId:t.linked_deal_id,dealTitle:t.linked_deal_title})),truncated:results.length>500},200,request);
}
