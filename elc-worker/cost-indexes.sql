-- Additive indexes only: preserve existing records, indexes and access rules.
-- Apply with wrangler d1 execute pllato-elc-d1 --remote --file cost-indexes.sql.
CREATE INDEX IF NOT EXISTS idx_chat_msgs_live_channel_time
  ON team_chat_msgs(channel_id, created_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_timeline_owner_id ON timeline_activities(owner_id);
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_stage_group_jobs_pending
  ON wa_stage_group_jobs(event_id) WHERE status='pending';
CREATE INDEX IF NOT EXISTS idx_manual_group_jobs_pending
  ON wa_manual_group_jobs(created_at) WHERE status='pending';
CREATE INDEX IF NOT EXISTS idx_deals_mirrors_nonempty
  ON deals(mirrored_in, id) WHERE mirrored_in IS NOT NULL AND mirrored_in != '{}';
