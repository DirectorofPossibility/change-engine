-- ============================================================
-- San Francisco Geographic Bootstrap
-- Seeds: county, ZIP codes, neighborhoods (districts), map layers
-- ============================================================

-- ── 1. County ────────────────────────────────────────────────
-- San Francisco is a consolidated city-county
INSERT INTO counties (county_id, county_name, fips_code, is_urban, population_estimate, region)
VALUES ('sf-county', 'San Francisco County', 6075, 'Yes', 873965, 'Bay Area')
ON CONFLICT (county_id) DO NOTHING;

-- ── 2. ZIP Codes ─────────────────────────────────────────────
-- All San Francisco ZIP codes with Board of Supervisors district mapping
-- Congressional: CA-11 (Nancy Pelosi's former district, now Kevin Mullin's in parts)
-- State Senate: SD-11 (Scott Wiener)
-- State Assembly: AD-17 (Matt Haney), AD-19 (Phil Ting)
INSERT INTO zip_codes (zip_code, city, county_id, congressional_district, state_senate_district, state_house_district)
VALUES
  (94102, 'San Francisco', 'sf-county', 'CA-11', 'SD-11', 'AD-17'),
  (94103, 'San Francisco', 'sf-county', 'CA-11', 'SD-11', 'AD-17'),
  (94104, 'San Francisco', 'sf-county', 'CA-11', 'SD-11', 'AD-17'),
  (94105, 'San Francisco', 'sf-county', 'CA-11', 'SD-11', 'AD-17'),
  (94107, 'San Francisco', 'sf-county', 'CA-11', 'SD-11', 'AD-17'),
  (94108, 'San Francisco', 'sf-county', 'CA-11', 'SD-11', 'AD-17'),
  (94109, 'San Francisco', 'sf-county', 'CA-11', 'SD-11', 'AD-17'),
  (94110, 'San Francisco', 'sf-county', 'CA-11', 'SD-11', 'AD-17'),
  (94111, 'San Francisco', 'sf-county', 'CA-11', 'SD-11', 'AD-17'),
  (94112, 'San Francisco', 'sf-county', 'CA-11', 'SD-11', 'AD-19'),
  (94114, 'San Francisco', 'sf-county', 'CA-11', 'SD-11', 'AD-17'),
  (94115, 'San Francisco', 'sf-county', 'CA-11', 'SD-11', 'AD-19'),
  (94116, 'San Francisco', 'sf-county', 'CA-11', 'SD-11', 'AD-19'),
  (94117, 'San Francisco', 'sf-county', 'CA-11', 'SD-11', 'AD-17'),
  (94118, 'San Francisco', 'sf-county', 'CA-11', 'SD-11', 'AD-19'),
  (94121, 'San Francisco', 'sf-county', 'CA-11', 'SD-11', 'AD-19'),
  (94122, 'San Francisco', 'sf-county', 'CA-11', 'SD-11', 'AD-19'),
  (94123, 'San Francisco', 'sf-county', 'CA-11', 'SD-11', 'AD-19'),
  (94124, 'San Francisco', 'sf-county', 'CA-11', 'SD-11', 'AD-17'),
  (94127, 'San Francisco', 'sf-county', 'CA-11', 'SD-11', 'AD-19'),
  (94129, 'San Francisco', 'sf-county', 'CA-11', 'SD-11', 'AD-19'),
  (94130, 'San Francisco', 'sf-county', 'CA-11', 'SD-11', 'AD-17'),
  (94131, 'San Francisco', 'sf-county', 'CA-11', 'SD-11', 'AD-17'),
  (94132, 'San Francisco', 'sf-county', 'CA-11', 'SD-11', 'AD-19'),
  (94133, 'San Francisco', 'sf-county', 'CA-11', 'SD-11', 'AD-17'),
  (94134, 'San Francisco', 'sf-county', 'CA-11', 'SD-11', 'AD-19'),
  (94158, 'San Francisco', 'sf-county', 'CA-11', 'SD-11', 'AD-17'),
  (94143, 'San Francisco', 'sf-county', 'CA-11', 'SD-11', 'AD-17')
ON CONFLICT (zip_code) DO UPDATE SET
  city = EXCLUDED.city,
  county_id = EXCLUDED.county_id,
  congressional_district = EXCLUDED.congressional_district,
  state_senate_district = EXCLUDED.state_senate_district,
  state_house_district = EXCLUDED.state_house_district;

