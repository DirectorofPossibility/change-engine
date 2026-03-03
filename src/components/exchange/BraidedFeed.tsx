/**
 * @fileoverview Braided feed for the Community Exchange wayfinder.
 *
 * Takes arrays of different entity types (resources, officials, policies) and
 * interleaves them into a single unified feed using an opinionated braiding
 * algorithm:
 *
 *   1. Officials always lead ("Who Decides" — civic accountability first).
 *   2. Resources and policies alternate: 2 resources, then 1 policy, repeat.
 *   3. An optional center filter narrows which items are visible:
 *      - "Accountability" shows only officials + policies.
 *      - Any other center filters resources by matching `center` field.
 *
 * The component also renders center-filter chips at the top so users can
 * narrow the feed by engagement mode (Learning, Action, Resource, Accountability).
 *
 * @example
 * ```tsx
 * <BraidedFeed
 *   resources={resourceItems}
 *   officials={officialItems}
 *   policies={policyItems}
 *   pathwayColor="#e53e3e"
 *   onItemClick={(item) => openDetailPanel(item)}
 * />
 * ```
 */
'use client'

import { useState, useMemo } from 'react'
import { FeedCard } from './FeedCard'
import type { FeedItem } from './FeedCard'

// Re-export the FeedItem type so consumers can import from either module.
export type { FeedItem } from './FeedCard'

// ── Constants ────────────────────────────────────────────────────────────

/**
 * Center filter definitions.
 * Order matches the 4 Centers defined in {@link CENTERS} from `lib/constants.ts`,
 * plus an "All" option to reset filtering.
 */
const CENTER_FILTERS = [
  { key: null, label: 'All' },
  { key: 'Learning', label: 'Learning' },
  { key: 'Action', label: 'Action' },
  { key: 'Resource', label: 'Resource' },
  { key: 'Accountability', label: 'Accountability' },
] as const

// ── Props ────────────────────────────────────────────────────────────────

/**
 * Props accepted by {@link BraidedFeed}.
 */
interface BraidedFeedProps {
  /** Resource-type feed items (content or services). */
  resources: FeedItem[]
  /** Official-type feed items (elected officials). */
  officials: FeedItem[]
  /** Policy-type feed items. */
  policies: FeedItem[]
  /** Optional externally-controlled center filter. When provided, overrides the internal chip state. */
  activeCenter?: string | null
  /** Pathway accent color (hex) applied to resource card left bars. */
  pathwayColor?: string
  /**
   * Callback fired when a center chip is clicked under external control.
   * When provided alongside `activeCenter`, chip clicks call this instead of
   * the internal setter (which would be a no-op).
   */
  onSelectCenter?: (center: string | null) => void
  /** Callback fired when any card in the feed is clicked. */
  onItemClick?: (item: FeedItem) => void
}

// ── Helpers ──────────────────────────────────────────────────────────────

/**
 * Counts how many resources match a given center key.
 *
 * @param resources - The full list of resource feed items.
 * @param center - The center key to match against, or `null` for all.
 * @returns The number of matching resources.
 */
function countForCenter(
  resources: FeedItem[],
  officials: FeedItem[],
  policies: FeedItem[],
  center: string | null,
): number {
  if (center === null) return resources.length + officials.length + policies.length
  if (center === 'Accountability') return officials.length + policies.length
  return resources.filter((r) => r.center === center).length
}

/**
 * Braids officials, resources, and policies into a single ordered array.
 *
 * Algorithm:
 *   1. All officials appear first (civic accountability is the anchor).
 *   2. Resources and policies alternate: for every 2 resources, 1 policy
 *      is inserted. If one list runs out, the other fills the remainder.
 *
 * @param officials - Official feed items.
 * @param resources - Resource/service feed items (already filtered by center).
 * @param policies  - Policy feed items.
 * @returns A single interleaved array of {@link FeedItem}.
 */
