-- ============================================================
-- Berkeley, California Geographic Bootstrap
-- Seeds: city config, county, ZIP codes, neighborhoods,
--        council districts, elected officials
-- ============================================================

-- ── 1. County ────────────────────────────────────────────────
INSERT INTO counties (county_id, county_name, fips_code, is_urban, population_estimate, region)
VALUES ('COUNTY_ALAMEDA', 'Alameda County', 6001, 'Yes', 1682353, 'Bay Area')
ON CONFLICT (county_id) DO NOTHING;

-- ── 2. City registration ────────────────────────────────────
INSERT INTO cities (city_slug, city_name, state_code, county_id, metro_area, lat, lng, default_zoom,
  legistar_client, agenda_system, agenda_rss_url, open_states_jurisdiction,
  council_structure, languages, features, is_active, activated_at)
VALUES
  ('berkeley', 'Berkeley', 'CA', 'COUNTY_ALAMEDA', 'Bay Area',
    37.8716, -122.2727, 13,
    NULL, 'granicus',
    'https://berkeley.granicus.com/ViewPublisher.php?view_id=5',
    'california',
    '{"districts": 8, "at_large": 0, "mayor": true}'::jsonb,
    '["en","es","zh"]'::jsonb,
    '{}'::jsonb,
    true, now())
ON CONFLICT (city_slug) DO NOTHING;

-- ── 3. ZIP Codes ─────────────────────────────────────────────
-- Berkeley ZIP codes: all within CA-12, SD-9, AD-15
INSERT INTO zip_codes (zip_code, city, county_id, state_code, congressional_district, state_senate_district, state_house_district)
VALUES
  (94701, 'Berkeley', 'COUNTY_ALAMEDA', 'CA', 'CA-12', 'SD-9', 'AD-15'),
  (94702, 'Berkeley', 'COUNTY_ALAMEDA', 'CA', 'CA-12', 'SD-9', 'AD-15'),
  (94703, 'Berkeley', 'COUNTY_ALAMEDA', 'CA', 'CA-12', 'SD-9', 'AD-15'),
  (94704, 'Berkeley', 'COUNTY_ALAMEDA', 'CA', 'CA-12', 'SD-9', 'AD-15'),
  (94705, 'Berkeley', 'COUNTY_ALAMEDA', 'CA', 'CA-12', 'SD-9', 'AD-15'),
  (94706, 'Berkeley', 'COUNTY_ALAMEDA', 'CA', 'CA-12', 'SD-9', 'AD-15'),
  (94707, 'Berkeley', 'COUNTY_ALAMEDA', 'CA', 'CA-12', 'SD-9', 'AD-15'),
  (94708, 'Berkeley', 'COUNTY_ALAMEDA', 'CA', 'CA-12', 'SD-9', 'AD-15'),
  (94709, 'Berkeley', 'COUNTY_ALAMEDA', 'CA', 'CA-12', 'SD-9', 'AD-15'),
  (94710, 'Berkeley', 'COUNTY_ALAMEDA', 'CA', 'CA-12', 'SD-9', 'AD-15'),
  (94712, 'Berkeley', 'COUNTY_ALAMEDA', 'CA', 'CA-12', 'SD-9', 'AD-15'),
  (94720, 'Berkeley', 'COUNTY_ALAMEDA', 'CA', 'CA-12', 'SD-9', 'AD-15')
ON CONFLICT (zip_code) DO UPDATE SET
  city = EXCLUDED.city,
  county_id = EXCLUDED.county_id,
  state_code = EXCLUDED.state_code,
  congressional_district = EXCLUDED.congressional_district,
  state_senate_district = EXCLUDED.state_senate_district,
  state_house_district = EXCLUDED.state_house_district;

