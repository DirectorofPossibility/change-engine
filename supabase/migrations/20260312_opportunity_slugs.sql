-- Add slug column to opportunities for human-readable URLs
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS slug text;

-- Generate slugs from opportunity_name
UPDATE opportunities
SET slug = lower(
  regexp_replace(
    regexp_replace(
      regexp_replace(opportunity_name, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    ),
    '-+', '-', 'g'
  )
)
WHERE slug IS NULL;

-- Ensure uniqueness: append opportunity_id suffix on collisions
WITH dupes AS (
  SELECT slug, array_agg(opportunity_id ORDER BY opportunity_id) AS ids
  FROM opportunities
  WHERE slug IS NOT NULL
  GROUP BY slug
  HAVING count(*) > 1
)
UPDATE opportunities o
SET slug = o.slug || '-' || lower(replace(o.opportunity_id, '_', '-'))
FROM dupes d
WHERE o.slug = d.slug
  AND o.opportunity_id != d.ids[1];

CREATE UNIQUE INDEX IF NOT EXISTS idx_opportunities_slug ON opportunities(slug) WHERE slug IS NOT NULL;
