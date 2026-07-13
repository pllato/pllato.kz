-- Схема D1 для HR-панели (pllato-hr-d1).
-- Применить: wrangler d1 execute pllato-hr-d1 --remote --file=schema.sql

CREATE TABLE IF NOT EXISTS candidates (
  id          TEXT PRIMARY KEY,     -- контрольная сумма кода результата
  fam         TEXT,                 -- семейство должностей
  name        TEXT,
  fit         INTEGER,              -- Fit Score (для сортировки/списка)
  decision    TEXT,                 -- hire | reserve | reject | null
  data        TEXT NOT NULL,        -- полная запись evaluation (JSON)
  updated_at  TEXT,
  updated_by  TEXT
);
CREATE INDEX IF NOT EXISTS idx_candidates_fam ON candidates(fam);

CREATE TABLE IF NOT EXISTS settings (
  id          TEXT PRIMARY KEY,     -- 'global'
  data        TEXT NOT NULL,        -- JSON настроек (веса, пороги, ключи SJT)
  updated_at  TEXT,
  updated_by  TEXT
);
