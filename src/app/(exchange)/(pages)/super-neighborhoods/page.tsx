/**
 * @fileoverview Super Neighborhoods listing page with neighborhood map hero.
 *
 * Displays Houston's 88 super neighborhoods with an interactive map and
 * grid of clickable cards, preceded by a hero banner with neighborhood
 * map imagery. Each card shows the neighborhood number, name, population,
 * and median income.
 *
 * @datasource Supabase tables: super_neighborhoods, GeoJSON boundaries
 * @caching ISR with `revalidate = 300` (5 minutes)
 * @route GET /super-neighborhoods
 */
import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { Users, DollarSign } from 'lucide-react'
import { getSuperNeighborhoods, getLangId, fetchTranslationsForTable } from '@/lib/data/exchange'
import { THEMES } from '@/lib/constants'
import { SuperNeighborhoodsMap } from './SuperNeighborhoodsMap'
import { PageHero } from '@/components/exchange/PageHero'
import { getUIStrings } from '@/lib/i18n'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Super Neighborhoods — The Change Engine',
  description: 'Explore Houston\'s 88 super neighborhoods. View boundaries, demographics, and community resources.',
}

export default async function SuperNeighborhoodsPage() {
  const superNeighborhoods = await getSuperNeighborhoods()
  const langId = await getLangId()
  const translations = langId
    ? await fetchTranslationsForTable('super_neighborhoods', superNeighborhoods.map(sn => sn.sn_id), langId)
    : {}

  // Resolve language for server-side UI strings
  const cookieStore = await cookies()
  const lang = cookieStore.get('lang')?.value || 'en'
  const t = getUIStrings(lang)

  return (
    <div>
      {/* Hero banner */}
      <PageHero
        titleKey="superNeighborhoods.title"
        subtitleKey="superNeighborhoods.subtitle"
        backgroundImage="/images/hero/neighborhood-map.svg"
        height="sm"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Breadcrumb items={[{ label: 'Super Neighborhoods' }]} />
        <p className="text-brand-muted mb-8 max-w-2xl">
          {t('superNeighborhoods.intro')}
        </p>

        {/* Interactive map with super neighborhood boundaries */}
        <SuperNeighborhoodsMap />

        {/* Grid of super neighborhoods */}
        <section className="mt-10">
          <h2 className="text-xl font-bold text-brand-text mb-4">
            {t('superNeighborhoods.all_heading')} ({superNeighborhoods.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {superNeighborhoods.map(sn => (
              <Link
                key={sn.sn_id}
                href={'/super-neighborhoods/' + sn.sn_id}
                className="bg-white rounded-xl border border-brand-border p-4 hover:shadow-md hover:border-brand-accent/30 transition-all"
              >
                <div className="flex items-start gap-3">
                  <span
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: THEMES.THEME_07.color }}
                  >
                    {sn.sn_number}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-brand-text text-sm truncate">
                      {translations[sn.sn_id]?.title || sn.sn_name}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-brand-muted">
                      {sn.population != null && (
                        <span className="flex items-center gap-1">
                          <Users size={10} />
                          {sn.population.toLocaleString()}
                        </span>
                      )}
                      {sn.median_income != null && (
                        <span className="flex items-center gap-1">
                          <DollarSign size={10} />
                          ${sn.median_income.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
