import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getWayfinderContext } from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'
import { Phone, Globe, MapPin, ArrowRight } from 'lucide-react'
import { DetailWayfinder } from '@/components/exchange/DetailWayfinder'
import { BookmarkButton } from '@/components/exchange/BookmarkButton'
import { FlowerOfLife } from '@/components/geo/sacred'
import { FeaturedPromo } from '@/components/exchange/FeaturedPromo'
import { SpiralTracker } from '@/components/exchange/SpiralTracker'

/* ── Design Tokens ── */
const RULE = '#dde1e8'
const DIM = '#5c6474'
const INK = '#0d1117'
const SIDEBAR_BG = '#f4f5f7'

export const revalidate = 300


export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('agencies').select('agency_name, description_5th_grade').eq('agency_id', id).single()
  if (!data) return { title: 'Not Found' }
  return { title: data.agency_name, description: data.description_5th_grade || 'Government agency details.' }
}

export default async function AgencyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: agency } = await supabase.from('agencies').select('*').eq('agency_id', id).single()
  if (!agency) notFound()

  const userProfile = await getUserProfile()

  // municipal_services has no agency_id column — query via agency's service_ids if available
  const agencyAny = agency as any
  let services: any[] = []
  if (agencyAny.service_ids && Array.isArray(agencyAny.service_ids) && agencyAny.service_ids.length > 0) {
    const { data } = await supabase.from('municipal_services').select('id, service_name, service_type').in('id', agencyAny.service_ids).limit(10)
    services = data || []
  }

  const address = [agency.address, agency.city, agency.state, agency.zip_code].filter(Boolean).join(', ')

  const titleDisplay = agency.agency_acronym
    ? `${agency.agency_name} (${agency.agency_acronym})`
    : agency.agency_name

  const themeColor = '#1b5e8a'

  const wayfinderData = await getWayfinderContext('agency', id, userProfile?.role)

  const displayDesc = agency.description_5th_grade || ''

  return (
    <>
      <SpiralTracker action="view_agency" />

      {/* ══════════════════════════════════════════════════════════════════
          GRADIENT HERO
         ══════════════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}dd 40%, ${themeColor}55 100%)` }}
      >
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="absolute top-[-30%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-20%] left-[-5%] opacity-[0.06] pointer-events-none" aria-hidden="true">
          <FlowerOfLife color="#ffffff" size={400} />
        </div>
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'6\' height=\'6\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 6L6 0M-1 1L1-1M5 7L7 5\' stroke=\'%23fff\' stroke-width=\'.5\'/%3E%3C/svg%3E")', backgroundSize: '6px 6px' }} />
        <div className="absolute inset-0 bg-gradient-radial from-white/5 via-transparent to-transparent" />

        <div className="max-w-[1080px] mx-auto px-6 py-6 sm:py-10 relative z-10">
          <div className="flex-1 min-w-0">
            {/* Breadcrumb + type in one line */}
            <nav className="text-xs uppercase tracking-wider text-white/60 mb-4 flex items-center gap-2">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span>&rsaquo;</span>
              <Link href="/agencies" className="hover:text-white transition-colors">Agencies</Link>
              {agency.jurisdiction && (
                <>
                  <span>&rsaquo;</span>
                  <span className="text-white/40">{agency.jurisdiction}</span>
                </>
              )}
            </nav>

            {/* Title */}
            <h1
              className="font-display font-black text-white leading-[1.1] tracking-[-0.02em] mb-4"
              style={{ fontSize: 'clamp(26px, 3.5vw, 40px)' }}
            >
              {titleDisplay}
            </h1>

            {/* Description */}
            {displayDesc && (
              <p className="text-white/90 leading-relaxed mb-5 max-w-[560px]" style={{ fontSize: '1.05rem' }}>
                {displayDesc.length > 200 ? displayDesc.slice(0, 200) + '...' : displayDesc}
              </p>
            )}

            {/* Bookmark + meta inline */}
            <div className="flex items-center gap-4 mb-4">
              <BookmarkButton
                contentType="agency"
                contentId={agency.agency_id}
                title={agency.agency_name}
              />
              {address && (
                <span className="text-[0.7rem] uppercase tracking-[0.1em] text-white/40 inline-flex items-center gap-1">
                  <MapPin size={10} /> {address}
                </span>
              )}
            </div>

            {/* Contact links in hero */}
            <div className="flex flex-wrap items-center gap-3">
              {agency.phone && (
                <a
                  href={'tel:' + agency.phone}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-white text-xs font-mono uppercase tracking-wider font-semibold transition-colors hover:bg-white/20 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.15)' }}
                >
                  <Phone size={13} /> {agency.phone}
                </a>
              )}
              {agency.website && (
                <a
                  href={agency.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-white text-xs font-mono uppercase tracking-wider font-semibold transition-colors hover:bg-white/20 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.15)' }}
                >
                  <Globe size={13} /> Website
                </a>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          TWO-COLUMN LAYOUT
         ══════════════════════════════════════════════════════════════════ */}
      <section className="bg-white">
        <div className="max-w-[1200px] mx-auto px-6 py-8 sm:py-10">
          <div className="flex flex-col lg:flex-row gap-10">

            {/* ── LEFT: Main Content ── */}
            <div className="flex-1 min-w-0">

              {/* About — full description if hero was truncated */}
              {displayDesc && displayDesc.length > 200 && (
                <section className="mb-8">
                  <h2 className="font-display text-xl font-bold mb-2" style={{ color: INK }}>About</h2>
                  <div className="h-[3px] mb-3" style={{ background: `${themeColor}30` }} />
                  <p className="text-[0.95rem] leading-relaxed" style={{ color: DIM }}>{displayDesc}</p>
                </section>
              )}

              {/* Services Provided */}
              {services && services.length > 0 && (
                <section className="mb-8">
                  <div className="flex items-baseline justify-between">
                    <h2 className="font-display text-xl font-bold" style={{ color: INK }}>Services Provided</h2>
                    <span className="font-mono text-[0.6rem] uppercase tracking-wider" style={{ color: DIM }}>{services.length}</span>
                  </div>
                  <div className="h-[3px] mb-3" style={{ background: `${themeColor}30` }} />
                  <div className="space-y-0">
                    {services.map(function (s: any) {
                      return (
                        <Link
                          key={s.id}
                          href={`/municipal-services/${s.id}`}
                          className="flex items-start gap-3 py-2.5 hover:underline"
                          style={{ borderBottom: `3px solid ${RULE}` }}
                        >
                          <span className="mt-2 flex-shrink-0 inline-block w-1.5 h-1.5 rounded-full" style={{ background: themeColor }} />
                          <div className="min-w-0">
                            <span className="block font-semibold text-[0.9rem]" style={{ color: INK }}>{s.service_name}</span>
                            {s.service_type && (
                              <span className="block mt-0.5 text-sm" style={{ color: DIM }}>{s.service_type}</span>
                            )}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* Sidebar extras — below main content on mobile */}
              <div className="lg:hidden space-y-6 mt-8 pt-8" style={{ borderTop: `3px solid ${RULE}` }}>
                <FeaturedPromo variant="card" />
              </div>
            </div>

            {/* ── RIGHT: WAYFINDER SIDEBAR ── */}
            <aside className="w-full lg:w-[340px] flex-shrink-0">
              <div className="lg:sticky lg:top-4 space-y-4">
                <DetailWayfinder
                  data={wayfinderData}
                  currentType="agency"
                  currentId={id}
                  userRole={userProfile?.role ?? undefined}
                />

                <div className="hidden lg:block space-y-4">
                  <FeaturedPromo variant="card" />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ── FOOTER CODA ── */}
      <section style={{ background: SIDEBAR_BG, borderTop: `3px solid ${RULE}` }}>
        <div className="max-w-[820px] mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <Link
            href="/agencies"
            className="inline-flex items-center gap-2 transition-colors hover:text-[#1b5e8a]"
            style={{ fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: DIM }}
          >
            <ArrowRight size={14} className="rotate-180" /> Back to Agencies
          </Link>
        </div>
      </section>
    </>
  )
}
