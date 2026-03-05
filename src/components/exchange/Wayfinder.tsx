'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { BRAND } from '@/lib/constants'
import { useTranslation } from '@/lib/use-translation'

import { HomeTopBar } from './HomeTopBar'
import { HeroBook } from './HeroBook'
import { CenterDoorways } from './CenterDoorways'
import { PersonaSelector } from './PersonaSelector'
import { ImpactMetrics } from './ImpactMetrics'
import { PathwayRibbons } from './PathwayRibbons'
import { FeedCard } from './FeedCard'
import type { FeedItem } from './FeedCard'

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
  centerCounts: Record<string, number>
  organizations: number
}

export function Wayfinder({
  stats,
  pathwayCounts,
  newThisWeek,
  latestContent,
  centerCounts,
  organizations,
}: WayfinderProps) {
  const { t } = useTranslation()

  const feedItems: FeedItem[] = latestContent.map(function (c) {
    return {
      type: 'resource' as const,
      id: c.id,
      title: c.title_6th_grade || t('card.untitled'),
      summary: c.summary_6th_grade || undefined,
      center: c.center || undefined,
      orgName: c.source_domain || undefined,
      pathwayColor: BRAND.accent,
      imageUrl: c.image_url || undefined,
      href: '/content/' + c.id,
    }
  })

  return (
    <div className="min-h-screen bg-brand-bg">
      <HomeTopBar liveCount={stats.resources} />

      <main className="bg-brand-bg">
        {/* 1. Full-viewport hero */}
        <HeroBook />

        <div className="max-w-6xl mx-auto px-4 sm:px-8 pb-20">
          {/* 2. Four Center doorways */}
          <CenterDoorways centerCounts={centerCounts} />

          {/* 3. Persona selector */}
          <section className="py-10">
            <h2 className="font-serif text-xl font-bold tracking-tight mb-1">Not sure where to start?</h2>
            <p className="text-sm text-brand-muted mb-4 font-serif italic">Find your path — pick the one that sounds like you.</p>
            <PersonaSelector />
          </section>

          {/* 4. Impact metrics */}
          <ImpactMetrics stats={{
            resources: stats.resources,
            organizations: organizations,
            officials: stats.officials,
            policies: stats.policies,
          }} />

          {/* 5. Pathway ribbons */}
          <PathwayRibbons pathwayCounts={pathwayCounts} />

          {/* 6. Latest content preview */}
          {feedItems.length > 0 && (
            <section className="py-12">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-serif text-2xl font-bold tracking-tight">{t('wayfinder.whats_new')}</h2>
                  {newThisWeek > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 mt-1">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                      </span>
                      +{newThisWeek} {t('wayfinder.this_week')}
                    </span>
                  )}
                </div>
                <Link
                  href="/library"
                  className="inline-flex items-center gap-1 text-sm font-semibold hover:underline"
                  style={{ color: BRAND.accent }}
                >
                  {t('home.see_all')} <ArrowRight size={14} />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {feedItems.map(function (item) {
                  return <FeedCard key={item.id} item={item} variant="grid" />
                })}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="text-center py-8 border-t border-brand-border bg-white">
          <p className="text-sm text-brand-muted font-serif italic">
            {t('wayfinder.footer')}
          </p>
          <p className="text-xs text-brand-muted/50 mt-1">
            {stats.resources} resources &middot; {stats.officials} officials &middot; {stats.policies} policies &middot; {stats.focusAreas} focus areas
          </p>
        </div>
      </main>
    </div>
  )
}
