'use client'

import { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { Heart, Users, MapPin, Megaphone, Wallet, Leaf, Globe, ArrowRight, Sparkles } from 'lucide-react'
import { THEMES, BRAND } from '@/lib/constants'
import { WayfinderSidebar } from './WayfinderSidebar'
import { EmbeddableCircles } from './CircleKnowledgeGraph'
import { BraidedFeed } from './BraidedFeed'
import { WayfinderPanel } from './WayfinderPanel'
import type { FeedItem } from './FeedCard'
import type { PanelData } from './WayfinderPanel'

export interface PathwayFeedData {
  themeId: string
  content: Array<{
    id: string
    title_6th_grade: string | null
    summary_6th_grade: string | null
    center: string | null
    source_domain: string | null
    pathway_primary: string | null
    image_url: string | null
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

interface WayfinderProps {
  stats: { resources: number; officials: number; policies: number; focusAreas: number }
  pathwayCounts: Record<string, number>
  bridges: Array<[string, string, number]>
  topics: string[]
  feedsByPathway: Record<string, PathwayFeedData>
  totalItems: number
  newThisWeek: number
  latestContent: Array<{
    id: string
    title_6th_grade: string | null
    summary_6th_grade: string | null
    center: string | null
    pathway_primary: string | null
    source_domain: string | null
    image_url: string | null
  }>
}

const PATHWAY_ICONS: Record<string, typeof Heart> = {
  THEME_01: Heart,
  THEME_02: Users,
  THEME_03: MapPin,
  THEME_04: Megaphone,
  THEME_05: Wallet,
  THEME_06: Leaf,
  THEME_07: Globe,
}

const LIFE_SITUATIONS = [
  { emoji: '🍽️', label: 'Food Access', href: '/help/i-need-food-right-now', color: '#e53e3e' },
  { emoji: '🏠', label: 'Housing & Shelter', href: '/help/i-need-a-place-to-stay-tonight', color: '#dd6b20' },
  { emoji: '💼', label: 'Career & Employment', href: '/help/i-lost-my-job', color: '#3182ce' },
  { emoji: '🏥', label: 'Health & Wellness', href: '/help/i-need-to-see-a-doctor', color: '#e53e3e' },
  { emoji: '🛡️', label: 'Safety & Protection', href: '/help/i-am-in-danger-at-home', color: '#805ad5' },
  { emoji: '💰', label: 'Financial Stability', href: '/help/i-cannot-afford-my-rent-or-bills', color: '#d69e2e' },
]

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
        imageUrl: c.image_url || undefined,
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
  const [selectedPathway, setSelectedPathway] = useState<string | null>(null)
  const [activeCenter, setActiveCenter] = useState<string | null>(null)
  const [panel, setPanel] = useState<PanelData | null>(null)

  const selectedTheme = selectedPathway
    ? THEMES[selectedPathway as keyof typeof THEMES]
    : null

  const currentFeed = useMemo(function () {
    if (!selectedPathway || !feedsByPathway[selectedPathway]) {
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
          imageUrl: c.image_url || undefined,
          href: '/content/' + c.id,
        }
      })
      return { resources: homeResources, officials: [] as FeedItem[], policies: [] as FeedItem[] }
    }
    return feedDataToItems(feedsByPathway[selectedPathway], selectedPathway)
  }, [selectedPathway, feedsByPathway, latestContent])

  const currentTopics = useMemo(function () {
    if (!selectedPathway || !feedsByPathway[selectedPathway]) return topics
    return feedsByPathway[selectedPathway].focusAreas.map(function (fa) {
      return fa.focus_area_name
    })
  }, [selectedPathway, feedsByPathway, topics])

  const handleSelectPathway = useCallback(function (id: string | null) {
    // EmbeddableCircles passes '' for back/home
    setSelectedPathway(id === '' ? null : id)
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

  return (
    <div className="flex min-h-screen">
      <WayfinderSidebar
        selectedPathway={selectedPathway}
        onSelectPathway={handleSelectPathway}
        totalItems={totalItems}
        newThisWeek={newThisWeek}
        pathwayCounts={pathwayCounts}
        topics={currentTopics}
      />

      <main className="flex-1 min-w-0 overflow-y-auto bg-brand-bg">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 pb-20">
          {/* HOME STATE */}
          {!selectedPathway && (
            <>
              {/* Hero */}
              <div className="pt-8 pb-2 relative">
                <div
                  className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
                  style={{ background: 'radial-gradient(circle, rgba(198,93,40,0.05) 0%, rgba(61,90,90,0.02) 35%, transparent 65%)' }}
                  aria-hidden="true"
                />
                <div className="text-center mb-4 relative z-10">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-brand-muted font-semibold">The</p>
                  <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight leading-none">
                    Community <span style={{ color: BRAND.accent }}>Exchange</span>
                  </h1>
                  <p className="font-serif italic text-brand-muted text-lg mt-2 max-w-md mx-auto leading-relaxed">
                    Everything connects. Explore 7 pathways of civic life.
                  </p>
                </div>

                {/* CircleKnowledgeGraph — embedded */}
                <div className="max-w-2xl mx-auto">
                  <EmbeddableCircles
                    onSelectPathway={handleSelectPathway}
                    pathwayCounts={pathwayCounts}
                    selectedPathway={selectedPathway}
                  />
                </div>
                <p className="text-center text-brand-muted/50 text-xs mt-1 font-serif italic">
                  Tap any circle to explore a pathway
                </p>
              </div>

              {/* Pathway spectrum bar */}
              <div className="flex h-1 max-w-md mx-auto rounded-full overflow-hidden mb-8 mt-3">
                {Object.values(THEMES).map(function (theme, i) {
                  return (
                    <div key={i} className="flex-1 transition-all duration-300 hover:flex-[3]" style={{ backgroundColor: theme.color }} title={theme.name} />
                  )
                })}
              </div>

              {/* Life Situations */}
              <section className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles size={18} style={{ color: BRAND.accent }} />
                  <h2 className="font-serif text-2xl font-bold tracking-tight">Start Your Journey</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {LIFE_SITUATIONS.map(function (sit) {
                    return (
                      <Link key={sit.href} href={sit.href} className="group flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-brand-border hover:shadow-lg hover:-translate-y-1 transition-all duration-200 text-center">
                        <span className="text-3xl group-hover:scale-110 transition-transform">{sit.emoji}</span>
                        <span className="text-sm font-semibold text-brand-text leading-tight">{sit.label}</span>
                        <span className="text-xs font-medium rounded-full px-2 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: sit.color, backgroundColor: sit.color + '15' }}>
                          Explore <ArrowRight className="inline w-3 h-3 ml-0.5" />
                        </span>
                      </Link>
                    )
                  })}
                </div>
                <div className="text-center mt-3">
                  <Link href="/help" className="text-sm font-semibold hover:underline" style={{ color: BRAND.accent }}>
                    Browse all pathways <ArrowRight className="inline w-3.5 h-3.5 ml-0.5" />
                  </Link>
                </div>
              </section>

              {/* Explore by Pathway */}
              <section className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-0.5 rounded-full" style={{ background: `linear-gradient(90deg, ${BRAND.accent}, #5B8A8A)` }} />
                  <h2 className="font-serif text-2xl font-bold tracking-tight">Explore Houston</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                  {(Object.entries(THEMES) as [string, (typeof THEMES)[keyof typeof THEMES]][]).map(function ([id, theme]) {
                    const Icon = PATHWAY_ICONS[id] || Globe
                    const count = pathwayCounts[id] ?? 0
                    return (
                      <button key={id} onClick={function () { handleSelectPathway(id) }} className="group flex items-center gap-3 p-4 rounded-2xl bg-white border border-brand-border hover:shadow-lg hover:-translate-y-1 transition-all duration-200 text-left">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110" style={{ backgroundColor: theme.color + '18' }}>
                          <Icon size={20} style={{ color: theme.color }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-brand-text leading-tight truncate">{theme.name}</span>
                          <span className="block text-xs text-brand-muted mt-0.5">{count} resources</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </section>

              {/* Latest Content header */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-serif text-2xl font-bold tracking-tight">What&apos;s New</h2>
                  {newThisWeek > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold ring-1 ring-green-200">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                      </span>
                      +{newThisWeek} this week
                    </span>
                  )}
                </div>
              </section>
            </>
          )}

          {/* PATHWAY SELECTED STATE */}
          {selectedPathway && selectedTheme && (
            <div className="pt-6 relative">
              {/* Ambient glow */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full pointer-events-none"
                style={{ background: `radial-gradient(circle, ${selectedTheme.color}08 0%, transparent 70%)` }}
                aria-hidden="true"
              />

              {/* Knowledge Graph — evolves to show selected pathway */}
              <div className="max-w-2xl mx-auto mb-4">
                <EmbeddableCircles
                  onSelectPathway={handleSelectPathway}
                  pathwayCounts={pathwayCounts}
                  selectedPathway={selectedPathway}
                />
              </div>

              <div className="mb-6 pb-4 relative z-10" style={{ borderBottom: `2px solid ${selectedTheme.color}15` }}>
                <div className="flex items-center gap-4 mb-3">
                  {(() => {
                    const Icon = PATHWAY_ICONS[selectedPathway] || Globe
                    return (
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: selectedTheme.color + '15' }}>
                        <Icon size={28} style={{ color: selectedTheme.color }} />
                      </div>
                    )
                  })()}
                  <div>
                    <h2 className="font-serif text-3xl font-bold tracking-tight" style={{ color: selectedTheme.color }}>{selectedTheme.name}</h2>
                    <p className="text-sm text-brand-muted font-serif italic mt-0.5">
                      {pathwayCounts[selectedPathway] ?? 0} resources across involvement, services, policies & civic life
                    </p>
                  </div>
                </div>
                {bridges.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className="text-xs text-brand-muted font-serif italic">Connected to</span>
                    {bridges
                      .filter(function (b) { return b[0] === selectedPathway || b[1] === selectedPathway })
                      .slice(0, 5)
                      .map(function (b, i) {
                        const otherId = b[0] === selectedPathway ? b[1] : b[0]
                        const otherTheme = THEMES[otherId as keyof typeof THEMES]
                        if (!otherTheme) return null
                        return (
                          <button key={i} onClick={function () { handleSelectPathway(otherId) }} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold cursor-pointer border transition-all duration-200 hover:shadow-sm hover:-translate-y-[1px]" style={{ backgroundColor: otherTheme.color + '08', color: otherTheme.color, borderColor: otherTheme.color + '20' }}>
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: otherTheme.color }} />
                            {otherTheme.name}
                            <span className="opacity-40 ml-0.5">{b[2]}</span>
                          </button>
                        )
                      })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* BRAIDED FEED */}
          <BraidedFeed
            resources={currentFeed.resources}
            officials={currentFeed.officials}
            policies={currentFeed.policies}
            activeCenter={activeCenter}
            pathwayColor={selectedTheme?.color}
            onSelectCenter={handleSelectCenter}
            onItemClick={handleItemClick}
          />
        </div>

        {/* Footer */}
        <div className="text-center py-8 border-t border-brand-border bg-white">
          <p className="text-sm text-brand-muted font-serif italic">
            The Community Exchange — a product of The Change Engine
          </p>
          <p className="text-xs text-brand-muted/50 mt-1">
            {stats.resources} resources &middot; {stats.officials} officials &middot; {stats.policies} policies &middot; {stats.focusAreas} focus areas
          </p>
        </div>
      </main>

      <WayfinderPanel panel={panel} onClose={handleClosePanel} />
    </div>
  )
}
