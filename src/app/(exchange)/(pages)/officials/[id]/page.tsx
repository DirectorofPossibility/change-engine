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
import { getRelatedServices } from '@/lib/data/services'
import { getUserProfile } from '@/lib/auth/roles'
import { QuoteCard } from '@/components/exchange/QuoteCard'
import { FeaturedPromo } from '@/components/exchange/FeaturedPromo'
import { OfficialDistrictMap } from './OfficialDistrictMap'
import { AdminEditPanel } from '@/components/exchange/AdminEditPanel'
import type { EditField } from '@/components/exchange/AdminEditPanel'
import { SpiralTracker } from '@/components/exchange/SpiralTracker'
import { DetailPageLayout } from '@/components/exchange/DetailPageLayout'
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

  const eyebrowMetaItems = (
    <div className="flex flex-wrap items-center gap-3">
      {official.party && (
        <span className="font-mono text-[0.65rem] uppercase tracking-wider text-muted">
          {official.party}
        </span>
      )}
      {official.term_end && (
        <span className="flex items-center gap-1 font-mono text-[0.65rem] uppercase tracking-wider text-muted">
          <Calendar size={12} /> {t('official.term_ends')} {new Date(official.term_end).toLocaleDateString()}
        </span>
      )}
      {official.district_id && (
        <span className="font-mono text-[0.65rem] uppercase tracking-wider text-muted">
          District {official.district_id}
        </span>
      )}
    </div>
  )

  const heroImageNode = photoUrl ? (
    <Image
      src={photoUrl}
      alt={official.official_name}
      className="object-cover flex-shrink-0 border border-rule"
      width={120}
      height={120}
    />
  ) : undefined

  const footerNode = (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <div className="mb-6 h-px bg-rule" />
      <Link href="/officials" className="italic text-blue text-[0.95rem] hover:underline">
        Back to Officials
      </Link>
    </div>
  )

  return (
    <>
      <DetailPageLayout
        bgColor="#ffffff"
        breadcrumbs={[
          { label: 'Officials', href: '/officials' },
          { label: official.official_name },
        ]}
        eyebrow={official.level ? { text: official.level } : undefined}
        eyebrowMeta={eyebrowMetaItems}
        title={official.official_name}
        subtitle={subtitleParts.length > 0 ? subtitleParts.join(', ') : null}
        heroImage={heroImageNode}
        themeColor="#1b5e8a"
        wayfinderData={wayfinderData}
        wayfinderType="official"
        wayfinderEntityId={id}
        userRole={userProfile?.role}
        feedbackType="official"
        feedbackId={official.official_id}
        feedbackName={official.official_name}
        jsonLd={jsonLd || undefined}
        footer={footerNode}
        sidebar={
          <>
            <FeaturedPromo variant="card" />
            {quote && <QuoteCard text={quote.quote_text} attribution={quote.attribution} accentColor="#1b5e8a" />}
          </>
        }
      >
        <SpiralTracker action="view_official" />

        {/* About */}
        {bio && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 className="text-2xl">{t('detail.about')}</h2>
            </div>
            <div className="h-px border-b border-dotted border-rule mb-4" />
            <p className="text-[0.95rem] leading-relaxed">
              {bio}
            </p>
          </section>
        )}

        {/* Contact */}
        <section className="mb-10">
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="text-2xl">{t('detail.contact')}</h2>
          </div>
          <div className="h-px border-b border-dotted border-rule mb-4" />
          <div className="space-y-3">
            {(profile?.phone_office || official.office_phone) && (
              <a href={'tel:' + (profile?.phone_office || official.office_phone)} className="flex items-center gap-2 text-[0.9rem] text-blue hover:underline">
                <Phone size={15} /> {profile?.phone_office || official.office_phone}
              </a>
            )}
            {official.email && (
              <a href={'mailto:' + official.email} className="flex items-center gap-2 text-[0.9rem] text-blue hover:underline">
                <Mail size={15} /> {official.email}
              </a>
            )}
            {official.website && (
              <a href={official.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[0.9rem] text-blue hover:underline">
                <Globe size={15} /> {t('detail.website')}
              </a>
            )}
            {profile?.social_linkedin && (
              <a href={profile.social_linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[0.9rem] text-blue hover:underline">
                <Linkedin size={15} /> {t('official.linkedin')}
              </a>
            )}
            {profile?.address_office && (
              <div className="flex items-start gap-2 text-[0.9rem] text-muted">
                <MapPin size={15} className="shrink-0 mt-0.5" />
                <div>
                  <span className="block font-mono text-[0.6875rem] uppercase tracking-wider text-muted">{t('official.office')}</span>
                  {profile.address_office}
                </div>
              </div>
            )}
            {profile?.address_district && (
              <div className="flex items-start gap-2 text-[0.9rem] text-muted">
                <MapPin size={15} className="shrink-0 mt-0.5" />
                <div>
                  <span className="block font-mono text-[0.6875rem] uppercase tracking-wider text-muted">{t('official.district_office')}</span>
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
              <h2 className="text-2xl">{t('official.counties')}</h2>
              <span className="text-xs text-muted">{counties.length}</span>
            </div>
            <div className="h-px border-b border-dotted border-rule mb-4" />
            <div className="space-y-1">
              {counties.map(function (c) {
                return (
                  <p key={c.county_id} className="text-[0.9rem]">{c.county_name}</p>
                )
              })}
            </div>
          </section>
        )}

        {/* District Info */}
        {(official.district_type || official.district_id) && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 className="text-2xl">{t('official.district')}</h2>
            </div>
            <div className="h-px border-b border-dotted border-rule mb-4" />
            <div className="flex items-center gap-6 mb-3">
              {official.district_type && (
                <div>
                  <span className="block font-mono text-[0.6875rem] uppercase tracking-wider text-muted">{t('official.type')}</span>
                  <p className="text-[0.9rem] font-semibold">{official.district_type}</p>
                </div>
              )}
              {official.district_id && (
                <div>
                  <span className="block font-mono text-[0.6875rem] uppercase tracking-wider text-muted">{t('official.id')}</span>
                  <p className="text-[0.9rem] font-semibold">{official.district_id}</p>
                </div>
              )}
            </div>
            {districtZips.length > 0 && (
              <div>
                <span className="flex items-center gap-1 mb-2 font-mono text-[0.6875rem] uppercase tracking-wider text-muted">
                  <MapPin size={11} /> {t('official.zip_codes')}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {districtZips.map(function (z) {
                    return (
                      <span key={z} className="text-xs text-muted border border-rule px-2 py-0.5">
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
          <div className="mb-10 border border-rule">
            <OfficialDistrictMap districtType={official.district_type} districtId={official.district_id} />
          </div>
        )}

        <div className="my-10 h-px bg-rule" />

        {/* Focus Areas */}
        {focusAreas.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 className="text-2xl">{t('official.focus_areas')}</h2>
              <span className="text-xs text-muted">{focusAreas.length}</span>
            </div>
            <div className="h-px border-b border-dotted border-rule mb-4" />
            <div>
              {focusAreas.map(function (fa, i) {
                const dotColor = FOCUS_DOT_COLORS[i % FOCUS_DOT_COLORS.length]
                return (
                  <Link key={fa.focus_id} href={'/explore/focus/' + fa.focus_id} className="flex items-center gap-2 py-2 text-[0.9rem] hover:underline">
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
              <h2 className="text-2xl">{t('official.committees')}</h2>
              <span className="text-xs text-muted">{committeeList.length}</span>
            </div>
            <div className="h-px border-b border-dotted border-rule mb-4" />
            {committeeList.slice(0, 4).map(function (c, i) {
              return (
                <div key={i} className={`py-3 ${i < Math.min(committeeList.length, 4) - 1 ? 'border-b border-rule' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[0.9rem] font-semibold">{c.committee_name}</p>
                      {c.chamber && (
                        <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-muted">{c.chamber}</span>
                      )}
                    </div>
                    {c.role && (
                      <span className="font-mono text-[0.6875rem] uppercase tracking-wider bg-ink text-white px-2 py-0.5">
                        {c.role}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
            {committeeList.length > 4 && (
              <details className="mt-2">
                <summary className="italic text-blue text-[0.9rem] cursor-pointer">
                  See {committeeList.length - 4} more committees
                </summary>
                {committeeList.slice(4).map(function (c, i) {
                  return (
                    <div key={i + 4} className={`py-3 ${i < committeeList.length - 5 ? 'border-b border-rule' : ''}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[0.9rem] font-semibold">{c.committee_name}</p>
                          {c.chamber && (
                            <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-muted">{c.chamber}</span>
                          )}
                        </div>
                        {c.role && (
                          <span className="font-mono text-[0.6875rem] uppercase tracking-wider bg-ink text-white px-2 py-0.5">
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
              <h2 className="text-2xl">{t('official.recent_votes')}</h2>
              <span className="text-xs text-muted">{voteList.length}</span>
            </div>
            <div className="h-px border-b border-dotted border-rule mb-4" />
            {voteList.slice(0, 4).map(function (v, i) {
              const voteColor = v.vote === 'Yea' ? '#2d5a27' : v.vote === 'Nay' ? '#a12323' : '#5c6474'
              const inner = (
                <div className={`flex items-center justify-between gap-3 py-3 ${i < Math.min(voteList.length, 4) - 1 ? 'border-b border-rule' : ''}`}>
                  <div className="min-w-0">
                    <p className="truncate text-[0.9rem] font-semibold">
                      {v.bill_number || t('official.vote')}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {v.chamber && <span className="font-mono text-[0.6875rem] uppercase text-muted">{v.chamber}</span>}
                      {v.vote_date && <span className="text-[0.6875rem] text-muted">{new Date(v.vote_date).toLocaleDateString()}</span>}
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
                <summary className="italic text-blue text-[0.9rem] cursor-pointer">
                  See {voteList.length - 4} more votes
                </summary>
                {voteList.slice(4).map(function (v, i) {
                  const voteColor = v.vote === 'Yea' ? '#2d5a27' : v.vote === 'Nay' ? '#a12323' : '#5c6474'
                  const inner = (
                    <div className={`flex items-center justify-between gap-3 py-3 ${i < voteList.length - 5 ? 'border-b border-rule' : ''}`}>
                      <div className="min-w-0">
                        <p className="truncate text-[0.9rem] font-semibold">{v.bill_number || t('official.vote')}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {v.chamber && <span className="font-mono text-[0.6875rem] uppercase text-muted">{v.chamber}</span>}
                          {v.vote_date && <span className="text-[0.6875rem] text-muted">{new Date(v.vote_date).toLocaleDateString()}</span>}
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

        <div className="my-10 h-px bg-rule" />

        {/* Policies */}
        {policies && policies.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 className="text-2xl">{t('official.policies')}</h2>
              <span className="text-xs text-muted">{policies.length}</span>
            </div>
            <div className="h-px border-b border-dotted border-rule mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 border-l border-t border-rule">
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
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 className="text-2xl">Related Services</h2>
              <span className="font-mono text-micro uppercase tracking-wider text-muted">{relatedServices.length}</span>
            </div>
            <div className="h-px border-b border-dotted border-rule mb-4" />
            {relatedServices.map(function (svc: any) {
              return (
                <Link key={svc.service_id} href={'/services/' + svc.service_id} className="block py-3 hover:opacity-80 border-b border-rule">
                  <h4 className="text-[0.9rem] font-semibold line-clamp-2">{svc.service_name}</h4>
                  {svc.description_5th_grade && (
                    <p className="line-clamp-2 mt-0.5 italic text-sm text-muted">{svc.description_5th_grade}</p>
                  )}
                </Link>
              )
            })}
          </section>
        )}

        {/* Related Content */}
        {related.length > 0 && (
          <section className="mb-10">
            <RelatedContent title={t('official.related_content')} items={related} />
          </section>
        )}

      </DetailPageLayout>

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
