const ROOM=/^crm-[a-f0-9-]{36}$/;
export async function crmMeeting(env, room){
  if(!ROOM.test(room||'') || !env.CRM_DB) return null;
  return env.CRM_DB.prepare("SELECT m.*,p.v AS host_key FROM zoom_meetings m JOIN zoom_private p ON p.k='pmeet-host:'||m.meeting_id WHERE m.meeting_id=? AND m.status='ready'").bind(room).first();
}
export async function authorizeCrmArchive(request, env, id){
  const room=String(id||'').match(/^(crm-[a-f0-9-]{36})-\d+$/)?.[1];
  const meeting=await crmMeeting(env,room);
  const token=(request.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'');
  return meeting && token && token===meeting.host_key ? meeting : null;
}
export async function indexCrmArchive(env, meeting, id, meta){
  const date=new Date(Number(meta.date)||Date.now()).toISOString();
  const transcript=Array.isArray(meta.transcript)?meta.transcript:[];
  const chat=Array.isArray(meta.chat)?meta.chat:[];
  const files=[];
  const video=meta.recording ? await env.CRM_FILES.head(`rec/crm/${id}.webm`) : null;
  if(meta.recording && !video) throw new Error('CRM recording not complete');
  if(video)files.push({kind:'recording',extension:meta.mime?.includes('mp4')?'MP4':'WEBM',key:`rec/crm/${id}.webm`,size:video.size});
  if(transcript.some(line=>String(line.text||'').trim())){
    const body=transcript.map(line=>`${String(line.name||'Участник')}: ${String(line.text||'')}`).join('\n');
    const key=`crm-meet/${id}/transcript.txt`;await env.CRM_FILES.put(key,body,{httpMetadata:{contentType:'text/plain;charset=utf-8'}});
    files.push({kind:'transcript',extension:'TXT',key,size:new TextEncoder().encode(body).length});
  }
  const body=JSON.stringify({room:meeting.meeting_id,participants:meta.participants||[],durationSec:meta.durationSec,chat,transcriptStatus:transcript.length?'available':'unavailable'});
  const key=`crm-meet/${id}/meeting.json`;await env.CRM_FILES.put(key,body,{httpMetadata:{contentType:'application/json'}});
  files.push({kind:'chat_metadata',extension:'JSON',key,size:new TextEncoder().encode(body).length});
  await env.CRM_DB.batch(files.map(file=>env.CRM_DB.prepare(`INSERT INTO zoom_files(id,meeting_uuid,meeting_id,deal_id,topic,recording_start,kind,extension,size,r2_key,status,imported_at)
    VALUES(?,?,?,?,?,?,?,?,?,?,'stored',?) ON CONFLICT(id) DO UPDATE SET size=excluded.size,r2_key=excluded.r2_key,status='stored',error=NULL`)
    .bind('pmeet_'+id+'_'+file.kind,id,meeting.meeting_id,meeting.deal_id,meeting.topic,date,file.kind,file.extension,file.size,file.key,new Date().toISOString())));
}
