-- Migration: Create 27 junction tables for the Civic Knowledge Mesh
-- Replaces comma-separated TEXT fields and PostgreSQL array columns
-- with proper relational junction tables for traversable SQL joins.

-- ============================================================
-- FOCUS AREA JUNCTIONS (the taxonomic mesh — every entity → focus_areas)
-- ============================================================

-- content_published.focus_area_ids[] → content_focus_areas
CREATE TABLE IF NOT EXISTS content_focus_areas (
  content_id TEXT NOT NULL REFERENCES content_published(id) ON DELETE CASCADE,
  focus_id TEXT NOT NULL REFERENCES focus_areas(focus_id) ON DELETE CASCADE,
  PRIMARY KEY (content_id, focus_id)
);
CREATE INDEX IF NOT EXISTS idx_content_focus_areas_focus ON content_focus_areas(focus_id);
ALTER TABLE content_focus_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON content_focus_areas FOR SELECT USING (true);

-- services_211.focus_area_ids TEXT → service_focus_areas
CREATE TABLE IF NOT EXISTS service_focus_areas (
  service_id TEXT NOT NULL REFERENCES services_211(service_id) ON DELETE CASCADE,
  focus_id TEXT NOT NULL REFERENCES focus_areas(focus_id) ON DELETE CASCADE,
  PRIMARY KEY (service_id, focus_id)
);
CREATE INDEX IF NOT EXISTS idx_service_focus_areas_focus ON service_focus_areas(focus_id);
ALTER TABLE service_focus_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON service_focus_areas FOR SELECT USING (true);

-- organizations.focus_area_ids TEXT → organization_focus_areas
CREATE TABLE IF NOT EXISTS organization_focus_areas (
  org_id TEXT NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  focus_id TEXT NOT NULL REFERENCES focus_areas(focus_id) ON DELETE CASCADE,
  PRIMARY KEY (org_id, focus_id)
);
CREATE INDEX IF NOT EXISTS idx_organization_focus_areas_focus ON organization_focus_areas(focus_id);
ALTER TABLE organization_focus_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON organization_focus_areas FOR SELECT USING (true);

-- elected_officials.focus_area_ids TEXT → official_focus_areas
CREATE TABLE IF NOT EXISTS official_focus_areas (
  official_id TEXT NOT NULL REFERENCES elected_officials(official_id) ON DELETE CASCADE,
  focus_id TEXT NOT NULL REFERENCES focus_areas(focus_id) ON DELETE CASCADE,
  PRIMARY KEY (official_id, focus_id)
);
CREATE INDEX IF NOT EXISTS idx_official_focus_areas_focus ON official_focus_areas(focus_id);
ALTER TABLE official_focus_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON official_focus_areas FOR SELECT USING (true);

-- policies.focus_area_ids TEXT → policy_focus_areas
CREATE TABLE IF NOT EXISTS policy_focus_areas (
  policy_id TEXT NOT NULL REFERENCES policies(policy_id) ON DELETE CASCADE,
  focus_id TEXT NOT NULL REFERENCES focus_areas(focus_id) ON DELETE CASCADE,
  PRIMARY KEY (policy_id, focus_id)
);
CREATE INDEX IF NOT EXISTS idx_policy_focus_areas_focus ON policy_focus_areas(focus_id);
ALTER TABLE policy_focus_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON policy_focus_areas FOR SELECT USING (true);

-- opportunities.focus_area_ids TEXT → opportunity_focus_areas
CREATE TABLE IF NOT EXISTS opportunity_focus_areas (
  opportunity_id TEXT NOT NULL REFERENCES opportunities(opportunity_id) ON DELETE CASCADE,
  focus_id TEXT NOT NULL REFERENCES focus_areas(focus_id) ON DELETE CASCADE,
  PRIMARY KEY (opportunity_id, focus_id)
);
CREATE INDEX IF NOT EXISTS idx_opportunity_focus_areas_focus ON opportunity_focus_areas(focus_id);
ALTER TABLE opportunity_focus_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON opportunity_focus_areas FOR SELECT USING (true);

