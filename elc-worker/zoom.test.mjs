import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { handleZoomRequest, ensureZoomForTask, processZoomJobs, notifyZoomFiles, zoomMeetingPath, syncZoomTask } from './zoom.js';

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
test('повторное создание события возвращает одну Pllato Meet без Zoom API',async()=>{
  const f=fixture();await f.connect();
  f.db.prepare('INSERT INTO tasks VALUES(?,?,?,?,?,?,?,?)').run('t1','Встреча','zoom_meeting','2026-10-01T10:00:00Z','2026-10-01T11:00:00Z',null,'["deal_1"]',1);
  let posts=0;const original=globalThis.fetch;
  globalThis.fetch=async(url,options)=>{assert.equal(options.method,'POST');posts++;return Response.json({id:123,join_url:'https://zoom.us/j/123'});};
  try{const a=await ensureZoomForTask(f.env,'t1'),b=await ensureZoomForTask(f.env,'t1');assert.equal(posts,0);assert.equal(a.meeting_id,b.meeting_id);assert.match(a.join_url,/pllato.kz\/meet.html/);}finally{globalThis.fetch=original;}
});
test('неопределённый результат старого Zoom не создаёт дубликат',async()=>{
  const f=fixture();await f.connect();
  f.db.prepare('INSERT INTO tasks VALUES(?,?,?,?,?,?,?,?)').run('t1','Встреча','zoom_meeting','2026-10-01T10:00:00Z','2026-10-01T11:00:00Z',null,'[]',1);
  f.db.prepare("INSERT INTO zoom_meetings(task_id,status,created_at) VALUES('t1','uncertain','2026-01-01')").run();
  let posts=0;const original=globalThis.fetch;globalThis.fetch=async()=>{posts++;throw new Error('timeout');};
  try{await assert.rejects(ensureZoomForTask(f.env,'t1'));await assert.rejects(ensureZoomForTask(f.env,'t1'));assert.equal(posts,0);}finally{globalThis.fetch=original;}
});
test('ошибка копии не удаляет оригинал; успешная копия проверяется перед trash',async()=>{
  const f=fixture();await f.connect();f.env.ZOOM_TRASH_AFTER_COPY='true';
  f.db.prepare("INSERT INTO zoom_files(id,meeting_uuid,meeting_id,deal_id,extension,size) VALUES('f1','uuid','123','deal_1','VTT',4)").run();
  f.db.exec("UPDATE zoom_files SET kind='audio_transcript' WHERE id='f1'");
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
    await processZoomJobs(f.env);assert.equal(deletes,0);
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
    assert.match(data.meeting.join_url,/^https:\/\/pllato.kz\/meet.html\?room=crm-/);
    assert.equal(data.meeting.deal_id,'deal_first');assert.equal(posts,0);assert.equal(patches,0);
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
 try{assert.equal((await f.request('/meetings/789/host-access','POST')).status,200);}finally{globalThis.fetch=original;}
});
test('приглашение клиенту не содержит код организатора',async()=>{
 const {zoomInvitation}=await import('../app/zoom-crm.js');
 assert.ok(!zoomInvitation({topic:'test',join_url:'https://zoom.us/j/123',hostKey:'012345'}).includes('012345'));
});


test('очистка архива: только проверенные копии, включая непривязанные; ошибка файла не блокирует остальные',async()=>{
  const f=fixture();await f.connect();f.env.ZOOM_TRASH_AFTER_COPY='true';
  const add=(id,status='stored',imported='2026-09-29',deleted=null)=>f.db.prepare("INSERT INTO zoom_files(id,meeting_uuid,meeting_id,size,status,r2_key,imported_at,deleted_at) VALUES(?,?,'123',4,?,?,?,?)").run(id,id,status,id,imported,deleted);
  for(const id of ['good','missing','wrong','failed','unverified','deleted','pending'])add(id,id==='pending'?'pending':'stored',id==='unverified'?null:'2026-09-29',id==='deleted'?'2026-10-01':null);
  for(const id of ['good','failed','unverified','deleted','pending'])f.objects.set(id,{size:4});
  f.objects.set('wrong',{size:3});
  f.db.prepare("UPDATE zoom_files SET retry_at='2099-01-01' WHERE id='pending'").run();
  f.db.exec("UPDATE zoom_files SET kind='audio_transcript'");
  const original=globalThis.fetch,calls=[];
  globalThis.fetch=async(url,opts)=>{if(opts.method==='GET')return Response.json({recording_files:[]});assert.equal(opts.method,'DELETE');assert.ok(String(url).endsWith('?action=trash'));calls.push(String(url));return String(url).includes('/failed?')?new Response(null,{status:403}):new Response(null,{status:204});};
  try{
    await processZoomJobs(f.env);
    assert.equal(calls.length,2);
    assert.ok(f.db.prepare("SELECT zoom_deleted_at FROM zoom_files WHERE id='good'").get().zoom_deleted_at);
    for(const id of ['missing','wrong','failed','unverified','deleted','pending'])assert.equal(f.db.prepare('SELECT zoom_deleted_at FROM zoom_files WHERE id=?').get(id).zoom_deleted_at,null);
    assert.equal(f.objects.size,6);
    await processZoomJobs(f.env);assert.equal(calls.length,2);
  }finally{globalThis.fetch=original;}
});

