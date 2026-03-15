import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getUIStrings } from '@/lib/i18n'
import { Mail, Phone, Globe, MapPin, Calendar, Linkedin, ArrowRight, ExternalLink } from 'lucide-react'
import { PolicyCard } from '@/components/exchange/PolicyCard'
import { RelatedContent } from '@/components/exchange/RelatedContent'
import { getLangId, fetchTranslationsForTable, getWayfinderContext, getRandomQuote } from '@/lib/data/exchange'
import { getRelatedServices } from '@/lib/data/services'
import { getUserProfile } from '@/lib/auth/roles'
import { QuoteCard } from '@/components/exchange/QuoteCard'
import { FeaturedPromo } from '@/components/exchange/FeaturedPromo'
import { OfficialDistrictMap } from './OfficialDistrictMap'
import { AdminEditPanel } from '@/components/exchange/AdminEditPanel'
import type { EditField } from '@/components/exchange/AdminEditPanel'
import { SpiralTracker } from '@/components/exchange/SpiralTracker'
import { DetailWayfinder } from '@/components/exchange/DetailWayfinder'
import { BookmarkButton } from '@/components/exchange/BookmarkButton'
import { FlowerOfLife } from '@/components/geo/sacred'
import Image from 'next/image'
import { personJsonLd } from '@/lib/jsonld'

