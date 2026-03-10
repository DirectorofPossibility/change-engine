-- Add crawl tracking columns to organizations
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS last_crawled_at timestamptz,
  ADD COLUMN IF NOT EXISTS crawl_frequency_days integer DEFAULT 30,
  ADD COLUMN IF NOT EXISTS crawl_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS pages_found integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS entities_found integer DEFAULT 0;

-- Index for finding orgs due for re-crawl
CREATE INDEX IF NOT EXISTS idx_organizations_crawl_due
  ON organizations (last_crawled_at, crawl_frequency_days)
  WHERE data_source = 'org_crawl' AND crawl_status != 'disabled';

COMMENT ON COLUMN organizations.last_crawled_at IS 'Timestamp of last successful deep crawl';
COMMENT ON COLUMN organizations.crawl_frequency_days IS 'How often to re-crawl (default 30 days)';
COMMENT ON COLUMN organizations.crawl_status IS 'pending | active | completed | failed | disabled';
