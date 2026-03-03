/**
 * @fileoverview Main wayfinder orchestrator for the Community Exchange.
 *
 * Manages all client-side state for the two-column wayfinder experience:
 *   - Which pathway is selected (or null for home state)
 *   - Which center is filtering the braided feed
 *   - Which entity detail panel is open (slide-out)
 *   - ZIP code personalization (via NeighborhoodContext)
 *
 * Receives server-fetched data as props and distributes it to child
 * components: WayfinderSidebar, WayfinderCircles, BraidedFeed, and
 * WayfinderPanel.
 *
 * @datasource Props hydrated from server component (homepage or pathway pages)
 * @route Client component used within /(exchange)/page.tsx
 */
'use client'

import { useState, useCallback, useMemo } from 'react'
import { THEMES, BRAND } from '@/lib/constants'
import { WayfinderSidebar } from './WayfinderSidebar'
import { WayfinderCircles } from './WayfinderCircles'
import { BraidedFeed } from './BraidedFeed'
import { WayfinderPanel } from './WayfinderPanel'
import type { FeedItem } from './FeedCard'
import type { PanelData } from './WayfinderPanel'

// ── Types ────────────────────────────────────────────────────────────────

/** Server-provided data for a single pathway's braided feed. */
export interface PathwayFeedData {
  themeId: string
  content: Array<{
    id: string
    title_6th_grade: string | null
    summary_6th_grade: string | null
    center: string | null
    source_domain: string | null
    pathway_primary: string | null
  }>
  officials: Array<{
    official_id: string
    official_name: string
    title: string | null
    party: string | null
    level: string | null
    description_5th_grade: string | null
  }>
  policies: Array<{
    policy_id: string
    policy_name: string
    summary_5th_grade: string | null
    status: string | null
    level: string | null
    bill_number: string | null
  }>
  services: Array<{
    service_id: string
    service_name: string
    description_5th_grade: string | null
    org_id: string | null
    phone: string | null
    address: string | null
    city: string | null
    state: string | null
    zip_code: string | null
  }>
  focusAreas: Array<{ focus_id: string; focus_area_name: string }>
}

/** Props for the main Wayfinder component. */
interface WayfinderProps {
  /** Stats for the homepage circles. */
  stats: { resources: number; officials: number; policies: number; focusAreas: number }
  /** Pathway content counts for circle badges. */
  pathwayCounts: Record<string, number>
  /** Bridge connections between pathways. */
  bridges: Array<[string, string, number]>
  /** Topic names for sidebar pills. */
  topics: string[]
  /** Pre-fetched feed data keyed by theme ID. */
  feedsByPathway: Record<string, PathwayFeedData>
  /** Total live item count. */
  totalItems: number
  /** New items this week count. */
  newThisWeek: number
  /** Latest content for home state. */
  latestContent: Array<{
    id: string
    title_6th_grade: string | null
    summary_6th_grade: string | null
    center: string | null
    pathway_primary: string | null
    source_domain: string | null
  }>
}

// ── Helpers ──────────────────────────────────────────────────────────────

/**
 * Convert server-side pathway feed data into FeedItem arrays for the BraidedFeed.
 *
 * @param feed - The server data for one pathway.
 * @param themeId - The pathway theme ID (for color lookup).
 * @returns Object with resources, officials, and policies as FeedItem arrays.
 */
function feedDataToItems(feed: PathwayFeedData, themeId: string) {
  const themeKey = themeId as keyof typeof THEMES
  const color = THEMES[themeKey]?.color ?? '#8B7E74'

  const resources: FeedItem[] = [
    ...feed.content.map(function (c) {
      return {
        type: 'resource' as const,
        id: c.id,
        title: c.title_6th_grade || 'Untitled',
        summary: c.summary_6th_grade || undefined,
        center: c.center || undefined,
        orgName: c.source_domain || undefined,
        pathwayColor: color,
        href: '/content/' + c.id,
      }
    }),
    ...feed.services.map(function (s) {
      return {
        type: 'service' as const,
        id: s.service_id,
        title: s.service_name,
        summary: s.description_5th_grade || undefined,
        orgName: s.org_id || undefined,
        pathwayColor: color,
        href: '/services/' + s.service_id,
      }
    }),
  ]

  const officials: FeedItem[] = feed.officials.map(function (o) {
    return {
      type: 'official' as const,
      id: o.official_id,
      title: o.official_name,
      role: o.title || undefined,
      relevance: o.description_5th_grade || undefined,
      pathwayColor: color,
      href: '/officials/' + o.official_id,
    }
  })

  const policies: FeedItem[] = feed.policies.map(function (p) {
    return {
      type: 'policy' as const,
      id: p.policy_id,
      title: p.policy_name,
      summary: p.summary_5th_grade || undefined,
      status: p.status || undefined,
      body: p.level || undefined,
      pathwayColor: color,
      href: '/policies/' + p.policy_id,
    }
  })

  return { resources, officials, policies }
}

