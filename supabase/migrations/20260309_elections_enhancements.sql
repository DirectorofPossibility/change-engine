-- Add missing fields to elections table that the data layer and UI reference
-- polls_open/polls_close: voting hours for election day
-- find_polling_url/register_url: external links for voter resources

ALTER TABLE elections
  ADD COLUMN IF NOT EXISTS polls_open text,
  ADD COLUMN IF NOT EXISTS polls_close text,
  ADD COLUMN IF NOT EXISTS find_polling_url text,
  ADD COLUMN IF NOT EXISTS register_url text;

-- Set default Texas values for convenience
-- (sync-elections will override these if Google Civic provides specific data)
COMMENT ON COLUMN elections.polls_open IS 'Polls open time, e.g. 7:00 AM';
COMMENT ON COLUMN elections.polls_close IS 'Polls close time, e.g. 7:00 PM';
COMMENT ON COLUMN elections.find_polling_url IS 'URL to find your polling place';
COMMENT ON COLUMN elections.register_url IS 'URL to register to vote';

-- Add is_active column to ballot_items if missing (referenced in UI)
ALTER TABLE ballot_items
  ADD COLUMN IF NOT EXISTS is_active text DEFAULT 'Yes';

-- Add index for election date lookups (used by getNextElection and getElectionDashboard)
CREATE INDEX IF NOT EXISTS idx_elections_active_date
  ON elections(is_active, election_date);

CREATE INDEX IF NOT EXISTS idx_candidates_election
  ON candidates(election_id, is_active);

CREATE INDEX IF NOT EXISTS idx_ballot_items_election
  ON ballot_items(election_id);
