-- ОЧИСТКА ПЕРЕД GO-LIVE — стереть тест-данные, оставить конфиг.
-- Нужен ТОЛЬКО если разворачиваете базу клиента КОПИЕЙ нашей D1.
-- Если база создана из schema.sql — она уже чистая, этот файл НЕ нужен.
-- Применение (осознанно!): wrangler d1 execute <DB> --remote --file=docs/cleanup-go-live.sql
-- ⚠️ Необратимо. Сначала бэкап: wrangler d1 export <DB> --remote --output=backup.sql

-- === 1. Транзакционные данные CRM (тестовые сделки/заказы/звонки/чаты) ===
DELETE FROM deals;
DELETE FROM orders;
DELETE FROM calls;
DELETE FROM doctor_cashback;
DELETE FROM clients;          -- локальные CRM-клиенты (авто-лиды/тест); контрагенты 1С — в зеркале
DELETE FROM threads;
DELETE FROM messages;
DELETE FROM outbox;
DELETE FROM order_log;
DELETE FROM subscriptions;
DELETE FROM tasks;
DELETE FROM invites;
DELETE FROM audit;

-- === 2. (ОПЦ.) Тестовый маркетинг — если промокоды/акции/блогеры заводились для теста ===
-- DELETE FROM promos;
-- DELETE FROM actions;
-- DELETE FROM bloggers;
-- DELETE FROM blogger_payouts;
-- DELETE FROM card_type_edits;

-- === 3. (ОПЦ.) Зеркало 1С — очистить, чтобы пересобралось синком с боевой ===
-- (если переключаете на другую базу 1С; иначе синк сам обновит)
-- DELETE FROM s1c_products; DELETE FROM s1c_contractors; DELETE FROM s1c_sales;
-- DELETE FROM s1c_prices; DELETE FROM s1c_stock; DELETE FROM s1c_bonus;
-- DELETE FROM s1c_cards; DELETE FROM s1c_card_types; DELETE FROM s1c_categories;
-- DELETE FROM s1c_orgs; DELETE FROM s1c_persons; DELETE FROM s1c_price_types;
-- DELETE FROM s1c_stores; DELETE FROM s1c_users; DELETE FROM s1c_checks; DELETE FROM s1c_sync_log;

-- ОСТАЁТСЯ (конфиг, не трогаем): app_settings (воронки/этапы/настройки),
-- roles (права), channels (номера WhatsApp), task_columns, users (учётки сотрудников).
