#!/usr/bin/env node
// migrate_tasks_files.mjs — миграция файлов задач из Bitrix24 disk в Cloudflare R2.
//
// Зачем:
//   В D1 у нас 308 задач с `bitrix_file_ids` (метаданные ID файлов из Bitrix).
//   Сами бинарники остались в Bitrix24, который скоро отключают. Этот скрипт
//   читает все file_ids, качает каждый файл через Bitrix REST API, заливает
//   в R2 bucket `pllato-elc-files`, заполняет таблицу D1 `files_queue` с
//   метаданными. После этого worker `/api/files/{id}` отдаёт файл из R2.
//
// Использование:
//   export BITRIX_WEBHOOK=$(cat ~/.secrets/elc_bitrix_webhook.txt)
//   node elc-worker/scripts/migrate_tasks_files.mjs
//
//   Опции:
//     --dry-run         только показать что будет сделано (по умолчанию false)
//     --limit=N         мигрировать только N файлов (для теста)
//     --resume          пропустить файлы которые уже migrated=1 в files_queue
//     --concurrency=N   сколько параллельных загрузок (default 4)
//
// Архитектура:
//   1. Читаем уникальные file IDs из tasks.bitrix_file_ids через `wrangler d1 execute`
//   2. Для каждого ID:
//      a. Bitrix REST `disk.attachedObject.get?id=N` → получаем NAME, SIZE,
//         DOWNLOAD_URL, OBJECT.TYPE (или сразу `disk.file.get` если нужный тип)
//      b. fetch DOWNLOAD_URL → получаем бинарный body
//      c. PUT в R2 через wrangler r2 object put (или через Cloudflare R2 API)
//      d. INSERT/UPDATE в D1 files_queue: { id, file_name, file_size,
//         content_type, r2_key, migrated=1 }
//   3. Логируем progress + ошибки в JSON отчёт `scripts/migration-report.json`

import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const BITRIX_WEBHOOK = process.env.BITRIX_WEBHOOK;
if (!BITRIX_WEBHOOK) {
  console.error('❌ BITRIX_WEBHOOK env not set.');
  console.error('   export BITRIX_WEBHOOK=$(cat ~/.secrets/elc_bitrix_webhook.txt)');
  process.exit(1);
}
const BITRIX_BASE = BITRIX_WEBHOOK.replace(/\/$/, '');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const RESUME = args.includes('--resume');
const LIMIT = (() => {
  const a = args.find(a => a.startsWith('--limit='));
  return a ? parseInt(a.split('=')[1], 10) || 0 : 0;
})();
const CONCURRENCY = (() => {
  const a = args.find(a => a.startsWith('--concurrency='));
  return a ? Math.max(1, Math.min(8, parseInt(a.split('=')[1], 10) || 4)) : 4;
})();

const REPO_ROOT = path.resolve(new URL('../..', import.meta.url).pathname);
const WRANGLER_CONFIG = path.join(REPO_ROOT, 'elc-worker/wrangler.toml');
const D1_NAME = 'pllato-elc-d1';
const R2_BUCKET = 'pllato-elc-files';

const REPORT_PATH = path.resolve(new URL('./migration-report.json', import.meta.url).pathname);
const TMP_DIR = '/tmp/elc-bitrix-files';
await fs.mkdir(TMP_DIR, { recursive: true });

// ── Helpers ──────────────────────────────────────────────────────────────

function sh(cmd, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn('sh', ['-c', cmd], { stdio: ['ignore', 'pipe', 'pipe'], ...opts });
    let out = '', err = '';
    p.stdout.on('data', d => out += d);
    p.stderr.on('data', d => err += d);
    p.on('close', code => code === 0 ? resolve(out) : reject(new Error(`exit ${code}: ${err}`)));
  });
}

async function d1Query(sql) {
  const cmd = `wrangler d1 execute ${D1_NAME} --remote --config '${WRANGLER_CONFIG}' --command "${sql.replace(/"/g, '\\"')}" --json`;
  const out = await sh(cmd);
  const parsed = JSON.parse(out);
  return parsed[0]?.results || [];
}

async function r2Put(key, localPath, contentType) {
  const ct = contentType ? `--content-type '${contentType}'` : '';
  const cmd = `wrangler r2 object put '${R2_BUCKET}/${key}' --file '${localPath}' --remote --config '${WRANGLER_CONFIG}' ${ct}`;
  await sh(cmd);
}

async function bitrixCall(method, params = {}) {
  const url = new URL(`${BITRIX_BASE}/${method}.json`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }
  const r = await fetch(url.toString());
  if (!r.ok) throw new Error(`Bitrix ${method} HTTP ${r.status}`);
  const j = await r.json();
  if (j.error) throw new Error(`Bitrix ${method} error: ${j.error_description || j.error}`);
  return j.result;
}

// ── Bitrix file fetch ────────────────────────────────────────────────────
// disk.attachedObject.get возвращает { NAME, SIZE, DOWNLOAD_URL, ... } для
// attachment-id (как хранится в tasks.UF_TASK_WEBDAV_FILES). Если этот метод
// не работает — можно попробовать disk.file.get как fallback.

async function fetchBitrixFileMeta(attachmentId) {
  // Bitrix24 API method: disk.attachedObject.get
  // Поле OBJECT.NAME, OBJECT.SIZE; DOWNLOAD_URL даёт прямую ссылку
  // (может потребовать &auth=... в зависимости от webhook scope)
  try {
    const result = await bitrixCall('disk.attachedObject.get', { id: attachmentId });
    return {
      name: result.NAME || result.OBJECT?.NAME || `file-${attachmentId}`,
      size: parseInt(result.SIZE || result.OBJECT?.SIZE || '0', 10),
      downloadUrl: result.DOWNLOAD_URL || result.OBJECT?.DOWNLOAD_URL,
    };
  } catch (e) {
    // Fallback: disk.file.get (если attachmentId это сразу file ID)
    const result = await bitrixCall('disk.file.get', { id: attachmentId });
    return {
      name: result.NAME || `file-${attachmentId}`,
      size: parseInt(result.SIZE || '0', 10),
      downloadUrl: result.DOWNLOAD_URL,
    };
  }
}

