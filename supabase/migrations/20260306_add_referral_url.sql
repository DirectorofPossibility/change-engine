-- Add referral_url to content_inbox to track which directory page referred this asset.
-- The Change Lab resource center is a directory — source_url points to the original asset,
-- referral_url preserves the directory page that curated it.
ALTER TABLE content_inbox ADD COLUMN IF NOT EXISTS referral_url text;

COMMENT ON COLUMN content_inbox.referral_url IS 'URL of the directory/aggregator page that referred this asset (e.g. thechangelab.net resource page)';
