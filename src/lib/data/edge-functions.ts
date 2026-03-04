/**
 * @fileoverview Server actions that wrap internal API routes.
 *
 * These are called from dashboard client components (e.g. TranslationsClient)
 * and handle auth before delegating to the API routes.
 */

'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Trigger batch translation of all untranslated content to Spanish + Vietnamese.
 * Authenticates the user, then calls /api/translate with a CRON_SECRET bearer token.
 * Called from the "Translate All Missing" button on /dashboard/translations.
 */
export async function translateAll(): Promise<{ ok: true; data: unknown } | { ok: false; error: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'Unauthorized' }

    const CRON_SECRET = process.env.CRON_SECRET
    if (!CRON_SECRET) return { ok: false, error: 'Server configuration missing (CRON_SECRET)' }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
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
 * Authenticates the user, then calls /api/score-entities with a CRON_SECRET bearer token.
 * Called from the "Score Now" button on /dashboard/fidelity.
 */
export async function scoreAllEntities(): Promise<{ ok: true; data: unknown } | { ok: false; error: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'Unauthorized' }

    const CRON_SECRET = process.env.CRON_SECRET
    if (!CRON_SECRET) return { ok: false, error: 'Server configuration missing (CRON_SECRET)' }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/score-entities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CRON_SECRET}`,
      },
      body: JSON.stringify({ force: true }),
    })
    if (!res.ok) {
      const text = await res.text()
      return { ok: false, error: `Score API returned ${res.status}: ${text}` }
    }
    const data = await res.json()
    return { ok: true, data }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
