// Один источник для назначения ответственных и фильтра по участникам Astana.
// Наблюдатели и отключённые пользователи не являются менеджерами.
export async function astanaAssignees(env,me=null,currentUid=''){
 const row=await env.DB.prepare("SELECT v FROM kv WHERE k='org:fieldConfig'").first();
 const config=JSON.parse(row?.v||'{}')['pipeline_2zttlx']||{};
 const ids=new Set(config.accessMemberUids||[]);
 if(me?.canonicalUid&&me.role!=='viewer')ids.add(me.canonicalUid);
 if(config.accessNodeIds?.length){
  const org=await env.DB.prepare("SELECT v FROM kv WHERE k='org:structure'").first();
  const selected=new Set(config.accessNodeIds);const walk=(node,inherited=false)=>{const included=inherited||selected.has(node.id);if(included){if(node.headUid)ids.add(node.headUid);for(const uid of node.memberUids||[])ids.add(uid);}for(const child of node.subDepartments||node.departments||[])walk(child,included);};
  for(const branch of JSON.parse(org?.v||'{}').branches||[])walk(branch);
 }
 const list=[...ids].filter(Boolean);
 const {results}=await env.DB.prepare(`SELECT u.uid,u.name,u.last_name,u.email,u.active FROM users u LEFT JOIN user_roles r ON r.uid=u.uid WHERE COALESCE(r.role,'agent')!='viewer' AND ((u.active=1 AND (u.uid IN (${list.map(()=>'?').join(',')||"''"}) OR lower(u.email)='uurraa@gmail.com')) OR u.uid=?) ORDER BY u.name LIMIT 500`).bind(...list,currentUid||'').all();
 return results.map(u=>({uid:u.uid,name:[u.name,u.last_name].filter(Boolean).join(' ')||u.email,assignable:u.active===1&&(ids.has(u.uid)||u.email==='uurraa@gmail.com')}));
}