test('общий архив группирует встречи, ищет клиента и скрывает чужие и непривязанные файлы от сотрудников',async()=>{
  const f=fixture();await f.connect();f.db.exec('ALTER TABLE deals ADD COLUMN title TEXT');
  f.db.prepare('INSERT INTO deals(id,title) VALUES(?,?)').run('deal_1','Клиент А');
  f.db.prepare('INSERT INTO deals(id,title) VALUES(?,?)').run('deal_2','Клиент Б');
  const add=(id,uuid,deal,status='stored',deleted=null)=>f.db.prepare('INSERT INTO zoom_files(id,meeting_uuid,meeting_id,deal_id,topic,recording_start,extension,kind,status,deleted_at) VALUES(?,?,?,?,?,?,?,?,?,?)').run(id,uuid,'123',deal,'Zoom','2026-10-01T10:00:00Z','VTT','audio_transcript',status,deleted);
  add('one','u1','deal_1');add('two','u1','deal_1');add('other','u2','deal_2');add('unlinked','u3',null);add('deleted','u4','deal_1','deleted','2026-10-02');
  let r=await f.request('/archive');assert.equal(r.headers.get('Cache-Control'),'private, no-store');let data=await r.json();assert.equal(data.total,3);assert.equal(data.meetings.find(x=>x.meeting_uuid==='u1').files.length,2);
  data=await (await f.request('/archive?q='+encodeURIComponent('Клиент А'))).json();assert.equal(data.total,1);
  f.deps.resolveCanonicalUser=async()=>({role:'agent'});f.deps.dealAccessSql=()=>({where:' AND id=?',params:['deal_1']});
  data=await (await f.request('/archive')).json();assert.equal(data.total,1);assert.equal(data.meetings[0].deal_id,'deal_1');
  data=await (await f.request('/archive?page=2')).json();assert.equal(data.meetings.length,0);
});


