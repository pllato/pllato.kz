-- ════════════════════════════════════════════════════════════════════════
-- Миграция legacy Bitrix-чатов (group_chats / chat_messages) в новую
-- систему team_chat_*. Id-префикс 'legacy_' чтобы не конфликтовать с UUID
-- новых каналов. Membership выводится из distinct sender_firebase_uid.
-- ════════════════════════════════════════════════════════════════════════

-- 1. Каналы: group_chats → team_chat_channels
INSERT INTO team_chat_channels (id, type, name, created_by, created_at, archived_at)
SELECT
  'legacy_' || gc.id,
  'channel',
  COALESCE(gc.title, 'Без названия'),
  COALESCE(gc.owner_firebase_uid, 'migrated'),
  COALESCE(CAST(strftime('%s', gc.bitrix_date_create) AS INTEGER) * 1000, 0),
  NULL
FROM group_chats gc
WHERE NOT EXISTS (SELECT 1 FROM team_chat_channels tcc WHERE tcc.id = 'legacy_' || gc.id);

-- 2. Members: уникальные отправители каждого канала
INSERT OR IGNORE INTO team_chat_members (channel_id, user_id, joined_at)
SELECT
  'legacy_' || cm.chat_id,
  cm.sender_firebase_uid,
  COALESCE(CAST(strftime('%s', MIN(cm.date)) AS INTEGER) * 1000, 0)
FROM chat_messages cm
WHERE cm.sender_firebase_uid IS NOT NULL
  AND cm.sender_firebase_uid != ''
  AND EXISTS (SELECT 1 FROM team_chat_channels WHERE id = 'legacy_' || cm.chat_id)
GROUP BY cm.chat_id, cm.sender_firebase_uid;

-- 3. Сообщения: chat_messages → team_chat_msgs
-- Только с непустым sender_firebase_uid (иначе нарушит FK логику).
INSERT OR IGNORE INTO team_chat_msgs (id, channel_id, user_id, text, type, created_at)
SELECT
  'legacy_' || cm.id,
  'legacy_' || cm.chat_id,
  cm.sender_firebase_uid,
  cm.text,
  'text',
  COALESCE(CAST(strftime('%s', cm.date) AS INTEGER) * 1000, 0)
FROM chat_messages cm
WHERE cm.sender_firebase_uid IS NOT NULL
  AND cm.sender_firebase_uid != ''
  AND cm.text IS NOT NULL
  AND cm.text != ''
  AND EXISTS (SELECT 1 FROM team_chat_channels WHERE id = 'legacy_' || cm.chat_id);
