/**
 * @fileoverview Elected Officials index — editorial culture guide treatment.
 *
 * @datasource Supabase: elected_officials, translations, zip_codes
 * @caching ISR with `revalidate = 86400` (24 hours)
 * @route GET /officials
 */
import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { getOfficials, getLangId, fetchTranslationsForTable } from '@/lib/data/exchange'
import { getOfficialsByZip } from '@/lib/data/officials'
import { OfficialsPageClient } from './OfficialsPageClient'
import { IndexPageHero } from '@/components/exchange/IndexPageHero'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'


export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Who Represents You — Change Engine',
  description: 'Find your elected officials at every level of government in Houston, Texas.',
}

export default async function OfficialsPage() {
  const cookieStore = await cookies()
  const userZip = cookieStore.get('zip')?.value || ''

  const [{ officials, levels, profiles }, zipOfficials] = await Promise.all([
    getOfficials(),
    userZip ? getOfficialsByZip(userZip) : Promise.resolve(null),
  ])

  // If ZIP available, put geo-matched officials first
  let sortedOfficials = officials
  if (zipOfficials) {
    const zipMatched = [...zipOfficials.federal, ...zipOfficials.state, ...zipOfficials.county, ...zipOfficials.city]
    const zipMatchedIds = new Set(zipMatched.map((o: any) => o.official_id))
    const rest = officials.filter((o: any) => !zipMatchedIds.has(o.official_id))
    sortedOfficials = [...zipMatched, ...rest]
  }

  const langId = await getLangId()
  const officialIds = sortedOfficials.map(function (o) { return o.official_id })
  const translations = langId ? await fetchTranslationsForTable('elected_officials', officialIds, langId) : {}

  const federalCount = sortedOfficials.filter(function (o) { return o.level === 'Federal' }).length
  const stateCount = sortedOfficials.filter(function (o) { return o.level === 'State' }).length
  const localCount = sortedOfficials.filter(function (o) { return o.level === 'County' || o.level === 'City' }).length

  return (
    <div className="bg-paper min-h-screen">
      <IndexPageHero
        title="Who Represents You"
        subtitle="The people making decisions about your city, your state, and your country. Look them up. Reach out."
        color="#7a2018"
        stats={[
          { value: sortedOfficials.length, label: 'Officials' },
          { value: federalCount, label: 'Federal' },
          { value: stateCount, label: 'State' },
          { value: localCount, label: 'Local' },
        ]}
      />

      <Breadcrumb items={[{ label: 'Officials' }]} />

      {/* Main content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">
        <OfficialsPageClient
          officials={sortedOfficials}
          levels={levels}
          translations={translations}
          linkedinProfiles={profiles}
        />
      </div>

      {/* Cross-links */}
      <div className="max-w-[900px] mx-auto px-6 pt-4 pb-12">
        <div className="border-t border-rule pt-8">
          <p className="font-mono text-micro uppercase tracking-wider text-faint mb-4">Related</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link href="/elections" className="block p-4 border border-rule hover:border-ink transition-colors">
              <p className="font-body font-semibold text-ink mb-1">Elections & Voting</p>
              <p className="font-body text-sm text-muted">Upcoming elections and key dates</p>
            </Link>
            <Link href="/policies" className="block p-4 border border-rule hover:border-ink transition-colors">
              <p className="font-body font-semibold text-ink mb-1">Policies</p>
              <p className="font-body text-sm text-muted">Legislation and ordinances</p>
            </Link>
            <Link href="/call-your-senators" className="block p-4 border border-rule hover:border-ink transition-colors">
              <p className="font-body font-semibold text-ink mb-1">Call Your Senators</p>
              <p className="font-body text-sm text-muted">Make your voice heard</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
