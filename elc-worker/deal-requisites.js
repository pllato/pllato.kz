// Private deal requisites. Text and attachments are independent, so uploading
// a file cannot overwrite another manager's text edit.
export async function handleDealRequisites(request, env, deps, dealId, fileId) {
  const {json,requireAuthFlexible,resolveCanonicalUser,dealAccessSql,canEditRecord,corsHeaders}=deps;
  const auth=await requireAuthFlexible(request,env);
  if(auth.error)return json({error:auth.error},auth.status,request);
  const me=await resolveCanonicalUser(env,auth.claims),access=dealAccessSql(me);
  const deal=await env.DB.prepare('SELECT id FROM deals WHERE id=?'+access.where).bind(dealId,...access.params).first();
  if(!deal)return json({error:'Нет доступа к сделке'},403,request);
  if(request.method!=='GET' && !await canEditRecord(env,me,'deals',dealId))return json({error:'Нет права изменения сделки'},403,request);
  await env.DB.batch([
    env.DB.prepare('CREATE TABLE IF NOT EXISTS deal_requisites (deal_id TEXT PRIMARY KEY, text TEXT NOT NULL, updated_by TEXT, updated_at TEXT NOT NULL)'),
    env.DB.prepare('CREATE TABLE IF NOT EXISTS deal_requisite_files (id TEXT PRIMARY KEY, deal_id TEXT NOT NULL, name TEXT NOT NULL, mime TEXT NOT NULL, size INTEGER NOT NULL, r2_key TEXT NOT NULL, uploaded_by TEXT, created_at TEXT NOT NULL)'),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_requisite_deal ON deal_requisite_files(deal_id)')
  ]);
  if(fileId){
    const f=await env.DB.prepare('SELECT * FROM deal_requisite_files WHERE id=? AND deal_id=?').bind(fileId,dealId).first();
    if(!f)return json({error:'Файл не найден'},404,request);
    if(request.method!=='GET')return json({error:'Method not allowed'},405,request);
    const object=await env.FILES.get(f.r2_key);if(!object)return json({error:'Файл отсутствует'},404,request);
    const headers=new Headers(corsHeaders(request));
    headers.set('Content-Type',f.mime);headers.set('Content-Length',String(object.size));
    headers.set('Cache-Control','private, no-store');headers.set('X-Content-Type-Options','nosniff');
    const inline=/^image\/(png|jpeg|webp|gif)$/.test(f.mime);
    headers.set('Content-Disposition',(inline?'inline':'attachment')+"; filename*=UTF-8''"+encodeURIComponent(f.name));
    return new Response(object.body,{headers});
  }
  if(request.method==='GET'){
    const row=await env.DB.prepare('SELECT text,updated_at FROM deal_requisites WHERE deal_id=?').bind(dealId).first();
    const {results}=await env.DB.prepare('SELECT id,name,mime,size,created_at FROM deal_requisite_files WHERE deal_id=? ORDER BY created_at').bind(dealId).all();
    return json({text:row?.text || '',files:results},200,request);
  }
  if(request.method==='PUT'){
    const body=await request.json();if(typeof body.text!=='string'||body.text.length>50000)return json({error:'Текст реквизитов — не более 50 000 символов'},400,request);
    await env.DB.prepare('INSERT INTO deal_requisites VALUES(?,?,?,?) ON CONFLICT(deal_id) DO UPDATE SET text=excluded.text,updated_by=excluded.updated_by,updated_at=excluded.updated_at').bind(dealId,body.text,me.canonicalUid,new Date().toISOString()).run();
    return json({ok:true},200,request);
  }
  if(request.method==='POST'){
    const limit=15*1024*1024;
    const size=Number(request.headers.get('Content-Length'));
    if(!size || size>limit)return json({error:'Файл должен быть от 1 байта до 15 МБ'},413,request);
    const name=decodeURIComponent(request.headers.get('X-File-Name')||'Файл').slice(0,250);
    const mime=(request.headers.get('Content-Type')||'application/octet-stream').split(';')[0].toLowerCase();
    const allowed=['image/png','image/jpeg','image/webp','image/gif','application/pdf','text/plain','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if(!allowed.includes(mime))return json({error:'Поддерживаются изображения PNG/JPG/WebP/GIF, PDF, Word, Excel и TXT'},400,request);
    const id=crypto.randomUUID(),key='deal-requisites/'+id;
    const object=await env.FILES.put(key,request.body,{httpMetadata:{contentType:mime}});
    if(!object || object.size!==size){await env.FILES.delete(key);return json({error:'Загрузка не завершена'},400,request);}
    try{await env.DB.prepare('INSERT INTO deal_requisite_files VALUES(?,?,?,?,?,?,?,?)').bind(id,dealId,name,mime,size,key,me.canonicalUid,new Date().toISOString()).run();}
    catch(e){await env.FILES.delete(key);throw e;}
    return json({ok:true,file:{id,name,mime,size}},200,request);
  }
  return json({error:'Method not allowed'},405,request);
}
