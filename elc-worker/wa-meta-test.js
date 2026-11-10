// Реальный тест Meta в CRM, отдельный от рабочих каналов Green API.
export const META_TEST = Object.freeze({ phoneId:'1464941916696853', wabaId:'2126758854867530', recipient:'77066423098', instance:'meta-test-1464941916696853' });
const CHAT=`wa:${META_TEST.instance}:${META_TEST.recipient}@c.us`;
export function isMetaTestChat(v) { return String(v||'').includes(META_TEST.instance); }
export async function ensureMetaTestSchema(env) {
  await env.DB.batch([
    env.DB.prepare('CREATE TABLE IF NOT EXISTS wa_meta_test_config (id INTEGER PRIMARY KEY CHECK(id=1), access_token TEXT NOT NULL, app_secret TEXT NOT NULL, verify_token TEXT NOT NULL, updated_at TEXT)'),
    env.DB.prepare('CREATE TABLE IF NOT EXISTS wa_meta_test_status (message_id TEXT PRIMARY KEY, status TEXT NOT NULL, rank INTEGER NOT NULL, ts INTEGER NOT NULL, error_code TEXT)'),
  ]);
}
async function config(env) { return env.DB.prepare('SELECT * FROM wa_meta_test_config WHERE id=1').first(); }
export async function validMetaSignature(raw,signature,secret) {
  if (!secret || !/^sha256=[a-f0-9]{64}$/i.test(signature||'')) return false;
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
  return crypto.subtle.verify('HMAC',key,Uint8Array.from(signature.slice(7).match(/../g),x=>parseInt(x,16)),new TextEncoder().encode(raw));
}
export async function metaGraph(path,token,payload,fetcher=fetch) {
  const r=await fetcher(`https://graph.facebook.com/v26.0/${path}`,{method:payload?'POST':'GET',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(payload?{body:JSON.stringify(payload)}:{}),signal:AbortSignal.timeout(20000)});
  const data=await r.json();
  // Не возвращаем upstream message: он может содержать детали аккаунта/токена.
  if (!r.ok || data.error) throw new Error(`Meta API: ${data.error?.code||r.status}. Проверьте токен, разрешения и окно переписки.`);
  return data;
}
export function metaTextPayload(recipient,text) {
  if(recipient!==META_TEST.recipient) throw new Error('Тестовый канал разрешён только для подтверждённого тестового получателя.');
  if(typeof text!=='string'||!text.trim()||text.length>4096) throw new Error('Текст должен содержать от 1 до 4096 символов.');
  return {messaging_product:'whatsapp',to:recipient,type:'text',text:{body:text.trim()}};
}
async function saveMessage(env,m) {
  const id=`wa:${META_TEST.instance}:${m.id}`;
  // D1 batch транзакционный. Повторная доставка не меняет чат/непрочитанные.
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO wa_chats (id,instance_id,chat_id,phone,name,last_message_text,last_message_at,last_message_from,unread_count,updated_at)
      SELECT ?,?,?,?, ?,?,?,?, ?,datetime('now') WHERE NOT EXISTS (SELECT 1 FROM wa_messages WHERE id=?)
      ON CONFLICT(id) DO UPDATE SET
      last_message_text=CASE WHEN excluded.last_message_at>=wa_chats.last_message_at THEN excluded.last_message_text ELSE wa_chats.last_message_text END,
      last_message_from=CASE WHEN excluded.last_message_at>=wa_chats.last_message_at THEN excluded.last_message_from ELSE wa_chats.last_message_from END,
      last_message_at=MAX(COALESCE(wa_chats.last_message_at,0),excluded.last_message_at),
      unread_count=COALESCE(wa_chats.unread_count,0)+excluded.unread_count,updated_at=datetime('now')`)
      .bind(CHAT,META_TEST.instance,`${META_TEST.recipient}@c.us`,META_TEST.recipient,'Тест Meta · Платон',m.text.slice(0,200),m.ts,m.direction==='in'?'them':'me',m.direction==='in'?1:0,id),
    env.DB.prepare('INSERT OR IGNORE INTO wa_messages (id,chat_id,wa_message_id,direction,text,ts) VALUES (?,?,?,?,?,?)').bind(id,CHAT,m.id,m.direction,m.text,m.ts),
  ]);
}
export async function sendMetaTest(env,{text,template=false,recipient=META_TEST.recipient}) {
  if(recipient!==META_TEST.recipient) throw new Error('Неверный получатель тестового канала.');
  const c=await config(env); if(!c) throw new Error('Сначала настройте тестовый канал Meta.');
  const payload=template?{messaging_product:'whatsapp',to:recipient,type:'template',template:{name:'jaspers_market_order_confirmation_v1',language:{code:'en_US'},components:[{type:'body',parameters:[{type:'text',text:'Platon'},{type:'text',text:'TEST-CRM'},{type:'text',text:new Date().toISOString().slice(0,10)}]}]}}:metaTextPayload(recipient,text);
  const data=await metaGraph(`${META_TEST.phoneId}/messages`,c.access_token,payload),id=data.messages?.[0]?.id;
  if(!id) throw new Error('Meta не вернула идентификатор сообщения.');
  await saveMessage(env,{id,direction:'out',text:template?'[Тестовый шаблон Meta · TEST-CRM]':text.trim(),ts:Date.now()});
  return {idMessage:id,chatDocId:CHAT};
}
export async function ingestMetaTest(env,body) {
  if(body.object!=='whatsapp_business_account') return;
  for(const entry of body.entry||[]) {
    if(String(entry.id)!==META_TEST.wabaId) continue;
    for(const change of entry.changes||[]) {
      const v=change.value;
      if(change.field!=='messages'||String(v?.metadata?.phone_number_id)!==META_TEST.phoneId) continue;
      for(const m of v.messages||[]) {
        if(m.from!==META_TEST.recipient||!m.id||!/^\d+$/.test(String(m.timestamp))) continue;
        const text=m.type==='text'?m.text?.body:`[${m.type||'сообщение'}: в тесте поддерживается текст]`;
        await saveMessage(env,{id:m.id,direction:'in',text:String(text||''),ts:Number(m.timestamp)*1000});
      }
      for(const st of v.statuses||[]) {
        if(st.recipient_id!==META_TEST.recipient||!st.id) continue;
        const rank={sent:1,failed:2,delivered:3,read:4}[st.status]; if(!rank) continue;
        await env.DB.prepare(`INSERT INTO wa_meta_test_status (message_id,status,rank,ts,error_code) VALUES (?,?,?,?,?)
          ON CONFLICT(message_id) DO UPDATE SET status=excluded.status,rank=excluded.rank,ts=excluded.ts,error_code=excluded.error_code WHERE excluded.rank>wa_meta_test_status.rank`)
          .bind(st.id,st.status,rank,(Number(st.timestamp)||0)*1000,st.errors?.[0]?.code?String(st.errors[0].code):null).run();
      }
    }
  }
}
export async function handleMetaTest(request,env,{requireAdmin,json}) {
  const url=new URL(request.url),action=url.pathname.split('/').pop();
  if(action!=='webhook') { const guard=await requireAdmin(request,env); if(guard.error)return json({error:guard.error},guard.status,request); }
  await ensureMetaTestSchema(env); const c=await config(env);
  if(action==='webhook') {
    if(!c)return new Response('Not configured',{status:503});
    if(request.method==='GET') {
      if(url.searchParams.get('hub.mode')!=='subscribe'||url.searchParams.get('hub.verify_token')!==c.verify_token)return new Response('Forbidden',{status:403});
      return new Response(url.searchParams.get('hub.challenge')||'',{headers:{'Content-Type':'text/plain'}});
    }
    if(request.method!=='POST')return new Response('Method not allowed',{status:405});
    const raw=await request.text(); if(raw.length>1024*1024)return new Response('Too large',{status:413});
    if(!await validMetaSignature(raw,request.headers.get('x-hub-signature-256'),c.app_secret))return new Response('Invalid signature',{status:401});
    let body;try{body=JSON.parse(raw);}catch{return new Response('Invalid JSON',{status:400});}
    await ingestMetaTest(env,body);return new Response('EVENT_RECEIVED');
  }
  if(action==='config'&&request.method==='GET')return json({configured:!!c,phoneId:META_TEST.phoneId,wabaId:META_TEST.wabaId,recipient:META_TEST.recipient,verifyToken:c?.verify_token||null,webhookUrl:`${url.origin}/api/wa/meta-test/webhook`},200,request);
  if(action==='config'&&request.method==='POST') {
    let b;try{b=await request.json();}catch{return json({error:'Некорректный JSON'},400,request);}
    const access=String(b.accessToken||'').trim()||c?.access_token,secret=String(b.appSecret||'').trim()||c?.app_secret;
    if(!access||access.length>4096||!/^[a-f0-9]{32}$/i.test(secret||''))return json({error:'Нужны токен Meta и App Secret (32 hex символа).'},400,request);
    try{const p=await metaGraph(`${META_TEST.phoneId}?fields=id`,access);if(String(p.id)!==META_TEST.phoneId)throw new Error('Неверный тестовый номер.');}catch(e){return json({error:e.message},400,request);}
    await env.DB.prepare(`INSERT INTO wa_meta_test_config (id,access_token,app_secret,verify_token,updated_at) VALUES (1,?,?,?,datetime('now')) ON CONFLICT(id) DO UPDATE SET access_token=excluded.access_token,app_secret=excluded.app_secret,updated_at=datetime('now')`).bind(access,secret,c?.verify_token||crypto.randomUUID()).run();
    return json({ok:true},200,request);
  }
  if(action==='messages'&&request.method==='GET') {
    const {results}=await env.DB.prepare(`SELECT m.wa_message_id AS id,m.direction,m.text,m.ts,s.status,s.error_code FROM wa_messages m LEFT JOIN wa_meta_test_status s ON s.message_id=m.wa_message_id WHERE m.chat_id=? ORDER BY m.ts DESC LIMIT 100`).bind(CHAT).all();
    return json({items:results.reverse(),chatId:CHAT},200,request);
  }
  if(action==='send'&&request.method==='POST') {
    let b;try{b=await request.json();}catch{return json({error:'Некорректный JSON'},400,request);}
    try{return json({ok:true,...await sendMetaTest(env,{text:b.text,template:b.template===true})},200,request);}catch(e){return json({error:e.message},502,request);}
  }
  return json({error:'Not found'},404,request);
}
