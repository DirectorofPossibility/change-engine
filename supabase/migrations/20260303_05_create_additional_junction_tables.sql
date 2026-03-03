-- Migration: Create additional junction tables for the Civic Knowledge Mesh
-- Adds 8 missing junction tables: guide_focus_areas, life_situation_agencies,
-- life_situation_resources, school_district_counties, precinct_census_tracts,
-- precinct_voting_locations, content_service_categories, content_skills.

-- ============================================================
-- GUIDE JUNCTIONS
-- ============================================================

-- guides.focus_area_ids[] → guide_focus_areas
CREATE TABLE IF NOT EXISTS guide_focus_areas (
  guide_id TEXT NOT NULL REFERENCES guides(guide_id) ON DELETE CASCADE,
  focus_id TEXT NOT NULL REFERENCES focus_areas(focus_id) ON DELETE CASCADE,
  PRIMARY KEY (guide_id, focus_id)
);
CREATE INDEX IF NOT EXISTS idx_guide_focus_areas_focus ON guide_focus_areas(focus_id);
ALTER TABLE guide_focus_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON guide_focus_areas FOR SELECT USING (true);

-- ============================================================
-- LIFE SITUATION JUNCTIONS
-- ============================================================

-- life_situations.agency_ids TEXT → life_situation_agencies
CREATE TABLE IF NOT EXISTS life_situation_agencies (
  situation_id TEXT NOT NULL REFERENCES life_situations(situation_id) ON DELETE CASCADE,
  agency_id TEXT NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE,
  PRIMARY KEY (situation_id, agency_id)
);
CREATE INDEX IF NOT EXISTS idx_life_situation_agencies_agency ON life_situation_agencies(agency_id);
ALTER TABLE life_situation_agencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON life_situation_agencies FOR SELECT USING (true);

-- life_situations.resource_ids TEXT → life_situation_resources
CREATE TABLE IF NOT EXISTS life_situation_resources (
  situation_id TEXT NOT NULL REFERENCES life_situations(situation_id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL REFERENCES resources(resource_id) ON DELETE CASCADE,
  PRIMARY KEY (situation_id, resource_id)
);
CREATE INDEX IF NOT EXISTS idx_life_situation_resources_resource ON life_situation_resources(resource_id);
ALTER TABLE life_situation_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON life_situation_resources FOR SELECT USING (true);

-- ============================================================
-- GEOGRAPHY JUNCTIONS
-- ============================================================

-- school_districts.county_ids TEXT → school_district_counties
CREATE TABLE IF NOT EXISTS school_district_counties (
  district_id TEXT NOT NULL REFERENCES school_districts(school_district_id) ON DELETE CASCADE,
  county_id TEXT NOT NULL REFERENCES counties(county_id) ON DELETE CASCADE,
  PRIMARY KEY (district_id, county_id)
);
CREATE INDEX IF NOT EXISTS idx_school_district_counties_county ON school_district_counties(county_id);
ALTER TABLE school_district_counties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON school_district_counties FOR SELECT USING (true);

-- ============================================================
-- PRECINCT JUNCTIONS
-- ============================================================

-- precincts.tract_ids TEXT → precinct_census_tracts
CREATE TABLE IF NOT EXISTS precinct_census_tracts (
  precinct_id TEXT NOT NULL REFERENCES precincts(precinct_id) ON DELETE CASCADE,
  tract_id TEXT NOT NULL REFERENCES census_tracts(tract_id) ON DELETE CASCADE,
  PRIMARY KEY (precinct_id, tract_id)
);
CREATE INDEX IF NOT EXISTS idx_precinct_census_tracts_tract ON precinct_census_tracts(tract_id);
ALTER TABLE precinct_census_tracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON precinct_census_tracts FOR SELECT USING (true);

-- precincts.voting_location_ids TEXT → precinct_voting_locations
CREATE TABLE IF NOT EXISTS precinct_voting_locations (
  precinct_id TEXT NOT NULL REFERENCES precincts(precinct_id) ON DELETE CASCADE,
  location_id TEXT NOT NULL REFERENCES voting_locations(location_id) ON DELETE CASCADE,
  PRIMARY KEY (precinct_id, location_id)
);
CREATE INDEX IF NOT EXISTS idx_precinct_voting_locations_loc ON precinct_voting_locations(location_id);
ALTER TABLE precinct_voting_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON precinct_voting_locations FOR SELECT USING (true);

-- ============================================================
-- CONTENT NORMALIZATION (classification → junction)
-- ============================================================

-- content_published service_cat_ids → content_service_categories
CREATE TABLE IF NOT EXISTS content_service_categories (
  content_id TEXT NOT NULL REFERENCES content_published(id) ON DELETE CASCADE,
  service_cat_id TEXT NOT NULL REFERENCES service_categories(service_cat_id) ON DELETE CASCADE,
  PRIMARY KEY (content_id, service_cat_id)
);
CREATE INDEX IF NOT EXISTS idx_content_service_categories_cat ON content_service_categories(service_cat_id);
ALTER TABLE content_service_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON content_service_categories FOR SELECT USING (true);

-- content_published skill_ids → content_skills
CREATE TABLE IF NOT EXISTS content_skills (
  content_id TEXT NOT NULL REFERENCES content_published(id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL REFERENCES skills(skill_id) ON DELETE CASCADE,
  PRIMARY KEY (content_id, skill_id)
);
CREATE INDEX IF NOT EXISTS idx_content_skills_skill ON content_skills(skill_id);
ALTER TABLE content_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON content_skills FOR SELECT USING (true);
