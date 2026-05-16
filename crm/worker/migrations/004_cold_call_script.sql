-- 004_cold_call_script.sql
-- Cold-call scripts, campaigns, queue and logs for CRM calls.

PRAGMA foreign_keys = ON;

-- Lookup table for allowed outcomes (enum in DB, not in app code)
CREATE TABLE IF NOT EXISTS call_outcomes (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  funnel_stage TEXT NOT NULL, -- dialed | qualified | meeting_booked | closed
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS call_scripts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS call_script_stages (
  id TEXT PRIMARY KEY,
  script_id TEXT NOT NULL REFERENCES call_scripts(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  goal TEXT,
  script_text TEXT NOT NULL,
  tip TEXT,
  whatsapp_template TEXT,
  is_terminal INTEGER NOT NULL DEFAULT 0,
  UNIQUE(script_id, order_index),
  UNIQUE(script_id, code)
);

CREATE TABLE IF NOT EXISTS call_script_transitions (
  id TEXT PRIMARY KEY,
  stage_id TEXT NOT NULL REFERENCES call_script_stages(id) ON DELETE CASCADE,
  trigger_label TEXT NOT NULL,
  next_stage_code TEXT,
  outcome TEXT,
  order_index INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS call_script_objections (
  id TEXT PRIMARY KEY,
  stage_id TEXT NOT NULL REFERENCES call_script_stages(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  order_index INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS call_campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  script_id TEXT NOT NULL REFERENCES call_scripts(id),
  source_id TEXT REFERENCES customer_sources(id),
  created_by TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  status TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS call_logs (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES call_campaigns(id),
  customer_id TEXT NOT NULL REFERENCES customers(id),
  caller_id TEXT NOT NULL REFERENCES users(id),
  started_at INTEGER NOT NULL,
  ended_at INTEGER,
  final_stage_code TEXT,
  outcome TEXT,
  meeting_at INTEGER,
  notes TEXT,
  duration_seconds INTEGER
);

CREATE INDEX IF NOT EXISTS idx_call_logs_campaign ON call_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_customer ON call_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_caller ON call_logs(caller_id);

CREATE TABLE IF NOT EXISTS call_assignments (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES call_campaigns(id),
  customer_id TEXT NOT NULL REFERENCES customers(id),
  caller_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending',
  UNIQUE(campaign_id, customer_id)
);

CREATE INDEX IF NOT EXISTS idx_call_assignments_campaign_caller_status
  ON call_assignments(campaign_id, caller_id, status);

INSERT OR IGNORE INTO call_outcomes (code, label, funnel_stage, order_index, is_active) VALUES
  ('meeting_booked', 'Встреча назначена', 'meeting_booked', 10, 1),
  ('callback', 'Перезвон', 'dialed', 20, 1),
  ('rejected', 'Отказ', 'dialed', 30, 1),
  ('no_answer', 'Не ответил', 'dialed', 40, 1),
  ('wrong_number', 'Неверный номер', 'dialed', 50, 1),
  ('qualified_pending', 'Квалифицирован, ждёт решение', 'qualified', 60, 1),
  ('closed', 'Сделка закрыта', 'closed', 70, 1);
