import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { getNewsFeed } from '@/lib/data/content'
import { THEMES } from '@/lib/constants'
import { FolFallback } from '@/components/ui/FolFallback'
import {
  BookOpen, Newspaper, Compass, MessageCircle, Map,
  ArrowRight, FileText, Sparkles, Clock, ChevronRight,
} from 'lucide-react'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Learning Center — Change Engine',
  description: 'Understand your community through research, news, guided pathways, and conversation. Civic knowledge at a 6th-grade reading level.',
}

const THEME_LIST = Object.entries(THEMES).map(([id, t]) => ({ id, ...t }))

export default async function LearningCenterPage() {
  const supabase = await createClient()

  const [
    libraryResult,
    newsCountResult,
    latestNews,
    recentDocs,
    guidesResult,
  ] = await Promise.all([
    supabase.from('kb_documents' as any).select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('content_published').select('id', { count: 'exact', head: true }).eq('is_active', true),
    getNewsFeed(undefined, 8),
    supabase
      .from('kb_documents' as any)
      .select('id, title, summary, theme_ids, page_count')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(4),
    (supabase as any)
      .from('guides')
      .select('guide_id, title, slug, description, theme_id, hero_image_url')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .limit(6),
  ])

  const libraryCount = libraryResult.count || 0
  const newsCount = newsCountResult.count || 0
  const docs = recentDocs.data || []
  const guides = guidesResult.data || []

  return (
    <div className="min-h-screen" style={{ background: '#FAF9F6' }}>

      {/* ── HERO — Warm + Epic FOL ── */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(170deg, #F0EDE6 0%, #E8E4DB 40%, #DDD8CE 100%)' }}>

        {/* Giant Flower of Life — the epic centerpiece */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
          <svg viewBox="0 0 800 800" className="w-[900px] h-[900px]" style={{ opacity: 0.06 }}>
            {/* Layer 3: outermost ring — 12 circles */}
            {Array.from({ length: 12 }, (_, i) => {
              const angle = (i * 30 - 90) * Math.PI / 180
              const cx = 400 + 116 * Math.sqrt(3) * Math.cos(angle)
              const cy = 400 + 116 * Math.sqrt(3) * Math.sin(angle)
              return <circle key={'L3-' + i} cx={cx} cy={cy} r={116} stroke="#6B6560" strokeWidth="1.5" fill="none" />
            })}
            {/* Layer 2: inner ring — 6 circles */}
            {Array.from({ length: 6 }, (_, i) => {
              const angle = (i * 60 - 90) * Math.PI / 180
              const cx = 400 + 116 * Math.cos(angle)
              const cy = 400 + 116 * Math.sin(angle)
              return <circle key={'L2-' + i} cx={cx} cy={cy} r={116} stroke="#6B6560" strokeWidth="2" fill="none" />
            })}
            {/* Center */}
            <circle cx={400} cy={400} r={116} stroke="#6B6560" strokeWidth="2" fill="none" />
            {/* Boundary */}
            <circle cx={400} cy={400} r={350} stroke="#6B6560" strokeWidth="1" fill="none" opacity="0.5" />
          </svg>
        </div>

        {/* Pathway-colored accent dots orbiting the FOL */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
          <svg viewBox="0 0 800 800" className="w-[900px] h-[900px]">
            {THEME_LIST.slice(0, 6).map((t, i) => {
              const angle = (i * 60 - 90) * Math.PI / 180
              const cx = 400 + 95 * Math.cos(angle)
              const cy = 400 + 95 * Math.sin(angle)
              return <circle key={'dot-' + i} cx={cx} cy={cy} r={6} fill={t.color} opacity="0.25" />
            })}
            <circle cx={400} cy={400} r={6} fill={THEME_LIST[6]?.color || '#1a3460'} opacity="0.25" />
          </svg>
        </div>

        <div className="relative z-10 max-w-[1060px] mx-auto px-6 pt-10 pb-14 sm:pt-14 sm:pb-20">
          <nav className="text-[11px] tracking-wide mb-8" style={{ color: '#9B9590' }}>
            <Link href="/" className="hover:underline" style={{ color: '#6B6560' }}>Home</Link>
            <span className="mx-2">/</span>
            <span style={{ color: '#3A3A35' }}>Learning Center</span>
          </nav>

          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 flex items-center justify-center" style={{ background: '#2563eb' }}>
                <BookOpen size={20} color="white" />
              </div>
              <p className="text-[11px] uppercase tracking-[0.2em] font-semibold" style={{ color: '#2563eb' }}>
                Learning Center
              </p>
            </div>

            <h1 className="font-serif text-[clamp(2.2rem,5vw,3.5rem)] leading-[1.08] mb-5" style={{ color: '#2D2D2A' }}>
              What&rsquo;s happening &mdash; <span style={{ color: '#6B6560' }}>and why it matters to you.</span>
            </h1>
            <p className="text-[17px] leading-relaxed max-w-xl" style={{ color: '#6B6560' }}>
              News, research, guided pathways, and AI-powered discovery. Everything written at a 6th-grade reading level, in 3 languages.
            </p>

            {/* Stats row */}
            <div className="flex items-center gap-5 mt-8 flex-wrap">
              {[
                { n: newsCount.toLocaleString(), label: 'articles' },
                { n: String(libraryCount), label: 'research docs' },
                { n: '7', label: 'pathways' },
                { n: '3', label: 'languages' },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  {i > 0 && <div className="w-px h-5" style={{ background: '#D5D0CA' }} />}
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-serif text-2xl font-bold" style={{ color: '#2D2D2A' }}>{s.n}</span>
                    <span className="text-[12px]" style={{ color: '#9B9590' }}>{s.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pathway spectrum */}
        <div className="flex h-1">
          {THEME_LIST.map(t => <div key={t.id} className="flex-1" style={{ background: t.color }} />)}
        </div>
      </section>

      <div className="max-w-[1060px] mx-auto px-6">

        {/* ═══════════════════════════════════════════
            LATEST FROM HOUSTON — magazine layout
            ═══════════════════════════════════════════ */}
        <section className="py-12">
          <div className="flex items-end justify-between mb-6">
            <div className="flex items-center gap-3">
              <Newspaper size={20} style={{ color: '#2563eb' }} />
              <div>
                <h2 className="font-serif text-2xl" style={{ color: '#2D2D2A' }}>Latest from Your Community</h2>
                <p className="text-[13px]" style={{ color: '#9B9590' }}>{newsCount.toLocaleString()} articles &middot; organized by what matters to you</p>
              </div>
            </div>
            <Link href="/news" className="hidden sm:inline-flex items-center gap-1 text-[13px] font-semibold" style={{ color: '#2563eb' }}>
              All news <ArrowRight size={14} />
            </Link>
          </div>

          {latestNews.length > 0 && (
            <>
              {/* Hero + side stack */}
              <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4">
                {/* Featured article */}
                {(() => {
                  const item = latestNews[0]
                  const theme = item.pathway_primary ? THEMES[item.pathway_primary as keyof typeof THEMES] : null
                  return (
                    <Link
                      href={'/content/' + item.id}
                      className="bg-white border overflow-hidden transition-all hover:shadow-lg hover:translate-y-[-2px] group"
                      style={{ borderColor: '#E2DDD5' }}
                    >
                      <div className="h-[220px] overflow-hidden">
                        {item.image_url ? (
                          <Image src={item.image_url} alt="" width={800} height={400} className="w-full h-full object-cover transition-transform group-hover:scale-[1.02]" />
                        ) : (
                          <FolFallback pathway={item.pathway_primary} size="hero" />
                        )}
                      </div>
                      <div className="p-5">
                        {theme && (
                          <div className="flex items-center gap-1.5 mb-2">
                            <span className="w-2 h-2" style={{ background: theme.color }} />
                            <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: theme.color }}>{theme.name}</span>
                          </div>
                        )}
                        <h3 className="font-serif text-lg font-bold leading-snug group-hover:underline" style={{ color: '#2D2D2A' }}>
                          {item.title_6th_grade}
                        </h3>
                        {item.summary_6th_grade && (
                          <p className="text-[13px] mt-2 line-clamp-2 leading-relaxed" style={{ color: '#6B6560' }}>
                            {item.summary_6th_grade.length > 180 ? item.summary_6th_grade.slice(0, 180) + '...' : item.summary_6th_grade}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid #E2DDD5' }}>
                          <span className="text-[11px] font-mono" style={{ color: '#9B9590' }}>{item.source_domain}</span>
                          <span className="text-[12px] font-semibold" style={{ color: '#2563eb' }}>Read &rsaquo;</span>
                        </div>
                      </div>
                    </Link>
                  )
                })()}

                {/* Side stack — 3 cards with thumbnails */}
                <div className="flex flex-col gap-4">
                  {latestNews.slice(1, 4).map(function (item: any) {
                    const theme = item.pathway_primary ? THEMES[item.pathway_primary as keyof typeof THEMES] : null
                    return (
                      <Link
                        key={item.id}
                        href={'/content/' + item.id}
                        className="flex-1 flex bg-white border overflow-hidden transition-all hover:shadow-md group"
                        style={{ borderColor: '#E2DDD5' }}
                      >
                        <div className="w-[100px] flex-shrink-0 overflow-hidden">
                          {item.image_url ? (
                            <Image src={item.image_url} alt="" width={200} height={200} className="w-full h-full object-cover" />
                          ) : (
                            <FolFallback pathway={item.pathway_primary} height="h-full" />
                          )}
                        </div>
                        <div className="flex-1 p-3.5 min-w-0">
                          {theme && (
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="w-1.5 h-1.5" style={{ background: theme.color }} />
                              <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: theme.color }}>{theme.name}</span>
                            </div>
                          )}
                          <h4 className="text-[14px] font-bold leading-snug line-clamp-2 group-hover:underline" style={{ color: '#2D2D2A' }}>
                            {item.title_6th_grade}
                          </h4>
                          <span className="text-[11px] font-mono mt-1.5 block" style={{ color: '#9B9590' }}>{item.source_domain}</span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* Second row — 4 compact cards with thumbnails */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                {latestNews.slice(4, 8).map(function (item: any) {
                  const theme = item.pathway_primary ? THEMES[item.pathway_primary as keyof typeof THEMES] : null
                  return (
                    <Link
                      key={item.id}
                      href={'/content/' + item.id}
                      className="bg-white border overflow-hidden transition-all hover:shadow-md group"
                      style={{ borderColor: '#E2DDD5' }}
                    >
                      <div className="h-[100px] overflow-hidden">
                        {item.image_url ? (
                          <Image src={item.image_url} alt="" width={400} height={200} className="w-full h-full object-cover" />
                        ) : (
                          <FolFallback pathway={item.pathway_primary} height="h-full" />
                        )}
                      </div>
                      <div className="p-3">
                        {theme && (
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="w-1.5 h-1.5" style={{ background: theme.color }} />
                            <span className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: theme.color }}>{theme.name}</span>
                          </div>
                        )}
                        <h4 className="text-[13px] font-bold leading-snug line-clamp-2 group-hover:underline" style={{ color: '#2D2D2A' }}>
                          {item.title_6th_grade}
                        </h4>
                      </div>
                    </Link>
                  )
                })}
              </div>

              {/* Mobile: All news link */}
              <div className="sm:hidden mt-4">
                <Link href="/news" className="flex items-center justify-center gap-2 py-3 text-[13px] font-semibold bg-white border" style={{ color: '#2563eb', borderColor: '#E2DDD5' }}>
                  See all {newsCount.toLocaleString()} articles <ArrowRight size={14} />
                </Link>
              </div>
            </>
          )}
        </section>

        <hr className="border-0 h-px" style={{ background: 'linear-gradient(to right, #E2DDD5, rgba(226,221,213,0.3))' }} />

        {/* ═══════════════════════════════════════════
            SEVEN PATHWAYS — discovery grid
            ═══════════════════════════════════════════ */}
        <section className="py-12">
          <div className="flex items-end justify-between mb-6">
            <div className="flex items-center gap-3">
              <Compass size={20} style={{ color: '#2563eb' }} />
              <div>
                <h2 className="font-serif text-2xl" style={{ color: '#2D2D2A' }}>Seven Pathways</h2>
                <p className="text-[13px]" style={{ color: '#9B9590' }}>Every issue connects to a pathway &mdash; pick one to go deeper</p>
              </div>
            </div>
            <Link href="/pathways" className="hidden sm:inline-flex items-center gap-1 text-[13px] font-semibold" style={{ color: '#2563eb' }}>
              Explore all <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {THEME_LIST.map(function (t) {
              return (
                <Link
                  key={t.id}
                  href={'/pathways/' + t.slug}
                  className="relative bg-white border overflow-hidden transition-all hover:shadow-lg hover:translate-y-[-2px] group"
                  style={{ borderColor: '#E2DDD5' }}
                >
                  {/* Theme gradient header with FOL motif */}
                  <div className="h-[56px] relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${t.color}, ${t.color}cc)` }}>
                    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" fill="none">
                      <g opacity="0.15">
                        {Array.from({ length: 7 }, (_, i) => {
                          const angle = (i * 60 - 90) * Math.PI / 180
                          const cx = 50 + (i === 6 ? 0 : 18 * Math.cos(angle))
                          const cy = 50 + (i === 6 ? 0 : 18 * Math.sin(angle))
                          return <circle key={i} cx={cx} cy={cy} r={18} stroke="white" strokeWidth="0.5" />
                        })}
                      </g>
                    </svg>
                  </div>
                  <div className="p-3.5">
                    <h3 className="text-[14px] font-bold group-hover:underline" style={{ color: '#2D2D2A' }}>{t.name}</h3>
                    <p className="text-[11px] leading-relaxed mt-1 line-clamp-2" style={{ color: '#9B9590' }}>{t.description.split('.')[0]}.</p>
                  </div>
                </Link>
              )
            })}
            {/* Use the Compass CTA */}
            <Link
              href="/compass"
              className="bg-white border overflow-hidden transition-all hover:shadow-lg hover:translate-y-[-2px] group flex flex-col items-center justify-center text-center p-5"
              style={{ borderColor: '#2563eb40', background: '#f0f5ff' }}
            >
              <Sparkles size={24} style={{ color: '#2563eb' }} className="mb-2" />
              <span className="text-[14px] font-bold" style={{ color: '#2563eb' }}>Use the Compass</span>
              <span className="text-[11px] mt-1" style={{ color: '#6B6560' }}>Get a personalized guide</span>
            </Link>
          </div>
        </section>

        <hr className="border-0 h-px" style={{ background: 'linear-gradient(to right, #E2DDD5, rgba(226,221,213,0.3))' }} />

        {/* ═══════════════════════════════════════════
            RESEARCH LIBRARY — document cards
            ═══════════════════════════════════════════ */}
        <section className="py-12">
          <div className="flex items-end justify-between mb-6">
            <div className="flex items-center gap-3">
              <FileText size={20} style={{ color: '#2563eb' }} />
              <div>
                <h2 className="font-serif text-2xl" style={{ color: '#2D2D2A' }}>Research Library</h2>
                <p className="text-[13px]" style={{ color: '#9B9590' }}>{libraryCount} documents &middot; reports, policy briefs, and community research</p>
              </div>
            </div>
            <Link href="/library" className="hidden sm:inline-flex items-center gap-1 text-[13px] font-semibold" style={{ color: '#2563eb' }}>
              Browse library <ArrowRight size={14} />
            </Link>
          </div>

          {docs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {docs.map(function (doc: any) {
                const themeId = doc.theme_ids?.[0]
                const theme = themeId ? THEMES[themeId as keyof typeof THEMES] : null
                return (
                  <Link
                    key={doc.id}
                    href={'/library/' + doc.id}
                    className="bg-white border overflow-hidden transition-all hover:shadow-lg hover:translate-y-[-2px] group"
                    style={{ borderColor: '#E2DDD5' }}
                  >
                    {/* Themed FOL header */}
                    <div className="h-[80px] relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${theme?.color || '#2563eb'}, ${(theme?.color || '#2563eb')}88)` }}>
                      <svg viewBox="0 0 120 80" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" fill="none">
                        <g opacity="0.12">
                          {Array.from({ length: 7 }, (_, i) => {
                            const angle = (i * 60 - 90) * Math.PI / 180
                            const cx = 60 + (i === 6 ? 0 : 22 * Math.cos(angle))
                            const cy = 40 + (i === 6 ? 0 : 22 * Math.sin(angle))
                            return <circle key={i} cx={cx} cy={cy} r={22} stroke="white" strokeWidth="0.6" />
                          })}
                        </g>
                      </svg>
                      <div className="absolute bottom-2 left-3 flex items-center gap-1.5">
                        <BookOpen size={12} color="white" />
                        {doc.page_count && <span className="text-xs font-mono text-white/70">{doc.page_count} pages</span>}
                      </div>
                    </div>
                    <div className="p-4">
                      {theme && <span className="text-xs uppercase tracking-wider font-semibold block mb-1" style={{ color: theme.color }}>{theme.name}</span>}
                      <h4 className="text-[14px] font-bold leading-snug line-clamp-3 group-hover:underline" style={{ color: '#2D2D2A' }}>
                        {doc.title}
                      </h4>
                      {doc.summary && (
                        <p className="text-[12px] mt-2 line-clamp-2 leading-relaxed" style={{ color: '#6B6560' }}>{doc.summary}</p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="bg-white border p-8 text-center" style={{ borderColor: '#E2DDD5' }}>
              <BookOpen size={32} style={{ color: '#E2DDD5' }} className="mx-auto mb-3" />
              <p className="text-[14px]" style={{ color: '#6B6560' }}>Library documents coming soon.</p>
            </div>
          )}
        </section>

        <hr className="border-0 h-px" style={{ background: 'linear-gradient(to right, #E2DDD5, rgba(226,221,213,0.3))' }} />

        {/* ═══════════════════════════════════════════
            GUIDES + INTERACTIVE TOOLS — two columns
            ═══════════════════════════════════════════ */}
        <section className="py-12">
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8">

            {/* GUIDES — with thumbnails */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <Compass size={18} style={{ color: '#2563eb' }} />
                  <h2 className="font-serif text-xl" style={{ color: '#2D2D2A' }}>Guides</h2>
                </div>
                <Link href="/guides" className="text-[12px] font-semibold" style={{ color: '#2563eb' }}>All guides <ChevronRight size={12} className="inline" /></Link>
              </div>
              <div className="space-y-3">
                {guides.length > 0 ? guides.map(function (guide: any) {
                  const theme = guide.theme_id ? THEMES[guide.theme_id as keyof typeof THEMES] : null
                  return (
                    <Link
                      key={guide.guide_id}
                      href={'/guides/' + guide.slug}
                      className="flex gap-4 bg-white border p-4 transition-all hover:shadow-md group"
                      style={{ borderColor: '#E2DDD5' }}
                    >
                      <div className="w-20 h-20 flex-shrink-0 overflow-hidden" style={{ borderRadius: 2 }}>
                        {guide.hero_image_url ? (
                          <Image src={guide.hero_image_url} alt="" width={160} height={160} className="w-full h-full object-cover" />
                        ) : (
                          <FolFallback pathway={guide.theme_id} height="h-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        {theme && <span className="text-xs uppercase tracking-wider font-semibold mb-0.5" style={{ color: theme.color }}>{theme.name}</span>}
                        <h4 className="text-[15px] font-bold leading-snug line-clamp-2 group-hover:underline" style={{ color: '#2D2D2A' }}>{guide.title}</h4>
                        {guide.description && <p className="text-[12px] mt-1 line-clamp-1" style={{ color: '#9B9590' }}>{guide.description}</p>}
                      </div>
                      <ChevronRight size={16} className="flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#9B9590' }} />
                    </Link>
                  )
                }) : (
                  <div className="bg-white border p-6 text-center" style={{ borderColor: '#E2DDD5' }}>
                    <p className="text-[14px]" style={{ color: '#6B6560' }}>Guides coming soon.</p>
                  </div>
                )}
              </div>
            </div>

            {/* INTERACTIVE TOOLS — stacked cards */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <Sparkles size={18} style={{ color: '#2563eb' }} />
                <h2 className="font-serif text-xl" style={{ color: '#2D2D2A' }}>Interactive Tools</h2>
              </div>
              <div className="space-y-3">

                {/* Adventures */}
                <Link href="/adventures" className="block bg-white border p-4 transition-all hover:shadow-md group" style={{ borderColor: '#E2DDD5' }}>
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: '#f0fdf4' }}>
                      <Map size={24} style={{ color: '#16a34a' }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[15px] font-bold group-hover:underline" style={{ color: '#2D2D2A' }}>Community Adventures</h3>
                      <p className="text-[12px] mt-1 leading-relaxed line-clamp-2" style={{ color: '#6B6560' }}>
                        Interactive stories where your choices shape the outcome. Navigate a town hall or discover hidden neighborhood assets.
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock size={11} style={{ color: '#9B9590' }} />
                        <span className="text-[11px] font-mono" style={{ color: '#9B9590' }}>~5 min each</span>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Ask Chance */}
                <Link href="/chat" className="block bg-white border p-4 transition-all hover:shadow-md group" style={{ borderColor: '#E2DDD5' }}>
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 flex items-center justify-center flex-shrink-0" style={{ background: '#eff6ff' }}>
                      <MessageCircle size={24} style={{ color: '#2563eb' }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[15px] font-bold group-hover:underline" style={{ color: '#2D2D2A' }}>Ask Chance</h3>
                      <p className="text-[12px] mt-1 leading-relaxed line-clamp-2" style={{ color: '#6B6560' }}>
                        Your AI civic guide. Ask about services, officials, policies — answers grounded in real community data.
                      </p>
                      <span className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-semibold" style={{ color: '#16a34a' }}>
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full rounded-full opacity-40 animate-ping" style={{ background: '#16a34a' }} />
                          <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#16a34a' }} />
                        </span>
                        Online now
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Bookshelf */}
                <Link href="/bookshelf" className="block bg-white border p-4 transition-all hover:shadow-md group" style={{ borderColor: '#E2DDD5' }}>
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 flex items-center justify-center flex-shrink-0" style={{ background: '#fef3c7' }}>
                      <BookOpen size={24} style={{ color: '#92400e' }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[15px] font-bold group-hover:underline" style={{ color: '#2D2D2A' }}>Community Bookshelf</h3>
                      <p className="text-[12px] mt-1 leading-relaxed line-clamp-2" style={{ color: '#6B6560' }}>
                        Books that shape how communities think about themselves. Curated reads on civic life and belonging.
                      </p>
                    </div>
                  </div>
                </Link>

                {/* Use the Compass */}
                <Link href="/compass" className="block border-2 p-4 transition-all hover:shadow-md group" style={{ borderColor: '#2563eb', background: '#f8faff' }}>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 flex items-center justify-center flex-shrink-0" style={{ background: '#2563eb' }}>
                      <Sparkles size={24} color="white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[15px] font-bold group-hover:underline" style={{ color: '#2563eb' }}>Use the Compass</h3>
                      <p className="text-[12px] mt-1 leading-relaxed" style={{ color: '#6B6560' }}>
                        Pick your topics, set your ZIP — get a personalized guide to everything that matters to you.
                      </p>
                    </div>
                    <ArrowRight size={18} style={{ color: '#2563eb' }} className="flex-shrink-0" />
                  </div>
                </Link>

              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            CLOSING — warm, inviting
            ═══════════════════════════════════════════ */}
        <section className="py-8 mb-10">
          <div className="relative overflow-hidden p-8 sm:p-10 text-center" style={{ background: 'linear-gradient(135deg, #F0EDE6, #E8E4DB)', border: '1px solid #E2DDD5' }}>
            {/* Subtle FOL watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
              <svg viewBox="0 0 200 200" className="w-[280px] h-[280px]" style={{ opacity: 0.04 }}>
                {Array.from({ length: 7 }, (_, i) => {
                  const angle = (i * 60 - 90) * Math.PI / 180
                  const cx = 100 + (i === 6 ? 0 : 30 * Math.cos(angle))
                  const cy = 100 + (i === 6 ? 0 : 30 * Math.sin(angle))
                  return <circle key={i} cx={cx} cy={cy} r={30} stroke="#6B6560" strokeWidth="1.5" fill="none" />
                })}
              </svg>
            </div>
            <p className="font-serif text-xl relative z-10" style={{ color: '#2D2D2A' }}>
              Understanding is the first step toward participation.
            </p>
            <p className="text-[13px] mt-2 relative z-10 max-w-md mx-auto" style={{ color: '#6B6560' }}>
              Every article, report, and pathway is written at a 6th-grade reading level — because civic knowledge belongs to everyone.
            </p>
            <div className="flex items-center justify-center gap-3 mt-6 relative z-10 flex-wrap">
              <Link href="/compass" className="inline-flex items-center gap-2 px-6 py-2.5 text-[13px] font-semibold text-white transition-all hover:shadow-md" style={{ background: '#2563eb' }}>
                Use the Compass <ArrowRight size={14} />
              </Link>
              <Link href="/news" className="inline-flex items-center gap-2 px-6 py-2.5 text-[13px] font-semibold border transition-all hover:shadow-md bg-white" style={{ color: '#2D2D2A', borderColor: '#E2DDD5' }}>
                Browse news <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