test('оригиналы остаются до транскрипта и копии всех файлов встречи',async()=>{
 const f=fixture();await f.connect();f.env.ZOOM_TRASH_AFTER_COPY='true';
 f.db.exec("INSERT INTO zoom_files(id,meeting_uuid,meeting_id,kind,status,size,r2_key,imported_at) VALUES('video','uuid','123','shared_screen','stored',4,'video','2026-10-08')");f.objects.set('video',{size:4});
 const original=globalThis.fetch;let deletes=0;
 globalThis.fetch=async(url,opt)=>{if(opt.method==='DELETE'){deletes++;return new Response(null,{status:204});}return Response.json({recording_files:[]});};
 try{await processZoomJobs(f.env);assert.equal(deletes,0);
 f.db.exec("INSERT INTO zoom_files(id,meeting_uuid,meeting_id,kind,status,size,r2_key,imported_at) VALUES('text','uuid','123','audio_transcript','stored',4,'text','2026-10-08')");
 await processZoomJobs(f.env);assert.equal(deletes,0);
 f.objects.set('text',{size:4});await processZoomJobs(f.env);assert.equal(deletes,2);
 }finally{globalThis.fetch=original;}
});
test('недоступный транскрипт восстанавливается по точному ID и сохраняется',async()=>{
 const f=fixture();await f.connect();f.db.exec("INSERT INTO zoom_files(id,meeting_uuid,meeting_id,kind,extension,status,size) VALUES('text','uuid','123','audio_transcript','VTT','pending',4)");f.db.exec("UPDATE zoom_files SET recording_start='2026-10-08T06:04:50Z'");
 const original=globalThis.fetch;let recovered=false;
 globalThis.fetch=async(url,opt)=>{const u=String(url);if(opt.method==='PUT'){assert.ok(u.endsWith('/recordings/text/status'));assert.deepEqual(JSON.parse(opt.body),{action:'recover'});recovered=true;return new Response(null,{status:204});}if(u==='https://zoom.us/file')return new Response('test');if(u.includes('/users/'))return Response.json({meetings:[]});return Response.json({recording_files:recovered?[{id:'text',status:'completed',download_url:'https://zoom.us/file',file_size:4}]:[]});};
 try{await processZoomJobs(f.env);assert.ok(recovered);assert.equal(f.db.prepare("SELECT status FROM zoom_files WHERE id='text'").get().status,'stored');}finally{globalThis.fetch=original;}
});
test('аудит переносов доступен только администратору, повтор не затрагивает удалённое',async()=>{
 const f=fixture();await f.connect();f.db.exec("INSERT INTO zoom_files(id,meeting_uuid,meeting_id,status,retry_at) VALUES('one','u','1','pending','2099-01-01'); INSERT INTO zoom_files(id,meeting_uuid,meeting_id,status,retry_at,deleted_at) VALUES('gone','u','1','deleted','2099-01-01','2026-10-01')");
 assert.equal((await (await f.request('/transfer-audit')).json()).meetings.length,1);
 await f.request('/transfer-audit','POST');assert.equal(f.db.prepare("SELECT retry_at FROM zoom_files WHERE id='one'").get().retry_at,null);assert.equal(f.db.prepare("SELECT retry_at FROM zoom_files WHERE id='gone'").get().retry_at,'2099-01-01');
 f.deps.resolveCanonicalUser=async()=>({role:'agent'});assert.equal((await f.request('/transfer-audit')).status,403);assert.equal((await f.request('/transfer-audit','POST')).status,403);
});


test('Pllato Meet: private host access, CRM attachment and idempotent archive',async()=>{
  const {authorizeCrmArchive,indexCrmArchive}=await import('../meet-worker/crm-archive.js');
  const f=fixture();await f.request('/status');
  f.db.prepare('INSERT INTO deals(id) VALUES(?)').run('deal_1');
  f.db.prepare('INSERT INTO tasks VALUES(?,?,?,?,?,?,?,?)').run('t1','Встреча','zoom_meeting','2026-10-01T10:00:00Z','2026-10-01T11:00:00Z',null,'["deal_1"]',1);
  const m=await ensureZoomForTask(f.env,'t1');
  const response=await f.request('/meetings/'+m.meeting_id+'/host-access','POST');
  assert.equal(response.status,200);
  const {hostUrl}=await response.json(),key=new URLSearchParams(new URL(hostUrl).hash.slice(1)).get('host');
  assert.ok(key);assert.ok(!m.join_url.includes(key));
  assert.equal(response.headers.get('cache-control'),'private, no-store');
  f.deps.canEditRecord=async()=>false;
  assert.equal((await f.request('/meetings/'+m.meeting_id+'/host-access','POST')).status,200,'staff with deal access may host even without edit rights');
  const env={CRM_DB:f.env.DB,CRM_FILES:f.env.FILES},id=m.meeting_id+'-1234567890';
  assert.equal(await authorizeCrmArchive(new Request('https://test'),env,id),null);
  const linked=await authorizeCrmArchive(new Request('https://test',{headers:{Authorization:'Bearer '+key}}),env,id);
  assert.equal(linked.deal_id,'deal_1');
  const meta={date:Date.now(),recording:true,mime:'video/webm',transcript:[{name:'Клиент',text:'Тестовая речь'}],chat:[{name:'Клиент',text:'Вопрос'}],dealId:'deal_other'};
  await assert.rejects(indexCrmArchive(env,linked,id,meta),/not complete/);
  await f.env.FILES.put('rec/crm/'+id+'.webm','test-video');
  await indexCrmArchive(env,linked,id,meta);await indexCrmArchive(env,linked,id,meta);
  const rows=f.db.prepare('SELECT * FROM zoom_files').all();
  assert.equal(rows.length,3);assert.ok(rows.every(row=>row.deal_id==='deal_1'&&row.status==='stored'));
  assert.ok(rows.some(row=>row.extension==='WEBM'));assert.ok(rows.some(row=>row.kind==='transcript'));
  f.deps.dealAccessSql=()=>({where:' AND id=?',params:['deal_other']});
  assert.equal((await f.request('/files/'+rows[0].id)).status,403);
});

