-- ── ELC CRM D1 schema v1 ─────────────────────────────────
-- Mirrors Firebase RTDB structure from team.html;
-- JSON columns for custom fields, nested arrays, and rare attributes.
-- Messages (group chats, openlines, timeline) normalized into separate tables.

PRAGMA foreign_keys = ON;

-- ── Companies ────────────────────────────────────────────
CREATE TABLE companies (
  id                     TEXT PRIMARY KEY,
  title                  TEXT NOT NULL,
  company_type           TEXT,
  industry               TEXT,
  employees              TEXT,
  revenue                INTEGER DEFAULT 0,
  currency               TEXT DEFAULT 'KZT',
  comments               TEXT,
  opened                 INTEGER NOT NULL DEFAULT 1,
  responsible_uid        TEXT,
  created_by_uid         TEXT,
  modify_by_uid          TEXT,
  bitrix_id              TEXT,
  bitrix_created_by_id   TEXT,
  bitrix_responsible_id  TEXT,
  bitrix_date_create     TEXT,
  bitrix_date_modify     TEXT,
  phones                 TEXT,         -- JSON array [{type,value}]
  migrated_at            TEXT
);
CREATE INDEX idx_companies_bitrix      ON companies(bitrix_id);
CREATE INDEX idx_companies_responsible ON companies(responsible_uid);

-- ── Contacts ─────────────────────────────────────────────
CREATE TABLE contacts (
  id                     TEXT PRIMARY KEY,
  name                   TEXT NOT NULL,
  second_name            TEXT,
  last_name              TEXT NOT NULL,
  position               TEXT,
  honorific              TEXT,
  birthdate              TEXT,
  comments               TEXT,
  type                   TEXT,
  source_id              TEXT,
  source_description     TEXT,
  lead_id                TEXT,
  company_id             TEXT,
  responsible_uid        TEXT,
  created_by_uid         TEXT,
  modify_by_uid          TEXT,
  opened                 INTEGER NOT NULL DEFAULT 1,
  export                 INTEGER NOT NULL DEFAULT 0,
  bitrix_id              TEXT,
  bitrix_company_id      TEXT,
  bitrix_created_by_id   TEXT,
  bitrix_responsible_id  TEXT,
  bitrix_date_create     TEXT,
  bitrix_date_modify     TEXT,
  emails                 TEXT,         -- JSON array
  phones                 TEXT,         -- JSON array
  messengers             TEXT,         -- JSON array
  websites               TEXT,         -- JSON array
  custom_fields          TEXT,         -- JSON object {UF_CRM_*: value}
  migrated_at            TEXT
);
CREATE INDEX idx_contacts_bitrix      ON contacts(bitrix_id);
CREATE INDEX idx_contacts_responsible ON contacts(responsible_uid);
CREATE INDEX idx_contacts_company     ON contacts(company_id);
CREATE INDEX idx_contacts_name        ON contacts(last_name, name);

-- ── Pipelines ────────────────────────────────────────────
CREATE TABLE pipelines (
  id                  TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  is_active           INTEGER DEFAULT 1,
  bitrix_category_id  INTEGER,
  stages              TEXT,             -- JSON {stageId: {name, sort, ...}}
  stages_count        INTEGER,
  migrated_at         TEXT
);

-- ── Deals ────────────────────────────────────────────────
CREATE TABLE deals (
  id                     TEXT PRIMARY KEY,
  title                  TEXT NOT NULL,
  opportunity            REAL DEFAULT 0,
  currency               TEXT DEFAULT 'KZT',
  pipeline_id            TEXT NOT NULL,
  stage_id               TEXT NOT NULL,
  closed                 INTEGER NOT NULL DEFAULT 0,
  begin_date             TEXT,
  close_date             TEXT,
  comments               TEXT,
  contact_id             TEXT,
  company_id             TEXT,
  responsible_uid        TEXT,
  created_by_uid         TEXT,
  modify_by_uid          TEXT,
  source_id              TEXT,
  source_description     TEXT,
  bitrix_id              TEXT,
  bitrix_category_id     INTEGER,
  bitrix_contact_id      TEXT,
  bitrix_company_id      TEXT,
  bitrix_created_by_id   TEXT,
  bitrix_responsible_id  TEXT,
  bitrix_date_create     TEXT,
  bitrix_date_modify     TEXT,
  custom_fields          TEXT,         -- JSON
  migrated_at            TEXT,
  archived               INTEGER NOT NULL DEFAULT 0,
  archived_at            TEXT,
  archived_by            TEXT,
  reject_reason          TEXT          -- NULL для не-отказов; для stage_id='REJECT' одно из:
                                       -- NOT_INTERESTED|WRONG_CITY|DISCONNECTED|WANTED_ONLINE|INVALID_NUMBER
);
CREATE INDEX idx_deals_pipeline_stage ON deals(pipeline_id, stage_id);
CREATE INDEX idx_deals_archived       ON deals(archived);
CREATE INDEX idx_deals_reject_reason  ON deals(reject_reason);
CREATE INDEX idx_deals_contact        ON deals(contact_id);
CREATE INDEX idx_deals_company        ON deals(company_id);
CREATE INDEX idx_deals_responsible    ON deals(responsible_uid);
CREATE INDEX idx_deals_bitrix         ON deals(bitrix_id);
CREATE INDEX idx_deals_closed         ON deals(closed);

