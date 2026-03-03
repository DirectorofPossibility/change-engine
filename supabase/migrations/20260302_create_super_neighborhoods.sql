-- Create super_neighborhoods table for Houston's 88 super neighborhood areas
create table if not exists super_neighborhoods (
  sn_id text primary key,
  sn_name text not null,
  sn_number integer,
  council_districts text,     -- comma-separated district numbers
  zip_codes text,             -- comma-separated ZIP codes
  population integer,
  median_income numeric,
  description text
);

-- Index for lookups
create index if not exists idx_super_neighborhoods_number on super_neighborhoods (sn_number);

-- Enable RLS
alter table super_neighborhoods enable row level security;

-- Public read access
create policy "Public read access" on super_neighborhoods
  for select using (true);