test('CRM room cannot be claimed by the first guest; only issued key grants host',async()=>{
  const {MeetRoom}=await import('../meet-worker/worker.js');
  const f=fixture();await f.request('/status');
  f.db.prepare('INSERT INTO tasks VALUES(?,?,?,?,?,?,?,?)').run('t1','Встреча','zoom_meeting','2026-10-01T10:00:00Z','2026-10-01T11:00:00Z',null,'[]',1);
  const meeting=await ensureZoomForTask(f.env,'t1');
  const values=new Map([['roomId',meeting.meeting_id]]),messages=[];
  const socket={send:s=>messages.push(JSON.parse(s)),serializeAttachment(a){this.a=a},deserializeAttachment(){return this.a}};
  const room=new MeetRoom({storage:{get:async k=>values.get(k),put:async(k,v)=>values.set(k,v)},getWebSockets:()=>[socket]},{CRM_DB:f.env.DB});
  await room.onJoin(socket,{peer:'guest',name:'Guest',hostKey:'hk_attacker'});
  assert.equal(messages.find(m=>m.t==='welcome').self.isHost,false);
  assert.equal(socket.a.info.admitted,false);
  messages.length=0;
  const key=f.db.prepare('SELECT v FROM zoom_private WHERE k=?').get('pmeet-host:'+meeting.meeting_id).v;
  await room.onJoin(socket,{peer:'host',name:'Manager',hostKey:key});
  assert.equal(messages.find(m=>m.t==='welcome').self.isHost,true);
  f.db.prepare("UPDATE zoom_meetings SET status='cancelled'").run();
  let closed=false;socket.close=()=>closed=true;
  await room.onJoin(socket,{peer:'late',name:'Guest',hostKey:key});assert.equal(closed,true);
});

test('CRM archive HTTP blocks public reads, foreign keys and publishes only after complete upload',async()=>{
  const worker=(await import('../meet-worker/worker.js')).default;
  const f=fixture();await f.request('/status');
  f.db.prepare('INSERT INTO tasks VALUES(?,?,?,?,?,?,?,?)').run('t1','Встреча','zoom_meeting','2026-10-01T10:00:00Z','2026-10-01T11:00:00Z',null,'[]',1);
  const m=await ensureZoomForTask(f.env,'t1'),id=m.meeting_id+'-1234567890';
  const key=f.db.prepare('SELECT v FROM zoom_private WHERE k=?').get('pmeet-host:'+m.meeting_id).v;
  const env={ARCHIVE:f.env.FILES,CRM_DB:f.env.DB,CRM_FILES:f.env.FILES};
  const call=(path,method='GET',token='',body)=>worker.fetch(new Request('https://meet.test'+path,{method,headers:{Authorization:'Bearer '+token},body:body?JSON.stringify(body):undefined}),env);
  assert.equal((await call('/archive/rec/crm/'+id)).status,403);
  assert.equal((await call('/archive/list/crm')).status,403);
  assert.equal((await call('/archive/meta/crm/'+id,'PUT','wrong',{recording:false})).status,403);
  assert.equal((await call('/archive/meta/crm/'+id,'PUT',key,{recording:true})).status,500);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM zoom_files').get().n,0);
  assert.equal((await call('/archive/meta/crm/'+id,'PUT',key,{recording:false,transcript:[]})).status,200);
  assert.equal(f.db.prepare('SELECT kind FROM zoom_files').get().kind,'chat_metadata');
});

