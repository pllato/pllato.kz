-- Отменяем архивацию Bitrix-задач: они должны быть видны в «Задачи».
-- «Дела» в новой архитектуре — task с crm_links содержащим 'deal_'.
UPDATE tasks SET archived_at = NULL WHERE archived_at IS NOT NULL;
