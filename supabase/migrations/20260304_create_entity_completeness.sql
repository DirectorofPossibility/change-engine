CREATE TABLE IF NOT EXISTS entity_completeness (
  entity_type TEXT NOT NULL,
  entity_id   TEXT NOT NULL,
  entity_name TEXT NOT NULL DEFAULT '',
  completeness_score INTEGER NOT NULL DEFAULT 0,
  completeness_tier  TEXT NOT NULL DEFAULT 'bronze',
  total_fields   INTEGER NOT NULL DEFAULT 0,
  filled_fields  INTEGER NOT NULL DEFAULT 0,
  missing_fields   TEXT[] NOT NULL DEFAULT '{}',
  critical_missing TEXT[] NOT NULL DEFAULT '{}',
  field_scores JSONB NOT NULL DEFAULT '{}',
  scored_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_ec_type_tier ON entity_completeness(entity_type, completeness_tier);
CREATE INDEX IF NOT EXISTS idx_ec_type_score ON entity_completeness(entity_type, completeness_score DESC);

ALTER TABLE entity_completeness ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Public read" ON entity_completeness FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Service write" ON entity_completeness FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
