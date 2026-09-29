import { DEMO_BUILD_STAGE_RE } from './production-stages.js';
// Deal document production: transcription gate, AI brief, interactive demo,
// commercial proposal and invoice pack. D1 is the durable queue; R2 stores
// every generated artifact. The minute cron retries interrupted jobs.

const PUBLIC_ORIGIN = 'https://pllato-elc-worker.uurraa.workers.dev';
const MAX_TRANSCRIPT_CHARS = 240000;
const JOB_LEASE_MS = 12 * 60 * 1000;
const MAX_JOB_ATTEMPTS = 3;

const nowIso = () => new Date().toISOString();
const safeJson = (value, fallback = {}) => {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
};
const uid = prefix => `${prefix}_${crypto.randomUUID().replace(/-/g, '')}`;
const esc = value => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const cleanText = value => String(value ?? '').replace(/\0/g, '').trim();
const money = (value, currency = 'KZT') => {
  const n = Number(value || 0);
  const suffix = currency === 'KZT' ? '₸' : currency === 'USD' ? '$' : currency;
  return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(n)} ${suffix}`;
};
const allowedColor = (value, fallback) => /^#[0-9a-f]{6}$/i.test(String(value || '')) ? value : fallback;

let schemaReady = false;
export async function ensureDealProductionSchema(env) {
  if (schemaReady) return;
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS deal_production_jobs (
      id TEXT PRIMARY KEY, deal_id TEXT NOT NULL, kind TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'queued', payload TEXT NOT NULL DEFAULT '{}',
      attempt INTEGER NOT NULL DEFAULT 0, lease_until INTEGER, next_attempt_at INTEGER,
      error TEXT, created_by TEXT, created_at TEXT NOT NULL, started_at TEXT,
      completed_at TEXT, updated_at TEXT NOT NULL,
      progress_stage TEXT, progress_label TEXT, progress_percent INTEGER NOT NULL DEFAULT 0,
      UNIQUE(deal_id, kind)
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS deal_artifacts (
      id TEXT PRIMARY KEY, deal_id TEXT NOT NULL, job_id TEXT NOT NULL,
      kind TEXT NOT NULL, title TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'queued',
      sequence INTEGER NOT NULL DEFAULT 0, amount REAL, currency TEXT,
      file_name TEXT, mime TEXT, r2_key TEXT, public_token TEXT, public_url TEXT,
      metadata TEXT NOT NULL DEFAULT '{}', error TEXT,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
      UNIQUE(deal_id, kind, sequence)
    )`),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_deal_production_jobs_queue ON deal_production_jobs(status,next_attempt_at,created_at)'),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_deal_artifacts_deal ON deal_artifacts(deal_id,kind,sequence)'),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS deal_requisites (
      deal_id TEXT PRIMARY KEY, text TEXT NOT NULL, updated_by TEXT, updated_at TEXT NOT NULL
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS deal_requisite_files (
      id TEXT PRIMARY KEY, deal_id TEXT NOT NULL, name TEXT NOT NULL, mime TEXT NOT NULL,
      size INTEGER NOT NULL, r2_key TEXT NOT NULL, uploaded_by TEXT, created_at TEXT NOT NULL
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS demos (
      id TEXT PRIMARY KEY, deal_id TEXT, client_name TEXT, title TEXT,
      status TEXT DEFAULT 'new', is_new INTEGER DEFAULT 1, website TEXT,
      brief_snapshot TEXT, token TEXT, token_expires TEXT, sort_order INTEGER DEFAULT 0,
      created_by TEXT, created_at TEXT, updated_at TEXT, slug TEXT, message TEXT,
      build_status TEXT DEFAULT 'ready', build_error TEXT
    )`),
  ]);
  // Existing D1 databases predate live progress. Keep the migration inline and
  // idempotent so every Worker isolate can safely ensure the current shape.
  for (const sql of [
    'ALTER TABLE deal_production_jobs ADD COLUMN progress_stage TEXT',
    'ALTER TABLE deal_production_jobs ADD COLUMN progress_label TEXT',
    'ALTER TABLE deal_production_jobs ADD COLUMN progress_percent INTEGER NOT NULL DEFAULT 0',
  ]) {
    try { await env.DB.prepare(sql).run(); } catch {}
  }
  schemaReady = true;
}

export function isTranscriptRecord(row) {
  const ext = String(row?.extension || row?.name || '').toUpperCase();
  const kind = String(row?.kind || '').toLowerCase();
  const mime = String(row?.content_type || row?.mime || '').toLowerCase();
  return kind.includes('transcript') || /(?:^|\.)(VTT|TXT)$/.test(ext) || /\b(VTT|TXT)\b/.test(ext)
    || mime.startsWith('text/vtt');
}

async function latestTranscript(env, dealId) {
  const rows = [];
  try {
    const { results } = await env.DB.prepare(`SELECT id,r2_key,kind,extension,topic AS name,size,
      recording_start AS created_at,'zoom' AS source FROM zoom_files
      WHERE deal_id=? AND status='stored' AND r2_key IS NOT NULL ORDER BY recording_start DESC LIMIT 100`)
      .bind(dealId).all();
    rows.push(...(results || []).filter(isTranscriptRecord));
  } catch {}
  try {
    const { results } = await env.DB.prepare(`SELECT id,r2_key,COALESCE(kind,'recording') AS kind,
      name,size,content_type,uploaded_at AS created_at,'manual' AS source
      FROM deal_qual_recordings WHERE deal_id=? ORDER BY uploaded_at DESC LIMIT 100`).bind(dealId).all();
    rows.push(...(results || []).filter(isTranscriptRecord));
  } catch {}
  rows.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
  return rows[0] || null;
}

async function requisitesState(env, dealId) {
  await ensureDealProductionSchema(env);
  const row = await env.DB.prepare('SELECT text,updated_at FROM deal_requisites WHERE deal_id=?').bind(dealId).first();
  const count = await env.DB.prepare('SELECT COUNT(*) AS c FROM deal_requisite_files WHERE deal_id=?').bind(dealId).first();
  const text = cleanText(row?.text);
  return { ready: Boolean(text || Number(count?.c || 0)), text, files: Number(count?.c || 0), updatedAt: row?.updated_at || null };
}

async function artifactsFor(env, dealId) {
  await ensureDealProductionSchema(env);
  const { results } = await env.DB.prepare(`SELECT id,deal_id,job_id,kind,title,status,sequence,amount,currency,
    file_name,mime,public_url,metadata,error,created_at,updated_at
    FROM deal_artifacts WHERE deal_id=? ORDER BY CASE kind WHEN 'demo' THEN 1 WHEN 'kp' THEN 2 ELSE 3 END,sequence`)
    .bind(dealId).all();
  return (results || []).map(row => ({
    id: row.id, dealId: row.deal_id, jobId: row.job_id, kind: row.kind,
    title: row.title, status: row.status, sequence: Number(row.sequence || 0),
    amount: row.amount == null ? null : Number(row.amount), currency: row.currency || null,
    fileName: row.file_name || null, mime: row.mime || null,
    url: row.kind === 'demo' && row.public_url ? row.public_url : `/api/deal-artifacts/${encodeURIComponent(row.id)}/file`,
    metadata: safeJson(row.metadata, {}), error: row.error || null,
    createdAt: row.created_at, updatedAt: row.updated_at,
  }));
}

async function jobsFor(env, dealId) {
  await ensureDealProductionSchema(env);
  const { results } = await env.DB.prepare(`SELECT id,kind,status,progress_stage,progress_label,progress_percent,error,updated_at
    FROM deal_production_jobs WHERE deal_id=? ORDER BY updated_at DESC`).bind(dealId).all();
  return (results || []).map(row => ({
    id: row.id, kind: row.kind, status: row.status,
    stage: row.progress_stage || null, label: row.progress_label || null,
    percent: Math.max(0, Math.min(100, Number(row.progress_percent || 0))),
    error: row.error || null, updatedAt: row.updated_at || null,
  }));
}

function summarizeArtifacts(items) {
  const status = kind => items.find(item => item.kind === kind)?.status || 'missing';
  const invoices = items.filter(item => item.kind === 'invoice');
  const invoiceStatus = !invoices.length ? 'missing'
    : invoices.every(item => item.status === 'ready') ? 'ready'
    : invoices.some(item => item.status === 'error') ? 'error'
    : invoices.some(item => item.status === 'building') ? 'building' : 'queued';
  return {
    demo: status('demo'), kp: status('kp'),
    invoiceStatus,
    invoicesReady: invoices.filter(item => item.status === 'ready').length,
    invoicesTotal: invoices.length,
    hasErrors: items.some(item => item.status === 'error'),
  };
}

function summarizeProduction(items, transcript, jobs = []) {
  const active = jobs.find(job => job.status === 'building') || jobs.find(job => job.status === 'queued') || null;
  return {
    ...summarizeArtifacts(items),
    transcript: transcript ? 'ready' : 'missing',
    transcriptSource: transcript?.source || null,
    transcriptUpdatedAt: transcript?.created_at || null,
    activeKind: active?.kind || null,
    activeStatus: active?.status || null,
    activeStage: active?.stage || null,
    activeLabel: active?.label || null,
    activePercent: active ? active.percent : null,
  };
}

export async function updateDealProductionSummary(env, dealId) {
  const [items, transcript, jobs] = await Promise.all([artifactsFor(env, dealId), latestTranscript(env, dealId), jobsFor(env, dealId)]);
  const summary = summarizeProduction(items, transcript, jobs);
  const deal = await env.DB.prepare('SELECT custom_fields FROM deals WHERE id=?').bind(dealId).first();
  if (!deal) return summary;
  const cf = safeJson(deal.custom_fields, {});
  const demo = items.find(item => item.kind === 'demo' && item.status === 'ready');
  const kp = items.find(item => item.kind === 'kp' && item.status === 'ready');
  cf._production = { ...summary, updatedAt: nowIso() };
  if (demo?.url) { cf.demoUrl = demo.url; cf.demoStatus = 'ready'; }
  else if (summary.demo !== 'missing') cf.demoStatus = summary.demo;
  if (kp?.url) { cf.kpUrl = kp.url; cf.kpStatus = 'ready'; }
  else if (summary.kp !== 'missing') cf.kpStatus = summary.kp;
  await env.DB.prepare('UPDATE deals SET custom_fields=?,bitrix_date_modify=? WHERE id=?')
    .bind(JSON.stringify(cf), nowIso(), dealId).run();
  return summary;
}

// Backfills the kanban badge when a Zoom transcript arrived asynchronously.
// Rows already marked ready are skipped, so the minute cron becomes a cheap no-op.
export async function syncTranscriptProductionSummaries(env, options = {}) {
  await ensureDealProductionSchema(env);
  const limit = Math.max(1, Math.min(Number(options.limit || 50), 100));
  const { results } = await env.DB.prepare(`SELECT sources.deal_id FROM (
      SELECT DISTINCT deal_id FROM zoom_files
      WHERE deal_id IS NOT NULL AND status='stored' AND r2_key IS NOT NULL
        AND (LOWER(kind) LIKE '%transcript%' OR UPPER(extension) IN ('VTT','TXT'))
      UNION
      SELECT DISTINCT deal_id FROM deal_qual_recordings
      WHERE deal_id IS NOT NULL AND r2_key IS NOT NULL
        AND (LOWER(COALESCE(kind,''))='transcript' OR LOWER(COALESCE(content_type,'')) LIKE 'text/vtt%'
          OR LOWER(name) LIKE '%.vtt' OR LOWER(name) LIKE '%.txt')
    ) sources JOIN deals d ON d.id=sources.deal_id
    WHERE COALESCE(json_extract(d.custom_fields,'$._production.transcript'),'missing')!='ready'
    LIMIT ?`).bind(limit).all();
  for (const row of results || []) await updateDealProductionSummary(env, row.deal_id);
  return { updated: results?.length || 0 };
}

export async function dealProductionState(env, dealId) {
  const [transcript, requisites, items, jobs] = await Promise.all([
    latestTranscript(env, dealId), requisitesState(env, dealId), artifactsFor(env, dealId), jobsFor(env, dealId),
  ]);
  const kp = items.find(item => item.kind === 'kp' && item.status === 'ready');
  const plan = Array.isArray(kp?.metadata?.paymentPlan) ? kp.metadata.paymentPlan : [];
  const summary = summarizeProduction(items, transcript, jobs);
  return {
    transcript: {
      ready: Boolean(transcript), name: transcript?.name || null, createdAt: transcript?.created_at || null,
      source: transcript?.source || null, size: transcript?.size == null ? null : Number(transcript.size),
    },
    requisites: { ready: requisites.ready, files: requisites.files, updatedAt: requisites.updatedAt },
    commercial: { ready: Boolean(kp && plan.length), paymentCount: plan.length },
    activity: summary.activeStatus ? {
      kind: summary.activeKind, status: summary.activeStatus, stage: summary.activeStage,
      label: summary.activeLabel, percent: summary.activePercent,
    } : null,
    summary, items,
  };
}

async function productionRecipients(env, dealId) {
  const deal = await env.DB.prepare('SELECT responsible_uid,created_by_uid FROM deals WHERE id=?').bind(dealId).first();
  return [...new Set([deal?.responsible_uid, deal?.created_by_uid].filter(Boolean))];
}

async function notifyMany(env, deps, dealId, opts) {
  if (!deps?.notify) return;
  const recipients = await productionRecipients(env, dealId);
  for (const recipient of recipients) {
    await deps.notify(env, {
      ...opts, uid: recipient,
      link: `/team.html#deal/${encodeURIComponent(dealId.replace(/^deal_/, ''))}`,
      entityType: 'deal', entityId: dealId,
    });
  }
}

