-- Performance indexes for sync pipeline queries
CREATE INDEX IF NOT EXISTS idx_officials_data_source ON elected_officials(data_source);
CREATE INDEX IF NOT EXISTS idx_policies_data_source ON policies(data_source);
