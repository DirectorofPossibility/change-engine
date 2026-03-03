-- Migration: Populate junction tables from existing denormalized fields
-- Parses comma-separated TEXT fields and PostgreSQL array columns
-- into proper junction table rows.

-- ============================================================
-- FOCUS AREA JUNCTIONS
-- ============================================================

-- content_published.focus_area_ids[] (ARRAY) → content_focus_areas
INSERT INTO content_focus_areas (content_id, focus_id)
SELECT id, unnest(focus_area_ids)
FROM content_published
WHERE focus_area_ids IS NOT NULL AND array_length(focus_area_ids, 1) > 0
ON CONFLICT DO NOTHING;

-- services_211.focus_area_ids (TEXT, comma-separated) → service_focus_areas
INSERT INTO service_focus_areas (service_id, focus_id)
SELECT service_id, TRIM(unnest(string_to_array(focus_area_ids, ',')))
FROM services_211
WHERE focus_area_ids IS NOT NULL AND TRIM(focus_area_ids) != ''
ON CONFLICT DO NOTHING;

-- organizations.focus_area_ids (TEXT, comma-separated) → organization_focus_areas
INSERT INTO organization_focus_areas (org_id, focus_id)
SELECT org_id, TRIM(unnest(string_to_array(focus_area_ids, ',')))
FROM organizations
WHERE focus_area_ids IS NOT NULL AND TRIM(focus_area_ids) != ''
ON CONFLICT DO NOTHING;

-- elected_officials.focus_area_ids (TEXT, comma-separated) → official_focus_areas
INSERT INTO official_focus_areas (official_id, focus_id)
SELECT official_id, TRIM(unnest(string_to_array(focus_area_ids, ',')))
FROM elected_officials
WHERE focus_area_ids IS NOT NULL AND TRIM(focus_area_ids) != ''
ON CONFLICT DO NOTHING;

-- policies.focus_area_ids (TEXT, comma-separated) → policy_focus_areas
INSERT INTO policy_focus_areas (policy_id, focus_id)
SELECT policy_id, TRIM(unnest(string_to_array(focus_area_ids, ',')))
FROM policies
WHERE focus_area_ids IS NOT NULL AND TRIM(focus_area_ids) != ''
ON CONFLICT DO NOTHING;

-- opportunities.focus_area_ids (TEXT, comma-separated) → opportunity_focus_areas
INSERT INTO opportunity_focus_areas (opportunity_id, focus_id)
SELECT opportunity_id, TRIM(unnest(string_to_array(focus_area_ids, ',')))
FROM opportunities
WHERE focus_area_ids IS NOT NULL AND TRIM(focus_area_ids) != ''
ON CONFLICT DO NOTHING;

-- life_situations.focus_area_ids (TEXT, comma-separated) → life_situation_focus_areas
INSERT INTO life_situation_focus_areas (situation_id, focus_id)
SELECT situation_id, TRIM(unnest(string_to_array(focus_area_ids, ',')))
FROM life_situations
WHERE focus_area_ids IS NOT NULL AND TRIM(focus_area_ids) != ''
ON CONFLICT DO NOTHING;

-- agencies.focus_area_ids (TEXT, comma-separated) → agency_focus_areas
INSERT INTO agency_focus_areas (agency_id, focus_id)
SELECT agency_id, TRIM(unnest(string_to_array(focus_area_ids, ',')))
FROM agencies
WHERE focus_area_ids IS NOT NULL AND TRIM(focus_area_ids) != ''
ON CONFLICT DO NOTHING;

-- campaigns.focus_area_ids (TEXT, comma-separated) → campaign_focus_areas
INSERT INTO campaign_focus_areas (campaign_id, focus_id)
SELECT campaign_id, TRIM(unnest(string_to_array(focus_area_ids, ',')))
FROM campaigns
WHERE focus_area_ids IS NOT NULL AND TRIM(focus_area_ids) != ''
ON CONFLICT DO NOTHING;