async function dealSnapshot(env, dealId) {
  const deal = await env.DB.prepare(`SELECT id,title,opportunity,currency,comments,custom_fields,pipeline_id,stage_id,
    responsible_uid,created_by_uid FROM deals WHERE id=?`).bind(dealId).first();
  if (!deal) throw new Error('Сделка не найдена');
  let qualification = {};
  try {
    const q = await env.DB.prepare('SELECT data FROM deal_qualification WHERE deal_id=?').bind(dealId).first();
    qualification = safeJson(q?.data, {});
  } catch {}
  return { ...deal, customFields: safeJson(deal.custom_fields, {}), qualification };
}

async function upsertArtifact(env, row) {
  const at = nowIso();
  await env.DB.prepare(`INSERT INTO deal_artifacts
    (id,deal_id,job_id,kind,title,status,sequence,amount,currency,file_name,mime,r2_key,public_token,public_url,metadata,error,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(deal_id,kind,sequence) DO UPDATE SET
      job_id=excluded.job_id,title=excluded.title,status=excluded.status,amount=excluded.amount,currency=excluded.currency,
      file_name=COALESCE(excluded.file_name,deal_artifacts.file_name),mime=COALESCE(excluded.mime,deal_artifacts.mime),
      public_token=COALESCE(deal_artifacts.public_token,excluded.public_token),
      public_url=COALESCE(deal_artifacts.public_url,excluded.public_url),metadata=excluded.metadata,error=NULL,updated_at=excluded.updated_at`)
    .bind(row.id, row.dealId, row.jobId, row.kind, row.title, row.status || 'queued', row.sequence || 0,
      row.amount ?? null, row.currency || null, row.fileName || null, row.mime || null, row.r2Key || null,
      row.publicToken || null, row.publicUrl || null, JSON.stringify(row.metadata || {}), null, at, at).run();
}

export async function enqueueDemoAndKp(env, dealId, actorUid, pipelineId, stageId, deps = {}) {
  await ensureDealProductionSchema(env);
  const transcript = await latestTranscript(env, dealId);
  if (!transcript) throw Object.assign(new Error('Добавьте транскрипцию встречи в карточку сделки.'), { code: 'TRANSCRIPT_REQUIRED' });
  const snapshot = await dealSnapshot(env, dealId);
  const existing = await env.DB.prepare("SELECT * FROM deal_production_jobs WHERE deal_id=? AND kind='demo_kp'").bind(dealId).first();
  if (existing && ['queued', 'building', 'ready'].includes(existing.status)) {
    return { jobId: existing.id, status: existing.status, duplicate: true };
  }
  const jobId = existing?.id || uid('prod');
  const payload = {
    pipelineId, buildStageId: stageId,
    transcript: { id: transcript.id, source: transcript.source, r2Key: transcript.r2_key, name: transcript.name || 'Транскрипция встречи' },
    deal: { id: dealId, title: snapshot.title, opportunity: snapshot.opportunity, currency: snapshot.currency,
      comments: snapshot.comments, customFields: snapshot.customFields, qualification: snapshot.qualification },
  };
  const at = nowIso();
  await env.DB.prepare(`INSERT INTO deal_production_jobs
    (id,deal_id,kind,status,payload,attempt,lease_until,next_attempt_at,error,created_by,created_at,updated_at,progress_stage,progress_label,progress_percent)
    VALUES (?,?,'demo_kp','queued',?,0,NULL,NULL,NULL,?,?,?,'queued','В очереди на создание демо и КП',5)
    ON CONFLICT(deal_id,kind) DO UPDATE SET status='queued',payload=excluded.payload,attempt=0,
      lease_until=NULL,next_attempt_at=NULL,error=NULL,created_by=excluded.created_by,updated_at=excluded.updated_at,
      progress_stage='queued',progress_label='В очереди на создание демо и КП',progress_percent=5`)
    .bind(jobId, dealId, JSON.stringify(payload), actorUid || '', at, at).run();
  const token = crypto.randomUUID().replace(/-/g, '');
  await upsertArtifact(env, { id: uid('art'), dealId, jobId, kind: 'demo', title: 'Интерактивное демо', status: 'queued',
    sequence: 0, mime: 'text/html; charset=utf-8', publicToken: token, publicUrl: `${PUBLIC_ORIGIN}/demo-artifact/${token}` });
  await upsertArtifact(env, { id: uid('art'), dealId, jobId, kind: 'kp', title: 'Коммерческое предложение', status: 'queued',
    sequence: 0, mime: 'application/pdf', fileName: `Pllato_KP_${fileSlug(snapshot.title)}.pdf` });
  await updateDealProductionSummary(env, dealId);
  await notifyMany(env, deps, dealId, {
    id: `production_demo_kp_queued:${dealId}`, type: 'deal_documents', icon: '✨',
    title: 'Демо и КП поставлены в производство', body: snapshot.title || 'Сделка', actorUid,
  });
  return { jobId, status: 'queued', duplicate: false };
}

export async function enqueueInvoicePack(env, dealId, actorUid, pipelineId, stageId, deps = {}) {
  await ensureDealProductionSchema(env);
  const [snapshot, req, items] = await Promise.all([dealSnapshot(env, dealId), requisitesState(env, dealId), artifactsFor(env, dealId)]);
  if (!req.ready) throw Object.assign(new Error('Заполните реквизиты заказчика или прикрепите файл с реквизитами.'), { code: 'REQUISITES_REQUIRED' });
  const kp = items.find(item => item.kind === 'kp' && item.status === 'ready');
  const plan = Array.isArray(kp?.metadata?.paymentPlan) ? kp.metadata.paymentPlan : [];
  if (!kp || !plan.length) throw Object.assign(new Error('Сначала дождитесь готового КП с подтверждённым графиком оплат.'), { code: 'KP_REQUIRED' });
  const existing = await env.DB.prepare("SELECT * FROM deal_production_jobs WHERE deal_id=? AND kind='invoice_pack'").bind(dealId).first();
  if (existing && ['queued', 'building', 'ready'].includes(existing.status)) {
    return { jobId: existing.id, status: existing.status, duplicate: true, count: plan.length };
  }
  const jobId = existing?.id || uid('prod');
  const payload = { pipelineId, buildStageId: stageId, customerRequisites: req.text, paymentPlan: plan.slice(0, 12),
    commercial: kp.metadata.commercial || {}, deal: { id: dealId, title: snapshot.title, customFields: snapshot.customFields } };
  const at = nowIso();
  await env.DB.prepare(`INSERT INTO deal_production_jobs
    (id,deal_id,kind,status,payload,attempt,lease_until,next_attempt_at,error,created_by,created_at,updated_at,progress_stage,progress_label,progress_percent)
    VALUES (?,?,'invoice_pack','queued',?,0,NULL,NULL,NULL,?,?,?,'queued','В очереди на создание счетов',5)
    ON CONFLICT(deal_id,kind) DO UPDATE SET status='queued',payload=excluded.payload,attempt=0,
      lease_until=NULL,next_attempt_at=NULL,error=NULL,created_by=excluded.created_by,updated_at=excluded.updated_at,
      progress_stage='queued',progress_label='В очереди на создание счетов',progress_percent=5`)
    .bind(jobId, dealId, JSON.stringify(payload), actorUid || '', at, at).run();
  for (let i = 0; i < plan.length && i < 12; i++) {
    const p = plan[i];
    await upsertArtifact(env, { id: uid('art'), dealId, jobId, kind: 'invoice',
      title: `Счёт ${i + 1}/${plan.length}: ${p.label}`, status: 'queued', sequence: i + 1,
      amount: p.amount, currency: p.currency || kp.metadata?.commercial?.currency || 'KZT', mime: 'application/pdf',
      fileName: `Pllato_Schet_${fileSlug(snapshot.title)}_${i + 1}.pdf`, metadata: { payment: p } });
  }
  await updateDealProductionSummary(env, dealId);
  await notifyMany(env, deps, dealId, {
    id: `production_invoices_queued:${dealId}`, type: 'deal_documents', icon: '🧾',
    title: `Создаём комплект счетов: ${plan.length}`, body: snapshot.title || 'Сделка', actorUid,
  });
  return { jobId, status: 'queued', duplicate: false, count: plan.length };
}