-- life_situations.focus_area_ids TEXT → life_situation_focus_areas
CREATE TABLE IF NOT EXISTS life_situation_focus_areas (
  situation_id TEXT NOT NULL REFERENCES life_situations(situation_id) ON DELETE CASCADE,
  focus_id TEXT NOT NULL REFERENCES focus_areas(focus_id) ON DELETE CASCADE,
  PRIMARY KEY (situation_id, focus_id)
);
CREATE INDEX IF NOT EXISTS idx_life_situation_focus_areas_focus ON life_situation_focus_areas(focus_id);
ALTER TABLE life_situation_focus_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON life_situation_focus_areas FOR SELECT USING (true);

-- agencies.focus_area_ids TEXT → agency_focus_areas
CREATE TABLE IF NOT EXISTS agency_focus_areas (
  agency_id TEXT NOT NULL REFERENCES agencies(agency_id) ON DELETE CASCADE,
  focus_id TEXT NOT NULL REFERENCES focus_areas(focus_id) ON DELETE CASCADE,
  PRIMARY KEY (agency_id, focus_id)
);
CREATE INDEX IF NOT EXISTS idx_agency_focus_areas_focus ON agency_focus_areas(focus_id);
ALTER TABLE agency_focus_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON agency_focus_areas FOR SELECT USING (true);

-- campaigns.focus_area_ids TEXT → campaign_focus_areas
CREATE TABLE IF NOT EXISTS campaign_focus_areas (
  campaign_id TEXT NOT NULL REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
  focus_id TEXT NOT NULL REFERENCES focus_areas(focus_id) ON DELETE CASCADE,
  PRIMARY KEY (campaign_id, focus_id)
);
CREATE INDEX IF NOT EXISTS idx_campaign_focus_areas_focus ON campaign_focus_areas(focus_id);
ALTER TABLE campaign_focus_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON campaign_focus_areas FOR SELECT USING (true);

-- calls_to_action.focus_area_ids TEXT → cta_focus_areas
CREATE TABLE IF NOT EXISTS cta_focus_areas (
  cta_id TEXT NOT NULL REFERENCES calls_to_action(cta_id) ON DELETE CASCADE,
  focus_id TEXT NOT NULL REFERENCES focus_areas(focus_id) ON DELETE CASCADE,
  PRIMARY KEY (cta_id, focus_id)
);
CREATE INDEX IF NOT EXISTS idx_cta_focus_areas_focus ON cta_focus_areas(focus_id);
ALTER TABLE cta_focus_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON cta_focus_areas FOR SELECT USING (true);

-- ballot_items.focus_area_ids TEXT → ballot_item_focus_areas
CREATE TABLE IF NOT EXISTS ballot_item_focus_areas (
  item_id TEXT NOT NULL REFERENCES ballot_items(item_id) ON DELETE CASCADE,
  focus_id TEXT NOT NULL REFERENCES focus_areas(focus_id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, focus_id)
);
CREATE INDEX IF NOT EXISTS idx_ballot_item_focus_areas_focus ON ballot_item_focus_areas(focus_id);
ALTER TABLE ballot_item_focus_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON ballot_item_focus_areas FOR SELECT USING (true);

-- benefit_programs.focus_area_ids TEXT → benefit_focus_areas
CREATE TABLE IF NOT EXISTS benefit_focus_areas (
  benefit_id TEXT NOT NULL REFERENCES benefit_programs(benefit_id) ON DELETE CASCADE,
  focus_id TEXT NOT NULL REFERENCES focus_areas(focus_id) ON DELETE CASCADE,
  PRIMARY KEY (benefit_id, focus_id)
);
CREATE INDEX IF NOT EXISTS idx_benefit_focus_areas_focus ON benefit_focus_areas(focus_id);
ALTER TABLE benefit_focus_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON benefit_focus_areas FOR SELECT USING (true);

-- ============================================================
-- GEOGRAPHY JUNCTIONS
-- ============================================================

-- neighborhoods.zip_codes TEXT → neighborhood_zip_codes
CREATE TABLE IF NOT EXISTS neighborhood_zip_codes (
  neighborhood_id TEXT NOT NULL REFERENCES neighborhoods(neighborhood_id) ON DELETE CASCADE,
  zip_code TEXT NOT NULL,
  PRIMARY KEY (neighborhood_id, zip_code)
);
CREATE INDEX IF NOT EXISTS idx_neighborhood_zip_codes_zip ON neighborhood_zip_codes(zip_code);
ALTER TABLE neighborhood_zip_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON neighborhood_zip_codes FOR SELECT USING (true);

