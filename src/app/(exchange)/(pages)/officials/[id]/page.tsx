import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Mail, Phone, Globe, MapPin, Calendar, Users } from 'lucide-react'
import { PolicyCard } from '@/components/exchange/PolicyCard'
import { RelatedContent } from '@/components/exchange/RelatedContent'
import { EntityMesh } from '@/components/exchange/EntityMesh'
import { getLangId, fetchTranslationsForTable } from '@/lib/data/exchange'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { OfficialDistrictMap } from './OfficialDistrictMap'

function levelColor(level: string | null): string {
  if (level === 'Federal') return 'bg-blue-100 text-blue-700'
  if (level === 'State') return 'bg-green-100 text-green-700'
  if (level === 'County') return 'bg-orange-100 text-orange-700'
  if (level === 'City') return 'bg-teal-100 text-teal-700'
  return 'bg-gray-100 text-gray-700'
}

function focusAreaColor(index: number): string {
  const colors = [
    'bg-blue-50 text-blue-700 border-blue-200',
    'bg-green-50 text-green-700 border-green-200',
    'bg-purple-50 text-purple-700 border-purple-200',
    'bg-orange-50 text-orange-700 border-orange-200',
    'bg-teal-50 text-teal-700 border-teal-200',
    'bg-rose-50 text-rose-700 border-rose-200',
  ]
  return colors[index % colors.length]
}

export const revalidate = 86400

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('elected_officials').select('official_name, title').eq('official_id', id).single()
  if (!data) return { title: 'Not Found' }
  return {
    title: data.official_name,
    description: data.title || 'Details on The Change Engine.',
  }
}

