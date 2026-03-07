import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Phone, Mail, Globe, MapPin } from 'lucide-react'
import { ServiceCard } from '@/components/exchange/ServiceCard'
import { DetailWayfinder } from '@/components/exchange/DetailWayfinder'
import { getLangId, fetchTranslationsForTable, getWayfinderContext, getRandomQuote } from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'
import { QuoteCard } from '@/components/exchange/QuoteCard'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { TranslatePageButton } from '@/components/exchange/TranslatePageButton'
import { AdminEditPanel } from '@/components/exchange/AdminEditPanel'
import type { EditField } from '@/components/exchange/AdminEditPanel'
import { WayfinderTooltipPos } from '@/components/exchange/WayfinderTooltips'
import { FeedbackLoop } from '@/components/exchange/FeedbackLoop'
import { SpiralTracker } from '@/components/exchange/SpiralTracker'

export const revalidate = 86400

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('organizations').select('org_name, description_5th_grade').eq('org_id', id).single()
  if (!data) return { title: 'Not Found' }
  return {
    title: data.org_name,
    description: data.description_5th_grade || 'Details on the Community Exchange.',
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

  const { data: services } = await supabase
    .from('services_211')
    .select('*')
    .eq('org_id', id)
    .eq('is_active', 'Yes')

  const fullAddress = [org.address, org.city, org.state, org.zip_code].filter(Boolean).join(', ')

  // Parse social media if present
  const socialLinks: Array<{ platform: string; url: string }> = []
  if (org.social_media) {
    try {
      const sm = typeof org.social_media === 'string' ? JSON.parse(org.social_media) : org.social_media
      if (sm && typeof sm === 'object') {
        Object.entries(sm).forEach(function ([platform, url]) {
          if (typeof url === 'string' && url) {
            socialLinks.push({ platform: platform, url: url })
          }
        })
      }
    } catch { /* ignore parse errors */ }
  }

  // Parse hours of operation if present
  let hoursDisplay: string | null = null
  if (org.hours_of_operation) {
    try {
      const hours = typeof org.hours_of_operation === 'string' ? JSON.parse(org.hours_of_operation) : org.hours_of_operation
      if (hours && typeof hours === 'object') {
        hoursDisplay = Object.entries(hours).map(function ([day, time]) { return day + ': ' + time }).join(' | ')
      }
    } catch { /* ignore parse errors */ }
  }

  // Fetch translations for non-English
  const langId = await getLangId()
  let orgTranslation: { title?: string; summary?: string } | undefined
  let serviceTranslations: Record<string, { title?: string; summary?: string }> = {}
  if (langId) {
    const sIds = (services || []).map(function (s) { return s.service_id })
    const results = await Promise.all([
      fetchTranslationsForTable('organizations', [org.org_id], langId),
      sIds.length > 0 ? fetchTranslationsForTable('services_211', sIds, langId) : {},
    ])
    orgTranslation = results[0][org.org_id]
    serviceTranslations = results[1]
  }

  const displayOrgName = orgTranslation?.title || org.org_name
  const displayOrgDesc = orgTranslation?.summary || org.description_5th_grade

  const userProfile = await getUserProfile()
  const [wayfinderData, quote] = await Promise.all([
    getWayfinderContext('organization', id, userProfile?.role),
    getRandomQuote(),
  ])

  return (
    <div>
      <SpiralTracker action="view_organization" />
      {/* Hero */}
      <div className="bg-brand-bg border-b border-brand-border">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Breadcrumb items={[
            { label: 'Organizations', href: '/organizations' },
            { label: displayOrgName }
          ]} />
          <div className="flex items-start gap-4 mt-4">
            {org.logo_url && (
              <img src={org.logo_url} alt={org.org_name} className="w-16 h-16 rounded-lg object-contain bg-white border border-brand-border" />
            )}
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-3xl font-serif font-bold text-brand-text">{displayOrgName}</h1>
                {(org as any).is_verified === 'Yes' && (
                  <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 20 20" fill="none" aria-label="Verified">
                    <path d="M10 1l2.39 1.68L15.2 2.1l.58 2.82 2.32 1.58-.92 2.72 1.14 2.6-2.14 1.86.18 2.88-2.8.76L12.39 19 10 17.5 7.61 19l-1.17-2.68-2.8-.76.18-2.88L1.68 10.82l1.14-2.6-.92-2.72L4.22 3.92l.58-2.82 2.81.58L10 1z" fill="#805ad5" />
                    <path d="M7 10l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              {org.mission_statement && <p className="text-brand-muted mt-1 font-serif italic">{org.mission_statement}</p>}
              {!org.mission_statement && displayOrgDesc && <p className="text-brand-muted mt-1">{displayOrgDesc}</p>}
              <div className="flex items-center gap-3 mt-2 text-sm text-brand-muted">
                {org.org_type === 'Community Partner' ? (
                  <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-semibold" style={{ backgroundColor: '#805ad510', color: '#805ad5', border: '1px solid #805ad530' }}>
                    <svg className="w-3 h-3" viewBox="0 0 20 20" fill="#805ad5"><path d="M10 1l2.39 1.68L15.2 2.1l.58 2.82 2.32 1.58-.92 2.72 1.14 2.6-2.14 1.86.18 2.88-2.8.76L12.39 19 10 17.5 7.61 19l-1.17-2.68-2.8-.76.18-2.88L1.68 10.82l1.14-2.6-.92-2.72L4.22 3.92l.58-2.82 2.81.58L10 1z" /></svg>
                    Community Partner
                  </span>
                ) : org.org_type ? (
                  <span className="text-xs px-2 py-0.5 rounded-lg bg-brand-accent/10 text-brand-accent border border-brand-accent/20">{org.org_type}</span>
                ) : null}
                {org.year_founded && <span>Founded {org.year_founded}</span>}
                {org.ntee_code && <span className="relative text-xs px-2 py-0.5 rounded-lg bg-brand-bg-alt border border-brand-border">NTEE: {org.ntee_code}<WayfinderTooltipPos tipKey="ntee_code" position="bottom" /></span>}
              </div>
              <div className="mt-2">
                <TranslatePageButton isTranslated={!!orgTranslation?.title} contentType="organizations" contentId={org.org_id} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Contact card */}
      <div className="relative bg-white rounded-xl border border-brand-border p-5 mb-8 flex flex-wrap gap-4">
        <WayfinderTooltipPos tipKey="org_action_buttons" position="bottom" />
        {org.phone && (
          <a href={'tel:' + org.phone} className="flex items-center gap-2 text-sm text-brand-accent hover:underline">
            <Phone size={16} /> {org.phone}
          </a>
        )}
        {org.email && (
          <a href={'mailto:' + org.email} className="flex items-center gap-2 text-sm text-brand-accent hover:underline">
            <Mail size={16} /> {org.email}
          </a>
        )}
        {org.website && (
          <a href={org.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-brand-accent hover:underline">
            <Globe size={16} /> Website
          </a>
        )}
        {fullAddress && (
          <span className="flex items-center gap-2 text-sm text-brand-muted">
            <MapPin size={16} /> {fullAddress}
          </span>
        )}
        {org.map_link && (
          <a href={org.map_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-brand-accent hover:underline">
            <MapPin size={16} /> Map
          </a>
        )}
      </div>

      {/* Hours */}
      {hoursDisplay && (
        <div className="bg-white rounded-xl border border-brand-border p-4 mb-8">
          <h3 className="text-sm font-semibold text-brand-muted mb-2">Hours of Operation</h3>
          <p className="text-sm text-brand-text">{hoursDisplay}</p>
        </div>
      )}

      {/* Social media */}
      {socialLinks.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-8">
          {socialLinks.map(function (link) {
            return (
              <a key={link.platform} href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 bg-brand-bg rounded-lg text-brand-accent hover:underline capitalize">
                {link.platform}
              </a>
            )
          })}
        </div>
      )}

      {/* Stats */}
      {(org.people_served || org.service_area || org.partner_count || org.annual_budget) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {org.people_served && (
            <div className="bg-white rounded-xl border border-brand-border p-4 text-center">
              <div className="text-lg font-bold text-brand-text">{org.people_served}</div>
              <div className="text-xs text-brand-muted">People Served</div>
            </div>
          )}
          {org.service_area && (
            <div className="bg-white rounded-xl border border-brand-border p-4 text-center">
              <div className="text-sm font-bold text-brand-text">{org.service_area}</div>
              <div className="text-xs text-brand-muted">Service Area</div>
            </div>
          )}
          {org.partner_count != null && (
            <div className="bg-white rounded-xl border border-brand-border p-4 text-center">
              <div className="text-lg font-bold text-brand-text">{org.partner_count}</div>
              <div className="text-xs text-brand-muted">Partners</div>
            </div>
          )}
          {org.annual_budget != null && (
            <div className="bg-white rounded-xl border border-brand-border p-4 text-center">
              <div className="text-lg font-bold text-brand-text">${org.annual_budget.toLocaleString()}</div>
              <div className="text-xs text-brand-muted">Annual Budget</div>
            </div>
          )}
        </div>
      )}

      {/* Description (if mission wasn't shown) */}
      {org.mission_statement && displayOrgDesc && (
        <section className="mb-8">
          <h2 className="text-xl font-serif font-bold text-brand-text mb-3">About</h2>
          <p className="text-brand-muted">{displayOrgDesc}</p>
        </section>
      )}

      {/* Tags */}
      {org.tags && org.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-8">
          {org.tags.map(function (tag) {
            return <span key={tag} className="text-xs px-2 py-0.5 rounded-lg bg-brand-bg text-brand-muted">{tag}</span>
          })}
        </div>
      )}

      {/* Services */}
      {services && services.length > 0 && (
        <section>
          <h2 className="text-xl font-serif font-bold text-brand-text mb-4">Services ({services.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map(function (svc) {
              const st = serviceTranslations[svc.service_id]
              return (
                <Link key={svc.service_id} href={'/services/' + svc.service_id}>
                  <ServiceCard
                    name={svc.service_name}
                    description={svc.description_5th_grade}
                    phone={svc.phone}
                    address={svc.address}
                    city={svc.city}
                    state={svc.state}
                    zipCode={svc.zip_code}
                    website={svc.website}
                    translatedName={st?.title}
                    translatedDescription={st?.summary}
                  />
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Quote */}
      {quote && (
        <QuoteCard text={quote.quote_text} attribution={quote.attribution} />
      )}

      <div className="mt-10">
        <DetailWayfinder data={wayfinderData} currentType="organization" currentId={id} userRole={userProfile?.role} />
      </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="max-w-sm">
          <FeedbackLoop entityType="organizations" entityId={id} entityName={org.org_name || ''} />
        </div>
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
