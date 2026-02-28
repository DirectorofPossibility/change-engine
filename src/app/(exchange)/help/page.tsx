import type { Metadata } from 'next'
import { getLifeSituations } from '@/lib/data/exchange'
import { LifeSituationCard } from '@/components/exchange/LifeSituationCard'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'I Need Help',
  description: 'Find services and resources for food, housing, healthcare, jobs, and more in Houston.',
}

const URGENCY_ORDER = ['Critical', 'High', 'Medium', 'Low']

const URGENCY_HEADERS: Record<string, { label: string; color: string }> = {
  Critical: { label: 'Immediate Help Needed', color: 'text-red-700 border-red-300 bg-red-50' },
  High:     { label: 'Urgent Situations', color: 'text-orange-700 border-orange-300 bg-orange-50' },
  Medium:   { label: 'Important Needs', color: 'text-yellow-700 border-yellow-300 bg-yellow-50' },
  Low:      { label: 'General Support', color: 'text-green-700 border-green-300 bg-green-50' },
}

export default async function HelpPage() {
  const situations = await getLifeSituations()

  const grouped: Record<string, typeof situations> = {}
  situations.forEach((s) => {
    const level = s.urgency_level || 'Low'
    if (!grouped[level]) grouped[level] = []
    grouped[level].push(s)
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-brand-text mb-2">I Need Help</h1>
      <p className="text-brand-muted mb-8">
        Find support for life situations you may be facing. Resources are organized by urgency level.
      </p>

      {/* Crisis banner */}
      <div className="bg-red-50 border border-red-300 rounded-xl p-4 mb-8">
        <p className="text-sm text-red-700 font-semibold mb-1">In an emergency?</p>
        <p className="text-sm text-red-600">
          Call <a href="tel:911" className="font-bold underline">911</a> for emergencies &bull;{' '}
          <a href="tel:988" className="font-bold underline">988</a> for mental health crisis &bull;{' '}
          <a href="tel:1-800-799-7233" className="font-bold underline">1-800-799-7233</a> for domestic violence
        </p>
      </div>

      <div className="space-y-10">
        {URGENCY_ORDER.map((level) => {
          const items = grouped[level]
          if (!items || items.length === 0) return null
          const header = URGENCY_HEADERS[level]

          return (
            <section key={level}>
              <div className={`border rounded-lg px-4 py-2 mb-4 ${header.color}`}>
                <h2 className="font-semibold">{header.label}</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((s) => (
                  <LifeSituationCard
                    key={s.situation_id}
                    name={s.situation_name}
                    slug={s.situation_slug}
                    description={s.description_5th_grade}
                    urgency={s.urgency_level}
                    iconName={s.icon_name}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
