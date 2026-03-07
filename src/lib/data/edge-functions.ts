/**
 * @fileoverview Server actions called from dashboard client components.
 *
 * These handle auth and then delegate to the appropriate logic.
 * All operations call shared modules directly — no self-fetch needed.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { runEntityScoring } from '@/lib/data/score-entities'
import { enrichEntityDirect, enrichContentDirect } from '@/lib/data/enrich-entities'

/**
 * Trigger batch translation of all untranslated content to Spanish + Vietnamese.
 * Called from the "Translate All Missing" button on /dashboard/translations.
 */
export async function translateAll(): Promise<{ ok: true; data: unknown } | { ok: false; error: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'Unauthorized' }

    const CRON_SECRET = process.env.CRON_SECRET
    if (!CRON_SECRET) return { ok: false, error: 'Server configuration missing (CRON_SECRET)' }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    const res = await fetch(`${baseUrl}/api/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CRON_SECRET}`,
      },
      body: JSON.stringify({ tables: ['content_published'], languages: ['es', 'vi'], limit: 50 }),
    })
    if (!res.ok) {
      const text = await res.text()
      return { ok: false, error: `Translate API returned ${res.status}: ${text}` }
    }
    const data = await res.json()
    return { ok: true, data }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Trigger entity completeness scoring for all entity types.
 * Calls the scoring logic directly — no HTTP self-fetch needed.
 * Called from the "Score Now" button on /dashboard/fidelity.
 */
export async function scoreAllEntities(): Promise<{ ok: true; data: unknown } | { ok: false; error: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'Unauthorized' }

    const data = await runEntityScoring()
    return { ok: true, data }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Update a single entity field directly in its source table.
 * Used by the fidelity dashboard for manual edits of factual data
 * (phone, address, website, etc.) that AI enrichment cannot fill.
 */
export async function updateEntityField(
  entityType: string,
  entityId: string,
  updates: Record<string, string | null>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'Unauthorized' }

    const TABLE_MAP: Record<string, { table: string; idCol: string }> = {
      organization: { table: 'organizations', idCol: 'org_id' },
      official: { table: 'elected_officials', idCol: 'official_id' },
      service: { table: 'services_211', idCol: 'service_id' },
      policy: { table: 'policies', idCol: 'policy_id' },
      opportunity: { table: 'opportunities', idCol: 'opportunity_id' },
      agency: { table: 'agencies', idCol: 'agency_id' },
      benefit: { table: 'benefit_programs', idCol: 'benefit_id' },
      campaign: { table: 'campaigns', idCol: 'campaign_id' },
      event: { table: 'events', idCol: 'event_id' },
      foundation: { table: 'foundations', idCol: 'id' },
      content: { table: 'content_published', idCol: 'id' },
      ballot_item: { table: 'ballot_items', idCol: 'item_id' },
    }

    const mapping = TABLE_MAP[entityType]
    if (!mapping) return { ok: false, error: `Unknown entity type: ${entityType}` }

    // Only allow updating known safe fields (no SQL injection via column names)
    const SAFE_FIELDS = new Set([
      'phone', 'email', 'website', 'address', 'city', 'state', 'zip_code',
      'office_phone', 'office_address', 'photo_url', 'logo_url', 'hero_image_url',
      'image_url', 'hours_of_operation', 'hours', 'social_media', 'bio',
      'mission_statement', 'description', 'eligibility', 'fees', 'languages',
      'registration_url', 'application_url', 'website_url', 'source_url',
      'cost', 'annual_budget', 'year_founded', 'founded_year', 'service_area',
      'agency_acronym', 'bill_number', 'benefit_type', 'benefit_amount',
      'event_type', 'campaign_type', 'item_type', 'party', 'title',
      'jurisdiction', 'level', 'status', 'app_store_url', 'google_play_url',
    ])

    const cleanUpdates: Record<string, string | null> = {}
    for (const [key, val] of Object.entries(updates)) {
      if (!SAFE_FIELDS.has(key)) return { ok: false, error: `Field not editable: ${key}` }
      cleanUpdates[key] = val === '' ? null : val
    }

    const { error } = await supabase
      .from(mapping.table as any)
      .update(cleanUpdates)
      .eq(mapping.idCol, entityId)

    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Fetch the raw entity data from its source table for inline editing.
 */
export async function fetchEntityForEdit(
  entityType: string,
  entityId: string,
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; error: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'Unauthorized' }

    const TABLE_MAP: Record<string, { table: string; idCol: string }> = {
      organization: { table: 'organizations', idCol: 'org_id' },
      official: { table: 'elected_officials', idCol: 'official_id' },
      service: { table: 'services_211', idCol: 'service_id' },
      policy: { table: 'policies', idCol: 'policy_id' },
      opportunity: { table: 'opportunities', idCol: 'opportunity_id' },
      agency: { table: 'agencies', idCol: 'agency_id' },
      benefit: { table: 'benefit_programs', idCol: 'benefit_id' },
      campaign: { table: 'campaigns', idCol: 'campaign_id' },
      event: { table: 'events', idCol: 'event_id' },
      foundation: { table: 'foundations', idCol: 'id' },
      content: { table: 'content_published', idCol: 'id' },
      ballot_item: { table: 'ballot_items', idCol: 'item_id' },
    }

    const mapping = TABLE_MAP[entityType]
    if (!mapping) return { ok: false, error: `Unknown entity type: ${entityType}` }

    const { data, error } = await supabase
      .from(mapping.table as any)
      .select('*')
      .eq(mapping.idCol, entityId)
      .single()

    if (error) return { ok: false, error: error.message }
    return { ok: true, data: data as unknown as Record<string, unknown> }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Enrich entities directly — no self-fetch needed.
 * Maps fidelity entity_type → enrichment module.
 *
 * - organization → enrichEntityDirect('organizations', ids)
 * - official     → enrichEntityDirect('elected_officials', ids)
 * - content      → enrichContentDirect(inbox_ids)
 */
export async function enrichEntities(
  entityType: string,
  entityIds: string[],
): Promise<{ ok: true; data: unknown } | { ok: false; error: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'Unauthorized' }

    if (entityType === 'content') {
      // Content entities: entity_id = content_published.id, but enrichment needs inbox_id
      const { data: rows } = await supabase
        .from('content_published' as any)
        .select('inbox_id')
        .in('id', entityIds)
      const inboxIds = (rows || []).map((r: any) => r.inbox_id).filter(Boolean)
      if (inboxIds.length === 0) return { ok: false, error: 'No matching inbox_ids found for content entities' }

      const data = await enrichContentDirect(inboxIds)
      return { ok: true, data }
    }

    // Map fidelity entity types to table names
    const TABLE_MAP: Record<string, string> = {
      organization: 'organizations',
      official: 'elected_officials',
      service: 'services_211',
      policy: 'policies',
      opportunity: 'opportunities',
      agency: 'agencies',
      benefit: 'benefit_programs',
      campaign: 'campaigns',
      event: 'events',
      foundation: 'foundations',
      ballot_item: 'ballot_items',
    }

    const tableName = TABLE_MAP[entityType]
    if (!tableName) return { ok: false, error: `No enrichment available for entity type: ${entityType}` }

    const data = await enrichEntityDirect(tableName, entityIds, true)
    return { ok: true, data }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
