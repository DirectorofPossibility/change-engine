import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getUIStrings } from '@/lib/i18n'
import { Mail, Phone, Globe, MapPin, Calendar, Users, Linkedin, Vote, Building2 } from 'lucide-react'
import { PolicyCard } from '@/components/exchange/PolicyCard'
import { RelatedContent } from '@/components/exchange/RelatedContent'
import { DetailPageLayout } from '@/components/exchange/DetailPageLayout'
import { getLangId, fetchTranslationsForTable, getWayfinderContext, getRandomQuote } from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'
import { QuoteCard } from '@/components/exchange/QuoteCard'
import { OfficialDistrictMap } from './OfficialDistrictMap'
import { AdminEditPanel } from '@/components/exchange/AdminEditPanel'
import type { EditField } from '@/components/exchange/AdminEditPanel'
import { SpiralTracker } from '@/components/exchange/SpiralTracker'
import Image from 'next/image'
import { personJsonLd } from '@/lib/jsonld'

function levelBarColor(level: string | null): string {
  if (level === 'Federal') return '#1e3a5f'
  if (level === 'State') return '#2d5a27'
  if (level === 'County') return '#8b4513'
  if (level === 'City') return '#1a5e5e'
  return '#5c6474'
}

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

  // Fetch official + profile + all junction data in parallel (H9 fix: was 8 sequential queries)
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

  // Resolve junction data in parallel (second batch — depends on first batch IDs)
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

  // Batch 3: All remaining lookups in parallel (district ZIPs, related content, translations, wayfinder, quote)
  const userProfile = await getUserProfile()
  const langId = await getLangId()
  const cookieStore = await cookies()
  const lang = cookieStore.get('lang')?.value || 'en'
  const t = getUIStrings(lang)

  // Build district ZIP query
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

  // Use related content from wayfinderData (already fetched via getWayfinderContext)
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

  const barColor = levelBarColor(official.level)

  const jsonLd = personJsonLd({ ...official, photo_url: profile?.photo_url || null, bio_short: profile?.bio_short || null } as any)

  const canonicalUrl = `https://www.changeengine.us/officials/${id}`

  // Build eyebrow meta (title + jurisdiction inline text)
  const eyebrowMetaText = [displayTitle, official.jurisdiction].filter(Boolean).join(' \u00b7 ')

  // Build meta row
  const metaRow = (
    <div className="flex flex-wrap gap-4">
      {official.party && (
        <span
          className="flex items-center gap-2"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.05em', textTransform: 'uppercase' as const, color: '#5c6474' }}
        >
          <span className="w-1.5 h-1.5 flex-shrink-0" style={{ background: barColor }} />
          <strong style={{ color: '#0d1117' }}>{official.party}</strong>
        </span>
      )}
      {official.term_end && (
        <span
          className="flex items-center gap-2"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.05em', textTransform: 'uppercase' as const, color: '#5c6474' }}
        >
          <span className="w-1.5 h-1.5 flex-shrink-0" style={{ background: barColor }} />
          <Calendar size={12} />
          <strong style={{ color: '#0d1117' }}>{t('official.term_ends')} {new Date(official.term_end).toLocaleDateString()}</strong>
        </span>
      )}
      {official.district_id && (
        <span
          className="flex items-center gap-2"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.05em', textTransform: 'uppercase' as const, color: '#5c6474' }}
        >
          <span className="w-1.5 h-1.5 flex-shrink-0" style={{ background: barColor }} />
          <strong style={{ color: '#0d1117' }}>District {official.district_id}</strong>
        </span>
      )}
    </div>
  )

  // Build hero image
  const heroImage = photoUrl ? (
    <Image
      src={photoUrl}
      alt={official.official_name}
      className="object-cover"
      style={{ border: '1px solid #dde1e8', width: 140, height: 140 }}
      width={140}
      height={140}
    />
  ) : undefined

  // Build sidebar content
  const sidebarContent = (
    <>
      {/* Counties */}
      {counties.length > 0 && (
        <div>
          <span
            className="font-mono uppercase tracking-[0.2em] block mb-3 pb-2"
            style={{ fontSize: '0.58rem', color: '#5c6474', borderBottom: '1px solid #dde1e8' }}
          >
            {t('official.counties')}
          </span>
          <div className="space-y-1.5">
            {counties.map(function (c) {
              return (
                <p
                  key={c.county_id}
                  className="font-body text-sm"
                  style={{ color: '#0d1117' }}
                >
                  {c.county_name}
                </p>
              )
            })}
          </div>
        </div>
      )}
    </>
  )

  return (
    <>
      <SpiralTracker action="view_official" />

      <DetailPageLayout
        breadcrumbs={[
          { label: t('official.civic_leaders'), href: '/officials' },
          { label: official.official_name },
        ]}
        eyebrow={official.level ? { text: official.level } : undefined}
        eyebrowMeta={
          eyebrowMetaText ? (
            <span
              className="font-mono uppercase tracking-[0.12em]"
              style={{ fontSize: '0.58rem', color: '#5c6474', letterSpacing: '0.2em' }}
            >
              {eyebrowMetaText}
            </span>
          ) : undefined
        }
        title={official.official_name}
        subtitle={displayTitle && official.jurisdiction
          ? `${displayTitle}, ${official.jurisdiction}`
          : displayTitle || official.jurisdiction || null
        }
        heroImage={heroImage}
        metaRow={metaRow}
        actions={{
          translate: {
            isTranslated: !!officialTranslation?.title,
            contentType: 'elected_officials',
            contentId: official.official_id,
          },
          share: {
            title: official.official_name,
            url: canonicalUrl,
          },
        }}
        mastheadBorderTop={`3px solid ${barColor}`}
        mastheadBorderLeft="4px solid #b03a2a"
        themeColor={barColor}
        wayfinderData={wayfinderData}
        wayfinderType="official"
        wayfinderEntityId={id}
        userRole={userProfile?.role}
        sidebar={sidebarContent}
        feedbackType="elected_officials"
        feedbackId={official.official_id}
        feedbackName={official.official_name || ''}
        jsonLd={jsonLd}
      >
        {/* About */}
        {bio && (
          <div className="mb-8">
            <span
              className="font-mono uppercase tracking-[0.2em] block mb-3"
              style={{ fontSize: '0.58rem', color: '#5c6474' }}
            >
              {t('detail.about')}
            </span>
            <p
              className="font-body leading-[1.85]"
              style={{ fontSize: '0.88rem', color: '#0d1117' }}
            >
              {bio}
            </p>
          </div>
        )}

        {/* Contact */}
        <div className="mb-8 space-y-3">
          <span
            className="font-mono uppercase tracking-[0.2em] block mb-3"
            style={{ fontSize: '0.58rem', color: '#5c6474' }}
          >
            {t('detail.contact')}
          </span>
          {(profile?.phone_office || official.office_phone) && (
            <a
              href={'tel:' + (profile?.phone_office || official.office_phone)}
              className="flex items-center gap-2 hover:underline"
              style={{ fontSize: '0.88rem', color: '#1b5e8a' }}
            >
              <Phone size={15} /> {profile?.phone_office || official.office_phone}
            </a>
          )}
          {official.email && (
            <a
              href={'mailto:' + official.email}
              className="flex items-center gap-2 hover:underline"
              style={{ fontSize: '0.88rem', color: '#1b5e8a' }}
            >
              <Mail size={15} /> {official.email}
            </a>
          )}
          {official.website && (
            <a
              href={official.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:underline"
              style={{ fontSize: '0.88rem', color: '#1b5e8a' }}
            >
              <Globe size={15} /> {t('detail.website')}
            </a>
          )}
          {profile?.social_linkedin && (
            <a
              href={profile.social_linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:underline"
              style={{ fontSize: '0.88rem', color: '#1b5e8a' }}
            >
              <Linkedin size={15} /> {t('official.linkedin')}
            </a>
          )}
          {profile?.address_office && (
            <div className="flex items-start gap-2" style={{ fontSize: '0.88rem', color: '#5c6474' }}>
              <MapPin size={15} className="shrink-0 mt-0.5" />
              <div>
                <span className="font-mono uppercase tracking-[0.1em] block" style={{ fontSize: '0.52rem', color: '#5c6474' }}>{t('official.office')}</span>
                {profile.address_office}
              </div>
            </div>
          )}
          {profile?.address_district && (
            <div className="flex items-start gap-2" style={{ fontSize: '0.88rem', color: '#5c6474' }}>
              <MapPin size={15} className="shrink-0 mt-0.5" />
              <div>
                <span className="font-mono uppercase tracking-[0.1em] block" style={{ fontSize: '0.52rem', color: '#5c6474' }}>{t('official.district_office')}</span>
                {profile.address_district}
              </div>
            </div>
          )}
        </div>

        {/* District Info */}
        {(official.district_type || official.district_id) && (
          <div className="mb-8">
            <span
              className="font-mono uppercase tracking-[0.2em] block mb-3"
              style={{ fontSize: '0.58rem', color: '#5c6474' }}
            >
              {t('official.district')}
            </span>
            <div className="flex items-center gap-6 mb-3">
              {official.district_type && (
                <div>
                  <span className="font-mono uppercase tracking-[0.1em] block" style={{ fontSize: '0.52rem', color: '#5c6474' }}>{t('official.type')}</span>
                  <p className="font-display text-sm font-bold" style={{ color: '#0d1117' }}>{official.district_type}</p>
                </div>
              )}
              {official.district_id && (
                <div>
                  <span className="font-mono uppercase tracking-[0.1em] block" style={{ fontSize: '0.52rem', color: '#5c6474' }}>{t('official.id')}</span>
                  <p className="font-display text-sm font-bold" style={{ color: '#0d1117' }}>{official.district_id}</p>
                </div>
              )}
            </div>
            {districtZips.length > 0 && (
              <div>
                <span
                  className="font-mono uppercase tracking-[0.1em] flex items-center gap-1 mb-2"
                  style={{ fontSize: '0.52rem', color: '#5c6474' }}
                >
                  <MapPin size={11} /> {t('official.zip_codes')}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {districtZips.map(function (z) {
                    return (
                      <span
                        key={z}
                        className="font-mono"
                        style={{ fontSize: '0.7rem', color: '#5c6474', border: '1px solid #dde1e8', padding: '2px 8px' }}
                      >
                        {String(z).padStart(5, '0')}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* District Map */}
        {(official.district_type || official.district_id) && (
          <div className="mb-8" style={{ border: '1px solid #dde1e8' }}>
            <OfficialDistrictMap districtType={official.district_type} districtId={official.district_id} />
          </div>
        )}

        {/* Focus Areas */}
        {focusAreas.length > 0 && (
          <div className="mb-8">
            <span
              className="font-mono uppercase tracking-[0.2em] block mb-3"
              style={{ fontSize: '0.58rem', color: '#5c6474' }}
            >
              {t('official.focus_areas')}
            </span>
            <div className="space-y-0">
              {focusAreas.map(function (fa, i) {
                const dotColor = FOCUS_DOT_COLORS[i % FOCUS_DOT_COLORS.length]
                return (
                  <Link
                    key={fa.focus_id}
                    href={'/explore/focus/' + fa.focus_id}
                    className="flex items-center gap-2 py-2 hover:underline"
                    style={{ fontSize: '0.88rem', color: '#0d1117' }}
                  >
                    <span className="w-2 h-2 flex-shrink-0" style={{ background: dotColor }} />
                    <span className="font-body">{fa.focus_area_name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Committee Assignments */}
        {committeeList.length > 0 && (
          <div className="mb-8">
            <span
              className="font-mono uppercase tracking-[0.2em] block mb-3"
              style={{ fontSize: '0.58rem', color: '#5c6474' }}
            >
              {t('official.committees')}
            </span>
            <div>
              {committeeList.map(function (c, i) {
                return (
                  <div
                    key={i}
                    className="py-3"
                    style={{ borderBottom: i < committeeList.length - 1 ? '1px solid #dde1e8' : 'none' }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-display text-sm font-bold" style={{ color: '#0d1117' }}>{c.committee_name}</p>
                        {c.chamber && (
                          <span className="font-mono uppercase tracking-[0.1em]" style={{ fontSize: '0.52rem', color: '#5c6474' }}>{c.chamber}</span>
                        )}
                      </div>
                      {c.role && (
                        <span
                          className="font-mono uppercase tracking-[0.12em] px-2 py-0.5 flex-shrink-0"
                          style={{ fontSize: '0.52rem', background: '#0d1117', color: '#ffffff' }}
                        >
                          {c.role}
                        </span>
                      )}
                    </div>
                    {c.jurisdiction_focus && c.jurisdiction_focus.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {c.jurisdiction_focus.map(function (jf) {
                          return (
                            <span
                              key={jf}
                              className="font-mono"
                              style={{ fontSize: '0.62rem', color: '#5c6474', border: '1px solid #dde1e8', padding: '1px 6px' }}
                            >
                              {jf}
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Vote Records */}
        {voteList.length > 0 && (
          <div className="mb-8">
            <span
              className="font-mono uppercase tracking-[0.2em] block mb-3"
              style={{ fontSize: '0.58rem', color: '#5c6474' }}
            >
              {t('official.recent_votes')}
            </span>
            <div>
              {voteList.map(function (v, i) {
                const voteColor = v.vote === 'Yea' ? '#2d5a27'
                  : v.vote === 'Nay' ? '#a12323'
                  : '#5c6474'
                const inner = (
                  <div
                    className="flex items-center justify-between gap-3 py-3"
                    style={{ borderBottom: i < voteList.length - 1 ? '1px solid #dde1e8' : 'none' }}
                  >
                    <div className="min-w-0">
                      <p className="font-display text-sm font-bold truncate" style={{ color: '#0d1117' }}>
                        {v.bill_number || t('official.vote')}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {v.chamber && (
                          <span className="font-mono uppercase tracking-[0.1em]" style={{ fontSize: '0.52rem', color: '#5c6474' }}>{v.chamber}</span>
                        )}
                        {v.vote_date && (
                          <span className="font-mono" style={{ fontSize: '0.52rem', color: '#8a929e' }}>{new Date(v.vote_date).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <span
                      className="font-mono uppercase tracking-[0.08em] font-bold flex-shrink-0"
                      style={{ fontSize: '0.68rem', color: voteColor }}
                    >
                      {v.vote}
                    </span>
                  </div>
                )
                return v.policy_id ? (
                  <Link key={i} href={'/policies/' + v.policy_id} className="block transition-colors hover:bg-[#f4f5f7]">
                    {inner}
                  </Link>
                ) : (
                  <div key={i}>{inner}</div>
                )
              })}
            </div>
          </div>
        )}

        {/* Policies */}
        {policies && policies.length > 0 && (
          <div className="mb-8">
            <span
              className="font-mono uppercase tracking-[0.2em] block mb-3"
              style={{ fontSize: '0.58rem', color: '#5c6474' }}
            >
              {t('official.policies')}
            </span>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 gap-0"
              style={{ borderLeft: '1.5px solid #dde1e8', borderTop: '1.5px solid #dde1e8' }}
            >
              {policies.map(function (p) {
                const pt = policyTranslations[p.policy_id]
                const isActive = ['pending', 'introduced', 'in committee', 'active'].includes((p.status || '').toLowerCase())
                return (
                  <Link key={p.policy_id} href={'/policies/' + p.policy_id} style={isActive ? { borderLeft: '3px solid #b03a2a' } : undefined}>
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
          </div>
        )}

        {/* Related Content */}
        {related.length > 0 && (
          <div className="mb-8">
            <RelatedContent title={t('official.related_content')} items={related} />
          </div>
        )}

        {/* Quote (GAP 2) */}
        {quote && (
          <QuoteCard text={quote.quote_text} attribution={quote.attribution} accentColor={barColor} />
        )}
      </DetailPageLayout>

      {/* Admin panel */}
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
