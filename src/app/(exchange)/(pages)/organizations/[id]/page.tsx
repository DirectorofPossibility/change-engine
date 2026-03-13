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
import { AdminEditPanel } from '@/components/exchange/AdminEditPanel'
import type { EditField } from '@/components/exchange/AdminEditPanel'
import { SpiralTracker } from '@/components/exchange/SpiralTracker'
import Image from 'next/image'
import { organizationJsonLd } from '@/lib/jsonld'
import { THEMES } from '@/lib/constants'


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
    <div className="bg-paper min-h-screen">
      <SpiralTracker action="view_organization" />
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
          <div className="flex items-start gap-5 mt-4">
            {org.logo_url && (
              <Image src={org.logo_url} alt={org.org_name} className="object-contain flex-shrink-0 hidden sm:block" style={{ border: '1px solid #dde1e8' }} width={72} height={72} />
            )}
            <div>
              {org.org_type && org.org_type !== 'Organization' && (
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: "#5c6474" }}>{org.org_type}</span>
              )}
              <h1 style={{ fontSize: '2.2rem', lineHeight: 1.15, marginTop: '0.25rem' }}>
                {displayOrgName}
              </h1>
              {(org.mission_statement || displayOrgDesc) && (
                <p style={{ fontSize: '1rem', color: "#5c6474", marginTop: '0.5rem', lineHeight: 1.7 }}>
                  {org.mission_statement || displayOrgDesc}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mt-6">
            {org.phone && (
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: "#5c6474" }}>{org.phone}</span>
            )}
            {fullAddress && (
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: "#5c6474" }}>{fullAddress}</span>
            )}
            {org.year_founded && (
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: "#5c6474" }}>Est. {org.year_founded}</span>
            )}
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontSize: '0.7rem', color: "#5c6474" }}>
          <Link href="/" className="hover:underline" style={{ color: "#1b5e8a" }}>Home</Link>
          <span className="mx-2">/</span>
          <Link href="/organizations" className="hover:underline" style={{ color: "#1b5e8a" }}>Organizations</Link>
          <span className="mx-2">/</span>
          <span>{displayOrgName}</span>
        </nav>
      </div>

      {/* Main content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">

        {/* About */}
        {((org.mission_statement && displayOrgDesc) || (!org.mission_statement && displayOrgDesc)) && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontSize: '1.5rem',  }}>{t('detail.about')}</h2>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
            <p style={{ fontSize: '0.95rem', color: "#5c6474", lineHeight: 1.7 }}>{displayOrgDesc}</p>
          </section>
        )}

        {/* Contact */}
        {(org.phone || org.email || org.website || fullAddress || org.map_link || socialLinks.length > 0) && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontSize: '1.5rem',  }}>{t('detail.contact')}</h2>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
            <ul className="space-y-2">
              {org.phone && (
                <li className="flex items-center gap-2">
                  <Phone size={14} style={{ color: "#5c6474" }} />
                  <a href={'tel:' + org.phone} className="hover:underline" style={{ fontSize: '0.9rem', color: "#1b5e8a" }}>{org.phone}</a>
                </li>
              )}
              {org.email && (
                <li className="flex items-center gap-2">
                  <Mail size={14} style={{ color: "#5c6474" }} />
                  <a href={'mailto:' + org.email} className="hover:underline" style={{ fontSize: '0.9rem', color: "#1b5e8a" }}>{org.email}</a>
                </li>
              )}
              {org.website && (
                <li className="flex items-center gap-2">
                  <Globe size={14} style={{ color: "#5c6474" }} />
                  <a href={org.website} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ fontSize: '0.9rem', color: "#1b5e8a" }}>
                    {t('detail.website')} <ExternalLink size={10} className="inline opacity-50" />
                  </a>
                </li>
              )}
              {fullAddress && (
                <li className="flex items-center gap-2">
                  <MapPin size={14} style={{ color: "#5c6474" }} />
                  <span style={{ fontSize: '0.9rem', color: "#5c6474" }}>{fullAddress}</span>
                </li>
              )}
              {org.map_link && (
                <li className="flex items-center gap-2">
                  <MapPin size={14} style={{ color: "#5c6474" }} />
                  <a href={org.map_link} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ fontSize: '0.9rem', color: "#1b5e8a" }}>
                    View on Map <ExternalLink size={10} className="inline opacity-50" />
                  </a>
                </li>
              )}
            </ul>
            {socialLinks.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3" style={{ borderTop: '1px solid #dde1e8' }}>
                {socialLinks.map(function (link) {
                  return (
                    <a key={link.platform} href={link.url} target="_blank" rel="noopener noreferrer" className="capitalize hover:underline" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: "#1b5e8a", border: '1px solid #dde1e8', padding: '2px 8px' }}>
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
              <h2 className="flex items-center gap-2" style={{ fontSize: '1.5rem',  }}>
                <Clock size={18} style={{ color: "#5c6474" }} /> Hours of Operation
              </h2>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
              {hoursList.map(function (h) {
                return (
                  <div key={h.day} className="flex justify-between py-1" style={{ borderBottom: '1px solid #dde1e8' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 500,  }}>{h.day}</span>
                    <span style={{ fontSize: '0.9rem', color: "#5c6474" }}>{h.time}</span>
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
              <h2 style={{ fontSize: '1.5rem',  }}>At a Glance</h2>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-0" style={{ borderTop: '2px solid ' + '#0d1117' }}>
              {org.people_served && (
                <div className="p-4" style={{ borderRight: '1px solid #dde1e8', borderBottom: '1px solid #dde1e8' }}>
                  <span className="block" style={{ fontSize: '1.3rem', fontWeight: 700,  }}>{org.people_served}</span>
                  <span className="block" style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: "#5c6474", marginTop: '0.25rem' }}>People Served</span>
                </div>
              )}
              {org.service_area && (
                <div className="p-4" style={{ borderRight: '1px solid #dde1e8', borderBottom: '1px solid #dde1e8' }}>
                  <span className="block" style={{ fontSize: '1.3rem', fontWeight: 700,  }}>{org.service_area}</span>
                  <span className="block" style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: "#5c6474", marginTop: '0.25rem' }}>Service Area</span>
                </div>
              )}
              {org.partner_count != null && (
                <div className="p-4" style={{ borderRight: '1px solid #dde1e8', borderBottom: '1px solid #dde1e8' }}>
                  <span className="block" style={{ fontSize: '1.3rem', fontWeight: 700,  }}>{org.partner_count}</span>
                  <span className="block" style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: "#5c6474", marginTop: '0.25rem' }}>Partners</span>
                </div>
              )}
              {org.annual_budget != null && (
                <div className="p-4" style={{ borderBottom: '1px solid #dde1e8' }}>
                  <span className="block" style={{ fontSize: '1.3rem', fontWeight: 700,  }}>{'$' + org.annual_budget.toLocaleString()}</span>
                  <span className="block" style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: "#5c6474", marginTop: '0.25rem' }}>Annual Budget</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Tags */}
        {org.tags && org.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-10">
            {org.tags.map(function (tag) {
              return <span key={tag} style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: "#5c6474", border: '1px solid #dde1e8', padding: '2px 8px' }}>{tag}</span>
            })}
          </div>
        )}

        <div className="my-10" style={{ height: 1, background: '#dde1e8' }} />

        {/* Services */}
        {services && services.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontSize: '1.5rem',  }}>Services</h2>
              <span style={{ fontSize: '0.7rem', color: "#5c6474" }}>{services.length}</span>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
            {services.slice(0, 4).map(function (svc) {
              const st = serviceTranslations[svc.service_id]
              const svcName = st?.title || svc.service_name
              const svcDesc = st?.summary || svc.description_5th_grade
              return (
                <Link key={svc.service_id} href={'/services/' + svc.service_id} className="flex items-start gap-3 py-3 hover:underline" style={{ borderBottom: '1px solid #dde1e8' }}>
                  <span className="mt-2 flex-shrink-0" style={{ display: 'inline-block', width: 6, height: 6, background: '#1b5e8a' }} />
                  <div className="min-w-0">
                    <span className="block" style={{ fontWeight: 600,  }}>{svcName}</span>
                    {svcDesc && <span className="block line-clamp-2 mt-0.5" style={{ fontSize: '0.85rem', color: "#5c6474" }}>{svcDesc}</span>}
                  </div>
                </Link>
              )
            })}
            {services.length > 4 && (
              <details className="mt-2">
                <summary style={{ fontStyle: 'italic', color: "#1b5e8a", fontSize: '0.9rem', cursor: 'pointer' }}>
                  See {services.length - 4} more services
                </summary>
                {services.slice(4).map(function (svc) {
                  const st = serviceTranslations[svc.service_id]
                  const svcName = st?.title || svc.service_name
                  const svcDesc = st?.summary || svc.description_5th_grade
                  return (
                    <Link key={svc.service_id} href={'/services/' + svc.service_id} className="flex items-start gap-3 py-3 hover:underline" style={{ borderBottom: '1px solid #dde1e8' }}>
                      <span className="mt-2 flex-shrink-0" style={{ display: 'inline-block', width: 6, height: 6, background: '#1b5e8a' }} />
                      <div className="min-w-0">
                        <span className="block" style={{ fontWeight: 600,  }}>{svcName}</span>
                        {svcDesc && <span className="block line-clamp-2 mt-0.5" style={{ fontSize: '0.85rem', color: "#5c6474" }}>{svcDesc}</span>}
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
              <h2 style={{ fontSize: '1.5rem',  }}>News & Resources</h2>
              <span style={{ fontSize: '0.7rem', color: "#5c6474" }}>{content.length}</span>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
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
              <h2 style={{ fontSize: '1.5rem',  }}>Opportunities</h2>
              <span style={{ fontSize: '0.7rem', color: "#5c6474" }}>{opportunities.length}</span>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
            {opportunities.map(function (opp: any) {
              return (
                <Link key={opp.opportunity_id} href={'/opportunities/' + opp.opportunity_id} className="flex items-start gap-3 py-3 hover:underline" style={{ borderBottom: '1px solid #dde1e8' }}>
                  <span className="mt-2 flex-shrink-0" style={{ display: 'inline-block', width: 6, height: 6, background: '#1b5e8a' }} />
                  <div className="min-w-0">
                    <span className="block" style={{ fontWeight: 600,  }}>{opp.opportunity_name}</span>
                    {opp.description_5th_grade && <span className="block line-clamp-2 mt-0.5" style={{ fontSize: '0.85rem', color: "#5c6474" }}>{opp.description_5th_grade}</span>}
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      {opp.time_commitment && (
                        <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: "#5c6474" }}>{opp.time_commitment}</span>
                      )}
                      {opp.is_virtual === 'Yes' && (
                        <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: "#1b5e8a", border: '1px solid ' + '#1b5e8a', padding: '1px 6px' }}>Virtual</span>
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
          <div className="text-center py-12" style={{ border: '1px dashed ' + '#dde1e8' }}>
            <p style={{ color: "#5c6474" }}>No services, content, or opportunities have been linked to this organization yet.</p>
          </div>
        )}

        {/* Quote */}
        {quote && <QuoteCard text={quote.quote_text} attribution={quote.attribution} accentColor={'#1b5e8a'} />}
      </div>

      {/* Footer */}
      <div className="my-10 max-w-[900px] mx-auto px-6" style={{ height: 1, background: '#dde1e8' }} />
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <Link href="/organizations" style={{ fontStyle: 'italic', color: "#1b5e8a", fontSize: '0.95rem' }} className="hover:underline">
          Back to Organizations
        </Link>
      </div>

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
