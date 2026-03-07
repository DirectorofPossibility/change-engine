import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getWayfinderContext, getPolicyFocusAreas, getPolicyGeography } from '@/lib/data/exchange'
import { DetailWayfinder } from '@/components/exchange/DetailWayfinder'
import { getUserProfile } from '@/lib/auth/roles'
import { THEMES } from '@/lib/constants'
import { notFound } from 'next/navigation'

export const revalidate = 300

/* ── helpers ─────────────────────────────────────────────────────────── */

function levelColor(level: string | null): string {
  switch (level) {
    case 'Federal': return '#3182ce'
    case 'State':   return '#d69e2e'
    case 'County':  return '#38a169'
    case 'City':    return '#805ad5'
    default:        return '#6B6560'
  }
}

function statusStyle(status: string | null): { bg: string; text: string } {
  if (!status) return { bg: '#F8F9FC', text: '#6B6560' }
  const s = status.toLowerCase()
  if (s.includes('passed') || s.includes('enacted') || s.includes('signed'))
    return { bg: '#dcfce7', text: '#166534' }
  if (s.includes('pending') || s.includes('introduced') || s.includes('committee'))
    return { bg: '#fef9c3', text: '#854d0e' }
  if (s.includes('failed') || s.includes('vetoed') || s.includes('dead'))
    return { bg: '#fee2e2', text: '#991b1b' }
  return { bg: '#F8F9FC', text: '#6B6560' }
}

function formatDate(d: string | null): string | null {
  if (!d) return null
  try {
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch { return null }
}

const formatGeoType: Record<string, string> = {
  council_district: 'Council District',
  state_house: 'State House District',
  state_senate: 'State Senate District',
  congressional: 'Congressional District',
  county: 'County',
  city: 'City',
  super_neighborhood: 'Super Neighborhood',
  zip: 'ZIP Code',
}

function getThemeColor(themeId: string | null): string {
  if (!themeId) return '#6B6560'
  const theme = THEMES[themeId as keyof typeof THEMES]
  return theme ? theme.color : '#6B6560'
}

/* ── metadata ────────────────────────────────────────────────────────── */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('policies')
    .select('policy_name, title_6th_grade, summary_6th_grade')
    .eq('policy_id', id)
    .single()

  if (!data) return { title: 'Policy Not Found' }
  const title = (data as any).title_6th_grade || (data as any).policy_name || 'Policy'
  return {
    title: `${title} — Community Exchange`,
    description: (data as any).summary_6th_grade || undefined,
  }
}

/* ── page ─────────────────────────────────────────────────────────────── */

