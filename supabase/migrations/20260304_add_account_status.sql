ALTER TABLE user_profiles ADD COLUMN account_status text NOT NULL DEFAULT 'active';
ALTER TABLE user_profiles ADD CONSTRAINT account_status_check
  CHECK (account_status IN ('active', 'read_only', 'locked'));
