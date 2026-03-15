/**
 * @fileoverview Pathway hub — the on-ramp into community engagement.
 *
 * Content is the hero: books, films, events, DIY kits, stories, research.
 * That's what draws people in. Organizations, services, officials, and policies
 * provide context and depth below.
 *
 * @route GET /pathways/:slug
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { THEMES } from '@/lib/constants'
import {
  getPathwayBraidedFeed,
  getFocusAreas,
  getRelatedOrgsForGuide,
  getRelatedOpportunities,
  getBridgesForPathway,
} from '@/lib/data/exchange'
import { FlowerOfLife } from '@/components/geo/sacred'
import { FolFallback } from '@/components/ui/FolFallback'
import {
  BookOpen, Film, Calendar, Wrench, FileText, Mic,
  GraduationCap, BarChart3, Newspaper, ArrowRight,
  MapPin, Users, ExternalLink,
} from 'lucide-react'

/* ── Helpers ─────────────────────────────────────────────────────────── */

function resolveTheme(slug: string) {
  for (const [id, theme] of Object.entries(THEMES)) {
    if (theme.slug === slug) return { id, ...theme }
  }
  return null
}

const THEME_LIST = Object.entries(THEMES).map(function ([id, t]) {
  return { id, ...t }
})

/** Format shelves — the editorial categories users browse */
const FORMAT_SHELVES = [
  { key: 'book',      label: 'Books & Reading',    icon: BookOpen,      types: ['book'] },
  { key: 'video',     label: 'Films & Videos',     icon: Film,          types: ['video', 'documentary', 'film'] },
  { key: 'event',     label: 'Events & Webinars',  icon: Calendar,      types: ['event', 'webinar', 'workshop', 'conference'] },
  { key: 'diy',       label: 'DIY Kits & Tools',   icon: Wrench,        types: ['diy_kit', 'tool', 'toolkit', 'template'] },
  { key: 'story',     label: 'Stories & News',      icon: Newspaper,     types: ['article', 'news', 'story', 'interview', 'op-ed', 'opinion'] },
  { key: 'research',  label: 'Research & Reports',  icon: BarChart3,     types: ['report', 'research', 'study', 'white_paper', 'data'] },
  { key: 'course',    label: 'Courses & Learning',  icon: GraduationCap, types: ['course', 'curriculum', 'lesson'] },
  { key: 'podcast',   label: 'Podcasts & Audio',    icon: Mic,           types: ['podcast', 'audio'] },
  { key: 'guide',     label: 'Guides & How-Tos',    icon: FileText,      types: ['guide', 'how-to', 'explainer', 'infographic'] },
]

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const theme = resolveTheme(slug)
  if (!theme) return { title: 'Not Found' }
  return {
    title: `${theme.name} — Community Exchange`,
    description: theme.description,
  }
}

