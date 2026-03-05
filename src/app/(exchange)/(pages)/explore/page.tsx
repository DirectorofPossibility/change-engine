import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { THEMES } from '@/lib/constants'
import { getFocusAreas, getSDGs, getSDOHDomains } from '@/lib/data/exchange'
import { getUnifiedKBItems } from '@/lib/data/library'
import { ExploreFilterClient } from './ExploreFilterClient'
import { PageHero } from '@/components/exchange/PageHero'
import { getUIStrings } from '@/lib/i18n'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { BookOpen, ArrowRight } from 'lucide-react'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Explore Topics — Community Exchange',
  description: 'Browse focus areas, SDGs, and social determinants of health across all pathways.',
}

/** Map theme IDs to i18n keys */
const THEME_I18N: Record<string, string> = {
  THEME_01: 'theme.our_health',
  THEME_02: 'theme.our_families',
  THEME_03: 'theme.our_neighborhood',
  THEME_04: 'theme.our_voice',
  THEME_05: 'theme.our_money',
  THEME_06: 'theme.our_planet',
  THEME_07: 'theme.the_bigger_we',
}

export default async function ExplorePage() {
  const [focusAreas, sdgs, sdohDomains, kbItems] = await Promise.all([
    getFocusAreas(),
    getSDGs(),
    getSDOHDomains(),
    getUnifiedKBItems(),
  ])

  const cookieStore = await cookies()
  const lang = cookieStore.get('lang')?.value || 'en'
  const t = getUIStrings(lang)

  const totalItems = kbItems.length

  // Group focus areas by theme_id, using translated theme names
  const themes = Object.entries(THEMES).map(function ([id, theme]) {
    return {
      id,
      name: t(THEME_I18N[id] || '') || theme.name,
      color: theme.color,
      emoji: theme.emoji,
      focusAreas: focusAreas.filter(function (fa) { return fa.theme_id === id }),
    }
  })

  const unthemed = focusAreas.filter(function (fa) { return !fa.theme_id })

  return (
    <div>
      <PageHero variant="editorial" titleKey="explore.title" introKey="explore.intro" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Breadcrumb items={[{ label: 'Explore' }]} />

        {/* Knowledge Base entry card */}
        <Link
          href="/explore/knowledge-base"
          className="group flex items-center gap-4 bg-white rounded-xl border border-brand-border p-5 mb-10 hover:shadow-md transition-shadow"
        >
          <div className="w-12 h-12 rounded-lg bg-brand-accent/10 flex items-center justify-center flex-shrink-0">
            <BookOpen size={22} className="text-brand-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-serif font-bold text-brand-text group-hover:text-brand-accent transition-colors">
              Knowledge Base
            </h2>
            <p className="text-sm text-brand-muted">
              Browse {totalItems > 0 ? totalItems + ' articles, reports, guides, and more' : 'articles and research'}
            </p>
          </div>
          <ArrowRight size={18} className="text-brand-muted group-hover:text-brand-accent transition-colors flex-shrink-0" />
        </Link>

        {/* Focus Area Explorer */}
        <section>
          <h2 className="text-2xl font-serif font-bold text-brand-text mb-6">Focus Areas</h2>
          <ExploreFilterClient
            themes={themes}
            unthemedAreas={unthemed}
            sdgs={sdgs.map(function (s) { return { sdg_id: s.sdg_id, sdg_number: s.sdg_number, sdg_name: s.sdg_name, sdg_color: s.sdg_color } })}
            sdohDomains={sdohDomains.map(function (d) { return { sdoh_code: d.sdoh_code, sdoh_name: d.sdoh_name } })}
          />
        </section>
      </div>
    </div>
  )
}
