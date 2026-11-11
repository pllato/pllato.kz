CREATE TABLE IF NOT EXISTS hr_practical_sessions (
 id TEXT PRIMARY KEY, token TEXT NOT NULL, deadline TEXT NOT NULL,
 revision INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL
);