-- Derived: org → neighborhood via ZIP overlap
CREATE TABLE IF NOT EXISTS organization_neighborhoods (
  org_id TEXT NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  neighborhood_id TEXT NOT NULL REFERENCES neighborhoods(neighborhood_id) ON DELETE CASCADE,
  PRIMARY KEY (org_id, neighborhood_id)
);
CREATE INDEX IF NOT EXISTS idx_organization_neighborhoods_hood ON organization_neighborhoods(neighborhood_id);
ALTER TABLE organization_neighborhoods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON organization_neighborhoods FOR SELECT USING (true);

-- ============================================================
-- CONTENT NORMALIZATION (array → junction)
-- ============================================================

-- content_published.sdg_ids[] → content_sdgs
CREATE TABLE IF NOT EXISTS content_sdgs (
  content_id TEXT NOT NULL REFERENCES content_published(id) ON DELETE CASCADE,
  sdg_id TEXT NOT NULL REFERENCES sdgs(sdg_id) ON DELETE CASCADE,
  PRIMARY KEY (content_id, sdg_id)
);
CREATE INDEX IF NOT EXISTS idx_content_sdgs_sdg ON content_sdgs(sdg_id);
ALTER TABLE content_sdgs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON content_sdgs FOR SELECT USING (true);

-- content_published.life_situations[] → content_life_situations
CREATE TABLE IF NOT EXISTS content_life_situations (
  content_id TEXT NOT NULL REFERENCES content_published(id) ON DELETE CASCADE,
  situation_id TEXT NOT NULL REFERENCES life_situations(situation_id) ON DELETE CASCADE,
  PRIMARY KEY (content_id, situation_id)
);
CREATE INDEX IF NOT EXISTS idx_content_life_situations_sit ON content_life_situations(situation_id);
ALTER TABLE content_life_situations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON content_life_situations FOR SELECT USING (true);

-- content_published.audience_segments[] → content_audience_segments
CREATE TABLE IF NOT EXISTS content_audience_segments (
  content_id TEXT NOT NULL REFERENCES content_published(id) ON DELETE CASCADE,
  segment_id TEXT NOT NULL REFERENCES audience_segments(segment_id) ON DELETE CASCADE,
  PRIMARY KEY (content_id, segment_id)
);
CREATE INDEX IF NOT EXISTS idx_content_audience_segments_seg ON content_audience_segments(segment_id);
ALTER TABLE content_audience_segments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON content_audience_segments FOR SELECT USING (true);

