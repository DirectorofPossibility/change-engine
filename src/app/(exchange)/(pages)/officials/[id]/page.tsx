import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Mail, Phone, Globe, MapPin, Calendar, Users, Linkedin, Vote, Building2 } from 'lucide-react'
import { PolicyCard } from '@/components/exchange/PolicyCard'
import { RelatedContent } from '@/components/exchange/RelatedContent'
import { DetailWayfinder } from '@/components/exchange/DetailWayfinder'
import { getLangId, fetchTranslationsForTable, getWayfinderContext, getRandomQuote } from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { QuoteCard } from '@/components/exchange/QuoteCard'
import { TranslatePageButton } from '@/components/exchange/TranslatePageButton'
import { OfficialDistrictMap } from './OfficialDistrictMap'
import { AdminEditPanel } from '@/components/exchange/AdminEditPanel'
import type { EditField } from '@/components/exchange/AdminEditPanel'
import { SpiralTracker } from '@/components/exchange/SpiralTracker'
import { FeedbackLoop } from '@/components/exchange/FeedbackLoop'

function levelColor(level: string | null): string {
  if (level === 'Federal') return 'bg-blue-100 text-blue-700'
  if (level === 'State') return 'bg-green-100 text-green-700'
  if (level === 'County') return 'bg-orange-100 text-orange-700'
  if (level === 'City') return 'bg-teal-100 text-teal-700'
  return 'bg-gray-100 text-gray-700'
}

function levelBarColor(level: string | null): string {
  if (level === 'Federal') return '#3182ce'
  if (level === 'State') return '#38a169'
  if (level === 'County') return '#dd6b20'
  if (level === 'City') return '#319795'
  return '#6B6560'
}

const FOCUS_DOT_COLORS = [
  '#3182ce', '#38a169', '#805ad5', '#dd6b20', '#319795', '#e53e3e',
]

