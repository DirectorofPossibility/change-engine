/**
 * @fileoverview Server actions called from dashboard client components.
 *
 * These handle auth and then delegate to the appropriate logic.
 * Scoring calls the shared module directly (no self-fetch).
 * Translation still calls the API route via fetch.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { runEntityScoring } from '@/lib/data/score-entities'

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
/**
 * Enrich entities via the appropriate API route.
 * Maps fidelity entity_type → API route + params.
 *
 * - organization → /api/enrich-entity (table: organizations)
 * - official     → /api/enrich-entity (table: elected_officials)
 * - content      → /api/enrich         (inbox_ids)
 */
export async function enrichEntities(
  entityType: string,
  entityIds: string[],
): Promise<{ ok: true; data: unknown } | { ok: false; error: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'Unauthorized' }

    const CRON_SECRET = process.env.CRON_SECRET
    if (!CRON_SECRET) return { ok: false, error: 'Server configuration missing (CRON_SECRET)' }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

    const ENTITY_API_MAP: Record<string, { route: string; body: (ids: string[]) => unknown }> = {
      organization: {
        route: '/api/enrich-entity',
        body: (ids) => ({ table: 'organizations', ids, force: true }),
      },
      official: {
        route: '/api/enrich-entity',
        body: (ids) => ({ table: 'elected_officials', ids, force: true }),
      },
      content: {
        route: '/api/enrich',
        body: (ids) => ({ inbox_ids: ids }),
      },
    }

    const mapping = ENTITY_API_MAP[entityType]
    if (!mapping) return { ok: false, error: `No enrichment API for entity type: ${entityType}` }

    // For content entities, entity_id = content_published.id but the enrich API needs inbox_id
    let apiIds = entityIds
    if (entityType === 'content') {
      const { data: rows } = await supabase
        .from('content_published' as any)
        .select('inbox_id')
        .in('id', entityIds)
      apiIds = (rows || []).map((r: any) => r.inbox_id).filter(Boolean)
      if (apiIds.length === 0) return { ok: false, error: 'No matching inbox_ids found for content entities' }
    }

    const res = await fetch(`${baseUrl}${mapping.route}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CRON_SECRET}`,
      },
      body: JSON.stringify(mapping.body(apiIds)),
    })

    if (!res.ok) {
      const text = await res.text()
      return { ok: false, error: `Enrich API returned ${res.status}: ${text}` }
    }

    const data = await res.json()
    return { ok: true, data }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

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
