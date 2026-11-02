const fail=(message,status)=>Object.assign(new Error(message),{status});
const parse=(value,fallback)=>{try{return JSON.parse(value)||fallback;}catch{return fallback;}};
// Called only after the authenticated CRM gate. Same employee/deal policy as host-access.
export async function meetingClientContext(env,room,me,canReadDeal){
  if(!me||!['admin','manager','agent'].includes(me.role))throw fail('Нет доступа',403);
  const meeting=await env.DB.prepare("SELECT deal_id,task_id FROM zoom_meetings WHERE meeting_id=? AND status='ready'").bind(room).first();
  if(!meeting)throw fail('Встреча не найдена',404);
  if(!meeting.deal_id)return null;
  if(!await canReadDeal(meeting.deal_id))throw fail('Нет доступа к сделке',403);
  const row=await env.DB.prepare(`SELECT d.id,d.title,d.custom_fields,c.name,c.last_name,c.phones,
    p.name AS pipeline,p.stages,d.stage_id,u.name AS manager_name,u.last_name AS manager_last_name,
    t.start_date_plan,t.end_date_plan
    FROM deals d LEFT JOIN contacts c ON c.id=d.contact_id
    LEFT JOIN pipelines p ON p.id=d.pipeline_id LEFT JOIN users u ON u.uid=d.responsible_uid
    LEFT JOIN tasks t ON t.id=? WHERE d.id=?`).bind(meeting.task_id,meeting.deal_id).first();
  if(!row)return null;
  const phones=parse(row.phones,[]),stages=parse(row.stages,{});
  const phone=Array.isArray(phones)?phones[0]:null;
  return {dealId:row.id,title:row.title||'',contactName:[row.name,row.last_name].filter(Boolean).join(' '),
    phone:typeof phone==='string'?phone:String(phone?.VALUE||phone?.value||''),pipeline:row.pipeline||'',
    stage:stages[row.stage_id]?.name||'',responsible:[row.manager_name,row.manager_last_name].filter(Boolean).join(' '),
    startTime:row.start_date_plan||(meeting.task_id?.startsWith('deal_room:')?parse(row.custom_fields,{}).firstZoomAt:'')||'',endTime:row.end_date_plan||''};
}
