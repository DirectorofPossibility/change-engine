/**
 * Spiral Progression Tracker
 *
 * Tracks user engagement across the three tiers:
 *   Understand → Get Involved → Go Deeper
 *
 * Each interaction is logged by type and pathway.
 * Progress is stored in localStorage (no account needed)
 * and optionally synced to user_profiles when logged in.
 *
 * The spiral model means users cycle through tiers repeatedly,
 * not linearly. Each cycle deepens their engagement.
 */

export type SpiralTier = 'understand' | 'involved' | 'deeper'

export interface SpiralAction {
  tier: SpiralTier
  /** What the user did */
  action: string
  /** Optional pathway ID (THEME_01–07) */
  pathway?: string
  /** ISO timestamp */
  ts: string
}

export interface SpiralState {
  /** All logged actions */
  actions: SpiralAction[]
  /** Completed onboarding? */
  onboarded: boolean
  /** Selected persona slug */
  persona?: string
  /** Selected pathway slugs (interests) */
  interests?: string[]
}

const STORAGE_KEY = 'ce-spiral'

// ── Action type → tier mapping ──

const ACTION_TIERS: Record<string, SpiralTier> = {
  // Understand
  read_article: 'understand',
  read_library: 'understand',
  view_official: 'understand',
  view_policy: 'understand',
  view_service: 'understand',
  view_organization: 'understand',
  search: 'understand',
  take_quiz: 'understand',
  // Get Involved
  view_event: 'involved',
  view_opportunity: 'involved',
  share_good_thing: 'involved',
  call_senator: 'involved',
  find_polling: 'involved',
  share_content: 'involved',
  save_item: 'involved',
  // Go Deeper
  view_foundation: 'deeper',
  explore_knowledge_graph: 'deeper',
  view_district: 'deeper',
  compare_officials: 'deeper',
  view_legislation_detail: 'deeper',
  donate: 'deeper',
  become_partner: 'deeper',
}

// ── Read / Write ──

export function getSpiralState(): SpiralState {
  if (typeof window === 'undefined') return { actions: [], onboarded: false }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { actions: [], onboarded: false }
    return JSON.parse(raw)
  } catch {
    return { actions: [], onboarded: false }
  }
}

function saveSpiralState(state: SpiralState) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

// ── Public API ──

/** Log a spiral action. Deduplicates rapid repeats. */
export function logSpiralAction(action: string, pathway?: string) {
  const state = getSpiralState()
  const tier = ACTION_TIERS[action]
  if (!tier) return // unknown action, skip

  // Deduplicate: don't log same action+pathway within 60s
  const now = new Date().toISOString()
  const recent = state.actions[state.actions.length - 1]
  if (recent && recent.action === action && recent.pathway === pathway) {
    const elapsed = Date.now() - new Date(recent.ts).getTime()
    if (elapsed < 60000) return
  }

  state.actions.push({ tier, action, pathway, ts: now })

  // Cap at 500 actions to prevent localStorage bloat
  if (state.actions.length > 500) {
    state.actions = state.actions.slice(-500)
  }

  saveSpiralState(state)
  window.dispatchEvent(new CustomEvent('ce-spiral-update', { detail: state }))
}

/** Mark onboarding as complete with persona + interests */
export function completeOnboarding(persona: string, interests: string[]) {
  const state = getSpiralState()
  state.onboarded = true
  state.persona = persona
  state.interests = interests
  saveSpiralState(state)

  // Also set persona cookie for server-side use
  document.cookie = `persona=${persona};path=/;max-age=31536000;SameSite=Lax`
}

/** Get counts per tier */
export function getSpiralCounts(): Record<SpiralTier, number> {
  const state = getSpiralState()
  const counts = { understand: 0, involved: 0, deeper: 0 }
  for (const a of state.actions) {
    counts[a.tier]++
  }
  return counts
}

/** Get counts per tier for a specific pathway */
export function getSpiralCountsByPathway(pathwayId: string): Record<SpiralTier, number> {
  const state = getSpiralState()
  const counts = { understand: 0, involved: 0, deeper: 0 }
  for (const a of state.actions) {
    if (a.pathway === pathwayId) counts[a.tier]++
  }
  return counts
}

/** Get unique pathways the user has engaged with */
export function getEngagedPathways(): string[] {
  const state = getSpiralState()
  const set = new Set<string>()
  for (const a of state.actions) {
    if (a.pathway) set.add(a.pathway)
  }
  return Array.from(set)
}

/** Determine the user's current dominant tier */
export function getCurrentTier(): SpiralTier {
  const counts = getSpiralCounts()
  if (counts.deeper >= 3) return 'deeper'
  if (counts.involved >= 3) return 'involved'
  return 'understand'
}

/** Get the number of full spiral cycles (all 3 tiers hit) */
export function getSpiralCycles(): number {
  const counts = getSpiralCounts()
  return Math.min(counts.understand, counts.involved, counts.deeper)
}

/** Has the user completed onboarding? */
export function isOnboarded(): boolean {
  return getSpiralState().onboarded
}

/** Reset all spiral data */
export function resetSpiral() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY)
  }
}
