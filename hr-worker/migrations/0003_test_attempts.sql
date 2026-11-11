CREATE TABLE IF NOT EXISTS hr_attempts (
 id TEXT PRIMARY KEY, token TEXT NOT NULL, name TEXT NOT NULL, phone TEXT NOT NULL,
 fam TEXT NOT NULL, stage TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'in_progress',
 progress INTEGER NOT NULL DEFAULT 0, started_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_hr_attempts_status ON hr_attempts(status, updated_at);
ALTER TABLE submissions ADD COLUMN reviewed_at TEXT;
CREATE TABLE IF NOT EXISTS hr_push_subscriptions (endpoint TEXT PRIMARY KEY, p256dh TEXT NOT NULL, auth TEXT NOT NULL, created_at TEXT NOT NULL);
