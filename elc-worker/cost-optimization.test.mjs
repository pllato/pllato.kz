import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { ensureRolesColumn, listChannels } from './chat-module.js';
import { readFileSync } from 'node:fs';

function binding(db, seen = []) {
  return {
    prepare(sql) {
      return { args: [], bind(...args) { this.args = args; return this; },
        async first() { seen.push(sql); return db.prepare(sql).get(...this.args) || null; },
        async all() { seen.push(sql); return { results: db.prepare(sql).all(...this.args) }; },
        async run() { seen.push(sql); return db.prepare(sql).run(...this.args); },
      };
    },
    async batch(statements) {
      db.exec('BEGIN');
      try { const results = []; for (const s of statements) results.push(await s.run()); db.exec('COMMIT'); return results; }
      catch (e) { db.exec('ROLLBACK'); throw e; }
    },
  };
}
function fixture() {
  const db = new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE team_chat_channels(id TEXT PRIMARY KEY,type TEXT,name TEXT,description TEXT,created_by TEXT,created_at INTEGER,archived_at INTEGER,icon TEXT);
    CREATE TABLE team_chat_members(channel_id TEXT,user_id TEXT,last_read_message_id TEXT,muted INTEGER,pinned_at INTEGER,archived_at INTEGER,role TEXT,PRIMARY KEY(channel_id,user_id));
    CREATE TABLE team_chat_msgs(id TEXT PRIMARY KEY,channel_id TEXT,created_at INTEGER,deleted_at INTEGER,text TEXT);
    CREATE INDEX idx_chat_msgs_live_channel_time ON team_chat_msgs(channel_id,created_at) WHERE deleted_at IS NULL;
    CREATE INDEX idx_chat_last ON team_chat_msgs(channel_id,created_at DESC);
    INSERT INTO team_chat_channels VALUES('c','channel','Chat',NULL,'u',0,NULL,NULL),('dm','dm',NULL,NULL,'u',1,NULL,NULL),('secret','channel','Private',NULL,'other',0,NULL,NULL);
    INSERT INTO team_chat_members VALUES('c','u','m1',0,NULL,NULL,NULL),('c','alias','m1',0,NULL,NULL,NULL),('dm','u',NULL,0,NULL,NULL,NULL),('dm','other',NULL,0,NULL,NULL,NULL),('secret','other',NULL,0,NULL,NULL,NULL);
    INSERT INTO team_chat_msgs VALUES('m1','c',1,NULL,'read'),('m2','c',2,NULL,'unread'),('m3','c',3,1,'deleted'),('m4','c',4,NULL,'last'),('d1','dm',5,NULL,'dm text');`);
  const seen = [];
  return { db, seen, env: { DB: binding(db, seen) } };
}
test('role backfill commits once across cold starts and retains explicit roles', async () => {
  const f = fixture();
  f.db.exec("UPDATE team_chat_members SET role='member' WHERE user_id='alias'");
  await Promise.all([ensureRolesColumn(f.env), ensureRolesColumn(f.env)]);
  assert.equal(f.db.prepare("SELECT role FROM team_chat_members WHERE channel_id='c' AND user_id='u'").get().role, 'admin');
  assert.equal(f.db.prepare("SELECT role FROM team_chat_members WHERE channel_id='c' AND user_id='alias'").get().role, 'member');
  assert.equal(f.seen.filter(s => s.startsWith('UPDATE team_chat_members')).length, 1);
  await ensureRolesColumn({ DB: binding(f.db, f.seen) });
  assert.equal(f.seen.filter(s => s.startsWith('UPDATE team_chat_members')).length, 1);
});
test('failed role migration retries without recording success', async () => {
  const f = fixture(), real = f.env.DB.batch;
  f.env.DB.batch = async () => { throw new Error('temporary failure'); };
  await assert.rejects(ensureRolesColumn(f.env), /temporary failure/);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM app_schema_migrations').get().n, 0);
  f.env.DB.batch = real;
  await ensureRolesColumn(f.env);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM app_schema_migrations').get().n, 1);
});
test('chat list keeps UID aliases, deleted/unread semantics, DM peer and privacy in one SQL query', async () => {
  const f = fixture();
  const result = await (await listChannels(f.env, { uid: 'u', ids: ['u','alias'] }, new URL('https://test/api/chat/channels'))).json();
  assert.equal(result.items.length, 2);
  assert.equal(result.items.find(c => c.id === 'c').unread_count, 2);
  assert.equal(result.items.find(c => c.id === 'dm').other_user_id, 'other');
  assert.equal(result.items.find(c => c.id === 'dm').unread_count, 1);
  assert.equal(f.seen.length, 1);
  const sql = f.seen[0];
  const plan = f.db.prepare('EXPLAIN QUERY PLAN ' + sql).all('u','alias','u','alias').map(r => r.detail).join('\n');
  assert.match(plan, /idx_chat_msgs_live_channel_time.*created_at>\?/);
  f.db.exec("UPDATE team_chat_members SET last_read_message_id='missing' WHERE channel_id='c'");
  const missing = await (await listChannels(f.env, { uid:'u' }, new URL('https://test'))).json();
  assert.equal(missing.items.find(c => c.id === 'c').unread_count, 0);
  f.db.exec("UPDATE team_chat_members SET archived_at=1 WHERE channel_id='c'");
  const archived = await (await listChannels(f.env, { uid:'u' }, new URL('https://test?archived=1'))).json();
  assert.deepEqual(archived.items.map(c=>c.id), ['c']);
});
test('deal pipeline union keeps mirrors and outer visibility filters', () => {
  const db = new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE deals(id TEXT PRIMARY KEY,pipeline_id TEXT,mirrored_in TEXT,archived INTEGER,responsible_uid TEXT);
    CREATE INDEX by_pipeline ON deals(pipeline_id);
    CREATE INDEX idx_deals_mirrors_nonempty ON deals(mirrored_in,id) WHERE mirrored_in IS NOT NULL AND mirrored_in!='{}';
    INSERT INTO deals VALUES('a','p',NULL,0,'me'),('b','q','{"p":"new"}',0,'me'),('c','p','{"p":"new"}',0,'other'),('d','p','{}',1,'me'),('e','q','{}',0,'me');`);
  const source = readFileSync(new URL('./worker.js',import.meta.url),'utf8');
  const condition = source.match(/whereParts\.push\(`(id IN \([\s\S]*?\))`\);/)[1];
  const base = 'SELECT id FROM deals WHERE ';
  const suffix = " AND (archived IS NULL OR archived=0) AND responsible_uid='me' ORDER BY id";
  const expected = db.prepare(base+'(pipeline_id=? OR mirrored_in LIKE ?)'+suffix).all('p','%"p":%');
  const actual = db.prepare(base+condition+suffix).all('p','%"p":%');
  assert.deepEqual(actual, expected);
  const plan=db.prepare('EXPLAIN QUERY PLAN '+base+condition+suffix).all('p','%"p":%').map(r=>r.detail).join('\n');
  assert.match(plan,/by_pipeline/); assert.match(plan,/idx_deals_mirrors_nonempty/);
});

