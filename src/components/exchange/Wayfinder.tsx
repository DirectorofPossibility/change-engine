'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { BRAND, THEMES, CENTER_COLORS } from '@/lib/constants'
import { useTranslation } from '@/lib/use-translation'

import { HeroBook } from './HeroBook'
import { PersonaSelector } from './PersonaSelector'
import { FeedCard } from './FeedCard'
import type { FeedItem } from './FeedCard'

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

  const totalResources = stats.resources
  const themeEntries = Object.entries(THEMES)

  return (
    <div>
      {/* 1. Hero with search */}
      <HeroBook />

      {/* 2. Stats bar — quick proof of value */}
      <div className="bg-white border-b border-brand-border">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-6 sm:gap-10">
              <div>
                <span className="text-2xl font-serif font-bold text-brand-text">{totalResources.toLocaleString()}</span>
                <span className="text-xs text-brand-muted ml-1.5">{t('home.stats_resources')}</span>
              </div>
              <div className="h-8 w-px bg-brand-border" />
              <div>
                <span className="text-2xl font-serif font-bold text-brand-text">{stats.officials.toLocaleString()}</span>
                <span className="text-xs text-brand-muted ml-1.5">{t('home.stats_officials')}</span>
              </div>
              <div className="h-8 w-px bg-brand-border hidden sm:block" />
              <div className="hidden sm:block">
                <span className="text-2xl font-serif font-bold text-brand-text">{organizations.toLocaleString()}</span>
                <span className="text-xs text-brand-muted ml-1.5">{t('home.stats_organizations')}</span>
              </div>
            </div>
            {newThisWeek > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-success">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-success opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-success" />
                </span>
                {newThisWeek > 20 ? 'Updated daily' : '+' + newThisWeek + ' this week'}
              </span>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-[1200px] mx-auto px-4 sm:px-8">
        {/* 3. Seven Pathways — compact grid */}
        <section className="py-12">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-headline font-bold text-brand-text">{t('home.seven_pathways')}</h2>
              <p className="text-sm text-brand-muted mt-1">{t('home.pathways_subtitle')}</p>
            </div>
            <Link href="/pathways" className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-brand-accent hover:underline">
              {t('home.see_all')} <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {themeEntries.map(function ([id, theme]) {
              const count = pathwayCounts[id] ?? 0
              return (
                <Link
                  key={id}
                  href={'/pathways/' + theme.slug}
                  className="group relative bg-white rounded-card border border-brand-border overflow-hidden card-lift"
                >
                  {/* Color top bar */}
                  <div className="h-1.5" style={{ backgroundColor: theme.color }} />
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: theme.color }} />
                      <h3 className="font-serif font-bold text-brand-text text-sm">{theme.name}</h3>
                    </div>
                    <p className="text-xs text-brand-muted leading-relaxed line-clamp-2 mb-3">
                      {theme.description.split('.')[0]}.
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-brand-muted-light">{count} resources</span>
                      <span className="text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: theme.color }}>
                        Explore →
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        <div className="section-rule" />

        {/* 4. Persona selector */}
        <section className="py-12">
          <h2 className="text-title font-bold text-brand-text mb-1">Not sure where to start?</h2>
          <p className="text-sm text-brand-muted mb-6">Pick the one that sounds like you.</p>
          <PersonaSelector />
        </section>

        <div className="section-rule" />

        {/* 5. Latest content — magazine grid */}
        {feedItems.length > 0 && (
          <section className="py-12">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-headline font-bold text-brand-text">{t('wayfinder.whats_new')}</h2>
                <p className="text-sm text-brand-muted mt-1">Recently published for the Houston community</p>
              </div>
              <Link href="/compass" className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-brand-accent hover:underline">
                {t('home.see_all')} <ArrowRight size={14} />
              </Link>
            </div>

            {/* Magazine layout: featured + grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Featured card — large */}
              <div className="lg:col-span-3">
                <FeedCard key={feedItems[0].id} item={feedItems[0]} variant="grid" />
              </div>

              {/* Secondary cards — stacked list */}
              <div className="lg:col-span-2 space-y-4">
                {feedItems.slice(1, 4).map(function (item) {
                  return <FeedCard key={item.id} item={item} variant="list" />
                })}
              </div>
            </div>

            {/* Remaining cards in smaller grid */}
            {feedItems.length > 4 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                {feedItems.slice(4).map(function (item) {
                  return <FeedCard key={item.id} item={item} variant="list" />
                })}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}