function braidItems(
  officials: FeedItem[],
  resources: FeedItem[],
  policies: FeedItem[],
): FeedItem[] {
  const result: FeedItem[] = []

  // 1. Officials first
  result.push(...officials)

  // 2. Interleave resources and policies (2 resources : 1 policy)
  let rIdx = 0
  let pIdx = 0

  while (rIdx < resources.length || pIdx < policies.length) {
    // Take up to 2 resources
    const batch = Math.min(2, resources.length - rIdx)
    for (let i = 0; i < batch; i++) {
      result.push(resources[rIdx++])
    }

    // Take 1 policy
    if (pIdx < policies.length) {
      result.push(policies[pIdx++])
    }
  }

  return result
}

// ── Component ────────────────────────────────────────────────────────────

/**
 * Braided feed component that interleaves resources, officials, and policies
 * into a single, filterable feed for the Community Exchange wayfinder.
 *
 * Renders center-filter chips at the top, a descriptive hint line, and then
 * the braided list of {@link FeedCard} components in a vertical flex column.
 *
 * @param props - {@link BraidedFeedProps}
 */
export function BraidedFeed({
  resources,
  officials,
  policies,
  activeCenter: externalCenter,
  pathwayColor,
  onSelectCenter,
  onItemClick,
}: BraidedFeedProps) {
  /** Internal center-filter state (overridden when `activeCenter` is passed). */
  const [internalCenter, setInternalCenter] = useState<string | null>(null)
  const activeCenter = externalCenter !== undefined ? externalCenter : internalCenter

  /**
   * Stamp every resource item with the pathway color so FeedCard can use it
   * for the left border accent. Memoized to avoid re-creating on every render.
   */
  const coloredResources = useMemo(
    () =>
      resources.map((r) => ({
        ...r,
        pathwayColor: r.pathwayColor || pathwayColor,
      })),
    [resources, pathwayColor],
  )

  /** Filter items based on the active center selection. */
  const filteredResources = useMemo(() => {
    if (activeCenter === null || activeCenter === undefined) return coloredResources
    if (activeCenter === 'Accountability') return []
    return coloredResources.filter((r) => r.center === activeCenter)
  }, [coloredResources, activeCenter])

  const filteredOfficials = useMemo(() => {
    if (activeCenter === null || activeCenter === undefined) return officials
    if (activeCenter === 'Accountability') return officials
    // Non-accountability centers hide officials
    return []
  }, [officials, activeCenter])

  const filteredPolicies = useMemo(() => {
    if (activeCenter === null || activeCenter === undefined) return policies
    if (activeCenter === 'Accountability') return policies
    return []
  }, [policies, activeCenter])

  /** The final braided and filtered feed. */
  const feed = useMemo(
    () => braidItems(filteredOfficials, filteredResources, filteredPolicies),
    [filteredOfficials, filteredResources, filteredPolicies],
  )

  return (
    <div className="w-full">
      {/* ── Center filter chips ─────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-3">
        {CENTER_FILTERS.map(({ key, label }) => {
          const count = countForCenter(coloredResources, officials, policies, key)
          const isActive = activeCenter === key
          return (
            <button
              key={label}
              type="button"
              onClick={() => onSelectCenter ? onSelectCenter(key) : setInternalCenter(key)}
              className={`
                inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium
                transition-colors duration-150
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent
                ${isActive
                  ? 'bg-brand-text text-white'
                  : 'bg-white text-brand-muted border border-brand-border hover:bg-brand-bg'
                }
              `}
            >
              {label}
              <span
                className={`
                  inline-flex items-center justify-center min-w-[22px] h-[22px] rounded-full text-xs font-semibold leading-none px-1
                  ${isActive ? 'bg-white/20 text-white' : 'bg-brand-bg text-brand-muted'}
                `}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Hint line ───────────────────────────────────────────────── */}
      <p className="text-sm text-brand-muted mb-3 italic">
        Click any card below to see full details&hellip;
      </p>

      {/* ── Braided feed ────────────────────────────────────────────── */}
      {feed.length === 0 ? (
        <p className="text-sm text-brand-muted text-center py-8">
          No items match the current filter.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {feed.map((item) => (
            <FeedCard
              key={`${item.type}-${item.id}`}
              item={item}
              onClick={() => onItemClick?.(item)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