export default async function OfficialDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: official } = await supabase
    .from('elected_officials')
    .select('*')
    .eq('official_id', id)
    .single()

  const { data: profileRow } = await supabase
    .from('official_profiles' as any)
    .select('*')
    .eq('official_id', id)
    .single()

  if (!official) notFound()

  const profile = profileRow as unknown as {
    bio_short?: string | null; bio_full?: string | null
    phone_office?: string | null; phone_district?: string | null
    address_office?: string | null; address_district?: string | null
    social_twitter?: string | null; social_facebook?: string | null; social_instagram?: string | null
    photo_url?: string | null
  } | null

  // Policies connected to this official via junction table
  const { data: policyJunctions } = await supabase
    .from('policy_officials')
    .select('policy_id')
    .eq('official_id', id)
  const policyIds = (policyJunctions ?? []).map(j => j.policy_id)
  const policies = policyIds.length > 0
    ? (await supabase.from('policies').select('*').in('policy_id', policyIds)).data ?? []
    : []

  // Focus areas via junction table
  const { data: focusJunctions } = await supabase
    .from('official_focus_areas')
    .select('focus_id')
    .eq('official_id', id)
  const focusAreaIds = (focusJunctions ?? []).map(j => j.focus_id)
  let focusAreas: Array<{ focus_id: string; focus_area_name: string }> = []
  if (focusAreaIds.length > 0) {
    const { data: faData } = await supabase
      .from('focus_areas')
      .select('focus_id, focus_area_name')
      .in('focus_id', focusAreaIds)
    focusAreas = faData ?? []
  }

  // Counties served via junction table
  let counties: Array<{ county_id: string; county_name: string }> = []
  const { data: countyJunctions } = await supabase
    .from('official_counties')
    .select('county_id')
    .eq('official_id', id)
  const countyIds = (countyJunctions ?? []).map(j => j.county_id)
  if (countyIds.length > 0) {
    const { data: countyData } = await supabase
      .from('counties')
      .select('county_id, county_name')
      .in('county_id', countyIds)
    counties = countyData ?? []
  }

  // ZIP codes that map to this official's district
  let districtZips: number[] = []
  if (official.district_id) {
    const districtType = official.district_type?.toLowerCase() || ''
    let column = ''
    if (districtType.includes('congressional')) column = 'congressional_district'
    else if (districtType.includes('senate')) column = 'state_senate_district'
    else if (districtType.includes('house')) column = 'state_house_district'

    if (column) {
      const { data: zipData } = await supabase
        .from('zip_codes')
        .select('zip_code')
        .eq(column, official.district_id)
        .limit(50)
      districtZips = (zipData ?? []).map(z => z.zip_code)
    }
  }

  // Related content via focus areas
  let related: Array<{ id: string; title_6th_grade: string; summary_6th_grade: string; pathway_primary: string | null; center: string | null; source_url: string; published_at: string | null }> = []
  if (focusAreaIds.length > 0) {
    const { data: contentJunctions } = await supabase
      .from('content_focus_areas')
      .select('content_id')
      .in('focus_id', focusAreaIds)
    const contentIds = Array.from(new Set((contentJunctions ?? []).map(j => j.content_id)))
    if (contentIds.length > 0) {
      const { data: contentData } = await supabase
        .from('content_published')
        .select('id, title_6th_grade, summary_6th_grade, pathway_primary, center, source_url, published_at')
        .eq('is_active', true)
        .in('id', contentIds)
        .limit(4)
      related = contentData || []
    }
  }

  // Fetch translations for non-English
  const langId = await getLangId()
  let officialTranslation: { title?: string; summary?: string } | undefined
  let policyTranslations: Record<string, { title?: string; summary?: string }> = {}
  if (langId) {
    const pIds = (policies || []).map(function (p) { return p.policy_id })
    const results = await Promise.all([
      fetchTranslationsForTable('elected_officials', [official.official_id], langId),
      pIds.length > 0 ? fetchTranslationsForTable('policies', pIds, langId) : {},
    ])
    officialTranslation = results[0][official.official_id]
    policyTranslations = results[1]
  }

  const displayTitle = officialTranslation?.title || official.title
  const photoUrl = profile?.photo_url || (official as any).photo_url as string | null
  const bio = profile?.bio_short || official.description_5th_grade

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Breadcrumb items={[
        { label: 'Civic Leaders', href: '/officials' },
        { label: official.official_name }
      ]} />

      {/* Header with photo */}
      <div className="mb-8 flex flex-col sm:flex-row gap-6">
        {photoUrl && (
          <div className="flex-shrink-0">
            <img
              src={photoUrl}
              alt={official.official_name}
              className="w-24 h-24 rounded-full object-cover border-3 border-brand-border"
            />
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {official.level && (
              <span className={'text-xs px-3 py-1 rounded-full font-medium ' + levelColor(official.level)}>{official.level}</span>
            )}
            {official.party && (
              <span className="text-xs px-3 py-1 rounded-full font-medium bg-gray-100 text-gray-700">{official.party}</span>
            )}
          </div>
          <h1 className="font-serif text-3xl font-bold text-brand-text mb-1">{official.official_name}</h1>
          {displayTitle && <p className="text-lg text-brand-muted mb-2">{displayTitle}</p>}
          <div className="flex items-center gap-2 text-sm text-brand-muted">
            {official.jurisdiction && <span>{official.jurisdiction}</span>}
          </div>
          {official.term_end && (
            <p className="text-sm text-brand-muted mt-1 flex items-center gap-1">
              <Calendar size={14} /> Term ends: {new Date(official.term_end).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* Contact card */}
      <div className="bg-white rounded-xl border border-brand-border p-6 mb-8">
        <h3 className="text-sm font-semibold text-brand-text mb-3 uppercase tracking-wide">Contact</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
        </div>
        {(profile?.address_office || profile?.address_district) && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
      </div>

      {/* Focus Areas */}
      {focusAreas.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-brand-text mb-3">Focus Areas</h2>
          <div className="flex flex-wrap gap-2">
            {focusAreas.map(function (fa, i) {
              return (
                <Link
                  key={fa.focus_id}
                  href={'/focus-areas/' + fa.focus_id}
                  className={'text-sm px-3 py-1.5 rounded-full border font-medium hover:opacity-80 transition-opacity ' + focusAreaColor(i)}
                >
                  {fa.focus_area_name}
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* About */}
      {bio && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-brand-text mb-3">About</h2>
          <p className="text-brand-muted leading-relaxed">{bio}</p>
        </section>
      )}

      {/* District info + map */}
      {(official.district_type || official.district_id) && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-brand-text mb-3">District</h2>
          <div className="bg-white rounded-xl border border-brand-border p-5 mb-4">
            <div className="flex items-center gap-4 mb-3">
              {official.district_type && (
                <div>
                  <span className="text-xs text-brand-muted uppercase tracking-wide">Type</span>
                  <p className="font-medium text-brand-text">{official.district_type}</p>
                </div>
              )}
              {official.district_id && (
                <div>
                  <span className="text-xs text-brand-muted uppercase tracking-wide">District</span>
                  <p className="font-medium text-brand-text">{official.district_id}</p>
                </div>
              )}
            </div>

            {/* ZIP codes in this district */}
            {districtZips.length > 0 && (
              <div className="mt-3">
                <span className="text-xs text-brand-muted uppercase tracking-wide flex items-center gap-1 mb-2">
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

          {/* District map */}
          <OfficialDistrictMap districtType={official.district_type} districtId={official.district_id} />
        </section>
      )}

      {/* Counties Served */}
      {counties.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-brand-text mb-3 flex items-center gap-2">
            <Users size={20} /> Counties Served
          </h2>
          <div className="flex flex-wrap gap-2">
            {counties.map(function (c) {
              return (
                <span key={c.county_id} className="text-sm px-3 py-1.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-full font-medium">
                  {c.county_name}
                </span>
              )
            })}
          </div>
        </section>
      )}

      {/* Policies */}
      {policies && policies.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-brand-text mb-4">Policies &amp; Legislation</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  />
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Related Content */}
      {related.length > 0 && (
        <div className="mt-10">
          <RelatedContent title="Related Content" items={related} />
        </div>
      )}

      <EntityMesh entityType="official" entityId={id} />
    </div>
  )
}