test('stage discovery advances bounded cursor atomically and never rescans idle history',async()=>{
 const {discoverStageGroupJobs}=await import('./wa-stage-groups.js');
 const db=new DatabaseSync(':memory:');
 db.exec(`CREATE TABLE wa_stage_group_scan(id INTEGER PRIMARY KEY,event_id INTEGER);INSERT INTO wa_stage_group_scan VALUES(1,0);
 CREATE TABLE deal_stage_events(id INTEGER PRIMARY KEY,deal_id TEXT,pipeline_id TEXT,stage_id TEXT);
 CREATE TABLE wa_stage_group_rules(pipeline_id TEXT,stage_id TEXT,since_event INTEGER);
 CREATE TABLE wa_stage_group_jobs(event_id INTEGER PRIMARY KEY,deal_id TEXT,pipeline_id TEXT,stage_id TEXT,created_at INTEGER);
 INSERT INTO wa_stage_group_rules VALUES('p','a',5);
 WITH RECURSIVE n(x) AS(VALUES(1) UNION ALL SELECT x+1 FROM n WHERE x<10002) INSERT INTO deal_stage_events SELECT x,'d','p','a' FROM n;`);
 const seen=[],env={DB:binding(db,seen)};
 db.exec("CREATE TRIGGER fail BEFORE UPDATE ON wa_stage_group_scan BEGIN SELECT RAISE(ABORT,'fail cursor');END");
 await assert.rejects(discoverStageGroupJobs(env),/fail cursor/);
 assert.equal(db.prepare('SELECT COUNT(*) n FROM wa_stage_group_jobs').get().n,0);
 db.exec('DROP TRIGGER fail');await discoverStageGroupJobs(env);
 assert.equal(db.prepare('SELECT event_id FROM wa_stage_group_scan').get().event_id,10000);
 assert.equal(db.prepare('SELECT COUNT(*) n FROM wa_stage_group_jobs').get().n,9995);
 await discoverStageGroupJobs(env);assert.equal(db.prepare('SELECT COUNT(*) n FROM wa_stage_group_jobs').get().n,9997);
 seen.length=0;await discoverStageGroupJobs(env);assert.equal(seen.length,2);
 assert.ok(!seen.some(s=>s.startsWith('INSERT')));
});
