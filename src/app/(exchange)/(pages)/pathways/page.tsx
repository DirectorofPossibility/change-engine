import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { THEMES, CENTERS } from '@/lib/constants'
import { getPathwayCounts, getCenterContentForPathway } from '@/lib/data/exchange'
import { PathwayCard } from '@/components/exchange/PathwayCard'
import { PageHero } from '@/components/exchange/PageHero'
import { getUIStrings } from '@/lib/i18n'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Seven Pathways Into Community Life',
  description: 'Explore health, families, neighborhood, voice, money, planet, and bridging divides.',
}

/** Map theme IDs to i18n keys for theme names */
const THEME_I18N: Record<string, string> = {
  THEME_01: 'theme.our_health',
  THEME_02: 'theme.our_families',
  THEME_03: 'theme.our_neighborhood',
  THEME_04: 'theme.our_voice',
  THEME_05: 'theme.our_money',
  THEME_06: 'theme.our_planet',
  THEME_07: 'theme.the_bigger_we',
}

/** Map center names to i18n keys */
const CENTER_I18N: Record<string, string> = {
  Learning: 'center.learning',
  Action: 'center.action',
  Resource: 'center.resource',
  Accountability: 'center.accountability',
}

export default async function PathwaysPage() {
  const pathwayCounts = await getPathwayCounts()

  const centerCountsPerPathway: Record<string, Record<string, number>> = {}
  await Promise.all(
    Object.keys(THEMES).map(async (id) => {
      centerCountsPerPathway[id] = await getCenterContentForPathway(id)
    })
  )

  const cookieStore = await cookies()
  const lang = cookieStore.get('lang')?.value || 'en'
  const t = getUIStrings(lang)

  return (
    <div>
      <PageHero variant="editorial" titleKey="pathways.title" subtitleKey="pathways.subtitle" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(THEMES).map(([id, theme]) => (
            <div key={id} className="space-y-3">
              <PathwayCard
                themeId={id}
                name={t(THEME_I18N[id] || '') || theme.name}
                color={theme.color}
                emoji={theme.emoji}
                slug={theme.slug}
                count={pathwayCounts[id] || 0}
              />
              {/* Center sub-counts */}
              <div className="flex gap-2 flex-wrap pl-2">
                {Object.entries(CENTERS).map(([centerName]) => {
                  const count = centerCountsPerPathway[id]?.[centerName] || 0
                  if (count === 0) return null
                  return (
                    <span key={centerName} className="text-xs text-brand-muted">
                      {t(CENTER_I18N[centerName] || '') || centerName} {count}
                    </span>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
