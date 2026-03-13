import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getTirzZone, getOfficialsForTirz, getPoliciesForTirz } from '@/lib/data/exchange'
import { TirzDetailMap } from './TirzDetailMap'

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
    <div className="bg-paper min-h-screen">
      {/* Hero */}
      <div className="bg-paper relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="max-w-[900px] mx-auto px-6 py-16 relative z-10">
          <p style={{ fontSize: '0.7rem', letterSpacing: '0.15em', color: "#5c6474", textTransform: 'uppercase' }}>
            The Change Engine
          </p>
          <div className="flex items-center gap-3 mt-3 mb-3">
            <span
              className="w-12 h-12 flex items-center justify-center text-white flex-shrink-0"
              style={{ fontSize: '1.1rem', fontWeight: 700, backgroundColor: '#1b5e8a' }}
            >
              {zone.site_number}
            </span>
            <p style={{ fontSize: '0.65rem', color: "#5c6474" }}>TIRZ-{zone.site_number}</p>
          </div>
          <h1 style={{ fontSize: '2.2rem', lineHeight: 1.15 }}>
            {zone.name}
          </h1>
          {zone.description && (
            <p style={{ fontSize: '1rem', color: "#5c6474", marginTop: '0.75rem', maxWidth: '38rem', lineHeight: 1.7 }}>
              {zone.description}
            </p>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontSize: '0.7rem', color: "#5c6474" }}>
          <Link href="/" className="hover:underline" style={{ color: "#1b5e8a" }}>Home</Link>
          <span className="mx-2">/</span>
          <Link href="/tirz" className="hover:underline" style={{ color: "#1b5e8a" }}>TIRZ Zones</Link>
          <span className="mx-2">/</span>
          <span>{zone.name}</span>
        </nav>
      </div>

      <div className="max-w-[900px] mx-auto px-6 py-8">
        {/* Stats */}
        <section className="mb-10">
          <div className="flex items-baseline justify-between mb-1">
            <h2 style={{ fontSize: '1.5rem',  }}>Zone Details</h2>
          </div>
          <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
          <div className="flex flex-wrap gap-8">
            <div>
              <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>TIRZ-{zone.site_number}</span>
              <span style={{ fontSize: '0.6875rem', color: "#5c6474", letterSpacing: '0.1em', marginLeft: '0.5rem', textTransform: 'uppercase' }}>Zone Number</span>
            </div>
            {zone.status && (
              <div>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, textTransform: 'capitalize' }}>{zone.status}</span>
                <span style={{ fontSize: '0.6875rem', color: "#5c6474", letterSpacing: '0.1em', marginLeft: '0.5rem', textTransform: 'uppercase' }}>Status</span>
              </div>
            )}
            {zone.year_established && (
              <div>
                <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{zone.year_established}</span>
                <span style={{ fontSize: '0.6875rem', color: "#5c6474", letterSpacing: '0.1em', marginLeft: '0.5rem', textTransform: 'uppercase' }}>Established</span>
              </div>
            )}
            {zone.managing_entity && (
              <div>
                <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>{zone.managing_entity}</span>
                <span style={{ fontSize: '0.6875rem', color: "#5c6474", letterSpacing: '0.1em', marginLeft: '0.5rem', textTransform: 'uppercase' }}>Managed By</span>
              </div>
            )}
          </div>
        </section>

        {/* Website */}
        {zone.website && (
          <div className="mb-8">
            <a
              href={zone.website}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '0.9rem', color: "#1b5e8a" }}
              className="hover:underline"
            >
              Visit TIRZ Website
            </a>
          </div>
        )}

        {/* Map */}
        <section className="mb-10">
          <div className="flex items-baseline justify-between mb-1">
            <h2 style={{ fontSize: '1.5rem',  }}>Zone Boundary</h2>
          </div>
          <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
          <div style={{ border: '1px solid #dde1e8' }}>
            <TirzDetailMap siteNumber={zone.site_number} />
          </div>
        </section>

        {/* Council Districts */}
        {zone.council_districts && (
          <div className="p-4 mb-8" style={{ background: "#f4f5f7", border: '1px solid #dde1e8' }}>
            <p style={{ fontSize: '0.9rem',  }}>
              Overlapping Council Districts: <strong>{zone.council_districts}</strong> --{' '}
              <Link href="/officials" className="hover:underline" style={{ color: "#1b5e8a", fontWeight: 600 }}>
                View Officials
              </Link>
            </p>
          </div>
        )}

        {/* ZIP Codes */}
        {zone.zip_codes && (
          <div className="p-4 mb-8" style={{ border: '1px solid #dde1e8' }}>
            <p style={{ fontSize: '0.9rem',  }}>
              ZIP Codes: <strong>{zone.zip_codes}</strong> --{' '}
              <Link href="/officials/lookup" className="hover:underline" style={{ color: "#1b5e8a", fontWeight: 600 }}>
                Who represents this area?
              </Link>
            </p>
          </div>
        )}

        {/* Officials */}
        {officials.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontSize: '1.5rem',  }}>Officials Connected to This Zone</h2>
              <span style={{ fontSize: '0.7rem', color: "#5c6474" }}>{officials.length} officials</span>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
            <div className="space-y-0">
              {officials.slice(0, 8).map(function (official: any) {
                return (
                  <Link
                    key={official.official_id}
                    href={'/officials/' + official.official_id}
                    className="group flex items-center gap-3"
                    style={{ borderBottom: '1px dotted ' + '#dde1e8', paddingBottom: '0.75rem', paddingTop: '0.75rem' }}
                  >
                    {official.photo_url ? (
                      <Image
                        src={official.photo_url}
                        alt={official.official_name}
                        className="w-12 h-12 object-cover flex-shrink-0"
                        style={{ border: '1px solid #dde1e8' }}
                        width={48}
                        height={48}
                      />
                    ) : (
                      <div
                        className="w-12 h-12 flex items-center justify-center flex-shrink-0"
                        style={{ background: "#f4f5f7", fontSize: '0.75rem', color: "#5c6474", border: '1px solid #dde1e8' }}
                      >
                        {(official.official_name || '').split(' ').map(function (n: string) { return n[0] }).join('').slice(0, 2)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 style={{ fontSize: '0.95rem',  }} className="truncate group-hover:underline">{official.official_name}</h3>
                      <p style={{ fontSize: '0.65rem', color: "#5c6474" }} className="truncate">{official.title}</p>
                      {official.party && (
                        <span style={{ fontSize: '0.6875rem', color: "#5c6474" }}>{official.party}</span>
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
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontSize: '1.5rem',  }}>Related Policies</h2>
              <span style={{ fontSize: '0.7rem', color: "#5c6474" }}>{policies.length} policies</span>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
            <div className="space-y-0">
              {policies.slice(0, 6).map(function (p: any) {
                return (
                  <Link
                    key={p.policy_id}
                    href={'/policies/' + p.policy_id}
                    className="block group"
                    style={{ borderBottom: '1px dotted ' + '#dde1e8', paddingBottom: '0.75rem', paddingTop: '0.75rem' }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {p.level && (
                        <span style={{ fontSize: '0.6875rem', letterSpacing: '0.1em', color: "#5c6474", border: '1px solid #dde1e8', padding: '2px 6px', textTransform: 'uppercase' }}>
                          {p.level}
                        </span>
                      )}
                      {p.status && <span style={{ fontSize: '0.6875rem', color: "#5c6474", textTransform: 'uppercase' }}>{p.status}</span>}
                    </div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, lineHeight: 1.3 }} className="line-clamp-2 group-hover:underline">
                      {p.title_6th_grade || p.policy_name}
                    </h3>
                    {p.bill_number && <p style={{ fontSize: '0.65rem', color: "#5c6474", marginTop: '0.25rem' }}>{p.bill_number}</p>}
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        <div className="my-10" style={{ height: 1, background: '#dde1e8' }} />

        {/* About TIRZ */}
        <section className="mb-10">
          <div className="flex items-baseline justify-between mb-1">
            <h2 style={{ fontSize: '1.25rem',  }}>About TIRZ Zones</h2>
          </div>
          <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
          <p style={{ fontSize: '0.9rem', color: "#5c6474", lineHeight: 1.7, marginBottom: '1rem' }}>
            Tax Increment Reinvestment Zones are special districts created by Houston City Council.
            Growth in property tax revenue within the zone is captured and reinvested locally.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/tirz" style={{ fontSize: '0.85rem', color: "#1b5e8a" }} className="hover:underline">
              View All TIRZ Zones
            </Link>
            <Link href="/geography" style={{ fontSize: '0.85rem', color: "#1b5e8a" }} className="hover:underline">
              Explore Geography
            </Link>
            <Link href="/districts" style={{ fontSize: '0.85rem', color: "#1b5e8a" }} className="hover:underline">
              District Types
            </Link>
            <Link href="/governance" style={{ fontSize: '0.85rem', color: "#1b5e8a" }} className="hover:underline">
              Governance Overview
            </Link>
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="my-10 max-w-[900px] mx-auto px-6" style={{ height: 1, background: '#dde1e8' }} />
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <Link href="/tirz" style={{ fontStyle: 'italic', color: "#1b5e8a", fontSize: '0.95rem' }} className="hover:underline">
          Back to TIRZ Zones
        </Link>
      </div>
    </div>
  )
}