// ── Component ────────────────────────────────────────────────────────────

/**
 * Main wayfinder orchestrator for the Community Exchange.
 *
 * Manages pathway selection, center filtering, and panel state.
 * Renders the two-column layout: sidebar + main content area with
 * circles, braided feed, and detail panel.
 *
 * @param props - {@link WayfinderProps}
 */
export function Wayfinder({
  stats,
  pathwayCounts,
  bridges,
  topics,
  feedsByPathway,
  totalItems,
  newThisWeek,
  latestContent,
}: WayfinderProps) {
  // ── State ──
  const [selectedPathway, setSelectedPathway] = useState<string | null>(null)
  const [activeCenter, setActiveCenter] = useState<string | null>(null)
  const [panel, setPanel] = useState<PanelData | null>(null)

  // ── Derived data ──
  const selectedTheme = selectedPathway
    ? THEMES[selectedPathway as keyof typeof THEMES]
    : null

  /** Current pathway's braided feed items. */
  const currentFeed = useMemo(function () {
    if (!selectedPathway || !feedsByPathway[selectedPathway]) {
      // Home state — show latest content as resources
      const homeResources: FeedItem[] = latestContent.map(function (c) {
        const themeKey = c.pathway_primary as keyof typeof THEMES | null
        const color = themeKey ? THEMES[themeKey]?.color : BRAND.accent
        return {
          type: 'resource' as const,
          id: c.id,
          title: c.title_6th_grade || 'Untitled',
          summary: c.summary_6th_grade || undefined,
          center: c.center || undefined,
          orgName: c.source_domain || undefined,
          pathwayColor: color ?? BRAND.accent,
          href: '/content/' + c.id,
        }
      })
      return { resources: homeResources, officials: [] as FeedItem[], policies: [] as FeedItem[] }
    }
    return feedDataToItems(feedsByPathway[selectedPathway], selectedPathway)
  }, [selectedPathway, feedsByPathway, latestContent])

  /** Focus area topics for current pathway. */
  const currentTopics = useMemo(function () {
    if (!selectedPathway || !feedsByPathway[selectedPathway]) return topics
    return feedsByPathway[selectedPathway].focusAreas.map(function (fa) {
      return fa.focus_area_name
    })
  }, [selectedPathway, feedsByPathway, topics])

  // ── Callbacks ──
  const handleSelectPathway = useCallback(function (id: string | null) {
    setSelectedPathway(id)
    setActiveCenter(null)
  }, [])

  const handleSelectCenter = useCallback(function (center: string | null) {
    setActiveCenter(center)
  }, [])

  const handleItemClick = useCallback(function (item: FeedItem) {
    setPanel({
      type: item.type,
      id: item.id,
      title: item.title,
      summary: item.summary,
      center: item.center,
      orgName: item.orgName,
      role: item.role,
      status: item.status,
      body: item.body,
      pathwayColor: item.pathwayColor,
      focusAreas: [],
    })
  }, [])

  const handleClosePanel = useCallback(function () {
    setPanel(null)
  }, [])

  // ── Render ──
  return (
    <div className="flex min-h-screen">
      {/* Left sidebar */}
      <WayfinderSidebar
        selectedPathway={selectedPathway}
        onSelectPathway={handleSelectPathway}
        activeCenter={activeCenter}
        onSelectCenter={handleSelectCenter}
        totalItems={totalItems}
        newThisWeek={newThisWeek}
        pathwayCounts={pathwayCounts}
        topics={currentTopics}
      />

      {/* Main content area */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-[880px] mx-auto px-6 pb-20">
          {/* Circles */}
          <div className="pt-5">
            {!selectedPathway && (
              <div className="text-center mb-2">
                <p className="text-[10px] tracking-[0.25em] uppercase text-brand-muted font-serif">
                  The
                </p>
                <h1 className="font-serif text-[34px] font-normal tracking-tight leading-none">
                  Community{' '}
                  <span style={{ color: BRAND.accent }}>Exchange</span>
                </h1>
                <p className="font-serif italic text-brand-muted text-[13px] mt-1">
                  Community Life, Organized
                </p>
              </div>
            )}

            <WayfinderCircles
              selectedPathway={selectedPathway}
              onSelectPathway={handleSelectPathway}
              pathwayCounts={pathwayCounts}
              bridges={bridges}
              compact={false}
              stats={!selectedPathway ? stats : undefined}
            />

            {!selectedPathway && (
              <p className="text-center text-brand-muted/60 text-[11px] mt-2">
                Tap any circle to explore — numbers show shared resources between pathways
              </p>
            )}
          </div>

          {/* Pathway header when selected */}
          {selectedPathway && selectedTheme && (
            <div className="mt-6 mb-5 pb-4" style={{ borderBottom: `2px solid ${selectedTheme.color}20` }}>
              <div className="flex items-center gap-3 mb-2">
                <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
                  <circle
                    cx="15"
                    cy="15"
                    r="13"
                    fill="none"
                    stroke={selectedTheme.color}
                    strokeWidth="2.5"
                    opacity={0.6}
                  />
                  <circle
                    cx="15"
                    cy="15"
                    r="5.5"
                    fill={selectedTheme.color}
                    opacity={0.15}
                  />
                </svg>
                <h2 className="font-serif text-[28px] font-normal" style={{ color: selectedTheme.color }}>
                  {selectedTheme.name}
                </h2>
              </div>

              {/* Connected pathways */}
              {bridges.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className="text-[11px] text-brand-muted">Connected to</span>
                  {bridges
                    .filter(function (b) { return b[0] === selectedPathway || b[1] === selectedPathway })
                    .slice(0, 5)
                    .map(function (b, i) {
                      const otherId = b[0] === selectedPathway ? b[1] : b[0]
                      const otherTheme = THEMES[otherId as keyof typeof THEMES]
                      if (!otherTheme) return null
                      return (
                        <button
                          key={i}
                          onClick={function () { handleSelectPathway(otherId) }}
                          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold cursor-pointer border transition-colors hover:opacity-80"
                          style={{
                            backgroundColor: otherTheme.color + '10',
                            color: otherTheme.color,
                            borderColor: otherTheme.color + '25',
                          }}
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: otherTheme.color }}
                          />
                          {otherTheme.name}
                          <span className="text-[10px] opacity-50 ml-1">{b[2]} shared</span>
                        </button>
                      )
                    })}
                </div>
              )}
            </div>
          )}

          {/* Home state content */}
          {!selectedPathway && (
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="font-serif text-[18px] font-semibold tracking-tight">
                  What Your Community Offers
                </div>
                <div className="flex-1 h-px bg-brand-border ml-2" />
              </div>
              <p className="text-[9px] text-brand-muted italic mb-4">
                Organized by what is available, not what is missing
              </p>
            </div>
          )}

          {/* Braided feed */}
          <BraidedFeed
            resources={currentFeed.resources}
            officials={currentFeed.officials}
            policies={currentFeed.policies}
            activeCenter={activeCenter}
            pathwayColor={selectedTheme?.color}
            onItemClick={handleItemClick}
          />
        </div>

        {/* Footer */}
        <div className="text-center py-6 border-t border-brand-border">
          <p className="text-[10px] text-brand-muted">
            The Community Exchange — a product of The Change Engine
          </p>
          <p className="text-[9px] text-brand-muted/60 mt-1">
            {stats.resources} resources, {stats.officials} officials, {stats.policies} policies, {stats.focusAreas} focus areas
          </p>
        </div>
      </main>

      {/* Detail panel overlay */}
      <WayfinderPanel
        panel={panel}
        onClose={handleClosePanel}
      />
    </div>
  )
}
