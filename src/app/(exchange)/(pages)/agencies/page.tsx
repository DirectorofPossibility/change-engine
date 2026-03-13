import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Government Agencies — Change Engine',
  description: 'Federal, state, and local government agencies serving the Houston area.',
}

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

const VISIBLE_PER_SECTION = 4

export default async function AgenciesPage() {
  const supabase = await createClient()
  const { data: agencies } = await supabase
    .from('agencies')
    .select('agency_id, agency_name, agency_acronym, gov_level_id, jurisdiction, description_5th_grade, website, phone')
    .order('agency_name')

  const grouped: Record<string, typeof agencies> = {}
  for (const a of agencies || []) {
    const level = a.gov_level_id || 'Other'
    if (!grouped[level]) grouped[level] = []
    grouped[level].push(a)
  }

  const levelOrder = ['GOV_FED', 'GOV_STATE', 'GOV_COUNTY', 'GOV_CITY', 'Other']
  const levelLabels: Record<string, string> = {
    GOV_FED: 'Federal', GOV_STATE: 'State of Texas', GOV_COUNTY: 'Harris County', GOV_CITY: 'City of Houston', Other: 'Other'
  }

  const totalCount = (agencies || []).length

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
            Government Agencies
          </h1>
          <p style={{ fontFamily: SERIF, fontSize: '1.1rem', color: MUTED, marginTop: '0.75rem', maxWidth: '38rem', lineHeight: 1.7 }}>
            Federal, state, and local agencies serving Houston and Harris County.
          </p>
          {totalCount > 0 && (
            <div className="flex flex-wrap gap-8 mt-8">
              <div>
                <span style={{ fontFamily: SERIF, fontSize: '2rem', color: INK }}>{totalCount}</span>
                <span style={{ fontFamily: MONO, fontSize: '0.65rem', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block' }}>Agencies</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontFamily: MONO, fontSize: '0.7rem', color: MUTED }}>
          <Link href="/" className="hover:underline" style={{ color: CLAY }}>Home</Link>
          <span className="mx-2">/</span>
          <span>Agencies</span>
        </nav>
      </div>

      {/* Main content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">
        {levelOrder.map(function (level) {
          const items = grouped[level]
          if (!items || items.length === 0) return null

          const visible = items.slice(0, VISIBLE_PER_SECTION)
          const rest = items.slice(VISIBLE_PER_SECTION)

          return (
            <section key={level} className="mb-10">
              <div className="flex items-baseline justify-between mb-1">
                <h2 style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK }}>{levelLabels[level] || level}</h2>
                <span style={{ fontFamily: MONO, fontSize: '0.7rem', color: MUTED }}>{items.length}</span>
              </div>
              <div style={{ height: 1, borderBottom: '1px dotted ' + RULE_COLOR, marginBottom: '1.5rem' }} />

              <div className="space-y-3">
                {visible.map(function (a) {
                  return (
                    <Link key={a.agency_id} href={`/agencies/${a.agency_id}`}
                      className="block p-5 border hover:border-current transition-colors"
                      style={{ borderColor: RULE_COLOR, background: PARCHMENT_WARM }}>
                      <h3 style={{ fontFamily: SERIF, color: INK, fontSize: '1rem' }}>
                        {a.agency_name}
                        {a.agency_acronym && <span style={{ color: MUTED, marginLeft: '0.5rem', fontSize: '0.85rem' }}>({a.agency_acronym})</span>}
                      </h3>
                      {a.description_5th_grade && <p style={{ fontFamily: SERIF, color: MUTED, fontSize: '0.85rem' }} className="mt-1 line-clamp-2">{a.description_5th_grade}</p>}
                      <div className="flex items-center gap-4 mt-2" style={{ fontFamily: MONO, color: MUTED, fontSize: '0.7rem' }}>
                        {a.jurisdiction && <span>{a.jurisdiction}</span>}
                        {a.phone && <span>{a.phone}</span>}
                      </div>
                    </Link>
                  )
                })}
              </div>

              {rest.length > 0 && (
                <details className="mt-3">
                  <summary style={{ fontFamily: SERIF, fontStyle: 'italic', color: CLAY, fontSize: '0.9rem', cursor: 'pointer' }}>
                    See {rest.length} more
                  </summary>
                  <div className="space-y-3 mt-3">
                    {rest.map(function (a) {
                      return (
                        <Link key={a.agency_id} href={`/agencies/${a.agency_id}`}
                          className="block p-5 border hover:border-current transition-colors"
                          style={{ borderColor: RULE_COLOR, background: PARCHMENT_WARM }}>
                          <h3 style={{ fontFamily: SERIF, color: INK, fontSize: '1rem' }}>
                            {a.agency_name}
                            {a.agency_acronym && <span style={{ color: MUTED, marginLeft: '0.5rem', fontSize: '0.85rem' }}>({a.agency_acronym})</span>}
                          </h3>
                          {a.description_5th_grade && <p style={{ fontFamily: SERIF, color: MUTED, fontSize: '0.85rem' }} className="mt-1 line-clamp-2">{a.description_5th_grade}</p>}
                          <div className="flex items-center gap-4 mt-2" style={{ fontFamily: MONO, color: MUTED, fontSize: '0.7rem' }}>
                            {a.jurisdiction && <span>{a.jurisdiction}</span>}
                            {a.phone && <span>{a.phone}</span>}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </details>
              )}

              <div className="my-10" style={{ height: 1, background: RULE_COLOR }} />
            </section>
          )
        })}

        {/* Footer link */}
        <Link href="/" style={{ fontFamily: SERIF, fontStyle: 'italic', color: CLAY, fontSize: '0.95rem' }} className="hover:underline">
          Back to the Guide
        </Link>
      </div>
    </div>
  )
}