export const revalidate = 86400

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('elected_officials').select('official_name, title').eq('official_id', id).single()
  if (!data) return { title: 'Not Found' }
  return {
    title: data.official_name,
    description: data.title || 'Details on the Community Exchange.',
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

  return (
    <div>
      <SpiralTracker action="view_official" />

      {/* Hero Section */}
      <div className="bg-brand-bg border-b border-brand-border">
        {/* Level color bar */}
        <div className="h-1.5" style={{ backgroundColor: barColor }} />

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumb items={[
            { label: 'Civic Leaders', href: '/officials' },
            { label: official.official_name }
          ]} />

          <div className="mt-4 flex flex-col sm:flex-row gap-6">
            {photoUrl && (
              <div className="flex-shrink-0">
                <img
                  src={photoUrl}
                  alt={official.official_name}
                  className="w-28 h-28 rounded-xl object-cover border-2 border-brand-border"
                />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {official.level && (
                  <span className={'text-xs px-3 py-1 rounded-lg font-medium ' + levelColor(official.level)}>{official.level}</span>
                )}
                {official.party && (
                  <span className="text-xs px-3 py-1 rounded-lg font-medium bg-gray-100 text-gray-700">{official.party}</span>
                )}
              </div>
              <h1 className="font-serif text-3xl font-bold text-brand-text mb-1">{official.official_name}</h1>
              {displayTitle && <p className="text-lg text-brand-muted mb-2">{displayTitle}</p>}
              <div className="flex items-center gap-2 text-sm text-brand-muted">
                {official.jurisdiction && <span>{official.jurisdiction}</span>}
              </div>
              <div className="mt-2">
                <TranslatePageButton isTranslated={!!officialTranslation?.title} contentType="elected_officials" contentId={official.official_id} />
              </div>
              {official.term_end && (
                <p className="text-sm text-brand-muted mt-1 flex items-center gap-1">
                  <Calendar size={14} /> Term ends: {new Date(official.term_end).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Two-column layout: Main + Sidebar */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">

          {/* ===== MAIN COLUMN ===== */}
          <div className="min-w-0">

            {/* About */}
            {bio && (
              <section className="mb-8">
                <h2 className="font-serif text-xl font-bold text-brand-text mb-3">About</h2>
                <p className="text-brand-muted leading-relaxed">{bio}</p>
              </section>
            )}

            {/* Contact info card */}
            <div className="bg-white rounded-xl border-2 border-brand-border p-6 mb-8" style={{ boxShadow: '3px 3px 0 #D5D0C8' }}>
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-3">Contact</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(profile?.phone_office || official.office_phone) && (
                  <a href={'tel:' + (profile?.phone_office || official.office_phone)} className="flex items-center gap-3 text-sm text-brand-accent hover:underline p-3 rounded-lg bg-brand-bg">
                    <Phone size={18} className="flex-shrink-0" /> {profile?.phone_office || official.office_phone}
                  </a>
                )}
                {official.email && (
                  <a href={'mailto:' + official.email} className="flex items-center gap-3 text-sm text-brand-accent hover:underline p-3 rounded-lg bg-brand-bg">
                    <Mail size={18} className="flex-shrink-0" /> <span className="truncate">{official.email}</span>
                  </a>
                )}
                {official.website && (
                  <a href={official.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-brand-accent hover:underline p-3 rounded-lg bg-brand-bg">
                    <Globe size={18} className="flex-shrink-0" /> Website
                  </a>
                )}
                {profile?.social_linkedin && (
                  <a href={profile.social_linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-brand-accent hover:underline p-3 rounded-lg bg-brand-bg">
                    <Linkedin size={18} className="flex-shrink-0" /> LinkedIn
                  </a>
                )}
              </div>
              {(profile?.address_office || profile?.address_district) && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {profile.address_office && (
                    <div className="flex items-start gap-3 text-sm text-brand-muted p-3 rounded-lg bg-brand-bg">
                      <MapPin size={18} className="flex-shrink-0 mt-0.5" />
                      <div><span className="font-medium text-brand-text text-xs uppercase tracking-wide">Office</span><br />{profile.address_office}</div>
                    </div>
                  )}
                  {profile.address_district && (
                    <div className="flex items-start gap-3 text-sm text-brand-muted p-3 rounded-lg bg-brand-bg">
                      <MapPin size={18} className="flex-shrink-0 mt-0.5" />
                      <div><span className="font-medium text-brand-text text-xs uppercase tracking-wide">District Office</span><br />{profile.address_district}</div>
                    </div>
                  )}
                </div>
              )}

              {/* District info */}
              {(official.district_type || official.district_id) && (
                <div className="mt-4 pt-4 border-t border-brand-border">
                  <div className="flex items-center gap-4 mb-2">
                    {official.district_type && (
                      <div>
                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted">Type</span>
                        <p className="font-medium text-brand-text">{official.district_type}</p>
                      </div>
                    )}
                    {official.district_id && (
                      <div>
                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted">District</span>
                        <p className="font-medium text-brand-text">{official.district_id}</p>
                      </div>
                    )}
                  </div>
                  {districtZips.length > 0 && (
                    <div className="mt-2">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted flex items-center gap-1 mb-1.5">
                        <MapPin size={12} /> ZIP Codes Covered
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {districtZips.map(function (z) {
                          return (
                            <span key={z} className="text-xs px-2 py-1 bg-brand-bg rounded-md text-brand-muted font-mono">
                              {String(z).padStart(5, '0')}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* District Map */}
            {(official.district_type || official.district_id) && (
              <div className="mb-8">
                <OfficialDistrictMap districtType={official.district_type} districtId={official.district_id} />
              </div>
            )}

            {/* Focus Areas — dot + text links */}
            {focusAreas.length > 0 && (
              <section className="mb-8">
                <h2 className="font-serif text-xl font-bold text-brand-text mb-3">Focus Areas</h2>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {focusAreas.map(function (fa, i) {
                    const dotColor = FOCUS_DOT_COLORS[i % FOCUS_DOT_COLORS.length]
                    return (
                      <Link
                        key={fa.focus_id}
                        href={'/explore/focus/' + fa.focus_id}
                        className="flex items-center gap-1.5 text-sm text-brand-text hover:text-brand-accent transition-colors"
                      >
                        <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }} />
                        {fa.focus_area_name}
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Counties Served */}
            {counties.length > 0 && (
              <section className="mb-8">
                <h2 className="font-serif text-xl font-bold text-brand-text mb-3 flex items-center gap-2">
                  <Users size={20} /> Counties Served
                </h2>
                <div className="flex flex-wrap gap-2">
                  {counties.map(function (c) {
                    return (
                      <span key={c.county_id} className="text-sm px-3 py-1.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg font-medium">
                        {c.county_name}
                      </span>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Committee Assignments */}
            {committeeList.length > 0 && (
              <section className="mb-8">
                <h2 className="font-serif text-xl font-bold text-brand-text mb-4 flex items-center gap-2">
                  <Building2 size={20} /> Committee Assignments
                </h2>
                <div className="space-y-3">
                  {committeeList.map(function (c, i) {
                    return (
                      <div key={i} className="bg-white rounded-xl border-2 border-brand-border p-4" style={{ boxShadow: '3px 3px 0 #D5D0C8' }}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-brand-text">{c.committee_name}</p>
                            {c.chamber && (
                              <span className="text-xs text-brand-muted">{c.chamber}</span>
                            )}
                          </div>
                          {c.role && (
                            <span className="text-xs px-2 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 font-medium flex-shrink-0">
                              {c.role}
                            </span>
                          )}
                        </div>
                        {c.jurisdiction_focus && c.jurisdiction_focus.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {c.jurisdiction_focus.map(function (jf) {
                              return (
                                <span key={jf} className="text-xs px-2 py-0.5 bg-brand-bg rounded text-brand-muted">
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
              </section>
            )}

            {/* Vote Records */}
            {voteList.length > 0 && (
              <section className="mb-8">
                <h2 className="font-serif text-xl font-bold text-brand-text mb-4 flex items-center gap-2">
                  <Vote size={20} /> Recent Votes
                </h2>
                <div className="bg-white rounded-xl border-2 border-brand-border overflow-hidden" style={{ boxShadow: '3px 3px 0 #D5D0C8' }}>
                  <div className="divide-y divide-brand-border">
                    {voteList.map(function (v, i) {
                      const voteColor = v.vote === 'Yea' ? 'bg-green-100 text-green-700'
                        : v.vote === 'Nay' ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-600'
                      const inner = (
                        <div className="flex items-center justify-between gap-3 p-4">
                          <div className="min-w-0">
                            <p className="font-medium text-brand-text text-sm truncate">
                              {v.bill_number || 'Vote'}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-brand-muted mt-0.5">
                              {v.chamber && <span>{v.chamber}</span>}
                              {v.vote_date && <span>{new Date(v.vote_date).toLocaleDateString()}</span>}
                            </div>
                          </div>
                          <span className={'text-xs px-2.5 py-1 rounded-lg font-semibold flex-shrink-0 ' + voteColor}>
                            {v.vote}
                          </span>
                        </div>
                      )
                      return v.policy_id ? (
                        <Link key={i} href={'/policies/' + v.policy_id} className="block hover:bg-brand-bg transition-colors">
                          {inner}
                        </Link>
                      ) : (
                        <div key={i}>{inner}</div>
                      )
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* Policies */}
            {policies && policies.length > 0 && (
              <section className="mb-10">
                <h2 className="font-serif text-xl font-bold text-brand-text mb-4">Policies &amp; Legislation</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div className="mb-10">
                <RelatedContent title="Related Content" items={related} />
              </div>
            )}

            {/* Quote */}
            {quote && (
              <QuoteCard text={quote.quote_text} attribution={quote.attribution} />
            )}
          </div>

          {/* ===== SIDEBAR COLUMN ===== */}
          <div className="space-y-6">
            <div className="lg:sticky lg:top-6">
              <DetailWayfinder data={wayfinderData} currentType="official" currentId={id} userRole={userProfile?.role} />

              <div className="mt-6">
                <FeedbackLoop entityType="elected_officials" entityId={official.official_id} entityName={official.official_name || ''} />
              </div>
            </div>
          </div>

        </div>
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
