/**
 * @fileoverview Read-only organization profile page for partners.
 *
 * Displays the partner's organization details including name, mission,
 * contact info, website, and associated services count.
 *
 * @route GET /dashboard/partner/organization
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function PartnerOrganizationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/dashboard/partner/organization')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, org_id')
    .eq('auth_id', user.id)
    .single()

  if (!profile || profile.role !== 'partner' || !profile.org_id) {
    redirect('/dashboard')
  }

  const orgId = profile.org_id as string

  // Fetch organization details
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('org_id', orgId)
    .single()

  if (!org) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-brand-text font-serif">My Organization</h1>
        <div className="bg-white rounded-xl border border-brand-border p-12 text-center">
          <p className="text-brand-muted">Organization details not found.</p>
        </div>
      </div>
    )
  }

  const orgData = org as any

  // Fetch services count for this org
  const { count: servicesCount } = await supabase
    .from('services_211')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-text font-serif">My Organization</h1>
        <p className="text-brand-muted mt-1">Your organization profile details</p>
      </div>

      {/* Organization Header */}
      <div className="bg-white rounded-xl border border-brand-border p-6">
        <div className="flex items-start gap-6">
          {/* Logo */}
          {orgData.logo_url && (
            <div className="w-20 h-20 rounded-xl overflow-hidden border border-brand-border flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={orgData.logo_url}
                alt={`${orgData.org_name} logo`}
                className="w-full h-full object-contain"
              />
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-brand-text font-serif">{orgData.org_name}</h2>
            {orgData.mission_statement && (
              <p className="text-brand-muted mt-2 text-sm leading-relaxed">
                {orgData.mission_statement}
              </p>
            )}
            {orgData.description_5th_grade && !orgData.mission_statement && (
              <p className="text-brand-muted mt-2 text-sm leading-relaxed">
                {orgData.description_5th_grade}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Information */}
        <div className="bg-white rounded-xl border border-brand-border p-6">
          <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wide mb-4">
            Contact Information
          </h3>
          <div className="space-y-3">
            <DetailRow label="Email" value={orgData.email} />
            <DetailRow label="Phone" value={orgData.phone} />
            {orgData.phone_secondary && (
              <DetailRow label="Secondary Phone" value={orgData.phone_secondary} />
            )}
            <DetailRow
              label="Website"
              value={orgData.website}
              isLink
            />
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-xl border border-brand-border p-6">
          <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wide mb-4">
            Location
          </h3>
          <div className="space-y-3">
            <DetailRow label="Address" value={orgData.address} />
            <DetailRow
              label="City, State"
              value={
                orgData.city && orgData.state
                  ? `${orgData.city}, ${orgData.state}`
                  : orgData.city || orgData.state || null
              }
            />
            <DetailRow label="ZIP Code" value={orgData.zip_code} />
            <DetailRow label="Service Area" value={orgData.service_area} />
          </div>
        </div>

        {/* Organization Details */}
        <div className="bg-white rounded-xl border border-brand-border p-6">
          <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wide mb-4">
            Organization Details
          </h3>
          <div className="space-y-3">
            <DetailRow label="EIN" value={orgData.ein} />
            <DetailRow label="Year Founded" value={orgData.year_founded ? String(orgData.year_founded) : null} />
            <DetailRow label="People Served" value={orgData.people_served} />
            <DetailRow label="NTEE Code" value={orgData.ntee_code} />
            <DetailRow
              label="Verified"
              value={orgData.is_verified === 'true' ? 'Yes' : orgData.is_verified === 'false' ? 'No' : null}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-xl border border-brand-border p-6">
          <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wide mb-4">
            Content
          </h3>
          <div className="space-y-3">
            <DetailRow label="Services Listed" value={servicesCount != null ? String(servicesCount) : '0'} />
            {orgData.tags && orgData.tags.length > 0 && (
              <div>
                <p className="text-xs text-brand-muted mb-1">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {orgData.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded-full bg-brand-bg border border-brand-border text-brand-text"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Description */}
      {orgData.description_full && (
        <div className="bg-white rounded-xl border border-brand-border p-6">
          <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wide mb-4">
            Full Description
          </h3>
          <p className="text-sm text-brand-text leading-relaxed whitespace-pre-wrap">
            {orgData.description_full}
          </p>
        </div>
      )}

      {/* Note */}
      <div className="bg-brand-bg rounded-xl border border-brand-border p-4">
        <p className="text-xs text-brand-muted">
          Organization details are managed by The Change Lab team. If you need to update your
          organization information, please contact us at{' '}
          <a href="mailto:hello@changeengine.us" className="text-brand-accent hover:underline">
            hello@changeengine.us
          </a>.
        </p>
      </div>
    </div>
  )
}

/* ── Inline helper ── */

function DetailRow({
  label,
  value,
  isLink = false,
}: {
  label: string
  value: string | null
  isLink?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-brand-muted flex-shrink-0">{label}</span>
      {value ? (
        isLink ? (
          <a
            href={value.startsWith('http') ? value : `https://${value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-brand-accent hover:underline text-right truncate max-w-xs"
          >
            {value}
          </a>
        ) : (
          <span className="text-sm text-brand-text text-right">{value}</span>
        )
      ) : (
        <span className="text-sm text-brand-muted">-</span>
      )}
    </div>
  )
}
