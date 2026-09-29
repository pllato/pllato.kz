// Zoom General App: один подключённый организатор, приватные материалы в R2.
// Секреты — только env; OAuth-токены в отдельной таблице, зашифрованы AES-GCM.
const CALLBACK = 'https://pllato-elc-worker.uurraa.workers.dev/api/zoom/callback';
const DAY = 86400000;
const enc = new TextEncoder();
const parse = (v, fallback = {}) => { try { return JSON.parse(v); } catch { return fallback; } };
const now = () => new Date().toISOString();
const fail = (message, status = 400) => Object.assign(new Error(message), { status });
const uid = () => crypto.randomUUID();
const bytes64 = b => btoa(String.fromCharCode(...new Uint8Array(b)));
const from64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
export function zoomMeetingPath(id) {
  const s = String(id);
  return s.startsWith('/') || s.includes('//') ? encodeURIComponent(encodeURIComponent(s)) : encodeURIComponent(s);
}
export function zoomRetentionDeadline(deal) {
  // Только конкретная стадия Pllato Старт. Остальные воронки не затрагиваем.
  if (deal?.pipeline_id !== 'pipeline_r22lrm' || deal?.stage_id !== 'STAGE_MPC2F') return null;
  const entered = Date.parse(deal.stage_changed_at);
  // Старую запись без даты перехода не удаляем на основании приблизительной даты.
  if (!Number.isFinite(entered)) return null;
  return new Date(entered + 28 * DAY).toISOString();
}
async function schema(env) {
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS zoom_private (k TEXT PRIMARY KEY, v TEXT NOT NULL)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS zoom_meetings (
      task_id TEXT PRIMARY KEY, meeting_id TEXT UNIQUE, deal_id TEXT, join_url TEXT,
      topic TEXT, status TEXT NOT NULL DEFAULT 'pending', error TEXT, created_at TEXT NOT NULL)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS zoom_files (
      id TEXT PRIMARY KEY, meeting_uuid TEXT NOT NULL, meeting_id TEXT NOT NULL, deal_id TEXT,
      topic TEXT, recording_start TEXT, kind TEXT, extension TEXT, size INTEGER,
      r2_key TEXT, status TEXT NOT NULL DEFAULT 'pending', imported_at TEXT, deleted_at TEXT,
      zoom_deleted_at TEXT, error TEXT, lease_until TEXT, retry_at TEXT, attempts INTEGER DEFAULT 0)`),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS zoom_files_deal ON zoom_files(deal_id)'),
  ]);
}
async function get(env, k) { return (await env.DB.prepare('SELECT v FROM zoom_private WHERE k=?').bind(k).first())?.v; }
async function put(env, k, v) { await env.DB.prepare('INSERT INTO zoom_private(k,v) VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v').bind(k, v).run(); }
async function key(env) {
  if (!env.ZOOM_CLIENT_SECRET) throw fail('Zoom ещё не настроен администратором', 503);
  return crypto.subtle.importKey('raw', await crypto.subtle.digest('SHA-256', enc.encode(env.ZOOM_CLIENT_SECRET)), 'AES-GCM', false, ['encrypt', 'decrypt']);
}
async function seal(env, value) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await key(env), enc.encode(JSON.stringify(value)));
  return JSON.stringify({ iv: bytes64(iv), data: bytes64(ciphertext) });
}
async function unseal(env, value) {
  const v = JSON.parse(value);
  return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: from64(v.iv) }, await key(env), from64(v.data))));
}
async function exchange(env, params) {
  const r = await fetch('https://zoom.us/oauth/token', {
    method: 'POST', headers: { Authorization: 'Basic ' + btoa(env.ZOOM_CLIENT_ID + ':' + env.ZOOM_CLIENT_SECRET), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params), signal: AbortSignal.timeout(20000),
  });
  if (!r.ok) throw fail('Не удалось авторизовать Zoom. Подключите аккаунт повторно.', 502);
  const data = await r.json();
  await put(env, 'tokens', await seal(env, { ...data, expires_at: Date.now() + data.expires_in * 1000 }));
  return data.access_token;
}
async function token(env) {
  const saved = await get(env, 'tokens');
  if (!saved) throw fail('Подключите аккаунт Zoom в календаре', 503);
  const data = await unseal(env, saved);
  if (data.expires_at > Date.now() + 90000) return data.access_token;
  // Атомарная блокировка: Zoom обновляет refresh token при каждом обмене.
  const lease = String(Date.now() + 60000);
  const lock = await env.DB.prepare(`INSERT INTO zoom_private(k,v) VALUES('refresh_lock',?)
    ON CONFLICT(k) DO UPDATE SET v=excluded.v WHERE CAST(zoom_private.v AS INTEGER) < ? RETURNING v`).bind(lease, Date.now()).first();
  if (!lock) throw fail('Zoom обновляет доступ. Повторите через минуту.', 503);
  try { return await exchange(env, { grant_type: 'refresh_token', refresh_token: data.refresh_token }); }
  finally { await env.DB.prepare("DELETE FROM zoom_private WHERE k='refresh_lock' AND v=?").bind(lease).run(); }
}
async function api(env, path, method = 'GET', body) {
  const r = await fetch('https://api.zoom.us/v2' + path, {
    method, headers: { Authorization: 'Bearer ' + await token(env), 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(25000),
  });
  if (!r.ok) throw Object.assign(fail(`Zoom API: HTTP ${r.status}. Проверьте права приложения и подключение.`, 502), { zoomStatus: r.status });
  return r.status === 204 ? {} : r.json();
}
function taskDeal(task) {
  const links = typeof task.crm_links === 'string' ? parse(task.crm_links, []) : task.crmLinks || [];
  return Array.isArray(links) ? links.find(x => typeof x === 'string' && x.startsWith('deal_')) || null : null;
}
function meetingBody(task) {
  const start = new Date(task.start_date_plan || task.startDatePlan || task.deadline);
  const end = new Date(task.end_date_plan || task.endDatePlan);
  const duration = Math.ceil((end - start) / 60000);
  if (isNaN(start) || !Number.isFinite(duration) || duration < 1 || duration > 1440) throw fail('Укажите дату и длительность встречи (до 24 часов)');
  return { topic: String(task.title).slice(0, 200), type: 2, start_time: start.toISOString(), duration, timezone: 'UTC',
    agenda: 'CRM event: ' + task.id, settings: { auto_recording: 'cloud', use_pmi: false, waiting_room: true, join_before_host: false } };
}
export async function ensureZoomForTask(env, taskId) {
  await schema(env);
  const task = await env.DB.prepare('SELECT * FROM tasks WHERE id=?').bind(taskId).first();
  if (!task || task.mark !== 'zoom_meeting') return null;
  const existing = await env.DB.prepare('SELECT * FROM zoom_meetings WHERE task_id=?').bind(taskId).first();
  if (existing?.meeting_id) return existing;
  if (existing?.status === 'creating' || existing?.status === 'uncertain') throw fail('Результат создания Zoom требует проверки администратором; повторная встреча не создаётся.', 409);
  const body = meetingBody(task);
  await token(env); // До резервирования проверяем, что подключение есть.
  const claimed = await env.DB.prepare(`INSERT INTO zoom_meetings(task_id,deal_id,topic,status,created_at)
    VALUES(?,?,?,'creating',?) ON CONFLICT(task_id) DO UPDATE SET status='creating',error=NULL
    WHERE zoom_meetings.status='pending' RETURNING task_id`).bind(taskId, taskDeal(task), task.title, now()).first();
  if (!claimed) throw fail('Встреча уже создаётся', 409);
  try {
    const z = await api(env, '/users/me/meetings', 'POST', body);
    await env.DB.prepare("UPDATE zoom_meetings SET meeting_id=?,join_url=?,status='ready' WHERE task_id=?")
      .bind(String(z.id), z.join_url, taskId).run();
    return { meeting_id: String(z.id), join_url: z.join_url, status: 'ready' };
  } catch (e) {
    // Безопаснее не повторять POST после таймаута: Zoom мог уже создать встречу.
    await env.DB.prepare("UPDATE zoom_meetings SET status=?,error=? WHERE task_id=?").bind([400,401,403,404,429].includes(e.zoomStatus) ? 'pending' : 'uncertain', String(e.message).slice(0, 250), taskId).run();
    throw e;
  }
}
export async function syncZoomTask(env, taskId, patch, remove = false) {
  if (!env.ZOOM_CLIENT_ID) return;
  await schema(env);
  const m = await env.DB.prepare('SELECT * FROM zoom_meetings WHERE task_id=?').bind(taskId).first();
  if (!m?.meeting_id || m.status === 'cancelled') return;
  if (remove) {
    await api(env, '/meetings/' + m.meeting_id, 'DELETE');
    await env.DB.prepare("UPDATE zoom_meetings SET status='cancelled' WHERE task_id=?").bind(taskId).run();
    return;
  }
  if (patch.mark && patch.mark !== 'zoom_meeting') throw fail('Сначала отмените Zoom-встречу; тип уже созданной встречи менять нельзя.');
  if (!['title','startDatePlan','endDatePlan','deadline'].some(k => k in patch)) return;
  const task = await env.DB.prepare('SELECT * FROM tasks WHERE id=?').bind(taskId).first();
  const next = { ...task, title: patch.title || task.title,
    start_date_plan: patch.startDatePlan || task.start_date_plan,
    end_date_plan: patch.endDatePlan || task.end_date_plan };
  await api(env, '/meetings/' + m.meeting_id, 'PATCH', meetingBody(next));
}
async function ingest(env, meeting) {
  const linked = await env.DB.prepare('SELECT deal_id FROM zoom_meetings WHERE meeting_id=?').bind(String(meeting.id)).first();
  for (const f of meeting.recording_files || []) {
    if (!f.id || f.status !== 'completed') continue;
    await env.DB.prepare(`INSERT INTO zoom_files(id,meeting_uuid,meeting_id,deal_id,topic,recording_start,kind,extension,size)
      VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET deal_id=COALESCE(zoom_files.deal_id,excluded.deal_id)`)
      .bind(f.id, meeting.uuid, String(meeting.id), linked?.deal_id || null, meeting.topic || '', f.recording_start || meeting.start_time || '', f.recording_type || f.file_type || '', f.file_extension || f.file_type || '', Number(f.file_size || 0)).run();
  }
}
async function scan(env) {
  // По месяцу за проход, курсор хранится: начальная загрузка проходит архив целиком.
  const saved = parse(await get(env, 'scan') || '{}');
  const end = saved.to || now().slice(0,10);
  const from = new Date(Date.parse(end) - 29 * DAY).toISOString().slice(0,10);
  const q = new URLSearchParams({ from, to: end, page_size: '100' });
  if (saved.page) q.set('next_page_token', saved.page);
  const data = await api(env, '/users/me/recordings?' + q);
  for (const meeting of data.meetings || []) await ingest(env, meeting);
  if (data.next_page_token) await put(env, 'scan', JSON.stringify({ to: end, page: data.next_page_token }));
  else {
    // Архив пролистывается помесячно до настроенной нижней границы (по умолчанию до появления Zoom).
    const next = new Date(Date.parse(from) - DAY).toISOString().slice(0,10);
    await put(env, 'scan', JSON.stringify({ to: next < (env.ZOOM_ARCHIVE_FROM || '2011-01-01') ? now().slice(0,10) : next }));
  }
}
async function download(env, file) {
  const meeting = await api(env, '/meetings/' + zoomMeetingPath(file.meeting_uuid) + '/recordings');
  const remote = meeting.recording_files?.find(f => f.id === file.id);
  if (!remote?.download_url || remote.status !== 'completed') throw fail('Файл Zoom пока недоступен', 502);
  let url = new URL(remote.download_url);
  const allowed = u => u.protocol === 'https:' && (u.hostname === 'zoom.us' || u.hostname.endsWith('.zoom.us') || u.hostname.endsWith('.zoom.com'));
  if (!allowed(url)) throw fail('Неожиданный адрес файла Zoom', 502);
  const auth = await token(env);
  let r;
  for (let i = 0; i < 6; i++) {
    r = await fetch(url, { headers: { Authorization: 'Bearer ' + auth }, redirect: 'manual', signal: AbortSignal.timeout(180000) });
    if (![301,302,303,307,308].includes(r.status)) break;
    await r.body?.cancel();
    url = new URL(r.headers.get('Location'), url);
    if (!allowed(url)) throw fail('Неожиданное перенаправление Zoom', 502);
  }
  if (!r.ok || !r.body || /text\/html/.test(r.headers.get('Content-Type') || '')) throw fail('Не удалось скачать файл Zoom', 502);
  const size = Number(remote.file_size);
  if (!size || size > 5 * 1024 ** 3) { await r.body.cancel(); throw fail('Размер файла требует ручного переноса; оригинал сохранён в Zoom'); }
  const r2Key = 'zoom/' + encodeURIComponent(file.id) + '.' + String(file.extension || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
  const type = file.extension === 'MP4' ? 'video/mp4' : file.extension === 'M4A' ? 'audio/mp4' : /VTT|TXT/.test(file.extension) ? 'text/plain; charset=utf-8' : 'application/octet-stream';
  const stored = await env.FILES.put(r2Key, r.body, { httpMetadata: { contentType: type } });
  if (!stored || stored.size !== size) { await env.FILES.delete(r2Key); throw fail('Размер копии не совпал; оригинал сохранён в Zoom', 502); }
  const verified = await env.FILES.head(r2Key);
  if (!verified || verified.size !== size || verified.etag !== stored.etag) throw fail('Копия не прошла проверку', 502);
  await env.DB.prepare("UPDATE zoom_files SET r2_key=?,size=?,status='stored',imported_at=?,error=NULL,lease_until=NULL WHERE id=? AND deleted_at IS NULL")
    .bind(r2Key, size, now(), file.id).run();
}
async function trashOriginal(env, file) {
  // Удаляем конкретный файл, а не всю встречу: транскрипт может появиться позже.
  const object = await env.FILES.head(file.r2_key);
  if (!object || object.size !== file.size) throw fail('Копия отсутствует: оригинал оставлен в Zoom');
  await api(env, '/meetings/' + zoomMeetingPath(file.meeting_uuid) + '/recordings/' + encodeURIComponent(file.id) + '?action=trash', 'DELETE');
  await env.DB.prepare('UPDATE zoom_files SET zoom_deleted_at=? WHERE id=?').bind(now(), file.id).run();
}
export async function processZoomJobs(env) {
  if (!env.ZOOM_CLIENT_ID || !env.ZOOM_CLIENT_SECRET) return;
  await schema(env);
  if (!await get(env, 'tokens')) return;
  // Общая аренда защищает перенос/удаление от двух параллельных cron.
  const lease = String(Date.now() + 20 * 60000);
  const locked = await env.DB.prepare(`INSERT INTO zoom_private(k,v) VALUES('job_lock',?) ON CONFLICT(k)
    DO UPDATE SET v=excluded.v WHERE CAST(zoom_private.v AS INTEGER) < ? RETURNING v`).bind(lease, Date.now()).first();
  if (!locked) return;
  try {
    if (Date.now() - Number(await get(env, 'last_scan') || 0) > 5 * 60000) {
      // Свежие записи проверяем независимо от движения по старому архиву.
      const recent = await api(env, '/users/me/recordings?' + new URLSearchParams({from:new Date(Date.now()-7*DAY).toISOString().slice(0,10),to:now().slice(0,10),page_size:'100'}));
      for (const meeting of recent.meetings || []) await ingest(env,meeting);
      await scan(env); await put(env, 'last_scan', String(Date.now()));
    }
    const f = await env.DB.prepare("SELECT * FROM zoom_files WHERE status='pending' AND (retry_at IS NULL OR retry_at<=?) ORDER BY recording_start DESC LIMIT 1").bind(now()).first();
    if (f) {
      try { await download(env, f); }
      catch(e) { await env.DB.prepare('UPDATE zoom_files SET error=?,attempts=attempts+1,retry_at=? WHERE id=?').bind(String(e.message).slice(0,250), new Date(Date.now() + Math.min(360, 2 ** Math.min(f.attempts,8)) * 60000).toISOString(),f.id).run(); }
    }
    if (env.ZOOM_TRASH_AFTER_COPY === 'true') {
      const f = await env.DB.prepare("SELECT * FROM zoom_files WHERE status='stored' AND zoom_deleted_at IS NULL AND deal_id IS NOT NULL AND (retry_at IS NULL OR retry_at<=?) LIMIT 1").bind(now()).first();
      if (f) try { await trashOriginal(env, f); }
      catch(e) { await env.DB.prepare('UPDATE zoom_files SET error=?,retry_at=? WHERE id=?').bind(String(e.message).slice(0,250), new Date(Date.now()+3600000).toISOString(),f.id).run(); }
    }
    if (env.ZOOM_RETENTION_ENABLED === 'true') {
      const { results } = await env.DB.prepare(`SELECT z.*,d.pipeline_id,d.stage_id,d.stage_changed_at FROM zoom_files z
        JOIN deals d ON d.id=z.deal_id WHERE z.status='stored' AND z.extension='MP4'
        AND d.pipeline_id='pipeline_r22lrm' AND d.stage_id='STAGE_MPC2F'
        AND d.stage_changed_at <= ? AND z.zoom_deleted_at IS NOT NULL ORDER BY d.stage_changed_at LIMIT 100`).bind(new Date(Date.now()-28*DAY).toISOString()).all();
      for (const f of results) {
        const deadline = zoomRetentionDeadline(f, f.imported_at);
        if (!deadline || deadline > now()) continue;
        // Повторная проверка прямо перед удалением: возврат сделки в работу отменяет таймер.
        const d = await env.DB.prepare('SELECT pipeline_id,stage_id,stage_changed_at FROM deals WHERE id=?').bind(f.deal_id).first();
        const due = zoomRetentionDeadline(d, f.imported_at);
        if (!due || due > now()) continue;
        await env.FILES.delete(f.r2_key);
        await env.DB.prepare("UPDATE zoom_files SET status='deleted',deleted_at=?,r2_key=NULL WHERE id=?").bind(now(),f.id).run();
      }
    }
  } finally { await env.DB.prepare("DELETE FROM zoom_private WHERE k='job_lock' AND v=?").bind(lease).run(); }
}
async function webhook(request, env) {
  if (!env.ZOOM_WEBHOOK_SECRET) throw fail('Webhook not configured',503);
  const raw = await request.text();
  if (raw.length > 1000000) throw fail('Payload too large',413);
  const stamp = request.headers.get('x-zm-request-timestamp');
  if (!stamp || Math.abs(Date.now()/1000 - Number(stamp)) > 300) throw fail('Invalid timestamp',401);
  const k = await crypto.subtle.importKey('raw',enc.encode(env.ZOOM_WEBHOOK_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
  const signature = request.headers.get('x-zm-signature') || '';
  const hex = signature.replace(/^v0=/,'');
  if (!/^[a-f0-9]{64}$/i.test(hex) || !await crypto.subtle.verify('HMAC',k,Uint8Array.from(hex.match(/../g),h=>parseInt(h,16)),enc.encode('v0:'+stamp+':'+raw))) throw fail('Invalid signature',401);
  const data = JSON.parse(raw);
  if (data.event === 'endpoint.url_validation') {
    const plainToken = data.payload.plainToken;
    const digest = new Uint8Array(await crypto.subtle.sign('HMAC',k,enc.encode(plainToken)));
    return Response.json({plainToken,encryptedToken:Array.from(digest,b=>b.toString(16).padStart(2,'0')).join('')});
  }
  if (['recording.completed','recording.transcript_completed'].includes(data.event)) {
    const obj = data.payload?.object;
    if (obj?.uuid) await ingest(env,obj);
  }
  return Response.json({ok:true});
}
export async function handleZoomRequest(request, env, deps) {
  const { json, requireAuthFlexible, resolveCanonicalUser, dealAccessSql, canEditRecord } = deps;
  const url = new URL(request.url), path = url.pathname.replace('/api/zoom','');
  try {
    await schema(env);
    if (path === '/webhook' && request.method === 'POST') return await webhook(request,env);
    if (path === '/callback') {
      const state = url.searchParams.get('state');
      const row = state && await env.DB.prepare("DELETE FROM zoom_private WHERE k=? RETURNING v").bind('state:'+state).first();
      if (!row || Number(row.v) < Date.now()) throw fail('Ссылка подключения истекла. Начните подключение из CRM.',403);
      if (!url.searchParams.get('code')) throw fail('Подключение Zoom отменено');
      await exchange(env,{grant_type:'authorization_code',code:url.searchParams.get('code'),redirect_uri:CALLBACK});
      return Response.redirect('https://pllato.kz/team.html#calendar',302);
    }
    const auth = await requireAuthFlexible(request,env);
    if (auth.error) return json({error:auth.error},auth.status,request);
    const me = await resolveCanonicalUser(env,auth.claims);
    const admin = me.role === 'admin';
    if (path === '/status') return json({configured:!!(env.ZOOM_CLIENT_ID && env.ZOOM_CLIENT_SECRET),connected:!!await get(env,'tokens'),admin,trashAfterCopy:env.ZOOM_TRASH_AFTER_COPY==='true',retentionEnabled:env.ZOOM_RETENTION_ENABLED==='true'},200,request);
    if (path === '/connect' && request.method === 'POST') {
      if (!admin) throw fail('Подключение доступно администратору',403);
      if (!env.ZOOM_CLIENT_ID || !env.ZOOM_CLIENT_SECRET) throw fail('Администратору нужно настроить ключи Zoom',503);
      const state = uid(); await put(env,'state:'+state,String(Date.now()+600000));
      return json({url:'https://zoom.us/oauth/authorize?'+new URLSearchParams({response_type:'code',client_id:env.ZOOM_CLIENT_ID,redirect_uri:CALLBACK,state})},200,request);
    }
    const canReadDeal = async id => {
      const access=dealAccessSql(me);
      return !!await env.DB.prepare('SELECT id FROM deals WHERE id=?'+access.where).bind(id,...access.params).first();
    };
    if (path === '/files' && request.method === 'GET') {
      const deal = url.searchParams.get('deal');
      if (deal ? !await canReadDeal(deal) : !admin) throw fail('Нет доступа',403);
      const {results}=await env.DB.prepare(`SELECT id,meeting_id,topic,recording_start,kind,extension,size,status,imported_at,deleted_at,error FROM zoom_files WHERE ${deal?'deal_id=?':'deal_id IS NULL'} ORDER BY recording_start DESC LIMIT 500`).bind(...(deal?[deal]:[])).all();
      return json({files:results},200,request);
    }
    const fileMatch=path.match(/^\/files\/([^/]+)(\/link)?$/);
    if (fileMatch) {
      const f=await env.DB.prepare('SELECT * FROM zoom_files WHERE id=?').bind(decodeURIComponent(fileMatch[1])).first();
      if (!f) throw fail('Файл не найден',404);
      if (f.deal_id ? !await canReadDeal(f.deal_id) : !admin) throw fail('Нет доступа',403);
      if (fileMatch[2] && request.method==='POST') {
        if (!admin) throw fail('Только администратор может привязывать архив',403);
        const {dealId}=await request.json();
        if (!dealId || !await canReadDeal(dealId)) throw fail('Сделка не найдена',404);
        await env.DB.prepare('UPDATE zoom_files SET deal_id=? WHERE meeting_uuid=? AND deal_id IS NULL').bind(dealId,f.meeting_uuid).run();
        return json({ok:true},200,request);
      }
      if (request.method==='DELETE') {
        if (!admin && !await canEditRecord(env,me,'deals',f.deal_id)) throw fail('Нет права удаления',403);
        if (f.status !== 'stored') throw fail('Удаление доступно после завершения переноса',409);
        await env.FILES.delete(f.r2_key);
        await env.DB.prepare("UPDATE zoom_files SET status='deleted',deleted_at=?,r2_key=NULL WHERE id=?").bind(now(),f.id).run();
        return json({ok:true},200,request);
      }
      if (request.method==='GET') {
        if(f.status!=='stored') throw fail('Файл ещё не перенесён или удалён',410);
        const object=await env.FILES.get(f.r2_key,{range:request.headers});
        if(!object) throw fail('Файл отсутствует',404);
        const headers=new Headers(deps.corsHeaders(request)); object.writeHttpMetadata(headers);
        headers.set('Cache-Control','private, no-store');headers.set('Accept-Ranges','bytes');headers.set('ETag',object.httpEtag);
        headers.set('X-Content-Type-Options','nosniff');
        if(object.range) headers.set('Content-Range',`bytes ${object.range.offset}-${object.range.offset+object.range.length-1}/${object.size}`);
        return new Response(object.body,{status:object.range?206:200,headers});
      }
    }
    const taskMatch=path.match(/^\/tasks\/([^/]+)$/);
    if(taskMatch) {
      const id=decodeURIComponent(taskMatch[1]);
      const t=await env.DB.prepare('SELECT * FROM tasks WHERE id=?').bind(id).first();
      if(!t) throw fail('Событие не найдено',404);
      const linkedDeal=taskDeal(t);
      if (linkedDeal && !await canReadDeal(linkedDeal)) throw fail('Нет доступа к связанной сделке',403);
      const editable=await canEditRecord(env,me,'tasks',id);
      if (!editable && !t.event_public) throw fail('Нет доступа к событию',403);
      if(request.method==='POST') {
        if(!editable) throw fail('Нет права изменения',403);
        const deal=taskDeal(t); if(deal && !await canReadDeal(deal)) throw fail('Нет доступа к сделке',403);
        return json({meeting:await ensureZoomForTask(env,id)},200,request);
      }
      const m=await env.DB.prepare('SELECT meeting_id,join_url,status,error FROM zoom_meetings WHERE task_id=?').bind(id).first();
      return json({meeting:m},200,request);
    }
    throw fail('Not found',404);
  }catch(e){return json({error:e.message},e.status||500,request);}
}
