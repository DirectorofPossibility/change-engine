ALTER TABLE content_inbox ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE content_published ADD COLUMN IF NOT EXISTS image_url TEXT;
