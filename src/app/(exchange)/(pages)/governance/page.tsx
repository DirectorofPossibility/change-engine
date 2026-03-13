/**
 * @fileoverview Governance — officials + policies braided by government level.
 *
 * Shows City, County, State, and Federal tiers, each with its officials
 * (photo cards) and recent policies (compact list), creating a unified
 * view of "who represents you" and "what they're working on."
 *
 * @route GET /governance
 */
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 86400

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

export const metadata: Metadata = {
  title: 'Governance — Change Engine',
  description: 'See who represents Houston at every level of government and the policies they are working on.',
}

const LEVELS = [
  { key: 'City', label: 'City of Houston' },
  { key: 'County', label: 'Harris County' },
  { key: 'State', label: 'State of Texas' },
  { key: 'Federal', label: 'United States' },
] as const

interface Official {
  official_id: string
  official_name: string
  title: string | null
  level: string | null
  party: string | null
  photo_url: string | null
  website: string | null
}

interface Policy {
  policy_id: string
  policy_name: string
  title_6th_grade: string | null
  summary_6th_grade: string | null
  summary_5th_grade: string | null
  level: string | null
  status: string | null
  bill_number: string | null
  last_action_date: string | null
  policy_type: string | null
}

function statusDotColor(status: string | null): string {
  if (!status) return MUTED
  const s = status.toLowerCase()
  if (s === 'passed' || s === 'enacted' || s === 'signed') return '#2D8659'
  if (s === 'pending' || s === 'introduced' || s === 'in committee') return '#C47D1A'
  if (s === 'failed' || s === 'vetoed' || s === 'dead') return '#C53030'
  return MUTED
}

