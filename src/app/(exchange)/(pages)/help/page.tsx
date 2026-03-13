/**
 * @fileoverview Help / Available Resources listing page.
 *
 * Displays all life situations organized by urgency level, with editorial
 * culture guide aesthetic. Includes a crisis resource banner.
 *
 * @datasource Supabase tables: life_situations, translations
 * @caching ISR with `revalidate = 300` (5 minutes)
 * @route GET /help
 */
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getLifeSituations, getLangId, fetchTranslationsForTable } from '@/lib/data/exchange'
import { LifeSituationCard } from '@/components/exchange/LifeSituationCard'
import { URGENCY_LEVELS } from '@/lib/constants'
import { HelpCrisisBanner } from './HelpCrisisBanner'
import { HelpUrgencyHeader } from './HelpUrgencyHeader'

export const revalidate = 300

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

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
    <div style={{ background: PARCHMENT }} className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: PARCHMENT_WARM }}>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="relative z-10 max-w-[900px] mx-auto px-6 py-16 text-center">
          <p style={{ fontFamily: MONO, color: MUTED }} className="text-xs uppercase tracking-widest mb-4">
            Change Engine
          </p>
          <h1 style={{ fontFamily: SERIF, color: INK }} className="text-4xl sm:text-5xl mb-4">
            Available Resources
          </h1>
          <p style={{ fontFamily: SERIF, color: MUTED }} className="text-lg max-w-xl mx-auto leading-relaxed">
            Find services and resources for food, housing, healthcare, jobs, and more in Houston.
          </p>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontFamily: MONO, color: MUTED }} className="text-xs">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-2">/</span>
          <span style={{ color: INK }}>Available Resources</span>
        </nav>
      </div>

      {/* Main content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">
        <HelpCrisisBanner />

        <div className="space-y-8">
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

        {/* Divider */}
        <div style={{ borderTop: '1px solid ' + RULE_COLOR }} className="my-10" />

        {/* Footer */}
        <div className="text-center">
          <Link href="/" style={{ fontFamily: MONO, color: CLAY }} className="text-xs hover:underline">
            Back to Change Engine
          </Link>
        </div>
      </div>
    </div>
  )
}
