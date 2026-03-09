import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { LANGUAGES } from '@/lib/constants'
import type { TranslationMap } from '@/lib/types/exchange'
/**
 * Read language preference from cookie and return the LANG-XX id.
 * Returns null for English (no translations needed).
 */
export const getLangId = cache(async function getLangId(): Promise<string | null> {
  const cookieStore = await cookies()
  const langCode = cookieStore.get('lang')?.value || 'en'
  const langConfig = LANGUAGES.find(function (l) { return l.code === langCode })
  return langConfig?.langId ?? null
})

// ── Election banner ───────────────────────────────────────────────────

/** Fetch the next upcoming active election, or null if none. */

/**
 * Fetch translations for any table type.
 * Returns a map keyed by content_id with translated title/summary.
 * Handles both 'title'/'summary' and 'title_6th_grade'/'summary_6th_grade' field_name formats.
 */
export async function fetchTranslationsForTable(
  contentType: string,
  ids: string[],
  langId: string
): Promise<TranslationMap> {
  if (ids.length === 0 || !langId) return {}
  const supabase = await createClient()
  const { data } = await supabase
    .from('translations')
    .select('content_id, field_name, translated_text')
    .eq('content_type', contentType)
    .in('content_id', ids)
    .eq('language_id', langId)
  const map: TranslationMap = {}
  if (data) {
    data.forEach(function (t) {
      if (!t.content_id) return
      if (!map[t.content_id]) map[t.content_id] = {}
      if (t.field_name === 'title' || t.field_name === 'title_6th_grade') {
        map[t.content_id].title = t.translated_text ?? undefined
      }
      if (t.field_name === 'summary' || t.field_name === 'summary_6th_grade') {
        map[t.content_id].summary = t.translated_text ?? undefined
      }
    })
  }
  return map
}

/** Check which languages each content item has been translated into. Returns { inboxId: ['LANG-ES', 'LANG-VI'] }. */

/** Check which languages each content item has been translated into. Returns { inboxId: ['LANG-ES', 'LANG-VI'] }. */
export async function getTranslationAvailability(inboxIds: string[]): Promise<Record<string, string[]>> {
  const supabase = await createClient()
  if (inboxIds.length === 0) return {}
  const { data } = await supabase
    .from('translations')
    .select('content_id, language_id')
    .in('content_id', inboxIds)
  const avail: Record<string, string[]> = {}
  if (data) {
    data.forEach(function (t) {
      if (!t.content_id || !t.language_id) return
      if (!avail[t.content_id]) avail[t.content_id] = []
      if (avail[t.content_id].indexOf(t.language_id) === -1) {
        avail[t.content_id].push(t.language_id)
      }
    })
  }
  return avail
}

// ── Geographic lookups ─────────────────────────────────────────────────

/**
 * Find the neighborhood that contains a given ZIP code.
 * Uses the neighborhood_zip_codes junction table for exact matching.
 */