export default async function GovernancePage() {
  const supabase = await createClient()

  const [{ data: officials }, { data: policies }] = await Promise.all([
    supabase
      .from('elected_officials')
      .select('official_id, official_name, title, level, party, photo_url, website')
      .order('official_name'),
    supabase
      .from('policies')
      .select('policy_id, policy_name, title_6th_grade, summary_6th_grade, summary_5th_grade, level, status, bill_number, last_action_date, policy_type')
      .order('last_action_date', { ascending: false })
      .limit(200),
  ])

  const allOfficials = (officials ?? []) as unknown as Official[]
  const allPolicies = (policies ?? []) as unknown as Policy[]

  // Group by level
  const officialsByLevel: Record<string, Official[]> = {}
  const policiesByLevel: Record<string, Policy[]> = {}
  for (const o of allOfficials) {
    const lvl = o.level || 'Other'
    if (!officialsByLevel[lvl]) officialsByLevel[lvl] = []
    officialsByLevel[lvl].push(o)
  }
  for (const p of allPolicies) {
    const lvl = p.level || 'Other'
    if (!policiesByLevel[lvl]) policiesByLevel[lvl] = []
    policiesByLevel[lvl].push(p)
  }

  return (
    <div style={{ background: PARCHMENT }} className="min-h-screen">
      {/* Hero */}
      <div style={{ background: PARCHMENT_WARM }} className="relative overflow-hidden border-b">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="max-w-[900px] mx-auto px-6 py-12 relative">
          <p style={{ fontFamily: MONO, color: MUTED, fontSize: 11, letterSpacing: '0.12em' }} className="uppercase mb-3">
            The Change Engine
          </p>
          <h1 style={{ fontFamily: SERIF, color: INK }} className="text-3xl sm:text-4xl mb-3">
            Governance
          </h1>
          <p style={{ fontFamily: SERIF, color: MUTED, fontSize: 17 }} className="max-w-[600px] leading-relaxed mb-4">
            From City Hall to the Capitol -- the officials who represent Houston and the policies they are working on.
          </p>
          <div className="flex gap-6" style={{ fontFamily: MONO, fontSize: 12, color: MUTED }}>
            <span><strong style={{ color: INK }}>{allOfficials.length}</strong> Officials</span>
            <span><strong style={{ color: INK }}>{allPolicies.length}</strong> Policies Tracked</span>
            <span><strong style={{ color: INK }}>{LEVELS.length}</strong> Levels</span>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-4 pb-2">
        <nav style={{ fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: '0.06em' }} className="uppercase">
          <span>Governance</span>
        </nav>
      </div>

      {/* Main Content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">
        {LEVELS.map(function (level, idx) {
          const lvlOfficials = officialsByLevel[level.key] || []
          const lvlPolicies = (policiesByLevel[level.key] || []).slice(0, 12)
          if (lvlOfficials.length === 0 && lvlPolicies.length === 0) return null

          return (
            <section key={level.key}>
              {/* Level header */}
              <div className="flex items-baseline justify-between mb-1">
                <h2 style={{ fontFamily: SERIF, color: INK, fontSize: 24 }}>{level.label}</h2>
              </div>
              <div style={{ height: 1, background: RULE_COLOR }} className="mb-1" />
              <p style={{ fontFamily: MONO, color: MUTED, fontSize: 11 }} className="mb-5">
                {lvlOfficials.length} official{lvlOfficials.length !== 1 ? 's' : ''}
                {lvlPolicies.length > 0 ? ` / ${lvlPolicies.length} recent polic${lvlPolicies.length !== 1 ? 'ies' : 'y'}` : ''}
              </p>

              {/* Officials row */}
              {lvlOfficials.length > 0 && (
                <div className="mb-6">
                  <p style={{ fontFamily: MONO, fontSize: 10, color: MUTED, letterSpacing: '0.1em' }} className="uppercase mb-3">
                    Who represents you
                  </p>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {lvlOfficials.slice(0, 8).map(function (o) {
                      return (
                        <Link
                          key={o.official_id}
                          href={'/officials/' + o.official_id}
                          className="flex-shrink-0 w-[150px] border overflow-hidden transition-colors hover:border-current"
                          style={{ borderColor: RULE_COLOR, background: PARCHMENT_WARM }}
                        >
                          {o.photo_url ? (
                            <div className="h-[90px] overflow-hidden">
                              <Image
                                src={o.photo_url.replace(/^http:\/\//, 'https://')}
                                alt={o.official_name}
                                className="w-full h-full object-cover object-top"
                                width={150} height={90}
                              />
                            </div>
                          ) : (
                            <div className="h-[50px] flex items-center justify-center" style={{ background: PARCHMENT }}>
                              <span style={{ fontFamily: SERIF, color: MUTED, fontSize: 20 }}>{o.official_name.charAt(0)}</span>
                            </div>
                          )}
                          <div className="p-3">
                            <p style={{ fontFamily: SERIF, color: INK, fontSize: 13 }} className="leading-tight line-clamp-1">{o.official_name}</p>
                            <p style={{ fontFamily: MONO, color: MUTED, fontSize: 10 }} className="mt-0.5 leading-snug line-clamp-2">{o.title}</p>
                            {o.party && (
                              <p style={{ fontFamily: MONO, color: CLAY, fontSize: 10 }} className="mt-1">{o.party}</p>
                            )}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                  {lvlOfficials.length > 8 && (
                    <details className="mt-2">
                      <summary style={{ fontFamily: SERIF, fontStyle: 'italic', color: CLAY, cursor: 'pointer', fontSize: 14 }}>
                        Show all {lvlOfficials.length} officials...
                      </summary>
                      <div className="flex gap-3 overflow-x-auto pb-2 mt-2">
                        {lvlOfficials.slice(8).map(function (o) {
                          return (
                            <Link
                              key={o.official_id}
                              href={'/officials/' + o.official_id}
                              className="flex-shrink-0 w-[150px] border overflow-hidden transition-colors hover:border-current"
                              style={{ borderColor: RULE_COLOR, background: PARCHMENT_WARM }}
                            >
                              {o.photo_url ? (
                                <div className="h-[90px] overflow-hidden">
                                  <Image
                                    src={o.photo_url.replace(/^http:\/\//, 'https://')}
                                    alt={o.official_name}
                                    className="w-full h-full object-cover object-top"
                                    width={150} height={90}
                                  />
                                </div>
                              ) : (
                                <div className="h-[50px] flex items-center justify-center" style={{ background: PARCHMENT }}>
                                  <span style={{ fontFamily: SERIF, color: MUTED, fontSize: 20 }}>{o.official_name.charAt(0)}</span>
                                </div>
                              )}
                              <div className="p-3">
                                <p style={{ fontFamily: SERIF, color: INK, fontSize: 13 }} className="leading-tight line-clamp-1">{o.official_name}</p>
                                <p style={{ fontFamily: MONO, color: MUTED, fontSize: 10 }} className="mt-0.5 line-clamp-2">{o.title}</p>
                                {o.party && (
                                  <p style={{ fontFamily: MONO, color: CLAY, fontSize: 10 }} className="mt-1">{o.party}</p>
                                )}
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    </details>
                  )}
                </div>
              )}

              {/* Policies list */}
              {lvlPolicies.length > 0 && (
                <div className="mb-4">
                  <p style={{ fontFamily: MONO, fontSize: 10, color: MUTED, letterSpacing: '0.1em' }} className="uppercase mb-3">
                    What they are working on
                  </p>
                  <div className="border overflow-hidden" style={{ borderColor: RULE_COLOR }}>
                    {lvlPolicies.map(function (p, pIdx) {
                      const displayTitle = p.title_6th_grade || p.policy_name
                      return (
                        <Link
                          key={p.policy_id}
                          href={'/policies/' + p.policy_id}
                          className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-opacity-50"
                          style={{ borderBottom: pIdx < lvlPolicies.length - 1 ? `1px solid ${RULE_COLOR}` : 'none', background: PARCHMENT_WARM }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              {p.bill_number && (
                                <span style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}>{p.bill_number}</span>
                              )}
                              {p.status && (
                                <span className="inline-flex items-center gap-1" style={{ fontSize: 11, fontWeight: 500, color: statusDotColor(p.status) }}>
                                  <span className="w-1.5 h-1.5" style={{ backgroundColor: statusDotColor(p.status), display: 'inline-block' }} />
                                  {p.status}
                                </span>
                              )}
                            </div>
                            <p style={{ fontFamily: SERIF, color: INK, fontSize: 14 }} className="leading-snug line-clamp-2">
                              {displayTitle}
                            </p>
                            {(p.summary_6th_grade || p.summary_5th_grade) && (
                              <p style={{ fontFamily: SERIF, color: MUTED, fontSize: 12 }} className="mt-1 line-clamp-1">
                                {p.summary_6th_grade || p.summary_5th_grade}
                              </p>
                            )}
                          </div>
                          {p.last_action_date && (
                            <span style={{ fontFamily: MONO, fontSize: 10, color: MUTED }} className="flex-shrink-0 mt-1 tabular-nums">
                              {new Date(p.last_action_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                  {(policiesByLevel[level.key] || []).length > 12 && (
                    <div className="mt-2 text-right">
                      <Link href={'/policies?level=' + level.key} style={{ fontFamily: MONO, color: CLAY, fontSize: 12 }} className="hover:underline">
                        See all {(policiesByLevel[level.key] || []).length} policies &rarr;
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Divider between levels */}
              <div className="my-10" style={{ height: 1, background: RULE_COLOR }} />
            </section>
          )
        })}

        {/* Footer link */}
        <div className="text-center pb-12">
          <Link href="/" style={{ fontFamily: MONO, color: CLAY, fontSize: 12, letterSpacing: '0.06em' }} className="uppercase hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
