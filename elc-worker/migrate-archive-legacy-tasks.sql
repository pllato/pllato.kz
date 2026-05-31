-- ════════════════════════════════════════════════════════════════════════
-- Архивация legacy Bitrix-задач.
-- Юзер: «1000 дел из битрикса висят в активных, перенесём в архив, если
-- что — оттуда достанем, сейчас по новой все дела ведём».
-- ════════════════════════════════════════════════════════════════════════

-- 1. Добавляем колонку (если ещё нет — IF NOT EXISTS не поддерживается
--    в SQLite ALTER, поэтому игнорируем ошибку через отдельный запуск)
ALTER TABLE tasks ADD COLUMN archived_at INTEGER;

-- 2. Архивируем все задачи которые пришли из Bitrix (имеют bitrix_id)
--    Новые task'и через CRM пока не создаются — но если будут, у них
--    bitrix_id=NULL и они не подцепятся под этот UPDATE.
UPDATE tasks
SET archived_at = strftime('%s', 'now') * 1000
WHERE bitrix_id IS NOT NULL AND archived_at IS NULL;

-- 3. Индекс для быстрых WHERE archived_at IS NULL
CREATE INDEX IF NOT EXISTS idx_tasks_archived_at ON tasks(archived_at);
