import type { Metadata } from 'next'
import { THEMES, PAGE_INTROS } from '@/lib/constants'
import { getFocusAreas, getSDGs, getSDOHDomains } from '@/lib/data/exchange'
import { ExploreFilterClient } from './ExploreFilterClient'
import { PageHero } from '@/components/exchange/PageHero'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Explore Topics — The Change Engine',
  description: 'Browse focus areas, SDGs, and social determinants of health across all pathways.',
}

export default async function ExplorePage() {
  const [focusAreas, sdgs, sdohDomains] = await Promise.all([
    getFocusAreas(),
    getSDGs(),
    getSDOHDomains(),
  ])

  // Group focus areas by theme_id
  const themes = Object.entries(THEMES).map(function ([id, theme]) {
    return {
      id,
      name: theme.name,
      color: theme.color,
      emoji: theme.emoji,
      focusAreas: focusAreas.filter(function (fa) { return fa.theme_id === id }),
    }
  })

  // Focus areas without a theme
  const unthemed = focusAreas.filter(function (fa) { return !fa.theme_id })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <PageHero variant="editorial" titleKey="explore.title" intro={PAGE_INTROS.explore} />

      <ExploreFilterClient
        themes={themes}
        unthemedAreas={unthemed}
        sdgs={sdgs.map(function (s) { return { sdg_id: s.sdg_id, sdg_number: s.sdg_number, sdg_name: s.sdg_name, sdg_color: s.sdg_color } })}
        sdohDomains={sdohDomains.map(function (d) { return { sdoh_code: d.sdoh_code, sdoh_name: d.sdoh_name } })}
      />
    </div>
  )
}
