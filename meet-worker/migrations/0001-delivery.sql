CREATE TABLE IF NOT EXISTS meet_delivery (
 id TEXT PRIMARY KEY, room TEXT NOT NULL, deal_id TEXT NOT NULL, topic TEXT, started TEXT NOT NULL,
 expected INTEGER, finished INTEGER NOT NULL DEFAULT 0, updated INTEGER NOT NULL, error TEXT
);
CREATE TABLE IF NOT EXISTS meet_audio_jobs (
 id TEXT NOT NULL, seq INTEGER NOT NULL, r2_key TEXT NOT NULL, state TEXT NOT NULL DEFAULT 'pending',
 attempts INTEGER NOT NULL DEFAULT 0, retry_at INTEGER NOT NULL DEFAULT 0, text TEXT, error TEXT,
 PRIMARY KEY(id,seq)
);
CREATE INDEX IF NOT EXISTS meet_audio_due ON meet_audio_jobs(state,retry_at);