-- ── 4. Berkeley Neighborhoods ────────────────────────────────
-- Mapped to council districts (1-8) and ZIP codes
-- Using the super_neighborhoods table (same pattern as SF)
INSERT INTO super_neighborhoods (sn_id, sn_name, council_districts, zip_codes)
VALUES
  ('BK-01', 'Downtown Berkeley',                '4',      '94704'),
  ('BK-02', 'UC Berkeley / Southside',          '7',      '94704,94720'),
  ('BK-03', 'Telegraph Avenue / Elmwood',       '7,8',    '94705'),
  ('BK-04', 'North Berkeley',                   '1,5',    '94707,94708,94709'),
  ('BK-05', 'West Berkeley',                    '2,3',    '94702,94710'),
  ('BK-06', 'South Berkeley',                   '2,3',    '94702,94703'),
  ('BK-07', 'Central Berkeley',                 '4,5',    '94703,94704'),
  ('BK-08', 'Thousand Oaks',                    '1',      '94707'),
  ('BK-09', 'Claremont / Panoramic Hill',       '8',      '94705'),
  ('BK-10', 'Lorin / Le Conte',                 '2',      '94702'),
  ('BK-11', 'San Pablo Park',                   '2,3',    '94702'),
  ('BK-12', 'Oceanview / Gilman',               '1,2',    '94706,94710'),
  ('BK-13', 'Berkeley Hills',                   '5,6,8',  '94705,94708'),
  ('BK-14', 'Northbrae / Marin Circle',         '5',      '94707,94708'),
  ('BK-15', 'Westbrae',                         '1',      '94706,94710'),
  ('BK-16', 'Solano Avenue',                    '5',      '94707'),
  ('BK-17', 'Fourth Street / Aquatic Park',     '2',      '94710'),
  ('BK-18', 'Gourmet Ghetto / North Shattuck',  '5',      '94709'),
  ('BK-19', 'Hopkins / Monterey Market',         '1,5',    '94707'),
  ('BK-20', 'Southeast Berkeley',                '3',      '94703'),
  ('BK-21', 'Willard / Regent',                  '7',      '94704,94705'),
  ('BK-22', 'McGee-Spaulding / Cedar-Rose',      '4',      '94702,94703')
ON CONFLICT (sn_id) DO UPDATE SET
  sn_name = EXCLUDED.sn_name,
  council_districts = EXCLUDED.council_districts,
  zip_codes = EXCLUDED.zip_codes;

-- ── 5. Elected Officials ─────────────────────────────────────
-- Berkeley City Council (Mayor + 8 districts)
-- Source: berkeleyca.gov/your-government/city-council/council-roster

