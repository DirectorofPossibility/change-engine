/**
 * @fileoverview Elected Officials — redesigned with immersive hero,
 * embedded ZIP search, social proof stats, and wayfinder sidebar.
 *
 * @datasource Supabase: elected_officials, translations, zip_codes
 * @caching ISR with `revalidate = 86400` (24 hours)
 * @route GET /officials
 */
import type { Metadata } from 'next'
import Link from 'next/link'
import { getOfficials, getLangId, fetchTranslationsForTable } from '@/lib/data/exchange'
import { OfficialsPageClient } from './OfficialsPageClient'
import { IndexPageHero } from '@/components/exchange/IndexPageHero'
import { IndexWayfinder } from '@/components/exchange/IndexWayfinder'
import { FeaturedPromo } from '@/components/exchange/FeaturedPromo'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Who Represents You — Community Exchange',
  description: 'Find your elected officials at every level of government in Houston, Texas.',
}

export default async function OfficialsPage() {
  const { officials, levels, profiles } = await getOfficials()

  const langId = await getLangId()
  const officialIds = officials.map(function (o) { return o.official_id })
  const translations = langId ? await fetchTranslationsForTable('elected_officials', officialIds, langId) : {}

  // Compute stats for social proof
  const federalCount = officials.filter(function (o) { return o.level === 'Federal' }).length
  const stateCount = officials.filter(function (o) { return o.level === 'State' }).length
  const localCount = officials.filter(function (o) { return o.level === 'County' || o.level === 'City' }).length

  return (
    <div>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <Link href="/centers/accountability" className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider mb-2 hover:underline" style={{ color: '#805ad5' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#805ad5' }} />
          Accountability Center
        </Link>
      </div>
      <IndexPageHero
        color="#805ad5"
        pattern="metatron"
        titleKey="officials.title"
        subtitleKey="officials.subtitle"
        intro="Democracy works when you know who represents you. Enter your ZIP code to find your elected officials at every level — from City Hall to the U.S. Capitol."
        stats={[
          { value: officials.length, label: 'Civic Leaders' },
          { value: federalCount, label: 'Federal' },
          { value: stateCount, label: 'State' },
          { value: localCount, label: 'Local' },
        ]}
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[{ label: 'Officials' }]} />

        <div className="flex flex-col lg:flex-row gap-8 mt-4">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            <OfficialsPageClient
              officials={officials}
              levels={levels}
              translations={translations}
              linkedinProfiles={profiles}
            />
          </div>

          {/* Wayfinder sidebar — desktop */}
          <div className="hidden lg:block lg:w-[280px] flex-shrink-0">
            <div className="sticky top-24">
              <IndexWayfinder
                currentPage="officials"
                color="#805ad5"
                related={[
                  { label: 'Governance Overview', href: '/governance', color: '#805ad5' },
                  { label: 'Policies & Legislation', href: '/policies', color: '#3182ce' },
                  { label: 'Elections', href: '/elections', color: '#38a169' },
                  { label: 'Neighborhoods', href: '/neighborhoods', color: '#d69e2e' },
                ]}
              />
              <div className="mt-4"><FeaturedPromo variant="card" /></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
