-- API Keys for programmatic content ingestion
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,              -- "ce_live_xxxx" for display
  org_id TEXT REFERENCES organizations(org_id),
  label TEXT NOT NULL,                   -- "Houston Food Bank API"
  is_active BOOLEAN DEFAULT true,
  rate_limit_per_day INTEGER DEFAULT 500,
  total_requests INTEGER DEFAULT 0,
  total_items INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE api_key_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  window_start TIMESTAMPTZ NOT NULL,     -- truncated to midnight UTC
  request_count INTEGER DEFAULT 0,
  item_count INTEGER DEFAULT 0,
  UNIQUE(api_key_id, window_start)
);

CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_key_usage_lookup ON api_key_usage(api_key_id, window_start);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_key_usage ENABLE ROW LEVEL SECURITY;
