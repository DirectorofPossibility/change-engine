import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getUIStrings } from '@/lib/i18n'
import { Mail, Phone, Globe, MapPin, Calendar, Linkedin } from 'lucide-react'
import { PolicyCard } from '@/components/exchange/PolicyCard'
import { RelatedContent } from '@/components/exchange/RelatedContent'
import { getLangId, fetchTranslationsForTable, getWayfinderContext, getRandomQuote } from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'
import { QuoteCard } from '@/components/exchange/QuoteCard'
import { OfficialDistrictMap } from './OfficialDistrictMap'
import { AdminEditPanel } from '@/components/exchange/AdminEditPanel'
import type { EditField } from '@/components/exchange/AdminEditPanel'
import { SpiralTracker } from '@/components/exchange/SpiralTracker'
import Image from 'next/image'
import { personJsonLd } from '@/lib/jsonld'


const FOCUS_DOT_COLORS = [
  '#1b5e8a', '#1a6b56', '#4a2870', '#6a4e10', '#1a5030', '#7a2018',
]

export const revalidate = 86400

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('elected_officials').select('official_name, title').eq('official_id', id).single()
  if (!data) return { title: 'Not Found' }
  return {
    title: data.official_name,
    description: data.title || 'Details on the Change Engine.',
  }
}

