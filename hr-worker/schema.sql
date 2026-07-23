-- pllato-hr-d1 — воронка найма.
CREATE TABLE IF NOT EXISTS submissions (
  id           TEXT PRIMARY KEY,   -- телефон_должность (повторное прохождение обновляет)
  name         TEXT,
  phone        TEXT,
  fam          TEXT,               -- должность (manager|itr|sales|worker)
  kp           TEXT,               -- профиль профзнаний (для ИТР)
  status       TEXT,               -- 'passed' | 'failed' (по порогам, оценка кандидатом)
  fit          INTEGER,            -- Fit Score на момент отправки
  code         TEXT,               -- полный код-результат HR1 (источник для разбора в панели)
  decision     TEXT,               -- решение ответственного: hire|reserve|reject
  notes        TEXT,               -- заметки ответственного
  interview    TEXT,               -- JSON оценок собеседования (BARS)
  submitted_at TEXT,
  updated_at   TEXT,
  updated_by   TEXT
);
CREATE INDEX IF NOT EXISTS idx_sub_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_sub_fam ON submissions(fam);

CREATE TABLE IF NOT EXISTS settings (
  id         TEXT PRIMARY KEY,      -- 'global'
  data       TEXT NOT NULL,
  updated_at TEXT
);
