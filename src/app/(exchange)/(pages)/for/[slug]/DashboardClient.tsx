'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ChevronRight, ChevronDown, ExternalLink } from 'lucide-react'
import {
  SeekerIcon, LearnerIcon, BuilderIcon,
  WatchdogIcon, PartnerIcon, ExplorerIcon,
} from '@/components/exchange/FlowerIcons'
import type { ArchetypeDashboardData } from '@/lib/data/exchange'
import Image from 'next/image'

const ICONS: Record<string, typeof SeekerIcon> = {
  seeker: SeekerIcon, learner: LearnerIcon, builder: BuilderIcon,
  watchdog: WatchdogIcon, partner: PartnerIcon, explorer: ExplorerIcon,
}

const OTHER_PERSONAS = [
  { slug: 'seeker', name: 'The Seeker', desc: 'Find resources', color: '#d69e2e' },
  { slug: 'learner', name: 'The Learner', desc: 'Understand issues', color: '#3182ce' },
  { slug: 'builder', name: 'The Builder', desc: 'Take action', color: '#38a169' },
  { slug: 'watchdog', name: 'The Watchdog', desc: 'Track accountability', color: '#805ad5' },
  { slug: 'partner', name: 'The Partner', desc: 'Collaborate', color: '#dd6b20' },
  { slug: 'explorer', name: 'The Explorer', desc: 'Discover it all', color: '#E8723A' },
]

const CENTER_META: Record<string, { label: string; question: string; color: string; icon: string; entities: string[] }> = {
  Learning: {
    label: 'Learning Center', question: 'How can I understand?', color: '#3182ce',
    icon: 'M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342',
    entities: ['learningPaths', 'library'],
  },
  Resource: {
    label: 'Resource Center', question: "What's available to me?", color: '#d69e2e',
    icon: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25',
    entities: ['services', 'opportunities'],
  },
  Action: {
    label: 'Action Center', question: 'How can I help?', color: '#38a169',
    icon: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z',
    entities: ['opportunities', 'services'],
  },
  Accountability: {
    label: 'Accountability Center', question: 'Who makes decisions?', color: '#805ad5',
    icon: 'M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418',
    entities: ['officials', 'policies'],
  },
}

const CONTENT_TYPE_META: Record<string, { label: string; effort: string }> = {
  article: { label: 'Articles', effort: '~5 min' },
  report: { label: 'Reports', effort: '~15 min' },
  video: { label: 'Videos', effort: '~10 min' },
  event: { label: 'Events', effort: '1-3 hrs' },
  tool: { label: 'Tools', effort: 'Interactive' },
  course: { label: 'Courses', effort: '30-90 min' },
  guide: { label: 'Guides', effort: '~10 min' },
  campaign: { label: 'Campaigns', effort: 'Ongoing' },
  opportunity: { label: 'Opportunities', effort: 'Varies' },
}

const THEMES: Record<string, { name: string; color: string }> = {
  THEME_01: { name: 'Health', color: '#e53e3e' },
  THEME_02: { name: 'Families', color: '#dd6b20' },
  THEME_03: { name: 'Neighborhood', color: '#d69e2e' },
  THEME_04: { name: 'Voice', color: '#38a169' },
  THEME_05: { name: 'Money', color: '#3182ce' },
  THEME_06: { name: 'Planet', color: '#319795' },
  THEME_07: { name: 'The Bigger We', color: '#805ad5' },
}

function hasValidImage(url: string | null): boolean {
  return !!url && url.startsWith('http')
}

interface Props {
  slug: string
  config: {
    name: string; tagline: string; description: string; color: string; folImage: string
    primaryCenter: string; heroQuestion: string; centerOrder: string[]
    quickActions: Array<{ label: string; href: string; color: string; effort?: string }>
    externalLinks?: Array<{ label: string; href: string; description: string }>
  }
  data: ArchetypeDashboardData
  quote: { quote_text: string; attribution?: string } | null
  pathways: Array<{ id: string; name: string; color: string; slug: string }>
}

