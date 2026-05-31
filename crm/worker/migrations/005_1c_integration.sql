-- 1С:Фреш OData integration
-- Tenant-aware tables for the multi-tenant CRM.
-- Pilot: tenant_id = 'aminamed', target БП 3.0 для Казахстана (1С-Рейтинг) at
-- https://1cfresh.kz/a/ea186/263825/odata/standard.odata/

CREATE TABLE IF NOT EXISTS one_c_settings (
  tenant_id TEXT PRIMARY KEY,
  host TEXT NOT NULL,                          -- e.g. https://1cfresh.kz
  base_path TEXT NOT NULL,                     -- e.g. /a/ea186/263825
  odata_username TEXT NOT NULL,                -- технический пользователь 1С (например odata.user)
  odata_password_encrypted TEXT NOT NULL,      -- base64(iv|ciphertext), AES-GCM, ключ из env.ONE_C_ENCRYPTION_KEY
  config_type TEXT,                            -- 'БП' / 'УТ' / 'КА' / 'УНФ'
  config_version TEXT,                         -- '3.0.71.1'
  enabled INTEGER NOT NULL DEFAULT 1,
  last_sync_at INTEGER,                        -- unix seconds, последняя успешная синхронизация любого объекта
  last_test_at INTEGER,                        -- unix seconds, последний test-connection
  last_test_ok INTEGER,                        -- 0/1, результат последнего test-connection
  last_test_error TEXT,                        -- текст последней ошибки коннекта (если есть)
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS one_c_id_map (
  tenant_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,                   -- 'contractor', 'product', 'order', 'invoice', 'realization', 'payment'
  pllato_id TEXT NOT NULL,                     -- наш ID на стороне Pllato (uuid или D1 PK)
  one_c_ref_key TEXT NOT NULL,                 -- GUID 1С (Ref_Key)
  one_c_data_version TEXT,                     -- DataVersion для дельта-синхронизации
  synced_at INTEGER NOT NULL,
  PRIMARY KEY (tenant_id, entity_type, pllato_id)
);

CREATE INDEX IF NOT EXISTS idx_one_c_id_map_ref
  ON one_c_id_map(tenant_id, entity_type, one_c_ref_key);

CREATE TABLE IF NOT EXISTS one_c_sync_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  ts INTEGER NOT NULL,                         -- unix seconds
  direction TEXT NOT NULL,                     -- 'pull' / 'push' / 'test'
  entity_type TEXT NOT NULL,
  operation TEXT NOT NULL,                     -- 'read', 'create', 'update', 'post', 'test_connection'
  status TEXT NOT NULL,                        -- 'ok', 'error', 'partial'
  http_status INTEGER,
  error_code TEXT,
  error_message TEXT,
  records_processed INTEGER,
  duration_ms INTEGER
);

CREATE INDEX IF NOT EXISTS idx_one_c_sync_log_tenant_ts
  ON one_c_sync_log(tenant_id, ts DESC);
