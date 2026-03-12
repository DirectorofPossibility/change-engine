import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Phone, Mail, Globe, MapPin, Clock, Users, DollarSign, Calendar, ExternalLink, BookOpen, Heart } from 'lucide-react'
import { ServiceCard } from '@/components/exchange/ServiceCard'
import { ContentCard } from '@/components/exchange/ContentCard'
import { getLangId, fetchTranslationsForTable, getWayfinderContext, getRandomQuote } from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'
import { getUIStrings } from '@/lib/i18n'
import { cookies } from 'next/headers'
import { QuoteCard } from '@/components/exchange/QuoteCard'
import { AdminEditPanel } from '@/components/exchange/AdminEditPanel'
import type { EditField } from '@/components/exchange/AdminEditPanel'
import { WayfinderTooltipPos } from '@/components/exchange/WayfinderTooltips'
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

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('org_id', id)
    .single()

  if (!org) notFound()

  // Fetch children: services, content, opportunities
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

  // Parse social media
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

  // Parse hours
  let hoursList: Array<{ day: string; time: string }> = []
  if (org.hours_of_operation) {
    try {
      const hours = typeof org.hours_of_operation === 'string' ? JSON.parse(org.hours_of_operation) : org.hours_of_operation
      if (hours && typeof hours === 'object') {
        hoursList = Object.entries(hours).map(function ([day, time]) { return { day, time: String(time) } })
      }
    } catch { /* ignore */ }
  }

  // Translations
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

  // Resolve theme color from org's pathway junctions
  const { data: orgThemes } = await supabase.from('organization_pathways').select('theme_id').eq('org_id', id)
  const orgThemeId = orgThemes && orgThemes.length > 0 ? orgThemes[0].theme_id : null
  const themeEntry = orgThemeId ? (THEMES as Record<string, { color: string; name: string }>)[orgThemeId] : null
  const accentColor = themeEntry?.color || '#1b5e8a'

  const childCount = (services?.length || 0) + (content?.length || 0) + (opportunities?.length || 0)

  return (
    <div>
      <SpiralTracker action="view_organization" />

      <DetailPageLayout
        breadcrumbs={[
          { label: 'Organizations', href: '/organizations' },
          { label: displayOrgName }
        ]}
        eyebrow={{ text: t('detail.organization') }}
        eyebrowMeta={
          org.org_type && org.org_type !== 'Organization' ? (
            <span className="font-mono uppercase tracking-[0.2em] text-xs" style={{ color: '#5c6474' }}>
              {org.org_type}
            </span>
          ) : undefined
        }
        title={displayOrgName}
        subtitle={org.mission_statement || displayOrgDesc || null}
        heroImage={
          org.logo_url ? (
            <div className="flex items-start gap-4 -mt-3">
              <Image src={org.logo_url} alt={org.org_name} className="object-contain flex-shrink-0 hidden sm:block" style={{ border: '1px solid #dde1e8' }} width={72} height={72} />
            </div>
          ) : undefined
        }
        metaRow={
          <>
            {org.phone && (
              <span className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.2em]" style={{ color: '#5c6474' }}>
                <span style={{ display: 'inline-block', width: 6, height: 6, background: '#7ec8e3' }} /> {org.phone}
              </span>
            )}
            {fullAddress && (
              <span className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.2em]" style={{ color: '#5c6474' }}>
                <span style={{ display: 'inline-block', width: 6, height: 6, background: '#1b5e8a' }} /> {fullAddress}
              </span>
            )}
            {org.website && (
              <a href={org.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.2em] hover:underline" style={{ color: '#1b5e8a' }}>
                <span style={{ display: 'inline-block', width: 6, height: 6, background: '#1b5e8a' }} /> {t('detail.website')}
              </a>
            )}
            {org.year_founded && (
              <span className="relative inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.2em]" style={{ color: '#5c6474' }}>
                <span style={{ display: 'inline-block', width: 6, height: 6, background: '#8a929e' }} /> Est. {org.year_founded}
                <WayfinderTooltipPos tipKey="year_founded" position="bottom" />
              </span>
            )}
            {org.ntee_code && (
              <span className="relative font-mono text-xs uppercase tracking-[0.2em]" style={{ color: '#8a929e' }}>
                NTEE {org.ntee_code}
                <WayfinderTooltipPos tipKey="ntee_code" position="bottom" />
              </span>
            )}
          </>
        }
        actions={{
          translate: { isTranslated: !!orgTranslation?.title, contentType: 'organizations', contentId: org.org_id },
          share: { title: displayOrgName || undefined, url: 'https://www.changeengine.us/organizations/' + id },
        }}
        themeColor={accentColor}
        wayfinderData={wayfinderData}
        wayfinderType="organization"
        wayfinderEntityId={id}
        userRole={userProfile?.role}
        feedbackType="organizations"
        feedbackId={id}
        feedbackName={org.org_name || ''}
        jsonLd={jsonLd}
        sidebar={
          <div className="lg:sticky lg:top-24 space-y-6">
            {/* sidebar content intentionally empty — feedback handled by layout */}
          </div>
        }
      >
        {/* ── Main column content ── */}

        {/* About section */}
        {((org.mission_statement && displayOrgDesc) || (!org.mission_statement && displayOrgDesc)) && (
          <section className="mb-8">
            <h2 className="font-mono uppercase tracking-[0.2em] text-xs mb-3" style={{ color: '#5c6474' }}>{t('detail.about')}</h2>
            <div style={{ borderTop: '1px solid #dde1e8', paddingTop: '0.75rem' }}>
              <p className="font-body leading-relaxed" style={{ color: '#5c6474' }}>{displayOrgDesc}</p>
            </div>
          </section>
        )}

        {/* Contact section */}
        {(org.phone || org.email || org.website || fullAddress || org.map_link || socialLinks.length > 0) && (
          <section className="mb-8">
            <h2 className="font-mono uppercase tracking-[0.2em] text-xs mb-3" style={{ color: '#5c6474' }}>{t('detail.contact')}</h2>
            <div style={{ borderTop: '1px solid #dde1e8', paddingTop: '0.75rem' }}>
              <WayfinderTooltipPos tipKey="org_action_buttons" position="bottom" />
              <ul className="space-y-2">
                {org.phone && (
                  <li className="flex items-center gap-2">
                    <Phone size={14} style={{ color: '#8a929e' }} />
                    <a href={'tel:' + org.phone} className="font-body text-sm hover:underline" style={{ color: '#1b5e8a' }}>{org.phone}</a>
                  </li>
                )}
                {org.email && (
                  <li className="flex items-center gap-2">
                    <Mail size={14} style={{ color: '#8a929e' }} />
                    <a href={'mailto:' + org.email} className="font-body text-sm hover:underline" style={{ color: '#1b5e8a' }}>{org.email}</a>
                  </li>
                )}
                {org.website && (
                  <li className="flex items-center gap-2">
                    <Globe size={14} style={{ color: '#8a929e' }} />
                    <a href={org.website} target="_blank" rel="noopener noreferrer" className="font-body text-sm hover:underline" style={{ color: '#1b5e8a' }}>
                      {t('detail.website')} <ExternalLink size={10} className="inline opacity-50" />
                    </a>
                  </li>
                )}
                {fullAddress && (
                  <li className="flex items-center gap-2">
                    <MapPin size={14} style={{ color: '#8a929e' }} />
                    <span className="font-body text-sm" style={{ color: '#5c6474' }}>{fullAddress}</span>
                  </li>
                )}
                {org.map_link && (
                  <li className="flex items-center gap-2">
                    <MapPin size={14} style={{ color: '#8a929e' }} />
                    <a href={org.map_link} target="_blank" rel="noopener noreferrer" className="font-body text-sm hover:underline" style={{ color: '#1b5e8a' }}>
                      View on Map <ExternalLink size={10} className="inline opacity-50" />
                    </a>
                  </li>
                )}
              </ul>

              {/* Social links */}
              {socialLinks.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3 pt-3" style={{ borderTop: '1px solid #dde1e8' }}>
                  {socialLinks.map(function (link) {
                    return (
                      <a key={link.platform} href={link.url} target="_blank" rel="noopener noreferrer" className="font-mono text-xs uppercase tracking-[0.2em] px-2 py-1 capitalize hover:underline" style={{ color: '#1b5e8a', border: '1px solid #dde1e8' }}>
                        {link.platform}
                      </a>
                    )
                  })}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Hours of operation */}
        {hoursList.length > 0 && (
          <section className="mb-8">
            <h2 className="font-mono uppercase tracking-[0.2em] text-xs mb-3 flex items-center gap-2" style={{ color: '#5c6474' }}>
              <Clock size={14} /> Hours of Operation
            </h2>
            <div style={{ borderTop: '1px solid #dde1e8', paddingTop: '0.75rem' }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
                {hoursList.map(function (h) {
                  return (
                    <div key={h.day} className="flex justify-between text-sm py-1" style={{ borderBottom: '1px solid #dde1e8' }}>
                      <span className="font-body font-medium" style={{ color: '#0d1117' }}>{h.day}</span>
                      <span className="font-body" style={{ color: '#5c6474' }}>{h.time}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {/* Stats row */}
        {(org.people_served || org.service_area || org.partner_count || org.annual_budget) && (
          <section className="mb-8">
            <h2 className="font-mono uppercase tracking-[0.2em] text-xs mb-3" style={{ color: '#5c6474' }}>At a Glance</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-0" style={{ borderTop: '2px solid #0d1117' }}>
              {org.people_served && (
                <div className="p-4" style={{ borderRight: '1px solid #dde1e8', borderBottom: '1px solid #dde1e8' }}>
                  <span className="block font-display text-xl font-bold" style={{ color: '#0d1117' }}>{org.people_served}</span>
                  <span className="block font-mono text-xs uppercase tracking-[0.2em] mt-1" style={{ color: '#5c6474' }}>People Served</span>
                </div>
              )}
              {org.service_area && (
                <div className="p-4" style={{ borderRight: '1px solid #dde1e8', borderBottom: '1px solid #dde1e8' }}>
                  <span className="block font-display text-xl font-bold" style={{ color: '#0d1117' }}>{org.service_area}</span>
                  <span className="block font-mono text-xs uppercase tracking-[0.2em] mt-1" style={{ color: '#5c6474' }}>Service Area</span>
                </div>
              )}
              {org.partner_count != null && (
                <div className="p-4" style={{ borderRight: '1px solid #dde1e8', borderBottom: '1px solid #dde1e8' }}>
                  <span className="block font-display text-xl font-bold" style={{ color: '#0d1117' }}>{org.partner_count}</span>
                  <span className="block font-mono text-xs uppercase tracking-[0.2em] mt-1" style={{ color: '#5c6474' }}>Partners</span>
                </div>
              )}
              {org.annual_budget != null && (
                <div className="p-4" style={{ borderBottom: '1px solid #dde1e8' }}>
                  <span className="block font-display text-xl font-bold" style={{ color: '#0d1117' }}>{'$' + org.annual_budget.toLocaleString()}</span>
                  <span className="block font-mono text-xs uppercase tracking-[0.2em] mt-1" style={{ color: '#5c6474' }}>Annual Budget</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Tags */}
        {org.tags && org.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-8">
            {org.tags.map(function (tag) {
              return <span key={tag} className="font-mono text-xs uppercase tracking-[0.2em] px-2 py-1" style={{ color: '#5c6474', border: '1px solid #dde1e8' }}>{tag}</span>
            })}
          </div>
        )}

        {/* Services */}
        {services && services.length > 0 && (
          <section className="mb-8">
            <h2 className="font-mono uppercase tracking-[0.2em] text-xs mb-4" style={{ color: '#5c6474' }}>
              Services ({services.length})
            </h2>
            <div style={{ borderTop: '1.5px solid #dde1e8' }}>
              {services.map(function (svc) {
                const st = serviceTranslations[svc.service_id]
                const svcName = st?.title || svc.service_name
                const svcDesc = st?.summary || svc.description_5th_grade
                return (
                  <Link key={svc.service_id} href={'/services/' + svc.service_id} className="flex items-start gap-3 py-3 group hover:underline" style={{ borderBottom: '1px solid #dde1e8' }}>
                    <span className="mt-2 flex-shrink-0" style={{ display: 'inline-block', width: 6, height: 6, background: '#7ec8e3' }} />
                    <div className="min-w-0">
                      <span className="font-body font-semibold block" style={{ color: '#0d1117' }}>{svcName}</span>
                      {svcDesc && <span className="font-body text-sm block line-clamp-2 mt-0.5" style={{ color: '#5c6474' }}>{svcDesc}</span>}
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* Content / News */}
        {content && content.length > 0 && (
          <section className="mb-8">
            <h2 className="font-mono uppercase tracking-[0.2em] text-xs mb-4" style={{ color: '#5c6474' }}>
              News & Resources ({content.length})
            </h2>
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
          <section className="mb-8">
            <h2 className="font-mono uppercase tracking-[0.2em] text-xs mb-4" style={{ color: '#5c6474' }}>
              Opportunities ({opportunities.length})
            </h2>
            <div style={{ borderTop: '1.5px solid #dde1e8' }}>
              {opportunities.map(function (opp: any) {
                return (
                  <Link key={opp.opportunity_id} href={'/opportunities/' + opp.opportunity_id} className="flex items-start gap-3 py-3 group hover:underline" style={{ borderBottom: '1px solid #dde1e8' }}>
                    <span className="mt-2 flex-shrink-0" style={{ display: 'inline-block', width: 6, height: 6, background: '#1b5e8a' }} />
                    <div className="min-w-0">
                      <span className="font-body font-semibold block" style={{ color: '#0d1117' }}>{opp.opportunity_name}</span>
                      {opp.description_5th_grade && <span className="font-body text-sm block line-clamp-2 mt-0.5" style={{ color: '#5c6474' }}>{opp.description_5th_grade}</span>}
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        {opp.time_commitment && (
                          <span className="font-mono text-xs uppercase tracking-[0.2em]" style={{ color: '#8a929e' }}>{opp.time_commitment}</span>
                        )}
                        {opp.is_virtual === 'Yes' && (
                          <span className="font-mono text-xs uppercase tracking-[0.2em] px-1.5 py-0.5" style={{ color: '#1b5e8a', border: '1px solid #1b5e8a' }}>Virtual</span>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* Empty state when no children */}
        {childCount === 0 && (
          <div className="text-center py-12" style={{ border: '1px dashed #dde1e8' }}>
            <p className="font-body" style={{ color: '#5c6474' }}>No services, content, or opportunities have been linked to this organization yet.</p>
          </div>
        )}

        {/* Quote */}
        {quote && <QuoteCard text={quote.quote_text} attribution={quote.attribution} />}
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
    </div>
  )
}
