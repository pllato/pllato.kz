import test from 'node:test';
import assert from 'node:assert/strict';
import { enqueueDemoAndKp, enqueueInvoicePack, processDealProductionJobs, handleDealProductionRetry } from './deal-production.js';

const untouchedEnv = new Proxy({}, { get() { throw new Error('Disabled generation must not access DB, files or AI'); } });
test('manual mode blocks both enqueue paths before any side effects', async () => {
  for (const enqueue of [enqueueDemoAndKp, enqueueInvoicePack]) {
    await assert.rejects(enqueue(untouchedEnv, 'deal', 'actor', 'pipeline', 'stage'), { code: 'PRODUCTION_DISABLED' });
  }
});
test('cron and targeted retries do not claim existing queued jobs', async () => {
  for (const options of [{}, { jobId: 'already-queued', limit: 3 }]) {
    assert.deepEqual(await processDealProductionJobs(untouchedEnv, {}, options), { processed: [], disabled: true });
  }
});
test('authorized retry API reports manual mode without touching the queue', async () => {
  const deps = {
    requireAuthFlexible: async () => ({ claims: {} }), resolveCanonicalUser: async () => ({ uid: 'actor' }),
    canEditRecord: async () => true, json: (body, status) => ({ body, status }),
  };
  const result = await handleDealProductionRetry({}, untouchedEnv, deps, 'deal');
  assert.equal(result.status, 409);
  assert.equal(result.body.code, 'PRODUCTION_DISABLED');
  deps.canEditRecord = async () => false;
  assert.equal((await handleDealProductionRetry({}, untouchedEnv, deps, 'deal')).status, 403);
});
