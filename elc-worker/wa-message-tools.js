import {greenApiHost} from './green-api-host.js';

const ready=new WeakSet();
// Отдельная небольшая таблица: без ALTER и переписывания архива сообщений.
export async function ensureMessageTools(db){
 if(ready.has(db))return;
 await db.prepare(`CREATE TABLE IF NOT EXISTS wa_message_tools(message_id TEXT PRIMARY KEY,quote_json TEXT,edited_at INTEGER NOT NULL DEFAULT 0)`).run();
 await db.prepare('CREATE INDEX IF NOT EXISTS wa_tools_edits ON wa_message_tools(edited_at)').run();
 ready.add(db);
}
export async function saveQuote(db,id,quote){
 if(!quote)return;
 await ensureMessageTools(db);
 await db.prepare('INSERT INTO wa_message_tools(message_id,quote_json) VALUES(?,?) ON CONFLICT(message_id) DO UPDATE SET quote_json=excluded.quote_json').bind(id,JSON.stringify(quote)).run();
}
export async function resolveQuote(db,chatId,providerId){
 if(typeof providerId!=='string'||!providerId||providerId.length>200)throw Error('Некорректная цитата');
 const m=await db.prepare('SELECT wa_message_id,text,caption,media_file_name,sender_name,direction FROM wa_messages WHERE chat_id=? AND wa_message_id=? LIMIT 1').bind(chatId,providerId).first();
 if(!m)throw Error('Сообщение для цитирования отсутствует в этом чате');
 return {id:m.wa_message_id,text:String(m.text||m.caption||m.media_file_name||'Вложение').slice(0,1000),author:m.direction==='out'?'Вы':m.sender_name||'Клиент'};
}
export function editableMessage(m,now=Date.now()){
 return m?.direction==='out'&&!m.media_kind&&!!m.text&&Number(m.ts)>now-15*60000&&Number(m.ts)<=now;
}
export async function handleEditMessage(request,env,deps){
 const {json,requireAuthFlexible,resolveCanonicalUser,canEditChat,auditLog}=deps;
 const auth=await requireAuthFlexible(request,env);if(auth.error)return json({error:auth.error},auth.status,request);
 const me=await resolveCanonicalUser(env,auth.claims);
 let b;try{b=await request.json();}catch{return json({error:'Некорректный запрос'},400,request);}
 if(typeof b.chatId!=='string'||typeof b.messageId!=='string'||typeof b.text!=='string'||!b.text.trim()||b.text.length>20000)return json({error:'Введите текст до 20 000 символов'},400,request);
 const chat=await env.DB.prepare('SELECT * FROM wa_chats WHERE id=?').bind(b.chatId).first();
 if(!chat||!await canEditChat(env,me,chat))return json({error:'Нет доступа к редактированию этой переписки'},403,request);
 const m=await env.DB.prepare('SELECT * FROM wa_messages WHERE chat_id=? AND wa_message_id=?').bind(chat.id,b.messageId).first();
 if(!editableMessage(m))return json({error:'Можно изменить только исходящий текст в течение 15 минут'},400,request);
 const ch=await env.DB.prepare('SELECT * FROM wa_channels WHERE id_instance=? AND active=1').bind(chat.instance_id).first();
 if(!ch)return json({error:'WhatsApp-номер отключён'},409,request);
 await ensureMessageTools(env.DB);
 try{
  const r=await fetch(`${greenApiHost(ch.api_url)}/waInstance${ch.id_instance}/editMessage/${ch.api_token_instance}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chatId:chat.chat_id,idMessage:m.wa_message_id,message:b.text.trim()}),signal:AbortSignal.timeout(20000)});
  const data=await r.json().catch(()=>({}));
  if(!r.ok||!data.idMessage)return json({error:'WhatsApp не подтвердил запрос на изменение. Обновите переписку перед повтором.'},502,request);
  const at=Date.now();
  await env.DB.batch([
   env.DB.prepare('UPDATE wa_messages SET text=? WHERE id=?').bind(b.text.trim(),m.id),
   env.DB.prepare('INSERT INTO wa_message_tools(message_id,edited_at) VALUES(?,?) ON CONFLICT(message_id) DO UPDATE SET edited_at=excluded.edited_at').bind(m.id,at),
   env.DB.prepare('UPDATE wa_chats SET last_message_text=? WHERE id=? AND last_message_at=? AND last_message_from=\'me\'').bind(b.text.trim().slice(0,200),chat.id,m.ts)
  ]);
  await auditLog(env,me,'wa_edit','wa_message',m.id,{});
  return json({ok:true,editedAt:at},200,request);
 }catch{return json({error:'Не получен ответ WhatsApp. Проверьте сообщение перед повтором.'},502,request);}
}
// Редактирование не создаёт лидов, сообщений-дублей или новых непрочитанных.
export async function applyMessageEdit(db,evt,data){
 if(!data?.stanzaId||typeof data.textMessage!=='string')return false;
 const chatId=`wa:${evt.instanceId}:${evt.chatId}`;
 const m=await db.prepare('SELECT * FROM wa_messages WHERE chat_id=? AND wa_message_id=? AND direction=?').bind(chatId,String(data.stanzaId),evt.direction).first();
 if(!m||m.text===data.textMessage)return false;
 await ensureMessageTools(db);
 await db.batch([
  db.prepare('UPDATE wa_messages SET text=? WHERE id=?').bind(data.textMessage.slice(0,20000),m.id),
  db.prepare('INSERT INTO wa_message_tools(message_id,edited_at) VALUES(?,?) ON CONFLICT(message_id) DO UPDATE SET edited_at=excluded.edited_at').bind(m.id,Date.now()),
  db.prepare('UPDATE wa_chats SET last_message_text=? WHERE id=? AND last_message_at=?').bind(data.textMessage.slice(0,200),chatId,m.ts)
 ]);return true;
}
