-- Add generated tsvector `fts` columns for full-text search on all 8 entity tables.
-- Each column is a STORED generated column so it auto-updates when source text changes.
-- GIN indexes make `.textSearch('fts', ...)` fast.

-- 1. content_published
ALTER TABLE content_published
  ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title_6th_grade, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(summary_6th_grade, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(body, '')), 'C')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_content_published_fts ON content_published USING gin(fts);

-- 2. services_211
ALTER TABLE services_211
  ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(service_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description_5th_grade, '')), 'B')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_services_211_fts ON services_211 USING gin(fts);

-- 3. elected_officials
ALTER TABLE elected_officials
  ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(official_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(title, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description_5th_grade, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(bio, '')), 'D')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_elected_officials_fts ON elected_officials USING gin(fts);

-- 4. organizations
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(org_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(title_6th_grade, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(summary_6th_grade, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description_5th_grade, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(mission_statement, '')), 'C')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_organizations_fts ON organizations USING gin(fts);

-- 5. policies
ALTER TABLE policies
  ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(policy_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(title_6th_grade, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(summary_6th_grade, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(summary_5th_grade, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(impact_statement, '')), 'C')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_policies_fts ON policies USING gin(fts);

-- 6. life_situations
ALTER TABLE life_situations
  ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(situation_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description_5th_grade, '')), 'B')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_life_situations_fts ON life_situations USING gin(fts);

-- 7. resources
ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(resource_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description_5th_grade, '')), 'B')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_resources_fts ON resources USING gin(fts);

-- 8. learning_paths
ALTER TABLE learning_paths
  ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(path_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description_5th_grade, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(path_description, '')), 'C')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_learning_paths_fts ON learning_paths USING gin(fts);