test('Permanent deal room: concurrent creation, repeated events, cancellation and staff boundaries',async()=>{
  const f=fixture();await f.request('/status');f.db.exec('ALTER TABLE deals ADD COLUMN title TEXT');
  f.db.prepare('INSERT INTO deals(id,title) VALUES(?,?)').run('deal_1','Client One');
  f.db.prepare('INSERT INTO deals(id,title) VALUES(?,?)').run('deal_2','Client Two');
  assert.equal((await (await f.request('/deals/deal_1/room')).json()).meeting,null);
  const requests=await Promise.all([f.request('/deals/deal_1/room','POST'),f.request('/deals/deal_1/room','POST')]);
  assert.ok(requests.every(r=>r.status===200));
  const [a,b]=await Promise.all(requests.map(r=>r.json()));assert.equal(a.meeting.join_url,b.meeting.join_url);
  assert.equal(f.db.prepare('SELECT COUNT(*) n FROM zoom_meetings WHERE deal_id=?').get('deal_1').n,1);
  for(const id of ['t1','t2'])f.db.prepare('INSERT INTO tasks VALUES(?,?,?,?,?,?,?,?)').run(id,id,'zoom_meeting','2026-10-01T10:00:00Z','2026-10-01T11:00:00Z',null,'["deal_1"]',1);
  assert.equal((await ensureZoomForTask(f.env,'t1')).join_url,a.meeting.join_url);
  assert.equal((await ensureZoomForTask(f.env,'t2')).join_url,a.meeting.join_url);
  await syncZoomTask(f.env,'t1',{},true);
  assert.equal((await (await f.request('/tasks/t2')).json()).meeting.join_url,a.meeting.join_url);
  const other=await (await f.request('/deals/deal_2/room','POST')).json();assert.notEqual(a.meeting.join_url,other.meeting.join_url);
  f.deps.resolveCanonicalUser=async()=>({role:'agent',canonicalUid:'staff'});f.deps.canEditRecord=async()=>false;
  assert.equal((await f.request('/meetings/'+a.meeting.meeting_id+'/host-access','POST')).status,200);
  f.deps.dealAccessSql=()=>({where:' AND id=?',params:['deal_2']});
  assert.equal((await f.request('/deals/deal_1/room','POST')).status,403);
  assert.equal((await f.request('/meetings/'+a.meeting.meeting_id+'/host-access','POST')).status,403);
  f.deps.dealAccessSql=()=>({where:'',params:[]});f.deps.resolveCanonicalUser=async()=>({role:'guest'});
  assert.equal((await f.request('/meetings/'+a.meeting.meeting_id+'/host-access','POST')).status,403);
  assert.equal((await f.request('/deals/deal_1/room')).status,403);
});
test('Adopt an issued link without losing archives; cancelling its old event retains the room',async()=>{
  const {createPllatoMeeting,ensureDealRoom}=await import('./meet-crm.js');
  const f=fixture();await f.request('/status');
  const old=await createPllatoMeeting(f.env,{id:'issued',title:'Existing meeting'},'deal_1');
  const savedKey=f.db.prepare('SELECT v FROM zoom_private WHERE k=?').get('pmeet-host:'+old.meeting_id).v;
  const permanent=await ensureDealRoom(f.env,'deal_1');assert.equal(permanent.join_url,old.join_url);
  await syncZoomTask(f.env,'issued',{},true);
  assert.equal((await ensureDealRoom(f.env,'deal_1')).join_url,old.join_url);
  assert.equal(f.db.prepare('SELECT v FROM zoom_private WHERE k=?').get('pmeet-host:'+old.meeting_id).v,savedKey);
});
test('Separate sessions on the same room remain distinct in deal history',async()=>{
  const {ensureDealRoom}=await import('./meet-crm.js');const {indexCrmArchive}=await import('../meet-worker/crm-archive.js');
  const f=fixture();await f.request('/status');f.db.prepare('INSERT INTO deals(id) VALUES(?)').run('deal_1');
  const room=await ensureDealRoom(f.env,'deal_1'),env={CRM_DB:f.env.DB,CRM_FILES:f.env.FILES};
  for(const stamp of [1700000000000,1700100000000]){
    const id=room.meeting_id+'-'+stamp;await f.env.FILES.put('rec/crm/'+id+'.webm','video');
    await indexCrmArchive(env,room,id,{date:stamp,recording:true,transcript:[{text:'Session '+stamp}],chat:[]});
  }
  const {files}=await(await f.request('/files?deal=deal_1')).json();
  assert.equal(files.length,6);assert.equal(new Set(files.map(f=>f.meeting_uuid)).size,2);
  const {groupMeetingFiles}=await import('../app/zoom-crm.js');const groups=groupMeetingFiles(files);
  assert.equal(groups.length,2);assert.ok(groups.every(g=>g.files.length===3&&g.hasTranscript));
});
