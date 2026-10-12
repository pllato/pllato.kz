import test from 'node:test';
import assert from 'node:assert/strict';
import { transcriptRows } from '../app/deal-transcripts.js';
test('lists manual and Zoom transcripts newest first, including pending but excluding deleted and media', () => {
  const rows = transcriptRows([
    { id:'v', extension:'MP4', status:'stored' },
    { id:'old', extension:'VTT', status:'stored', recording_start:'2026-10-08T11:37:00Z' },
    { id:'pending', kind:'audio_transcript', status:'pending', error:'4711', recording_start:'2026-10-12T10:00:00Z' },
    { id:'deleted', extension:'VTT', status:'deleted' },
    { id:'soft', extension:'TXT', status:'stored', deleted_at:'2026-10-12' },
  ], [{id:'m',kind:'transcript',uploadedAt:'2026-10-10T10:00:00Z',url:'/manual'}, {id:'audio',kind:'recording'}]);
  assert.deepEqual(rows.map(r=>r.id), ['zoom:pending','manual:m','zoom:old']);
  assert.equal(rows[0].ready, false);
  assert.equal(rows[0].error, '4711');
  assert.equal(rows[1].ready, true);
  assert.equal(rows[2].path, '/api/zoom/files/old');
});
test('empty or unavailable sources are supported independently', () => {
  assert.deepEqual(transcriptRows(), []);
  assert.equal(transcriptRows(undefined,[{id:'m',kind:'transcript'}]).length, 1);
});
