-- Add columns for multi-source election sync (TX SOS deadlines + FEC candidate data)

-- Elections: TX SOS deadline columns
ALTER TABLE elections
  ADD COLUMN IF NOT EXISTS registration_deadline date,
  ADD COLUMN IF NOT EXISTS early_voting_start date,
  ADD COLUMN IF NOT EXISTS early_voting_end date;

COMMENT ON COLUMN elections.registration_deadline IS 'Last day to register to vote (from TX SOS)';
COMMENT ON COLUMN elections.early_voting_start IS 'First day of early voting (from TX SOS)';
COMMENT ON COLUMN elections.early_voting_end IS 'Last day of early voting (from TX SOS)';

-- Candidates: FEC-specific fields
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS incumbent_status text,
  ADD COLUMN IF NOT EXISTS has_raised_funds boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS fec_candidate_id text;

COMMENT ON COLUMN candidates.incumbent_status IS 'Incumbent, Challenger, or Open seat (from FEC)';
COMMENT ON COLUMN candidates.has_raised_funds IS 'Whether candidate has raised funds (from FEC)';
COMMENT ON COLUMN candidates.fec_candidate_id IS 'FEC candidate ID for cross-reference';

-- Index for FEC ID lookups
CREATE INDEX IF NOT EXISTS idx_candidates_fec_id
  ON candidates(fec_candidate_id) WHERE fec_candidate_id IS NOT NULL;