-- ── Tasks ────────────────────────────────────────────────
CREATE TABLE tasks (
  id                          TEXT PRIMARY KEY,
  title                       TEXT NOT NULL,
  description                 TEXT,
  status                      INTEGER NOT NULL,
  priority                    INTEGER,
  deadline                    TEXT,
  start_date_plan             TEXT,
  end_date_plan               TEXT,
  parent_id                   TEXT,
  group_id                    TEXT,
  stage_id                    TEXT,
  responsible_uid             TEXT,
  created_by_uid              TEXT,
  changed_by_uid              TEXT,
  task_control                INTEGER DEFAULT 0,
  add_in_report               INTEGER DEFAULT 0,
  allow_change_deadline       INTEGER DEFAULT 1,
  time_estimate               INTEGER DEFAULT 0,
  time_spent                  INTEGER DEFAULT 0,
  mark                        TEXT,
  has_files                   INTEGER DEFAULT 0,
  files_migrated              INTEGER DEFAULT 0,
  comments_count              INTEGER DEFAULT 0,
  comments_actual_count       INTEGER DEFAULT 0,
  comments_migrated           INTEGER DEFAULT 0,
  comments_migration_failed   INTEGER DEFAULT 0,
  comments_migration_error    TEXT,
  bitrix_id                   TEXT,
  bitrix_parent_id            TEXT,
  bitrix_created_by           TEXT,
  bitrix_responsible_id       TEXT,
  bitrix_created_date         TEXT,
  bitrix_closed_date          TEXT,
  bitrix_changed_date         TEXT,
  bitrix_status_changed_date  TEXT,
  accomplices                 TEXT,    -- JSON array
  auditors                    TEXT,    -- JSON array
  comments_data               TEXT,    -- JSON (если был как dict в RTDB)
  crm_links                   TEXT,    -- JSON
  bitrix_crm_links            TEXT,    -- JSON
  bitrix_file_ids             TEXT,    -- JSON
  migrated_at                 TEXT
);
CREATE INDEX idx_tasks_responsible ON tasks(responsible_uid);
CREATE INDEX idx_tasks_status      ON tasks(status);
CREATE INDEX idx_tasks_parent      ON tasks(parent_id);
CREATE INDEX idx_tasks_group       ON tasks(group_id);
CREATE INDEX idx_tasks_bitrix      ON tasks(bitrix_id);
CREATE INDEX idx_tasks_deadline    ON tasks(deadline);

-- ── Timeline activities ──────────────────────────────────
-- В RTDB лежали как timeline.{owner_id}.{activity_id}.{...}
-- Разворачиваем в плоскую таблицу с owner_type+owner_id
CREATE TABLE timeline_activities (
  id                    TEXT PRIMARY KEY,    -- activity_XXXX
  owner_type            TEXT NOT NULL,       -- deal | contact | company | task
  owner_id              TEXT NOT NULL,
  activity_type         TEXT,
  author_uid            TEXT,
  bitrix_author_id      TEXT,
  bitrix_id             TEXT,
  bitrix_created        TEXT,
  bitrix_last_updated   TEXT,
  payload               TEXT,                -- JSON со всем остальным
  created_at            TEXT
);
CREATE INDEX idx_timeline_owner  ON timeline_activities(owner_type, owner_id);
CREATE INDEX idx_timeline_author ON timeline_activities(author_uid);
CREATE INDEX idx_timeline_bitrix ON timeline_activities(bitrix_id);

