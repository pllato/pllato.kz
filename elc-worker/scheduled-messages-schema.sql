-- Отложенные WhatsApp-сообщения. Сотрудник пишет, ставит время → cron каждую
-- минуту находит due и шлёт через Green-API. После — обновляет status='sent'
-- или 'failed'.
CREATE TABLE IF NOT EXISTS wa_scheduled_messages (
  id             TEXT PRIMARY KEY,             -- 'sch_<random>'
  channel_id     TEXT,                          -- если null, worker подберёт active
  chat_id        TEXT NOT NULL,                 -- WA chatId (77071820123@c.us)
  phone          TEXT,                          -- denormalized для UI
  text           TEXT,                          -- текст сообщения
  media_url      TEXT,                          -- опционально
  file_name      TEXT,
  scheduled_at   INTEGER NOT NULL,              -- unix ms когда отправить
  status         TEXT NOT NULL DEFAULT 'pending',  -- pending | sent | failed | cancelled
  error          TEXT,                           -- если failed
  sent_message_id TEXT,                          -- idMessage от Green-API после отправки
  created_by     TEXT NOT NULL,                  -- uid сотрудника
  created_at     INTEGER NOT NULL,
  sent_at        INTEGER
);
CREATE INDEX IF NOT EXISTS idx_wa_sch_status_at ON wa_scheduled_messages(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_wa_sch_chat ON wa_scheduled_messages(chat_id, status);
