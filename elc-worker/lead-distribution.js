// Единая очередь воронки для WhatsApp, сайта, Meta и новых карточек CRM.
// Назначение + сдвиг очереди — одна транзакция D1; повтор webhook не ест очередь.
export async function ensureLeadDistribution(env) {
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS lead_distribution (
      pipeline_id TEXT PRIMARY KEY, stage_id TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 0,
      config TEXT NOT NULL, slots TEXT NOT NULL, cursor INTEGER NOT NULL DEFAULT 0)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS lead_assignments (
      deal_id TEXT PRIMARY KEY, pipeline_id TEXT NOT NULL, lead_uid TEXT NOT NULL,
      kep_uid TEXT, next_cursor INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`),
  ]);
}
export function distributionSlots(rows, mode) {
  const weights=rows.map(r=>mode==='equal'?1:r.weight);
  const total=weights.reduce((a,b)=>a+b,0), scores=weights.map(()=>0), slots=[];
  for(let n=0;n<total;n++) {
    for(let i=0;i<scores.length;i++) scores[i]+=weights[i];
    let best=0;for(let i=1;i<scores.length;i++) if(scores[i]>scores[best]) best=i;
    scores[best]-=total;
    slots.push({leadUid:rows[best].leadUid,kepUid:rows[best].kepUid||null});
  }
  return slots;
}
export async function assignLeadManagers(env, pipelineId, stageId, dealId) {
  if(!pipelineId||!stageId||!dealId) return null;
  await ensureLeadDistribution(env);
  const result=await env.DB.batch([
    env.DB.prepare(`INSERT OR IGNORE INTO lead_assignments(deal_id,pipeline_id,lead_uid,kep_uid,next_cursor)
      SELECT ?, r.pipeline_id, json_extract(s.value,'$.leadUid'), k.uid,
        r.cursor + ((CAST(s.key AS INTEGER) - r.cursor % json_array_length(r.slots) + json_array_length(r.slots)) % json_array_length(r.slots)) + 1
      FROM lead_distribution r, json_each(r.slots) s
      JOIN users u ON u.uid=json_extract(s.value,'$.leadUid') AND COALESCE(u.active,1)!=0
      LEFT JOIN users k ON k.uid=json_extract(s.value,'$.kepUid') AND COALESCE(k.active,1)!=0
      WHERE r.pipeline_id=? AND r.stage_id=? AND r.enabled=1
      ORDER BY ((CAST(s.key AS INTEGER) - r.cursor % json_array_length(r.slots) + json_array_length(r.slots)) % json_array_length(r.slots)) LIMIT 1`).bind(dealId,pipelineId,stageId),
    env.DB.prepare(`UPDATE lead_distribution SET cursor=(SELECT next_cursor FROM lead_assignments WHERE deal_id=?)
      WHERE pipeline_id=? AND changes()>0`).bind(dealId,pipelineId),
    env.DB.prepare('SELECT lead_uid AS leadUid,kep_uid AS kepUid FROM lead_assignments WHERE deal_id=?').bind(dealId),
  ]);
  return result[2].results?.[0]||null;
}
export async function handleLeadDistribution(request,env,deps,pipelineId) {
  const guard=await deps.requireAdmin(request,env);
  if(guard.error) return deps.json({error:guard.error},guard.status,request);
  await ensureLeadDistribution(env);
  if(request.method==='GET') {
    const row=await env.DB.prepare('SELECT config FROM lead_distribution WHERE pipeline_id=?').bind(pipelineId).first();
    return deps.json({config:row?JSON.parse(row.config):{enabled:false,mode:'equal',rows:[]}},200,request);
  }
  if(request.method!=='PUT') return deps.json({error:'Method not allowed'},405,request);
  let body;try{body=await request.json();}catch{return deps.json({error:'Некорректные настройки'},400,request);}
  const fail=message=>deps.json({error:message},400,request);
  if(!body||typeof body!=='object') return fail('Некорректные настройки');
  const pipeline=await env.DB.prepare('SELECT stages FROM pipelines WHERE id=?').bind(pipelineId).first();
  const stages=JSON.parse(pipeline?.stages||'{}');
  if(!pipeline||!Object.entries(stages).some(([id,s])=>String(s.statusId||id)===body.stageId)) return fail('Стадия не найдена');
  if(!['equal','weighted'].includes(body.mode)||!Array.isArray(body.rows)||body.rows.length>30) return fail('Проверьте режим и список сотрудников');
  if(body.enabled && !body.rows.length) return fail('Добавьте менеджера по лидам');
  const rows=[],seen=new Set();
  for(const r of body.rows) {
    if(!r||typeof r.leadUid!=='string'||!r.leadUid) return fail('Выберите менеджера по лидам');
    const pair=JSON.stringify([r.leadUid,r.kepUid||null]);
    if(seen.has(pair)) return fail('Эта пара менеджеров уже добавлена');
    seen.add(pair);
    const weight=body.mode==='equal'?1:Number(r.weight);
    if(!Number.isInteger(weight)||weight<1||weight>100) return fail('Доля должна быть целым числом от 1 до 100');
    for(const uid of [r.leadUid,r.kepUid].filter(Boolean)) {
      if(typeof uid!=='string'||!await env.DB.prepare('SELECT uid FROM users WHERE uid=? AND COALESCE(active,1)!=0').bind(uid).first()) return fail('Сотрудник не найден или отключён');
    }
    rows.push({leadUid:r.leadUid,kepUid:r.kepUid||null,weight});
  }
  const config={enabled:body.enabled===true,stageId:body.stageId,mode:body.mode,rows};
  await env.DB.prepare(`INSERT INTO lead_distribution(pipeline_id,stage_id,enabled,config,slots,cursor)
    VALUES(?,?,?,?,?,0) ON CONFLICT(pipeline_id) DO UPDATE SET stage_id=excluded.stage_id,
    enabled=excluded.enabled,config=excluded.config,slots=excluded.slots,cursor=0`)
    .bind(pipelineId,config.stageId,Number(config.enabled),JSON.stringify(config),JSON.stringify(distributionSlots(rows,config.mode))).run();
  return deps.json({ok:true,config},200,request);
}