-- ── Users (синхронизированы с Firebase Auth по uid) ──────
CREATE TABLE users (
  uid                  TEXT PRIMARY KEY,    -- Firebase Auth uid
  email                TEXT NOT NULL,
  name                 TEXT NOT NULL,
  last_name            TEXT,
  position             TEXT,
  phone                TEXT,                -- личный телефон сотрудника (редактируется в Настройках)
  photo                TEXT,
  active               INTEGER NOT NULL DEFAULT 1,
  bitrix_id            TEXT,
  created_from_bitrix  INTEGER DEFAULT 0,
  department           TEXT,                -- JSON
  binotel_line         TEXT,
  apps                 TEXT,                -- JSON
  last_login           TEXT,
  provider             TEXT,
  photo_url            TEXT,
  migrated_at          TEXT
);
CREATE INDEX idx_users_email  ON users(email);
CREATE INDEX idx_users_bitrix ON users(bitrix_id);

-- ── Group chats: header + сообщения отдельной таблицей ──
CREATE TABLE group_chats (
  id                   TEXT PRIMARY KEY,    -- bitrixChatId
  title                TEXT NOT NULL,
  avatar               TEXT,
  color                TEXT,
  member_count         INTEGER DEFAULT 0,
  message_count        INTEGER DEFAULT 0,
  last_message_text    TEXT,
  bitrix_date_create   TEXT,
  bitrix_date_message  TEXT,
  owner_bitrix_id      TEXT,
  owner_firebase_uid   TEXT,
  migration_status     TEXT,
  last_migrated_at     TEXT,
  added_at             TEXT
);

CREATE TABLE chat_messages (
  chat_id              TEXT NOT NULL,
  id                   TEXT NOT NULL,       -- msg_XXX
  bitrix_message_id    TEXT,
  sender_id            TEXT,
  sender_firebase_uid  TEXT,
  sender_name          TEXT,
  text                 TEXT,
  date                 TEXT,
  raw_params           TEXT,                -- JSON
  PRIMARY KEY (chat_id, id)
);
CREATE INDEX idx_chat_messages_date ON chat_messages(chat_id, date);

-- ── Openlines (Bitrix open channels archive) ─────────────
CREATE TABLE openlines_sessions (
  id                       TEXT PRIMARY KEY,
  subject                  TEXT,
  provider                 TEXT,
  user_code                TEXT,
  owner_type               TEXT,
  owner_key                TEXT,
  responsible_uid          TEXT,
  message_count            INTEGER DEFAULT 0,
  first_message_at         TEXT,
  last_message_at          TEXT,
  bitrix_session_id        TEXT,
  bitrix_chat_id           TEXT,
  bitrix_activity_id       TEXT,
  bitrix_owner_id          TEXT,
  bitrix_owner_type        TEXT,
  bitrix_provider_type_id  TEXT,
  bitrix_responsible_id    TEXT,
  bitrix_created           TEXT,
  users                    TEXT,            -- JSON
  migrated_at              TEXT
);
CREATE INDEX idx_ol_owner ON openlines_sessions(owner_type, owner_key);

CREATE TABLE openlines_messages (
  session_id  TEXT NOT NULL,
  id          TEXT NOT NULL,
  payload     TEXT NOT NULL,                -- JSON со всеми полями
  PRIMARY KEY (session_id, id)
);

-- ── Custom fields schema (UF_CRM_*) ──────────────────────
CREATE TABLE custom_fields_schema (
  entity_type  TEXT NOT NULL,               -- deal | contact | company
  field_name   TEXT NOT NULL,               -- UF_CRM_xxx
  label        TEXT,
  data_type    TEXT,                        -- string|enumeration|date|...
  mandatory    INTEGER DEFAULT 0,
  multiple     INTEGER DEFAULT 0,
  sort         INTEGER DEFAULT 100,
  list         TEXT,                        -- JSON для enum вариантов
  PRIMARY KEY (entity_type, field_name)
);

-- ── KV store (admin_emails, migrationCache, userMapping, taskReadState) ──
CREATE TABLE kv (
  k   TEXT PRIMARY KEY,
  v   TEXT                                  -- JSON value
);

