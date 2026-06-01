-- ════════════════════════════════════════════════════════════════════════
-- Центр уведомлений: единая лента событий портала для каждого сотрудника.
-- Продюсеры (лента, WhatsApp, напоминания о делах, задачи) пишут сюда строки
-- через createNotification(). Фронт читает GET /api/notifications.
-- Аддитивно: только CREATE TABLE IF NOT EXISTS — безопасно для прод-базы.
-- ════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS notifications (
  id          TEXT PRIMARY KEY,        -- nt_xxx (может быть детерминированным для дедупа)
  uid         TEXT NOT NULL,           -- получатель (canonicalUid)
  type        TEXT NOT NULL,           -- feed_post | feed_comment | feed_like | wa_incoming | deed_reminder | task_assigned | system
  title       TEXT NOT NULL,           -- готовая строка с именем актора
  body        TEXT,                    -- превью текста
  link        TEXT,                    -- /team.html?page=feed | ?page=deals&deal=... — куда вести по клику
  icon        TEXT,                    -- эмодзи для строки
  actor_uid   TEXT,                    -- кто инициировал (для аватара/исключения себя)
  entity_type TEXT,                    -- feed_post | deal | task | ...
  entity_id   TEXT,
  created_at  INTEGER NOT NULL,        -- ms epoch
  read_at     INTEGER                  -- NULL = непрочитано
);
CREATE INDEX IF NOT EXISTS idx_notif_uid_created ON notifications(uid, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_uid_unread  ON notifications(uid, read_at);