INSERT INTO elected_officials (official_id, official_name, title, level, jurisdiction, district_type, district_id, email, office_phone, website, data_source, city_slug)
VALUES
  ('OFF_BK_MAYOR', 'Adena Ishii', 'Mayor', 'City', 'Berkeley', 'Citywide', 'mayor',
    'mayor@berkeleyca.gov', '(510) 981-7100', 'https://berkeleyca.gov/your-government/city-council/mayor', 'berkeleyca.gov', 'berkeley'),
  ('OFF_BK_D1', 'Rashi Kesarwani', 'Councilmember', 'City', 'Berkeley', 'Council District', '1',
    'rkesarwani@berkeleyca.gov', '(510) 981-7110', 'https://berkeleyca.gov/your-government/city-council/district-1', 'berkeleyca.gov', 'berkeley'),
  ('OFF_BK_D2', 'Terry Taplin', 'Councilmember', 'City', 'Berkeley', 'Council District', '2',
    'ttaplin@berkeleyca.gov', '(510) 981-7120', 'https://berkeleyca.gov/your-government/city-council/district-2', 'berkeleyca.gov', 'berkeley'),
  ('OFF_BK_D3', 'Ben Bartlett', 'Councilmember', 'City', 'Berkeley', 'Council District', '3',
    'bbartlett@berkeleyca.gov', '(510) 981-7130', 'https://berkeleyca.gov/your-government/city-council/district-3', 'berkeleyca.gov', 'berkeley'),
  ('OFF_BK_D4', 'Igor Tregub', 'Councilmember', 'City', 'Berkeley', 'Council District', '4',
    'itregub@berkeleyca.gov', '(510) 981-7140', 'https://berkeleyca.gov/your-government/city-council/district-4', 'berkeleyca.gov', 'berkeley'),
  ('OFF_BK_D5', 'Shoshana O''Keefe', 'Councilmember', 'City', 'Berkeley', 'Council District', '5',
    'sokeefe@berkeleyca.gov', '(510) 981-7150', 'https://berkeleyca.gov/your-government/city-council/district-5', 'berkeleyca.gov', 'berkeley'),
  ('OFF_BK_D6', 'Brent Blackaby', 'Councilmember', 'City', 'Berkeley', 'Council District', '6',
    'bblackaby@berkeleyca.gov', '(510) 981-7160', 'https://berkeleyca.gov/your-government/city-council/district-6', 'berkeleyca.gov', 'berkeley'),
  ('OFF_BK_D7', 'Cecilia Lunaparra', 'Councilmember', 'City', 'Berkeley', 'Council District', '7',
    'clunaparra@berkeleyca.gov', '(510) 981-7170', 'https://berkeleyca.gov/your-government/city-council/district-7', 'berkeleyca.gov', 'berkeley'),
  ('OFF_BK_D8', 'Mark Humbert', 'Councilmember', 'City', 'Berkeley', 'Council District', '8',
    'mhumbert@berkeleyca.gov', '(510) 981-7180', 'https://berkeleyca.gov/your-government/city-council/district-8', 'berkeleyca.gov', 'berkeley')
ON CONFLICT (official_id) DO UPDATE SET
  official_name = EXCLUDED.official_name,
  title = EXCLUDED.title,
  email = EXCLUDED.email,
  office_phone = EXCLUDED.office_phone,
  website = EXCLUDED.website,
  city_slug = EXCLUDED.city_slug;

-- ── 6. State + Federal officials for Berkeley ────────────────
-- These will be filled by sync-officials and sync-state crons
-- once California is added to the sync schedule.
-- For now, seed the key representatives directly.

INSERT INTO elected_officials (official_id, official_name, title, level, jurisdiction, district_type, district_id, email, website, party, data_source, city_slug)
VALUES
  ('OFF_BK_US_REP', 'Lateefah Simon', 'U.S. Representative', 'Federal', 'California', 'Congressional District', 'CA-12',
    NULL, 'https://simon.house.gov', 'Democrat', 'manual_seed', 'berkeley'),
  ('OFF_BK_ST_SEN', 'Jesse Arreguin', 'State Senator', 'State', 'California', 'State Senate District', 'SD-9',
    NULL, 'https://sd09.senate.ca.gov', 'Democrat', 'manual_seed', 'berkeley'),
  ('OFF_BK_ST_ASM', 'Buffy Wicks', 'Assembly Member', 'State', 'California', 'State Assembly District', 'AD-15',
    NULL, 'https://a15.asmdc.org', 'Democrat', 'manual_seed', 'berkeley')
ON CONFLICT (official_id) DO UPDATE SET
  official_name = EXCLUDED.official_name,
  title = EXCLUDED.title,
  party = EXCLUDED.party,
  website = EXCLUDED.website,
  city_slug = EXCLUDED.city_slug;

-- ── 7. Government levels (ensure they exist) ────────────────
INSERT INTO government_levels (gov_level_id, gov_level_name, level_order, example_positions)
VALUES
  ('federal',  'Federal',  1, 'U.S. Senator, U.S. Representative'),
  ('state',    'State',    2, 'Governor, State Senator, Assembly Member'),
  ('county',   'County',   3, 'County Supervisor, District Attorney'),
  ('city',     'City',     4, 'Mayor, Councilmember, City Attorney')
ON CONFLICT (gov_level_id) DO NOTHING;
