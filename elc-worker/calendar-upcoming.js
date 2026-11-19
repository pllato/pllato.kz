// Two-day portal calendar: no full deal lists, task counts, or migration DDL.
export async function handleCalendarUpcoming(request,env,deps){
 const {json,requireAuthFlexible,resolveCanonicalUser,dealAccessSql,widgetDayBounds,widgetParseWhen,widgetLinkedDealId}=deps;
 const auth=await requireAuthFlexible(request,env);
 if(auth.error)return json({error:auth.error},auth.status,request);
 try{
  const me=await resolveCanonicalUser(env,auth.claims);
  const access=dealAccessSql({...me,orgPerms:{...me.orgPerms,dealScope:'all'}});
  const {date,tzo,dayStart}=widgetDayBounds(new URL(request.url));
  const dayEnd=dayStart+2*86400000;
  // Offset-aware strings can cross a date boundary; narrow SQL to four dates,
  // then apply exact millisecond bounds below. Local datetime strings use tzo.
  const dates=Array.from({length:4},(_,i)=>new Date(Date.parse(date+'T00:00:00Z')+(i-1)*86400000).toISOString().slice(0,10));
  const from=dates[0],to=dates[3]+'T23:59:59.999';
  const [pipes,tasks,deals]=await env.DB.batch([
   env.DB.prepare('SELECT id,name,stages FROM pipelines'),
   env.DB.prepare(`SELECT id,title,mark,start_date_plan,end_date_plan,deadline,crm_links,bitrix_crm_links,calendar_deal_title FROM tasks WHERE id IN (
    SELECT id FROM tasks INDEXED BY idx_calendar_tasks_start WHERE status IN (1,2,3) AND archived_at IS NULL AND start_date_plan >= ? AND start_date_plan <= ?
    UNION
    SELECT id FROM tasks INDEXED BY idx_calendar_tasks_deadline WHERE status IN (1,2,3) AND archived_at IS NULL AND deadline >= ? AND deadline <= ?
   )`).bind(from,to,from,to),
   env.DB.prepare(`SELECT id,title,pipeline_id,stage_id,opportunity,custom_fields,bitrix_id FROM deals INDEXED BY idx_calendar_deals_first_zoom WHERE (archived IS NULL OR archived=0) AND json_valid(custom_fields) AND substr(json_extract(custom_fields,'$.firstZoomAt'),1,10) IN (?,?,?,?)${access.where}`).bind(...dates,...access.params)
  ]);
  const parse=(s,fallback)=>{try{return JSON.parse(s)||fallback;}catch{return fallback;}};
  const books=new Map((pipes.results||[]).map(p=>[p.id,{name:p.name,stages:parse(p.stages,{})}]));
  const byId=new Map();
  function remember(d){byId.set(String(d.id).replace(/^deal_/,''),d);if(d.bitrix_id)byId.set(String(d.bitrix_id),d);}
  for(const d of deals.results||[])remember(d);
  const missing=[...new Set((tasks.results||[]).map(widgetLinkedDealId).filter(id=>id&&!byId.has(id)))];
  // Linked deal IDs are bounded by this two-day task set, batched under D1's
  // variable limit. Access restrictions still apply to their details.
  for(let i=0;i<missing.length;i+=70){
   const part=missing.slice(i,i+70).map(id=>'deal_'+id);
   const found=await env.DB.prepare(`SELECT id,title,pipeline_id,stage_id,opportunity,bitrix_id FROM deals WHERE id IN (${part.map(()=>'?').join(',')})${access.where}`).bind(...part,...access.params).all();
   for(const d of found.results||[])remember(d);
  }
  const events=[];
  const inRange=at=>Number.isFinite(at)&&at>=dayStart&&at<dayEnd;
  const details=d=>{const p=books.get(d?.pipeline_id);return {deal:d?.id||'',pipe:p?.name||'',stage:p?.stages?.[d?.stage_id]?.name||'',sum:Number(d?.opportunity)||0};};
  for(const d of deals.results||[]){
   const at=widgetParseWhen(parse(d.custom_fields,{}).firstZoomAt,tzo);if(!inRange(at))continue;
   events.push({at,end:at+3600000,kind:'meet',src:'первый Zoom',title:'Zoom: '+(d.title||'сделка'),...details(d),zoomPath:'/deals/'+encodeURIComponent(d.id)+'/first-meeting',href:'team.html?page=calendar#deal/'+encodeURIComponent(d.id)});
  }
  const marks=new Set(['zoom_meeting','offline_meeting','demo_meeting']);
  for(const t of tasks.results||[]){
   const meet=marks.has(t.mark),at=widgetParseWhen(meet?(t.start_date_plan||t.deadline):t.deadline,tzo);if(!inRange(at))continue;
   const d=byId.get(widgetLinkedDealId(t)),title=d?.title||t.calendar_deal_title||'',end=widgetParseWhen(t.end_date_plan,tzo);
   events.push({at,end:Number.isFinite(end)?end:at+(meet?3600000:1800000),kind:meet?'meet':'task',src:meet?'встреча':'задача',title:title?'Сделка: '+title:t.title||'Задача',note:title?t.title||'':'',...details(d),zoomPath:t.mark==='zoom_meeting'?'/tasks/'+encodeURIComponent(t.id):'',href:'team.html?page=calendar#'+(d?'deal/'+encodeURIComponent(d.id):'task/'+encodeURIComponent(t.id))});
  }
  const taskMeets=new Set(events.filter(e=>e.src==='встреча'&&e.deal).map(e=>e.deal+'|'+e.at));
  const seen=new Set();
  const items=events.filter(e=>{if(e.src==='первый Zoom'&&taskMeets.has(e.deal+'|'+e.at))return false;const k=e.at+'|'+e.title;if(seen.has(k))return false;seen.add(k);return true;}).sort((a,b)=>a.at-b.at);
  return json({ok:true,items},200,request);
 }catch(error){
  console.error('calendar upcoming:',error.message);
  return json({error:'Календарь временно недоступен'},503,request);
 }
}
