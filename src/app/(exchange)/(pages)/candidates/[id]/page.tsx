import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/roles'
import { User, Globe, Mail, Phone, ArrowRight } from 'lucide-react'
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
  const { data } = await supabase.from('candidates').select('candidate_name, office_sought').eq('candidate_id', id).single()
  if (!data) return { title: 'Not Found' }
  return { title: `${data.candidate_name} — ${data.office_sought}`, description: `Candidate for ${data.office_sought}.` }
}

export default async function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const [{ data: c }, userProfile] = await Promise.all([
    supabase.from('candidates').select('*').eq('candidate_id', id).single(),
    getUserProfile(),
  ])
  if (!c) notFound()

  const canonicalUrl = `https://www.changeengine.us/candidates/${id}`
  const themeColor = '#1b5e8a'
  const heroText = c.bio_summary || ''
  const truncatedHero = heroText.length > 200 ? heroText.slice(0, 200) + '...' : heroText
  const showAbout = heroText.length > 200

  return (
    <>
      <SpiralTracker action="view_candidate" />

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
          <div className="flex flex-col lg:flex-row gap-8 items-center">
            <div className="flex-1 min-w-0">
              {/* Breadcrumb + type in one line */}
              <nav className="text-xs uppercase tracking-wider text-white/60 mb-4 flex items-center gap-2">
                <Link href="/" className="hover:text-white transition-colors">Home</Link>
                <span>&rsaquo;</span>
                <Link href="/candidates" className="hover:text-white transition-colors">Candidates</Link>
                <span>&rsaquo;</span>
                <span className="text-white/40">{c.party || 'Candidate'}</span>
                {c.incumbent === 'true' && (
                  <>
                    <span>&rsaquo;</span>
                    <span className="text-white/40">Incumbent</span>
                  </>
                )}
              </nav>

              {/* Title */}
              <h1
                className="font-display font-black text-white leading-[1.1] tracking-[-0.02em] mb-4"
                style={{ fontSize: 'clamp(26px, 3.5vw, 40px)' }}
              >
                {c.candidate_name}
              </h1>

              {/* Office + District subtitle */}
              <p className="text-white/90 leading-relaxed mb-5 max-w-[560px]" style={{ fontSize: '1.1rem' }}>
                {c.office_sought}{c.district ? ` — ${c.district}` : ''}
              </p>

              {/* Bio preview */}
              {truncatedHero && (
                <p className="text-white/90 leading-relaxed mb-5 max-w-[560px]" style={{ fontSize: '0.95rem' }}>
                  {truncatedHero}
                </p>
              )}

              {/* Bookmark + meta inline */}
              <div className="flex items-center gap-4">
                <BookmarkButton
                  contentType="candidate"
                  contentId={id}
                  title={c.candidate_name}
                  imageUrl={c.photo_url}
                />
                <span className="text-xs text-white/40">
                  {[c.party, c.district].filter(Boolean).join(' \u00b7 ')}
                </span>
              </div>

              {/* Contact links in hero */}
              <div className="flex flex-wrap items-center gap-3 mt-4">
                {c.campaign_website && (
                  <a href={c.campaign_website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-xs transition-colors">
                    <Globe size={12} /> Campaign website
                  </a>
                )}
                {c.campaign_email && (
                  <a href={`mailto:${c.campaign_email}`} className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-xs transition-colors">
                    <Mail size={12} /> {c.campaign_email}
                  </a>
                )}
                {c.campaign_phone && (
                  <span className="inline-flex items-center gap-1.5 text-white/80 text-xs">
                    <Phone size={12} /> {c.campaign_phone}
                  </span>
                )}
              </div>

              {/* Meta strip — fundraising */}
              {c.fundraising_total && (
                <div className="text-[0.7rem] uppercase tracking-[0.1em] text-white/60 flex items-center gap-x-3 mt-3">
                  <span>Fundraising: {c.fundraising_total}</span>
                </div>
              )}
            </div>

            {/* Hero photo */}
            {c.photo_url ? (
              <div className="w-full lg:w-[300px] flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl border-[3px] border-white/30 bg-white/10 flex items-center justify-center">
                <Image
                  src={c.photo_url}
                  alt={c.candidate_name}
                  className="max-w-full max-h-[300px] w-auto h-auto object-cover"
                  width={300}
                  height={300}
                />
              </div>
            ) : (
              <div className="w-full lg:w-[300px] flex-shrink-0 rounded-2xl overflow-hidden border-[3px] border-white/30 bg-white/10 flex items-center justify-center py-16">
                <User className="w-20 h-20 text-white/40" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          TWO-COLUMN LAYOUT — Content + Sidebar
         ══════════════════════════════════════════════════════════════════ */}
      <section className="bg-white">
        <div className="max-w-[1200px] mx-auto px-6 py-8 sm:py-10">
          <div className="flex flex-col lg:flex-row gap-10">

            {/* ── LEFT: Main Content ── */}
            <div className="flex-1 min-w-0">

              {/* About — full bio when truncated in hero */}
              {showAbout && (
                <section className="mb-8">
                  <h2 className="font-display text-xl font-bold mb-2" style={{ color: INK }}>About</h2>
                  <div className="h-px mb-3" style={{ background: `${themeColor}30` }} />
                  <p className="text-[0.95rem] leading-relaxed" style={{ color: DIM }}>{c.bio_summary}</p>
                </section>
              )}

              {/* Positions & Endorsements */}
              {(c.policy_positions || c.endorsements) && (
                <section className="mb-8">
                  <h2 className="font-display text-xl font-bold mb-2" style={{ color: INK }}>Positions & Endorsements</h2>
                  <div className="h-px mb-3" style={{ background: `${themeColor}30` }} />
                  {c.policy_positions && (
                    <p className="text-[0.95rem] leading-relaxed" style={{ color: DIM }}>{c.policy_positions}</p>
                  )}
                  {c.endorsements && (
                    <p className="text-[0.95rem] leading-relaxed mt-3" style={{ color: DIM }}>{c.endorsements}</p>
                  )}
                </section>
              )}

              {/* Sidebar extras — below main content on mobile */}
              <div className="lg:hidden space-y-6 mt-8 pt-8" style={{ borderTop: `1px solid ${RULE}` }}>
                <FeaturedPromo variant="card" />
              </div>
            </div>

            {/* ── RIGHT: SIDEBAR ── */}
            <aside className="w-full lg:w-[340px] flex-shrink-0">
              <div className="lg:sticky lg:top-4 space-y-4">
                <div className="hidden lg:block space-y-4">
                  <FeaturedPromo variant="card" />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ── FOOTER CODA ── */}
      <section style={{ background: SIDEBAR_BG, borderTop: `1px solid ${RULE}` }}>
        <div className="max-w-[820px] mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <Link
            href="/candidates"
            className="inline-flex items-center gap-2 transition-colors hover:text-[#1b5e8a]"
            style={{ fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: DIM }}
          >
            <ArrowRight size={14} className="rotate-180" /> Back to Candidates
          </Link>
        </div>
      </section>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: c.candidate_name,
            url: canonicalUrl,
          }),
        }}
      />
    </>
  )
}
