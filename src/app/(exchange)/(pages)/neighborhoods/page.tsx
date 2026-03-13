import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Neighborhoods — Change Engine',
  description: 'Explore Houston neighborhoods and the resources, officials, and organizations that serve them.',
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

export default async function NeighborhoodsPage() {
  const supabase = await createClient()
  const { data: neighborhoods } = await supabase
    .from('neighborhoods')
    .select('neighborhood_id, neighborhood_name, super_neighborhood_id, zip_codes')
    .order('neighborhood_name')

  const { data: supers } = await supabase
    .from('super_neighborhoods')
    .select('sn_id, sn_name')
    .order('sn_name')

  const snMap: Record<string, string> = {}
  for (const sn of supers || []) { snMap[sn.sn_id] = sn.sn_name }

  const allNeighborhoods = neighborhoods || []
  const VISIBLE_COUNT = 12

  return (
    <div style={{ background: PARCHMENT }} className="min-h-screen">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden" style={{ background: PARCHMENT_WARM }}>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="relative max-w-[900px] mx-auto px-6 py-16">
          <p style={{ fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.2em', color: MUTED }} className="uppercase mb-4">
            Change Engine
          </p>
          <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(2rem, 4vw, 3rem)', color: INK, lineHeight: 1.1 }}>
            Houston Neighborhoods
          </h1>
          <p style={{ fontFamily: SERIF, fontSize: '1.1rem', color: MUTED, lineHeight: 1.7 }} className="mt-4 max-w-xl">
            Every corner of Houston, mapped and connected. Find the services, officials, organizations, and community resources near you.
          </p>
          <div className="flex flex-wrap gap-6 mt-6">
            <div>
              <span style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK, fontWeight: 700 }}>{allNeighborhoods.length}</span>
              <span style={{ fontFamily: MONO, fontSize: '0.6875rem', color: MUTED, letterSpacing: '0.1em', marginLeft: '0.5rem' }} className="uppercase">Neighborhoods</span>
            </div>
            <div>
              <span style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK, fontWeight: 700 }}>{(supers || []).length}</span>
              <span style={{ fontFamily: MONO, fontSize: '0.6875rem', color: MUTED, letterSpacing: '0.1em', marginLeft: '0.5rem' }} className="uppercase">Super Neighborhoods</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Breadcrumb ── */}
      <div className="max-w-[900px] mx-auto px-6 pt-6 pb-2">
        <nav style={{ fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.12em', color: MUTED }} className="uppercase">
          <Link href="/" className="hover:underline" style={{ color: CLAY }}>Home</Link>
          <span className="mx-2">/</span>
          <span>Neighborhoods</span>
        </nav>
      </div>

      <div className="max-w-[900px] mx-auto px-6 py-10">
        {/* Quick links */}
        <div className="flex gap-6 mb-8">
          <Link href="/super-neighborhoods" style={{ fontFamily: MONO, fontSize: '0.7rem', letterSpacing: '0.08em', color: CLAY }} className="uppercase hover:underline">
            View by Super Neighborhood
          </Link>
          <Link href="/geography" style={{ fontFamily: MONO, fontSize: '0.7rem', letterSpacing: '0.08em', color: CLAY }} className="uppercase hover:underline">
            View on Map
          </Link>
        </div>

        {/* ── Neighborhood grid ── */}
        <section>
          <div className="flex items-baseline gap-4 mb-6">
            <h2 style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK }}>All Neighborhoods</h2>
            <div className="flex-1" style={{ height: 1, borderBottom: '1px dotted', borderColor: RULE_COLOR }} />
            <span style={{ fontFamily: MONO, fontSize: '0.6875rem', color: MUTED, letterSpacing: '0.1em' }} className="uppercase">{allNeighborhoods.length} total</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0" style={{ border: '1px solid ' + RULE_COLOR }}>
            {allNeighborhoods.slice(0, VISIBLE_COUNT).map(function (n) {
              return (
                <Link
                  key={n.neighborhood_id}
                  href={'/neighborhoods/' + n.neighborhood_id}
                  className="group p-4 transition-colors hover:bg-white/50"
                  style={{ borderBottom: '1px solid ' + RULE_COLOR, borderRight: '1px solid ' + RULE_COLOR }}
                >
                  <div className="flex items-start gap-2">
                    <span className="w-1 h-full min-h-[1.5rem] flex-shrink-0" style={{ backgroundColor: '#4a2870' }} />
                    <div>
                      <h3 style={{ fontFamily: SERIF, fontSize: '0.9rem', color: INK }} className="group-hover:underline">{n.neighborhood_name}</h3>
                      {n.super_neighborhood_id && snMap[n.super_neighborhood_id] && (
                        <p style={{ fontFamily: MONO, fontSize: '0.6875rem', color: MUTED }} className="mt-0.5">{snMap[n.super_neighborhood_id]}</p>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {allNeighborhoods.length > VISIBLE_COUNT && (
            <details className="mt-4">
              <summary style={{ fontFamily: MONO, fontSize: '0.65rem', color: CLAY, letterSpacing: '0.1em', cursor: 'pointer' }} className="uppercase hover:underline py-2">
                Show all {allNeighborhoods.length} neighborhoods
              </summary>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 mt-2" style={{ border: '1px solid ' + RULE_COLOR }}>
                {allNeighborhoods.slice(VISIBLE_COUNT).map(function (n) {
                  return (
                    <Link
                      key={n.neighborhood_id}
                      href={'/neighborhoods/' + n.neighborhood_id}
                      className="group p-4 transition-colors hover:bg-white/50"
                      style={{ borderBottom: '1px solid ' + RULE_COLOR, borderRight: '1px solid ' + RULE_COLOR }}
                    >
                      <div className="flex items-start gap-2">
                        <span className="w-1 h-full min-h-[1.5rem] flex-shrink-0" style={{ backgroundColor: '#4a2870' }} />
                        <div>
                          <h3 style={{ fontFamily: SERIF, fontSize: '0.9rem', color: INK }} className="group-hover:underline">{n.neighborhood_name}</h3>
                          {n.super_neighborhood_id && snMap[n.super_neighborhood_id] && (
                            <p style={{ fontFamily: MONO, fontSize: '0.6875rem', color: MUTED }} className="mt-0.5">{snMap[n.super_neighborhood_id]}</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </details>
          )}
        </section>

        <div className="my-10" style={{ height: 1, background: RULE_COLOR }} />

        {/* ── Footer links ── */}
        <div className="flex flex-wrap gap-6 py-4">
          <Link href="/geography" style={{ fontFamily: MONO, fontSize: '0.7rem', color: CLAY, letterSpacing: '0.1em' }} className="uppercase hover:underline">
            Geography Map
          </Link>
          <Link href="/services" style={{ fontFamily: MONO, fontSize: '0.7rem', color: CLAY, letterSpacing: '0.1em' }} className="uppercase hover:underline">
            Services
          </Link>
          <Link href="/officials" style={{ fontFamily: MONO, fontSize: '0.7rem', color: CLAY, letterSpacing: '0.1em' }} className="uppercase hover:underline">
            Officials
          </Link>
          <Link href="/" style={{ fontFamily: MONO, fontSize: '0.7rem', color: CLAY, letterSpacing: '0.1em' }} className="uppercase hover:underline ml-auto">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
