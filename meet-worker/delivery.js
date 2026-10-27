// Durable delivery ledger: browser retries only upload; AI jobs survive tab closure.
export async function beginDelivery(env,meeting,id){
 const db=env.CRM_DB, started=new Date(Number(id.split('-').pop())).toISOString();
 await db.prepare(`INSERT INTO meet_delivery(id,room,deal_id,topic,started,updated) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET updated=excluded.updated`).bind(id,meeting.meeting_id,meeting.deal_id,meeting.topic,started,Date.now()).run();
 await db.batch(['recording','transcript'].map(kind=>db.prepare(`INSERT INTO zoom_files(id,meeting_uuid,meeting_id,deal_id,topic,recording_start,kind,extension,size,status) VALUES(?,?,?,?,?,?,?,?,0,'processing') ON CONFLICT(id) DO UPDATE SET status=CASE WHEN zoom_files.status IN ('interrupted','failed') THEN 'processing' ELSE zoom_files.status END,error=NULL`).bind('pmeet_'+id+'_'+kind,id,meeting.meeting_id,meeting.deal_id,meeting.topic,started,kind,kind==='recording'?'WEBM':'TXT')));
}
export async function acceptAudio(env,meeting,id,seq,request){
 if(!Number.isInteger(seq)||seq<0||seq>=1440)throw new Error('Invalid audio sequence');
 const previous=await env.CRM_DB.prepare('SELECT state FROM meet_audio_jobs WHERE id=? AND seq=?').bind(id,seq).first();
 if(previous)return;
 const bytes=await request.arrayBuffer();
 if(bytes.byteLength<44||bytes.byteLength>2_000_000)throw new Error('Invalid audio size');
 const view=new DataView(bytes),u=new Uint8Array(bytes);
 if(String.fromCharCode(...u.slice(0,4))!=='RIFF'||String.fromCharCode(...u.slice(8,12))!=='WAVE'||view.getUint32(24,true)!==16000||view.getUint16(22,true)!==1||view.getUint16(34,true)!==16)throw new Error('Expected mono PCM 16kHz WAV');
 await beginDelivery(env,meeting,id);
 const key=`crm-meet/${id}/audio/${seq}.wav`;
 await env.CRM_FILES.put(key,bytes,{httpMetadata:{contentType:'audio/wav'}});
 await env.CRM_DB.prepare('INSERT INTO meet_audio_jobs(id,seq,r2_key) VALUES(?,?,?) ON CONFLICT(id,seq) DO NOTHING').bind(id,seq,key).run();
}
export async function finishDelivery(env,id,count){
 if(!Number.isInteger(count)||count<0||count>1440)throw new Error('Invalid audio count');
 await env.CRM_DB.prepare('UPDATE meet_delivery SET finished=1,expected=?,updated=? WHERE id=?').bind(count,Date.now(),id).run();
}
function base64(buffer){let str='';const bytes=new Uint8Array(buffer);for(let i=0;i<bytes.length;i+=8192)str+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(str);}
export async function processDelivery(env){
 const db=env.CRM_DB,now=Date.now();
 await db.prepare("UPDATE meet_audio_jobs SET state='failed',error='Обработка прервана после 6 попыток' WHERE state='running' AND retry_at<=? AND attempts>=6").bind(now).run();
 // Leases also recover a worker terminated in the middle of an inference.
 const {results:jobs}=await db.prepare("SELECT * FROM meet_audio_jobs WHERE state IN ('pending','running') AND retry_at<=? AND attempts<6 ORDER BY retry_at,id,seq LIMIT 8").bind(now).all();
 for(const job of jobs){
  const lease=await db.prepare("UPDATE meet_audio_jobs SET state='running',attempts=attempts+1,retry_at=? WHERE id=? AND seq=? AND retry_at<=? AND state IN ('pending','running') AND attempts<6").bind(now+300000,job.id,job.seq,now).run();
  if(!lease.meta.changes)continue;
  try{
   const obj=await env.CRM_FILES.get(job.r2_key);if(!obj)throw new Error('Audio fragment missing');
   const result=await env.AI.run('@cf/openai/whisper-large-v3-turbo',{audio:base64(await obj.arrayBuffer()),task:'transcribe',vad_filter:true,condition_on_previous_text:false});
   if(typeof result?.text!=='string')throw new Error('Invalid transcription response');
   await db.prepare("UPDATE meet_audio_jobs SET state='done',text=?,error=NULL WHERE id=? AND seq=?").bind(result.text.trim(),job.id,job.seq).run();
  }catch(e){
   await db.prepare("UPDATE meet_audio_jobs SET state=?,error=?,retry_at=? WHERE id=? AND seq=?").bind(job.attempts>=5?'failed':'pending',String(e.message).slice(0,200),now+Math.min(3600000,60000*2**job.attempts),job.id,job.seq).run();
  }
 }
 const {results:sessions}=await db.prepare(`SELECT d.* FROM meet_delivery d JOIN zoom_files f ON f.id='pmeet_'||d.id||'_transcript' WHERE d.finished=1 AND f.status='processing' LIMIT 25`).all();
 for(const s of sessions){
  const {results:parts}=await db.prepare('SELECT seq,state,text,error FROM meet_audio_jobs WHERE id=? ORDER BY seq').bind(s.id).all();
  const failed=parts.find(p=>p.state==='failed');
  const complete=s.expected>0&&parts.length===s.expected&&parts.every((p,i)=>p.seq===i&&p.state==='done');
  if(!complete){
   if(failed||!s.expected||now-s.updated>86400000){
    await db.prepare("UPDATE zoom_files SET status='failed',error=? WHERE id=? AND status='processing'").bind(failed?'Не удалось распознать часть аудио после повторных попыток. Аудио сохранено.':!s.expected?'Звук для серверной расшифровки не получен.':'Не все фрагменты доставлены. Откройте архив на устройстве организатора для восстановления.','pmeet_'+s.id+'_transcript').run();
   }
   continue;
  }
  const spoken=parts.some(p=>p.text);
  const body='Pllato Meet — автоматическая расшифровка\nГоворящие не разделены.\n\n'+(spoken?parts.filter(p=>p.text).map(p=>`[${String(p.seq).padStart(2,'0')}:00] ${p.text}`).join('\n\n'):'В сохранённой аудиодорожке речь не обнаружена.');
  const key=`crm-meet/${s.id}/transcript.txt`;
  await env.CRM_FILES.put(key,body,{httpMetadata:{contentType:'text/plain;charset=utf-8'}});
  const metaKey=`crm-meet/${s.id}/meeting.json`,meta=await env.CRM_FILES.get(metaKey);
  if(meta){const info=JSON.parse(await meta.text());info.transcriptStatus=spoken?'available':'no_speech';await env.CRM_FILES.put(metaKey,JSON.stringify(info),{httpMetadata:{contentType:'application/json'}});}
  await db.prepare("UPDATE zoom_files SET status='stored',r2_key=?,size=?,imported_at=?,error=NULL WHERE id=? AND deleted_at IS NULL").bind(key,new TextEncoder().encode(body).length,new Date().toISOString(),'pmeet_'+s.id+'_transcript').run();
 }
 // A disconnected recorder must not look as if it is processing forever.
 await db.prepare("UPDATE zoom_files SET status='interrupted',error='Загрузка прервана. Откройте архив встреч на устройстве организатора и восстановите локальную копию.' WHERE status='processing' AND meeting_uuid IN (SELECT id FROM meet_delivery WHERE finished=0 AND updated<?)").bind(now-300000).run();
}
