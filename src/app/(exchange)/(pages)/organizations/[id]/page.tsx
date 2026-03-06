import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Phone, Mail, Globe, MapPin } from 'lucide-react'
import { ServiceCard } from '@/components/exchange/ServiceCard'
import { DetailWayfinder } from '@/components/exchange/DetailWayfinder'
import { getLangId, fetchTranslationsForTable, getWayfinderContext } from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'

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
  const wayfinderData = await getWayfinderContext('organization', id, userProfile?.role)

  return (
    <div>
      {/* Hero */}
      <div className="bg-brand-bg border-b border-brand-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Breadcrumb items={[
            { label: 'Organizations', href: '/organizations' },
            { label: displayOrgName }
          ]} />
          <div className="flex items-start gap-4 mt-4">
            {org.logo_url && (
              <img src={org.logo_url} alt={org.org_name} className="w-16 h-16 rounded-lg object-contain bg-white border border-brand-border" />
            )}
            <div>
              <h1 className="text-3xl font-serif font-bold text-brand-text">{displayOrgName}</h1>
              {org.mission_statement && <p className="text-brand-muted mt-1 font-serif italic">{org.mission_statement}</p>}
              {!org.mission_statement && displayOrgDesc && <p className="text-brand-muted mt-1">{displayOrgDesc}</p>}
              <div className="flex items-center gap-3 mt-2 text-sm text-brand-muted">
                {org.year_founded && <span>Founded {org.year_founded}</span>}
                {org.ntee_code && <span className="text-xs px-2 py-0.5 rounded-lg bg-brand-bg-alt border border-brand-border">NTEE: {org.ntee_code}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Contact card */}
      <div className="bg-white rounded-xl border border-brand-border p-5 mb-8 flex flex-wrap gap-4">
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

      <div className="mt-10">
        <DetailWayfinder data={wayfinderData} currentType="organization" currentId={id} userRole={userProfile?.role} />
      </div>
      </div>
    </div>
  )
}
