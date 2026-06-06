-- Приглашения новых сотрудников в команду.
-- Ресепшн создаёт invite → WA-ссылка → юзер Google-логинится → попадает в систему
-- с заранее назначенным отделом + ролью.
CREATE TABLE IF NOT EXISTS team_invites (
  token            TEXT PRIMARY KEY,            -- секретная строка в URL
  phone            TEXT NOT NULL,                -- WhatsApp куда отправлен invite
  email            TEXT,                          -- (опц.) ожидаемый Gmail; пусто = принимаем любой Google-аккаунт
  name             TEXT,                          -- имя сотрудника (вводит пригласивший)
  dept_path        TEXT NOT NULL,                -- path в org-tree (branches.0.departments.1)
  head_uid         TEXT,                          -- uid руководителя (для отображения)
  role             TEXT NOT NULL DEFAULT 'agent', -- роль которая будет назначена
  invited_by       TEXT NOT NULL,                -- uid создателя
  wa_message_id    TEXT,                          -- id отправленного WA для трекинга
  status           TEXT NOT NULL DEFAULT 'pending',  -- pending | accepted | revoked | expired
  accepted_uid     TEXT,                          -- Firebase uid принявшего
  created_at       INTEGER NOT NULL,
  expires_at       INTEGER NOT NULL,             -- 7 дней дефолт
  accepted_at      INTEGER
);
CREATE INDEX IF NOT EXISTS idx_team_invites_email  ON team_invites(email);
CREATE INDEX IF NOT EXISTS idx_team_invites_phone  ON team_invites(phone);
CREATE INDEX IF NOT EXISTS idx_team_invites_status ON team_invites(status);