export default async function PolicyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  /* Fetch the policy */
  const { data: policy } = await supabase
    .from('policies')
    .select('*')
    .eq('policy_id', id)
    .single()

  if (!policy) notFound()

  const p = policy as any

  /* Parallel data fetching */
  const [officialsJunction, relatedPolicies, focusAreas, geography, wayfinder, profile] =
    await Promise.all([
      supabase
        .from('policy_officials')
        .select('official_id')
        .eq('policy_id', id)
        .then(async ({ data: junctions }) => {
          if (!junctions || junctions.length === 0) return []
          const ids = junctions.map((j: any) => j.official_id)
          const { data: officials } = await supabase
            .from('elected_officials')
            .select('official_id, official_name, title, level, party')
            .in('official_id', ids)
          return officials || []
        }),
      supabase
        .from('policies')
        .select('policy_id, policy_name, title_6th_grade, bill_number, status, government_level')
        .eq('government_level', p.government_level || '')
        .eq('is_published', true)
        .neq('policy_id', id)
        .order('introduced_date', { ascending: false })
        .limit(4)
        .then(({ data }) => data || []),
      getPolicyFocusAreas(id),
      getPolicyGeography(id),
      getWayfinderContext('policy', id),
      getUserProfile(),
    ])

  const userRole = profile?.role || undefined

  /* Group geography by geo_type */
  const geoGrouped: Record<string, string[]> = {}
  for (const g of geography) {
    const label = formatGeoType[g.geo_type] || g.geo_type
    if (!geoGrouped[label]) geoGrouped[label] = []
    geoGrouped[label].push(g.geo_id)
  }

  const title = p.title_6th_grade || p.policy_name || 'Untitled Policy'
  const summary = p.summary_6th_grade || p.summary || null
  const impact = p.impact_statement || null
  const level = p.government_level || null
  const status = p.status || null
  const lColor = levelColor(level)
  const sStyle = statusStyle(status)
  const introduced = formatDate(p.introduced_date)
  const lastAction = formatDate(p.last_action_date || p.last_action)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
      {/* Back bar */}
      <div className="border-b" style={{ borderColor: '#E2DDD5' }}>
        <div className="mx-auto max-w-7xl px-4 py-3">
          <Link
            href="/design2/policies"
            className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-70"
            style={{ color: '#6B6560' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Policies
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* ── Main column ──────────────────────────────────────── */}
          <article className="flex-1 min-w-0">
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {level && (
                <span
                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white"
                  style={{ backgroundColor: lColor }}
                >
                  {level}
                </span>
              )}
              {status && (
                <span
                  className="rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider"
                  style={{ backgroundColor: sStyle.bg, color: sStyle.text }}
                >
                  {status}
                </span>
              )}
              {p.bill_number && (
                <span className="text-[12px] font-medium" style={{ color: '#9B9590' }}>
                  {p.bill_number}
                </span>
              )}
            </div>

            {/* Title */}
            <h1
              className="font-serif text-3xl font-bold leading-tight lg:text-4xl"
              style={{ color: '#1a1a1a' }}
            >
              {title}
            </h1>

            {/* Timeline */}
            {(introduced || lastAction || p.source_url) && (
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm" style={{ color: '#6B6560' }}>
                {introduced && (
                  <span>Introduced {introduced}</span>
                )}
                {lastAction && (
                  <span>Last action {lastAction}</span>
                )}
                {p.source_url && (
                  <a
                    href={p.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium underline hover:opacity-70"
                    style={{ color: '#C75B2A' }}
                  >
                    View source
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                      <path d="M5.25 2.625H2.625V11.375H11.375V8.75" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M8.75 2.625H11.375V5.25" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M6.125 7.875L11.375 2.625" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                )}
              </div>
            )}

            {/* Summary */}
            {summary && (
              <div className="mt-8">
                <h2 className="font-serif text-xl font-bold mb-3" style={{ color: '#1a1a1a' }}>
                  Summary
                </h2>
                <p className="text-[15px] leading-relaxed max-w-[720px]" style={{ color: '#2C2C2C' }}>
                  {summary}
                </p>
              </div>
            )}

            {/* Impact statement */}
            {impact && (
              <div
                className="mt-8 rounded-xl border-l-4 p-5"
                style={{ backgroundColor: '#FEF3C7', borderColor: '#D97706' }}
              >
                <h3 className="font-serif text-lg font-bold mb-2" style={{ color: '#92400E' }}>
                  Potential Impact
                </h3>
                <p className="text-[14px] leading-relaxed" style={{ color: '#78350F' }}>
                  {impact}
                </p>
              </div>
            )}

            {/* ── Connected Officials ──────────────────────────── */}
            {(officialsJunction as any[]).length > 0 && (
              <div className="mt-10">
                <h2 className="font-serif text-xl font-bold mb-4" style={{ color: '#1a1a1a' }}>
                  Connected Officials
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(officialsJunction as any[]).map((o: any) => (
                    <Link
                      key={o.official_id}
                      href={`/design2/officials/${o.official_id}`}
                      className="flex items-center gap-3 bg-white rounded-xl border p-4 transition-all hover:shadow-md hover:translate-y-[-1px]"
                      style={{ borderColor: '#E2DDD5' }}
                    >
                      <div
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: levelColor(o.level) }}
                      >
                        {(o.official_name || '?').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[14px] font-semibold leading-tight truncate" style={{ color: '#1a1a1a' }}>
                          {o.official_name}
                        </p>
                        {o.title && (
                          <p className="text-[12px] mt-0.5 truncate" style={{ color: '#6B6560' }}>
                            {o.title}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {o.level && (
                            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: levelColor(o.level) }}>
                              {o.level}
                            </span>
                          )}
                          {o.party && (
                            <span className="text-[10px]" style={{ color: '#9B9590' }}>
                              {o.party}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* ── Related Policies ─────────────────────────────── */}
            {(relatedPolicies as any[]).length > 0 && (
              <div className="mt-10">
                <h2 className="font-serif text-xl font-bold mb-4" style={{ color: '#1a1a1a' }}>
                  Related Policies
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(relatedPolicies as any[]).map((rp: any) => {
                    const rpColor = levelColor(rp.government_level)
                    return (
                      <Link
                        key={rp.policy_id}
                        href={`/design2/policies/${rp.policy_id}`}
                        className="bg-white rounded-xl border p-4 transition-all hover:shadow-md hover:translate-y-[-1px]"
                        style={{ borderColor: '#E2DDD5' }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-2 h-2 rounded-full" style={{ background: rpColor }} />
                          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: rpColor }}>
                            {rp.government_level || 'Policy'}
                          </span>
                          {rp.bill_number && (
                            <span className="text-[11px] font-medium" style={{ color: '#9B9590' }}>{rp.bill_number}</span>
                          )}
                        </div>
                        <h3 className="font-serif text-[14px] font-semibold leading-snug line-clamp-2" style={{ color: '#1a1a1a' }}>
                          {rp.title_6th_grade || rp.policy_name}
                        </h3>
                        {rp.status && (
                          <div className="mt-2">
                            <span
                              className="text-[11px] font-medium px-2 py-0.5 rounded"
                              style={{ backgroundColor: statusStyle(rp.status).bg, color: statusStyle(rp.status).text }}
                            >
                              {rp.status}
                            </span>
                          </div>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </article>

          {/* ── Right sidebar ────────────────────────────────────── */}
          <aside className="w-full lg:w-[340px] lg:flex-shrink-0 flex flex-col gap-5">
            {/* Focus areas */}
            {focusAreas.length > 0 && (
              <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#E2DDD5' }}>
                <h2 className="font-serif text-lg font-bold mb-3" style={{ color: '#1a1a1a' }}>
                  Focus Areas
                </h2>
                <div className="flex flex-wrap gap-2">
                  {focusAreas.map((fa: any) => (
                    <span
                      key={fa.focus_id}
                      className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium"
                      style={{ borderColor: '#E2DDD5', color: '#1a1a1a' }}
                    >
                      <span
                        className="h-2 w-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getThemeColor(fa.theme_id) }}
                      />
                      {fa.focus_area_name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Geography */}
            {Object.keys(geoGrouped).length > 0 && (
              <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#E2DDD5' }}>
                <h2 className="font-serif text-lg font-bold mb-3" style={{ color: '#1a1a1a' }}>
                  Areas Affected
                </h2>
                <div className="flex flex-col gap-3">
                  {Object.entries(geoGrouped).map(([geoType, ids]) => (
                    <div key={geoType}>
                      <h3
                        className="text-[10px] font-bold uppercase tracking-wider mb-1.5"
                        style={{ color: '#6B6560' }}
                      >
                        {geoType}
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {ids.map((geoId) => (
                          <span
                            key={geoId}
                            className="rounded-md border px-2.5 py-1 text-[12px] font-medium"
                            style={{ borderColor: '#E2DDD5', color: '#1a1a1a', backgroundColor: '#FAF8F5' }}
                          >
                            {geoId}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DetailWayfinder */}
            <DetailWayfinder
              data={wayfinder}
              currentType="policy"
              currentId={id}
              userRole={userRole}
            />
          </aside>
        </div>
      </div>
    </div>
  )
}
