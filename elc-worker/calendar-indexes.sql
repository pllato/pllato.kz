-- Apply once with Wrangler D1 execute. Never execute schema DDL on calendar reads.
CREATE INDEX IF NOT EXISTS idx_calendar_tasks_start ON tasks(start_date_plan)
 WHERE archived_at IS NULL AND status IN (1,2,3);
CREATE INDEX IF NOT EXISTS idx_calendar_tasks_deadline ON tasks(deadline)
 WHERE archived_at IS NULL AND status IN (1,2,3);
CREATE INDEX IF NOT EXISTS idx_calendar_deals_first_zoom
 ON deals(substr(json_extract(custom_fields,'$.firstZoomAt'),1,10))
 WHERE (archived IS NULL OR archived=0) AND json_valid(custom_fields);
