import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { getNewsFeed } from '@/lib/data/content'
import { THEMES } from '@/lib/constants'
import { FolFallback } from '@/components/ui/FolFallback'
import {
  BookOpen, Newspaper, Compass, MessageCircle, Map,
  ArrowRight, FileText, TrendingUp, Sparkles,
} from 'lucide-react'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Learning Center — Change Engine',
  description: 'Understand your community through research, news, guided pathways, and conversation. Houston civic knowledge at a 6th-grade reading level.',
}

const THEME_LIST = Object.entries(THEMES).map(([id, t]) => ({ id, ...t }))

export default async function LearningCenterPage() {
  const supabase = await createClient()

  // Fetch everything in parallel — real content, not just counts
  const [
    libraryResult,
    newsCountResult,
    latestNews,
    recentDocs,
    guidesResult,
    adventuresCount,
  ] = await Promise.all([
    supabase.from('kb_documents' as any).select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('content_published').select('id', { count: 'exact', head: true }).eq('is_active', true),
    getNewsFeed(undefined, 6),
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
      .limit(4),
    (supabase as any)
      .from('adventures' as any)
      .select('id', { count: 'exact', head: true }),
  ])

  const libraryCount = libraryResult.count || 0
  const newsCount = newsCountResult.count || 0
  const docs = recentDocs.data || []
  const guides = guidesResult.data || []
  const advCount = adventuresCount?.count || 3

  return (
    <div className="min-h-screen" style={{ background: '#f8f9fa' }}>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden" style={{ background: '#0d1117' }}>
        {/* FOL watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
          <svg viewBox="0 0 400 400" className="w-[600px] h-[600px] opacity-[0.04]">
            {Array.from({ length: 7 }, (_, i) => {
              const angle = (i * 60 - 90) * Math.PI / 180
              const cx = 200 + (i === 6 ? 0 : 58 * Math.cos(angle))
              const cy = 200 + (i === 6 ? 0 : 58 * Math.sin(angle))
              return <circle key={i} cx={cx} cy={cy} r={58} stroke="white" strokeWidth="1.5" fill="none" />
            })}
          </svg>
        </div>

        <div className="relative z-10 max-w-[1000px] mx-auto px-6 py-14 sm:py-20">
          <nav className="text-[11px] tracking-wide mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <Link href="/" className="hover:underline">Home</Link>
            <span className="mx-2">/</span>
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>Learning Center</span>
          </nav>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 flex items-center justify-center" style={{ background: '#2563eb' }}>
              <BookOpen size={20} color="white" />
            </div>
            <p className="text-[11px] uppercase tracking-[0.2em] font-semibold" style={{ color: '#2563eb' }}>
              Learning Center
            </p>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl leading-[1.1] mb-4" style={{ color: 'white' }}>
            Understand your city.<br />
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>Then change it.</span>
          </h1>
          <p className="text-lg max-w-xl leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Research, reporting, guided pathways, and AI-powered discovery — everything you need to understand Houston, written at a 6th-grade reading level.
          </p>

          {/* Stats row */}
          <div className="flex items-center gap-6 mt-8 flex-wrap">
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-3xl font-bold" style={{ color: 'white' }}>{newsCount.toLocaleString()}</span>
              <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.4)' }}>articles</span>
            </div>
            <div className="w-px h-6" style={{ background: 'rgba(255,255,255,0.15)' }} />
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-3xl font-bold" style={{ color: 'white' }}>{libraryCount}</span>
              <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.4)' }}>research docs</span>
            </div>
            <div className="w-px h-6" style={{ background: 'rgba(255,255,255,0.15)' }} />
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-3xl font-bold" style={{ color: 'white' }}>7</span>
              <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.4)' }}>pathways</span>
            </div>
            <div className="w-px h-6" style={{ background: 'rgba(255,255,255,0.15)' }} />
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-3xl font-bold" style={{ color: 'white' }}>3</span>
              <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.4)' }}>languages</span>
            </div>
          </div>
        </div>

        {/* Pathway spectrum */}
        <div className="flex h-1">
          {THEME_LIST.map(t => <div key={t.id} className="flex-1" style={{ background: t.color }} />)}
        </div>
      </section>

      <div className="max-w-[1000px] mx-auto px-6">

        {/* ── LATEST NEWS — the heartbeat ── */}
        <section className="py-12">
          <div className="flex items-end justify-between mb-6">
            <div className="flex items-center gap-3">
              <Newspaper size={20} style={{ color: '#2563eb' }} />
              <div>
                <h2 className="font-serif text-2xl" style={{ color: '#1A1A1A' }}>Latest from Houston</h2>
                <p className="text-[13px]" style={{ color: '#6B6560' }}>{newsCount.toLocaleString()} articles, organized by what matters to you</p>
              </div>
            </div>
            <Link href="/news" className="inline-flex items-center gap-1 text-[13px] font-semibold" style={{ color: '#2563eb' }}>
              All news <ArrowRight size={14} />
            </Link>
          </div>

          {latestNews.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Featured article — large */}
              {(() => {
                const item = latestNews[0]
                const theme = item.pathway_primary ? THEMES[item.pathway_primary as keyof typeof THEMES] : null
                return (
                  <Link
                    href={'/content/' + item.id}
                    className="md:col-span-2 bg-white border overflow-hidden transition-all hover:shadow-lg hover:translate-y-[-2px] group"
                    style={{ borderColor: '#E2DDD5' }}
                  >
                    {item.image_url ? (
                      <div className="h-[200px] overflow-hidden">
                        <Image src={item.image_url} alt="" width={800} height={400} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <FolFallback pathway={item.pathway_primary} size="hero" />
                    )}
                    <div className="p-5">
                      {theme && (
                        <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: theme.color }}>{theme.name}</span>
                      )}
                      <h3 className="font-serif text-lg font-bold mt-1 leading-snug group-hover:underline" style={{ color: '#1A1A1A' }}>
                        {item.title_6th_grade}
                      </h3>
                      {item.summary_6th_grade && (
                        <p className="text-[13px] mt-2 line-clamp-2" style={{ color: '#6B6560' }}>
                          {item.summary_6th_grade.length > 160 ? item.summary_6th_grade.slice(0, 160) + '...' : item.summary_6th_grade}
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

              {/* Side stack */}
              <div className="flex flex-col gap-4">
                {latestNews.slice(1, 4).map(function (item: any) {
                  const theme = item.pathway_primary ? THEMES[item.pathway_primary as keyof typeof THEMES] : null
                  return (
                    <Link
                      key={item.id}
                      href={'/content/' + item.id}
                      className="flex-1 bg-white border overflow-hidden transition-all hover:shadow-md group"
                      style={{ borderColor: '#E2DDD5' }}
                    >
                      <div className="p-4">
                        {theme && (
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="w-2 h-2" style={{ background: theme.color }} />
                            <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: theme.color }}>{theme.name}</span>
                          </div>
                        )}
                        <h4 className="text-[14px] font-bold leading-snug line-clamp-2 group-hover:underline" style={{ color: '#1A1A1A' }}>
                          {item.title_6th_grade}
                        </h4>
                        <span className="text-[11px] font-mono mt-1 block" style={{ color: '#9B9590' }}>{item.source_domain}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* More news row */}
          {latestNews.length > 4 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              {latestNews.slice(3, 6).map(function (item: any) {
                const theme = item.pathway_primary ? THEMES[item.pathway_primary as keyof typeof THEMES] : null
                return (
                  <Link
                    key={item.id}
                    href={'/content/' + item.id}
                    className="flex items-center gap-3 bg-white border px-4 py-3 transition-all hover:shadow-md group"
                    style={{ borderColor: '#E2DDD5' }}
                  >
                    {theme && <span className="w-2 h-8 flex-shrink-0" style={{ background: theme.color }} />}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[13px] font-bold leading-snug line-clamp-2 group-hover:underline" style={{ color: '#1A1A1A' }}>
                        {item.title_6th_grade}
                      </h4>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        <hr className="border-0 h-px" style={{ background: '#E2DDD5' }} />

        {/* ── RESEARCH LIBRARY ── */}
        <section className="py-12">
          <div className="flex items-end justify-between mb-6">
            <div className="flex items-center gap-3">
              <FileText size={20} style={{ color: '#2563eb' }} />
              <div>
                <h2 className="font-serif text-2xl" style={{ color: '#1A1A1A' }}>Research Library</h2>
                <p className="text-[13px]" style={{ color: '#6B6560' }}>{libraryCount} documents — reports, policy briefs, and community research</p>
              </div>
            </div>
            <Link href="/library" className="inline-flex items-center gap-1 text-[13px] font-semibold" style={{ color: '#2563eb' }}>
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
                    {/* Color bar */}
                    <div className="h-1.5" style={{ background: theme?.color || '#2563eb' }} />
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen size={14} style={{ color: theme?.color || '#2563eb' }} />
                        {theme && <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: theme.color }}>{theme.name}</span>}
                      </div>
                      <h4 className="text-[14px] font-bold leading-snug line-clamp-3 group-hover:underline" style={{ color: '#1A1A1A' }}>
                        {doc.title}
                      </h4>
                      {doc.summary && (
                        <p className="text-[12px] mt-2 line-clamp-2" style={{ color: '#6B6560' }}>{doc.summary}</p>
                      )}
                      {doc.page_count && (
                        <span className="text-[10px] font-mono mt-2 block" style={{ color: '#9B9590' }}>{doc.page_count} pages</span>
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

        <hr className="border-0 h-px" style={{ background: '#E2DDD5' }} />

        {/* ── SEVEN PATHWAYS ── */}
        <section className="py-12">
          <div className="flex items-end justify-between mb-6">
            <div className="flex items-center gap-3">
              <Compass size={20} style={{ color: '#2563eb' }} />
              <div>
                <h2 className="font-serif text-2xl" style={{ color: '#1A1A1A' }}>Seven Pathways</h2>
                <p className="text-[13px]" style={{ color: '#6B6560' }}>Every issue connects to a pathway. Pick one to go deeper.</p>
              </div>
            </div>
            <Link href="/pathways" className="inline-flex items-center gap-1 text-[13px] font-semibold" style={{ color: '#2563eb' }}>
              Explore all <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {THEME_LIST.map(function (t) {
              return (
                <Link
                  key={t.id}
                  href={'/pathways/' + t.slug}
                  className="relative bg-white border overflow-hidden transition-all hover:shadow-lg hover:translate-y-[-2px] group"
                  style={{ borderColor: '#E2DDD5' }}
                >
                  <div className="h-1.5" style={{ background: t.color }} />
                  <div className="p-4">
                    <div className="w-8 h-8 flex items-center justify-center mb-3" style={{ background: t.color + '15' }}>
                      <div className="w-3 h-3" style={{ background: t.color }} />
                    </div>
                    <h3 className="text-[15px] font-bold mb-1 group-hover:underline" style={{ color: '#1A1A1A' }}>{t.name}</h3>
                    <p className="text-[12px] leading-relaxed line-clamp-2" style={{ color: '#6B6560' }}>{t.description.split('.')[0]}.</p>
                  </div>
                </Link>
              )
            })}
            {/* Compass CTA */}
            <Link
              href="/compass"
              className="bg-white border overflow-hidden transition-all hover:shadow-lg hover:translate-y-[-2px] group flex flex-col items-center justify-center text-center p-6"
              style={{ borderColor: '#2563eb', borderStyle: 'dashed' }}
            >
              <Sparkles size={24} style={{ color: '#2563eb' }} className="mb-2" />
              <span className="text-[14px] font-bold" style={{ color: '#2563eb' }}>Take the Compass</span>
              <span className="text-[11px] mt-1" style={{ color: '#6B6560' }}>Get a personalized guide</span>
            </Link>
          </div>
        </section>

        <hr className="border-0 h-px" style={{ background: '#E2DDD5' }} />

        {/* ── GUIDES & ADVENTURES ── */}
        <section className="py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Guides */}
            {guides.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp size={18} style={{ color: '#2563eb' }} />
                  <h2 className="font-serif text-xl" style={{ color: '#1A1A1A' }}>Guides</h2>
                </div>
                <div className="space-y-3">
                  {guides.map(function (guide: any) {
                    const theme = guide.theme_id ? THEMES[guide.theme_id as keyof typeof THEMES] : null
                    return (
                      <Link
                        key={guide.guide_id}
                        href={'/guides/' + guide.slug}
                        className="flex gap-3 bg-white border p-4 transition-all hover:shadow-md group"
                        style={{ borderColor: '#E2DDD5' }}
                      >
                        {guide.hero_image_url ? (
                          <div className="w-16 h-16 flex-shrink-0 overflow-hidden border" style={{ borderColor: '#E2DDD5' }}>
                            <Image src={guide.hero_image_url} alt="" width={64} height={64} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-16 h-16 flex-shrink-0 overflow-hidden">
                            <FolFallback pathway={guide.theme_id} height="h-full" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          {theme && <span className="text-[10px] uppercase tracking-wider font-semibold block mb-0.5" style={{ color: theme.color }}>{theme.name}</span>}
                          <h4 className="text-[14px] font-bold leading-snug line-clamp-2 group-hover:underline" style={{ color: '#1A1A1A' }}>{guide.title}</h4>
                          {guide.description && <p className="text-[12px] mt-1 line-clamp-1" style={{ color: '#6B6560' }}>{guide.description}</p>}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Interactive tools */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Sparkles size={18} style={{ color: '#2563eb' }} />
                <h2 className="font-serif text-xl" style={{ color: '#1A1A1A' }}>Interactive Tools</h2>
              </div>
              <div className="space-y-3">
                {/* Adventures card */}
                <Link
                  href="/adventures"
                  className="block bg-white border p-5 transition-all hover:shadow-md group"
                  style={{ borderColor: '#E2DDD5' }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 flex items-center justify-center flex-shrink-0" style={{ background: '#f0fdf4' }}>
                      <Map size={22} style={{ color: '#16a34a' }} />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold group-hover:underline" style={{ color: '#1A1A1A' }}>Community Adventures</h3>
                      <p className="text-[13px] mt-1 leading-relaxed" style={{ color: '#6B6560' }}>
                        Interactive stories where your choices shape the outcome. Navigate a town hall, discover hidden assets, or prepare for hurricane season.
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[11px] font-mono" style={{ color: '#9B9590' }}>{advCount} adventures</span>
                        <span style={{ color: '#D5D0CA' }}>&middot;</span>
                        <span className="text-[11px] font-mono" style={{ color: '#9B9590' }}>~5 min each</span>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Ask Chance card */}
                <Link
                  href="/chat"
                  className="block bg-white border p-5 transition-all hover:shadow-md group"
                  style={{ borderColor: '#E2DDD5' }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 flex items-center justify-center flex-shrink-0" style={{ background: '#eff6ff' }}>
                      <MessageCircle size={22} style={{ color: '#2563eb' }} />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold group-hover:underline" style={{ color: '#1A1A1A' }}>Ask Chance</h3>
                      <p className="text-[13px] mt-1 leading-relaxed" style={{ color: '#6B6560' }}>
                        Your AI civic guide. Ask about services, organizations, officials, policies — Chance answers using real Houston data.
                      </p>
                      <span className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-semibold" style={{ color: '#2563eb' }}>
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full rounded-full opacity-40 animate-ping" style={{ background: '#2563eb' }} />
                          <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#2563eb' }} />
                        </span>
                        Online now
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Bookshelf card */}
                <Link
                  href="/bookshelf"
                  className="block bg-white border p-5 transition-all hover:shadow-md group"
                  style={{ borderColor: '#E2DDD5' }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 flex items-center justify-center flex-shrink-0" style={{ background: '#fef3c7' }}>
                      <BookOpen size={22} style={{ color: '#92400e' }} />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold group-hover:underline" style={{ color: '#1A1A1A' }}>Community Bookshelf</h3>
                      <p className="text-[13px] mt-1 leading-relaxed" style={{ color: '#6B6560' }}>
                        Books that shaped how Houston thinks about itself. Curated reads on civic life, community building, and belonging.
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── CLOSING ── */}
        <section className="py-10 mb-8">
          <div className="relative overflow-hidden p-8 text-center" style={{ background: '#0d1117' }}>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
              <svg viewBox="0 0 200 200" className="w-[300px] h-[300px] opacity-[0.06]">
                {Array.from({ length: 7 }, (_, i) => {
                  const angle = (i * 60 - 90) * Math.PI / 180
                  const cx = 100 + (i === 6 ? 0 : 30 * Math.cos(angle))
                  const cy = 100 + (i === 6 ? 0 : 30 * Math.sin(angle))
                  return <circle key={i} cx={cx} cy={cy} r={30} stroke="white" strokeWidth="1" fill="none" />
                })}
              </svg>
            </div>
            <p className="font-serif text-xl relative z-10" style={{ color: 'white' }}>
              Understanding is the first step toward participation.
            </p>
            <p className="text-[13px] mt-2 relative z-10" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Every article, report, and pathway was written at a 6th-grade reading level — because civic knowledge belongs to everyone.
            </p>
            <div className="flex items-center justify-center gap-4 mt-6 relative z-10">
              <Link href="/compass" className="inline-flex items-center gap-2 px-6 py-2.5 text-[13px] font-semibold text-white" style={{ background: '#2563eb' }}>
                Take the Compass <ArrowRight size={14} />
              </Link>
              <Link href="/news" className="inline-flex items-center gap-2 px-6 py-2.5 text-[13px] font-semibold border" style={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.2)' }}>
                Browse news <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
