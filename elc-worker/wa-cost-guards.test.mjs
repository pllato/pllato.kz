import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { recoverWaHistory } from './wa-history.js';

test('concurrent cron deliveries share one recovery scan per 15 minutes', async () => {
  const sql = new DatabaseSync(':memory:');
  sql.exec('CREATE TABLE kv(k TEXT PRIMARY KEY, v TEXT)');
  let scans = 0, failScan = false;
  const db = { prepare(query) {
    let args = [];
    return {
      bind(...values) { args = values; return this; },
      async run() { return { meta: { changes: Number(sql.prepare(query).run(...args).changes) } }; },
      async all() {
        scans++;
        assert.match(query, /WHERE rank = 1 ORDER BY id LIMIT 8/);
        if (failScan) throw new Error('database unavailable');
        return { results: [] };
      },
    };
  } };
  const noFetch = () => { throw new Error('unexpected provider request'); };
  const now = 1_000_000;
  const results = await Promise.all(Array.from({ length: 10 }, () => recoverWaHistory(db, noFetch, now)));
  assert.equal(results.filter(r => !r.skipped).length, 1);
  assert.equal(scans, 1);
  assert.equal((await recoverWaHistory(db, noFetch, now + 899999)).skipped, true);
  assert.equal((await recoverWaHistory(db, noFetch, now + 900000)).skipped, false);
  failScan = true;
  await assert.rejects(recoverWaHistory(db, noFetch, now + 1800000), /database unavailable/);
  assert.equal((await recoverWaHistory(db, noFetch, now + 1800001)).skipped, true);
  assert.equal(scans, 3, 'failed jobs must retain their cooldown');
});

test('scheduled handler never starts historical chat-shell discovery', () => {
  const source = readFileSync(new URL('./worker.js', import.meta.url), 'utf8');
  const scheduled = source.slice(source.indexOf('  async scheduled(event, env, ctx)'));
  assert.doesNotMatch(scheduled, /syncWaChatShells\(env\)/);
  assert.match(scheduled, /processScheduledWaMessages\(env\)/);
  assert.match(scheduled, /recoverWaHistory\(env.DB\)/);
});
