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
  return withShortLink(env,saved);
}

// One immutable room pointer per deal. Existing invitations keep working;
// the earliest ready Pllato room is adopted instead of replacing its URL.
export async function dealRoom(env,dealId){
  const meeting=await env.DB.prepare("SELECT m.* FROM zoom_private p JOIN zoom_meetings m ON m.meeting_id=p.v WHERE p.k=? AND m.deal_id=? AND m.status='ready'")
    .bind('pmeet-deal:'+dealId,dealId).first();
  return withShortLink(env,meeting);
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

// Unique, immutable public aliases. Collision checks extend the code rather than reuse a room.
export async function withShortLink(env,meeting){
  if(!isPllatoMeeting(meeting?.meeting_id) || /^https:\/\/pllato.kz\/m\/d[a-f0-9]{12,32}$/.test(meeting.join_url||''))return meeting;
  const hex=meeting.meeting_id.slice(4).replaceAll('-','');
  for(let length=12;length<=32;length+=2){
    const code='d'+hex.slice(0,length),key='pmeet-link:'+code;
    await env.DB.prepare('INSERT INTO zoom_private(k,v) VALUES(?,?) ON CONFLICT(k) DO NOTHING').bind(key,meeting.meeting_id).run();
    const saved=await env.DB.prepare('SELECT v FROM zoom_private WHERE k=?').bind(key).first();
    if(saved?.v!==meeting.meeting_id)continue;
    const link='https://pllato.kz/m/'+code;
    await env.DB.prepare('UPDATE zoom_meetings SET join_url=? WHERE meeting_id=?').bind(link,meeting.meeting_id).run();
    return {...meeting,join_url:link};
  }
  throw new Error('Не удалось создать короткую ссылку');
}
