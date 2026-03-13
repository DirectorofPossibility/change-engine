/**
 * @fileoverview Elected Officials index — editorial culture guide treatment.
 *
 * @datasource Supabase: elected_officials, translations, zip_codes
 * @caching ISR with `revalidate = 86400` (24 hours)
 * @route GET /officials
 */
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { getOfficials, getLangId, fetchTranslationsForTable } from '@/lib/data/exchange'
import { getOfficialsByZip } from '@/lib/data/officials'
import { OfficialsPageClient } from './OfficialsPageClient'

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

export const revalidate = 86400

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
    <div style={{ background: PARCHMENT }} className="min-h-screen">
      {/* Hero */}
      <div style={{ background: PARCHMENT_WARM }} className="relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="max-w-[900px] mx-auto px-6 py-16 relative z-10">
          <p style={{ fontFamily: MONO, fontSize: '0.7rem', letterSpacing: '0.15em', color: MUTED, textTransform: 'uppercase' }}>
            The Change Engine
          </p>
          <h1 style={{ fontFamily: SERIF, fontSize: '2.5rem', color: INK, lineHeight: 1.15, marginTop: '0.75rem' }}>
            Who Represents You
          </h1>
          <p style={{ fontFamily: SERIF, fontSize: '1.1rem', color: MUTED, marginTop: '0.75rem', maxWidth: '38rem', lineHeight: 1.7 }}>
            The people making decisions about your city, your state, and your country. Look them up. Reach out.
          </p>
          <div className="flex flex-wrap gap-8 mt-8">
            <div>
              <span style={{ fontFamily: SERIF, fontSize: '2rem', color: INK }}>{sortedOfficials.length}</span>
              <span style={{ fontFamily: MONO, fontSize: '0.65rem', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block' }}>Officials</span>
            </div>
            <div>
              <span style={{ fontFamily: SERIF, fontSize: '2rem', color: INK }}>{federalCount}</span>
              <span style={{ fontFamily: MONO, fontSize: '0.65rem', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block' }}>Federal</span>
            </div>
            <div>
              <span style={{ fontFamily: SERIF, fontSize: '2rem', color: INK }}>{stateCount}</span>
              <span style={{ fontFamily: MONO, fontSize: '0.65rem', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block' }}>State</span>
            </div>
            <div>
              <span style={{ fontFamily: SERIF, fontSize: '2rem', color: INK }}>{localCount}</span>
              <span style={{ fontFamily: MONO, fontSize: '0.65rem', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block' }}>Local</span>
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontFamily: MONO, fontSize: '0.7rem', color: MUTED }}>
          <Link href="/" className="hover:underline" style={{ color: CLAY }}>Home</Link>
          <span className="mx-2">/</span>
          <span>Officials</span>
        </nav>
      </div>

      {/* Main content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">
        <OfficialsPageClient
          officials={sortedOfficials}
          levels={levels}
          translations={translations}
          linkedinProfiles={profiles}
        />
      </div>

      {/* Footer rule + link */}
      <div className="my-10 max-w-[900px] mx-auto px-6" style={{ height: 1, background: RULE_COLOR }} />
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <Link href="/" style={{ fontFamily: SERIF, fontStyle: 'italic', color: CLAY, fontSize: '0.95rem' }} className="hover:underline">
          Back to the Guide
        </Link>
      </div>
    </div>
  )
}
