// Keep the established CRM meeting/file contract, with Pllato Meet as provider.
export const isPllatoMeeting = id => /^crm-[a-f0-9-]{36}$/.test(String(id || ''));
export async function createPllatoMeeting(env, task, dealId) {
  const room='crm-'+crypto.randomUUID(), hostKey='hk_'+crypto.randomUUID();
  await env.DB.batch([
    env.DB.prepare('INSERT INTO zoom_private(k,v) VALUES(?,?)').bind('pmeet-host:'+room,hostKey),
    env.DB.prepare(`INSERT INTO zoom_meetings(task_id,meeting_id,deal_id,join_url,topic,status,created_at)
      VALUES(?,?,?,?,?,'ready',?) ON CONFLICT(task_id) DO NOTHING`).bind(task.id,room,dealId,
      'https://pllato.kz/meet.html?room='+room,task.title,new Date().toISOString()),
  ]);
  const saved=await env.DB.prepare('SELECT * FROM zoom_meetings WHERE task_id=?').bind(task.id).first();
  if(saved.meeting_id!==room) await env.DB.prepare('DELETE FROM zoom_private WHERE k=?').bind('pmeet-host:'+room).run();
  return saved;
}

// One immutable room pointer per deal. Existing invitations keep working;
// the earliest ready Pllato room is adopted instead of replacing its URL.
export async function dealRoom(env,dealId){
  return env.DB.prepare("SELECT m.* FROM zoom_private p JOIN zoom_meetings m ON m.meeting_id=p.v WHERE p.k=? AND m.deal_id=? AND m.status='ready'")
    .bind('pmeet-deal:'+dealId,dealId).first();
}
export async function ensureDealRoom(env,dealId,title='Встреча по сделке'){
  const saved=await dealRoom(env,dealId);if(saved)return saved;
  const previous=await env.DB.prepare("SELECT meeting_id FROM zoom_meetings WHERE deal_id=? AND meeting_id LIKE 'crm-%' AND status='ready' ORDER BY created_at,task_id LIMIT 1").bind(dealId).first();
  const room=previous?.meeting_id||'crm-'+crypto.randomUUID();
  // All statements use the winning pointer, including concurrent first opens.
  await env.DB.batch([
    env.DB.prepare('INSERT INTO zoom_private(k,v) VALUES(?,?) ON CONFLICT(k) DO NOTHING').bind('pmeet-deal:'+dealId,room),
    env.DB.prepare(`INSERT INTO zoom_meetings(task_id,meeting_id,deal_id,join_url,topic,status,created_at)
      SELECT ?,p.v,?,'https://pllato.kz/meet.html?room='||p.v,?,'ready',? FROM zoom_private p
      WHERE p.k=? AND NOT EXISTS(SELECT 1 FROM zoom_meetings m WHERE m.meeting_id=p.v)
      ON CONFLICT(task_id) DO NOTHING`).bind('deal_room:'+dealId,dealId,title,new Date().toISOString(),'pmeet-deal:'+dealId),
    env.DB.prepare("INSERT INTO zoom_private(k,v) SELECT 'pmeet-host:'||v,? FROM zoom_private WHERE k=? ON CONFLICT(k) DO NOTHING")
      .bind('hk_'+crypto.randomUUID(),'pmeet-deal:'+dealId),
  ]);
  const result=await dealRoom(env,dealId);
  if(!result)throw new Error('Постоянная комната сделки недоступна');
  return result;
}