export default async function OfficialDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: official },
    { data: profileRow },
    { data: policyJunctions },
    { data: focusJunctions },
    { data: countyJunctions },
    { data: committees },
    { data: votes },
  ] = await Promise.all([
    supabase.from('elected_officials').select('*').eq('official_id', id).single(),
    supabase.from('official_profiles' as any).select('*').eq('official_id', id).single(),
    supabase.from('policy_officials').select('policy_id').eq('official_id', id),
    supabase.from('official_focus_areas').select('focus_id').eq('official_id', id),
    supabase.from('official_counties').select('county_id').eq('official_id', id),
    supabase.from('committee_assignments' as any).select('committee_name, role, chamber, jurisdiction_focus, pathway_ids').eq('official_id', id).order('committee_name'),
    supabase.from('vote_records' as any).select('bill_number, vote, vote_date, policy_id, chamber').eq('official_id', id).order('vote_date', { ascending: false }).limit(20),
  ])

  if (!official) notFound()

  const profile = profileRow as unknown as {
    bio_short?: string | null; bio_full?: string | null
    phone_office?: string | null; phone_district?: string | null
    address_office?: string | null; address_district?: string | null
    social_twitter?: string | null; social_facebook?: string | null; social_instagram?: string | null
    social_linkedin?: string | null; photo_url?: string | null
  } | null

  const policyIds = (policyJunctions ?? []).map(j => j.policy_id)
  const focusAreaIds = (focusJunctions ?? []).map(j => j.focus_id)
  const countyIds = (countyJunctions ?? []).map((j: any) => j.county_id)

  const [policiesResult, focusAreasResult, countiesResult] = await Promise.all([
    policyIds.length > 0
      ? supabase.from('policies').select('*').in('policy_id', policyIds)
      : Promise.resolve({ data: [] as any[] }),
    focusAreaIds.length > 0
      ? supabase.from('focus_areas').select('focus_id, focus_area_name').in('focus_id', focusAreaIds)
      : Promise.resolve({ data: [] as any[] }),
    countyIds.length > 0
      ? supabase.from('counties').select('county_id, county_name').in('county_id', countyIds)
      : Promise.resolve({ data: [] as any[] }),
  ])

  const policies = policiesResult.data ?? []
  const focusAreas = (focusAreasResult.data ?? []) as Array<{ focus_id: string; focus_area_name: string }>
  const counties = (countiesResult.data ?? []) as Array<{ county_id: string; county_name: string }>

  const committeeList = (committees ?? []) as unknown as Array<{
    committee_name: string; role: string | null; chamber: string | null
    jurisdiction_focus: string[] | null; pathway_ids: string[] | null
  }>

  const voteList = (votes ?? []) as unknown as Array<{
    bill_number: string | null; vote: string; vote_date: string | null
    policy_id: string | null; chamber: string | null
  }>

  const userProfile = await getUserProfile()
  const langId = await getLangId()
  const cookieStore = await cookies()
  const lang = cookieStore.get('lang')?.value || 'en'
  const t = getUIStrings(lang)

  let districtZipColumn = ''
  if (official.district_id) {
    const districtType = official.district_type?.toLowerCase() || ''
    if (districtType.includes('congressional')) districtZipColumn = 'congressional_district'
    else if (districtType.includes('senate')) districtZipColumn = 'state_senate_district'
    else if (districtType.includes('house')) districtZipColumn = 'state_house_district'
  }

  const pIds = (policies || []).map(function (p) { return p.policy_id })

  const [districtZipResult, translationResults, wayfinderData, quote] = await Promise.all([
    districtZipColumn && official.district_id
      ? supabase.from('zip_codes').select('zip_code').eq(districtZipColumn, official.district_id).limit(50)
      : Promise.resolve({ data: [] as any[] }),
    langId
      ? Promise.all([
          fetchTranslationsForTable('elected_officials', [official.official_id], langId),
          pIds.length > 0 ? fetchTranslationsForTable('policies', pIds, langId) : {},
        ])
      : Promise.resolve([{}, {}] as [Record<string, any>, Record<string, any>]),
    getWayfinderContext('official', id, userProfile?.role),
    getRandomQuote(),
  ])

  const districtZips = (districtZipResult.data ?? []).map((z: any) => z.zip_code)

  const related = (wayfinderData.content ?? []).slice(0, 4).map(c => ({
    id: c.id,
    title_6th_grade: c.title_6th_grade || '',
    summary_6th_grade: c.summary_6th_grade || '',
    pathway_primary: c.pathway_primary,
    center: c.center,
    source_url: c.source_url || '',
    published_at: null as string | null,
    image_url: c.image_url,
  }))

  let officialTranslation: { title?: string; summary?: string } | undefined
  let policyTranslations: Record<string, { title?: string; summary?: string }> = {}
  if (langId) {
    officialTranslation = (translationResults as any)[0][official.official_id]
    policyTranslations = (translationResults as any)[1]
  }

  const displayTitle = officialTranslation?.title || official.title
  const rawPhotoUrl = profile?.photo_url || (official as any).photo_url as string | null
  const photoUrl = rawPhotoUrl?.replace(/^http:\/\//, 'https://') ?? null
  const bio = profile?.bio_short || official.description_5th_grade

  const jsonLd = personJsonLd({ ...official, photo_url: profile?.photo_url || null, bio_short: profile?.bio_short || null } as any)

  return (
    <div className="bg-paper min-h-screen">
      <SpiralTracker action="view_official" />
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}

      {/* Hero */}
      <div className="bg-paper relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="max-w-[900px] mx-auto px-6 py-16 relative z-10">
          <p style={{ fontSize: '0.7rem', letterSpacing: '0.15em', color: "#5c6474", textTransform: 'uppercase' }}>
            The Change Engine
          </p>
          <div className="flex items-start gap-6 mt-4">
            {photoUrl && (
              <Image
                src={photoUrl}
                alt={official.official_name}
                className="object-cover flex-shrink-0"
                style={{ border: '1px solid #dde1e8' }}
                width={120}
                height={120}
              />
            )}
            <div>
              <h1 style={{ fontSize: '2.2rem', lineHeight: 1.15 }}>
                {official.official_name}
              </h1>
              {(displayTitle || official.jurisdiction) && (
                <p style={{ fontSize: '1.05rem', color: "#5c6474", marginTop: '0.5rem' }}>
                  {[displayTitle, official.jurisdiction].filter(Boolean).join(', ')}
                </p>
              )}
              <div className="flex flex-wrap gap-4 mt-4">
                {official.party && (
                  <span style={{ fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: "#5c6474" }}>
                    {official.party}
                  </span>
                )}
                {official.level && (
                  <span style={{ fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: "#5c6474" }}>
                    {official.level}
                  </span>
                )}
                {official.term_end && (
                  <span className="flex items-center gap-1" style={{ fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: "#5c6474" }}>
                    <Calendar size={12} /> {t('official.term_ends')} {new Date(official.term_end).toLocaleDateString()}
                  </span>
                )}
                {official.district_id && (
                  <span style={{ fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: "#5c6474" }}>
                    District {official.district_id}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontSize: '0.7rem', color: "#5c6474" }}>
          <Link href="/" className="hover:underline" style={{ color: "#1b5e8a" }}>Home</Link>
          <span className="mx-2">/</span>
          <Link href="/officials" className="hover:underline" style={{ color: "#1b5e8a" }}>Officials</Link>
          <span className="mx-2">/</span>
          <span>{official.official_name}</span>
        </nav>
      </div>

      {/* Main content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">

        {/* About */}
        {bio && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontSize: '1.5rem',  }}>{t('detail.about')}</h2>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
            <p style={{ fontSize: '0.95rem', lineHeight: 1.85 }}>
              {bio}
            </p>
          </section>
        )}

        {/* Contact */}
        <section className="mb-10">
          <div className="flex items-baseline justify-between mb-1">
            <h2 style={{ fontSize: '1.5rem',  }}>{t('detail.contact')}</h2>
          </div>
          <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
          <div className="space-y-3">
            {(profile?.phone_office || official.office_phone) && (
              <a href={'tel:' + (profile?.phone_office || official.office_phone)} className="flex items-center gap-2 hover:underline" style={{ fontSize: '0.9rem', color: "#1b5e8a" }}>
                <Phone size={15} /> {profile?.phone_office || official.office_phone}
              </a>
            )}
            {official.email && (
              <a href={'mailto:' + official.email} className="flex items-center gap-2 hover:underline" style={{ fontSize: '0.9rem', color: "#1b5e8a" }}>
                <Mail size={15} /> {official.email}
              </a>
            )}
            {official.website && (
              <a href={official.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline" style={{ fontSize: '0.9rem', color: "#1b5e8a" }}>
                <Globe size={15} /> {t('detail.website')}
              </a>
            )}
            {profile?.social_linkedin && (
              <a href={profile.social_linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline" style={{ fontSize: '0.9rem', color: "#1b5e8a" }}>
                <Linkedin size={15} /> {t('official.linkedin')}
              </a>
            )}
            {profile?.address_office && (
              <div className="flex items-start gap-2" style={{ fontSize: '0.9rem', color: "#5c6474" }}>
                <MapPin size={15} className="shrink-0 mt-0.5" />
                <div>
                  <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: "#5c6474", display: 'block' }}>{t('official.office')}</span>
                  {profile.address_office}
                </div>
              </div>
            )}
            {profile?.address_district && (
              <div className="flex items-start gap-2" style={{ fontSize: '0.9rem', color: "#5c6474" }}>
                <MapPin size={15} className="shrink-0 mt-0.5" />
                <div>
                  <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: "#5c6474", display: 'block' }}>{t('official.district_office')}</span>
                  {profile.address_district}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Counties */}
        {counties.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontSize: '1.5rem',  }}>{t('official.counties')}</h2>
              <span style={{ fontSize: '0.7rem', color: "#5c6474" }}>{counties.length}</span>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
            <div className="space-y-1">
              {counties.map(function (c) {
                return (
                  <p key={c.county_id} style={{ fontSize: '0.9rem',  }}>{c.county_name}</p>
                )
              })}
            </div>
          </section>
        )}

        {/* District Info */}
        {(official.district_type || official.district_id) && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontSize: '1.5rem',  }}>{t('official.district')}</h2>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
            <div className="flex items-center gap-6 mb-3">
              {official.district_type && (
                <div>
                  <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: "#5c6474", display: 'block' }}>{t('official.type')}</span>
                  <p style={{ fontSize: '0.9rem', fontWeight: 600,  }}>{official.district_type}</p>
                </div>
              )}
              {official.district_id && (
                <div>
                  <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: "#5c6474", display: 'block' }}>{t('official.id')}</span>
                  <p style={{ fontSize: '0.9rem', fontWeight: 600,  }}>{official.district_id}</p>
                </div>
              )}
            </div>
            {districtZips.length > 0 && (
              <div>
                <span className="flex items-center gap-1 mb-2" style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: "#5c6474" }}>
                  <MapPin size={11} /> {t('official.zip_codes')}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {districtZips.map(function (z) {
                    return (
                      <span key={z} style={{ fontSize: '0.7rem', color: "#5c6474", border: '1px solid #dde1e8', padding: '2px 8px' }}>
                        {String(z).padStart(5, '0')}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {/* District Map */}
        {(official.district_type || official.district_id) && (
          <div className="mb-10" style={{ border: '1px solid #dde1e8' }}>
            <OfficialDistrictMap districtType={official.district_type} districtId={official.district_id} />
          </div>
        )}

        <div className="my-10" style={{ height: 1, background: '#dde1e8' }} />

        {/* Focus Areas */}
        {focusAreas.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontSize: '1.5rem',  }}>{t('official.focus_areas')}</h2>
              <span style={{ fontSize: '0.7rem', color: "#5c6474" }}>{focusAreas.length}</span>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
            <div>
              {focusAreas.map(function (fa, i) {
                const dotColor = FOCUS_DOT_COLORS[i % FOCUS_DOT_COLORS.length]
                return (
                  <Link key={fa.focus_id} href={'/explore/focus/' + fa.focus_id} className="flex items-center gap-2 py-2 hover:underline" style={{ fontSize: '0.9rem',  }}>
                    <span className="w-2 h-2 flex-shrink-0" style={{ background: dotColor }} />
                    <span>{fa.focus_area_name}</span>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* Committee Assignments */}
        {committeeList.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontSize: '1.5rem',  }}>{t('official.committees')}</h2>
              <span style={{ fontSize: '0.7rem', color: "#5c6474" }}>{committeeList.length}</span>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
            {committeeList.slice(0, 4).map(function (c, i) {
              return (
                <div key={i} className="py-3" style={{ borderBottom: i < Math.min(committeeList.length, 4) - 1 ? '1px solid ' + '#dde1e8' : 'none' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p style={{ fontSize: '0.9rem', fontWeight: 600,  }}>{c.committee_name}</p>
                      {c.chamber && (
                        <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: "#5c6474" }}>{c.chamber}</span>
                      )}
                    </div>
                    {c.role && (
                      <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.08em', background: '#0d1117', color: '#fff', padding: '2px 8px' }}>
                        {c.role}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
            {committeeList.length > 4 && (
              <details className="mt-2">
                <summary style={{ fontStyle: 'italic', color: "#1b5e8a", fontSize: '0.9rem', cursor: 'pointer' }}>
                  See {committeeList.length - 4} more committees
                </summary>
                {committeeList.slice(4).map(function (c, i) {
                  return (
                    <div key={i + 4} className="py-3" style={{ borderBottom: i < committeeList.length - 5 ? '1px solid ' + '#dde1e8' : 'none' }}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p style={{ fontSize: '0.9rem', fontWeight: 600,  }}>{c.committee_name}</p>
                          {c.chamber && (
                            <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: "#5c6474" }}>{c.chamber}</span>
                          )}
                        </div>
                        {c.role && (
                          <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.08em', background: '#0d1117', color: '#fff', padding: '2px 8px' }}>
                            {c.role}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </details>
            )}
          </section>
        )}

        {/* Vote Records */}
        {voteList.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontSize: '1.5rem',  }}>{t('official.recent_votes')}</h2>
              <span style={{ fontSize: '0.7rem', color: "#5c6474" }}>{voteList.length}</span>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
            {voteList.slice(0, 4).map(function (v, i) {
              const voteColor = v.vote === 'Yea' ? '#2d5a27' : v.vote === 'Nay' ? '#a12323' : '#5c6474'
              const inner = (
                <div className="flex items-center justify-between gap-3 py-3" style={{ borderBottom: i < Math.min(voteList.length, 4) - 1 ? '1px solid ' + '#dde1e8' : 'none' }}>
                  <div className="min-w-0">
                    <p className="truncate" style={{ fontSize: '0.9rem', fontWeight: 600,  }}>
                      {v.bill_number || t('official.vote')}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {v.chamber && <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: "#5c6474" }}>{v.chamber}</span>}
                      {v.vote_date && <span style={{ fontSize: '0.6875rem', color: "#5c6474" }}>{new Date(v.vote_date).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <span className="flex-shrink-0" style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, color: voteColor }}>
                    {v.vote}
                  </span>
                </div>
              )
              return v.policy_id ? (
                <Link key={i} href={'/policies/' + v.policy_id} className="block hover:opacity-80">{inner}</Link>
              ) : (
                <div key={i}>{inner}</div>
              )
            })}
            {voteList.length > 4 && (
              <details className="mt-2">
                <summary style={{ fontStyle: 'italic', color: "#1b5e8a", fontSize: '0.9rem', cursor: 'pointer' }}>
                  See {voteList.length - 4} more votes
                </summary>
                {voteList.slice(4).map(function (v, i) {
                  const voteColor = v.vote === 'Yea' ? '#2d5a27' : v.vote === 'Nay' ? '#a12323' : '#5c6474'
                  const inner = (
                    <div className="flex items-center justify-between gap-3 py-3" style={{ borderBottom: i < voteList.length - 5 ? '1px solid ' + '#dde1e8' : 'none' }}>
                      <div className="min-w-0">
                        <p className="truncate" style={{ fontSize: '0.9rem', fontWeight: 600,  }}>{v.bill_number || t('official.vote')}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {v.chamber && <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: "#5c6474" }}>{v.chamber}</span>}
                          {v.vote_date && <span style={{ fontSize: '0.6875rem', color: "#5c6474" }}>{new Date(v.vote_date).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <span className="flex-shrink-0" style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, color: voteColor }}>{v.vote}</span>
                    </div>
                  )
                  return v.policy_id ? (
                    <Link key={i + 4} href={'/policies/' + v.policy_id} className="block hover:opacity-80">{inner}</Link>
                  ) : (
                    <div key={i + 4}>{inner}</div>
                  )
                })}
              </details>
            )}
          </section>
        )}

        <div className="my-10" style={{ height: 1, background: '#dde1e8' }} />

        {/* Policies */}
        {policies && policies.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontSize: '1.5rem',  }}>{t('official.policies')}</h2>
              <span style={{ fontSize: '0.7rem', color: "#5c6474" }}>{policies.length}</span>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0" style={{ borderLeft: '1px solid ' + '#dde1e8', borderTop: '1px solid #dde1e8' }}>
              {policies.map(function (p) {
                const pt = policyTranslations[p.policy_id]
                return (
                  <Link key={p.policy_id} href={'/policies/' + p.policy_id}>
                    <PolicyCard
                      name={p.title_6th_grade || p.policy_name}
                      summary={p.summary_6th_grade || p.summary_5th_grade}
                      billNumber={p.bill_number}
                      status={p.status}
                      level={p.level}
                      sourceUrl={null}
                      translatedName={pt?.title}
                      translatedSummary={pt?.summary}
                      lastActionDate={p.last_action_date}
                    />
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* Related Content */}
        {related.length > 0 && (
          <section className="mb-10">
            <RelatedContent title={t('official.related_content')} items={related} />
          </section>
        )}

        {/* Quote */}
        {quote && (
          <QuoteCard text={quote.quote_text} attribution={quote.attribution} accentColor={'#1b5e8a'} />
        )}
      </div>

      {/* Footer */}
      <div className="my-10 max-w-[900px] mx-auto px-6" style={{ height: 1, background: '#dde1e8' }} />
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <Link href="/officials" style={{ fontStyle: 'italic', color: "#1b5e8a", fontSize: '0.95rem' }} className="hover:underline">
          Back to Officials
        </Link>
      </div>

      <AdminEditPanel
        entityType="elected_officials"
        entityId={official.official_id}
        userRole={userProfile?.role}
        fields={[
          { key: 'official_name', label: 'Official Name', type: 'text', value: official.official_name },
          { key: 'title', label: 'Title', type: 'text', value: official.title },
          { key: 'party', label: 'Party', type: 'select', value: official.party, options: ['Democrat', 'Republican', 'Independent', 'Nonpartisan'] },
          { key: 'phone', label: 'Phone', type: 'text', value: (official as any).phone },
          { key: 'email', label: 'Email', type: 'text', value: (official as any).email },
          { key: 'website', label: 'Website', type: 'url', value: official.website },
          { key: 'office_address', label: 'Office Address', type: 'text', value: (official as any).office_address },
          { key: 'photo_url', label: 'Photo URL', type: 'url', value: official.photo_url },
          { key: 'bio_summary', label: 'Bio Summary', type: 'textarea', value: (official as any).bio_summary },
          { key: 'government_level', label: 'Government Level', type: 'select', value: (official as any).government_level, options: ['federal', 'state', 'county', 'city'] },
        ] as EditField[]}
      />
    </div>
  )
}
