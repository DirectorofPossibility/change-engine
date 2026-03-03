-- Migration: Add missing FK constraints on existing direct-reference columns
-- Uses DO blocks for idempotency since ADD CONSTRAINT IF NOT EXISTS
-- is not available in all PostgreSQL versions.

-- services_211.org_id → organizations(org_id)
DO $$ BEGIN
  ALTER TABLE services_211
    ADD CONSTRAINT services_211_org_id_fkey
    FOREIGN KEY (org_id) REFERENCES organizations(org_id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- services_211.service_cat_id → service_categories(service_cat_id)
DO $$ BEGIN
  ALTER TABLE services_211
    ADD CONSTRAINT services_211_service_cat_id_fkey
    FOREIGN KEY (service_cat_id) REFERENCES service_categories(service_cat_id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- life_situations.theme_id → themes(theme_id)
DO $$ BEGIN
  ALTER TABLE life_situations
    ADD CONSTRAINT life_situations_theme_id_fkey
    FOREIGN KEY (theme_id) REFERENCES themes(theme_id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- opportunities.org_id → organizations(org_id)
DO $$ BEGIN
  ALTER TABLE opportunities
    ADD CONSTRAINT opportunities_org_id_fkey
    FOREIGN KEY (org_id) REFERENCES organizations(org_id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- opportunities.time_commitment_id → time_commitments(time_id)
DO $$ BEGIN
  ALTER TABLE opportunities
    ADD CONSTRAINT opportunities_time_commitment_id_fkey
    FOREIGN KEY (time_commitment_id) REFERENCES time_commitments(time_id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- opportunities.action_type_id → action_types(action_type_id)
DO $$ BEGIN
  ALTER TABLE opportunities
    ADD CONSTRAINT opportunities_action_type_id_fkey
    FOREIGN KEY (action_type_id) REFERENCES action_types(action_type_id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- campaigns.org_id → organizations(org_id)
DO $$ BEGIN
  ALTER TABLE campaigns
    ADD CONSTRAINT campaigns_org_id_fkey
    FOREIGN KEY (org_id) REFERENCES organizations(org_id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- campaigns.theme_id → themes(theme_id)
DO $$ BEGIN
  ALTER TABLE campaigns
    ADD CONSTRAINT campaigns_theme_id_fkey
    FOREIGN KEY (theme_id) REFERENCES themes(theme_id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- calls_to_action.campaign_id → campaigns(campaign_id)
DO $$ BEGIN
  ALTER TABLE calls_to_action
    ADD CONSTRAINT calls_to_action_campaign_id_fkey
    FOREIGN KEY (campaign_id) REFERENCES campaigns(campaign_id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- calls_to_action.time_commitment_id → time_commitments(time_id)
DO $$ BEGIN
  ALTER TABLE calls_to_action
    ADD CONSTRAINT calls_to_action_time_commitment_id_fkey
    FOREIGN KEY (time_commitment_id) REFERENCES time_commitments(time_id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- calls_to_action.action_type_id → action_types(action_type_id)
DO $$ BEGIN
  ALTER TABLE calls_to_action
    ADD CONSTRAINT calls_to_action_action_type_id_fkey
    FOREIGN KEY (action_type_id) REFERENCES action_types(action_type_id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ballot_items.election_id → elections(election_id)
DO $$ BEGIN
  ALTER TABLE ballot_items
    ADD CONSTRAINT ballot_items_election_id_fkey
    FOREIGN KEY (election_id) REFERENCES elections(election_id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- neighborhoods.super_neighborhood_id → super_neighborhoods(sn_id)
DO $$ BEGIN
  ALTER TABLE neighborhoods
    ADD CONSTRAINT neighborhoods_super_neighborhood_id_fkey
    FOREIGN KEY (super_neighborhood_id) REFERENCES super_neighborhoods(sn_id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- census_tracts.neighborhood_id → neighborhoods(neighborhood_id)
DO $$ BEGIN
  ALTER TABLE census_tracts
    ADD CONSTRAINT census_tracts_neighborhood_id_fkey
    FOREIGN KEY (neighborhood_id) REFERENCES neighborhoods(neighborhood_id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- focus_areas.theme_id → themes(theme_id)
DO $$ BEGIN
  ALTER TABLE focus_areas
    ADD CONSTRAINT focus_areas_theme_id_fkey
    FOREIGN KEY (theme_id) REFERENCES themes(theme_id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- focus_areas.sdg_id → sdgs(sdg_id)
DO $$ BEGIN
  ALTER TABLE focus_areas
    ADD CONSTRAINT focus_areas_sdg_id_fkey
    FOREIGN KEY (sdg_id) REFERENCES sdgs(sdg_id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- focus_areas.sdoh_code → sdoh_domains(sdoh_code)
DO $$ BEGIN
  ALTER TABLE focus_areas
    ADD CONSTRAINT focus_areas_sdoh_code_fkey
    FOREIGN KEY (sdoh_code) REFERENCES sdoh_domains(sdoh_code) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- agencies.gov_level_id → government_levels(gov_level_id)
DO $$ BEGIN
  ALTER TABLE agencies
    ADD CONSTRAINT agencies_gov_level_id_fkey
    FOREIGN KEY (gov_level_id) REFERENCES government_levels(gov_level_id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- elected_officials.gov_level_id → government_levels(gov_level_id)
DO $$ BEGIN
  ALTER TABLE elected_officials
    ADD CONSTRAINT elected_officials_gov_level_id_fkey
    FOREIGN KEY (gov_level_id) REFERENCES government_levels(gov_level_id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- benefit_programs.gov_level_id → government_levels(gov_level_id)
DO $$ BEGIN
  ALTER TABLE benefit_programs
    ADD CONSTRAINT benefit_programs_gov_level_id_fkey
    FOREIGN KEY (gov_level_id) REFERENCES government_levels(gov_level_id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
