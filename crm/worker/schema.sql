CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY,
  email           TEXT UNIQUE NOT NULL,
  name            TEXT,
  last_name       TEXT,
  position        TEXT,
  is_admin        INTEGER NOT NULL DEFAULT 0,
  is_super_admin  INTEGER NOT NULL DEFAULT 0,
  apps            TEXT NOT NULL DEFAULT '{}',
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL,
  created_by      TEXT
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS channels (
  id          TEXT PRIMARY KEY,
  type        TEXT NOT NULL,
  name        TEXT NOT NULL,
  config      TEXT NOT NULL DEFAULT '{}',
  apps        TEXT NOT NULL DEFAULT '{}',
  active      INTEGER NOT NULL DEFAULT 1,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL,
  created_by  TEXT,
  updated_by  TEXT
);
CREATE INDEX IF NOT EXISTS idx_channels_type ON channels(type);

CREATE TABLE IF NOT EXISTS channel_secrets (
  channel_id  TEXT PRIMARY KEY,
  secrets     TEXT NOT NULL DEFAULT '{}',
  updated_at  INTEGER NOT NULL,
  FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS store (
  team_id     TEXT NOT NULL DEFAULT 'pllato',
  collection  TEXT NOT NULL,
  id          TEXT NOT NULL,
  data        TEXT NOT NULL,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL,
  PRIMARY KEY (team_id, collection, id)
);
CREATE INDEX IF NOT EXISTS idx_store_lookup ON store(team_id, collection, updated_at);
