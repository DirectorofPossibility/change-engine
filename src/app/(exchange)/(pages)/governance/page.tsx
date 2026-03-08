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
import { createClient } from '@/lib/supabase/server'
import { IndexPageHero } from '@/components/exchange/IndexPageHero'
import { IndexWayfinder } from '@/components/exchange/IndexWayfinder'
import { FeaturedPromo } from '@/components/exchange/FeaturedPromo'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import Image from 'next/image'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Governance — Community Exchange',
  description: 'See who represents Houston at every level of government and the policies they are working on.',
}

const LEVELS = [
  { key: 'City', label: 'City of Houston', color: '#0d9488', icon: 'M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6' },
  { key: 'County', label: 'Harris County', color: '#d97706', icon: 'M3 21h18M4 21V10l8-7 8 7v11M9 21v-4h6v4' },
  { key: 'State', label: 'State of Texas', color: '#2563eb', icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
  { key: 'Federal', label: 'United States', color: '#7c3aed', icon: 'M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M12 3v4' },
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
  if (!status) return '#9B9590'
  const s = status.toLowerCase()
  if (s === 'passed' || s === 'enacted' || s === 'signed') return '#2D8659'
  if (s === 'pending' || s === 'introduced' || s === 'in committee') return '#C47D1A'
  if (s === 'failed' || s === 'vetoed' || s === 'dead') return '#C53030'
  return '#9B9590'
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
        title="Governance"
        subtitle="Officials & policies at every level"
        intro="From City Hall to the U.S. Capitol — see who represents Houston and the policies shaping your community."
        stats={[
          { value: allOfficials.length, label: 'Civic Leaders' },
          { value: allPolicies.length, label: 'Policies Tracked' },
          { value: LEVELS.length, label: 'Levels of Government' },
        ]}
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[{ label: 'Governance' }]} />

        <div className="flex flex-col lg:flex-row gap-8 mt-4">
          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-10">
            {LEVELS.map(function (level) {
              const lvlOfficials = officialsByLevel[level.key] || []
              const lvlPolicies = (policiesByLevel[level.key] || []).slice(0, 12)
              if (lvlOfficials.length === 0 && lvlPolicies.length === 0) return null

              return (
                <section key={level.key}>
                  {/* Level header */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: level.color + '14' }}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={level.color}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={level.icon} />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-serif font-bold text-brand-text">{level.label}</h2>
                      <p className="text-xs text-brand-muted">
                        {lvlOfficials.length} official{lvlOfficials.length !== 1 ? 's' : ''}
                        {lvlPolicies.length > 0 ? ` · ${lvlPolicies.length} recent polic${lvlPolicies.length !== 1 ? 'ies' : 'y'}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Officials row */}
                  {lvlOfficials.length > 0 && (
                    <div className="mb-5">
                      <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-muted mb-3">Who represents you</p>
                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {lvlOfficials.map(function (o) {
                          return (
                            <Link
                              key={o.official_id}
                              href={'/officials/' + o.official_id}
                              className="group flex-shrink-0 w-[160px] bg-white rounded-xl border-2 border-brand-border hover:-translate-y-1 transition-all duration-200 overflow-hidden"
                              style={{ boxShadow: '3px 3px 0 ' + level.color + '20' }}
                            >
                              {/* Photo or color header */}
                              {o.photo_url ? (
                                <div className="h-[100px] overflow-hidden">
                                  <Image
                                    src={o.photo_url.replace(/^http:\/\//, 'https://')}
                                    alt={o.official_name}
                                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                                   width={800} height={400} />
                                </div>
                              ) : (
                                <div className="h-[60px] flex items-center justify-center" style={{ background: 'linear-gradient(135deg, ' + level.color + ' 0%, ' + level.color + 'cc 100%)' }}>
                                  <span className="text-white/50 text-2xl font-serif font-bold">{o.official_name.charAt(0)}</span>
                                </div>
                              )}
                              <div className="p-3">
                                <p className="text-sm font-bold text-brand-text leading-tight line-clamp-1">{o.official_name}</p>
                                <p className="text-[11px] text-brand-muted mt-0.5 leading-snug line-clamp-2">{o.title}</p>
                                {o.party && (
                                  <p className="text-[10px] mt-1.5 font-medium" style={{ color: level.color }}>{o.party}</p>
                                )}
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Policies list */}
                  {lvlPolicies.length > 0 && (
                    <div>
                      <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-muted mb-3">What they're working on</p>
                      <div className="bg-white rounded-xl border-2 border-brand-border overflow-hidden" style={{ boxShadow: '3px 3px 0 #D5D0C8' }}>
                        <div className="divide-y divide-brand-border">
                          {lvlPolicies.map(function (p) {
                            const displayTitle = p.title_6th_grade || p.policy_name
                            return (
                              <Link
                                key={p.policy_id}
                                href={'/policies/' + p.policy_id}
                                className="flex items-start gap-3 px-4 py-3 hover:bg-brand-bg transition-colors group"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    {p.bill_number && (
                                      <span className="text-[11px] font-mono text-brand-muted flex-shrink-0">{p.bill_number}</span>
                                    )}
                                    {p.status && (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-medium flex-shrink-0" style={{ color: statusDotColor(p.status) }}>
                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusDotColor(p.status) }} />
                                        {p.status}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm font-medium text-brand-text leading-snug line-clamp-2 group-hover:text-brand-accent transition-colors">
                                    {displayTitle}
                                  </p>
                                  {(p.summary_6th_grade || p.summary_5th_grade) && (
                                    <p className="text-xs text-brand-muted mt-1 line-clamp-1">
                                      {p.summary_6th_grade || p.summary_5th_grade}
                                    </p>
                                  )}
                                </div>
                                {p.last_action_date && (
                                  <span className="text-[10px] text-brand-muted flex-shrink-0 mt-1 tabular-nums">
                                    {new Date(p.last_action_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                )}
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                      {(policiesByLevel[level.key] || []).length > 12 && (
                        <div className="mt-2 text-right">
                          <Link href={'/policies?level=' + level.key} className="text-xs font-semibold hover:underline" style={{ color: level.color }}>
                            See all {(policiesByLevel[level.key] || []).length} policies &rarr;
                          </Link>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Divider between levels */}
                  <div className="mt-8 h-px bg-gradient-to-r from-transparent via-brand-border to-transparent" />
                </section>
              )
            })}
          </div>

          {/* Wayfinder sidebar */}
          <div className="hidden lg:block lg:w-[280px] flex-shrink-0">
            <div className="sticky top-24">
              <IndexWayfinder
                currentPage="governance"
                color="#805ad5"
                related={[
                  { label: 'Officials', href: '/officials', color: '#805ad5' },
                  { label: 'Policies', href: '/policies', color: '#3182ce' },
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