-- calls_to_action.focus_area_ids (TEXT, comma-separated) → cta_focus_areas
INSERT INTO cta_focus_areas (cta_id, focus_id)
SELECT cta_id, TRIM(unnest(string_to_array(focus_area_ids, ',')))
FROM calls_to_action
WHERE focus_area_ids IS NOT NULL AND TRIM(focus_area_ids) != ''
ON CONFLICT DO NOTHING;

-- ballot_items.focus_area_ids (TEXT, comma-separated) → ballot_item_focus_areas
INSERT INTO ballot_item_focus_areas (item_id, focus_id)
SELECT item_id, TRIM(unnest(string_to_array(focus_area_ids, ',')))
FROM ballot_items
WHERE focus_area_ids IS NOT NULL AND TRIM(focus_area_ids) != ''
ON CONFLICT DO NOTHING;

-- benefit_programs.focus_area_ids (TEXT, comma-separated) → benefit_focus_areas
INSERT INTO benefit_focus_areas (benefit_id, focus_id)
SELECT benefit_id, TRIM(unnest(string_to_array(focus_area_ids, ',')))
FROM benefit_programs
WHERE focus_area_ids IS NOT NULL AND TRIM(focus_area_ids) != ''
ON CONFLICT DO NOTHING;

-- ============================================================
-- GEOGRAPHY JUNCTIONS
-- ============================================================

-- neighborhoods.zip_codes (TEXT, comma-separated) → neighborhood_zip_codes
INSERT INTO neighborhood_zip_codes (neighborhood_id, zip_code)
SELECT neighborhood_id, TRIM(unnest(string_to_array(zip_codes, ',')))
FROM neighborhoods
WHERE zip_codes IS NOT NULL AND TRIM(zip_codes) != ''
ON CONFLICT DO NOTHING;

-- Derived: organizations → neighborhoods via ZIP code overlap
INSERT INTO organization_neighborhoods (org_id, neighborhood_id)
SELECT DISTINCT o.org_id, nz.neighborhood_id
FROM organizations o
JOIN neighborhood_zip_codes nz ON o.zip_code = nz.zip_code
WHERE o.zip_code IS NOT NULL
ON CONFLICT DO NOTHING;

-- ============================================================
-- CONTENT NORMALIZATION (array → junction)
-- ============================================================

-- content_published.sdg_ids[] (ARRAY) → content_sdgs
INSERT INTO content_sdgs (content_id, sdg_id)
SELECT id, unnest(sdg_ids)
FROM content_published
WHERE sdg_ids IS NOT NULL AND array_length(sdg_ids, 1) > 0
ON CONFLICT DO NOTHING;

-- content_published.life_situations[] (ARRAY) → content_life_situations
INSERT INTO content_life_situations (content_id, situation_id)
SELECT id, unnest(life_situations)
FROM content_published
WHERE life_situations IS NOT NULL AND array_length(life_situations, 1) > 0
ON CONFLICT DO NOTHING;

-- content_published.audience_segments[] (ARRAY) → content_audience_segments
INSERT INTO content_audience_segments (content_id, segment_id)
SELECT id, unnest(audience_segments)
FROM content_published
WHERE audience_segments IS NOT NULL AND array_length(audience_segments, 1) > 0
ON CONFLICT DO NOTHING;

-- content_published pathway_primary + pathway_secondary[] → content_pathways
-- Primary pathway
INSERT INTO content_pathways (content_id, theme_id, is_primary)
SELECT id, pathway_primary, true
FROM content_published
WHERE pathway_primary IS NOT NULL
ON CONFLICT DO NOTHING;

-- Secondary pathways
INSERT INTO content_pathways (content_id, theme_id, is_primary)
SELECT id, unnest(pathway_secondary), false
FROM content_published
WHERE pathway_secondary IS NOT NULL AND array_length(pathway_secondary, 1) > 0
ON CONFLICT DO NOTHING;

