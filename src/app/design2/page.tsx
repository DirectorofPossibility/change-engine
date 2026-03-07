import type { Metadata } from 'next'
import Link from 'next/link'
import { getExchangeStats, getLatestContent, getPathwayCounts } from '@/lib/data/exchange'
import { THEMES } from '@/lib/constants'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Community Exchange — Design 2',
  description: 'A/B test: Center-based navigation for the Community Exchange.',
}

const THEME_LIST = Object.entries(THEMES).map(function ([id, t]) { return { id, ...t } })

const PERSONAS = [
  { name: 'Seeker', question: '"I need something specific right now"', color: '#C75B2A', tags: ['Resource', 'Action'] },
  { name: 'Learner', question: '"I want to understand what\'s happening"', color: '#3182ce', tags: ['Learning', 'Resource'] },
  { name: 'Builder', question: '"I want to make something better"', color: '#38a169', tags: ['Action', 'Learning'] },
  { name: 'Watchdog', question: '"I want to hold leaders accountable"', color: '#805ad5', tags: ['Accountability', 'Learning'] },
  { name: 'Partner', question: '"I represent an organization"', color: '#d69e2e', tags: ['Action', 'Resource'] },
  { name: 'Explorer', question: '"I\'m just curious about my community"', color: '#319795', tags: ['Learning', 'Action'] },
]

const SEARCH_SUGGESTIONS = [
  { label: 'food assistance', href: '/design2/search?q=food+assistance' },
  { label: 'voter registration', href: '/design2/search?q=voter+registration' },
  { label: 'mental health', href: '/design2/search?q=mental+health' },
  { label: 'job training', href: '/design2/search?q=job+training' },
  { label: 'childcare', href: '/design2/search?q=childcare' },
  { label: 'legal help', href: '/design2/search?q=legal+help' },
]

