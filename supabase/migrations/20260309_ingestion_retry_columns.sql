-- Add retry tracking columns to content_inbox
ALTER TABLE content_inbox
  ADD COLUMN IF NOT EXISTS retry_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS last_retry_at timestamptz;

-- Index for retry cron: find flagged items that haven't exceeded max retries
CREATE INDEX IF NOT EXISTS idx_content_inbox_retry
  ON content_inbox (status, retry_count)
  WHERE status = 'flagged' AND retry_count < 3;
