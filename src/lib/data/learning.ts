import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
export const getLearningPaths = cache(async function getLearningPaths({ limit = 100 }: { limit?: number } = {}) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('learning_paths')
    .select('*')
    .eq('is_active', 'Yes')
    .order('display_order', { ascending: true })
    .limit(limit)
  return data ?? []
})

// ── Pathway + center content ───────────────────────────────────────────

/**
 * Newsfeed for a specific pathway, optionally filtered by engagement level (center).
 * Returns news items (articles, videos, research, reports, courses) — not community resources.
 */

export const getGuides = cache(async function getGuides() {
  const supabase = await createClient()
  const { data } = await supabase.from('guides').select('*').eq('is_active', true).order('display_order')
  return data ?? []
})


export async function getGuideBySlug(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase.from('guides').select('*').eq('slug', slug).eq('is_active', true).single()
  return data
}


/** Get adjacent guides for prev/next navigation. */
export async function getAdjacentGuides(currentOrder: number | null, themeId: string | null) {
  const supabase = await createClient()
  let prev = null
  let next = null

  if (currentOrder != null) {
    const { data: prevData } = await supabase
      .from('guides')
      .select('slug, title')
      .eq('is_active', true)
      .lt('display_order', currentOrder)
      .order('display_order', { ascending: false })
      .limit(1)
    if (prevData && prevData.length > 0) prev = prevData[0]

    const { data: nextData } = await supabase
      .from('guides')
      .select('slug, title')
      .eq('is_active', true)
      .gt('display_order', currentOrder)
      .order('display_order', { ascending: true })
      .limit(1)
    if (nextData && nextData.length > 0) next = nextData[0]
  }

  return { prev, next }
}

// ═══════════════════════════════════════════════════════════════
// KNOWLEDGE GRAPH — Data-driven queries
// ═══════════════════════════════════════════════════════════════

/** Full knowledge graph data for the constellation view. */
