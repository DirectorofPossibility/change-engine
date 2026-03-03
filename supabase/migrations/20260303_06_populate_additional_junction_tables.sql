-- Migration: Populate additional junction tables from existing denormalized fields
-- Parses array columns and comma-separated TEXT fields into proper junction rows.

-- ============================================================
-- GUIDE JUNCTIONS
-- ============================================================

-- guides.focus_area_ids[] (ARRAY) → guide_focus_areas
INSERT INTO guide_focus_areas (guide_id, focus_id)
SELECT guide_id, unnest(focus_area_ids)
FROM guides
WHERE focus_area_ids IS NOT NULL AND array_length(focus_area_ids, 1) > 0
ON CONFLICT DO NOTHING;

-- ============================================================
-- LIFE SITUATION JUNCTIONS
-- ============================================================

-- life_situations.agency_ids (TEXT, comma-separated) → life_situation_agencies
INSERT INTO life_situation_agencies (situation_id, agency_id)
SELECT situation_id, TRIM(unnest(string_to_array(agency_ids, ',')))
FROM life_situations
WHERE agency_ids IS NOT NULL AND TRIM(agency_ids) != ''
ON CONFLICT DO NOTHING;

-- life_situations.resource_ids (TEXT, comma-separated) → life_situation_resources
INSERT INTO life_situation_resources (situation_id, resource_id)
SELECT situation_id, TRIM(unnest(string_to_array(resource_ids, ',')))
FROM life_situations
WHERE resource_ids IS NOT NULL AND TRIM(resource_ids) != ''
ON CONFLICT DO NOTHING;

-- ============================================================
-- GEOGRAPHY JUNCTIONS
-- ============================================================

-- school_districts.county_ids (TEXT, comma-separated) → school_district_counties
INSERT INTO school_district_counties (district_id, county_id)
SELECT school_district_id, TRIM(unnest(string_to_array(county_ids, ',')))
FROM school_districts
WHERE county_ids IS NOT NULL AND TRIM(county_ids) != ''
ON CONFLICT DO NOTHING;

-- ============================================================
-- PRECINCT JUNCTIONS
-- ============================================================

-- precincts.tract_ids (TEXT, comma-separated) → precinct_census_tracts
INSERT INTO precinct_census_tracts (precinct_id, tract_id)
SELECT precinct_id, TRIM(unnest(string_to_array(tract_ids, ',')))
FROM precincts
WHERE tract_ids IS NOT NULL AND TRIM(tract_ids) != ''
ON CONFLICT DO NOTHING;

-- precincts.voting_location_ids (TEXT, comma-separated) → precinct_voting_locations
INSERT INTO precinct_voting_locations (precinct_id, location_id)
SELECT precinct_id, TRIM(unnest(string_to_array(voting_location_ids, ',')))
FROM precincts
WHERE voting_location_ids IS NOT NULL AND TRIM(voting_location_ids) != ''
ON CONFLICT DO NOTHING;