export default async function Design2Home() {
  const [stats, latestContent, pathwayCounts] = await Promise.all([
    getExchangeStats(),
    getLatestContent(4),
    getPathwayCounts(),
  ])

  const featured = latestContent?.[0]
  const sideItems = latestContent?.slice(1, 4) || []

  return (
    <div>
      {/* ── DARK HERO ── */}
      <section className="relative" style={{ background: '#1a1a2e' }}>
        <div className="max-w-[1152px] mx-auto px-8 py-16">
          <p className="text-[11px] uppercase tracking-[0.3em] font-semibold mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Houston, Texas
          </p>
          <h1 className="font-serif text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] tracking-tight mb-4" style={{ color: 'white' }}>
            Community life, <span style={{ color: '#C75B2A' }}>organized.</span>
          </h1>
          <p className="font-serif text-xl italic mb-10" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Resources, services, and civic power for every Houstonian
          </p>

          {/* Search bar */}
          <Link
            href="/design2/search"
            className="flex items-center gap-3 max-w-[520px] px-4 py-4 rounded-lg mb-5"
            style={{ background: 'white', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B6560" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <span className="text-[14px]" style={{ color: 'rgba(107,101,96,0.6)' }}>Search resources, services, officials...</span>
          </Link>

          {/* Search suggestions */}
          <p className="text-[12px] mb-10" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Try: {SEARCH_SUGGESTIONS.map(function (s, i) {
              return (
                <span key={s.label}>
                  {i > 0 && <span style={{ color: 'rgba(255,255,255,0.2)', margin: '0 6px' }}>/</span>}
                  <Link href={s.href} className="hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.6)' }}>{s.label}</Link>
                </span>
              )
            })}
          </p>

          {/* Quick links */}
          <div className="flex flex-wrap gap-3">
            <Link href="/design2/explore" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-[14px] font-medium text-white transition-colors" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
              Available Resources
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
            </Link>
            <Link href="/design2/services" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-[14px] font-medium text-white transition-colors" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
              Find Services
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
            </Link>
            <Link href="/design2/officials" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-[14px] font-medium text-white transition-colors" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
              Your Representatives
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
            </Link>
          </div>
        </div>

        {/* Pathway spectrum bar */}
        <div className="flex h-1">
          {THEME_LIST.map(function (t) {
            return <div key={t.id} className="flex-1" style={{ background: t.color }} />
          })}
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <div style={{ background: 'white', borderBottom: '1px solid #E2DDD5' }}>
        <div className="max-w-[1152px] mx-auto px-8 py-5 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-2xl font-bold" style={{ color: '#1A1A1A' }}>{((stats.resources || 0) + (stats.services || 0) + (stats.officials || 0) + (stats.policies || 0) + (stats.organizations || 0)).toLocaleString()}</span>
              <span className="text-[12px]" style={{ color: '#6B6560' }}>Resources</span>
            </div>
            <div className="w-px h-8" style={{ background: '#E2DDD5' }} />
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-2xl font-bold" style={{ color: '#1A1A1A' }}>{stats.officials || 0}</span>
              <span className="text-[12px]" style={{ color: '#6B6560' }}>Officials</span>
            </div>
            <div className="w-px h-8" style={{ background: '#E2DDD5' }} />
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-2xl font-bold" style={{ color: '#1A1A1A' }}>{stats.organizations || 0}</span>
              <span className="text-[12px]" style={{ color: '#6B6560' }}>Organizations</span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: '#2D8659' }}>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full opacity-40 animate-ping" style={{ background: '#2D8659' }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#2D8659' }} />
            </span>
            Updated daily
          </span>
        </div>
      </div>

      <div className="max-w-[1152px] mx-auto px-8">

        {/* ── SEVEN PATHWAYS ── */}
        <section className="py-12">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="font-serif text-4xl" style={{ color: '#1A1A1A' }}>Seven Pathways</h2>
              <p className="text-[14px] mt-1" style={{ color: '#6B6560' }}>Explore community life through the lens that matters to you</p>
            </div>
            <Link href="/design2/pathways" className="inline-flex items-center gap-1 text-[14px] font-semibold" style={{ color: '#C75B2A' }}>
              See all <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {THEME_LIST.map(function (t) {
              const count = pathwayCounts[t.id] || 0
              return (
                <Link
                  key={t.id}
                  href={'/design2/pathways/' + t.slug}
                  className="bg-white rounded-xl border overflow-hidden transition-all hover:shadow-lg hover:translate-y-[-2px] group"
                  style={{ borderColor: '#E2DDD5' }}
                >
                  <div className="h-1.5" style={{ background: t.color }} />
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: t.color }} />
                      <h3 className="text-[14px] font-bold" style={{ color: '#1A1A1A' }}>{t.name}</h3>
                    </div>
                    <p className="text-[12px] leading-relaxed line-clamp-2 mb-3" style={{ color: '#6B6560' }}>{t.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[12px]" style={{ color: '#9B9590' }}>{count} resources</span>
                      <span className="text-[12px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: t.color }}>Explore &rarr;</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Section divider */}
        <hr className="border-0 h-px" style={{ background: 'linear-gradient(to right, #E2DDD5, rgba(226,221,213,0.6), transparent)' }} />

        {/* ── PERSONA SELECTOR ── */}
        <section className="py-12">
          <h2 className="font-serif text-2xl mb-1" style={{ color: '#1A1A1A' }}>Not sure where to start?</h2>
          <p className="text-[14px] mb-6" style={{ color: '#6B6560' }}>Pick the one that sounds like you.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PERSONAS.map(function (p) {
              return (
                <Link
                  key={p.name}
                  href="/design2/chat"
                  className="bg-white rounded-xl border relative overflow-hidden p-4 pl-5 transition-all hover:shadow-md hover:translate-y-[-1px]"
                  style={{ borderColor: '#E2DDD5' }}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: p.color }} />
                  <div className="text-[14px] font-bold" style={{ color: '#1A1A1A' }}>{p.name}</div>
                  <div className="text-[12px] italic mt-1" style={{ color: '#6B6560' }}>{p.question}</div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.tags.map(function (tag) {
                      return (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: '#FAF8F5', color: '#6B6560' }}>{tag}</span>
                      )
                    })}
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Section divider */}
        <hr className="border-0 h-px" style={{ background: 'linear-gradient(to right, #E2DDD5, rgba(226,221,213,0.6), transparent)' }} />

        {/* ── WHAT'S NEW — MAGAZINE LAYOUT ── */}
        <section className="py-12 pb-20">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="font-serif text-4xl" style={{ color: '#1A1A1A' }}>What&apos;s New</h2>
              <p className="text-[14px] mt-1" style={{ color: '#6B6560' }}>Recently published for the Houston community</p>
            </div>
            <Link href="/design2/news" className="inline-flex items-center gap-1 text-[14px] font-semibold" style={{ color: '#C75B2A' }}>
              See all <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
            {/* Featured card */}
            {featured && (
              <Link
                href={'/design2/content/' + featured.id}
                className="bg-white rounded-xl border overflow-hidden transition-all hover:shadow-lg hover:translate-y-[-2px]"
                style={{ borderColor: '#E2DDD5' }}
              >
                {featured.image_url ? (
                  <div className="h-[220px] overflow-hidden">
                    <img src={featured.image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="h-[220px] flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(199,91,42,0.08), rgba(199,91,42,0.16))' }}>
                    <svg width="64" height="64" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="#C75B2A" opacity="0.15"/><circle cx="32" cy="32" r="20" fill="#C75B2A" opacity="0.2"/><circle cx="32" cy="32" r="10" fill="#C75B2A" opacity="0.3"/></svg>
                  </div>
                )}
                <div className="p-4">
                  <h4 className="font-serif text-[16px] font-bold leading-snug mb-1.5" style={{ color: '#1A1A1A' }}>
                    {featured.title_6th_grade || (featured as any).title}
                  </h4>
                  {(featured as any).summary_6th_grade && (
                    <p className="text-[14px] line-clamp-2" style={{ color: '#6B6560' }}>{(featured as any).summary_6th_grade}</p>
                  )}
                  <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid rgba(226,221,213,0.5)' }}>
                    <div className="flex items-center gap-1.5">
                      {(() => {
                        const fTheme = THEME_LIST.find(function (t) { return t.id === featured.pathway_primary })
                        return fTheme ? (
                          <>
                            <span className="w-2 h-2 rounded-full" style={{ background: fTheme.color }} />
                            <span className="text-[12px]" style={{ color: '#6B6560' }}>{fTheme.name}</span>
                          </>
                        ) : null
                      })()}
                    </div>
                    <span className="text-[12px] font-semibold" style={{ color: '#C75B2A' }}>Read more &rsaquo;</span>
                  </div>
                </div>
              </Link>
            )}

            {/* Stacked list */}
            <div className="flex flex-col gap-4">
              {sideItems.map(function (item: any) {
                const theme = THEME_LIST.find(function (t) { return t.id === item.pathway_primary })
                return (
                  <Link
                    key={item.id}
                    href={'/design2/content/' + item.id}
                    className="flex bg-white rounded-xl border overflow-hidden transition-all hover:shadow-md group"
                    style={{ borderColor: '#E2DDD5' }}
                  >
                    {/* Thumbnail */}
                    {item.image_url ? (
                      <div className="w-[110px] flex-shrink-0 overflow-hidden">
                        <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-[110px] flex-shrink-0 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${theme?.color || '#C75B2A'}15, ${theme?.color || '#C75B2A'}30)` }}>
                        <svg width="32" height="32" viewBox="0 0 64 64"><circle cx="32" cy="32" r="20" fill={theme?.color || '#C75B2A'} opacity="0.2"/><circle cx="32" cy="32" r="10" fill={theme?.color || '#C75B2A'} opacity="0.3"/></svg>
                      </div>
                    )}
                    <div className="flex-1 p-3.5 min-w-0">
                      {theme && (
                        <div className="flex items-center gap-1.5 mb-1 text-[11px] uppercase tracking-wider font-semibold" style={{ color: theme.color }}>
                          {theme.name}
                        </div>
                      )}
                      <h4 className="text-[14px] font-bold leading-snug line-clamp-2" style={{ color: '#1A1A1A' }}>
                        {item.title_6th_grade || item.title}
                      </h4>
                      {item.summary_6th_grade && (
                        <p className="text-[13px] mt-1 line-clamp-2" style={{ color: '#6B6560' }}>{item.summary_6th_grade}</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[12px]" style={{ color: '#6B6560' }}>{item.source_domain || ''}</span>
                        <span className="text-[13px] font-semibold" style={{ color: '#C75B2A' }}>Open &rsaquo;</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
