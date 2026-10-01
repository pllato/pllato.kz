import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { handleZoomRequest, ensureZoomForTask, processZoomJobs, notifyZoomFiles, zoomMeetingPath } from './zoom.js';

function fixture() {
  const db=new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE tasks(id TEXT PRIMARY KEY,title TEXT,mark TEXT,start_date_plan TEXT,end_date_plan TEXT,deadline TEXT,crm_links TEXT,event_public INTEGER);
    CREATE TABLE deals(id TEXT PRIMARY KEY,pipeline_id TEXT,stage_id TEXT,stage_changed_at TEXT);`);
  const DB={prepare(sql){return {args:[],bind(...args){this.args=args;return this;},async first(){return db.prepare(sql).get(...this.args)||null;},async all(){return {results:db.prepare(sql).all(...this.args)};},async run(){return db.prepare(sql).run(...this.args);}};},async batch(stmts){return Promise.all(stmts.map(s=>s.run()));}};
  const objects=new Map();
  const FILES={async put(k,stream){const data=new Uint8Array(await new Response(stream).arrayBuffer());const o={size:data.length,etag:'test',data};objects.set(k,o);return o;},async head(k){return objects.get(k)||null;},async delete(k){objects.delete(k);}};
  const env={DB,FILES,ZOOM_CLIENT_ID:'test-client',ZOOM_CLIENT_SECRET:'test-secret'};
  const deps={json:(v,s=200)=>Response.json(v,{status:s}),corsHeaders:()=>({}),requireAuthFlexible:async()=>({claims:{}}),resolveCanonicalUser:async()=>({role:'admin',canonicalUid:'me'}),dealAccessSql:()=>({where:'',params:[]}),canEditRecord:async()=>true};
  const request=(path,method='GET',body)=>handleZoomRequest(new Request('https://crm.test/api/zoom'+path,{method,body:body?JSON.stringify(body):undefined}),env,deps);
  async function connect() {
    await request('/status');
    db.prepare('INSERT INTO zoom_private VALUES(?,?)').run('state:test',String(Date.now()+60000));
    const original=globalThis.fetch;
    globalThis.fetch=async()=>Response.json({access_token:'test-token',refresh_token:'test-refresh',expires_in:3600});
    try{assert.equal((await request('/callback?state=test&code=test')).status,302);}finally{globalThis.fetch=original;}
    db.prepare('INSERT INTO zoom_private VALUES(?,?)').run('last_scan',String(Date.now()));
  }
  return {db,env,deps,request,connect,objects};
}

test('UUID встречи с косыми чертами кодируется дважды',()=>{
  assert.equal(zoomMeetingPath('/a//b='),'%252Fa%252F%252Fb%253D');
});
test('OAuth state одноразовый, токены не хранятся открытым текстом',async()=>{
  const f=fixture();await f.connect();
  const stored=f.db.prepare("SELECT v FROM zoom_private WHERE k='tokens'").get().v;
  assert.ok(!stored.includes('test-token'));assert.ok(!stored.includes('test-refresh'));
  assert.equal((await f.request('/callback?state=test&code=test')).status,403);
});
test('повторное создание события не создаёт второй Zoom',async()=>{
  const f=fixture();await f.connect();
  f.db.prepare('INSERT INTO tasks VALUES(?,?,?,?,?,?,?,?)').run('t1','Встреча','zoom_meeting','2026-10-01T10:00:00Z','2026-10-01T11:00:00Z',null,'["deal_1"]',1);
  let posts=0;const original=globalThis.fetch;
  globalThis.fetch=async(url,options)=>{assert.equal(options.method,'POST');posts++;return Response.json({id:123,join_url:'https://zoom.us/j/123'});};
  try{await ensureZoomForTask(f.env,'t1');await ensureZoomForTask(f.env,'t1');assert.equal(posts,1);}finally{globalThis.fetch=original;}
});
test('таймаут создания не вызывает повторный POST',async()=>{
  const f=fixture();await f.connect();
  f.db.prepare('INSERT INTO tasks VALUES(?,?,?,?,?,?,?,?)').run('t1','Встреча','zoom_meeting','2026-10-01T10:00:00Z','2026-10-01T11:00:00Z',null,'[]',1);
  let posts=0;const original=globalThis.fetch;globalThis.fetch=async()=>{posts++;throw new Error('timeout');};
  try{await assert.rejects(ensureZoomForTask(f.env,'t1'));await assert.rejects(ensureZoomForTask(f.env,'t1'));assert.equal(posts,1);}finally{globalThis.fetch=original;}
});
test('ошибка копии не удаляет оригинал; успешная копия проверяется перед trash',async()=>{
  const f=fixture();await f.connect();f.env.ZOOM_TRASH_AFTER_COPY='true';
  f.db.prepare("INSERT INTO zoom_files(id,meeting_uuid,meeting_id,deal_id,extension,size) VALUES('f1','uuid','123','deal_1','MP4',4)").run();
  const original=globalThis.fetch;let deletes=0,wrong=true;
  globalThis.fetch=async(url,options)=>{
    if(options.method==='DELETE'){deletes++;assert.equal(f.objects.size,1);return new Response(null,{status:204});}
    if(String(url).includes('api.zoom.us'))return Response.json({recording_files:[{id:'f1',status:'completed',download_url:'https://zoom.us/file',file_size:4}]});
    return new Response(new Uint8Array(wrong?3:4));
  };
  try{
    await processZoomJobs(f.env);assert.equal(deletes,0);assert.equal(f.objects.size,0);
    assert.equal(f.db.prepare("SELECT status FROM zoom_files WHERE id='f1'").get().status,'pending');
    wrong=false;f.db.prepare("UPDATE zoom_files SET retry_at=NULL WHERE id='f1'").run();
    await processZoomJobs(f.env);assert.equal(deletes,1);
    assert.ok(f.db.prepare("SELECT zoom_deleted_at FROM zoom_files WHERE id='f1'").get().zoom_deleted_at);
  }finally{globalThis.fetch=original;}
});
test('архив хранит старое видео и текст на всех этапах даже с устаревшим флагом очистки',async()=>{
  const f=fixture();await f.connect();f.env.ZOOM_RETENTION_ENABLED='true';
  f.db.prepare('INSERT INTO deals VALUES(?,?,?,?)').run('deal_1','pipeline_r22lrm','STAGE_MPC2F','2020-01-01T00:00:00Z');
  f.db.prepare('INSERT INTO deals VALUES(?,?,?,?)').run('deal_2','pipeline_r22lrm','STAGE_OLNST','2020-01-01T00:00:00Z');
  for(const [id,deal,ext]of [['video','deal_1','MP4'],['text','deal_1','VTT'],['advance','deal_2','MP4']]){
    f.db.prepare("INSERT INTO zoom_files(id,meeting_uuid,meeting_id,deal_id,extension,size,status,r2_key,zoom_deleted_at,imported_at) VALUES(?,'uuid','123',?, ?,4,'stored',?,'2020-01-01','2020-01-01')").run(id,deal,ext,id);f.objects.set(id,{size:4});
  }
  await processZoomJobs(f.env);assert.equal(f.objects.has('video'),true);assert.equal(f.objects.has('text'),true);assert.equal(f.objects.has('advance'),true);
});
test('посторонний пользователь не читает файлы и не подключает аккаунт',async()=>{
  const f=fixture();await f.request('/status');f.deps.resolveCanonicalUser=async()=>({role:'agent'});f.deps.dealAccessSql=()=>({where:' AND 0=1',params:[]});
  assert.equal((await f.request('/files?deal=deal_1')).status,403);assert.equal((await f.request('/files')).status,403);assert.equal((await f.request('/connect','POST')).status,403);
});
test('неподписанный webhook отклоняется',async()=>{
  const f=fixture();f.env.ZOOM_WEBHOOK_SECRET='secret';assert.equal((await f.request('/webhook','POST',{event:'recording.completed'})).status,401);
});

test('Первый Zoom из карточки создаёт одну встречу с привязкой и обновляет время',async()=>{
  const f=fixture();await f.connect();
  f.db.exec('ALTER TABLE deals ADD COLUMN title TEXT; ALTER TABLE deals ADD COLUMN custom_fields TEXT');
  f.db.prepare('INSERT INTO deals(id,title,custom_fields) VALUES(?,?,?)').run('deal_first','Тест',JSON.stringify({firstZoomAt:'2026-09-29T19:57'}));
  let posts=0,patches=0;const original=globalThis.fetch;
  globalThis.fetch=async(url,options)=>{
    const body=JSON.parse(options.body);
    assert.equal(body.start_time,'2026-09-29T14:57:00.000Z');
    if(options.method==='POST'){posts++;return Response.json({id:456,join_url:'https://zoom.us/j/456'});}
    assert.equal(options.method,'PATCH');patches++;return new Response(null,{status:204});
  };
  try {
    assert.equal((await f.request('/deals/deal_first/first-meeting','POST')).status,200);
    assert.equal((await f.request('/deals/deal_first/first-meeting','POST')).status,200);
    const data=await (await f.request('/deals/deal_first/first-meeting')).json();
    assert.equal(data.meeting.join_url,'https://zoom.us/j/456');
    assert.equal(data.meeting.deal_id,'deal_first');assert.equal(posts,1);assert.equal(patches,1);
    f.deps.canEditRecord=async()=>false;
    assert.equal((await f.request('/deals/deal_first/first-meeting','POST')).status,403);
  }finally{globalThis.fetch=original;}
});

test('архив использует точный file ID из списка при 404 UUID',async()=>{
  const f=fixture();await f.connect();
  f.db.prepare("INSERT INTO zoom_files(id,meeting_uuid,meeting_id,recording_start,extension,size) VALUES('wanted','uuid','123','2026-09-29T10:00:00Z','MP4',4)").run();
  const original=globalThis.fetch;
  globalThis.fetch=async(url)=>{
    if(String(url).includes('/meetings/uuid/'))return Response.json({code:3301},{status:404});
    if(String(url).includes('/users/me/recordings'))return Response.json({meetings:[{recording_files:[{id:'wrong',status:'completed',download_url:'https://zoom.us/wrong',file_size:4},{id:'wanted',status:'completed',download_url:'https://zoom.us/wanted',file_size:4}]}]});
    assert.equal(String(url),'https://zoom.us/wanted');return new Response(new Uint8Array(4));
  };
  try{await processZoomJobs(f.env);assert.equal(f.db.prepare("SELECT status FROM zoom_files WHERE id='wanted'").get().status,'stored');}
  finally{globalThis.fetch=original;}
});


test('готовые материалы дают отметку и уведомления без дублей; pending не уведомляется',async()=>{
  const f=fixture();await f.connect();
  f.db.exec('ALTER TABLE deals ADD COLUMN title TEXT; ALTER TABLE deals ADD COLUMN responsible_uid TEXT; ALTER TABLE deals ADD COLUMN created_by_uid TEXT');
  f.db.prepare('INSERT INTO deals(id,title,responsible_uid,created_by_uid) VALUES(?,?,?,?)').run('deal_ready','Тест','manager','creator');
  for(const [id,status,ext,kind] of [['video','stored','MP4','speaker'],['text','pending','VTT','audio_transcript']])f.db.prepare("INSERT INTO zoom_files(id,meeting_uuid,meeting_id,deal_id,status,extension,kind) VALUES(?,'uuid','123','deal_ready',?,?,?)").run(id,status,ext,kind);
  const sent=[];const notify=async(env,n)=>{sent.push(n);return n.id;};
  await notifyZoomFiles(f.env,notify);await notifyZoomFiles(f.env,notify);
  assert.equal(sent.length,2);assert.equal(sent[0].link,'/team.html#deal/ready');
  let data=await(await f.request('/deal-status','POST',{ids:['deal_ready']})).json();assert.equal(data.deals[0].videos,1);assert.equal(data.deals[0].transcripts,0);
  f.db.prepare("UPDATE zoom_files SET status='stored' WHERE id='text'").run();
  await notifyZoomFiles(f.env,notify);assert.equal(sent.length,4);assert.match(sent[2].title,/транскрипт/);
  f.deps.dealAccessSql=()=>({where:' AND 0=1',params:[]});
  data=await(await f.request('/deal-status','POST',{ids:['deal_ready']})).json();assert.equal(data.deals.length,0);
});

test('плеер получает MIME и длину для полного файла и перемотки',async()=>{
  const f=fixture();await f.request('/status');
  f.db.prepare("INSERT INTO zoom_files(id,meeting_uuid,meeting_id,extension,status,r2_key) VALUES('media','uuid','123','MP4','stored','key')").run();
  for(const partial of [false,true]){
    f.env.FILES.get=async()=>({size:8,httpEtag:'"test"',body:new Uint8Array(partial?3:8),range:partial?{offset:2,length:3}:undefined,writeHttpMetadata:h=>h.set('Content-Type','application/octet-stream')});
    const r=await f.request('/files/media');
    assert.equal(r.status,partial?206:200);assert.equal(r.headers.get('Content-Type'),'video/mp4');
    assert.equal(r.headers.get('Content-Length'),partial?'3':'8');assert.equal(r.headers.get('Content-Disposition'),'inline');
    assert.equal(r.headers.get('Content-Range'),partial?'bytes 2-4/8':null);
    assert.equal((await r.arrayBuffer()).byteLength,partial?3:8);
  }
  f.db.prepare("UPDATE zoom_files SET extension='M4A' WHERE id='media'").run();
  assert.equal((await f.request('/files/media')).headers.get('Content-Type'),'audio/mp4');
});

test('копируемый транскрипт сохраняет речь без разметки VTT',async()=>{
  const {transcriptText}=await import('../app/zoom-crm.js');
  assert.equal(transcriptText('WEBVTT\n\n1\n00:00:00.000 --> 00:00:01.000\nПлатон: Привет &amp; пока\n\n2\n00:00:01.000 --> 00:00:02.000\nДа'), 'Платон: Привет & пока\n\nДа');
  assert.equal(transcriptText('Обычный текст'), 'Обычный текст');
});

test('код организатора шифруется и выдаётся только редактору связанной сделки',async()=>{
 const f=fixture();await f.connect();
 f.db.prepare("INSERT INTO deals(id) VALUES('deal_staff')").run();
 f.db.prepare("INSERT INTO zoom_meetings(task_id,meeting_id,deal_id,status,created_at) VALUES('tstaff','789','deal_staff','ready','2026-10-01')").run();
 assert.equal((await f.request('/host-key','POST',{hostKey:'012345'})).status,200);
 assert.ok(!f.db.prepare("SELECT v FROM zoom_private WHERE k='host_key'").get().v.includes('012345'));
 const original=globalThis.fetch;let patches=0;
 globalThis.fetch=async(url,options)=>{if(options.method==='PATCH'){patches++;assert.deepEqual(JSON.parse(options.body).settings,{waiting_room:false,join_before_host:true,jbh_time:0,auto_recording:'cloud'});return new Response(null,{status:204});}return Response.json({status:'waiting',settings:{waiting_room:false,join_before_host:true}});};
 try {
  const response=await f.request('/meetings/789/host-access','POST');assert.equal(response.status,200);assert.equal(response.headers.get('Cache-Control'),'private, no-store');assert.equal((await response.json()).hostKey,'012345');assert.equal(patches,1);
  f.deps.resolveCanonicalUser=async()=>({role:'agent'});f.deps.canEditRecord=async()=>false;
  assert.equal((await f.request('/meetings/789/host-access','POST')).status,403);assert.equal(patches,1);
  assert.equal((await f.request('/host-key','POST',{hostKey:'654321'})).status,403);
 }finally{globalThis.fetch=original;}
});
test('обновление входа не меняет уже идущую конференцию',async()=>{
 const f=fixture();await f.connect();
 f.db.prepare("INSERT INTO tasks(id) VALUES('live_task')").run();
 f.db.prepare("INSERT INTO zoom_meetings(task_id,meeting_id,status,created_at) VALUES('live_task','789','ready','2026-10-01')").run();
 await f.request('/host-key','POST',{hostKey:'012345'});
 const original=globalThis.fetch;
 globalThis.fetch=async(url,options)=>{assert.equal(options.method,'GET');return Response.json({status:'started'});};
 try{assert.equal((await f.request('/meetings/789/host-access','POST')).status,409);}finally{globalThis.fetch=original;}
});
test('приглашение клиенту не содержит код организатора',async()=>{
 const {zoomInvitation}=await import('../app/zoom-crm.js');
 assert.ok(!zoomInvitation({topic:'test',join_url:'https://zoom.us/j/123',hostKey:'012345'}).includes('012345'));
});