-- ── Files queue (мигрированные файлы из Bitrix24 disk в R2) ──
-- Заполняется migration-скриптом (см. elc-worker/scripts/migrate_files.mjs).
-- Worker /api/files/{id} читает по id, отдаёт object из R2 bucket FILES.
-- frontend (loadFilesIntoContainer) видит { fileName, fileSize, contentType,
-- migrated, permanentlyFailed } и рендерит кнопку «Скачать» или сообщение об ошибке.
CREATE TABLE files_queue (
  id                   TEXT PRIMARY KEY,    -- Bitrix file ID
  file_name            TEXT,
  file_size            INTEGER,
  content_type         TEXT,
  r2_key               TEXT,                -- ключ объекта в R2 bucket
  migrated             INTEGER DEFAULT 0,   -- 1 если успешно залит в R2
  permanently_failed   INTEGER DEFAULT 0,   -- 1 если не удалось скачать
  error_message        TEXT,
  bitrix_download_url  TEXT,                -- оригинальная ссылка для retry
  created_at           TEXT DEFAULT CURRENT_TIMESTAMP,
  migrated_at          TEXT
);
CREATE INDEX idx_files_queue_migrated ON files_queue(migrated);

-- ── User roles (admin/manager/agent) ────────────────────
-- Заполняется при назначении ролей админом. Платон (uurraa@gmail.com) —
-- admin hardcoded в worker fallback'е, на случай если запись потеряется.
-- При отсутствии записи юзер считается 'agent' (видит только свои).
CREATE TABLE user_roles (
  uid          TEXT PRIMARY KEY,   -- canonical uid (из users.uid, найден по email)
  role         TEXT NOT NULL DEFAULT 'agent',  -- admin | manager | agent
  department   TEXT,               -- для будущего manager-уровня (видит свой отдел)
  granted_by   TEXT,
  granted_at   TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- ── Call log (исходящие/входящие звонки) ────────────────
-- Заполняется фронтом через POST /api/call/event при начале/окончании звонка.
-- Provider пока 'tel-link' (заглушка через OS dialer), будет SIP-провайдер
-- когда выберем Binotel/Voximplant/etc.
CREATE TABLE call_log (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  caller_uid       TEXT NOT NULL,             -- Firebase uid пользователя
  direction        TEXT NOT NULL,             -- 'out' | 'in'
  phone            TEXT NOT NULL,             -- номер другой стороны
  contact_id       TEXT,                      -- contact_X если опознан
  deal_id          TEXT,                      -- deal_X если из карточки сделки
  started_at       TEXT NOT NULL,
  ended_at         TEXT,
  duration_sec     INTEGER,
  status           TEXT,                      -- connected | no_answer | busy | failed | cancelled | attempted
  recording_url    TEXT,
  recording_r2_key TEXT,
  provider         TEXT,                      -- binotel | voximplant | tel-link | etc
  note             TEXT,
  created_at       TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_call_log_contact ON call_log(contact_id, started_at);
CREATE INDEX idx_call_log_deal    ON call_log(deal_id, started_at);
CREATE INDEX idx_call_log_caller  ON call_log(caller_uid, started_at);
CREATE INDEX idx_call_log_phone   ON call_log(phone, started_at);

-- ── Migration state (опционально, для аудита) ───────────
CREATE TABLE migration_log (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  source_file     TEXT,
  collection      TEXT,
  rows_inserted   INTEGER,
  duration_ms     INTEGER,
  started_at      TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ── Audit log (Phase Roles 5) ───────────────────────────
-- Кто что менял. Worker пишет туда при:
--   role_grant — изменение роли через /api/admin/user-roles/{uid}
--   user_create — admin создал нового сотрудника
--   user_deactivate / user_activate — soft delete / restore
--   record_patch — изменение deal/task/contact через handleRtdbWrite
--   record_delete — удаление через handleRtdbDelete
-- Не пишем при чтениях и при системных sync'ах.
CREATE TABLE audit_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_uid     TEXT NOT NULL,        -- кто сделал (canonical uid)
  actor_email   TEXT,                 -- денормализовано для удобства показа
  action        TEXT NOT NULL,        -- role_grant | user_create | user_deactivate | record_patch | record_delete
  target_type   TEXT,                 -- 'user' | 'deal' | 'task' | 'contact' | 'pipeline' | etc
  target_id     TEXT,                 -- uid юзера или id записи
  meta          TEXT,                 -- JSON: { old: {...}, new: {...} } или произвольное
  created_at    TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_audit_actor    ON audit_log(actor_uid, created_at);
CREATE INDEX idx_audit_target   ON audit_log(target_type, target_id, created_at);
CREATE INDEX idx_audit_action   ON audit_log(action, created_at);

-- ── WhatsApp Green-API (Phase WA 1) ──────────────────────
-- Канал = один Green-API instance. Реквизиты в D1 (а не в Worker Secrets) —
-- admin может пере-привязать инстанс без редеплоя.
CREATE TABLE wa_channels (
  id                    TEXT PRIMARY KEY,
  id_instance           TEXT NOT NULL UNIQUE,
  api_url               TEXT DEFAULT 'https://api.green-api.com',
  api_token_instance    TEXT NOT NULL,
  webhook_token         TEXT,                -- query-token для входящих
  display_name          TEXT,
  active                INTEGER DEFAULT 1,
  default_pipeline_id   TEXT,                -- куда автосоздавать сделки из incoming
  default_stage_id      TEXT,
  responsible_uid       TEXT,                -- кому назначить новые сделки
  created_at            TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at            TEXT
);

-- Чаты — header (один на номер/группу). last_message_at используется для
-- сортировки в списке и подъёма сделки в канбане при incoming.
CREATE TABLE wa_chats (
  id                    TEXT PRIMARY KEY,    -- wa:{instance}:{chatId}
  instance_id           TEXT NOT NULL,
  chat_id               TEXT NOT NULL,        -- 77011239999@c.us
  phone                 TEXT,
  is_group              INTEGER DEFAULT 0,
  name                  TEXT,
  contact_id            TEXT,                 -- contact_X
  deal_id               TEXT,                 -- последняя открытая сделка
  last_message_text     TEXT,
  last_message_at       INTEGER,              -- ms
  last_message_from     TEXT,                 -- 'me'|'them'
  last_read_at          INTEGER,
  unread_count          INTEGER DEFAULT 0,
  created_at            TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at            TEXT
);
CREATE INDEX idx_wa_chats_instance     ON wa_chats(instance_id);
CREATE INDEX idx_wa_chats_phone        ON wa_chats(phone);
CREATE INDEX idx_wa_chats_contact      ON wa_chats(contact_id);
CREATE INDEX idx_wa_chats_deal         ON wa_chats(deal_id);
CREATE INDEX idx_wa_chats_last_msg     ON wa_chats(last_message_at DESC);

-- Сообщения — append-only, ts в ms.
CREATE TABLE wa_messages (
  id                    TEXT PRIMARY KEY,    -- wa:{instance}:{waMessageId}
  chat_id               TEXT NOT NULL,        -- → wa_chats.id
  wa_message_id         TEXT,
  direction             TEXT NOT NULL,        -- 'in'|'out'
  text                  TEXT,
  media_kind            TEXT,                 -- image|video|audio|document
  media_url             TEXT,
  media_file_name       TEXT,
  media_mime_type       TEXT,
  caption               TEXT,
  ts                    INTEGER NOT NULL,
  created_at            TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_wa_messages_chat      ON wa_messages(chat_id, ts DESC);
CREATE INDEX idx_wa_messages_ts        ON wa_messages(ts DESC);

-- ─────────────────────────────────────────────────────────────────────────
-- Системный WhatsApp-оповещатель (portal notifier).
-- Отдельный Green-API инстанс (НЕ из wa_channels), который шлёт системные
-- уведомления сотрудникам в личный WhatsApp (users.phone): новые сообщения в
-- чатах, звонки, задачи, приглашения, доступ к порталу и т.д.
-- Синглтон: всегда одна строка id = 1. Хранится отдельно от wa_channels,
-- чтобы входящий webhook и «первый активный канал» (fallback исходящих) НИКОГДА
-- не подхватили его как inbox-канал клиентов.
CREATE TABLE wa_notifier (
  id                    INTEGER PRIMARY KEY CHECK (id = 1),  -- синглтон
  id_instance           TEXT,
  api_url               TEXT DEFAULT 'https://api.green-api.com',
  api_token_instance    TEXT,
  display_name          TEXT DEFAULT 'Портал-оповещатель',
  active                INTEGER DEFAULT 0,
  events_json           TEXT,                 -- JSON map { eventKey: true|false }
  portal_url            TEXT DEFAULT 'https://pllato.kz/team.html',
  created_at            TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at            TEXT
);

-- Лог отправленных системных уведомлений (диагностика + защита от спама).
CREATE TABLE notify_log (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  uid                   TEXT,                 -- получатель (сотрудник)
  phone                 TEXT,
  event                 TEXT,                 -- ключ события
  text                  TEXT,
  link                  TEXT,
  status                TEXT,                 -- 'sent'|'failed'|'skipped'
  error                 TEXT,
  wa_message_id         TEXT,
  created_at            TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_notify_log_created    ON notify_log(created_at DESC);
CREATE INDEX idx_notify_log_uid        ON notify_log(uid, created_at DESC);
