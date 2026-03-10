import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { getNewsFeed } from '@/lib/data/exchange'
import { createClient } from '@/lib/supabase/server'
import { THEMES } from '@/lib/constants'
import { FileText, Video, BookOpen, Wrench, GraduationCap, Calendar, Megaphone, Heart, ArrowRight } from 'lucide-react'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { FeaturedPromo } from '@/components/exchange/FeaturedPromo'
import { IndexWayfinder } from '@/components/exchange/IndexWayfinder'
import { WayfinderTooltipPos } from '@/components/exchange/WayfinderTooltips'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'The News Stand — Community Exchange',
  description: 'Articles, videos, guides, reports, tools, courses, and more from across the Houston community.',
}

export const revalidate = 600

function formatDate(dateStr: string | null) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  const diff = Date.now() - d.getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return hours + 'h ago'
  const days = Math.floor(hours / 24)
  if (days < 2) return 'Yesterday'
  if (days < 7) return days + ' days ago'
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function shortDate(dateStr: string | null) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function typeIcon(t: string | null) {
  if (!t) return <FileText size={14} />
  switch (t) {
    case 'video': return <Video size={14} />
    case 'guide': return <BookOpen size={14} />
    case 'tool': return <Wrench size={14} />
    case 'course': return <GraduationCap size={14} />
    case 'event': return <Calendar size={14} />
    case 'campaign': return <Megaphone size={14} />
    case 'opportunity': return <Heart size={14} />
    default: return <FileText size={14} />
  }
}

const CONTENT_TYPES = [
  { key: '', label: 'All' },
  { key: 'article', label: 'Articles' },
  { key: 'report', label: 'Reports' },
  { key: 'video', label: 'Videos' },
  { key: 'guide', label: 'Guides' },
  { key: 'tool', label: 'Tools' },
  { key: 'course', label: 'Courses' },
  { key: 'event', label: 'Events' },
  { key: 'campaign', label: 'Campaigns' },
  { key: 'opportunity', label: 'Opportunities' },
]

type Item = { id: string; title_6th_grade: string | null; summary_6th_grade: string | null; pathway_primary: string | null; center: string | null; image_url: string | null; source_url: string | null; source_domain: string | null; published_at: string | null; content_type: string | null }

function hasValidImage(item: Item) {
  return item.image_url && item.image_url.trim() && item.image_url.startsWith('http')
}