export function DashboardClient({ slug, config, data, quote, pathways }: Props) {
  const Icon = ICONS[slug] || ExplorerIcon
  const [activeCenter, setActiveCenter] = useState(config.centerOrder[0])
  const [pathwayFilter, setPathwayFilter] = useState<string | null>(null)

  const centerContent = useMemo(function () {
    const items = data.contentByCenter[activeCenter] || []
    if (!pathwayFilter) return items
    return items.filter(function (c: any) { return c.pathway === pathwayFilter })
  }, [data.contentByCenter, activeCenter, pathwayFilter])

  const contentByType = useMemo(function () {
    const groups: Record<string, any[]> = {}
    for (const item of centerContent) {
      const t = (item as any).content_type || 'other'
      if (!groups[t]) groups[t] = []
      groups[t].push(item)
    }
    return groups
  }, [centerContent])

  const filteredLearningPaths = useMemo(function () {
    if (!pathwayFilter) return data.learningPaths
    return data.learningPaths.filter(function (lp: any) { return lp.theme_id === pathwayFilter })
  }, [data.learningPaths, pathwayFilter])

  const filteredGuides = useMemo(function () {
    if (!pathwayFilter) return data.guides
    return data.guides.filter(function (g: any) { return g.theme_id === pathwayFilter })
  }, [data.guides, pathwayFilter])

  const filteredLibrary = useMemo(function () {
    if (!pathwayFilter) return data.libraryDocs
    return data.libraryDocs.filter(function (d: any) { return (d.theme_ids || []).includes(pathwayFilter!) })
  }, [data.libraryDocs, pathwayFilter])

  const centerMeta = CENTER_META[activeCenter]

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* ── Hero: Tight identity + quick actions ── */}
      <section className="relative overflow-hidden border-b border-brand-border" style={{ background: config.color + '06' }}>
        <Image src={config.folImage} alt="" aria-hidden="true"
          className="absolute right-[-40px] top-1/2 -translate-y-1/2 w-[300px] h-[300px] pointer-events-none opacity-[0.03]"  width={200} height={200} />
        <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-1.5 text-[11px] text-brand-muted mb-2">
            <Link href="/" className="hover:text-brand-accent transition-colors">Home</Link>
            <ChevronRight size={10} />
            <span className="text-brand-text font-medium">{config.name}</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-11 h-11 flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: config.color + '12', border: '1.5px solid ' + config.color + '25' }}>
                <Icon size={28} color={config.color} />
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-xl sm:text-2xl font-bold text-brand-text leading-tight">{config.name}</h1>
                <p className="text-xs text-brand-muted">{config.tagline}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 sm:flex-shrink-0">
              {config.quickActions.map(function (a) {
                return (
                  <Link key={a.label} href={a.href}
                    className="group flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-brand-border hover:border-brand-accent hover:-translate-y-0.5 transition-all text-xs">
                    <span className="w-0.5 h-4 rounded-sm" style={{ backgroundColor: a.color }} />
                    <span className="font-medium text-brand-text">{a.label}</span>
                    {a.effort && <span className="text-[9px] text-brand-muted">{a.effort}</span>}
                  </Link>
                )
              })}
              {config.externalLinks?.map(function (link) {
                return (
                  <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer"
                    className="group flex items-center gap-1.5 px-2.5 py-1.5 bg-white border-2 hover:-translate-y-0.5 transition-all text-xs"
                    style={{ borderColor: config.color }}>
                    <span className="font-bold" style={{ color: config.color }}>{link.label}</span>
                    <ExternalLink size={10} style={{ color: config.color }} />
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Center tabs + pathway filter (combined toolbar) ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-brand-border shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto">
            {config.centerOrder.map(function (center) {
              const meta = CENTER_META[center]
              const isActive = activeCenter === center
              const count = (data.contentByCenter[center] || []).length
              return (
                <button key={center} onClick={function () { setActiveCenter(center) }}
                  className={'flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 -mb-px whitespace-nowrap transition-colors ' +
                    (isActive ? 'border-current text-brand-text' : 'border-transparent text-brand-muted hover:text-brand-text')}
                  style={isActive ? { color: meta.color, borderColor: meta.color } : undefined}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d={meta.icon} />
                  </svg>
                  {meta.label.replace(' Center', '')}
                  <span className="text-[10px] opacity-50">({count})</span>
                </button>
              )
            })}
            <div className="ml-auto flex items-center gap-1 pl-3 flex-shrink-0">
              <button onClick={function () { setPathwayFilter(null) }}
                className={'px-2 py-1 text-[10px] font-semibold rounded transition-colors ' +
                  (!pathwayFilter ? 'bg-brand-text text-white' : 'text-brand-muted hover:bg-brand-bg-alt')}>
                All
              </button>
              {pathways.map(function (pw) {
                const isActive = pathwayFilter === pw.id
                return (
                  <button key={pw.id} onClick={function () { setPathwayFilter(isActive ? null : pw.id) }}
                    title={pw.name}
                    className={'w-5 h-5 rounded transition-all flex-shrink-0 ' + (isActive ? 'ring-2 ring-offset-1' : 'opacity-60 hover:opacity-100')}
                    style={{ backgroundColor: pw.color, ...(isActive ? { ringColor: pw.color } as any : {}) }}
                  />
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Dashboard body ── */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Center question as section header */}
        <p className="text-sm font-display italic mb-3" style={{ color: centerMeta.color }}>
          {centerMeta.question}
        </p>

        <div className="flex flex-col lg:flex-row gap-4">
          {/* ── Main column ── */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Content by type — compact accordion */}
            {Object.entries(contentByType).map(function ([type, items]) {
              const typeInfo = CONTENT_TYPE_META[type] || { label: type, effort: '' }
              return <ContentTypeSection key={type} type={type} items={items} typeInfo={typeInfo} centerColor={centerMeta.color} />
            })}

            {centerContent.length === 0 && (
              <p className="text-sm text-brand-muted py-8 text-center">No content in this center{pathwayFilter ? ' for this pathway' : ''}.</p>
            )}

            {/* ── Entity panels — contextual to center ── */}
            {activeCenter === 'Accountability' && (
              <>
                {data.officials.length > 0 && (
                  <EntityPanel title="Elected Officials" items={data.officials.slice(0, 8)} color={centerMeta.color} seeAllHref="/officials">
                    {function (o: any) {
                      return (
                        <Link key={o.official_id} href={'/officials/' + o.official_id}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-brand-bg-alt/50 transition-colors">
                          {o.photo_url && <Image src={o.photo_url} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0"  width={80} height={28} />}
                          <span className="text-xs font-medium text-brand-text flex-1 min-w-0 truncate">{o.official_name}</span>
                          <span className="text-[10px] text-brand-muted flex-shrink-0">{o.title}</span>
                        </Link>
                      )
                    }}
                  </EntityPanel>
                )}
                {data.policies.length > 0 && (
                  <EntityPanel title="Active Policies" items={data.policies.slice(0, 8)} color={centerMeta.color} seeAllHref="/policies">
                    {function (p: any) {
                      return (
                        <Link key={p.policy_id} href={'/policies/' + p.policy_id}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-brand-bg-alt/50 transition-colors">
                          <span className="text-xs font-medium text-brand-text flex-1 min-w-0 truncate">{p.policy_name}</span>
                          {p.status && <span className="text-[10px] font-medium" style={{ color: centerMeta.color }}>{p.status}</span>}
                        </Link>
                      )
                    }}
                  </EntityPanel>
                )}
              </>
            )}

            {activeCenter === 'Resource' && data.services.length > 0 && (
              <EntityPanel title="Community Services" items={data.services.slice(0, 8)} color={centerMeta.color} seeAllHref="/services">
                {function (s: any) {
                  return (
                    <Link key={s.service_id} href={'/services/' + s.service_id}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-brand-bg-alt/50 transition-colors">
                      <span className="text-xs font-medium text-brand-text flex-1 min-w-0 truncate">{s.service_name}</span>
                      {s.category && <span className="text-[10px] text-brand-muted flex-shrink-0">{s.category}</span>}
                    </Link>
                  )
                }}
              </EntityPanel>
            )}

            {(activeCenter === 'Action' || activeCenter === 'Resource') && data.opportunities.length > 0 && (
              <EntityPanel title="Opportunities" items={data.opportunities.slice(0, 8)} color={centerMeta.color} seeAllHref="/opportunities">
                {function (o: any) {
                  return (
                    <Link key={o.opportunity_id} href={'/opportunities/' + o.opportunity_id}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-brand-bg-alt/50 transition-colors">
                      <span className="text-xs font-medium text-brand-text flex-1 min-w-0 truncate">{o.title}</span>
                      {o.org_name && <span className="text-[10px] text-brand-muted flex-shrink-0">{o.org_name}</span>}
                    </Link>
                  )
                }}
              </EntityPanel>
            )}
          </div>

          {/* ── Sidebar: compact, no wasted space ── */}
          <aside className="lg:w-[300px] flex-shrink-0 space-y-3">
            {/* Learning Paths */}
            {filteredLearningPaths.length > 0 && (
              <SidebarCard title="Learning Paths" icon={CENTER_META.Learning.icon} iconColor={CENTER_META.Learning.color} seeAllHref="/learn">
                {filteredLearningPaths.map(function (lp: any) {
                  const pw = lp.theme_id ? THEMES[lp.theme_id] : null
                  return (
                    <Link key={lp.path_id} href={'/learning/' + lp.path_id}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-brand-bg-alt/50 transition-colors">
                      <span className="w-1 h-6 rounded-sm flex-shrink-0" style={{ backgroundColor: pw?.color || config.color }} />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium text-brand-text line-clamp-1">{lp.path_name}</span>
                        <div className="flex gap-2">
                          {lp.estimated_minutes && <span className="text-[10px] text-brand-muted">~{lp.estimated_minutes} min</span>}
                          {lp.difficulty_level && <span className="text-[10px]" style={{ color: pw?.color || config.color }}>{lp.difficulty_level}</span>}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </SidebarCard>
            )}

            {/* Guides */}
            {filteredGuides.length > 0 && (
              <SidebarCard title="Community Guides" iconColor={config.color} seeAllHref="/guides">
                {filteredGuides.map(function (g: any) {
                  return (
                    <Link key={g.guide_id} href={'/guides/' + g.slug}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-brand-bg-alt/50 transition-colors">
                      {g.hero_image_url && <Image src={g.hero_image_url} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0"  width={800} height={32} />}
                      <span className="text-xs font-medium text-brand-text flex-1 min-w-0 line-clamp-2">{g.title}</span>
                    </Link>
                  )
                })}
              </SidebarCard>
            )}

            {/* Research Library */}
            {filteredLibrary.length > 0 && (
              <SidebarCard title="Research Library" iconColor="#805ad5" seeAllHref="/library">
                {filteredLibrary.slice(0, 4).map(function (doc: any) {
                  return (
                    <Link key={doc.id} href={'/library/' + doc.id}
                      className="block px-3 py-2 hover:bg-brand-bg-alt/50 transition-colors">
                      <span className="text-xs font-medium text-brand-text line-clamp-1">{doc.title}</span>
                      {doc.tags && doc.tags.length > 0 && (
                        <div className="flex gap-1 mt-0.5">
                          {doc.tags.slice(0, 2).map(function (tag: string) {
                            return <span key={tag} className="text-[9px] text-brand-muted bg-brand-bg-alt px-1 rounded">{tag}</span>
                          })}
                        </div>
                      )}
                    </Link>
                  )
                })}
              </SidebarCard>
            )}

            {/* Pathways */}
            <div className="bg-white border border-brand-border overflow-hidden">
              <div className="px-3 py-2 border-b border-brand-border">
                <h3 className="font-display font-bold text-xs text-brand-text">Explore Pathways</h3>
              </div>
              <div className="p-2 space-y-px">
                {pathways.map(function (pw) {
                  const count = data.contentCountsByPathway[pw.id] || 0
                  return (
                    <Link key={pw.id} href={'/pathways/' + pw.slug}
                      className="flex items-center gap-2 px-2 py-1 rounded text-xs font-medium text-brand-text hover:bg-brand-bg-alt transition-colors">
                      <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: pw.color }} />
                      <span className="flex-1">{pw.name}</span>
                      {count > 0 && <span className="text-[10px] text-brand-muted">{count}</span>}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Quote */}
            {quote && (
              <div className=" border border-brand-border px-3 py-3" style={{ background: config.color + '05' }}>
                <blockquote>
                  <p className="font-display text-xs italic text-brand-text leading-relaxed">"{quote.quote_text}"</p>
                  {quote.attribution && (
                    <footer className="mt-1.5 text-[10px] font-semibold" style={{ color: config.color }}>
                      — {quote.attribution}
                    </footer>
                  )}
                </blockquote>
              </div>
            )}

            {/* Other journeys — very compact */}
            <div className="bg-white border border-brand-border overflow-hidden">
              <div className="px-3 py-2 border-b border-brand-border">
                <h3 className="font-display font-bold text-xs text-brand-text">Other Journeys</h3>
              </div>
              <div className="p-1.5 grid grid-cols-1 gap-px">
                {OTHER_PERSONAS.filter(function (p) { return p.slug !== slug }).map(function (p) {
                  const OtherIcon = ICONS[p.slug]
                  return (
                    <Link key={p.slug} href={'/for/' + p.slug}
                      className="group flex items-center gap-2 px-2 py-1.5 rounded hover:bg-brand-bg-alt transition-colors">
                      <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: p.color + '12' }}>
                        <OtherIcon size={14} color={p.color} />
                      </div>
                      <span className="text-xs font-medium text-brand-text">{p.name}</span>
                      <span className="text-[10px] text-brand-muted ml-auto">{p.desc}</span>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Crisis line — minimal */}
            <p className="text-[10px] text-brand-muted px-1">
              Need help? <span className="font-bold text-brand-text">211</span> / <span className="font-bold text-brand-text">311</span> / <span className="font-bold text-brand-text">988</span>
            </p>
          </aside>
        </div>
      </div>
    </div>
  )
}

/* ── Content type accordion section ── */
function ContentTypeSection({ type, items, typeInfo, centerColor }: {
  type: string; items: any[]; typeInfo: { label: string; effort: string }; centerColor: string
}) {
  const [open, setOpen] = useState(true)
  return (
    <div className="bg-white border border-brand-border overflow-hidden">
      <button onClick={function () { setOpen(!open) }}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-brand-bg-alt/30 transition-colors">
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: centerColor }} />
        <span className="font-semibold text-xs text-brand-text flex-1">{typeInfo.label}</span>
        <span className="text-[9px] text-brand-muted bg-brand-bg-alt px-1.5 py-0.5 rounded">{typeInfo.effort}</span>
        <span className="text-[10px] font-bold" style={{ color: centerColor }}>{items.length}</span>
        {open ? <ChevronDown size={12} className="text-brand-muted" /> : <ChevronRight size={12} className="text-brand-muted" />}
      </button>
      {open && (
        <div className="border-t border-brand-border divide-y divide-brand-border/40">
          {items.slice(0, 6).map(function (item: any) {
            const pw = item.pathway ? THEMES[item.pathway] : null
            return (
              <Link key={item.id} href={'/content/' + item.id}
                className="flex items-start gap-2 px-3 py-2 hover:bg-brand-bg-alt/30 transition-colors">
                {hasValidImage(item.image_url) && (
                  <Image src={item.image_url!} alt="" className="w-14 h-10 rounded object-cover flex-shrink-0 mt-0.5"  width={800} height={40} />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-medium text-brand-text leading-snug line-clamp-2">{item.title}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    {pw && (
                      <span className="inline-flex items-center gap-1 text-[9px]" style={{ color: pw.color }}>
                        <span className="w-1 h-1 rounded-full" style={{ backgroundColor: pw.color }} />{pw.name}
                      </span>
                    )}
                    {item.source_domain && <span className="text-[9px] text-brand-muted">{item.source_domain}</span>}
                  </div>
                </div>
              </Link>
            )
          })}
          {items.length > 6 && (
            <div className="px-3 py-1.5">
              <Link href={'/news?center=' + type} className="text-[10px] font-medium hover:underline" style={{ color: centerColor }}>
                View all {items.length} {typeInfo.label.toLowerCase()}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Entity panel ── */
function EntityPanel({ title, items, color, seeAllHref, children }: {
  title: string; items: any[]; color: string; seeAllHref: string
  children: (item: any) => React.ReactNode
}) {
  const [open, setOpen] = useState(true)
  return (
    <div className="bg-white border border-brand-border overflow-hidden">
      <button onClick={function () { setOpen(!open) }}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-brand-bg-alt/30 transition-colors">
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <span className="font-semibold text-xs text-brand-text flex-1">{title}</span>
        <span className="text-[10px] font-bold" style={{ color }}>{items.length}</span>
        {open ? <ChevronDown size={12} className="text-brand-muted" /> : <ChevronRight size={12} className="text-brand-muted" />}
      </button>
      {open && (
        <div className="border-t border-brand-border divide-y divide-brand-border/40">
          {items.map(children)}
          <div className="px-3 py-1.5">
            <Link href={seeAllHref} className="text-[10px] font-medium hover:underline" style={{ color }}>
              View all {title.toLowerCase()}
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Sidebar card wrapper ── */
function SidebarCard({ title, icon, iconColor, seeAllHref, children }: {
  title: string; icon?: string; iconColor: string; seeAllHref?: string; children: React.ReactNode
}) {
  return (
    <div className="bg-white border border-brand-border overflow-hidden">
      <div className="px-3 py-2 border-b border-brand-border flex items-center gap-1.5">
        {icon && (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={iconColor}>
            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
          </svg>
        )}
        <h3 className="font-display font-bold text-xs text-brand-text">{title}</h3>
        {seeAllHref && <Link href={seeAllHref} className="text-[9px] text-brand-accent font-medium ml-auto">Browse</Link>}
      </div>
      <div className="divide-y divide-brand-border/40">
        {children}
      </div>
    </div>
  )
}
