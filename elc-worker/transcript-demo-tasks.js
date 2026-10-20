// Source records are the task identity: polling cannot create duplicate tasks.
export async function transcriptDemoTasks(request,env,{me,dealAccessSql,canEditRecord}){
 const reply=(v,status=200)=>Response.json(v,{status});
 if(!me.userRecord||me.userRecord.active===0)return reply({error:'Нет доступа'},403);
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS transcript_demo_state(source_id TEXT PRIMARY KEY, done INTEGER NOT NULL DEFAULT 0, project_id TEXT NOT NULL DEFAULT '', updated_at TEXT, updated_by TEXT)`).run();
 const access=dealAccessSql(me);
 const scope=`d.id IN(SELECT id FROM deals WHERE 1=1${access.where}) AND (d.pipeline_id IN(SELECT id FROM pipelines WHERE name IN('Pllato Старт','Pllato Производство')) OR EXISTS(SELECT 1 FROM json_each(CASE WHEN json_valid(d.mirrored_in) THEN d.mirrored_in ELSE '{}' END) m JOIN pipelines p ON p.id=m.key WHERE p.name IN('Pllato Старт','Pllato Производство')))`;
 const sources=`SELECT 'zoom:'||f.id AS id,f.deal_id,d.title AS client,f.topic AS title,f.recording_start AS meeting_at,f.imported_at AS arrived_at,'Zoom' AS source,'/api/zoom/files/'||f.id AS file_path,meta.v AS duration_seconds FROM zoom_files f JOIN deals d ON d.id=f.deal_id LEFT JOIN zoom_private meta ON meta.k='duration:'||f.id WHERE f.status='stored' AND f.deleted_at IS NULL AND (lower(f.kind) LIKE '%transcript%' OR upper(f.extension) IN('VTT','TXT')) AND ${scope}
 UNION ALL SELECT 'manual:'||f.id,f.deal_id,d.title,f.name,f.uploaded_at,f.uploaded_at,'Загружена вручную','/api/deals/'||f.deal_id||'/qualification/recording/'||f.id,NULL FROM deal_qual_recordings f JOIN deals d ON d.id=f.deal_id WHERE f.kind='transcript' AND ${scope}`;
 const params=[...access.params,...access.params];
 const url=new URL(request.url);
 if(request.method==='GET'){
  const offset=Math.max(0,Math.min(100000,parseInt(url.searchParams.get('offset')||'0',10)||0));
  const rows=await env.DB.prepare(`WITH sources AS (${sources}) SELECT s.*,COALESCE(t.done,0) AS done,COALESCE(t.project_id,'') AS project_id FROM sources s LEFT JOIN transcript_demo_state t ON t.source_id=s.id ORDER BY COALESCE(s.arrived_at,s.meeting_at) DESC,s.id LIMIT 101 OFFSET ?`).bind(...params,offset).all();
  return reply({items:rows.results.slice(0,100),hasMore:rows.results.length>100});
 }
 if(request.method==='PUT'){
  const raw=await request.text();if(raw.length>3000)return reply({error:'Слишком большой запрос'},413);
  let body;try{body=JSON.parse(raw);}catch{return reply({error:'Некорректные данные'},400);}
  if(!body||typeof body.id!=='string')return reply({error:'Не указано дело'},400);
  const source=await env.DB.prepare(`WITH sources AS (${sources}) SELECT * FROM sources WHERE id=?`).bind(...params,body.id).first();
  if(!source||!await canEditRecord(env,me,'deals',source.deal_id))return reply({error:'Нет доступа к изменению сделки'},403);
  if(typeof body.done!=='boolean'||typeof body.projectId!=='string'||!/^[a-zA-Z0-9_-]{0,160}$/.test(body.projectId))return reply({error:'Некорректные параметры'},400);
  await env.DB.prepare(`INSERT INTO transcript_demo_state(source_id,done,project_id,updated_at,updated_by) VALUES(?,?,?,?,?) ON CONFLICT(source_id) DO UPDATE SET done=excluded.done,project_id=excluded.project_id,updated_at=excluded.updated_at,updated_by=excluded.updated_by`).bind(body.id,Number(body.done),body.projectId,new Date().toISOString(),me.canonicalUid).run();
  return reply({ok:true});
 }
 return reply({error:'Метод не поддерживается'},405);
}
