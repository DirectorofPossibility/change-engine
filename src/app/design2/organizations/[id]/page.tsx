import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  Phone, Mail, Globe, MapPin, Clock, ArrowLeft,
  Users, DollarSign, Handshake, MapPinned,
  Facebook, Twitter, Instagram, Linkedin, Youtube
} from 'lucide-react'
import { ServiceCard } from '@/components/exchange/ServiceCard'
import { DetailWayfinder } from '@/components/exchange/DetailWayfinder'
import { getWayfinderContext } from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'

export const revalidate = 600

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('organizations').select('org_name, description_5th_grade').eq('org_id', id).single()
  if (!data) return { title: 'Not Found' }
  return {
    title: data.org_name,
    description: data.description_5th_grade || 'Organization details on the Community Exchange.',
  }
}

const SOCIAL_ICONS: Record<string, typeof Facebook> = {
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
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
            socialLinks.push({ platform, url })
          }
        })
      }
    } catch { /* ignore parse errors */ }
  }

  // Parse hours of operation if present
  let hoursEntries: Array<{ day: string; time: string }> = []
  if (org.hours_of_operation) {
    try {
      const hours = typeof org.hours_of_operation === 'string' ? JSON.parse(org.hours_of_operation) : org.hours_of_operation
      if (hours && typeof hours === 'object') {
        hoursEntries = Object.entries(hours).map(function ([day, time]) {
          return { day, time: String(time) }
        })
      }
    } catch { /* ignore parse errors */ }
  }

  const userProfile = await getUserProfile()
  const wayfinderData = await getWayfinderContext('organization', id, userProfile?.role)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F0EAE0' }}>
      {/* Back link */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Link
          href="/design2/organizations"
          className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
          style={{ color: '#C75B2A' }}
        >
          <ArrowLeft size={16} />
          Back to Organizations
        </Link>
      </div>

      {/* Header card */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="rounded-xl p-6 sm:p-8" style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#D4CCBE' }}>
          <div className="flex items-start gap-5">
            {org.logo_url && (
              <img
                src={org.logo_url}
                alt={org.org_name}
                className="w-20 h-20 rounded-xl object-contain flex-shrink-0"
                style={{ backgroundColor: '#F0EAE0', borderWidth: 1, borderColor: '#D4CCBE' }}
              />
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl sm:text-4xl font-serif font-bold" style={{ color: '#1a1a1a' }}>
                {org.org_name}
              </h1>
              {org.mission_statement && (
                <p className="mt-2 text-base italic font-serif" style={{ color: '#6B6560' }}>
                  {org.mission_statement}
                </p>
              )}
              {!org.mission_statement && org.description_5th_grade && (
                <p className="mt-2 text-base leading-relaxed" style={{ color: '#6B6560' }}>
                  {org.description_5th_grade}
                </p>
              )}
              <div className="flex items-center gap-3 mt-3 text-sm" style={{ color: '#6B6560' }}>
                {org.year_founded && <span>Founded {org.year_founded}</span>}
                {org.ntee_code && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-lg"
                    style={{ backgroundColor: '#F0EAE0', borderWidth: 1, borderColor: '#D4CCBE', color: '#6B6560' }}
                  >
                    NTEE: {org.ntee_code}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Contact card */}
        <div className="rounded-xl p-5" style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#D4CCBE' }}>
          <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: '#6B6560' }}>
            Contact
          </h2>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {org.phone && (
              <a href={'tel:' + org.phone} className="flex items-center gap-2 text-sm hover:underline" style={{ color: '#C75B2A' }}>
                <Phone size={16} /> {org.phone}
              </a>
            )}
            {org.email && (
              <a href={'mailto:' + org.email} className="flex items-center gap-2 text-sm hover:underline" style={{ color: '#C75B2A' }}>
                <Mail size={16} /> {org.email}
              </a>
            )}
            {org.website && (
              <a href={org.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:underline" style={{ color: '#C75B2A' }}>
                <Globe size={16} /> Website
              </a>
            )}
            {fullAddress && (
              <span className="flex items-center gap-2 text-sm" style={{ color: '#6B6560' }}>
                <MapPin size={16} /> {fullAddress}
              </span>
            )}
          </div>
        </div>

        {/* Hours of operation */}
        {hoursEntries.length > 0 && (
          <div className="rounded-xl p-5" style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#D4CCBE' }}>
            <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: '#6B6560' }}>
              <Clock size={14} className="inline mr-1.5 -mt-0.5" />
              Hours of Operation
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-sm">
              {hoursEntries.map(function (entry) {
                return (
                  <div key={entry.day} className="flex justify-between py-1" style={{ borderBottomWidth: 1, borderColor: '#F0EAE0' }}>
                    <span className="font-medium" style={{ color: '#1a1a1a' }}>{entry.day}</span>
                    <span style={{ color: '#6B6560' }}>{entry.time}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Social media */}
        {socialLinks.length > 0 && (
          <div className="rounded-xl p-5" style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#D4CCBE' }}>
            <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: '#6B6560' }}>
              Social Media
            </h2>
            <div className="flex flex-wrap gap-3">
              {socialLinks.map(function (link) {
                const IconComponent = SOCIAL_ICONS[link.platform.toLowerCase()] || Globe
                return (
                  <a
                    key={link.platform}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-lg hover:opacity-80 transition-opacity capitalize"
                    style={{ backgroundColor: '#F0EAE0', color: '#C75B2A' }}
                  >
                    <IconComponent size={16} />
                    {link.platform}
                  </a>
                )
              })}
            </div>
          </div>
        )}

        {/* Stats */}
        {(org.people_served || org.service_area || org.partner_count != null || org.annual_budget != null) && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {org.people_served && (
              <div className="rounded-xl p-4 text-center" style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#D4CCBE' }}>
                <Users size={20} className="mx-auto mb-2" style={{ color: '#C75B2A' }} />
                <div className="text-lg font-bold" style={{ color: '#1a1a1a' }}>{org.people_served}</div>
                <div className="text-xs" style={{ color: '#6B6560' }}>People Served</div>
              </div>
            )}
            {org.service_area && (
              <div className="rounded-xl p-4 text-center" style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#D4CCBE' }}>
                <MapPinned size={20} className="mx-auto mb-2" style={{ color: '#C75B2A' }} />
                <div className="text-sm font-bold" style={{ color: '#1a1a1a' }}>{org.service_area}</div>
                <div className="text-xs" style={{ color: '#6B6560' }}>Service Area</div>
              </div>
            )}
            {org.partner_count != null && (
              <div className="rounded-xl p-4 text-center" style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#D4CCBE' }}>
                <Handshake size={20} className="mx-auto mb-2" style={{ color: '#C75B2A' }} />
                <div className="text-lg font-bold" style={{ color: '#1a1a1a' }}>{org.partner_count}</div>
                <div className="text-xs" style={{ color: '#6B6560' }}>Partners</div>
              </div>
            )}
            {org.annual_budget != null && (
              <div className="rounded-xl p-4 text-center" style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#D4CCBE' }}>
                <DollarSign size={20} className="mx-auto mb-2" style={{ color: '#C75B2A' }} />
                <div className="text-lg font-bold" style={{ color: '#1a1a1a' }}>${org.annual_budget.toLocaleString()}</div>
                <div className="text-xs" style={{ color: '#6B6560' }}>Annual Budget</div>
              </div>
            )}
          </div>
        )}

        {/* Description (shown when mission was used in header) */}
        {org.mission_statement && org.description_5th_grade && (
          <div className="rounded-xl p-6" style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#D4CCBE' }}>
            <h2 className="text-xl font-serif font-bold mb-3" style={{ color: '#1a1a1a' }}>About</h2>
            <p className="leading-relaxed" style={{ color: '#6B6560' }}>{org.description_5th_grade}</p>
          </div>
        )}

        {/* Tags */}
        {org.tags && org.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {org.tags.map(function (tag: string) {
              return (
                <span
                  key={tag}
                  className="text-xs px-2.5 py-1 rounded-lg"
                  style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#D4CCBE', color: '#6B6560' }}
                >
                  {tag}
                </span>
              )
            })}
          </div>
        )}

        {/* Services */}
        {services && services.length > 0 && (
          <section>
            <h2 className="text-xl font-serif font-bold mb-4" style={{ color: '#1a1a1a' }}>
              Services ({services.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map(function (svc) {
                return (
                  <Link key={svc.service_id} href={'/design2/services/' + svc.service_id}>
                    <ServiceCard
                      name={svc.service_name}
                      description={svc.description_5th_grade}
                      phone={svc.phone}
                      address={svc.address}
                      city={svc.city}
                      state={svc.state}
                      zipCode={svc.zip_code}
                      website={svc.website}
                    />
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* Wayfinder */}
        <div className="mt-4">
          <DetailWayfinder data={wayfinderData} currentType="organization" currentId={id} userRole={userProfile?.role} />
        </div>
      </div>
    </div>
  )
}
