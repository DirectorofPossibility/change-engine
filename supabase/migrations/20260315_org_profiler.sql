-- ============================================================
-- Org Profiler Schema Changes
-- Adds parent/child hierarchy, profile tracking, and district caching
-- to support org-anchored ingestion pipeline.
-- ============================================================

-- 1. Parent org hierarchy
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS parent_org_id TEXT REFERENCES organizations(org_id);
CREATE INDEX IF NOT EXISTS idx_organizations_parent ON organizations(parent_org_id) WHERE parent_org_id IS NOT NULL;

-- 2. Profile tracking
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS profile_status TEXT DEFAULT 'stub';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS profile_completeness SMALLINT DEFAULT 0;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS objects_cataloged INTEGER DEFAULT 0;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS last_profiled_at TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS geocoded_at TIMESTAMPTZ;

-- 3. Cached district resolution (JSONB from resolveUserGeo)
-- Stores: { zip, neighborhoodId, superNeighborhoodId, councilDistrict,
--           congressionalDistrict, stateHouseDistrict, stateSenateDistrict, countyId }
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS district_data JSONB;

-- 4. Comments for clarity
COMMENT ON COLUMN organizations.parent_org_id IS 'FK to parent org for hierarchy (e.g., Houston Parks Dept → City of Houston)';
COMMENT ON COLUMN organizations.profile_status IS 'stub | partial | complete | verified — tracks how fully profiled this org is';
COMMENT ON COLUMN organizations.profile_completeness IS '0-100 score: address(20) + geocoded(10) + districts(10) + focus_areas(15) + org_type(5) + description(5) + objects(20) + contact(10) + logo(5)';
COMMENT ON COLUMN organizations.objects_cataloged IS 'Count of child objects (services, opportunities, events, content) discovered and cataloged';
COMMENT ON COLUMN organizations.last_profiled_at IS 'When the org was last fully profiled (crawl + classify + geocode)';
COMMENT ON COLUMN organizations.geocoded_at IS 'When the address was last geocoded to lat/lng';
COMMENT ON COLUMN organizations.district_data IS 'Cached resolveUserGeo result: all district IDs for this org ZIP code';

-- 5. Index for finding orgs that need profiling
CREATE INDEX IF NOT EXISTS idx_organizations_profile_status ON organizations(profile_status) WHERE profile_status IN ('stub', 'partial');

-- 6. Useful queries enabled by this migration:
--
-- Get all child orgs of a parent:
--   SELECT * FROM organizations WHERE parent_org_id = 'ORG_CITY_HOUSTON';
--
-- Get all stub orgs needing profiling:
--   SELECT org_id, org_name, website FROM organizations WHERE profile_status = 'stub' ORDER BY objects_cataloged DESC;
--
-- Get government org tree:
--   SELECT o.org_id, o.org_name, o.gov_level_id, p.org_name as parent_name
--   FROM organizations o
--   LEFT JOIN organizations p ON p.org_id = o.parent_org_id
--   WHERE o.org_type = 'government'
--   ORDER BY o.gov_level_id, o.org_name;
--
-- Get all orgs in a congressional district:
--   SELECT * FROM organizations WHERE district_data->>'congressionalDistrict' = 'TX-18';
