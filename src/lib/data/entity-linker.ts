import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export interface LinkableEntity {
  name: string
  href: string
}

/**
 * Fetch all linkable entity names from the database.
 * Cached per request to avoid duplicate queries when used across components.
 * Returns entities sorted longest-name-first so longer matches take priority.
 */
export const getLinkableEntities = cache(async function getLinkableEntities(): Promise<LinkableEntity[]> {
  const supabase = await createClient()

  const [orgs, officials, neighborhoods, superNeighborhoods] = await Promise.all([
    supabase
      .from('organizations')
      .select('org_id, org_name')
      .not('org_name', 'is', null),
    supabase
      .from('elected_officials')
      .select('official_id, official_name')
      .not('official_name', 'is', null),
    supabase
      .from('neighborhoods')
      .select('neighborhood_id, neighborhood_name')
      .not('neighborhood_name', 'is', null),
    supabase
      .from('super_neighborhoods')
      .select('id, name')
      .not('name', 'is', null),
  ])

  const entities: LinkableEntity[] = []

  for (const o of orgs.data ?? []) {
    if (o.org_name && o.org_name.length > 3) {
      entities.push({ name: o.org_name, href: '/organizations/' + o.org_id })
    }
  }
  for (const o of officials.data ?? []) {
    if (o.official_name && o.official_name.length > 4) {
      entities.push({ name: o.official_name, href: '/officials/' + o.official_id })
    }
  }
  for (const n of neighborhoods.data ?? []) {
    if (n.neighborhood_name && n.neighborhood_name.length > 3) {
      entities.push({ name: n.neighborhood_name, href: '/geography?neighborhood=' + n.neighborhood_id })
    }
  }
  for (const sn of superNeighborhoods.data ?? []) {
    if (sn.name && sn.name.length > 3) {
      entities.push({ name: sn.name, href: '/geography?superNeighborhood=' + sn.id })
    }
  }

  // Sort longest first so "Houston Food Bank" matches before "Houston"
  entities.sort((a, b) => b.name.length - a.name.length)

  return entities
})

/**
 * Escape HTML special characters in a string.
 */
function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/**
 * Replace entity mentions in plain text with linked HTML.
 * Uses case-insensitive whole-word matching. Each entity is linked at most once
 * (first occurrence) to avoid cluttering the text.
 */
export function linkEntities(text: string, entities: LinkableEntity[]): string {
  if (!text || entities.length === 0) return text

  // Track which spans of the text have already been claimed
  const claimed: Array<{ start: number; end: number; html: string }> = []
  const linkedNames = new Set<string>()

  for (const entity of entities) {
    if (linkedNames.has(entity.name.toLowerCase())) continue

    // Build a word-boundary regex for the entity name
    const escaped = entity.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp('\\b' + escaped + '\\b', 'i')

    const match = re.exec(text)
    if (!match) continue

    const start = match.index
    const end = start + match[0].length

    // Check for overlap with already-claimed spans
    const overlaps = claimed.some(c => start < c.end && end > c.start)
    if (overlaps) continue

    const linkHtml = '<a href="' + escapeHtml(entity.href) + '" class="text-blue hover:underline font-semibold">' + escapeHtml(match[0]) + '</a>'
    claimed.push({ start, end, html: linkHtml })
    linkedNames.add(entity.name.toLowerCase())
  }

  if (claimed.length === 0) return text

  // Sort claimed spans by position and rebuild the string
  claimed.sort((a, b) => a.start - b.start)

  let result = ''
  let cursor = 0
  for (const span of claimed) {
    result += escapeHtml(text.slice(cursor, span.start)) + span.html
    cursor = span.end
  }
  result += escapeHtml(text.slice(cursor))

  return result
}

/**
 * Split a long block of plain text into paragraphs.
 * Splits on existing double-newlines first, then breaks single long paragraphs
 * every 2–3 sentences for readability.
 */
export function smartParagraphs(text: string): string[] {
  // First split on existing double newlines
  const rawBlocks = text.split(/\n\n+/).map(b => b.trim()).filter(Boolean)

  const result: string[] = []
  for (const block of rawBlocks) {
    // If the block is short enough, keep it as-is
    if (block.length < 400) {
      result.push(block)
      continue
    }

    // Split long blocks into ~2-3 sentence chunks
    // Match sentence endings: period/question/exclamation followed by space + capital letter
    const sentences = block.match(/[^.!?]*[.!?]+(?:\s|$)/g)
    if (!sentences || sentences.length <= 3) {
      result.push(block)
      continue
    }

    let current = ''
    let sentenceCount = 0
    for (const sentence of sentences) {
      current += sentence
      sentenceCount++
      // Break every 2-3 sentences, preferring 3
      if (sentenceCount >= 3 || (sentenceCount >= 2 && current.length > 350)) {
        result.push(current.trim())
        current = ''
        sentenceCount = 0
      }
    }
    if (current.trim()) {
      result.push(current.trim())
    }
  }

  return result
}
