-- ════════════════════════════════════════════════════════════════════════
-- Внутренний чат сотрудников портала pllato.kz (team chat)
-- Адаптировано из CHAT-MODULE-EXTRACTION.md (ppb-crm) под наш стек:
--   - Firebase Auth uid вместо JWT-users.id
--   - Существующие R2 (FILES) + D1 (DB) bindings
--   - Префикс team_chat_* (chat_messages занято legacy миграцией Bitrix-чата)
-- ════════════════════════════════════════════════════════════════════════

-- ── team_chat_channels — каналы / группы / DM ──────────────────────
CREATE TABLE IF NOT EXISTS team_chat_channels (
  id              TEXT PRIMARY KEY,
  type            TEXT NOT NULL,                      -- 'channel' | 'group' | 'dm'
  name            TEXT,                                -- NULL для DM
  description     TEXT,
  created_by      TEXT NOT NULL,                       -- Firebase uid
  auto_add        INTEGER NOT NULL DEFAULT 0,          -- автодобавление новых юзеров
  created_at      INTEGER NOT NULL,
  archived_at     INTEGER
);
CREATE INDEX IF NOT EXISTS idx_team_chat_channels_type     ON team_chat_channels(type);
CREATE INDEX IF NOT EXISTS idx_team_chat_channels_archived ON team_chat_channels(archived_at);

-- ── team_chat_members — состав канала + last_read_message_id ──────
CREATE TABLE IF NOT EXISTS team_chat_members (
  channel_id            TEXT NOT NULL,
  user_id               TEXT NOT NULL,                 -- Firebase uid
  joined_at             INTEGER NOT NULL,
  last_read_message_id  TEXT,
  muted                 INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (channel_id, user_id),
  FOREIGN KEY (channel_id) REFERENCES team_chat_channels(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_team_chat_members_user ON team_chat_members(user_id);

-- ── team_chat_msgs — собственно сообщения (короче имя, чтобы FK влез) ──
CREATE TABLE IF NOT EXISTS team_chat_msgs (
  id              TEXT PRIMARY KEY,
  channel_id      TEXT NOT NULL,
  user_id         TEXT NOT NULL,                       -- автор (Firebase uid)
  text            TEXT,
  type            TEXT NOT NULL DEFAULT 'text',        -- text|file|image|audio|system
  file_key        TEXT,                                -- R2 ключ
  file_meta       TEXT,                                -- JSON
  reply_to        TEXT,                                -- id сообщения на которое отвечают
  edited_at       INTEGER,
  deleted_at      INTEGER,                             -- soft-delete
  pinned_at       INTEGER,
  created_at      INTEGER NOT NULL,
  FOREIGN KEY (channel_id) REFERENCES team_chat_channels(id) ON DELETE CASCADE,
  FOREIGN KEY (reply_to)   REFERENCES team_chat_msgs(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_team_chat_msgs_channel_created ON team_chat_msgs(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_chat_msgs_user            ON team_chat_msgs(user_id);
CREATE INDEX IF NOT EXISTS idx_team_chat_msgs_pinned          ON team_chat_msgs(channel_id, pinned_at);

-- ── team_chat_reactions — эмодзи ────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_chat_reactions (
  message_id    TEXT NOT NULL,
  user_id       TEXT NOT NULL,
  emoji         TEXT NOT NULL,
  created_at    INTEGER NOT NULL,
  PRIMARY KEY (message_id, user_id, emoji),
  FOREIGN KEY (message_id) REFERENCES team_chat_msgs(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_team_chat_reactions_message ON team_chat_reactions(message_id);

-- ── team_chat_history — журнал edit/delete для audit ───────────────
CREATE TABLE IF NOT EXISTS team_chat_history (
  id              TEXT PRIMARY KEY,
  message_id      TEXT NOT NULL,
  channel_id      TEXT NOT NULL,
  author_id       TEXT NOT NULL,
  action          TEXT NOT NULL,                       -- edited|deleted|pinned|unpinned
  prev_text       TEXT,
  prev_file_meta  TEXT,
  acted_by        TEXT NOT NULL,
  acted_at        INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_team_chat_history_msg ON team_chat_history(message_id, acted_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_chat_history_ch  ON team_chat_history(channel_id, acted_at DESC);

-- ── team_chat_msgs_fts — полнотекстовый поиск ──────────────────────
CREATE VIRTUAL TABLE IF NOT EXISTS team_chat_msgs_fts USING fts5(
  text,
  message_id UNINDEXED,
  channel_id UNINDEXED,
  user_id UNINDEXED,
  created_at UNINDEXED,
  tokenize = 'unicode61 remove_diacritics 1'
);

CREATE TRIGGER IF NOT EXISTS team_chat_msgs_ai AFTER INSERT ON team_chat_msgs
WHEN new.text IS NOT NULL
BEGIN
  INSERT INTO team_chat_msgs_fts(text, message_id, channel_id, user_id, created_at)
  VALUES (new.text, new.id, new.channel_id, new.user_id, new.created_at);
END;

CREATE TRIGGER IF NOT EXISTS team_chat_msgs_au AFTER UPDATE ON team_chat_msgs
WHEN new.text IS NOT NULL AND (old.text IS NULL OR old.text != new.text)
BEGIN
  DELETE FROM team_chat_msgs_fts WHERE message_id = old.id;
  INSERT INTO team_chat_msgs_fts(text, message_id, channel_id, user_id, created_at)
  VALUES (new.text, new.id, new.channel_id, new.user_id, new.created_at);
END;

CREATE TRIGGER IF NOT EXISTS team_chat_msgs_ad AFTER DELETE ON team_chat_msgs
BEGIN
  DELETE FROM team_chat_msgs_fts WHERE message_id = old.id;
END;

-- ── team_chat_fcm — push-токены устройств (Phase C) ────────────────
CREATE TABLE IF NOT EXISTS team_chat_fcm (
  user_id       TEXT NOT NULL,                         -- Firebase uid
  token         TEXT NOT NULL,
  platform      TEXT,                                  -- ios|android|web
  created_at    INTEGER NOT NULL,
  last_used_at  INTEGER,
  PRIMARY KEY (user_id, token)
);
