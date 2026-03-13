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

// ── Design tokens ─────────────────────────────────────────────────────

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

export default async function TirzDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [zone, officials, policies] = await Promise.all([
    getTirzZone(id),
    getOfficialsForTirz(id),
    getPoliciesForTirz(id),
  ])

  if (!zone) notFound()

  return (
    <div style={{ background: PARCHMENT }} className="min-h-screen">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden" style={{ background: PARCHMENT_WARM }}>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="relative max-w-[900px] mx-auto px-6 py-16">
          <p style={{ fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.2em', color: MUTED }} className="uppercase mb-4">
            Change Engine -- TIRZ Zones
          </p>
          <div className="flex items-center gap-3 mb-3">
            <span
              className="w-12 h-12 flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
              style={{ fontFamily: MONO, backgroundColor: CLAY }}
            >
              {zone.site_number}
            </span>
            <p style={{ fontFamily: MONO, fontSize: '0.6rem', color: MUTED }}>TIRZ-{zone.site_number}</p>
          </div>
          <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(2rem, 4vw, 2.8rem)', color: INK, lineHeight: 1.1 }}>
            {zone.name}
          </h1>
          {zone.description && (
            <p style={{ fontFamily: SERIF, fontSize: '1.05rem', color: MUTED, lineHeight: 1.7 }} className="mt-4 max-w-xl">
              {zone.description}
            </p>
          )}
        </div>
      </div>

      {/* ── Breadcrumb ── */}
      <div className="max-w-[900px] mx-auto px-6 pt-6 pb-2">
        <nav style={{ fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.12em', color: MUTED }} className="uppercase">
          <Link href="/" className="hover:underline" style={{ color: CLAY }}>Home</Link>
          <span className="mx-2">/</span>
          <Link href="/tirz" className="hover:underline" style={{ color: CLAY }}>TIRZ Zones</Link>
          <span className="mx-2">/</span>
          <span>{zone.name}</span>
        </nav>
      </div>

      <div className="max-w-[900px] mx-auto px-6 py-10">
        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 mb-10" style={{ border: '1px solid ' + RULE_COLOR }}>
          <div className="p-4 text-center" style={{ borderRight: '1px solid ' + RULE_COLOR }}>
            <div style={{ fontFamily: SERIF, fontSize: '1.25rem', color: INK, fontWeight: 700 }}>TIRZ-{zone.site_number}</div>
            <div style={{ fontFamily: MONO, fontSize: '0.55rem', color: MUTED, letterSpacing: '0.1em' }} className="uppercase mt-1">Zone Number</div>
          </div>
          {zone.status && (
            <div className="p-4 text-center" style={{ borderRight: '1px solid ' + RULE_COLOR }}>
              <div style={{ fontFamily: SERIF, fontSize: '1.25rem', color: INK, fontWeight: 700, textTransform: 'capitalize' }}>{zone.status}</div>
              <div style={{ fontFamily: MONO, fontSize: '0.55rem', color: MUTED, letterSpacing: '0.1em' }} className="uppercase mt-1">Status</div>
            </div>
          )}
          {zone.year_established && (
            <div className="p-4 text-center" style={{ borderRight: '1px solid ' + RULE_COLOR }}>
              <div style={{ fontFamily: SERIF, fontSize: '1.25rem', color: INK, fontWeight: 700 }}>{zone.year_established}</div>
              <div style={{ fontFamily: MONO, fontSize: '0.55rem', color: MUTED, letterSpacing: '0.1em' }} className="uppercase mt-1">Established</div>
            </div>
          )}
          {zone.managing_entity && (
            <div className="p-4 text-center">
              <div style={{ fontFamily: SERIF, fontSize: '0.9rem', color: INK, fontWeight: 700 }} className="truncate">{zone.managing_entity}</div>
              <div style={{ fontFamily: MONO, fontSize: '0.55rem', color: MUTED, letterSpacing: '0.1em' }} className="uppercase mt-1">Managed By</div>
            </div>
          )}
        </div>

        {/* ── Website ── */}
        {zone.website && (
          <div className="mb-8">
            <a
              href={zone.website}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontFamily: MONO, fontSize: '0.7rem', letterSpacing: '0.08em', color: CLAY }}
              className="uppercase hover:underline"
            >
              Visit TIRZ Website
            </a>
          </div>
        )}

        {/* ── Map ── */}
        <section className="mb-10">
          <div className="flex items-baseline gap-4 mb-4">
            <h2 style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK }}>Zone Boundary</h2>
            <div className="flex-1" style={{ height: 1, borderBottom: '1px dotted', borderColor: RULE_COLOR }} />
          </div>
          <div style={{ border: '1px solid ' + RULE_COLOR }}>
            <TirzDetailMap siteNumber={zone.site_number} />
          </div>
        </section>

        {/* ── Council Districts ── */}
        {zone.council_districts && (
          <div className="p-4 mb-8" style={{ background: PARCHMENT_WARM, border: '1px solid ' + RULE_COLOR }}>
            <p style={{ fontFamily: SERIF, fontSize: '0.9rem', color: INK }}>
              Overlapping Council Districts: <strong>{zone.council_districts}</strong> --{' '}
              <Link href="/officials" className="hover:underline" style={{ color: CLAY, fontWeight: 600 }}>
                View Officials
              </Link>
            </p>
          </div>
        )}

        {/* ── ZIP Codes ── */}
        {zone.zip_codes && (
          <div className="p-4 mb-8" style={{ border: '1px solid ' + RULE_COLOR }}>
            <p style={{ fontFamily: SERIF, fontSize: '0.9rem', color: INK }}>
              ZIP Codes: <strong>{zone.zip_codes}</strong> --{' '}
              <Link href="/officials/lookup" className="hover:underline" style={{ color: CLAY, fontWeight: 600 }}>
                Who represents this area?
              </Link>
            </p>
          </div>
        )}

        {/* ── Officials ── */}
        {officials.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline gap-4 mb-6">
              <h2 style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK }}>Officials Connected to This Zone</h2>
              <div className="flex-1" style={{ height: 1, borderBottom: '1px dotted', borderColor: RULE_COLOR }} />
              <span style={{ fontFamily: MONO, fontSize: '0.6rem', color: MUTED, letterSpacing: '0.1em' }} className="uppercase">{officials.length} officials</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0" style={{ border: '1px solid ' + RULE_COLOR }}>
              {officials.slice(0, 8).map(function (official: any) {
                return (
                  <Link
                    key={official.official_id}
                    href={'/officials/' + official.official_id}
                    className="group flex items-center gap-3 p-4 transition-colors hover:bg-white/50"
                    style={{ borderRight: '1px solid ' + RULE_COLOR, borderBottom: '1px solid ' + RULE_COLOR }}
                  >
                    {official.photo_url ? (
                      <Image
                        src={official.photo_url}
                        alt={official.official_name}
                        className="w-12 h-12 object-cover flex-shrink-0"
                        style={{ border: '1px solid ' + RULE_COLOR }}
                        width={48}
                        height={48}
                      />
                    ) : (
                      <div
                        className="w-12 h-12 flex items-center justify-center flex-shrink-0"
                        style={{ background: PARCHMENT_WARM, fontFamily: MONO, fontSize: '0.75rem', color: MUTED, border: '1px solid ' + RULE_COLOR }}
                      >
                        {(official.official_name || '').split(' ').map(function (n: string) { return n[0] }).join('').slice(0, 2)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 style={{ fontFamily: SERIF, fontSize: '0.9rem', color: INK }} className="truncate group-hover:underline">{official.official_name}</h3>
                      <p style={{ fontFamily: MONO, fontSize: '0.6rem', color: MUTED }} className="truncate">{official.title}</p>
                      {official.party && (
                        <span style={{ fontFamily: MONO, fontSize: '0.55rem', color: MUTED }}>{official.party}</span>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Policies ── */}
        {policies.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline gap-4 mb-6">
              <h2 style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK }}>Related Policies</h2>
              <div className="flex-1" style={{ height: 1, borderBottom: '1px dotted', borderColor: RULE_COLOR }} />
              <span style={{ fontFamily: MONO, fontSize: '0.6rem', color: MUTED, letterSpacing: '0.1em' }} className="uppercase">{policies.length} policies</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0" style={{ border: '1px solid ' + RULE_COLOR }}>
              {policies.slice(0, 6).map(function (p: any) {
                return (
                  <Link
                    key={p.policy_id}
                    href={'/policies/' + p.policy_id}
                    className="group block p-4 transition-colors hover:bg-white/50"
                    style={{ borderRight: '1px solid ' + RULE_COLOR, borderBottom: '1px solid ' + RULE_COLOR }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {p.level && (
                        <span style={{ fontFamily: MONO, fontSize: '0.55rem', letterSpacing: '0.1em', color: MUTED, border: '1px solid ' + RULE_COLOR, padding: '2px 6px' }} className="uppercase">
                          {p.level}
                        </span>
                      )}
                      {p.status && <span style={{ fontFamily: MONO, fontSize: '0.55rem', color: MUTED }} className="uppercase">{p.status}</span>}
                    </div>
                    <h3 style={{ fontFamily: SERIF, fontSize: '0.9rem', color: INK, fontWeight: 700, lineHeight: 1.3 }} className="line-clamp-2 group-hover:underline">
                      {p.title_6th_grade || p.policy_name}
                    </h3>
                    {p.bill_number && <p style={{ fontFamily: MONO, fontSize: '0.6rem', color: MUTED, marginTop: '0.25rem' }}>{p.bill_number}</p>}
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        <div className="my-10" style={{ height: 1, background: RULE_COLOR }} />

        {/* ── Sidebar info ── */}
        <section className="mb-10 p-6" style={{ border: '1px solid ' + RULE_COLOR }}>
          <h3 style={{ fontFamily: SERIF, fontSize: '1.1rem', color: INK, fontWeight: 700 }} className="mb-3">About TIRZ Zones</h3>
          <p style={{ fontFamily: SERIF, fontSize: '0.85rem', color: MUTED, lineHeight: 1.6 }} className="mb-4">
            Tax Increment Reinvestment Zones are special districts created by Houston City Council.
            Growth in property tax revenue within the zone is captured and reinvested locally.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/tirz" style={{ fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.08em', color: CLAY }} className="uppercase hover:underline">
              View All TIRZ Zones
            </Link>
            <Link href="/geography" style={{ fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.08em', color: CLAY }} className="uppercase hover:underline">
              Explore Geography
            </Link>
            <Link href="/districts" style={{ fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.08em', color: CLAY }} className="uppercase hover:underline">
              District Types
            </Link>
            <Link href="/governance" style={{ fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.08em', color: CLAY }} className="uppercase hover:underline">
              Governance Overview
            </Link>
          </div>
        </section>

        {/* ── Footer link ── */}
        <div className="text-center py-4">
          <Link href="/tirz" style={{ fontFamily: MONO, fontSize: '0.7rem', color: CLAY, letterSpacing: '0.1em' }} className="uppercase hover:underline">
            Back to TIRZ Zones
          </Link>
        </div>
      </div>
    </div>
  )
}
