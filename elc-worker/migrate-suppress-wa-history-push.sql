-- Reconnecting WhatsApp can restore thousands of chat shells without messages.
-- These are not new inbound leads. Keep the recovered deals, but suppress their
-- new-lead notifications. createNotification() checks INSERT meta.changes before
-- scheduling push/broadcast/WhatsApp side effects, so IGNORE stops all fan-out.
-- Apply after schema.sql and notifications-schema.sql. Safe to run repeatedly.
-- Applied to production pllato-elc-d1 on 2026-10-27.
CREATE TRIGGER IF NOT EXISTS suppress_wa_history_lead_notifications
BEFORE INSERT ON notifications
WHEN NEW.type = 'pllato_start_new_lead'
  AND EXISTS (
    SELECT 1 FROM deals
    WHERE id = NEW.entity_id
      AND source_description = 'WhatsApp · сообщение не синхронизировано'
  )
BEGIN
  SELECT RAISE(IGNORE);
END;