function fileSlug(value) {
  return cleanText(value).replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_+|_+$/g, '').slice(0, 70) || 'Client';
}

async function transcriptText(env, ref) {
  if (!ref?.r2Key || !env.FILES) throw new Error('Файл транскрипции недоступен');
  const object = await env.FILES.get(ref.r2Key);
  if (!object) throw new Error('Транскрипция отсутствует в хранилище');
  if (object.size > 8 * 1024 * 1024) throw new Error('Транскрипция слишком большая');
  const raw = await object.text();
  return raw
    .replace(/^WEBVTT[^\n]*\n/i, '')
    .replace(/^\d{2}:\d{2}:\d{2}[.,]\d{3}\s+-->.*$/gm, '')
    .replace(/^\d+$/gm, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .slice(0, MAX_TRANSCRIPT_CHARS).trim();
}

const stringSchema = { type: 'string' };
const productionSchema = {
  type: 'object', additionalProperties: false,
  required: ['meeting_summary', 'client', 'demo', 'kp', 'commercial'],
  properties: {
    meeting_summary: { type: 'string' },
    client: { type: 'object', additionalProperties: false, required: ['name', 'industry', 'cities', 'team', 'decision_maker'], properties: {
      name: stringSchema, industry: stringSchema, cities: stringSchema, team: stringSchema, decision_maker: stringSchema,
    }},
    demo: { type: 'object', additionalProperties: false,
      required: ['product_name', 'tagline', 'primary_color', 'accent_color', 'roles', 'screens', 'wow_scenarios'], properties: {
        product_name: stringSchema, tagline: stringSchema, primary_color: stringSchema, accent_color: stringSchema,
        roles: { type: 'array', items: stringSchema },
        wow_scenarios: { type: 'array', items: stringSchema },
        screens: { type: 'array', minItems: 8, maxItems: 16, items: { type: 'object', additionalProperties: false,
          required: ['id', 'label', 'icon', 'headline', 'subheadline', 'layout', 'kpis', 'lanes', 'table_columns', 'table_rows', 'insights', 'actions'],
          properties: {
            id: stringSchema, label: stringSchema, icon: stringSchema, headline: stringSchema, subheadline: stringSchema,
            layout: { type: 'string', enum: ['dashboard', 'kanban', 'table', 'analytics', 'timeline', 'calendar', 'warehouse', 'finance'] },
            kpis: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['label', 'value', 'trend'], properties: { label: stringSchema, value: stringSchema, trend: stringSchema } } },
            lanes: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['title', 'cards'], properties: {
              title: stringSchema, cards: { type: 'array', items: { type: 'object', additionalProperties: false,
                required: ['title', 'meta', 'status', 'value'], properties: { title: stringSchema, meta: stringSchema, status: stringSchema, value: stringSchema } } },
            } } },
            table_columns: { type: 'array', items: stringSchema },
            table_rows: { type: 'array', items: { type: 'array', items: stringSchema } },
            insights: { type: 'array', items: stringSchema }, actions: { type: 'array', items: stringSchema },
          },
        } },
      },
    },
    kp: { type: 'object', additionalProperties: false,
      required: ['title', 'executive_summary', 'goals', 'pain_points', 'solution_modules', 'integrations', 'deliverables', 'phases', 'acceptance', 'warranty', 'assumptions', 'exclusions'], properties: {
        title: stringSchema, executive_summary: stringSchema,
        goals: { type: 'array', items: stringSchema }, pain_points: { type: 'array', items: stringSchema },
        solution_modules: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['name', 'outcome', 'features'], properties: {
          name: stringSchema, outcome: stringSchema, features: { type: 'array', items: stringSchema },
        } } },
        integrations: { type: 'array', items: stringSchema }, deliverables: { type: 'array', items: stringSchema },
        phases: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['name', 'duration', 'result', 'acceptance'], properties: {
          name: stringSchema, duration: stringSchema, result: stringSchema, acceptance: stringSchema,
        } } },
        acceptance: { type: 'array', items: stringSchema }, warranty: stringSchema,
        assumptions: { type: 'array', items: stringSchema }, exclusions: { type: 'array', items: stringSchema },
      },
    },
    commercial: { type: 'object', additionalProperties: false,
      required: ['complete', 'total_amount', 'currency', 'timeline', 'issues', 'payment_plan'], properties: {
        complete: { type: 'boolean' }, total_amount: { type: 'number' }, currency: { type: 'string', enum: ['KZT', 'USD', 'EUR'] },
        timeline: stringSchema, issues: { type: 'array', items: stringSchema },
        payment_plan: { type: 'array', minItems: 1, maxItems: 12, items: { type: 'object', additionalProperties: false,
          required: ['label', 'percent', 'amount', 'currency', 'trigger'], properties: {
            label: stringSchema, percent: { type: 'number' }, amount: { type: 'number' },
            currency: { type: 'string', enum: ['KZT', 'USD', 'EUR'] }, trigger: stringSchema,
          } } },
      },
    },
  },
};

function productionPrompt(payload, transcript, rules) {
  return `Ты — ведущий бизнес-аналитик и product designer студии Pllato. По транскрипции встречи создай единый production blueprint для глубокой кликабельной демо-системы и коммерческого предложения.

СТАНДАРТ PLLATO:
- демо выглядит как готовый продукт клиента, а не как презентация; простая читаемая навигация, 8–16 полноценных разделов, правдоподобные данные, канбан/таблицы/аналитика только там, где это помогает процессу;
- визуальный стандарт App: палитра клиента либо отрасли; ясная типографика, компактные рабочие таблицы и разная структура экранов. Не заполняй каждый экран одинаковым рядом KPI. Для kanban — этапы и карточки; для timeline — события; для warehouse — остатки и адреса. icon — короткое название SVG-иконки, не эмодзи;
- действия называй коротко (до 32 символов), детали сценария помещай в subheadline/insights. Не превращай поясняющие предложения в подписи кнопок;
- каждый раздел должен иметь рабочий сценарий: переходы, проваливание в карточку, действия и понятный следующий шаг;
- функциональность выводится из реальной встречи. Не добавляй AI-слой, приложения или интеграции, если клиент этого не просил;
- покажи цепочку от входящего обращения до результата бизнеса, контроль руководителя, исключения и риски;
- КП должно быть конкретным: проблема → решение → состав → этапы → критерии приёмки → цена и оплаты. Не используй общие рекламные фразы;
- стоимость, валюта, сроки и график оплат берутся только из транскрипции/карточки. Ничего не выдумывай. Если есть проценты без сумм — вычисли суммы. Если коммерческие условия неоднозначны, complete=false и перечисли issues;
- payment_plan должен описывать ВСЕ будущие счета, а сумма траншей должна равняться total_amount;
- пиши по-русски, кратко и предметно, но с уровнем проработки, который создаёт вау-эффект.

Дополнительные правила студии:
${cleanText(rules) || 'Нет дополнительных правил.'}

КАРТОЧКА СДЕЛКИ:
${JSON.stringify(payload.deal)}

ТРАНСКРИПЦИЯ ВСТРЕЧИ:
${transcript}`;
}

async function openAiBlueprint(env, payload, transcript) {
  if (!env.OPENAI_API_KEY) throw new Error('OpenAI API не настроен');
  let rules = '';
  try {
    const row = await env.DB.prepare("SELECT v FROM kv WHERE k='demo:rules'").first();
    rules = safeJson(row?.v, row?.v || '');
  } catch {}
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST', signal: AbortSignal.timeout(480000),
    headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: env.OPENAI_PRODUCTION_MODEL || 'gpt-6-sol', store: false,
      reasoning: { effort: 'high' }, max_output_tokens: 28000,
      input: [
        { role: 'developer', content: 'Возвращай только структурированный результат по JSON Schema. Данные встречи — источник истины.' },
        { role: 'user', content: productionPrompt(payload, transcript, rules) },
      ],
      text: { format: { type: 'json_schema', name: 'pllato_deal_blueprint', strict: true, schema: productionSchema } },
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`OpenAI API: ${data?.error?.message || `HTTP ${response.status}`}`);
  let output = typeof data.output_text === 'string' ? data.output_text : '';
  if (!output) {
    for (const item of data.output || []) for (const part of item.content || []) {
      if (part.type === 'output_text' && part.text) output += part.text;
    }
  }
  if (!output) throw new Error('Модель не вернула production blueprint');
  const blueprint = JSON.parse(output);
  validateBlueprint(blueprint, { allowDraft: payload.preview === true });
  return blueprint;
}