async function downloadBinary(url, dest) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`download HTTP ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  await fs.writeFile(dest, buf);
  const contentType = r.headers.get('content-type') || 'application/octet-stream';
  return { size: buf.length, contentType };
}

// ── Main ─────────────────────────────────────────────────────────────────

async function collectFileIds() {
  console.log('📋 Reading task file IDs from D1...');
  const rows = await d1Query(
    `SELECT id, bitrix_file_ids FROM tasks WHERE has_files = 1 AND bitrix_file_ids IS NOT NULL AND bitrix_file_ids != '' AND bitrix_file_ids != '[]' AND bitrix_file_ids != '{}'`
  );
  const ids = new Set();
  for (const r of rows) {
    let v = r.bitrix_file_ids;
    if (typeof v !== 'string') continue;
    try {
      const parsed = JSON.parse(v);
      const list = Array.isArray(parsed) ? parsed : Object.values(parsed);
      for (const id of list) ids.add(String(id));
    } catch {}
  }
  return Array.from(ids);
}

async function alreadyMigrated() {
  if (!RESUME) return new Set();
  const rows = await d1Query(
    `SELECT id FROM files_queue WHERE migrated = 1`
  );
  return new Set(rows.map(r => r.id));
}

async function migrateOne(id) {
  // 1. Метаданные из Bitrix
  let meta;
  try {
    meta = await fetchBitrixFileMeta(id);
  } catch (e) {
    return { id, ok: false, stage: 'meta', error: e.message };
  }
  if (!meta.downloadUrl) {
    return { id, ok: false, stage: 'meta', error: 'no DOWNLOAD_URL' };
  }
  // 2. Качаем
  const tmpPath = path.join(TMP_DIR, `${id}`);
  let dl;
  try {
    dl = await downloadBinary(meta.downloadUrl, tmpPath);
  } catch (e) {
    return { id, ok: false, stage: 'download', error: e.message };
  }
  // 3. R2 put
  const safeName = meta.name.replace(/[^\w.\-]/g, '_');
  const r2Key = `tasks/${id}/${safeName}`;
  try {
    await r2Put(r2Key, tmpPath, dl.contentType);
  } catch (e) {
    return { id, ok: false, stage: 'r2', error: e.message };
  }
  // 4. D1 upsert
  const sql = `INSERT OR REPLACE INTO files_queue (id, file_name, file_size, content_type, r2_key, migrated, migrated_at) VALUES ('${id}', '${meta.name.replace(/'/g, "''")}', ${dl.size}, '${(dl.contentType || '').replace(/'/g, "''")}', '${r2Key.replace(/'/g, "''")}', 1, datetime('now'))`;
  try {
    await d1Query(sql);
  } catch (e) {
    return { id, ok: false, stage: 'd1', error: e.message };
  }
  // 5. Clean tmp
  try { await fs.unlink(tmpPath); } catch {}
  return { id, ok: true, name: meta.name, size: dl.size, r2Key };
}

async function recordFail(id, err) {
  const sql = `INSERT OR REPLACE INTO files_queue (id, permanently_failed, error_message, created_at) VALUES ('${id}', 1, '${(err || '').replace(/'/g, "''").slice(0, 500)}', datetime('now'))`;
  try { await d1Query(sql); } catch {}
}

async function main() {
  console.log(`🔧 migrate_tasks_files.mjs`);
  console.log(`   webhook: ${BITRIX_BASE.replace(/(\/rest\/\d+\/)[^/]+/, '$1<SECRET>')}`);
  console.log(`   bucket: ${R2_BUCKET}`);
  console.log(`   dry-run: ${DRY_RUN}, resume: ${RESUME}, limit: ${LIMIT || 'all'}, concurrency: ${CONCURRENCY}`);
  console.log('');

  const allIds = await collectFileIds();
  const done = await alreadyMigrated();
  const todo = allIds.filter(id => !done.has(id));
  const limited = LIMIT > 0 ? todo.slice(0, LIMIT) : todo;
  console.log(`📊 unique file IDs: ${allIds.length}`);
  console.log(`   already migrated (skip): ${allIds.length - todo.length}`);
  console.log(`   to migrate this run: ${limited.length}`);
  console.log('');

  if (DRY_RUN) {
    console.log('--dry-run: первые 5 IDs для миграции:', limited.slice(0, 5));
    return;
  }

  const report = { startedAt: new Date().toISOString(), total: limited.length, ok: 0, failed: [] };
  let processed = 0;

  // Простая очередь с CONCURRENCY параллельных воркеров
  const queue = [...limited];
  async function worker() {
    while (queue.length > 0) {
      const id = queue.shift();
      processed++;
      const r = await migrateOne(id);
      if (r.ok) {
        report.ok++;
        process.stdout.write(`\r✓ ${processed}/${limited.length}  ${r.name.slice(0, 50)}                    `);
      } else {
        report.failed.push(r);
        await recordFail(id, `${r.stage}: ${r.error}`);
        console.log(`\n✗ ${id}: ${r.stage}: ${r.error}`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  report.finishedAt = new Date().toISOString();
  await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2));

  console.log('\n');
  console.log(`✅ done. ok=${report.ok}, failed=${report.failed.length}`);
  console.log(`   report: ${REPORT_PATH}`);
}

main().catch(e => {
  console.error('FATAL:', e);
  process.exit(2);
});