-- ============================================================
-- OFFICIAL/POLICY JUNCTIONS
-- ============================================================

-- policies.official_ids (TEXT, comma-separated) → policy_officials
INSERT INTO policy_officials (policy_id, official_id)
SELECT policy_id, TRIM(unnest(string_to_array(official_ids, ',')))
FROM policies
WHERE official_ids IS NOT NULL AND TRIM(official_ids) != ''
ON CONFLICT DO NOTHING;

-- elected_officials.counties_served (TEXT, comma-separated) → official_counties
INSERT INTO official_counties (official_id, county_id)
SELECT official_id, TRIM(unnest(string_to_array(counties_served, ',')))
FROM elected_officials
WHERE counties_served IS NOT NULL AND TRIM(counties_served) != ''
ON CONFLICT DO NOTHING;

-- ============================================================
-- LIFE SITUATION JUNCTIONS
-- ============================================================

-- life_situations.service_cat_ids (TEXT, comma-separated) → life_situation_service_categories
INSERT INTO life_situation_service_categories (situation_id, service_cat_id)
SELECT situation_id, TRIM(unnest(string_to_array(service_cat_ids, ',')))
FROM life_situations
WHERE service_cat_ids IS NOT NULL AND TRIM(service_cat_ids) != ''
ON CONFLICT DO NOTHING;

-- life_situations.benefit_ids (TEXT, comma-separated) → life_situation_benefits
INSERT INTO life_situation_benefits (situation_id, benefit_id)
SELECT situation_id, TRIM(unnest(string_to_array(benefit_ids, ',')))
FROM life_situations
WHERE benefit_ids IS NOT NULL AND TRIM(benefit_ids) != ''
ON CONFLICT DO NOTHING;

-- ============================================================
-- OPPORTUNITY/CAMPAIGN JUNCTIONS
-- ============================================================

-- opportunities.skill_ids (TEXT, comma-separated) → opportunity_skills
INSERT INTO opportunity_skills (opportunity_id, skill_id)
SELECT opportunity_id, TRIM(unnest(string_to_array(skill_ids, ',')))
FROM opportunities
WHERE skill_ids IS NOT NULL AND TRIM(skill_ids) != ''
ON CONFLICT DO NOTHING;

-- campaigns.cta_ids (TEXT, comma-separated) → campaign_ctas
INSERT INTO campaign_ctas (campaign_id, cta_id)
SELECT campaign_id, TRIM(unnest(string_to_array(cta_ids, ',')))
FROM campaigns
WHERE cta_ids IS NOT NULL AND TRIM(cta_ids) != ''
ON CONFLICT DO NOTHING;

-- campaigns.partner_org_ids (TEXT, comma-separated) → campaign_partner_orgs
INSERT INTO campaign_partner_orgs (campaign_id, org_id)
SELECT campaign_id, TRIM(unnest(string_to_array(partner_org_ids, ',')))
FROM campaigns
WHERE partner_org_ids IS NOT NULL AND TRIM(partner_org_ids) != ''
ON CONFLICT DO NOTHING;

-- ============================================================
-- PRECINCT JUNCTIONS
-- ============================================================

-- precincts.neighborhood_ids (TEXT, comma-separated) → precinct_neighborhoods
INSERT INTO precinct_neighborhoods (precinct_id, neighborhood_id)
SELECT precinct_id, TRIM(unnest(string_to_array(neighborhood_ids, ',')))
FROM precincts
WHERE neighborhood_ids IS NOT NULL AND TRIM(neighborhood_ids) != ''
ON CONFLICT DO NOTHING;

-- precincts.zip_codes (TEXT, comma-separated) → precinct_zip_codes
INSERT INTO precinct_zip_codes (precinct_id, zip_code)
SELECT precinct_id, TRIM(unnest(string_to_array(zip_codes, ',')))
FROM precincts
WHERE zip_codes IS NOT NULL AND TRIM(zip_codes) != ''
ON CONFLICT DO NOTHING;
