-- Municipal services table: essential city/county services every resident needs
CREATE TABLE IF NOT EXISTS municipal_services (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  service_type text NOT NULL,        -- 'police', 'fire', 'medical', 'parks', 'library', 'utilities', 'emergency'
  service_name text NOT NULL,
  phone text,
  address text,
  city text DEFAULT 'Houston',
  zip_code text,
  county_id text,
  website text,
  hours text,
  coverage_area text,                -- 'citywide', 'county', specific district
  is_emergency boolean DEFAULT false,
  display_order int DEFAULT 0
);

-- Seed Houston essential services
INSERT INTO municipal_services (service_type, service_name, phone, address, city, zip_code, county_id, website, coverage_area, is_emergency, display_order) VALUES
  -- Emergency
  ('emergency', '911 Emergency Services', '911', NULL, 'Houston', NULL, 'harris', NULL, 'citywide', true, 0),
  ('emergency', '311 Houston Help & Info', '311', NULL, 'Houston', NULL, NULL, 'https://www.houstontx.gov/311/', 'citywide', false, 1),

  -- Police
  ('police', 'Houston Police Department (Non-Emergency)', '713-884-3131', '1200 Travis St', 'Houston', '77002', NULL, 'https://www.houstontx.gov/police/', 'citywide', false, 0),
  ('police', 'HPD Central Patrol Station', '713-308-3600', '61 Riesner St', 'Houston', '77002', NULL, 'https://www.houstontx.gov/police/', 'central', false, 1),
  ('police', 'HPD Northeast Patrol Station', '713-308-3600', '8301 Ley Rd', 'Houston', '77028', NULL, 'https://www.houstontx.gov/police/', 'northeast', false, 2),
  ('police', 'HPD Southeast Patrol Station', '713-308-3600', '8300 Mykawa Rd', 'Houston', '77048', NULL, 'https://www.houstontx.gov/police/', 'southeast', false, 3),
  ('police', 'HPD Westside Patrol Station', '713-308-3600', '3203 S Dairy Ashford Rd', 'Houston', '77082', NULL, 'https://www.houstontx.gov/police/', 'westside', false, 4),
  ('police', 'HPD South Gessner Patrol Station', '713-308-3600', '7277 Regency Square Blvd', 'Houston', '77036', NULL, 'https://www.houstontx.gov/police/', 'south-gessner', false, 5),
  ('police', 'Harris County Sheriff''s Office', '713-221-6000', '1200 Baker St', 'Houston', '77002', 'harris', 'https://www.harriscountyso.org/', 'county', false, 6),
  ('police', 'Harris County Constable Precinct 1', '713-755-7628', '1302 Preston Ave', 'Houston', '77002', 'harris', 'https://www.harriscountytx.gov/', 'county', false, 7),

  -- Fire
  ('fire', 'Houston Fire Department', '713-884-3143', '600 Jefferson St', 'Houston', '77002', NULL, 'https://www.houstontx.gov/fire/', 'citywide', false, 0),
  ('fire', 'Harris County Fire Marshal', '713-274-6500', '2318 Atascocita Rd', 'Humble', '77396', 'harris', 'https://fmo.harriscountytx.gov/', 'county', false, 1),

  -- Medical
  ('medical', 'Ben Taub Hospital (Harris Health)', '713-873-2000', '1504 Taub Loop', 'Houston', '77030', 'harris', 'https://www.harrishealth.org/', 'county', false, 0),
  ('medical', 'LBJ Hospital (Harris Health)', '713-566-5000', '5656 Kelley St', 'Houston', '77026', 'harris', 'https://www.harrishealth.org/', 'county', false, 1),
  ('medical', 'Harris Health Community Health Centers', '713-634-1000', NULL, 'Houston', NULL, 'harris', 'https://www.harrishealth.org/', 'county', false, 2),
  ('medical', 'Houston Health Department', '832-393-5427', '8000 N Stadium Dr', 'Houston', '77054', NULL, 'https://www.houstontx.gov/health/', 'citywide', false, 3),
  ('medical', 'Poison Control Center', '800-222-1222', NULL, 'Houston', NULL, NULL, 'https://www.poisoncontrol.org/', 'citywide', true, 4),

  -- Parks
  ('parks', 'Houston Parks & Recreation Department', '832-395-7100', '2999 S Wayside Dr', 'Houston', '77023', NULL, 'https://www.houstontx.gov/parks/', 'citywide', false, 0),
  ('parks', 'Hermann Park', '713-524-5876', '6001 Fannin St', 'Houston', '77030', NULL, 'https://www.hermannpark.org/', 'citywide', false, 1),
  ('parks', 'Memorial Park', '713-863-8403', '6501 Memorial Dr', 'Houston', '77007', NULL, 'https://www.memorialparkconservancy.org/', 'citywide', false, 2),
  ('parks', 'Harris County Precinct 4 Parks', '281-353-8100', NULL, NULL, NULL, 'harris', 'https://www.hcp4.net/parks/', 'county', false, 3),

  -- Library
  ('library', 'Houston Public Library (Central)', '832-393-1313', '500 McKinney St', 'Houston', '77002', NULL, 'https://houstonlibrary.org/', 'citywide', false, 0),
  ('library', 'Harris County Public Library', '713-749-9000', NULL, NULL, NULL, 'harris', 'https://www.hcpl.net/', 'county', false, 1),

  -- Utilities
  ('utilities', 'City of Houston Water & Sewer', '713-371-1400', '611 Walker St', 'Houston', '77002', NULL, 'https://www.houstontx.gov/water/', 'citywide', false, 0),
  ('utilities', 'CenterPoint Energy (Power Outages)', '800-332-7143', NULL, 'Houston', NULL, NULL, 'https://www.centerpointenergy.com/', 'citywide', false, 1),
  ('utilities', 'Houston Solid Waste Management', '311', NULL, 'Houston', NULL, NULL, 'https://www.houstontx.gov/solidwaste/', 'citywide', false, 2);

-- Enable RLS (match pattern of other tables)
ALTER TABLE municipal_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON municipal_services FOR SELECT USING (true);
