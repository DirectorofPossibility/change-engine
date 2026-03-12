/**
 * @fileoverview Help / Available Resources listing page.
 *
 * Displays all life situations organized by urgency level, with a hero
 * banner featuring the community-gathering illustration. Includes a crisis
 * resource banner at the top for emergency contacts.
 *
 * @datasource Supabase tables: life_situations, translations
 * @caching ISR with `revalidate = 300` (5 minutes)
 * @route GET /help
 */
import type { Metadata } from 'next'
import { getLifeSituations, getLangId, fetchTranslationsForTable } from '@/lib/data/exchange'
import { LifeSituationCard } from '@/components/exchange/LifeSituationCard'
import { PageHero } from '@/components/exchange/PageHero'
import { PAGE_INTROS, URGENCY_LEVELS } from '@/lib/constants'
import { HelpCrisisBanner } from './HelpCrisisBanner'
import { HelpUrgencyHeader } from './HelpUrgencyHeader'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { IndexWayfinder } from '@/components/exchange/IndexWayfinder'
import { FeaturedPromo } from '@/components/exchange/FeaturedPromo'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Available Resources',
  description: 'Find services and resources for food, housing, healthcare, jobs, and more in Houston.',
}

export default async function HelpPage() {
  const situations = await getLifeSituations()
  const langId = await getLangId()
  const translations = langId
    ? await fetchTranslationsForTable('life_situations', situations.map(s => s.situation_id), langId)
    : {}

  const grouped: Record<string, typeof situations> = {}
  situations.forEach((s) => {
    const level = s.urgency_level || 'Low'
    if (!grouped[level]) grouped[level] = []
    grouped[level].push(s)
  })

  return (
    <div>
      <PageHero
        variant="sacred"
        sacredPattern="tripod"
        gradientColor="#E8723A"
        titleKey="help.title"
        subtitleKey="help.subtitle"
        intro={PAGE_INTROS.availableResources}
      />

      <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[{ label: 'Available Resources' }]} />
        <HelpCrisisBanner />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
          <div className="space-y-6">
            {URGENCY_LEVELS.map((level) => {
              const items = grouped[level]
              if (!items || items.length === 0) return null

              return (
                <section key={level}>
                  <HelpUrgencyHeader level={level} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {items.map((s) => (
                      <LifeSituationCard
                        key={s.situation_id}
                        name={s.situation_name}
                        slug={s.situation_slug}
                        description={s.description_5th_grade}
                        urgency={s.urgency_level}
                        iconName={s.icon_name}
                        translatedName={translations[s.situation_id]?.title}
                        translatedDescription={translations[s.situation_id]?.summary}
                      />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <IndexWayfinder currentPage="help" related={[{label:'Services',href:'/services'},{label:'Benefits',href:'/benefits'},{label:'Agencies',href:'/agencies'}]} color="#C75B2A" />
              <FeaturedPromo variant="card" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
