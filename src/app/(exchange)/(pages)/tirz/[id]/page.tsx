import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Building2, MapPin, Scale, ExternalLink } from 'lucide-react'
import { getTirzZone, getOfficialsForTirz, getPoliciesForTirz } from '@/lib/data/exchange'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { TirzDetailMap } from './TirzDetailMap'
import Image from 'next/image'

export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const zone = await getTirzZone(id)
  if (!zone) return { title: 'Not Found' }
  return {
    title: zone.name + ' TIRZ — Change Engine',
    description: 'TIRZ-' + zone.site_number + ' ' + zone.name + ': Tax Increment Reinvestment Zone in Houston. View boundaries, related officials, and policies.',
  }
}

export default async function TirzDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [zone, officials, policies] = await Promise.all([
    getTirzZone(id),
    getOfficialsForTirz(id),
    getPoliciesForTirz(id),
  ])

  if (!zone) notFound()

  return (
    <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Breadcrumb items={[
        { label: 'TIRZ Zones', href: '/tirz' },
        { label: zone.name },
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <span
              className="w-12 h-12 flex items-center justify-center text-white text-lg font-bold"
              style={{ backgroundColor: '#C75B2A' }}
            >
              {zone.site_number}
            </span>
            <div>
              <h1 className="text-3xl font-bold text-brand-text">{zone.name}</h1>
              <p className="text-sm font-mono text-brand-muted">TIRZ-{zone.site_number}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 mb-8">
            <div className="bg-white border border-brand-border p-4 text-center">
              <Building2 size={20} className="mx-auto mb-1" style={{ color: '#C75B2A' }} />
              <div className="text-lg font-bold text-brand-text">TIRZ-{zone.site_number}</div>
              <div className="text-xs text-brand-muted">Zone Number</div>
            </div>
            {zone.status && (
              <div className="bg-white border border-brand-border p-4 text-center">
                <div className="text-lg font-bold text-brand-text capitalize">{zone.status}</div>
                <div className="text-xs text-brand-muted">Status</div>
              </div>
            )}
            {zone.year_established && (
              <div className="bg-white border border-brand-border p-4 text-center">
                <div className="text-lg font-bold text-brand-text">{zone.year_established}</div>
                <div className="text-xs text-brand-muted">Established</div>
              </div>
            )}
            {zone.managing_entity && (
              <div className="bg-white border border-brand-border p-4 text-center">
                <div className="text-sm font-bold text-brand-text truncate">{zone.managing_entity}</div>
                <div className="text-xs text-brand-muted">Managed By</div>
              </div>
            )}
          </div>

          {/* Description */}
          {zone.description && (
            <section className="mb-8">
              <p className="text-brand-muted leading-relaxed">{zone.description}</p>
            </section>
          )}

          {/* Website */}
          {zone.website && (
            <div className="mb-8">
              <a
                href={zone.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-accent text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <ExternalLink size={14} />
                Visit TIRZ Website
              </a>
            </div>
          )}

          {/* Map */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-brand-text mb-4">Zone Boundary</h2>
            <TirzDetailMap siteNumber={zone.site_number} />
          </section>

          {/* Council Districts */}
          {zone.council_districts && (
            <div className="bg-brand-accent/5 border border-brand-border p-4 mb-8">
              <p className="text-sm text-brand-text">
                Overlapping Council Districts: <strong>{zone.council_districts}</strong> &mdash;{' '}
                <Link href="/officials" className="text-brand-accent hover:underline font-medium">
                  View Officials &rarr;
                </Link>
              </p>
            </div>
          )}

          {/* ZIP Codes */}
          {zone.zip_codes && (
            <div className="bg-brand-bg border border-brand-border p-4 mb-8">
              <p className="text-sm text-brand-text">
                ZIP Codes: <strong>{zone.zip_codes}</strong> &mdash;{' '}
                <Link href="/officials/lookup" className="text-brand-accent hover:underline font-medium">
                  Who represents this area? &rarr;
                </Link>
              </p>
            </div>
          )}

          {/* Officials */}
          {officials.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-bold text-brand-text mb-4 flex items-center gap-2">
                <MapPin size={20} style={{ color: '#C75B2A' }} />
                Officials Connected to This Zone
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {officials.slice(0, 8).map(function (official: any) {
                  return (
                    <Link
                      key={official.official_id}
                      href={'/officials/' + official.official_id}
                      className="flex items-center gap-3 bg-white border border-brand-border p-4 hover:border-ink transition-shadow"
                    >
                      {official.photo_url ? (
                        <Image
                          src={official.photo_url}
                          alt={official.official_name}
                          className="w-12 h-12 rounded-full object-cover border border-brand-border"
                         width={80} height={48} />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-brand-bg-alt flex items-center justify-center text-brand-muted text-sm font-bold">
                          {(official.official_name || '').split(' ').map(function (n: string) { return n[0] }).join('').slice(0, 2)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-brand-text text-sm truncate">{official.official_name}</h3>
                        <p className="text-xs text-brand-muted truncate">{official.title}</p>
                        {official.party && (
                          <span className="text-[10px] font-mono text-brand-muted-light">{official.party}</span>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {/* Policies */}
          {policies.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-bold text-brand-text mb-4 flex items-center gap-2">
                <Scale size={20} style={{ color: '#C75B2A' }} />
                Related Policies
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {policies.slice(0, 6).map(function (p: any) {
                  return (
                    <Link
                      key={p.policy_id}
                      href={'/policies/' + p.policy_id}
                      className="bg-white border border-brand-border p-4 hover:border-ink transition-shadow"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {p.level && <span className="text-xs px-2 py-0.5 bg-brand-bg text-brand-muted">{p.level}</span>}
                        {p.status && <span className="text-xs text-brand-muted">{p.status}</span>}
                      </div>
                      <h3 className="font-semibold text-brand-text text-sm line-clamp-2">{p.title_6th_grade || p.policy_name}</h3>
                      {p.bill_number && <p className="text-xs font-mono text-brand-muted mt-1">{p.bill_number}</p>}
                    </Link>
                  )
                })}
              </div>
            </section>
          )}
        </div>

        {/* Right sidebar */}
        <div>
          <div className="sticky top-24 space-y-4">
            {/* Quick facts card */}
            <div className="border border-brand-border rounded-[0.75rem] bg-white overflow-hidden">
              <div className="h-1.5" style={{ backgroundColor: '#C75B2A' }} />
              <div className="p-5">
                <h3 className="font-display text-sm font-bold text-brand-text mb-3">About TIRZ Zones</h3>
                <p className="text-xs leading-relaxed text-brand-muted mb-3">
                  Tax Increment Reinvestment Zones are special districts created by Houston City Council.
                  Growth in property tax revenue within the zone is captured and reinvested locally.
                </p>
                <div className="space-y-2 text-xs">
                  <Link href="/tirz" className="flex items-center gap-2 text-brand-accent hover:underline font-medium">
                    View All TIRZ Zones &rarr;
                  </Link>
                  <Link href="/geography" className="flex items-center gap-2 text-brand-accent hover:underline font-medium">
                    Explore Geography &rarr;
                  </Link>
                  <Link href="/districts" className="flex items-center gap-2 text-brand-accent hover:underline font-medium">
                    District Types &rarr;
                  </Link>
                  <Link href="/governance" className="flex items-center gap-2 text-brand-accent hover:underline font-medium">
                    Governance Overview &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
