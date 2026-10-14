// Exact phone + call-start matching prevents recordings attaching to unrelated calls.
export function normalPhone(value) {
 return String(value || '').replace(/\D/g,'').replace(/^8(\d{10})$/,'7$1');
}
export function findRecordingCall(rows, meta) {
 const start=Date.parse(meta.startedAt);
 if(!Number.isFinite(start))return null;
 const matches=rows.filter(r=>!r.recording_url && r.direction===meta.direction && normalPhone(r.phone)===normalPhone(meta.phone) && Math.abs(Date.parse(r.started_at)-start)<120000);
 return matches.length===1?matches[0]:null;
}
export async function recordingToken(callKey, secret) {
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const bytes=new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(callKey)));
 const hex=Array.from(bytes.slice(0,16),b=>b.toString(16).padStart(2,'0')).join('');
 return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
export function resolveRecordingLinks(contacts,deals,phone) {
 const matching=contacts.filter(c=>{
  let values;try{values=JSON.parse(c.phones||'[]');}catch{return false;}
  return Array.isArray(values)&&values.some(p=>normalPhone(typeof p==='string'?p:p.value||p.VALUE)===normalPhone(phone));
 });
 if(matching.length!==1)return {contactId:null,dealId:null};
 const contactId=matching[0].id, candidates=deals.filter(d=>d.contact_id===contactId);
 return {contactId,dealId:candidates.length===1?candidates[0].id:null};
}
export async function lookupRecordingLinks(env,phone) {
 // Short suffix only narrows SQL candidates; exact normalized match decides identity.
 const {results:contacts}=await env.DB.prepare('SELECT id, phones FROM contacts WHERE phones LIKE ?').bind('%'+normalPhone(phone).slice(-4)+'%').all();
 const {contactId}=resolveRecordingLinks(contacts,[],phone);
 if(!contactId)return {contactId:null,dealId:null};
 const {results:deals}=await env.DB.prepare('SELECT id, contact_id FROM deals WHERE contact_id=? AND closed=0').bind(contactId).all();
 return resolveRecordingLinks(contacts,deals,phone);
}
