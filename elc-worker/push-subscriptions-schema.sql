-- ════════════════════════════════════════════════════════════════════════
-- Web Push подписки: по одной строке на устройство/браузер сотрудника.
-- Фронт (team.html) подписывается через PushManager и POST'ит сюда endpoint
-- + ключи (p256dh/auth). Воркер шлёт зашифрованный пуш на endpoint при
-- createNotification(). 410/404 от push-сервиса → строка удаляется (протухла).
-- Аддитивно: только CREATE TABLE IF NOT EXISTS — безопасно для прод-базы.
-- ════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          TEXT PRIMARY KEY,        -- ps_<хэш endpoint> (детерминированный — дедуп на одно устройство)
  uid         TEXT NOT NULL,           -- владелец (canonicalUid)
  endpoint    TEXT NOT NULL,           -- URL push-сервиса (fcm/mozilla/apple)
  p256dh      TEXT NOT NULL,           -- публичный ключ клиента (base64url)
  auth        TEXT NOT NULL,           -- auth-секрет клиента (base64url)
  ua          TEXT,                    -- User-Agent (для отладки/чистки)
  created_at  INTEGER NOT NULL,        -- ms epoch
  last_ok_at  INTEGER                  -- когда последний пуш ушёл успешно
);
CREATE INDEX IF NOT EXISTS idx_push_uid ON push_subscriptions(uid);
CREATE UNIQUE INDEX IF NOT EXISTS idx_push_endpoint ON push_subscriptions(endpoint);