function getTheme(item: Item) {
  return item.pathway_primary ? (THEMES as Record<string, { color: string; name: string }>)[item.pathway_primary] : null
}

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ pathway?: string; type?: string }>
}) {
  const { pathway, type } = await searchParams
  const cookieStore = await cookies()
  const userZip = cookieStore.get('zip')?.value || ''

  const rawItems = await getNewsFeed(pathway, 80, type || undefined)

  // When user has a ZIP, look up matching content IDs and sort them to the top
  let items = rawItems
  if (userZip && rawItems.length > 0) {
    const supabase = await createClient()
    const { data: zipRows } = await supabase
      .from('content_zip_codes' as any)
      .select('content_id')
      .eq('zip_code', userZip)
    const localIds = new Set((zipRows || []).map(function (r: any) { return r.content_id }))
    if (localIds.size > 0) {
      items = [
        ...rawItems.filter(function (i) { return localIds.has(i.id) }),
        ...rawItems.filter(function (i) { return !localIds.has(i.id) }),
      ]
    }
  }

  const themeEntries = Object.entries(THEMES) as [string, { name: string; color: string; slug: string }][]

  // Split into hero, secondary, and the rest
  const withImages = items.filter(hasValidImage)
  const hero = withImages[0] || items[0]
  const secondary = withImages.slice(1, 4).length >= 2 ? withImages.slice(1, 4) : items.slice(1, 4)
  const usedIds = new Set([hero?.id, ...secondary.map(function (s) { return s.id })].filter(Boolean))
  const remaining = items.filter(function (i) { return !usedIds.has(i.id) })

  // Group remaining by content type for section display
  const sections: { type: string; label: string; items: Item[] }[] = []
  const typeOrder = ['article', 'report', 'video', 'guide', 'tool', 'course', 'event', 'campaign', 'opportunity']
  const typeLabels: Record<string, string> = {
    article: 'Latest Articles', report: 'Reports & Research', video: 'Watch',
    guide: 'Guides', tool: 'Tools & Resources', course: 'Courses',
    event: 'Events', campaign: 'Campaigns', opportunity: 'Opportunities',
  }

  if (!type) {
    // When showing all, group by type
    typeOrder.forEach(function (t) {
      const group = remaining.filter(function (i) { return i.content_type === t })
      if (group.length > 0) sections.push({ type: t, label: typeLabels[t] || t, items: group })
    })
    // Catch any ungrouped
    const grouped = new Set(typeOrder)
    const other = remaining.filter(function (i) { return !grouped.has(i.content_type || '') })
    if (other.length > 0) sections.push({ type: 'other', label: 'More', items: other })
  } else {
    // When filtered to one type, just show all as one section
    if (remaining.length > 0) {
      sections.push({ type: type, label: typeLabels[type] || type, items: remaining })
    }
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className="bg-brand-bg min-h-screen">
      {/* Masthead */}
      <div className="border-b border-brand-text">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
          <Breadcrumb items={[{ label: 'News Stand' }]} />
          <Link href="/centers/learning" className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider mb-2 hover:underline" style={{ color: '#3182ce' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#3182ce' }} />
            Learning Center
          </Link>
          <h1 className="font-serif text-5xl sm:text-6xl font-bold text-brand-text tracking-tight mt-2">
            The News Stand
          </h1>
          <p className="text-sm text-brand-muted mt-2 font-serif italic">{today}</p>
          <div className="flex justify-center mt-3">
            <div className="flex h-1 w-48 rounded overflow-hidden">
              {Object.values(THEMES).map(function (theme) {
                return <div key={theme.slug} className="flex-1" style={{ backgroundColor: theme.color }} />
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="border-b border-brand-border bg-white/60 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="relative flex flex-wrap items-center gap-2">
            <WayfinderTooltipPos tipKey="content_type_badge" position="bottom" />
            {CONTENT_TYPES.map(function (ct) {
              const active = (type || '') === ct.key
              const href = ct.key
                ? '/news?type=' + ct.key + (pathway ? '&pathway=' + pathway : '')
                : '/news' + (pathway ? '?pathway=' + pathway : '')
              return (
                <Link
                  key={ct.key}
                  href={href}
                  className={'text-xs px-3 py-1.5 font-medium transition-colors ' +
                    (active
                      ? 'text-brand-text border-b border-brand-text'
                      : 'text-brand-muted hover:text-brand-text')}
                >
                  {ct.label}
                </Link>
              )
            })}
            <span className="w-px h-4 bg-brand-border mx-1" />
            {themeEntries.map(function ([id, theme]) {
              const active = pathway === id
              const href = '/news?pathway=' + id + (type ? '&type=' + type : '')
              return (
                <Link
                  key={id}
                  href={active ? '/news' + (type ? '?type=' + type : '') : href}
                  className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-brand-text"
                  style={active ? { color: theme.color } : { color: '#6B6560' }}
                >
                  <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: theme.color, opacity: active ? 1 : 0.5 }} />
                  {active ? theme.name : ''}
                </Link>
              )
            })}
            {pathway && (
              <Link href={'/news' + (type ? '?type=' + type : '')} className="text-[10px] text-brand-muted hover:text-brand-text ml-1">clear</Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {items.length === 0 ? (
          <div className="text-center py-24">
            <FileText size={48} className="mx-auto text-brand-muted mb-4" />
            <p className="font-serif text-xl text-brand-muted">No content found{type ? ' for ' + type + 's' : ''}{pathway ? ' in this pathway' : ''}.</p>
          </div>
        ) : (
          <>
            {/* ABOVE THE FOLD: Hero + Secondary */}
            <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 pb-8 border-b border-brand-text">
              <WayfinderTooltipPos tipKey="source_attribution_card" position="bottom" />
              {/* Hero story */}
              {hero && (
                <Link href={'/content/' + hero.id} className="lg:col-span-7 group">
                  {hasValidImage(hero) && (
                    <div className="aspect-[16/9] rounded-lg overflow-hidden mb-4">
                      <Image
                        src={hero.image_url!}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                       width={800} height={400} />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    {getTheme(hero) && (
                      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: getTheme(hero)!.color }}>
                        {getTheme(hero)!.name}
                      </span>
                    )}
                    {hero.content_type && hero.content_type !== 'article' && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">
                        {hero.content_type}
                      </span>
                    )}
                  </div>
                  <h2 className="font-serif text-3xl sm:text-4xl font-bold text-brand-text leading-tight group-hover:text-brand-accent transition-colors">
                    {hero.title_6th_grade}
                  </h2>
                  {hero.summary_6th_grade && (
                    <p className="text-brand-muted mt-3 text-base leading-relaxed line-clamp-3">
                      {hero.summary_6th_grade}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-3 text-xs text-brand-muted">
                    {hero.source_domain && <span className="font-medium">{hero.source_domain}</span>}
                    <span>{formatDate(hero.published_at)}</span>
                  </div>
                </Link>
              )}

              {/* Secondary stories */}
              <div className="lg:col-span-5 flex flex-col divide-y divide-brand-border">
                {secondary.map(function (item, idx) {
                  const theme = getTheme(item)
                  return (
                    <Link key={item.id} href={'/content/' + item.id} className={'group flex gap-4 ' + (idx === 0 ? 'pb-5' : 'py-5')}>
                      {hasValidImage(item) ? (
                        <Image
                          src={item.image_url!}
                          alt=""
                          className="w-28 h-20 rounded-lg object-cover flex-shrink-0 group-hover:opacity-90 transition-opacity"
                         width={800} height={80} />
                      ) : (
                        <div
                          className="w-28 h-20 rounded-lg flex-shrink-0 flex items-center justify-center"
                          style={{ backgroundColor: (theme?.color || '#C75B2A') + '12' }}
                        >
                          {typeIcon(item.content_type)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        {theme && (
                          <span className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: theme.color }}>
                            {theme.name}
                          </span>
                        )}
                        <h3 className="font-serif text-lg font-bold text-brand-text leading-snug group-hover:text-brand-accent transition-colors line-clamp-3">
                          {item.title_6th_grade}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-brand-muted">
                          {item.source_domain && <span>{item.source_domain}</span>}
                          <span>{shortDate(item.published_at)}</span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* SECTIONS BY CONTENT TYPE */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
              {/* Main column */}
              <div className="lg:col-span-8">
                {sections.map(function (section) {
                  return (
                    <section key={section.type} className="mb-10">
                      {/* Section header */}
                      <div className="flex items-center gap-3 mb-4 pb-2 border-b border-brand-text">
                        <span className="text-brand-muted">{typeIcon(section.type)}</span>
                        <h2 className="font-serif text-xl font-bold text-brand-text">{section.label}</h2>
                        <span className="text-xs text-brand-muted">{section.items.length}</span>
                      </div>

                      {/* First item large if it has an image */}
                      {hasValidImage(section.items[0]) && (
                        <Link href={'/content/' + section.items[0].id} className="group block mb-5">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="aspect-[16/10] rounded-lg overflow-hidden">
                              <Image
                                src={section.items[0].image_url!}
                                alt=""
                                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                               width={800} height={400} />
                            </div>
                            <div>
                              {getTheme(section.items[0]) && (
                                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: getTheme(section.items[0])!.color }}>
                                  {getTheme(section.items[0])!.name}
                                </span>
                              )}
                              <h3 className="font-serif text-xl font-bold text-brand-text leading-snug mt-1 group-hover:text-brand-accent transition-colors">
                                {section.items[0].title_6th_grade}
                              </h3>
                              {section.items[0].summary_6th_grade && (
                                <p className="text-sm text-brand-muted mt-2 line-clamp-3 leading-relaxed">
                                  {section.items[0].summary_6th_grade}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2 text-[11px] text-brand-muted">
                                {section.items[0].source_domain && <span className="font-medium">{section.items[0].source_domain}</span>}
                                <span>{shortDate(section.items[0].published_at)}</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      )}

                      {/* Remaining items */}
                      <div className="divide-y divide-brand-border/60">
                        {section.items.slice(hasValidImage(section.items[0]) ? 1 : 0).map(function (item) {
                          const theme = getTheme(item)
                          return (
                            <Link
                              key={item.id}
                              href={'/content/' + item.id}
                              className="group flex items-start gap-4 py-3 hover:bg-white/50 -mx-3 px-3 rounded-lg transition-colors"
                            >
                              {hasValidImage(item) ? (
                                <Image src={item.image_url!} alt="" className="w-20 h-14 rounded object-cover flex-shrink-0"  width={800} height={56} />
                              ) : (
                                <div
                                  className="w-20 h-14 rounded flex-shrink-0 flex items-center justify-center"
                                  style={{ backgroundColor: (theme?.color || '#C75B2A') + '10' }}
                                >
                                  {typeIcon(item.content_type)}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h3 className="font-serif text-base font-semibold text-brand-text group-hover:text-brand-accent transition-colors line-clamp-2 leading-snug">
                                  {item.title_6th_grade}
                                </h3>
                                <div className="flex items-center gap-2 mt-1 text-[11px] text-brand-muted">
                                  {theme && (
                                    <span className="w-1.5 h-1.5 rounded-sm flex-shrink-0" style={{ backgroundColor: theme.color }} />
                                  )}
                                  {item.source_domain && <span>{item.source_domain}</span>}
                                  <span>{shortDate(item.published_at)}</span>
                                </div>
                              </div>
                              <ArrowRight size={14} className="text-brand-muted/30 group-hover:text-brand-accent flex-shrink-0 mt-1 transition-colors" />
                            </Link>
                          )
                        })}
                      </div>
                    </section>
                  )
                })}
              </div>

              {/* Sidebar */}
              <aside className="lg:col-span-4 hidden lg:block">
                <div className="sticky top-24 space-y-4">
                  <IndexWayfinder
                    currentPage="news"
                    color="#319795"
                    related={[
                      { label: 'Library', href: '/library' },
                      { label: 'Events', href: '/calendar' },
                      { label: 'Topics', href: '/pathways' },
                    ]}
                  />
                  <FeaturedPromo variant="card" />
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