-- content_published.pathway_primary + pathway_secondary[] → content_pathways
CREATE TABLE IF NOT EXISTS content_pathways (
  content_id TEXT NOT NULL REFERENCES content_published(id) ON DELETE CASCADE,
  theme_id TEXT NOT NULL REFERENCES themes(theme_id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (content_id, theme_id)
);
CREATE INDEX IF NOT EXISTS idx_content_pathways_theme ON content_pathways(theme_id);
ALTER TABLE content_pathways ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON content_pathways FOR SELECT USING (true);

-- ============================================================
-- OFFICIAL/POLICY JUNCTIONS
-- ============================================================

-- policies.official_ids TEXT → policy_officials
CREATE TABLE IF NOT EXISTS policy_officials (
  policy_id TEXT NOT NULL REFERENCES policies(policy_id) ON DELETE CASCADE,
  official_id TEXT NOT NULL REFERENCES elected_officials(official_id) ON DELETE CASCADE,
  PRIMARY KEY (policy_id, official_id)
);
CREATE INDEX IF NOT EXISTS idx_policy_officials_official ON policy_officials(official_id);
ALTER TABLE policy_officials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON policy_officials FOR SELECT USING (true);

-- elected_officials.counties_served TEXT → official_counties
CREATE TABLE IF NOT EXISTS official_counties (
  official_id TEXT NOT NULL REFERENCES elected_officials(official_id) ON DELETE CASCADE,
  county_id TEXT NOT NULL REFERENCES counties(county_id) ON DELETE CASCADE,
  PRIMARY KEY (official_id, county_id)
);
CREATE INDEX IF NOT EXISTS idx_official_counties_county ON official_counties(county_id);
ALTER TABLE official_counties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON official_counties FOR SELECT USING (true);

-- ============================================================
-- LIFE SITUATION JUNCTIONS
-- ============================================================

-- life_situations.service_cat_ids TEXT → life_situation_service_categories
CREATE TABLE IF NOT EXISTS life_situation_service_categories (
  situation_id TEXT NOT NULL REFERENCES life_situations(situation_id) ON DELETE CASCADE,
  service_cat_id TEXT NOT NULL REFERENCES service_categories(cat_id) ON DELETE CASCADE,
  PRIMARY KEY (situation_id, service_cat_id)
);
CREATE INDEX IF NOT EXISTS idx_life_situation_svc_cat_cat ON life_situation_service_categories(service_cat_id);
ALTER TABLE life_situation_service_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON life_situation_service_categories FOR SELECT USING (true);

-- life_situations.benefit_ids TEXT → life_situation_benefits
CREATE TABLE IF NOT EXISTS life_situation_benefits (
  situation_id TEXT NOT NULL REFERENCES life_situations(situation_id) ON DELETE CASCADE,
  benefit_id TEXT NOT NULL REFERENCES benefit_programs(benefit_id) ON DELETE CASCADE,
  PRIMARY KEY (situation_id, benefit_id)
);
CREATE INDEX IF NOT EXISTS idx_life_situation_benefits_ben ON life_situation_benefits(benefit_id);
ALTER TABLE life_situation_benefits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON life_situation_benefits FOR SELECT USING (true);

-- ============================================================
-- OPPORTUNITY/CAMPAIGN JUNCTIONS
-- ============================================================

-- opportunities.skill_ids TEXT → opportunity_skills
CREATE TABLE IF NOT EXISTS opportunity_skills (
  opportunity_id TEXT NOT NULL REFERENCES opportunities(opportunity_id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL REFERENCES skills(skill_id) ON DELETE CASCADE,
  PRIMARY KEY (opportunity_id, skill_id)
);
CREATE INDEX IF NOT EXISTS idx_opportunity_skills_skill ON opportunity_skills(skill_id);
ALTER TABLE opportunity_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON opportunity_skills FOR SELECT USING (true);

-- campaigns.cta_ids TEXT → campaign_ctas
CREATE TABLE IF NOT EXISTS campaign_ctas (
  campaign_id TEXT NOT NULL REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
  cta_id TEXT NOT NULL REFERENCES calls_to_action(cta_id) ON DELETE CASCADE,
  PRIMARY KEY (campaign_id, cta_id)
);
CREATE INDEX IF NOT EXISTS idx_campaign_ctas_cta ON campaign_ctas(cta_id);
ALTER TABLE campaign_ctas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON campaign_ctas FOR SELECT USING (true);

-- campaigns.partner_org_ids TEXT → campaign_partner_orgs
CREATE TABLE IF NOT EXISTS campaign_partner_orgs (
  campaign_id TEXT NOT NULL REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
  org_id TEXT NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  PRIMARY KEY (campaign_id, org_id)
);
CREATE INDEX IF NOT EXISTS idx_campaign_partner_orgs_org ON campaign_partner_orgs(org_id);
ALTER TABLE campaign_partner_orgs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON campaign_partner_orgs FOR SELECT USING (true);

-- ============================================================
-- PRECINCT JUNCTIONS
-- ============================================================

-- precincts.neighborhood_ids TEXT → precinct_neighborhoods
CREATE TABLE IF NOT EXISTS precinct_neighborhoods (
  precinct_id TEXT NOT NULL REFERENCES precincts(precinct_id) ON DELETE CASCADE,
  neighborhood_id TEXT NOT NULL REFERENCES neighborhoods(neighborhood_id) ON DELETE CASCADE,
  PRIMARY KEY (precinct_id, neighborhood_id)
);
CREATE INDEX IF NOT EXISTS idx_precinct_neighborhoods_hood ON precinct_neighborhoods(neighborhood_id);
ALTER TABLE precinct_neighborhoods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON precinct_neighborhoods FOR SELECT USING (true);

-- precincts.zip_codes TEXT → precinct_zip_codes
CREATE TABLE IF NOT EXISTS precinct_zip_codes (
  precinct_id TEXT NOT NULL REFERENCES precincts(precinct_id) ON DELETE CASCADE,
  zip_code TEXT NOT NULL,
  PRIMARY KEY (precinct_id, zip_code)
);
CREATE INDEX IF NOT EXISTS idx_precinct_zip_codes_zip ON precinct_zip_codes(zip_code);
ALTER TABLE precinct_zip_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON precinct_zip_codes FOR SELECT USING (true);