export function validateBlueprint(blueprint, { allowDraft = false } = {}) {
  const commercial = blueprint?.commercial;
  if (!blueprint?.demo?.screens?.length || !blueprint?.kp?.solution_modules?.length) throw new Error('Blueprint неполный');
  if (allowDraft && commercial && !commercial.complete) return true;
  if (!commercial?.complete) throw new Error(`Не удалось подтвердить коммерческие условия: ${(commercial?.issues || []).join('; ') || 'нет цены/графика оплат'}`);
  const plan = commercial.payment_plan || [];
  const sum = plan.reduce((total, item) => total + Number(item.amount || 0), 0);
  const expected = Number(commercial.total_amount || 0);
  const tolerance = Math.max(1, expected * 0.005);
  if (!expected || !plan.length || Math.abs(sum - expected) > tolerance) {
    throw new Error(`График оплат не сходится: ${sum} вместо ${expected}`);
  }
  return true;
}

function demoIcon(name) {
  const paths = {
    dashboard: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
    kanban: 'M4 4h4v16H4z M10 4h4v11h-4z M16 4h4v14h-4z',
    table: 'M3 4h18v16H3z M3 9h18 M3 14h18 M9 4v16',
    analytics: 'M4 3v17h17 M8 15v-4 M13 15V7 M18 15V4',
    warehouse: 'M3 9l9-6 9 6v12H3z M8 21V11h8v10 M8 15h8',
    finance: 'M3 5h18v14H3z M3 9h18 M7 14h4',
    timeline: 'M6 3v18 M3 7h6 M3 16h6 M12 7h8 M12 16h8',
    calendar: 'M4 5h16v16H4z M8 3v4 M16 3v4 M4 10h16',
  };
  return `<svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="${paths[name] || paths.table}"/></svg>`;
}

function renderKpis(kpis) {
  return (kpis || []).slice(0, 6).map(k => `<div class="kpi"><span>${esc(k.label)}</span><b>${esc(k.value)}</b><small>${esc(k.trend)}</small></div>`).join('');
}

