-- Migration: Connect orphaned services to organizations
--
-- Services without org_id either get:
-- 1. A new organization created from the service's own data
-- 2. Deactivated if they lack enough info for an org
--
-- This ensures every active service has an org_id, enabling proper
-- navigation between services and organizations in the wayfinder.

-- Step 1: Create organizations from orphaned services that have enough info
INSERT INTO organizations (org_id, org_name, address, city, state, zip_code, phone, website, data_source)
SELECT
  'ORG_SVC_' || s.service_id,
  COALESCE(
    SPLIT_PART(s.service_name, ' - ', 1),
    s.service_name
  ),
  s.address, s.city, s.state, s.zip_code, s.phone, s.website,
  '211_service_migration'
FROM services_211 s
WHERE s.org_id IS NULL
  AND s.is_active = 'Yes'
  AND s.service_name IS NOT NULL
ON CONFLICT (org_id) DO NOTHING;

-- Step 2: Link orphaned services to their new org
UPDATE services_211 s
SET org_id = 'ORG_SVC_' || s.service_id
WHERE s.org_id IS NULL AND s.is_active = 'Yes';

-- Step 3: Deactivate any services still without org_id
UPDATE services_211 SET is_active = 'No' WHERE org_id IS NULL;
