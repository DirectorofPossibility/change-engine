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
      benefit_program: 'benefit_programs',
      campaign: 'campaigns',
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
