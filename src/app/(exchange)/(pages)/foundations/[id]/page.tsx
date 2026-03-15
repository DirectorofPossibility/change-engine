import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Phone, Mail, Globe, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getWayfinderContext } from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'
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
  const { data } = await supabase.from('foundations').select('name, mission').eq('id', id).single()
  if (!data) return { title: 'Not Found' }
  return { title: data.name, description: data.mission || 'Foundation details.' }
}

export default async function FoundationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: f } = await supabase.from('foundations').select('*').eq('id', id).single()
  if (!f) notFound()

  const { data: people } = await supabase
    .from('foundation_people')
    .select('person_name, role, title')
    .eq('foundation_id', id)
    .limit(20)

  const userProfile = await getUserProfile()

  const [focusJunctionsResult, wayfinderData] = await Promise.all([
    supabase.from('foundation_focus_areas').select('focus_id').eq('foundation_id', id),
    getWayfinderContext('foundation', id, userProfile?.role),
  ])

  const focusIds = (focusJunctionsResult.data || []).map((j: any) => j.focus_id)
  let focusAreas: Array<{ focus_id: string; focus_area_name: string }> = []
  if (focusIds.length > 0) {
    const { data } = await supabase.from('focus_areas').select('focus_id, focus_area_name').in('focus_id', focusIds)
    focusAreas = data || []
  }

  const eyebrowParts = [f.type, f.geo_level].filter(Boolean)
  const themeColor = '#1b5e8a'
  const heroText = f.mission || ''

  return (
    <>
      <SpiralTracker action="view_foundation" />

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
          {/* Breadcrumb + type in one line */}
          <nav className="text-xs uppercase tracking-wider text-white/60 mb-4 flex items-center gap-2">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>&rsaquo;</span>
            <Link href="/foundations" className="hover:text-white transition-colors">Foundations</Link>
            {eyebrowParts.length > 0 && (
              <>
                <span>&rsaquo;</span>
                <span className="text-white/40">{eyebrowParts.join(' / ')}</span>
              </>
            )}
          </nav>

          {/* Title */}
          <h1
            className="font-display font-black text-white leading-[1.1] tracking-[-0.02em] mb-4"
            style={{ fontSize: 'clamp(26px, 3.5vw, 40px)' }}
          >
            {f.name}
          </h1>

          {/* Mission */}
          {heroText && (
            <p className="text-white/90 leading-relaxed mb-5 max-w-[560px]" style={{ fontSize: '1.1rem' }}>
              {heroText.length > 200 ? heroText.slice(0, 200) + '...' : heroText}
            </p>
          )}

          {/* Bookmark + meta inline */}
          <div className="flex items-center gap-4">
            <BookmarkButton
              contentType="foundation"
              contentId={id}
              title={f.name}
            />
            <span className="text-xs text-white/40">
              {[f.assets ? `Assets: ${f.assets}` : null, f.annual_giving ? `Annual Giving: ${f.annual_giving}` : null, f.founded_year ? `Est. ${f.founded_year}` : null].filter(Boolean).join(' \u00b7 ')}
            </span>
          </div>

          {/* Contact links — absorbed into hero */}
          <div className="flex flex-wrap items-center gap-3 mt-4">
            {f.website_url && (
              <a href={f.website_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-xs transition-colors">
                <Globe size={12} /> Website
              </a>
            )}
            {f.phone && (
              <a href={'tel:' + f.phone} className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-xs transition-colors">
                <Phone size={12} /> {f.phone}
              </a>
            )}
            {f.email && (
              <a href={'mailto:' + f.email} className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-xs transition-colors">
                <Mail size={12} /> {f.email}
              </a>
            )}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          TWO-COLUMN LAYOUT — Content + Wayfinder Sidebar
         ══════════════════════════════════════════════════════════════════ */}
      <section className="bg-white">
        <div className="max-w-[1200px] mx-auto px-6 py-8 sm:py-10">
          <div className="flex flex-col lg:flex-row gap-10">

            {/* ── LEFT: Main Content ── */}
            <div className="flex-1 min-w-0">

              {/* Focus Areas */}
              {focusAreas.length > 0 && (
                <section className="mb-8">
                  <div className="flex items-baseline justify-between">
                    <h2 className="font-display text-xl font-bold" style={{ color: INK }}>Focus Areas</h2>
                    <span className="font-mono text-[0.6rem] uppercase tracking-wider" style={{ color: DIM }}>{focusAreas.length}</span>
                  </div>
                  <div className="h-[3px] mb-3" style={{ background: `${themeColor}30` }} />
                  <div className="flex flex-wrap gap-2">
                    {focusAreas.map(function (fa) {
                      return (
                        <Link
                          key={fa.focus_id}
                          href={'/explore/focus/' + fa.focus_id}
                          className="text-sm px-3 py-1 rounded-full hover:opacity-80 transition-opacity"
                          style={{ border: `1px solid ${RULE}`, color: INK }}
                        >
                          {fa.focus_area_name}
                        </Link>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* People */}
              {people && people.length > 0 && (
                <section className="mb-8">
                  <div className="flex items-baseline justify-between">
                    <h2 className="font-display text-xl font-bold" style={{ color: INK }}>People</h2>
                    <span className="font-mono text-[0.6rem] uppercase tracking-wider" style={{ color: DIM }}>{people.length}</span>
                  </div>
                  <div className="h-[3px] mb-3" style={{ background: `${themeColor}30` }} />
                  <div className="space-y-1">
                    {people.slice(0, 4).map(function (p: any, i: number) {
                      return (
                        <div key={i} className="flex items-baseline gap-2 py-2" style={{ borderBottom: `3px solid ${RULE}` }}>
                          <span className="mt-1.5 flex-shrink-0 inline-block w-1.5 h-1.5 rounded-full" style={{ background: themeColor }} />
                          <span className="text-[0.9rem] font-semibold" style={{ color: INK }}>{p.person_name}</span>
                          {(p.role || p.title) && (
                            <span className="text-sm" style={{ color: DIM }}>{p.title || p.role}</span>
                          )}
                        </div>
                      )
                    })}
                    {people.length > 4 && (
                      <details className="mt-2">
                        <summary className="italic text-sm cursor-pointer" style={{ color: themeColor }}>
                          {people.length - 4} more people
                        </summary>
                        <div className="space-y-1 mt-1">
                          {people.slice(4).map(function (p: any, i: number) {
                            return (
                              <div key={i + 4} className="flex items-baseline gap-2 py-2" style={{ borderBottom: `3px solid ${RULE}` }}>
                                <span className="mt-1.5 flex-shrink-0 inline-block w-1.5 h-1.5 rounded-full" style={{ background: themeColor }} />
                                <span className="text-[0.9rem] font-semibold" style={{ color: INK }}>{p.person_name}</span>
                                {(p.role || p.title) && (
                                  <span className="text-sm" style={{ color: DIM }}>{p.title || p.role}</span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </details>
                    )}
                  </div>
                </section>
              )}

              {/* Empty state */}
              {focusAreas.length === 0 && (!people || people.length === 0) && (
                <div className="text-center py-12" style={{ border: `1px dashed ${RULE}` }}>
                  <p style={{ color: DIM }}>No focus areas or people have been linked to this foundation yet.</p>
                </div>
              )}

              {/* Sidebar extras — below main content on mobile */}
              <div className="lg:hidden space-y-6 mt-8 pt-8" style={{ borderTop: `3px solid ${RULE}` }}>
                <FeaturedPromo variant="card" />
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                RIGHT: WAYFINDER SIDEBAR
               ══════════════════════════════════════════════════════════════════ */}
            <aside className="w-full lg:w-[340px] flex-shrink-0">
              <div className="lg:sticky lg:top-4 space-y-4">
                <DetailWayfinder
                  data={wayfinderData}
                  currentType="foundation"
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
            href="/foundations"
            className="inline-flex items-center gap-2 transition-colors hover:text-[#1b5e8a]"
            style={{ fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: DIM }}
          >
            <ArrowRight size={14} className="rotate-180" /> Back to Foundations
          </Link>
        </div>
      </section>
    </>
  )
}