-- ── 3. SF Neighborhoods as "Super Neighborhoods" ─────────────
-- San Francisco's 36+ recognized neighborhoods mapped to
-- Board of Supervisors districts (1-11)
INSERT INTO super_neighborhoods (sn_id, sn_name, council_districts, zip_codes)
VALUES
  ('SF-01', 'Financial District / South Beach',    '3,6',    '94104,94105,94111,94158'),
  ('SF-02', 'Chinatown',                           '3',      '94108,94133'),
  ('SF-03', 'North Beach / Telegraph Hill',         '3',      '94133'),
  ('SF-04', 'Russian Hill / Nob Hill',              '2,3',    '94109'),
  ('SF-05', 'Pacific Heights / Marina',             '2',      '94115,94123'),
  ('SF-06', 'Western Addition / Fillmore',          '5',      '94115,94117'),
  ('SF-07', 'Tenderloin / Civic Center',            '6',      '94102'),
  ('SF-08', 'SoMa (South of Market)',               '6',      '94103,94107'),
  ('SF-09', 'Mission District',                     '9',      '94110'),
  ('SF-10', 'Castro / Upper Market',                '8',      '94114'),
  ('SF-11', 'Haight-Ashbury',                       '5',      '94117'),
  ('SF-12', 'Hayes Valley',                         '5',      '94102,94117'),
  ('SF-13', 'Inner Richmond',                       '1',      '94118'),
  ('SF-14', 'Outer Richmond',                       '1',      '94121'),
  ('SF-15', 'Inner Sunset',                         '7',      '94122'),
  ('SF-16', 'Outer Sunset',                         '4',      '94116,94122'),
  ('SF-17', 'Parkside / Lake Merced',               '4',      '94116,94132'),
  ('SF-18', 'Twin Peaks / Diamond Heights',         '7,8',    '94131'),
  ('SF-19', 'Glen Park / Noe Valley',               '8',      '94114,94131'),
  ('SF-20', 'Bernal Heights',                       '9',      '94110'),
  ('SF-21', 'Potrero Hill / Dogpatch',              '10',     '94107,94158'),
  ('SF-22', 'Bayview / Hunters Point',              '10',     '94124'),
  ('SF-23', 'Visitacion Valley',                    '10,11',  '94134'),
  ('SF-24', 'Excelsior / Outer Mission',            '11',     '94112'),
  ('SF-25', 'Ingleside / Oceanview',                '11',     '94112'),
  ('SF-26', 'West Portal / Forest Hill',            '7',      '94127'),
  ('SF-27', 'Sunset / Parkmerced',                  '4,7',    '94132'),
  ('SF-28', 'Presidio / Sea Cliff',                 '1,2',    '94121,94129'),
  ('SF-29', 'Treasure Island',                      '6',      '94130'),
  ('SF-30', 'Crocker-Amazon',                       '11',     '94112'),
  ('SF-31', 'Portola',                              '9',      '94110,94134'),
  ('SF-32', 'Japantown',                            '5',      '94115'),
  ('SF-33', 'Laurel Heights / Jordan Park',         '1,2',    '94118'),
  ('SF-34', 'Mission Bay / UCSF',                   '6,10',   '94158,94143'),
  ('SF-35', 'Cole Valley / Parnassus',              '5',      '94117'),
  ('SF-36', 'Balboa Park / Sunnyside',              '7,11',   '94112,94127')
ON CONFLICT (sn_id) DO UPDATE SET
  sn_name = EXCLUDED.sn_name,
  council_districts = EXCLUDED.council_districts,
  zip_codes = EXCLUDED.zip_codes;

-- ── 4. Government levels metadata ────────────────────────────
-- Ensure SF-relevant levels exist
INSERT INTO government_levels (gov_level_id, gov_level_name, level_order, example_positions)
VALUES
  ('federal',  'Federal',         1, 'U.S. Senator, U.S. Representative'),
  ('state',    'State',           2, 'Governor, State Senator, Assembly Member'),
  ('county',   'County',          3, 'County Supervisor, District Attorney, Sheriff'),
  ('city',     'City',            4, 'Mayor, Board of Supervisors, City Attorney')
ON CONFLICT (gov_level_id) DO NOTHING;
