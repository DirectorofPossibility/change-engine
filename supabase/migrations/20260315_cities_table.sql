-- ============================================================
-- Cities Configuration Table
-- Foundation for multi-city expansion. Each active city gets
-- a row here that controls syncs, maps, and UI context.
-- ============================================================

-- ── 1. Cities table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cities (
  city_slug text PRIMARY KEY,                          -- 'houston', 'san-francisco', 'berkeley'
  city_name text NOT NULL,                             -- Display name
  state_code char(2) NOT NULL,                         -- US state abbreviation
  county_id text REFERENCES counties(county_id),       -- Primary county
  metro_area text,                                     -- Metro label for grouping
  lat numeric NOT NULL,                                -- Map center latitude
  lng numeric NOT NULL,                                -- Map center longitude
  default_zoom int DEFAULT 11,                         -- Map default zoom level
  legistar_client text,                                -- Legistar API slug (null if not on Legistar)
  agenda_system text,                                  -- 'legistar', 'granicus', 'manual'
  agenda_rss_url text,                                 -- RSS feed for meeting agendas (Granicus, etc.)
  open_states_jurisdiction text,                       -- Open States jurisdiction slug
  council_structure jsonb,                             -- e.g. {"districts": 8, "at_large": 0, "mayor": true}
  geo_layers jsonb,                                    -- Layer config overrides (null = use defaults)
  languages jsonb DEFAULT '["en"]'::jsonb,             -- Supported language codes
  features jsonb DEFAULT '{}'::jsonb,                  -- Feature flags: has_super_neighborhoods, has_tirz, etc.
  is_active boolean DEFAULT false,
  activated_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ── 2. Seed Houston + San Francisco ────────────────────────
INSERT INTO cities (city_slug, city_name, state_code, county_id, metro_area, lat, lng, default_zoom,
  legistar_client, agenda_system, open_states_jurisdiction, council_structure, languages, features, is_active, activated_at)
VALUES
  ('houston', 'Houston', 'TX', 'COUNTY_01', 'Houston Metro',
    29.7604, -95.3698, 10,
    'cityofhouston', 'legistar', 'texas',
    '{"districts": 11, "at_large": 5, "mayor": true}'::jsonb,
    '["en","es","vi"]'::jsonb,
    '{"has_super_neighborhoods": true, "has_tirz": true, "has_school_districts": true, "has_census_tracts": true}'::jsonb,
    true, now()),
  ('san-francisco', 'San Francisco', 'CA', 'COUNTY_SF', 'Bay Area',
    37.7749, -122.4194, 12,
    'sfgov', 'legistar', 'california',
    '{"districts": 11, "at_large": 0, "mayor": true}'::jsonb,
    '["en","es","zh"]'::jsonb,
    '{"has_super_neighborhoods": true}'::jsonb,
    true, now())
ON CONFLICT (city_slug) DO NOTHING;

-- ── 3. Add city_slug to core entity tables ─────────────────
ALTER TABLE elected_officials ADD COLUMN IF NOT EXISTS city_slug text REFERENCES cities(city_slug);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS city_slug text REFERENCES cities(city_slug);
ALTER TABLE policies ADD COLUMN IF NOT EXISTS city_slug text REFERENCES cities(city_slug);
ALTER TABLE content_published ADD COLUMN IF NOT EXISTS city_slug text REFERENCES cities(city_slug);

-- ── 4. Add state_code to zip_codes ─────────────────────────
ALTER TABLE zip_codes ADD COLUMN IF NOT EXISTS state_code char(2);

-- ── 5. Backfill state_code for existing ZIPs ───────────────
UPDATE zip_codes SET state_code = 'TX' WHERE county_id = 'COUNTY_01' AND state_code IS NULL;
UPDATE zip_codes SET state_code = 'CA' WHERE county_id = 'COUNTY_SF' AND state_code IS NULL;

-- ── 6. Backfill city_slug for existing officials ───────────
UPDATE elected_officials SET city_slug = 'houston'
  WHERE data_source IN ('legistar_houston', 'google_civic') AND city_slug IS NULL;
UPDATE elected_officials SET city_slug = 'san-francisco'
  WHERE data_source = 'legistar_sf' AND city_slug IS NULL;

-- ── 7. Index for city-scoped queries ───────────────────────
CREATE INDEX IF NOT EXISTS idx_officials_city ON elected_officials(city_slug);
CREATE INDEX IF NOT EXISTS idx_orgs_city ON organizations(city_slug);
CREATE INDEX IF NOT EXISTS idx_policies_city ON policies(city_slug);
CREATE INDEX IF NOT EXISTS idx_content_city ON content_published(city_slug);
CREATE INDEX IF NOT EXISTS idx_zips_state ON zip_codes(state_code);