/* ── Design Tokens ── */
const RULE = '#dde1e8'
const DIM = '#5c6474'
const INK = '#0d1117'
const SIDEBAR_BG = '#f4f5f7'

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

  const [districtZipResult, translationResults, wayfinderData, quote, relatedServicesResult] = await Promise.all([
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
    focusAreaIds.length > 0 ? getRelatedServices(focusAreaIds) : Promise.resolve([]),
  ])

  const relatedServices = relatedServicesResult.slice(0, 4)
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

  const subtitleParts = [displayTitle, official.jurisdiction].filter(Boolean)
  const themeColor = '#1b5e8a'

  return (
    <>
      <SpiralTracker action="view_official" />

      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════
          GRADIENT HERO
         ══════════════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}dd 40%, ${themeColor}55 100%)` }}
      >
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="absolute top-[-30%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-20%] left-[-5%] opacity-[0.06] pointer-events-none" aria-hidden="true">
          <FlowerOfLife color="#ffffff" size={400} />
        </div>

        <div className="max-w-[1080px] mx-auto px-6 py-12 sm:py-16 relative z-10">
          <div className="flex flex-col lg:flex-row gap-10 items-center">
            <div className="flex-1">
              {/* Breadcrumb */}
              <nav className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-white/70 mb-4">
                <Link href="/" className="hover:text-white transition-colors">Home</Link>
                <span className="mx-1.5">&rsaquo;</span>
                <Link href="/officials" className="hover:text-white transition-colors">Officials</Link>
              </nav>

              {/* Badge — level pill */}
              {official.level && (
                <div className="mb-5">
                  <span className="inline-block px-4 py-1.5 rounded-full text-white font-mono text-[0.65rem] uppercase tracking-[0.14em] font-bold"
                    style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}
                  >
                    {official.level}
                  </span>
                </div>
              )}

              {/* Title */}
              <h1 className="font-display font-black text-white leading-[1.1] tracking-[-0.02em] mb-5"
                style={{ fontSize: 'clamp(28px, 4vw, 44px)' }}
              >
                {official.official_name}
              </h1>

              {/* Subtitle — title + jurisdiction */}
              {subtitleParts.length > 0 && (
                <p className="text-white/90 leading-[1.7] mb-4" style={{ fontSize: '1.1rem' }}>
                  {subtitleParts.join(', ')}
                </p>
              )}

              {/* Bio summary in hero */}
              {bio && (
                <p className="text-white/90 leading-[1.7] mb-6 max-w-[600px]" style={{ fontSize: '1.05rem' }}>
                  {bio.length > 200 ? bio.slice(0, 200) + '...' : bio}
                </p>
              )}

              {/* Bookmark */}
              <BookmarkButton
                contentType="official"
                contentId={official.official_id}
                title={official.official_name}
                imageUrl={official.photo_url}
              />

              {/* Contact links absorbed into hero */}
              <div className="flex flex-wrap items-center gap-3 mt-6">
                {(profile?.phone_office || official.office_phone) && (
                  <a href={'tel:' + (profile?.phone_office || official.office_phone)} className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-xs transition-colors">
                    <Phone size={12} /> {profile?.phone_office || official.office_phone}
                  </a>
                )}
                {official.email && (
                  <a href={'mailto:' + official.email} className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-xs transition-colors">
                    <Mail size={12} /> {official.email}
                  </a>
                )}
                {official.website && (
                  <a href={official.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-xs transition-colors">
                    <Globe size={12} /> {t('detail.website')} <ExternalLink size={9} className="opacity-60" />
                  </a>
                )}
                {profile?.social_linkedin && (
                  <a href={profile.social_linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-xs transition-colors">
                    <Linkedin size={12} /> {t('official.linkedin')}
                  </a>
                )}
              </div>

              {/* Meta strip — party, term end, district */}
              <div className="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-white/60 flex flex-wrap items-center gap-x-3 gap-y-1 mt-4">
                {official.party && <span>{official.party}</span>}
                {official.term_end && (
                  <>
                    {official.party && <span>&middot;</span>}
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={10} /> {t('official.term_ends')} {new Date(official.term_end).toLocaleDateString()}
                    </span>
                  </>
                )}
                {official.district_id && (
                  <>
                    {(official.party || official.term_end) && <span>&middot;</span>}
                    <span>District {official.district_id}</span>
                  </>
                )}
              </div>
            </div>

            {/* Hero image — photo */}
            {photoUrl && (
              <div className="w-full lg:w-[280px] flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl border-[3px] border-white/30 bg-white/10 flex items-center justify-center p-4">
                <Image
                  src={photoUrl}
                  alt={official.official_name}
                  className="max-w-full max-h-[240px] w-auto h-auto object-contain rounded-xl"
                  width={280}
                  height={240}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          TWO-COLUMN LAYOUT — Content + Wayfinder Sidebar
         ══════════════════════════════════════════════════════════════════ */}
      <section className="bg-white">
        <div className="max-w-[1200px] mx-auto px-6 py-8 sm:py-10">
          <div className="flex flex-col lg:flex-row gap-10">

            {/* ── LEFT: Main Content ── */}
            <div className="flex-1 min-w-0">

              {/* About — full bio if hero was truncated */}
              {bio && bio.length > 200 && (
                <section className="mb-8">
                  <h2 className="font-display text-xl font-bold mb-2" style={{ color: INK }}>{t('detail.about')}</h2>
                  <div className="h-px mb-3" style={{ background: `${themeColor}30` }} />
                  <p className="text-[0.95rem] leading-relaxed" style={{ color: DIM }}>{bio}</p>
                </section>
              )}

              {/* Office Addresses */}
              {(profile?.address_office || profile?.address_district) && (
                <section className="mb-8">
                  <h2 className="font-display text-xl font-bold mb-2" style={{ color: INK }}>Offices</h2>
                  <div className="h-px mb-3" style={{ background: `${themeColor}30` }} />
                  <div className="space-y-3">
                    {profile?.address_office && (
                      <div className="flex items-start gap-2 text-[0.9rem]" style={{ color: DIM }}>
                        <MapPin size={15} className="shrink-0 mt-0.5" style={{ color: themeColor }} />
                        <div>
                          <span className="block font-mono text-[0.6875rem] uppercase tracking-wider" style={{ color: DIM }}>{t('official.office')}</span>
                          <span style={{ color: INK }}>{profile.address_office}</span>
                        </div>
                      </div>
                    )}
                    {profile?.address_district && (
                      <div className="flex items-start gap-2 text-[0.9rem]" style={{ color: DIM }}>
                        <MapPin size={15} className="shrink-0 mt-0.5" style={{ color: themeColor }} />
                        <div>
                          <span className="block font-mono text-[0.6875rem] uppercase tracking-wider" style={{ color: DIM }}>{t('official.district_office')}</span>
                          <span style={{ color: INK }}>{profile.address_district}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Counties */}
              {counties.length > 0 && (
                <section className="mb-8">
                  <div className="flex items-baseline justify-between">
                    <h2 className="font-display text-xl font-bold" style={{ color: INK }}>{t('official.counties')}</h2>
                    <span className="font-mono text-[0.6rem] uppercase tracking-wider" style={{ color: DIM }}>{counties.length}</span>
                  </div>
                  <div className="h-px mb-3" style={{ background: `${themeColor}30` }} />
                  <div className="space-y-1">
                    {counties.map(function (c) {
                      return (
                        <p key={c.county_id} className="text-[0.9rem]" style={{ color: INK }}>{c.county_name}</p>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* District Info — collapsible */}
              {(official.district_type || official.district_id) && (
                <details className="mb-8 group">
                  <summary className="flex items-center justify-between cursor-pointer py-3" style={{ borderBottom: `1px solid ${RULE}` }}>
                    <span className="font-display text-xl font-bold" style={{ color: INK }}>{t('official.district')}</span>
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="transition-transform group-open:rotate-180">
                      <path d="M5 7.5L10 12.5L15 7.5" stroke={DIM} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </summary>
                  <div className="pt-4 space-y-4">
                    <div className="flex items-center gap-6">
                      {official.district_type && (
                        <div>
                          <span className="block font-mono text-[0.6875rem] uppercase tracking-wider" style={{ color: DIM }}>{t('official.type')}</span>
                          <p className="text-[0.9rem] font-semibold" style={{ color: INK }}>{official.district_type}</p>
                        </div>
                      )}
                      {official.district_id && (
                        <div>
                          <span className="block font-mono text-[0.6875rem] uppercase tracking-wider" style={{ color: DIM }}>{t('official.id')}</span>
                          <p className="text-[0.9rem] font-semibold" style={{ color: INK }}>{official.district_id}</p>
                        </div>
                      )}
                    </div>
                    {districtZips.length > 0 && (
                      <div>
                        <span className="flex items-center gap-1 mb-2 font-mono text-[0.6875rem] uppercase tracking-wider" style={{ color: DIM }}>
                          <MapPin size={11} /> {t('official.zip_codes')}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {districtZips.map(function (z) {
                            return (
                              <span key={z} className="text-xs px-2 py-0.5" style={{ color: DIM, border: `1px solid ${RULE}` }}>
                                {String(z).padStart(5, '0')}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* District Map */}
                    {(official.district_type || official.district_id) && (
                      <div className="rounded overflow-hidden" style={{ border: `1px solid ${RULE}` }}>
                        <OfficialDistrictMap districtType={official.district_type} districtId={official.district_id} />
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Focus Areas */}
              {focusAreas.length > 0 && (
                <section className="mb-8">
                  <div className="flex items-baseline justify-between">
                    <h2 className="font-display text-xl font-bold" style={{ color: INK }}>{t('official.focus_areas')}</h2>
                    <span className="font-mono text-[0.6rem] uppercase tracking-wider" style={{ color: DIM }}>{focusAreas.length}</span>
                  </div>
                  <div className="h-px mb-3" style={{ background: `${themeColor}30` }} />
                  <div>
                    {focusAreas.map(function (fa, i) {
                      const dotColor = FOCUS_DOT_COLORS[i % FOCUS_DOT_COLORS.length]
                      return (
                        <Link key={fa.focus_id} href={'/explore/focus/' + fa.focus_id} className="flex items-center gap-2 py-2 text-[0.9rem] hover:underline" style={{ borderBottom: `1px solid ${RULE}` }}>
                          <span className="w-2 h-2 flex-shrink-0 rounded-full" style={{ background: dotColor }} />
                          <span style={{ color: INK }}>{fa.focus_area_name}</span>
                        </Link>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* Committee Assignments */}
              {committeeList.length > 0 && (
                <section className="mb-8">
                  <div className="flex items-baseline justify-between">
                    <h2 className="font-display text-xl font-bold" style={{ color: INK }}>{t('official.committees')}</h2>
                    <span className="font-mono text-[0.6rem] uppercase tracking-wider" style={{ color: DIM }}>{committeeList.length}</span>
                  </div>
                  <div className="h-px mb-3" style={{ background: `${themeColor}30` }} />
                  {committeeList.slice(0, 4).map(function (c, i) {
                    return (
                      <div key={i} className="py-3" style={{ borderBottom: i < Math.min(committeeList.length, 4) - 1 ? `1px solid ${RULE}` : 'none' }}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[0.9rem] font-semibold" style={{ color: INK }}>{c.committee_name}</p>
                            {c.chamber && (
                              <span className="font-mono text-[0.6875rem] uppercase tracking-wider" style={{ color: DIM }}>{c.chamber}</span>
                            )}
                          </div>
                          {c.role && (
                            <span className="font-mono text-[0.6875rem] uppercase tracking-wider px-2 py-0.5" style={{ background: INK, color: '#ffffff' }}>
                              {c.role}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {committeeList.length > 4 && (
                    <details className="mt-2">
                      <summary className="italic text-sm cursor-pointer" style={{ color: themeColor }}>
                        See {committeeList.length - 4} more committees
                      </summary>
                      {committeeList.slice(4).map(function (c, i) {
                        return (
                          <div key={i + 4} className="py-3" style={{ borderBottom: i < committeeList.length - 5 ? `1px solid ${RULE}` : 'none' }}>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-[0.9rem] font-semibold" style={{ color: INK }}>{c.committee_name}</p>
                                {c.chamber && (
                                  <span className="font-mono text-[0.6875rem] uppercase tracking-wider" style={{ color: DIM }}>{c.chamber}</span>
                                )}
                              </div>
                              {c.role && (
                                <span className="font-mono text-[0.6875rem] uppercase tracking-wider px-2 py-0.5" style={{ background: INK, color: '#ffffff' }}>
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
                <section className="mb-8">
                  <div className="flex items-baseline justify-between">
                    <h2 className="font-display text-xl font-bold" style={{ color: INK }}>{t('official.recent_votes')}</h2>
                    <span className="font-mono text-[0.6rem] uppercase tracking-wider" style={{ color: DIM }}>{voteList.length}</span>
                  </div>
                  <div className="h-px mb-3" style={{ background: `${themeColor}30` }} />
                  {voteList.slice(0, 4).map(function (v, i) {
                    const voteColor = v.vote === 'Yea' ? '#2d5a27' : v.vote === 'Nay' ? '#a12323' : DIM
                    const inner = (
                      <div className="flex items-center justify-between gap-3 py-3" style={{ borderBottom: i < Math.min(voteList.length, 4) - 1 ? `1px solid ${RULE}` : 'none' }}>
                        <div className="min-w-0">
                          <p className="truncate text-[0.9rem] font-semibold" style={{ color: INK }}>
                            {v.bill_number || t('official.vote')}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {v.chamber && <span className="font-mono text-[0.6875rem] uppercase" style={{ color: DIM }}>{v.chamber}</span>}
                            {v.vote_date && <span className="text-[0.6875rem]" style={{ color: DIM }}>{new Date(v.vote_date).toLocaleDateString()}</span>}
                          </div>
                        </div>
                        <span className="flex-shrink-0 text-xs uppercase font-bold" style={{ color: voteColor }}>
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
                      <summary className="italic text-sm cursor-pointer" style={{ color: themeColor }}>
                        See {voteList.length - 4} more votes
                      </summary>
                      {voteList.slice(4).map(function (v, i) {
                        const voteColor = v.vote === 'Yea' ? '#2d5a27' : v.vote === 'Nay' ? '#a12323' : DIM
                        const inner = (
                          <div className="flex items-center justify-between gap-3 py-3" style={{ borderBottom: i < voteList.length - 5 ? `1px solid ${RULE}` : 'none' }}>
                            <div className="min-w-0">
                              <p className="truncate text-[0.9rem] font-semibold" style={{ color: INK }}>{v.bill_number || t('official.vote')}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {v.chamber && <span className="font-mono text-[0.6875rem] uppercase" style={{ color: DIM }}>{v.chamber}</span>}
                                {v.vote_date && <span className="text-[0.6875rem]" style={{ color: DIM }}>{new Date(v.vote_date).toLocaleDateString()}</span>}
                              </div>
                            </div>
                            <span className="flex-shrink-0 text-xs uppercase font-bold" style={{ color: voteColor }}>{v.vote}</span>
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

              {/* Policies */}
              {policies && policies.length > 0 && (
                <section className="mb-8">
                  <div className="flex items-baseline justify-between">
                    <h2 className="font-display text-xl font-bold" style={{ color: INK }}>{t('official.policies')}</h2>
                    <span className="font-mono text-[0.6rem] uppercase tracking-wider" style={{ color: DIM }}>{policies.length}</span>
                  </div>
                  <div className="h-px mb-3" style={{ background: `${themeColor}30` }} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-0" style={{ borderLeft: `1px solid ${RULE}`, borderTop: `1px solid ${RULE}` }}>
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

              {/* Related Services */}
              {relatedServices.length > 0 && (
                <section className="mb-8">
                  <div className="flex items-baseline justify-between">
                    <h2 className="font-display text-xl font-bold" style={{ color: INK }}>Related Services</h2>
                    <span className="font-mono text-[0.6rem] uppercase tracking-wider" style={{ color: DIM }}>{relatedServices.length}</span>
                  </div>
                  <div className="h-px mb-3" style={{ background: `${themeColor}30` }} />
                  {relatedServices.map(function (svc: any) {
                    return (
                      <Link key={svc.service_id} href={'/services/' + svc.service_id} className="flex items-start gap-3 py-2.5 hover:underline" style={{ borderBottom: `1px solid ${RULE}` }}>
                        <span className="mt-2 flex-shrink-0 inline-block w-1.5 h-1.5 rounded-full" style={{ background: themeColor }} />
                        <div className="min-w-0">
                          <span className="block font-semibold text-[0.9rem]" style={{ color: INK }}>{svc.service_name}</span>
                          {svc.description_5th_grade && (
                            <span className="block line-clamp-2 mt-0.5 text-sm" style={{ color: DIM }}>{svc.description_5th_grade}</span>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </section>
              )}

              {/* Related Content */}
              {related.length > 0 && (
                <section className="mb-8">
                  <RelatedContent title={t('official.related_content')} items={related} />
                </section>
              )}

              {/* Sidebar extras — below main content on mobile */}
              <div className="lg:hidden space-y-6 mt-8 pt-8" style={{ borderTop: `1px solid ${RULE}` }}>
                <FeaturedPromo variant="card" />
                {quote && <QuoteCard text={quote.quote_text} attribution={quote.attribution} accentColor={themeColor} />}
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                RIGHT: WAYFINDER SIDEBAR
               ══════════════════════════════════════════════════════════════════ */}
            <aside className="w-full lg:w-[340px] flex-shrink-0">
              <div className="lg:sticky lg:top-4 space-y-4">
                <DetailWayfinder
                  data={wayfinderData}
                  currentType="official"
                  currentId={id}
                  userRole={userProfile?.role ?? undefined}
                />

                <div className="hidden lg:block space-y-4">
                  <FeaturedPromo variant="card" />
                  {quote && <QuoteCard text={quote.quote_text} attribution={quote.attribution} accentColor={themeColor} />}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ── FOOTER CODA ── */}
      <section style={{ background: SIDEBAR_BG, borderTop: `1px solid ${RULE}` }}>
        <div className="max-w-[820px] mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <Link
            href="/officials"
            className="inline-flex items-center gap-2 transition-colors hover:text-[#1b5e8a]"
            style={{ fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: DIM }}
          >
            <ArrowRight size={14} className="rotate-180" /> Back to Officials
          </Link>
        </div>
      </section>

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
    </>
  )
}
