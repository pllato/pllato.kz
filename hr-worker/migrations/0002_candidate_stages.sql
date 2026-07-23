ALTER TABLE submissions ADD COLUMN email TEXT;
ALTER TABLE submissions ADD COLUMN stage TEXT DEFAULT 'full';
CREATE INDEX IF NOT EXISTS idx_sub_stage ON submissions(stage);