export default async function PathwayHubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const theme = resolveTheme(slug)
  if (!theme) notFound()

  const [feed, allFocusAreas, bridgeData] = await Promise.all([
    getPathwayBraidedFeed(theme.id),
    getFocusAreas(),
    getBridgesForPathway(theme.id),
  ])

  const themeFocusAreas = allFocusAreas.filter(fa => fa.theme_id === theme.id)
  const focusAreaIds = themeFocusAreas.map(fa => fa.focus_id)

  const [orgs, opportunities] = await Promise.all([
    getRelatedOrgsForGuide(focusAreaIds),
    getRelatedOpportunities(focusAreaIds),
  ])

  const content = feed.content || []
  const services = feed.services || []
  const officials = feed.officials || []
  const policies = feed.policies || []

  // ── Build format shelves from content ──
  const shelved = new Set<string>()
  const shelves = FORMAT_SHELVES.map(function (shelf) {
    const items = content.filter(function (c: any) {
      const ct = (c.content_type || '').toLowerCase()
      return shelf.types.includes(ct) && !shelved.has(c.id)
    })
    items.forEach(function (c: any) { shelved.add(c.id) })
    return { ...shelf, items }
  }).filter(function (s) { return s.items.length > 0 })

  // Unshelved content goes into a "More Resources" section
  const unshelved = content.filter(function (c: any) { return !shelved.has(c.id) })

  // Pick the best featured item (has image, preferably a book/video/event)
  const featured = content.find(function (c: any) {
    return c.image_url && ['book', 'video', 'documentary', 'film', 'event'].includes((c.content_type || '').toLowerCase())
  }) || content.find(function (c: any) { return c.image_url }) || content[0] || null

  return (
    <div className="min-h-screen bg-white">
      {/* ── Hero Header ── */}
      <div style={{ background: theme.color }}>
        <div className="max-w-[1080px] mx-auto px-6 py-10 md:py-14">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/pathways" className="text-sm text-white/70 hover:text-white transition-colors">
              All pathways
            </Link>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-3">
            {theme.name}
          </h1>
          <p className="text-lg text-white/85 max-w-2xl leading-relaxed">
            {theme.description}
          </p>

          {/* Pathway nav */}
          <div className="flex items-center gap-1 mt-8 overflow-x-auto pb-1">
            {THEME_LIST.map(function (t) {
              const isCurrent = t.id === theme.id
              return (
                <Link
                  key={t.id}
                  href={'/pathways/' + t.slug}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm whitespace-nowrap transition-all rounded-full"
                  style={{
                    background: isCurrent ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
                    color: '#ffffff',
                  }}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: isCurrent ? '#ffffff' : t.color }} />
                  {t.name}
                </Link>
              )
            })}
          </div>

          {/* Format quick-jump pills */}
          {shelves.length > 1 && (
            <div className="flex flex-wrap gap-2 mt-5">
              {shelves.map(function (shelf) {
                const Icon = shelf.icon
                return (
                  <a
                    key={shelf.key}
                    href={'#' + shelf.key}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-white/90 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <Icon size={14} />
                    {shelf.label}
                    <span className="text-white/50 ml-0.5">({shelf.items.length})</span>
                  </a>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-[1080px] mx-auto px-6">

        {/* ════════════════════════════════════════════════════════════════
            THE CONTENT — This is the heart of the pathway.
            Format-based shelves: Books, Films, Events, DIY Kits, etc.
           ════════════════════════════════════════════════════════════════ */}

        {/* ── Featured Hero ── */}
        {featured && (
          <section className="py-10">
            <Link
              href={'/content/' + featured.id}
              className="group grid grid-cols-1 lg:grid-cols-2 gap-0 bg-white border border-rule overflow-hidden hover:shadow-lg transition-all"
            >
              <div className="h-[280px] lg:h-full overflow-hidden">
                {featured.image_url ? (
                  <Image
                    src={featured.image_url}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    width={800}
                    height={500}
                  />
                ) : (
                  <FolFallback pathway={theme.id} size="hero" />
                )}
              </div>
              <div className="p-8 flex flex-col justify-center">
                {(featured as any).content_type && (
                  <span className="inline-block text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: theme.color }}>
                    {(featured as any).content_type === 'diy_kit' ? 'DIY Kit' : (featured as any).content_type.charAt(0).toUpperCase() + (featured as any).content_type.slice(1)}
                  </span>
                )}
                <h2 className="font-display text-2xl md:text-3xl font-bold text-ink leading-snug mb-3 group-hover:underline decoration-2 underline-offset-4">
                  {featured.title_6th_grade || 'Untitled'}
                </h2>
                {featured.summary_6th_grade && (
                  <p className="text-base text-muted leading-relaxed line-clamp-4">{featured.summary_6th_grade}</p>
                )}
                <div className="flex items-center gap-3 mt-4">
                  <span className="text-sm font-semibold" style={{ color: theme.color }}>
                    Read more <ArrowRight size={14} className="inline ml-1" />
                  </span>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* ── Format Shelves ── */}
        {shelves.map(function (shelf) {
          const Icon = shelf.icon
          return (
            <section key={shelf.key} id={shelf.key} className="py-8 border-t border-rule">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: theme.color + '12' }}>
                  <Icon size={20} style={{ color: theme.color }} />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold text-ink">{shelf.label}</h2>
                  <p className="text-sm text-muted">{shelf.items.length} {shelf.items.length === 1 ? 'resource' : 'resources'}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {shelf.items.slice(0, 9).map(function (item: any) {
                  return (
                    <Link
                      key={item.id}
                      href={'/content/' + item.id}
                      className="group bg-white border border-rule rounded-xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all"
                    >
                      <div className="h-[160px] overflow-hidden">
                        {item.image_url ? (
                          <Image src={item.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" width={400} height={280} />
                        ) : (
                          <FolFallback pathway={theme.id} height="h-[160px]" />
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-base font-bold text-ink leading-snug line-clamp-2 group-hover:underline decoration-1 underline-offset-2">
                          {item.title_6th_grade || 'Untitled'}
                        </h3>
                        {item.summary_6th_grade && (
                          <p className="text-sm text-muted mt-2 line-clamp-2 leading-relaxed">{item.summary_6th_grade}</p>
                        )}
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-rule">
                          {item.source_domain && (
                            <span className="text-sm text-muted">{item.source_domain}</span>
                          )}
                          {item.published_at && (
                            <span className="text-sm text-muted ml-auto">
                              {new Date(item.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
              {shelf.items.length > 9 && (
                <div className="mt-4 text-center">
                  <Link href={'/search?pathway=' + theme.id + '&type=' + shelf.types[0]} className="text-sm font-semibold hover:underline" style={{ color: theme.color }}>
                    View all {shelf.items.length} {shelf.label.toLowerCase()} <ArrowRight size={14} className="inline ml-1" />
                  </Link>
                </div>
              )}
            </section>
          )
        })}

        {/* ── Unshelved content (no specific type) ── */}
        {unshelved.length > 0 && (
          <section className="py-8 border-t border-rule">
            <h2 className="font-display text-2xl font-bold text-ink mb-6">More Resources</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {unshelved.slice(0, 12).map(function (item: any) {
                return (
                  <Link
                    key={item.id}
                    href={'/content/' + item.id}
                    className="group bg-white border border-rule rounded-xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all"
                  >
                    {item.image_url ? (
                      <div className="h-[140px] overflow-hidden">
                        <Image src={item.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" width={400} height={280} />
                      </div>
                    ) : (
                      <FolFallback pathway={theme.id} height="h-[140px]" />
                    )}
                    <div className="p-4">
                      {item.content_type && (
                        <span className="text-sm font-semibold uppercase tracking-wide" style={{ color: theme.color }}>
                          {item.content_type === 'diy_kit' ? 'DIY Kit' : item.content_type.charAt(0).toUpperCase() + item.content_type.slice(1)}
                        </span>
                      )}
                      <h3 className="text-base font-bold text-ink leading-snug line-clamp-2 mt-1 group-hover:underline">
                        {item.title_6th_grade || 'Untitled'}
                      </h3>
                      {item.source_domain && (
                        <span className="text-sm text-muted mt-2 block">{item.source_domain}</span>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════════════════════════════
            THE CONTEXT — Who's doing this work, how to get involved
           ════════════════════════════════════════════════════════════════ */}

        {/* ── Get Involved ── */}
        {opportunities.length > 0 && (
          <section className="py-10 border-t-4" style={{ borderColor: theme.color }}>
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-ink">Get Involved</h2>
                <p className="text-sm text-muted mt-1">Volunteer, attend, or sign up</p>
              </div>
              <Link href={'/opportunities?pathway=' + theme.id} className="text-sm font-semibold hover:underline" style={{ color: theme.color }}>
                See all <ArrowRight size={14} className="inline ml-1" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {opportunities.slice(0, 6).map(function (opp: any) {
                return (
                  <Link
                    key={opp.opportunity_id}
                    href={'/opportunities/' + opp.opportunity_id}
                    className="p-5 bg-white border border-rule rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all group"
                  >
                    <h3 className="text-base font-bold text-ink leading-snug group-hover:underline line-clamp-2">
                      {opp.opportunity_name}
                    </h3>
                    {opp.description_5th_grade && (
                      <p className="text-sm text-muted mt-2 line-clamp-2">{opp.description_5th_grade}</p>
                    )}
                    <div className="flex items-center gap-2 mt-3 text-sm text-muted">
                      {opp.start_date && (
                        <span><Calendar size={13} className="inline mr-1" />{new Date(opp.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      )}
                      {opp.is_virtual && <span className="font-semibold" style={{ color: theme.color }}>Virtual</span>}
                      {opp.time_commitment && <span>&middot; {opp.time_commitment}</span>}
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Organizations ── */}
        {orgs.length > 0 && (
          <section className="py-10 border-t border-rule">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-ink">Organizations</h2>
                <p className="text-sm text-muted mt-1">Local groups doing this work in Houston</p>
              </div>
              <Link href={'/organizations?pathway=' + theme.id} className="text-sm font-semibold hover:underline" style={{ color: theme.color }}>
                See all <ArrowRight size={14} className="inline ml-1" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {orgs.slice(0, 6).map(function (org) {
                return (
                  <Link
                    key={org.org_id}
                    href={'/organizations/' + org.org_id}
                    className="flex items-start gap-4 p-5 bg-white border border-rule rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all group"
                  >
                    {(org as any).logo_url ? (
                      <Image src={(org as any).logo_url} alt="" className="w-12 h-12 rounded-lg object-contain flex-shrink-0 bg-gray-50" width={48} height={48} />
                    ) : (
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: theme.color + '12' }}>
                        <FlowerOfLife color={theme.color} size={24} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-ink leading-snug group-hover:underline line-clamp-1">
                        {org.org_name}
                      </h3>
                      {org.description_5th_grade && (
                        <p className="text-sm text-muted mt-1 line-clamp-2">{org.description_5th_grade}</p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Services ── */}
        {services.length > 0 && (
          <section className="py-10 border-t border-rule">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-ink">Services</h2>
                <p className="text-sm text-muted mt-1">Free and low-cost help available right now</p>
              </div>
              <Link href={'/help?pathway=' + theme.id} className="text-sm font-semibold hover:underline" style={{ color: theme.color }}>
                See all <ArrowRight size={14} className="inline ml-1" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {services.slice(0, 6).map(function (svc) {
                return (
                  <Link
                    key={svc.service_id}
                    href={'/services/' + svc.service_id}
                    className="p-5 bg-white border border-rule rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all group"
                  >
                    <h3 className="text-base font-bold text-ink leading-snug group-hover:underline">
                      {svc.service_name}
                    </h3>
                    {svc.description_5th_grade && (
                      <p className="text-sm text-muted mt-2 line-clamp-2">{svc.description_5th_grade}</p>
                    )}
                    <div className="flex items-center gap-2 mt-3 text-sm text-muted">
                      {(svc as any).org_name && <span><Users size={13} className="inline mr-1" />{(svc as any).org_name}</span>}
                      {svc.city && <span><MapPin size={13} className="inline mr-1" />{svc.city}</span>}
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════════════════════════════
            THE DEPTH — Officials, policies, focus areas
           ════════════════════════════════════════════════════════════════ */}

        {/* ── Officials ── */}
        {officials.length > 0 && (
          <section className="py-10 border-t border-rule">
            <h2 className="font-display text-2xl font-bold text-ink mb-2">Officials Connected to {theme.name}</h2>
            <p className="text-sm text-muted mb-6">Elected leaders working on these issues</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {officials.slice(0, 6).map(function (o: any) {
                return (
                  <Link
                    key={o.official_id}
                    href={'/officials/' + o.official_id}
                    className="flex items-center gap-3 p-4 bg-white border border-rule rounded-xl hover:shadow-md transition-all group"
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-50">
                      <Users size={16} className="text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-ink group-hover:underline line-clamp-1">{o.official_name}</h3>
                      <p className="text-sm text-muted">{[o.level, o.title].filter(Boolean).join(' · ')}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Policies ── */}
        {policies.length > 0 && (
          <section className="py-10 border-t border-rule">
            <h2 className="font-display text-2xl font-bold text-ink mb-2">Policies & Legislation</h2>
            <p className="text-sm text-muted mb-6">Laws and proposals that affect {theme.name.toLowerCase()}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {policies.slice(0, 6).map(function (p: any) {
                return (
                  <Link
                    key={p.policy_id}
                    href={'/policies/' + p.policy_id}
                    className="p-5 bg-white border border-rule rounded-xl hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {p.bill_number && <span className="text-sm font-mono font-semibold" style={{ color: theme.color }}>{p.bill_number}</span>}
                      {p.status && <span className="text-sm text-muted">&middot; {p.status}</span>}
                    </div>
                    <h3 className="text-base font-bold text-ink leading-snug group-hover:underline line-clamp-2">
                      {p.title_6th_grade || p.policy_name}
                    </h3>
                    {p.summary_5th_grade && (
                      <p className="text-sm text-muted mt-2 line-clamp-2">{p.summary_5th_grade}</p>
                    )}
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Focus Areas ── */}
        {themeFocusAreas.length > 0 && (
          <section className="py-10 border-t border-rule">
            <h2 className="font-display text-2xl font-bold text-ink mb-4">Topics in {theme.name}</h2>
            <div className="flex flex-wrap gap-2">
              {themeFocusAreas.map(function (fa) {
                return (
                  <Link
                    key={fa.focus_id}
                    href={'/explore/focus/' + fa.focus_id}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-full transition-all hover:shadow-sm hover:-translate-y-px"
                    style={{ background: theme.color + '10', color: theme.color, border: `1px solid ${theme.color}20` }}
                  >
                    {fa.focus_area_name}
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Explore Other Pathways ── */}
        <section className="py-10 border-t border-rule mb-6">
          <h2 className="font-display text-2xl font-bold text-ink mb-4">Explore other pathways</h2>
          <div className="flex flex-wrap gap-3">
            {bridgeData.map(function (b: any) {
              return (
                <Link
                  key={b.targetThemeId}
                  href={'/pathways/' + b.targetSlug}
                  className="flex items-center gap-2 px-4 py-2.5 border border-rule text-sm font-medium rounded-full hover:shadow-md transition-all"
                >
                  <span className="w-3 h-3 rounded-full" style={{ background: b.targetColor }} />
                  {b.targetName}
                </Link>
              )
            })}
            <Link
              href="/pathways"
              className="flex items-center gap-2 px-4 py-2.5 border border-rule text-sm text-muted font-medium rounded-full hover:text-ink hover:shadow-md transition-all"
            >
              All pathways <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
