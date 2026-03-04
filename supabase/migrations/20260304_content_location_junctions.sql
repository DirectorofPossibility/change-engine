-- Junction tables for linking content to geographic locations
-- Used by the ingest pipeline and review/publish workflow

CREATE TABLE IF NOT EXISTS content_neighborhoods (
  content_id UUID NOT NULL REFERENCES content_published(id) ON DELETE CASCADE,
  neighborhood TEXT NOT NULL,
  PRIMARY KEY (content_id, neighborhood)
);

CREATE TABLE IF NOT EXISTS content_zip_codes (
  content_id UUID NOT NULL REFERENCES content_published(id) ON DELETE CASCADE,
  zip_code TEXT NOT NULL,
  PRIMARY KEY (content_id, zip_code)
);
