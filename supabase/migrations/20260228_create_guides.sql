CREATE TABLE IF NOT EXISTS guides (
  guide_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  hero_image_url TEXT,
  content_html TEXT,
  sections JSONB DEFAULT '[]',
  theme_id TEXT,
  focus_area_ids TEXT[] DEFAULT '{}',
  engagement_level TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
