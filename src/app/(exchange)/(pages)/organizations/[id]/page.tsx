import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Phone, Mail, Globe, MapPin, Clock, ExternalLink } from 'lucide-react'
import { ContentCard } from '@/components/exchange/ContentCard'
import { getLangId, fetchTranslationsForTable, getWayfinderContext, getRandomQuote } from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'
import { getUIStrings } from '@/lib/i18n'
import { cookies } from 'next/headers'
import { QuoteCard } from '@/components/exchange/QuoteCard'
import { FeaturedPromo } from '@/components/exchange/FeaturedPromo'
import { AdminEditPanel } from '@/components/exchange/AdminEditPanel'
import type { EditField } from '@/components/exchange/AdminEditPanel'
import { SpiralTracker } from '@/components/exchange/SpiralTracker'
import Image from 'next/image'
import { organizationJsonLd } from '@/lib/jsonld'
import { THEMES } from '@/lib/constants'
import { DetailPageLayout } from '@/components/exchange/DetailPageLayout'


export const revalidate = 86400

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('organizations').select('org_name, description_5th_grade').eq('org_id', id).single()
  if (!data) return { title: 'Not Found' }
  return {
    title: data.org_name,
    description: data.description_5th_grade || 'Details on the Change Engine.',
  }
}

export default async function OrganizationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: org } = await supabase.from('organizations').select('*').eq('org_id', id).single()
  if (!org) notFound()

  const [
    { data: services },
    { data: content },
    { data: opportunities },
  ] = await Promise.all([
    supabase.from('services_211').select('*').eq('org_id', id).eq('is_active', 'Yes'),
    supabase.from('content_published').select('id, title_6th_grade, summary_6th_grade, pathway_primary, center, source_url, published_at, image_url, inbox_id, focus_area_ids').eq('org_id', id).eq('is_active', true).order('published_at', { ascending: false }).limit(6),
    supabase.from('opportunities').select('opportunity_id, opportunity_name, description_5th_grade, time_commitment, is_virtual, website, org_id').eq('org_id', id).eq('is_active', 'Yes').limit(6),
  ])

  const fullAddress = [org.address, org.city, org.state, org.zip_code].filter(Boolean).join(', ')

  const socialLinks: Array<{ platform: string; url: string }> = []
  if (org.social_media) {
    try {
      const sm = typeof org.social_media === 'string' ? JSON.parse(org.social_media) : org.social_media
      if (sm && typeof sm === 'object') {
        Object.entries(sm).forEach(function ([platform, url]) {
          if (typeof url === 'string' && url) socialLinks.push({ platform, url })
        })
      }
    } catch { /* ignore */ }
  }

  let hoursList: Array<{ day: string; time: string }> = []
  if (org.hours_of_operation) {
    try {
      const hours = typeof org.hours_of_operation === 'string' ? JSON.parse(org.hours_of_operation) : org.hours_of_operation
      if (hours && typeof hours === 'object') {
        hoursList = Object.entries(hours).map(function ([day, time]) { return { day, time: String(time) } })
      }
    } catch { /* ignore */ }
  }

  const langId = await getLangId()
  const cookieStore = await cookies()
  const lang = cookieStore.get('lang')?.value || 'en'
  const t = getUIStrings(lang)
  let orgTranslation: { title?: string; summary?: string } | undefined
  let serviceTranslations: Record<string, { title?: string; summary?: string }> = {}
  let contentTranslations: Record<string, { title?: string; summary?: string }> = {}
  if (langId) {
    const sIds = (services || []).map(function (s) { return s.service_id })
    const cIds = (content || []).map(function (c) { return c.inbox_id }).filter(Boolean) as string[]
    const results = await Promise.all([
      fetchTranslationsForTable('organizations', [org.org_id], langId),
      sIds.length > 0 ? fetchTranslationsForTable('services_211', sIds, langId) : {},
      cIds.length > 0 ? fetchTranslationsForTable('content_published', cIds, langId) : {},
    ])
    orgTranslation = results[0][org.org_id]
    serviceTranslations = results[1]
    contentTranslations = results[2]
  }

  const displayOrgName = orgTranslation?.title || org.org_name
  const displayOrgDesc = orgTranslation?.summary || org.description_5th_grade

  const userProfile = await getUserProfile()
  const [wayfinderData, quote] = await Promise.all([
    getWayfinderContext('organization', id, userProfile?.role),
    getRandomQuote(),
  ])

  const jsonLd = organizationJsonLd(org as any)

  const { data: orgThemes } = await supabase.from('organization_pathways').select('theme_id').eq('org_id', id)
  const orgThemeId = orgThemes && orgThemes.length > 0 ? orgThemes[0].theme_id : null
  const themeEntry = orgThemeId ? (THEMES as Record<string, { color: string; name: string }>)[orgThemeId] : null

  const childCount = (services?.length || 0) + (content?.length || 0) + (opportunities?.length || 0)

  return (
    <>
      <DetailPageLayout
        bgColor="#ffffff"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Organizations', href: '/organizations' },
          { label: displayOrgName },
        ]}
        eyebrow={org.org_type && org.org_type !== 'Organization' ? { text: org.org_type } : undefined}
        title={displayOrgName}
        subtitle={org.mission_statement || displayOrgDesc || null}
        heroImage={org.logo_url ? (
          <Image src={org.logo_url} alt={org.org_name} className="object-contain border border-rule" width={72} height={72} />
        ) : undefined}
        metaRow={
          <div className="flex flex-wrap gap-4">
            {org.phone && (
              <span className="font-mono text-[0.65rem] uppercase tracking-wider text-muted">{org.phone}</span>
            )}
            {fullAddress && (
              <span className="font-mono text-[0.65rem] uppercase tracking-wider text-muted">{fullAddress}</span>
            )}
            {org.year_founded && (
              <span className="font-mono text-[0.65rem] uppercase tracking-wider text-muted">Est. {org.year_founded}</span>
            )}
          </div>
        }
        themeColor={themeEntry?.color || '#1b5e8a'}
        sidebar={
          <>
            <FeaturedPromo variant="card" />
            {quote && <QuoteCard text={quote.quote_text} attribution={quote.attribution} accentColor={themeEntry?.color || '#1b5e8a'} />}
          </>
        }
        wayfinderData={wayfinderData}
        wayfinderType="organization"
        wayfinderEntityId={id}
        userRole={userProfile?.role}
        feedbackType="organization"
        feedbackId={id}
        feedbackName={displayOrgName}
        jsonLd={jsonLd || undefined}
        footer={
          <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            <div className="mb-10 h-px bg-rule" />
            <Link href="/organizations" className="italic text-blue text-[0.95rem] hover:underline">
              Back to Organizations
            </Link>
          </div>
        }
      >
        <SpiralTracker action="view_organization" />

        {/* About */}
        {((org.mission_statement && displayOrgDesc) || (!org.mission_statement && displayOrgDesc)) && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 className="text-2xl">{t('detail.about')}</h2>
            </div>
            <div className="h-px border-b border-dotted border-rule mb-4" />
            <p className="text-[0.95rem] text-muted leading-relaxed">{displayOrgDesc}</p>
          </section>
        )}

        {/* Contact */}
        {(org.phone || org.email || org.website || fullAddress || org.map_link || socialLinks.length > 0) && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 className="text-2xl">{t('detail.contact')}</h2>
            </div>
            <div className="h-px border-b border-dotted border-rule mb-4" />
            <ul className="space-y-2">
              {org.phone && (
                <li className="flex items-center gap-2">
                  <Phone size={14} className="text-muted" />
                  <a href={'tel:' + org.phone} className="hover:underline text-[0.9rem] text-blue">{org.phone}</a>
                </li>
              )}
              {org.email && (
                <li className="flex items-center gap-2">
                  <Mail size={14} className="text-muted" />
                  <a href={'mailto:' + org.email} className="hover:underline text-[0.9rem] text-blue">{org.email}</a>
                </li>
              )}
              {org.website && (
                <li className="flex items-center gap-2">
                  <Globe size={14} className="text-muted" />
                  <a href={org.website} target="_blank" rel="noopener noreferrer" className="hover:underline text-[0.9rem] text-blue">
                    {t('detail.website')} <ExternalLink size={10} className="inline opacity-50" />
                  </a>
                </li>
              )}
              {fullAddress && (
                <li className="flex items-center gap-2">
                  <MapPin size={14} className="text-muted" />
                  <span className="text-[0.9rem] text-muted">{fullAddress}</span>
                </li>
              )}
              {org.map_link && (
                <li className="flex items-center gap-2">
                  <MapPin size={14} className="text-muted" />
                  <a href={org.map_link} target="_blank" rel="noopener noreferrer" className="hover:underline text-[0.9rem] text-blue">
                    View on Map <ExternalLink size={10} className="inline opacity-50" />
                  </a>
                </li>
              )}
            </ul>
            {socialLinks.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-rule">
                {socialLinks.map(function (link) {
                  return (
                    <a key={link.platform} href={link.url} target="_blank" rel="noopener noreferrer" className="capitalize hover:underline font-mono uppercase tracking-wider text-xs text-blue border border-rule px-2 py-0.5">
                      {link.platform}
                    </a>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {/* Hours */}
        {hoursList.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 className="flex items-center gap-2 text-2xl">
                <Clock size={18} className="text-muted" /> Hours of Operation
              </h2>
            </div>
            <div className="h-px border-b border-dotted border-rule mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
              {hoursList.map(function (h) {
                return (
                  <div key={h.day} className="flex justify-between py-1 border-b border-rule">
                    <span className="text-[0.9rem] font-medium">{h.day}</span>
                    <span className="text-[0.9rem] text-muted">{h.time}</span>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* At a Glance */}
        {(org.people_served || org.service_area || org.partner_count || org.annual_budget) && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 className="text-2xl">At a Glance</h2>
            </div>
            <div className="h-px border-b border-dotted border-rule mb-4" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 border-t-2 border-ink">
              {org.people_served && (
                <div className="p-4 border-r border-rule border-b border-rule">
                  <span className="block text-xl font-bold">{org.people_served}</span>
                  <span className="block font-mono text-[0.65rem] uppercase tracking-wider text-muted mt-1">People Served</span>
                </div>
              )}
              {org.service_area && (
                <div className="p-4 border-r border-rule border-b border-rule">
                  <span className="block text-xl font-bold">{org.service_area}</span>
                  <span className="block font-mono text-[0.65rem] uppercase tracking-wider text-muted mt-1">Service Area</span>
                </div>
              )}
              {org.partner_count != null && (
                <div className="p-4 border-r border-rule border-b border-rule">
                  <span className="block text-xl font-bold">{org.partner_count}</span>
                  <span className="block font-mono text-[0.65rem] uppercase tracking-wider text-muted mt-1">Partners</span>
                </div>
              )}
              {org.annual_budget != null && (
                <div className="p-4 border-b border-rule">
                  <span className="block text-xl font-bold">{'$' + org.annual_budget.toLocaleString()}</span>
                  <span className="block font-mono text-[0.65rem] uppercase tracking-wider text-muted mt-1">Annual Budget</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Tags */}
        {org.tags && org.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-10">
            {org.tags.map(function (tag) {
              return <span key={tag} className="font-mono text-xs uppercase tracking-wider text-muted border border-rule px-2 py-0.5">{tag}</span>
            })}
          </div>
        )}

        <div className="my-10 h-px bg-rule" />

        {/* Services */}
        {services && services.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 className="text-2xl">Services</h2>
              <span className="text-xs text-muted">{services.length}</span>
            </div>
            <div className="h-px border-b border-dotted border-rule mb-4" />
            {services.slice(0, 4).map(function (svc) {
              const st = serviceTranslations[svc.service_id]
              const svcName = st?.title || svc.service_name
              const svcDesc = st?.summary || svc.description_5th_grade
              return (
                <Link key={svc.service_id} href={'/services/' + svc.service_id} className="flex items-start gap-3 py-3 hover:underline border-b border-rule">
                  <span className="mt-2 flex-shrink-0 inline-block w-1.5 h-1.5 bg-blue" />
                  <div className="min-w-0">
                    <span className="block font-semibold">{svcName}</span>
                    {svcDesc && <span className="block line-clamp-2 mt-0.5 text-sm text-muted">{svcDesc}</span>}
                  </div>
                </Link>
              )
            })}
            {services.length > 4 && (
              <details className="mt-2">
                <summary className="italic text-blue text-[0.9rem] cursor-pointer">
                  See {services.length - 4} more services
                </summary>
                {services.slice(4).map(function (svc) {
                  const st = serviceTranslations[svc.service_id]
                  const svcName = st?.title || svc.service_name
                  const svcDesc = st?.summary || svc.description_5th_grade
                  return (
                    <Link key={svc.service_id} href={'/services/' + svc.service_id} className="flex items-start gap-3 py-3 hover:underline border-b border-rule">
                      <span className="mt-2 flex-shrink-0 inline-block w-1.5 h-1.5 bg-blue" />
                      <div className="min-w-0">
                        <span className="block font-semibold">{svcName}</span>
                        {svcDesc && <span className="block line-clamp-2 mt-0.5 text-sm text-muted">{svcDesc}</span>}
                      </div>
                    </Link>
                  )
                })}
              </details>
            )}
          </section>
        )}

        {/* Content / News */}
        {content && content.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 className="text-2xl">News & Resources</h2>
              <span className="text-xs text-muted">{content.length}</span>
            </div>
            <div className="h-px border-b border-dotted border-rule mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {content.map(function (item: any) {
                const ct = item.inbox_id ? contentTranslations[item.inbox_id] : undefined
                return (
                  <ContentCard
                    key={item.id}
                    id={item.id}
                    title={item.title_6th_grade}
                    summary={item.summary_6th_grade}
                    pathway={item.pathway_primary}
                    center={item.center}
                    sourceUrl={item.source_url}
                    publishedAt={item.published_at}
                    imageUrl={item.image_url}
                    translatedTitle={ct?.title}
                    translatedSummary={ct?.summary}
                  />
                )
              })}
            </div>
          </section>
        )}

        {/* Opportunities */}
        {opportunities && opportunities.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 className="text-2xl">Opportunities</h2>
              <span className="text-xs text-muted">{opportunities.length}</span>
            </div>
            <div className="h-px border-b border-dotted border-rule mb-4" />
            {opportunities.map(function (opp: any) {
              return (
                <Link key={opp.opportunity_id} href={'/opportunities/' + opp.opportunity_id} className="flex items-start gap-3 py-3 hover:underline border-b border-rule">
                  <span className="mt-2 flex-shrink-0 inline-block w-1.5 h-1.5 bg-blue" />
                  <div className="min-w-0">
                    <span className="block font-semibold">{opp.opportunity_name}</span>
                    {opp.description_5th_grade && <span className="block line-clamp-2 mt-0.5 text-sm text-muted">{opp.description_5th_grade}</span>}
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      {opp.time_commitment && (
                        <span className="font-mono text-[0.65rem] uppercase tracking-wider text-muted">{opp.time_commitment}</span>
                      )}
                      {opp.is_virtual === 'Yes' && (
                        <span className="font-mono text-[0.65rem] uppercase tracking-wider text-blue border border-blue px-1.5 py-px">Virtual</span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </section>
        )}

        {/* Empty state */}
        {childCount === 0 && (
          <div className="text-center py-12 border border-dashed border-rule">
            <p className="text-muted">No services, content, or opportunities have been linked to this organization yet.</p>
          </div>
        )}

      </DetailPageLayout>

      <AdminEditPanel
        entityType="organizations"
        entityId={id}
        userRole={userProfile?.role}
        fields={[
          { key: 'org_name', label: 'Organization Name', type: 'text', value: org.org_name },
          { key: 'org_type', label: 'Organization Type', type: 'select', value: org.org_type, options: ['Community Partner', 'Foundation/Grantmaker', 'Government Agency', 'Educational Institution', 'Media & News', 'Healthcare Provider', 'Human Services', 'Advocacy/Policy', 'Arts, Culture & Humanities', 'Environmental', 'Faith-Based'] },
          { key: 'mission_statement', label: 'Mission Statement', type: 'textarea', value: org.mission_statement },
          { key: 'description_5th_grade', label: 'Description (simplified)', type: 'textarea', value: org.description_5th_grade },
          { key: 'website', label: 'Website', type: 'url', value: org.website },
          { key: 'phone', label: 'Phone', type: 'text', value: org.phone },
          { key: 'email', label: 'Email', type: 'text', value: org.email },
          { key: 'address', label: 'Address', type: 'text', value: org.address },
          { key: 'city', label: 'City', type: 'text', value: org.city },
          { key: 'state', label: 'State', type: 'text', value: org.state },
          { key: 'zip_code', label: 'ZIP Code', type: 'text', value: org.zip_code },
          { key: 'logo_url', label: 'Logo URL', type: 'url', value: org.logo_url },
          { key: 'hero_image_url', label: 'Hero Image URL', type: 'url', value: org.hero_image_url },
          { key: 'map_link', label: 'Map Link', type: 'url', value: org.map_link },
          { key: 'service_area', label: 'Service Area', type: 'text', value: org.service_area },
          { key: 'people_served', label: 'People Served', type: 'text', value: org.people_served },
          { key: 'year_founded', label: 'Year Founded', type: 'number', value: org.year_founded },
          { key: 'annual_budget', label: 'Annual Budget', type: 'number', value: org.annual_budget },
          { key: 'ntee_code', label: 'NTEE Code', type: 'text', value: org.ntee_code },
          { key: 'engagement_level', label: 'Engagement Level', type: 'select', value: (org as any).engagement_level, options: ['anchor', 'active', 'emerging', 'listed'] },
        ] as EditField[]}
      />
    </>
  )
}
