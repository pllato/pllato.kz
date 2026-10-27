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
