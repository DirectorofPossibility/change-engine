-- Add content_type column to content pipeline tables
-- Values: article, event, report, video, opportunity, guide, course, announcement, campaign, tool
ALTER TABLE content_inbox ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT NULL;
ALTER TABLE content_published ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT NULL;
ALTER TABLE content_review_queue ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_content_published_type ON content_published(content_type);
CREATE INDEX IF NOT EXISTS idx_content_published_type_active ON content_published(content_type, pathway_primary) WHERE is_active = true;
