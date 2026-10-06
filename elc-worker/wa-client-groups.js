// Read-only discovery through connected WhatsApp accounts. Never creates groups,
// adds members or changes wa_chats.deal_id (one group may contain several clients).
const TTL=30*60*1000;
const parse=s=>{try{return JSON.parse(s)||[];}catch{return [];}};
const changed=r=>Number(r.meta?.changes??r.changes??0)>0;
function phone(value){let p=String(value||'').replace(/\D/g,'');if(p.length===11&&p[0]==='8')p='7'+p.slice(1);return /^\d{10,15}$/.test(p)?p:null;}
export async function clientGroupSchema(env){
 await env.DB.batch([
  env.DB.prepare('CREATE TABLE IF NOT EXISTS wa_group_discovery_requests (id TEXT PRIMARY KEY,phones TEXT NOT NULL,force INTEGER NOT NULL DEFAULT 0,requested_at INTEGER NOT NULL)'),
  env.DB.prepare('CREATE TABLE IF NOT EXISTS wa_group_directory (id TEXT PRIMARY KEY,channel_id TEXT NOT NULL,group_id TEXT NOT NULL,name TEXT,checked_at INTEGER NOT NULL DEFAULT 0,attempt_at INTEGER NOT NULL DEFAULT 0,error TEXT)'),
  env.DB.prepare('CREATE TABLE IF NOT EXISTS wa_group_members (group_key TEXT NOT NULL,member_id TEXT NOT NULL,PRIMARY KEY(group_key,member_id))'),
  env.DB.prepare('CREATE INDEX IF NOT EXISTS wa_group_member_lookup ON wa_group_members(member_id,group_key)'),
  env.DB.prepare('CREATE TABLE IF NOT EXISTS wa_group_aliases (channel_id TEXT NOT NULL,phone TEXT NOT NULL,lid TEXT,checked_at INTEGER NOT NULL,PRIMARY KEY(channel_id,phone))'),
  env.DB.prepare('CREATE TABLE IF NOT EXISTS wa_group_catalog_state (channel_id TEXT PRIMARY KEY,checked_at INTEGER NOT NULL DEFAULT 0,error TEXT)'),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS wa_group_discovery_lock (id INTEGER PRIMARY KEY,until_at INTEGER NOT NULL,owner TEXT)"),
  env.DB.prepare("INSERT OR IGNORE INTO wa_group_discovery_lock VALUES(1,0,'')")
 ]);
}
async function api(channel,method,body){
 const url=`${String(channel.api_url||'https://api.green-api.com').replace(/\/$/,'')}/waInstance${channel.id_instance}/${method}/${channel.api_token_instance}`;
 const r=await fetch(url,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(10000)});
 if(!r.ok)throw new Error(method+': HTTP '+r.status);
 return r.json();
}
export async function clientGroupPhones(env,contactId){
 const c=await env.DB.prepare('SELECT phones FROM contacts WHERE id=?').bind(contactId||'').first();
 const values=parse(c?.phones);return [...new Set((Array.isArray(values)?values:Object.values(values)).map(p=>phone(p?.value||p?.VALUE||p)).filter(Boolean))].slice(0,10);
}
export async function readClientGroups(env,phones){
 const now=Date.now();
 let chats=[];
 if(phones.length){
  const marks=phones.map(()=>'?').join(',');
  const {results}=await env.DB.prepare(`SELECT DISTINCT c.id,c.chat_id,c.instance_id,c.name FROM wa_group_directory g JOIN wa_channels ch ON ch.id=g.channel_id AND ch.active=1 JOIN wa_chats c ON c.id=g.id JOIN wa_group_members m ON m.group_key=g.id WHERE g.checked_at>=? AND (m.member_id IN (${marks}) OR m.member_id IN (SELECT lid FROM wa_group_aliases WHERE channel_id=g.channel_id AND phone IN (${marks}) AND checked_at>=?)) ORDER BY c.name`).bind(now-TTL,...phones.map(p=>p+'@c.us'),...phones,now-86400000).all();chats=results||[];
 }
 const counts=await env.DB.prepare('SELECT COUNT(*) AS total,COALESCE(SUM(g.checked_at>=?),0) AS checked,COALESCE(SUM(g.error IS NOT NULL),0) AS errors FROM wa_group_directory g JOIN wa_channels ch ON ch.id=g.channel_id AND ch.active=1').bind(now-TTL).first();
 const channels=await env.DB.prepare('SELECT COUNT(*) AS total,COALESCE(SUM(s.checked_at>=?),0) AS checked,COALESCE(SUM(s.error IS NOT NULL),0) AS errors FROM wa_channels c LEFT JOIN wa_group_catalog_state s ON s.channel_id=c.id WHERE c.active=1').bind(now-TTL).first();
 return {chats,discovery:{...counts,channels:channels.total,catalogReady:channels.checked===channels.total,errors:Number(counts.errors)+Number(channels.errors),hasPhone:!!phones.length}};
}
export async function refreshClientGroups(env,phones=[],force=false){
 await clientGroupSchema(env);
 const now=Date.now(),owner=crypto.randomUUID();
 const lease=await env.DB.prepare('UPDATE wa_group_discovery_lock SET until_at=?,owner=? WHERE id=1 AND until_at<=?').bind(now+240000,owner,now).run();
 if(!changed(lease))return false;
 try{
  if(force)await env.DB.batch([env.DB.prepare('UPDATE wa_group_directory SET checked_at=0,attempt_at=0'),env.DB.prepare('UPDATE wa_group_catalog_state SET checked_at=0')]);
  const {results:channels}=await env.DB.prepare('SELECT * FROM wa_channels WHERE active=1').all();
  for(const channel of channels||[]){
   const state=await env.DB.prepare('SELECT checked_at FROM wa_group_catalog_state WHERE channel_id=?').bind(channel.id).first();
   if(!state||state.checked_at<now-TTL){
    try{
     const contacts=await api(channel,'getContacts');
     if(!Array.isArray(contacts))throw new Error('WhatsApp пока не вернул список групп');
     if(!contacts.length && await env.DB.prepare('SELECT id FROM wa_group_directory WHERE channel_id=? LIMIT 1').bind(channel.id).first())throw new Error('WhatsApp временно вернул пустой список');
     const groups=contacts.filter(c=>/^\d[\d-]*@g\.us$/.test(c.id||''));
     const writes=[];
     for(const g of groups){
      const id=`wa:${channel.id_instance}:${g.id}`,name=g.name||g.contactName||'Группа';
      writes.push(
       env.DB.prepare('INSERT INTO wa_group_directory(id,channel_id,group_id,name) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name').bind(id,channel.id,g.id,name),
       env.DB.prepare("INSERT INTO wa_chats(id,instance_id,chat_id,is_group,name,last_message_text,last_message_at,updated_at) VALUES(?,?,?,1,?,'',0,datetime('now')) ON CONFLICT(id) DO UPDATE SET name=excluded.name,is_group=1").bind(id,channel.id_instance,g.id,name)
      );
     }
     for(let i=0;i<writes.length;i+=100)await env.DB.batch(writes.slice(i,i+100));
     // A successful catalog is authoritative about groups available to this account.
     const {results:old}=await env.DB.prepare('SELECT id,group_id FROM wa_group_directory WHERE channel_id=?').bind(channel.id).all();
     const ids=new Set(groups.map(g=>g.id));
     for(const g of old||[])if(!ids.has(g.group_id))await env.DB.batch([env.DB.prepare('DELETE FROM wa_group_members WHERE group_key=?').bind(g.id),env.DB.prepare('DELETE FROM wa_group_directory WHERE id=?').bind(g.id)]);
     await env.DB.prepare('INSERT INTO wa_group_catalog_state VALUES(?,?,NULL) ON CONFLICT(channel_id) DO UPDATE SET checked_at=excluded.checked_at,error=NULL').bind(channel.id,now).run();
    }catch(e){await env.DB.prepare('INSERT INTO wa_group_catalog_state VALUES(?,0,?) ON CONFLICT(channel_id) DO UPDATE SET error=excluded.error').bind(channel.id,String(e.message).slice(0,180)).run();}
   }
   // Resolve hidden phone numbers to WhatsApp LIDs without sending anything.
   for(const p of phones){
    const old=await env.DB.prepare('SELECT checked_at FROM wa_group_aliases WHERE channel_id=? AND phone=?').bind(channel.id,p).first();
    if(old?.checked_at>=now-86400000)continue;
    try{const data=await api(channel,'checkWhatsapp',{chatId:p+'@c.us'});const lid=data.existsWhatsapp===true&&String(data.chatId||'').endsWith('@lid')?data.chatId:null;
     await env.DB.prepare('INSERT INTO wa_group_aliases VALUES(?,?,?,?) ON CONFLICT(channel_id,phone) DO UPDATE SET lid=excluded.lid,checked_at=excluded.checked_at').bind(channel.id,p,lid,now).run();
    }catch{/* Phone IDs still match without LID lookup. */}
   }
  }
  const {results:due}=await env.DB.prepare('SELECT g.* FROM wa_group_directory g JOIN wa_channels ch ON ch.id=g.channel_id AND ch.active=1 WHERE g.checked_at<? AND g.attempt_at<? ORDER BY g.attempt_at,g.id LIMIT 8').bind(now-TTL,now-60000).all();
  for(const group of due||[]){
   const channel=channels.find(c=>c.id===group.channel_id);
   await env.DB.prepare('UPDATE wa_group_directory SET attempt_at=? WHERE id=?').bind(now,group.id).run();
   try{
    const data=await api(channel,'getGroupData',{groupId:group.group_id});
    if(!Array.isArray(data.participants))throw new Error('Участники группы недоступны');
    const members=[...new Set(data.participants.flatMap(p=>[p.id,p.phoneNumber,p.lid]).filter(v=>typeof v==='string'&&/@(?:c\.us|lid)$/.test(v)))];
    await env.DB.batch([env.DB.prepare('DELETE FROM wa_group_members WHERE group_key=?').bind(group.id),...members.map(id=>env.DB.prepare('INSERT INTO wa_group_members VALUES(?,?)').bind(group.id,id)),env.DB.prepare('UPDATE wa_group_directory SET checked_at=?,error=NULL WHERE id=?').bind(now,group.id)]);
   }catch(e){await env.DB.prepare('UPDATE wa_group_directory SET checked_at=0,error=? WHERE id=?').bind(String(e.message).slice(0,180),group.id).run();}
  }
 }finally{await env.DB.prepare('UPDATE wa_group_discovery_lock SET until_at=0 WHERE id=1 AND owner=?').bind(owner).run();}
 return true;
}

export async function requestClientGroupRefresh(env,phones,force=false){
 if(!phones.length)return;
 const id=[...phones].sort().join(',');
 await env.DB.prepare('INSERT INTO wa_group_discovery_requests VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET force=MAX(force,excluded.force)').bind(id,JSON.stringify(phones),force?1:0,Date.now()).run();
}
export async function processClientGroupRefresh(env){
 await clientGroupSchema(env);
 const job=await env.DB.prepare('SELECT * FROM wa_group_discovery_requests ORDER BY requested_at LIMIT 1').first();
 if(!job)return;
 const phones=parse(job.phones);
 if(!await refreshClientGroups(env,phones,!!job.force))return;
 const state=await readClientGroups(env,phones);
 if(state.discovery.catalogReady&&state.discovery.checked===state.discovery.total&&!state.discovery.errors)await env.DB.prepare('DELETE FROM wa_group_discovery_requests WHERE id=?').bind(job.id).run();
 else await env.DB.prepare('UPDATE wa_group_discovery_requests SET force=0,requested_at=? WHERE id=?').bind(Date.now(),job.id).run();
}