export function renderDemoHtml(blueprint) {
  const demo = blueprint.demo;
  const primary = allowedColor(demo.primary_color, '#2563eb');
  const accent = allowedColor(demo.accent_color, '#16a34a');
  const nav = demo.screens.map((screen, i) => `<button class="nav ${i === 0 ? 'active' : ''}" data-view="${esc(screen.id)}">${demoIcon(screen.layout)}<span>${esc(screen.label)}</span></button>`).join('');
  const screens = demo.screens.map((screen, i) => {
    const lanes = (screen.lanes || []).map(lane => `<div class="lane"><div class="lane-h"><b>${esc(lane.title)}</b><span>${lane.cards.length}</span></div>${lane.cards.map(card => `<button class="card drill" data-title="${esc(card.title)}" data-detail="${esc(`${card.meta}\nСтатус: ${card.status}\n${card.value}`)}"><b>${esc(card.title)}</b><small>${esc(card.meta)}</small><div><em>${esc(card.status)}</em><strong>${esc(card.value)}</strong></div></button>`).join('')}</div>`).join('');
    const tableHead = (screen.table_columns || []).map(x => `<th>${esc(x)}</th>`).join('');
    const rows = (screen.table_rows || []).map(row => `<tr class="drill" data-title="${esc(row[0] || screen.label)}" data-detail="${esc(row.join(' · '))}">${row.map(x => `<td>${esc(x)}</td>`).join('')}</tr>`).join('');
    const table = tableHead && rows ? `<div class="table-wrap"><table><thead><tr>${tableHead}</tr></thead><tbody>${rows}</tbody></table></div>` : '';
    const insights = (screen.insights || []).map((x, n) => `<button class="insight drill" data-title="Сигнал ${n + 1}" data-detail="${esc(x)}"><span>${n === 0 ? '!' : '✓'}</span>${esc(x)}</button>`).join('');
    const actions = (screen.actions || []).map(x => `<button class="action" data-action="${esc(x)}">${esc(x)}</button>`).join('');
    return `<section class="screen layout-${esc(screen.layout)} ${i === 0 ? 'active' : ''}" data-screen="${esc(screen.id)}">
      <div class="screen-head"><div><h1>${esc(screen.headline)}</h1><p>${esc(screen.subheadline)}</p></div><div class="actions">${actions}</div></div>
      <div class="kpis">${renderKpis(screen.kpis)}</div>
      ${lanes ? `<div class="board ${screen.layout === 'kanban' ? 'kanban' : ''}">${lanes}</div>` : ''}${table}
      ${insights ? `<div class="insights"><h3>Требует внимания</h3>${insights}</div>` : ''}
    </section>`;
  }).join('');
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${esc(demo.product_name)}</title>
<style>:root{--p:${primary};--a:${accent};--bg:#f4f7fb;--ink:#172033;--muted:#6b7280;--line:#e5e9f0}*{box-sizing:border-box}body{margin:0;font-family:"Golos Text","Segoe UI",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:var(--bg);color:var(--ink)}button,input{font:inherit}.app{min-height:100vh;display:grid;grid-template-columns:248px 1fr}.side{background:#fff;border-right:1px solid var(--line);padding:22px 14px;position:sticky;top:0;height:100vh}.brand{padding:4px 10px 20px;border-bottom:1px solid var(--line);margin-bottom:14px}.brand b{font-size:18px;display:block}.brand small{color:var(--muted)}.nav{width:100%;border:0;background:transparent;border-radius:9px;padding:10px 11px;margin:2px 0;text-align:left;color:#4b5563;cursor:pointer;display:flex;gap:9px;align-items:center}.nav:hover,.nav.active{background:color-mix(in srgb,var(--p) 10%,white);color:var(--p);font-weight:700}.side-foot{position:absolute;bottom:18px;left:22px;color:var(--muted);font-size:11px}.main{min-width:0}.top{height:66px;background:#fff;border-bottom:1px solid var(--line);display:flex;align-items:center;padding:0 28px;gap:16px;position:sticky;top:0;z-index:5}.search{flex:1;max-width:520px;border:1px solid var(--line);border-radius:10px;padding:10px 13px;background:#f8fafc}.live{margin-left:auto;color:var(--a);font-size:12px;font-weight:800}.screen{display:none;padding:28px}.screen.active{display:block}.screen-head{display:flex;gap:18px;justify-content:space-between;align-items:flex-start;margin-bottom:22px}.screen h1{font-size:27px;margin:0 0 5px}.screen p{margin:0;color:var(--muted)}.actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.action{border:0;background:var(--p);color:#fff;padding:9px 13px;border-radius:9px;font-weight:700;cursor:pointer;box-shadow:0 4px 14px color-mix(in srgb,var(--p) 25%,transparent)}.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:18px}.kpi{background:#fff;border:1px solid var(--line);border-radius:12px;padding:16px}.kpi span,.kpi small{display:block;color:var(--muted);font-size:12px}.kpi b{font-size:24px;display:block;margin:7px 0 3px}.kpi small{color:var(--a)}.board{display:grid;grid-template-columns:repeat(auto-fit,minmax(235px,1fr));gap:12px;margin-bottom:18px}.board.kanban{display:flex;align-items:flex-start;overflow:auto;padding-bottom:8px}.board.kanban .lane{min-width:270px;flex:1}.lane{background:#edf1f6;border-radius:12px;padding:10px}.lane-h{display:flex;justify-content:space-between;padding:5px 4px 10px}.lane-h span{background:#fff;border-radius:99px;padding:2px 8px;color:var(--muted);font-size:11px}.card{border:1px solid var(--line);background:#fff;border-radius:10px;padding:12px;width:100%;text-align:left;margin-bottom:8px;cursor:pointer;box-shadow:0 2px 5px #17203308}.card:hover{border-color:var(--p);transform:translateY(-1px)}.card b,.card small{display:block}.card small{color:var(--muted);margin:5px 0 12px}.card div{display:flex;justify-content:space-between;gap:8px;align-items:center}.card em{font-style:normal;background:#eefbf3;color:var(--a);padding:3px 7px;border-radius:99px;font-size:11px}.card strong{font-size:12px}.table-wrap{background:#fff;border:1px solid var(--line);border-radius:12px;overflow:auto;margin-bottom:18px}table{width:100%;border-collapse:collapse;min-width:640px}th,td{padding:12px 14px;border-bottom:1px solid var(--line);text-align:left;font-size:13px}th{font-size:11px;text-transform:uppercase;color:var(--muted);background:#fafbfc}tbody tr{cursor:pointer}tbody tr:hover{background:#f8fbff}.insights{background:#fff;border:1px solid var(--line);border-radius:12px;padding:16px}.insights h3{margin:0 0 10px}.insight{display:flex;width:100%;gap:9px;align-items:center;border:0;border-top:1px solid var(--line);background:#fff;padding:11px 2px;text-align:left;cursor:pointer}.insight span{width:22px;height:22px;border-radius:50%;background:#fff3e5;color:#d97706;display:grid;place-items:center;font-weight:800}.drawer{position:fixed;inset:0;background:#11182755;display:none;justify-content:flex-end;z-index:20}.drawer.open{display:flex}.drawer-box{width:min(460px,94vw);background:#fff;height:100%;padding:26px;box-shadow:-12px 0 32px #11182722}.drawer-close{float:right;border:0;background:#f1f5f9;border-radius:8px;width:34px;height:34px;cursor:pointer}.drawer h2{margin:46px 0 10px}.drawer pre{white-space:pre-wrap;font:14px/1.6 inherit;color:#4b5563}.drawer-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:20px}.drawer-grid div{background:#f8fafc;padding:12px;border-radius:9px}.toast{position:fixed;right:22px;bottom:22px;background:#172033;color:#fff;padding:13px 17px;border-radius:10px;opacity:0;transform:translateY(12px);transition:.2s;z-index:30}.toast.show{opacity:1;transform:none}@media(max-width:780px){.app{grid-template-columns:1fr}.side{position:static;height:auto;border-right:0;border-bottom:1px solid var(--line);display:flex;overflow:auto;padding:10px}.brand,.side-foot{display:none}.nav{width:auto;white-space:nowrap}.top{padding:0 14px}.screen{padding:18px 14px}.screen-head{display:block}.actions{justify-content:flex-start;margin-top:14px}.kpis{grid-template-columns:1fr 1fr}}/* App standard: readable workspaces, bounded navigation and distinct screen layouts. */
body{font-size:14px;font-variant-numeric:tabular-nums}.side{background:#101b2c;color:#fff;display:flex;flex-direction:column;padding:24px 16px}.brand{border-color:#ffffff20;padding-bottom:22px}.brand b{font-size:19px;line-height:1.3}.brand small{display:block;margin-top:10px;color:#aebed2;line-height:1.5}.nav-scroll{min-height:0;overflow:auto;flex:1}.nav{color:#b6c4d6;border-radius:4px;font-size:13px;line-height:1.4;padding:11px 10px}.nav svg{flex:0 0 20px}.nav:hover,.nav.active{background:#ffffff12;color:#fff;box-shadow:inset 3px 0 var(--a)}.side-foot{position:static;padding:18px 8px 0;font-size:10px;color:#aebed2}.screen{max-width:1560px;margin:auto;padding:32px}.screen-head{display:block;border-bottom:1px solid var(--line);padding-bottom:20px}.screen h1{font-size:28px;letter-spacing:-.025em}.screen p{max-width:780px;line-height:1.55}.actions{justify-content:flex-start;margin-top:18px}.action{font-size:13px;padding:10px 14px;border-radius:4px;box-shadow:none;max-width:340px;text-align:left;line-height:1.4}.action:not(:first-child){background:#fff;border:1px solid var(--line);color:var(--ink)}.kpi{border-radius:0;border:0;border-left:3px solid var(--a);background:transparent;padding:4px 18px}.kpis{padding:8px 0 20px;border-bottom:1px solid var(--line);gap:0}.kpi b{font-size:30px}.table-wrap{border-radius:4px}th{font-size:10px;letter-spacing:.06em}td{padding:15px 14px}.lane,.card{border-radius:5px;box-shadow:none}.card em{background:none;padding:0;border-radius:0}.insights{border-radius:4px}.layout-table .kpis,.layout-warehouse .kpis,.layout-finance .kpis{display:flex;flex-wrap:wrap}.layout-table .kpi,.layout-warehouse .kpi,.layout-finance .kpi{flex:1;min-width:130px}.layout-timeline .board{display:block;border-left:2px solid var(--a);padding-left:22px}.layout-timeline .lane{margin-bottom:18px;background:transparent}.layout-calendar .board{grid-template-columns:repeat(auto-fit,minmax(170px,1fr))}.drawer-box{overflow:auto}.drawer pre{font:14px/1.7 "Segoe UI",sans-serif}.drawer label{display:block;margin:18px 0 8px}.drawer input,.drawer textarea{width:100%;padding:10px;border:1px solid var(--line);border-radius:4px;font:inherit}.drawer textarea{min-height:110px}.record-log{font-size:12px;line-height:1.7}.action-form[hidden]{display:none}@media(max-width:780px){.side{display:block;height:auto;padding:10px}.nav-scroll{display:flex;overflow:auto}.nav{flex:none;width:auto}.side-foot{display:none}.screen{padding:20px 14px}.screen h1{font-size:23px}.kpi b{font-size:23px}.kpi{padding:8px}.top{position:static}.actions .action{max-width:100%}}
</style></head><body>
<div class="app"><aside class="side"><div class="brand"><b>${esc(demo.product_name)}</b><small>${esc(demo.tagline)}</small></div><nav class="nav-scroll" aria-label="Разделы">${nav}</nav><div class="side-foot">Демонстрационные данные · Pllato</div></aside><main class="main"><header class="top"><input id="search" class="search" placeholder="Найти клиента, заказ, документ…"><span class="live">● LIVE ДЕМО</span></header>${screens}</main></div>
<div id="drawer" class="drawer"><div class="drawer-box"><button class="drawer-close">×</button><h2 id="drawer-title"></h2><pre id="drawer-detail"></pre><form id="action-form" class="action-form" hidden><label for="action-name">Название</label><input id="action-name" required maxlength="180"><label for="action-note">Комментарий / следующий шаг</label><textarea id="action-note" required maxlength="1000"></textarea><button class="action" type="submit">Сохранить в демо</button><p>Изменения действуют в этой демонстрации.</p></form><div id="record-log" class="record-log"></div><div class="drawer-grid"><div><small>Ответственный</small><br><b>${esc(demo.roles?.[0] || 'Менеджер')}</b></div><div><small>Следующий шаг</small><br><b>Сегодня</b></div></div></div></div><div id="toast" class="toast"></div>
<script>(()=>{const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];qa('.nav').forEach(b=>b.onclick=()=>{qa('.nav,.screen').forEach(x=>x.classList.remove('active'));b.classList.add('active');q('[data-screen="'+CSS.escape(b.dataset.view)+'"]').classList.add('active')});qa('.drill').forEach(x=>x.onclick=()=>{q('#action-form').hidden=true;q('#record-log').textContent='';q('#drawer-title').textContent=x.dataset.title||'Карточка';q('#drawer-detail').textContent=x.dataset.detail||'Подробности объекта';q('#drawer').classList.add('open')});q('.drawer-close').onclick=()=>q('#drawer').classList.remove('open');q('#drawer').onclick=e=>{if(e.target===q('#drawer'))q('#drawer').classList.remove('open')};const toast=t=>{q('#toast').textContent=t;q('#toast').classList.add('show');setTimeout(()=>q('#toast').classList.remove('show'),2200)};let source=null;qa('[data-action]').forEach(b=>b.onclick=()=>{source=b.closest('.screen');q('#drawer-title').textContent=b.dataset.action;q('#drawer-detail').textContent=source.querySelector('h1').textContent;q('#action-form').hidden=false;q('#action-name').value='';q('#action-note').value='';q('#record-log').textContent='';q('#drawer').classList.add('open')});q('#action-form').onsubmit=e=>{e.preventDefault();const title=q('#action-name').value.trim(),note=q('#action-note').value.trim();if(!title||!note)return;let log=source.querySelector('.demo-changes');if(!log){log=document.createElement('div');log.className='insights demo-changes';source.append(log)}const record=document.createElement('p');record.textContent=title+' — '+note;log.prepend(record);q('#action-form').hidden=true;q('#record-log').textContent='Сохранено в демо: '+title;toast('Запись добавлена')};document.addEventListener('keydown',e=>{if(e.key==='Escape')q('#drawer').classList.remove('open')});q('#search').oninput=e=>{const s=e.target.value.toLowerCase();qa('.card,tbody tr').forEach(x=>x.style.display=x.textContent.toLowerCase().includes(s)?'':'none')};})();</script></body></html>`;
}

function list(items) { return `<ul>${(items || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul>`; }
function demoMiniature(blueprint) {
  const screens = blueprint.demo.screens.slice(0, 6);
  return `<div class="mock"><div class="mock-side"><b>${esc(blueprint.demo.product_name)}</b>${screens.map(x => `<span>${esc(x.label)}</span>`).join('')}</div><div class="mock-main"><div class="mock-top">Рабочий кабинет · LIVE</div><div class="mock-kpis">${(screens[0]?.kpis || []).slice(0, 4).map(x => `<div><small>${esc(x.label)}</small><b>${esc(x.value)}</b></div>`).join('')}</div><div class="mock-board">${(screens.find(x => x.lanes?.length)?.lanes || []).slice(0, 4).map(x => `<div><b>${esc(x.title)}</b>${x.cards.slice(0, 3).map(c => `<span>${esc(c.title)}</span>`).join('')}</div>`).join('')}</div></div></div>`;
}

export function renderKpHtml(blueprint, demoUrl) {
  const kp = blueprint.kp, c = blueprint.commercial, client = blueprint.client;
  const paymentRows = c.payment_plan.map((p, i) => `<tr><td>${i + 1}</td><td><b>${esc(p.label)}</b><br><small>${esc(p.trigger)}</small></td><td>${p.percent ? `${esc(p.percent)}%` : '—'}</td><td class="amount">${money(p.amount, p.currency)}</td></tr>`).join('');
  const phases = kp.phases.map((p, i) => `<div class="phase"><i>${i + 1}</i><div><h3>${esc(p.name)} <span>${esc(p.duration)}</span></h3><p>${esc(p.result)}</p><small>Приёмка: ${esc(p.acceptance)}</small></div></div>`).join('');
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><style>@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;font-family:Arial,"DejaVu Sans",sans-serif;color:#172033;font-size:10.5pt;line-height:1.45}.page{min-height:297mm;page-break-after:always;position:relative;padding:18mm 17mm 22mm}.page:last-child{page-break-after:auto}.eyebrow{font-size:9pt;text-transform:uppercase;letter-spacing:.16em;color:#b8895a;font-weight:700}.cover{background:linear-gradient(145deg,#0a1628,#13243a);color:#fff;padding:22mm 17mm}.cover .logo{font-size:18pt;font-weight:900}.cover h1{font-size:36pt;line-height:1.08;margin:48mm 0 7mm;max-width:150mm}.cover p{font-size:14pt;color:#cbd5e1;max-width:145mm}.cover .meta{position:absolute;left:17mm;right:17mm;bottom:22mm;border-top:1px solid #ffffff35;padding-top:6mm;display:flex;justify-content:space-between}.page h2{font-size:23pt;line-height:1.15;margin:4mm 0 7mm}.lead{font-size:13pt;color:#475569}.quote{border-left:4px solid #b8895a;background:#f7f6f1;padding:6mm;margin:8mm 0;font-size:13pt;font-weight:700}.cols{display:grid;grid-template-columns:1fr 1fr;gap:5mm}.box{border:1px solid #dbe3ef;border-radius:4mm;padding:5mm;background:#fff}.box h3{margin:0 0 3mm}.box ul,.module ul{padding-left:5mm;margin:2mm 0}.module{break-inside:avoid;border-top:2px solid #172033;padding:4mm 0;margin-bottom:3mm}.module i{font-style:normal;color:#b8895a;font-weight:800}.module h3{font-size:15pt;margin:1mm 0}.module p{color:#475569}.mock{height:105mm;border:1px solid #dbe3ef;border-radius:4mm;display:grid;grid-template-columns:36mm 1fr;overflow:hidden;background:#f4f7fb}.mock-side{background:#fff;padding:5mm 3mm;border-right:1px solid #dbe3ef}.mock-side b,.mock-side span{display:block}.mock-side span{font-size:7pt;padding:2mm 0;color:#475569}.mock-main{padding:4mm}.mock-top{background:#fff;border-radius:2mm;padding:3mm;font-weight:700}.mock-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:2mm;margin:3mm 0}.mock-kpis div{background:#fff;border-radius:2mm;padding:3mm}.mock-kpis small,.mock-kpis b{display:block}.mock-board{display:grid;grid-template-columns:repeat(4,1fr);gap:2mm}.mock-board>div{background:#e9eef5;border-radius:2mm;padding:2mm;font-size:7pt}.mock-board span{display:block;background:#fff;border-radius:1.5mm;padding:2mm;margin-top:2mm}.phase{display:grid;grid-template-columns:11mm 1fr;gap:4mm;margin-bottom:5mm;break-inside:avoid}.phase>i{width:10mm;height:10mm;border-radius:50%;background:#b8895a;color:#fff;font-style:normal;display:grid;place-items:center;font-weight:800}.phase h3{margin:0;font-size:14pt}.phase h3 span{float:right;color:#b8895a;font-size:10pt}.phase p{margin:2mm 0}.phase small{color:#64748b}table{width:100%;border-collapse:collapse;margin:6mm 0}th,td{padding:3.5mm;border-bottom:1px solid #dbe3ef;text-align:left}th{background:#f1f5f9;font-size:8pt;text-transform:uppercase}.amount{text-align:right;font-weight:800}.total{background:#172033;color:#fff;border-radius:4mm;padding:7mm;display:flex;justify-content:space-between;align-items:center;font-size:15pt}.total b{font-size:24pt}.cta{background:#f7f6f1;border:1px solid #d9c8b4;border-radius:4mm;padding:7mm;margin-top:8mm}.cta a{color:#b8895a;font-weight:800}.foot{position:absolute;left:17mm;right:17mm;bottom:6mm;border-top:1px solid #e2e8f0;padding-top:3mm;display:flex;justify-content:space-between;color:#64748b;font-size:8pt}</style></head><body>
<section class="page cover"><div class="logo">PLLATO</div>${!c.complete ? `<div style="margin-top:8mm;border:1px solid #d4a978;padding:4mm;color:#d4a978">ЧЕРНОВИК · коммерческие условия требуют подтверждения</div>` : ''}<div class="eyebrow" style="color:#d4a978">Коммерческое предложение</div><h1>${esc(kp.title)}</h1><p>${esc(kp.executive_summary)}</p><div class="meta"><span>${esc(client.name)} · ${esc(client.industry)}</span><span>${money(c.total_amount, c.currency)}<br>${esc(c.timeline)}</span></div></section>
<section class="page"><div class="eyebrow">01 · Контекст</div><h2>Что услышали на встрече</h2><p class="lead">${esc(blueprint.meeting_summary)}</p><div class="quote">${esc(kp.pain_points[0] || kp.executive_summary)}</div><div class="cols"><div class="box"><h3>Цели проекта</h3>${list(kp.goals)}</div><div class="box"><h3>Ключевые проблемы</h3>${list(kp.pain_points)}</div></div><div class="foot"><span>Pllato · ${esc(client.name)}</span><span>2</span></div></section>
<section class="page"><div class="eyebrow">02 · Видение продукта</div><h2>Рабочие процессы в одном пространстве</h2><p class="lead">Демо построено по процессам встречи: каждый пункт меню открывается, объекты имеют карточки и следующие действия.</p>${demoMiniature(blueprint)}<div class="cta">Интерактивное демо: <a href="${esc(demoUrl)}">${esc(demoUrl)}</a></div><div class="foot"><span>Pllato · ${esc(client.name)}</span><span>3</span></div></section>
<section class="page"><div class="eyebrow">03 · Состав решения</div><h2>Что входит в разработку</h2>${kp.solution_modules.map((m, i) => `<div class="module"><i>${String(i + 1).padStart(2, '0')}</i><h3>${esc(m.name)}</h3><p>${esc(m.outcome)}</p>${list(m.features)}</div>`).reduce((pages, item, i) => { if (i && i % 3 === 0) pages += '</section><section class="page"><div class="eyebrow">Состав решения · продолжение</div>'; return pages + item; }, '')}<div class="foot"><span>Pllato · ${esc(client.name)}</span><span>4</span></div></section>
<section class="page"><div class="eyebrow">04 · Реализация</div><h2>Этапы и контроль результата</h2>${phases}<div class="cols"><div class="box"><h3>Критерии приёмки</h3>${list(kp.acceptance)}</div><div class="box"><h3>Результаты передачи</h3>${list(kp.deliverables)}</div></div><div class="foot"><span>Pllato · ${esc(client.name)}</span><span>5</span></div></section>
<section class="page"><div class="eyebrow">05 · Коммерческие условия</div><h2>Стоимость и график оплат</h2>${!c.complete ? `<div class="quote"><b>Предварительный расчёт. Требует подтверждения:</b>${list(c.issues)}</div>` : ''}<p class="lead">Срок реализации: <b>${esc(c.timeline)}</b></p><table><thead><tr><th>№</th><th>Платёж / условие</th><th>Доля</th><th style="text-align:right">Сумма</th></tr></thead><tbody>${paymentRows}</tbody></table><div class="total"><span>Общая стоимость проекта</span><b>${money(c.total_amount, c.currency)}</b></div><div class="cols" style="margin-top:7mm"><div class="box"><h3>Гарантия</h3><p>${esc(kp.warranty)}</p></div><div class="box"><h3>Интеграции</h3>${list(kp.integrations)}</div></div><div class="foot"><span>Pllato · ${esc(client.name)}</span><span>6</span></div></section>
<section class="page"><div class="eyebrow">06 · Границы проекта</div><h2>Фиксируем ожидания заранее</h2><div class="cols"><div class="box"><h3>Допущения</h3>${list(kp.assumptions)}</div><div class="box"><h3>Не входит без отдельной оценки</h3>${list(kp.exclusions)}</div></div><div class="quote" style="margin-top:18mm">Следующий шаг: подтвердить состав и график оплат, после чего мы фиксируем календарный план и начинаем первый этап.</div><div class="cta"><b>Pllato</b><br>ИП «STUDYSTORIES.APP» · БИН 880607300110<br>pllato.kz · +7 701 123 99 99 · uurraa@gmail.com</div><div class="foot"><span>Pllato · ${esc(client.name)}</span><span>7</span></div></section>
</body></html>`;
}

const SELLER = {
  name: 'ИП «STUDYSTORIES.APP»', bin: '880607300110', director: 'Цай Платон Львович',
  address: 'г. Алматы, мкр. Орбита-4, д. 3, оф. 2', bank: 'АО «Kaspi Bank»',
  iban: 'KZ31722S000010366450', bic: 'CASPKZKA', kbe: '19', knp: '851', phone: '+7 701 123 99 99',
};

export function renderInvoiceHtml({ dealTitle, requisites, payment, sequence, total }) {
  const issued = new Date();
  const due = new Date(issued.getTime() + 5 * 86400000);
  const number = `PL-${String(issued.getFullYear()).slice(-2)}${String(issued.getMonth() + 1).padStart(2, '0')}-${fileSlug(dealTitle).slice(0, 12).toUpperCase()}-${String(sequence).padStart(2, '0')}`;
  return { number, html: `<!doctype html><html lang="ru"><head><meta charset="utf-8"><style>@page{size:A4;margin:14mm}*{box-sizing:border-box}body{font-family:Arial,"DejaVu Sans",sans-serif;color:#172033;font-size:10.5pt}.head{display:flex;justify-content:space-between;border-bottom:3px solid #172033;padding-bottom:8mm}.brand{font-size:24pt;font-weight:900}.muted{color:#64748b}.title{margin:14mm 0 7mm}.title h1{font-size:22pt;margin:0 0 2mm}.grid{display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin:7mm 0}.party{border:1px solid #dbe3ef;border-radius:3mm;padding:5mm;white-space:pre-line}.party b{display:block;margin-bottom:3mm}table{width:100%;border-collapse:collapse;margin-top:10mm}th,td{border:1px solid #cbd5e1;padding:4mm;text-align:left}th{background:#f1f5f9}.right{text-align:right}.pay{margin-top:8mm;margin-left:auto;width:90mm;background:#172033;color:#fff;border-radius:3mm;padding:6mm;display:flex;justify-content:space-between;align-items:center}.pay b{font-size:20pt}.note{background:#eff6ff;border-left:4px solid #2563eb;padding:5mm;margin-top:10mm}.sign{margin-top:24mm;display:grid;grid-template-columns:1fr 1fr;gap:15mm}.line{border-top:1px solid #172033;padding-top:2mm}.foot{position:fixed;bottom:0;left:0;right:0;border-top:1px solid #e2e8f0;padding-top:3mm;color:#64748b;font-size:8pt;display:flex;justify-content:space-between}</style></head><body><div class="head"><div><div class="brand">PLLATO</div><div class="muted">Разработка цифровых систем</div></div><div class="right"><b>СЧЁТ НА ОПЛАТУ</b><br>№ ${esc(number)}<br>от ${issued.toLocaleDateString('ru-RU')}</div></div><div class="title"><h1>${esc(payment.label)}</h1><div class="muted">Проект: ${esc(dealTitle)} · Транш ${sequence} из ${total}</div></div><div class="grid"><div class="party"><b>Исполнитель</b>${esc(`${SELLER.name}\nБИН ${SELLER.bin}\n${SELLER.director}\n${SELLER.address}`)}</div><div class="party"><b>Заказчик</b>${esc(requisites || 'Реквизиты в приложении к сделке')}</div></div><div class="party"><b>Банковские реквизиты исполнителя</b>${esc(`${SELLER.bank}\nИИК: ${SELLER.iban}\nБИК: ${SELLER.bic} · КБе: ${SELLER.kbe} · КНП: ${SELLER.knp}`)}</div><table><thead><tr><th>№</th><th>Наименование</th><th>Кол-во</th><th class="right">Цена</th><th class="right">Сумма</th></tr></thead><tbody><tr><td>1</td><td><b>${esc(payment.label)}</b><br><span class="muted">${esc(payment.trigger)}</span></td><td>1 усл.</td><td class="right">${money(payment.amount, payment.currency)}</td><td class="right"><b>${money(payment.amount, payment.currency)}</b></td></tr></tbody></table><div class="pay"><span>К оплате</span><b>${money(payment.amount, payment.currency)}</b></div><div class="note"><b>Назначение платежа:</b> ${esc(payment.label)} по проекту «${esc(dealTitle)}».<br><b>Срок оплаты:</b> до ${due.toLocaleDateString('ru-RU')}.</div><div class="sign"><div><div class="line">Исполнитель: ${esc(SELLER.director)}</div></div><div><div class="line">Заказчик / подпись</div></div></div><div class="foot"><span>${esc(SELLER.name)} · БИН ${SELLER.bin}</span><span>pllato.kz · ${esc(SELLER.phone)}</span></div></body></html>` };
}

export async function pdfFromHtml(env, html) {
  if (!env.BROWSER?.quickAction) throw new Error('PDF-рендер Cloudflare Browser Run не настроен');
  const response = await env.BROWSER.quickAction('pdf', {
    html, gotoOptions: { waitUntil: 'domcontentloaded', timeout: 45000 },
    pdfOptions: { format: 'A4', printBackground: true, preferCSSPageSize: true, timeout: 45000 },
  });
  if (!response?.ok) throw new Error(`PDF-рендер: HTTP ${response?.status || 500}`);
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength < 1000 || new TextDecoder().decode(buffer.slice(0, 5)) !== '%PDF-') throw new Error('PDF-рендер вернул некорректный файл');
  return buffer;
}

async function storeArtifact(env, artifact, body, mime, metadata = {}) {
  const key = `deal-production/${artifact.deal_id}/${artifact.id}/${artifact.file_name || (artifact.kind + '.html')}`;
  const stored = await env.FILES.put(key, body, { httpMetadata: { contentType: mime }, customMetadata: { dealId: artifact.deal_id, kind: artifact.kind } });
  if (!stored) throw new Error('Не удалось сохранить документ');
  await env.DB.prepare(`UPDATE deal_artifacts SET status='ready',r2_key=?,mime=?,metadata=?,error=NULL,updated_at=? WHERE id=?`)
    .bind(key, mime, JSON.stringify(metadata), nowIso(), artifact.id).run();
}

async function setJobProgress(env, job, stage, label, percent) {
  const value = Math.max(0, Math.min(100, Number(percent || 0)));
  await env.DB.prepare(`UPDATE deal_production_jobs SET progress_stage=?,progress_label=?,progress_percent=?,updated_at=? WHERE id=?`)
    .bind(stage, label, value, nowIso(), job.id).run();
  await updateDealProductionSummary(env, job.deal_id);
}

async function processDemoKp(env, job) {
  const payload = safeJson(job.payload, {});
  const { results } = await env.DB.prepare("SELECT * FROM deal_artifacts WHERE job_id=? AND kind IN ('demo','kp')").bind(job.id).all();
  const demo = results.find(x => x.kind === 'demo'), kp = results.find(x => x.kind === 'kp');
  if (!demo || !kp) throw new Error('Артефакты задания не найдены');
  // Persist analysis before rendering. A PDF retry must never call the model
  // again or silently change the commercial terms of the already published demo.
  const blueprintKey = `deal-production/${job.deal_id}/${job.id}/blueprint.json`;
  const cached = await env.FILES.get(blueprintKey);
  let blueprint;
  if (cached) {
    blueprint = JSON.parse(await cached.text());
    validateBlueprint(blueprint, { allowDraft: payload.preview === true });
  } else {
    await setJobProgress(env, job, 'transcript', 'Читаем транскрипцию встречи', 12);
    const transcript = await transcriptText(env, payload.transcript);
    await setJobProgress(env, job, 'analysis', 'Анализируем встречу и проектируем систему', 25);
    try { blueprint = await openAiBlueprint(env, payload, transcript); }
    catch (error) { throw new Error(`Анализ встречи: ${error.message}`); }
    const saved = await env.FILES.put(blueprintKey, JSON.stringify(blueprint), { httpMetadata: { contentType: 'application/json' } });
    if (!saved) throw new Error('Не удалось сохранить результат анализа встречи');
  }
  await setJobProgress(env, job, 'blueprint', 'Структура системы и КП готова', 55);
  await setJobProgress(env, job, 'demo', 'Собираем интерактивное демо', 65);
  const demoHtml = renderDemoHtml(blueprint);
  await storeArtifact(env, demo, demoHtml, 'text/html; charset=utf-8', { blueprintVersion: 2, blueprintKey, screens: blueprint.demo.screens.length });
  const demoUrl = demo.public_url || `${PUBLIC_ORIGIN}/demo-artifact/${demo.public_token}`;
  await setJobProgress(env, job, 'kp', 'Формируем коммерческое предложение', 78);
  const kpHtml = renderKpHtml(blueprint, demoUrl);
  await setJobProgress(env, job, 'pdf', 'Рендерим КП в PDF', 88);
  let kpPdf;
  try { kpPdf = await pdfFromHtml(env, kpHtml); }
  catch (error) { throw new Error(`Создание PDF: ${error.message}`); }
  await storeArtifact(env, kp, kpPdf, 'application/pdf', {
    blueprintVersion: 1,
    commercial: blueprint.commercial,
    paymentPlan: blueprint.commercial.payment_plan,
    timeline: blueprint.commercial.timeline,
  });
  // Keep the existing Pllato App demo registry in sync.
  await setJobProgress(env, job, 'publish', 'Публикуем демо и прикрепляем файлы', 95);
  const slug = `auto-${fileSlug(payload.deal?.title).toLowerCase().slice(0, 45)}-${job.deal_id.replace(/^deal_/, '').slice(-8)}`;
  const at = nowIso();
  try {
    if (payload.preview === true) return { blueprint, demoUrl };
    const snapshot = JSON.stringify({ productionArtifactId: demo.id, productionR2Key: `deal-production/${demo.deal_id}/${demo.id}/${demo.file_name || 'demo.html'}`, blueprint });
    const existing = await env.DB.prepare('SELECT id FROM demos WHERE deal_id=? LIMIT 1').bind(job.deal_id).first();
    if (existing) {
      await env.DB.prepare(`UPDATE demos SET client_name=?,title=?,status='final',is_new=1,brief_snapshot=?,token=?,
        token_expires=?,slug=?,message='',build_status='ready',build_error=NULL,updated_at=? WHERE id=?`)
        .bind(blueprint.client.name, `${blueprint.client.name} — демо`, snapshot, demo.public_token,
          new Date(Date.now() + 90 * 86400000).toISOString(), slug, at, existing.id).run();
    } else {
      await env.DB.prepare(`INSERT INTO demos (id,deal_id,client_name,title,status,is_new,brief_snapshot,token,token_expires,slug,message,build_status,sort_order,created_by,created_at,updated_at)
        VALUES (?,?,?,?,'final',1,?,?,?,?,'','ready',0,?,?,?)`)
        .bind(`demo_${job.deal_id.replace(/^deal_/, '')}`, job.deal_id, blueprint.client.name, `${blueprint.client.name} — демо`, snapshot,
          demo.public_token, new Date(Date.now() + 90 * 86400000).toISOString(), slug, job.created_by || '', at, at).run();
    }
  } catch {}
  return { blueprint, demoUrl };
}

async function processInvoicePack(env, job) {
  const payload = safeJson(job.payload, {}), plan = payload.paymentPlan || [];
  const { results } = await env.DB.prepare("SELECT * FROM deal_artifacts WHERE job_id=? AND kind='invoice' ORDER BY sequence").bind(job.id).all();
  const artifacts = results || [];
  await setJobProgress(env, job, 'invoices', 'Подготавливаем комплект счетов', 12);
  for (let index = 0; index < artifacts.length; index++) {
    const artifact = artifacts[index];
    const payment = plan[Number(artifact.sequence || 1) - 1];
    if (!payment) throw new Error(`Не найден платёж для счёта ${artifact.sequence}`);
    const label = cleanText(payment.label) || `Платёж ${index + 1}`;
    await setJobProgress(env, job, 'invoice', `Создаём счёт ${index + 1} из ${artifacts.length}: ${label}`, 18 + Math.round(index / Math.max(1, artifacts.length) * 68));
    const rendered = renderInvoiceHtml({ dealTitle: payload.deal?.title || 'Проект', requisites: payload.customerRequisites,
      payment, sequence: Number(artifact.sequence), total: plan.length });
    const pdf = await pdfFromHtml(env, rendered.html);
    await storeArtifact(env, artifact, pdf, 'application/pdf', { payment, invoiceNumber: rendered.number, issuedAt: nowIso() });
  }
  await setJobProgress(env, job, 'publish', 'Прикрепляем счета к сделке', 95);
  return { count: artifacts.length };
}

async function maybeAdvanceStage(env, job, deps) {
  const payload = safeJson(job.payload, {});
  const pipelineId = payload.pipelineId;
  if (!pipelineId) return null;
  const row = await env.DB.prepare('SELECT stages FROM pipelines WHERE id=?').bind(pipelineId).first();
  const stages = safeJson(row?.stages, {});
  const re = job.kind === 'demo_kp' ? /демо\s*готов/i : /сч[её]т(?:а|ы)?\s*готов/i;
  let target = '';
  for (const [key, value] of Object.entries(stages || {})) {
    if (re.test(String(value?.name || ''))) { target = String(value?.statusId || value?.id || key); break; }
  }
  if (!target) return null;
  const deal = await env.DB.prepare('SELECT stage_id FROM deals WHERE id=?').bind(job.deal_id).first();
  if (!deal || deal.stage_id !== payload.buildStageId || deal.stage_id === target) return null;
  const at = nowIso();
  await env.DB.prepare('UPDATE deals SET stage_id=?,stage_changed_at=?,bitrix_date_modify=? WHERE id=?')
    .bind(target, at, at, job.deal_id).run();
  if (deps?.logStageEvent) await deps.logStageEvent(env, job.deal_id, pipelineId, target, at);
  return target;
}

async function completeJob(env, job, result, deps) {
  const at = nowIso();
  await env.DB.prepare("UPDATE deal_production_jobs SET status='ready',completed_at=?,updated_at=?,lease_until=NULL,error=NULL,progress_stage='ready',progress_label='Готово',progress_percent=100 WHERE id=?")
    .bind(at, at, job.id).run();
  const summary = await updateDealProductionSummary(env, job.deal_id);
  const nextStage = await maybeAdvanceStage(env, job, deps);
  const demo = job.kind === 'demo_kp';
  await notifyMany(env, deps, job.deal_id, {
    id: `production_ready:${job.id}`, type: 'deal_documents', icon: demo ? '✅' : '🧾',
    title: demo ? 'Демо и КП готовы' : `Комплект счетов готов: ${result.count}`,
    body: nextStage ? 'Сделка автоматически переведена на следующий этап.' : 'Документы подшиты в карточку сделки.',
  });
  return { summary, nextStage };
}

async function failJob(env, job, error, deps) {
  const attempts = Number(job.attempt || 0);
  const final = attempts >= MAX_JOB_ATTEMPTS;
  const status = final ? 'error' : 'queued';
  const message = String(error?.message || error || 'Неизвестная ошибка').slice(0, 900);
  const retryAt = final ? null : Date.now() + Math.min(15, attempts * attempts) * 60000;
  const progressLabel = final ? 'Ошибка создания документов' : 'Повторная попытка будет запущена автоматически';
  await env.DB.prepare('UPDATE deal_production_jobs SET status=?,error=?,lease_until=NULL,next_attempt_at=?,updated_at=?,progress_stage=?,progress_label=? WHERE id=?')
    .bind(status, message, retryAt, nowIso(), final ? 'error' : 'retry', progressLabel, job.id).run();
  await env.DB.prepare("UPDATE deal_artifacts SET status=?,error=?,updated_at=? WHERE job_id=? AND status!='ready'")
    .bind(status, message, nowIso(), job.id).run();
  await updateDealProductionSummary(env, job.deal_id);
  if (final) await notifyMany(env, deps, job.deal_id, {
    id: `production_error:${job.id}`, type: 'deal_documents', icon: '⚠️', title: 'Ошибка создания документов', body: message,
  });
}

export async function processDealProductionJobs(env, deps = {}, options = {}) {
  await ensureDealProductionSchema(env);
  // A Worker can be stopped while awaiting the model/browser. Expired leases
  // are returned to the queue so a cron invocation can safely resume them.
  const recovered = await env.DB.prepare("UPDATE deal_production_jobs SET status='queued',lease_until=NULL,updated_at=? WHERE status='building' AND lease_until<?")
    .bind(nowIso(), Date.now()).run();
  if (recovered?.meta?.changes) {
    await env.DB.prepare("UPDATE deal_artifacts SET status='queued',updated_at=? WHERE status='building' AND job_id IN (SELECT id FROM deal_production_jobs WHERE status='queued')")
      .bind(nowIso()).run();
  }
  const limit = Math.max(1, Math.min(Number(options.limit || 1), 3));
  const processed = [];
  for (let i = 0; i < limit; i++) {
    const specific = options.jobId ? 'AND id=?' : '';
    const params = [Date.now(), Date.now(), ...(options.jobId ? [options.jobId] : [])];
    const job = await env.DB.prepare(`SELECT * FROM deal_production_jobs WHERE status='queued'
      AND (next_attempt_at IS NULL OR next_attempt_at<=?) AND (lease_until IS NULL OR lease_until<?) ${specific}
      ORDER BY created_at LIMIT 1`).bind(...params).first();
    if (!job) break;
    const lease = Date.now() + JOB_LEASE_MS;
    const claim = await env.DB.prepare(`UPDATE deal_production_jobs SET status='building',lease_until=?,started_at=COALESCE(started_at,?),
      attempt=attempt+1,updated_at=?,progress_stage='starting',progress_label='Запускаем создание документов',progress_percent=8
      WHERE id=? AND status='queued' AND (lease_until IS NULL OR lease_until<?)`)
      .bind(lease, nowIso(), nowIso(), job.id, Date.now()).run();
    if (!claim?.meta?.changes) continue;
    const claimed = { ...job, attempt: Number(job.attempt || 0) + 1 };
    await env.DB.prepare("UPDATE deal_artifacts SET status='building',error=NULL,updated_at=? WHERE job_id=? AND status!='ready'")
      .bind(nowIso(), job.id).run();
    await updateDealProductionSummary(env, job.deal_id);
    try {
      const result = job.kind === 'demo_kp' ? await processDemoKp(env, claimed)
        : job.kind === 'invoice_pack' ? await processInvoicePack(env, claimed)
        : (() => { throw new Error(`Неизвестный тип задания: ${job.kind}`); })();
      await completeJob(env, claimed, result, deps);
      processed.push({ id: job.id, status: 'ready' });
    } catch (error) {
      console.error('[deal-production]', JSON.stringify({ jobId: job.id, dealId: job.deal_id, kind: job.kind, error: String(error?.message || error) }));
      await failJob(env, claimed, error, deps);
      processed.push({ id: job.id, status: claimed.attempt >= MAX_JOB_ATTEMPTS ? 'error' : 'queued', error: String(error?.message || error) });
    }
    if (options.jobId) break;
  }
  return { processed };
}

async function demoStartStage(env,dealId) {
 const row=await env.DB.prepare('SELECT d.pipeline_id,d.stage_id,p.name AS pipeline_name,p.stages FROM deals d JOIN pipelines p ON p.id=d.pipeline_id WHERE d.id=?').bind(dealId).first();
 if(!row)return null;
 const name=safeJson(row.stages,{})[row.stage_id]?.name||'';
 return DEMO_BUILD_STAGE_RE.test(name)||(String(row.pipeline_name).trim().toLowerCase()==='лидген'&&row.stage_id==='LOST')?row:null;
}

export async function handleDealProductionStatus(request, env, deps, dealId) {
  const auth = await deps.requireAuthFlexible(request, env);
  if (auth.error) return deps.json({ error: auth.error }, auth.status, request);
  const me = await deps.resolveCanonicalUser(env, auth.claims), access = deps.dealAccessSql(me);
  const deal = await env.DB.prepare('SELECT id FROM deals WHERE id=?' + access.where).bind(dealId, ...access.params).first();
  if (!deal) return deps.json({ error: 'Нет доступа к сделке' }, 403, request);
  return deps.json({ ok: true, ...(await dealProductionState(env, dealId)), canStartDemo:Boolean(await demoStartStage(env,dealId)) }, 200, request);
}

export async function handleDealProductionRetry(request, env, deps, dealId) {
  const auth = await deps.requireAuthFlexible(request, env);
  if (auth.error) return deps.json({ error: auth.error }, auth.status, request);
  const me = await deps.resolveCanonicalUser(env, auth.claims);
  if (!await deps.canEditRecord(env, me, 'deals', dealId)) return deps.json({ error: 'Нет права изменения сделки' }, 403, request);
  await ensureDealProductionSchema(env);
  const existing=await env.DB.prepare("SELECT id FROM deal_production_jobs WHERE deal_id=? AND kind='demo_kp'").bind(dealId).first();
  if(!existing){
    const stage=await demoStartStage(env,dealId);
    if(!stage)return deps.json({error:'Для запуска демо переведите сделку на «Создание Демо»'},422,request);
    try{
      const queued=await enqueueDemoAndKp(env,dealId,me.canonicalUid||me.uid||'',stage.pipeline_id,stage.stage_id);
      return deps.json({ok:true,requeued:1,jobId:queued.jobId},200,request);
    }catch(e){return deps.json({error:e.message},422,request);}
  }
  const at = nowIso();
  const changed = await env.DB.prepare("UPDATE deal_production_jobs SET status='queued',attempt=0,lease_until=NULL,next_attempt_at=NULL,error=NULL,updated_at=?,progress_stage='queued',progress_label='В очереди на повторный запуск',progress_percent=5 WHERE deal_id=? AND status='error'")
    .bind(at, dealId).run();
  await env.DB.prepare("UPDATE deal_artifacts SET status='queued',error=NULL,updated_at=? WHERE deal_id=? AND status='error'").bind(at, dealId).run();
  await updateDealProductionSummary(env, dealId);
  return deps.json({ ok: true, queued: Number(changed?.meta?.changes || 0) }, 200, request);
}

export async function handleDealArtifactFile(request, env, deps, artifactId) {
  const auth = await deps.requireAuthFlexible(request, env);
  if (auth.error) return deps.json({ error: auth.error }, auth.status, request);
  const me = await deps.resolveCanonicalUser(env, auth.claims), access = deps.dealAccessSql(me);
  await ensureDealProductionSchema(env);
  const artifact = await env.DB.prepare(`SELECT a.* FROM deal_artifacts a WHERE a.id=? AND a.deal_id IN
    (SELECT id FROM deals WHERE id=a.deal_id${access.where})`).bind(artifactId, ...access.params).first();
  if (!artifact) return deps.json({ error: 'Файл не найден или нет доступа' }, 404, request);
  if (artifact.status !== 'ready' || !artifact.r2_key) return deps.json({ error: 'Файл ещё не готов' }, 409, request);
  const object = await env.FILES.get(artifact.r2_key);
  if (!object) return deps.json({ error: 'Файл отсутствует в хранилище' }, 410, request);
  const headers = new Headers(deps.corsHeaders(request));
  headers.set('Content-Type', artifact.mime || 'application/octet-stream');
  headers.set('Content-Length', String(object.size));
  headers.set('Cache-Control', 'private, no-store');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Content-Disposition', `${artifact.kind === 'kp' || artifact.kind === 'invoice' ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(artifact.file_name || 'document')}`);
  return new Response(object.body, { headers });
}

export async function handlePublicDemoArtifact(request, env, token) {
  await ensureDealProductionSchema(env);
  const artifact = await env.DB.prepare("SELECT * FROM deal_artifacts WHERE public_token=? AND kind='demo' AND status='ready'").bind(token).first();
  if (!artifact?.r2_key) return new Response('<!doctype html><meta charset="utf-8"><title>Демо готовится</title><body style="font-family:sans-serif;padding:40px"><h1>Демо ещё готовится</h1><p>Обновите страницу через несколько минут.</p></body>', { status: 202, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Retry-After': '30' } });
  const object = await env.FILES.get(artifact.r2_key);
  if (!object) return new Response('Демо недоступно', { status: 410 });
  return new Response(object.body, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=120', 'X-Robots-Tag': 'noindex, nofollow', 'Content-Security-Policy': "default-src 'self' 'unsafe-inline'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; frame-ancestors 'self' https://pllato.kz" } });
}
