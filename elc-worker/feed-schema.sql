-- ── Лента (корпоративный фид, как в Битрикс24) ──────────────
-- Посты сотрудников + комментарии + реакции (лайки).
-- Аудитория: NULL audience_uids = виден всем; иначе JSON-массив uid'ов
-- кому адресован пост (автор всегда видит свой; admin видит всё).

CREATE TABLE IF NOT EXISTS feed_posts (
  id            TEXT PRIMARY KEY,
  author_uid    TEXT NOT NULL,
  text          TEXT,
  attachments   TEXT,            -- JSON-массив {url,name,contentType,size,kind}
  audience      TEXT,            -- JSON: исходный выбор {users:[...],nodes:[...]} для UI
  audience_uids TEXT,            -- JSON-массив uid (денормализовано для фильтра); NULL = всем
  pinned        INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  like_count    INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER,
  deleted_at    INTEGER
);
CREATE INDEX IF NOT EXISTS idx_feed_posts_created   ON feed_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_posts_author    ON feed_posts(author_uid);
CREATE INDEX IF NOT EXISTS idx_feed_posts_pinned    ON feed_posts(pinned, created_at DESC);

CREATE TABLE IF NOT EXISTS feed_comments (
  id          TEXT PRIMARY KEY,
  post_id     TEXT NOT NULL,
  author_uid  TEXT NOT NULL,
  text        TEXT,
  attachments TEXT,             -- JSON-массив вложений
  created_at  INTEGER NOT NULL,
  deleted_at  INTEGER
);
CREATE INDEX IF NOT EXISTS idx_feed_comments_post ON feed_comments(post_id, created_at ASC);

CREATE TABLE IF NOT EXISTS feed_reactions (
  post_id    TEXT NOT NULL,
  uid        TEXT NOT NULL,
  kind       TEXT NOT NULL DEFAULT 'like',
  created_at INTEGER NOT NULL,
  PRIMARY KEY (post_id, uid)
);
CREATE INDEX IF NOT EXISTS idx_feed_reactions_post ON feed_reactions(post_id);
