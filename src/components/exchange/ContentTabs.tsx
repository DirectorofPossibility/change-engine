'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  BookOpen, Users, Megaphone, GraduationCap, Rocket,
  ArrowRight, Globe, ExternalLink, BookMarked, Wrench,
  Video, Calendar, ChevronDown, ChevronUp
} from 'lucide-react'
import { BreakItDown } from './BreakItDown'

const TABS = [
  { key: 'curious', name: 'Get Curious', subtitle: 'Learn about it', icon: BookOpen, color: '#1b5e8a' },
  { key: 'people', name: 'Find Your People', subtitle: 'Connect with others', icon: Users, color: '#1a6b56' },
  { key: 'showup', name: 'Show Up', subtitle: 'Participate', icon: Megaphone, color: '#4a2870' },
  { key: 'deeper', name: 'Go Deeper', subtitle: 'Build knowledge', icon: GraduationCap, color: '#7a2018' },
  { key: 'move', name: 'Make Your Move', subtitle: 'Take action', icon: Rocket, color: '#0d1117' },
]

const CONTENT_TYPE_ICONS: Record<string, any> = {
  diy_kit: Wrench,
  video: Video,
  guide: BookOpen,
  tool: Wrench,
  course: GraduationCap,
  event: Calendar,
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  diy_kit: 'DIY Kit',
  video: 'Video',
  guide: 'Guide',
  tool: 'Tool',
  course: 'Course',
  event: 'Event',
}

interface ContentTabsProps {
  themeColor: string
  /* Get Curious */
  bodyHtml: string
  title: string | null
  summary: string | null
  videoUrl: string | null
  heroQuote: string | null
  /* Find Your People */
  orgData: any | null
  relatedServices: any[]
  relatedContent: any[]
  /* Show Up */
  opportunities: any[]
  actionItems: Record<string, string | null>
  /* Go Deeper */
  relatedPolicies: any[]
  libraryNuggets: any[]
  programs: any[]
  relatedBooks: any[]
  typedContent: any[]
  /* Make Your Move */
  responsibleOfficials: any[]
}

export function ContentTabs(props: ContentTabsProps) {
  const [active, setActive] = useState('curious')

  return (
    <div className="flex flex-col md:flex-row gap-0">
      {/* ── Vertical tab rail ── */}
      <div className="md:w-[180px] flex-shrink-0 md:border-r-[3px] border-b-[3px] md:border-b-0 border-rule">
        <div className="flex md:flex-col overflow-x-auto md:overflow-visible md:sticky md:top-[72px]">
          {TABS.map(function (tab) {
            const Icon = tab.icon
            const isActive = active === tab.key
            return (
              <button
                key={tab.key}
                onClick={function () { setActive(tab.key) }}
                className="flex items-center gap-2.5 px-3 py-3 md:py-3.5 text-left whitespace-nowrap md:whitespace-normal transition-all md:border-l-2 border-b-2 md:border-b-0 -mb-px md:mb-0 md:-ml-px w-full"
                style={{
                  borderColor: isActive ? tab.color : 'transparent',
                  background: isActive ? tab.color + '06' : undefined,
                }}
              >
                <div
                  className="w-8 h-8 flex items-center justify-center flex-shrink-0 rounded transition-all"
                  style={{
                    background: isActive ? tab.color : 'transparent',
                    color: isActive ? 'white' : '#9ca3af',
                  }}
                >
                  <Icon size={18} />
                </div>
                <span
                  className="text-sm leading-tight hidden md:block"
                  style={{ fontWeight: isActive ? 600 : 400, color: isActive ? tab.color : '#5c6474' }}
                >
                  {tab.name}
                </span>
                <span
                  className="block md:hidden text-xs"
                  style={{ fontWeight: isActive ? 600 : 400, color: isActive ? tab.color : '#5c6474' }}
                >
                  {tab.name.split(' ')[0]}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="flex-1 min-w-0 py-6 md:py-6 md:pl-6">
        {active === 'curious' && <CuriousTab {...props} />}
        {active === 'people' && <PeopleTab {...props} />}
        {active === 'showup' && <ShowUpTab {...props} />}
        {active === 'deeper' && <DeeperTab {...props} />}
        {active === 'move' && <MoveTab {...props} />}
      </div>
    </div>
  )
}

/* ── Section header ── */
function SectionHeader({ title, subtitle, icon: Icon, color }: { title: string; subtitle?: string; icon?: any; color: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      {Icon && (
        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0" style={{ background: color + '15', color }}>
          <Icon size={18} />
        </div>
      )}
      <div>
        <h3 className="text-base font-bold text-ink">{title}</h3>
        {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
      </div>
    </div>
  )
}

/* ── Get Curious ── */
function CuriousTab({ bodyHtml, title, summary, videoUrl, heroQuote, themeColor }: ContentTabsProps) {
  const embedSrc = videoUrl ? (() => {
    const ytMatch = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([^?&]+)/)
    const vimeoMatch = videoUrl.match(/vimeo\.com\/(\d+)/)
    return ytMatch ? 'https://www.youtube-nocookie.com/embed/' + ytMatch[1]
      : vimeoMatch ? 'https://player.vimeo.com/video/' + vimeoMatch[1]
      : null
  })() : null

  return (
    <div>
      {embedSrc && (
        <div className="mb-8">
          <div className="relative w-full overflow-hidden" style={{ paddingBottom: '56.25%', border: '1px solid #dde1e8' }}>
            <iframe className="absolute inset-0 w-full h-full" src={embedSrc} title="Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          </div>
        </div>
      )}

      {heroQuote && (
        <div className="pl-6 py-5 pr-8 mb-8 border-l-4" style={{ borderColor: themeColor, background: themeColor + '08' }}>
          <p className="italic text-lg leading-relaxed" style={{ color: themeColor + 'cc' }}>&ldquo;{heroQuote}&rdquo;</p>
        </div>
      )}

      {bodyHtml ? (
        <div className="prose prose-base max-w-none prose-headings:font-display prose-a:text-blue" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      ) : summary ? (
        <p className="text-base leading-relaxed">{summary}</p>
      ) : null}

      {(summary || bodyHtml) && (
        <div className="mt-10 p-6 border border-rule bg-paper">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 flex items-center justify-center" style={{ background: themeColor + '15' }}>
              <BookOpen size={18} style={{ color: themeColor }} />
            </div>
            <div>
              <p className="text-sm font-bold text-ink">Break it down for me</p>
              <p className="text-xs text-muted">Plain-language summary powered by AI</p>
            </div>
          </div>
          <BreakItDown title={title || ''} summary={summary} type="content" accentColor={themeColor} />
        </div>
      )}
    </div>
  )
}

/* ── Find Your People ── */
function PeopleTab({ orgData, relatedServices, relatedContent, themeColor }: ContentTabsProps) {
  const hasAnything = orgData || relatedServices.length > 0 || relatedContent.length > 0

  if (!hasAnything) {
    return (
      <div className="text-center py-12">
        <Users size={40} className="mx-auto mb-3 text-muted/30" />
        <p className="text-sm text-muted">No organizations or community resources connected to this content yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {orgData && (
        <div>
          <SectionHeader title="Organization" subtitle="Who created or supports this work" icon={Users} color={themeColor} />
          <Link href={'/organizations/' + orgData.org_id} className="flex items-start gap-5 p-5 border border-rule hover:shadow-lg transition-all group bg-white">
            <div className="w-16 h-16 flex items-center justify-center flex-shrink-0" style={{ background: themeColor + '12' }}>
              {orgData.logo_url ? (
                <Image src={orgData.logo_url} alt="" width={64} height={64} className="w-full h-full object-contain p-1" />
              ) : (
                <Users size={28} style={{ color: themeColor }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-base font-bold text-ink group-hover:text-blue block">{orgData.org_name}</span>
              {orgData.description_5th_grade && <span className="text-sm text-muted mt-1 block line-clamp-2">{orgData.description_5th_grade}</span>}
              <span className="text-xs text-blue mt-2 block font-semibold">View organization &rarr;</span>
            </div>
          </Link>
        </div>
      )}

      {relatedServices.length > 0 && (
        <div>
          <SectionHeader title="Community Resources" subtitle="Local services and support near you" icon={Globe} color="#16a34a" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {relatedServices.map(function (svc: any) {
              return (
                <Link key={svc.service_id} href={'/services/' + svc.service_id}
                  className="flex items-start gap-3 p-4 border border-rule hover:shadow-md transition-all group bg-white"
                >
                  <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 bg-emerald-50 text-emerald-600">
                    <Globe size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-bold text-ink group-hover:text-blue block">{svc.service_name}</span>
                    {svc.phone && <span className="text-xs text-muted block mt-0.5">{svc.phone}</span>}
                    {svc.address && <span className="text-xs text-muted block">{svc.address}{svc.city ? `, ${svc.city}` : ''}</span>}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {relatedContent.length > 0 && (
        <div>
          <SectionHeader title="Related Reading" subtitle="More on this topic" icon={BookOpen} color={themeColor} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {relatedContent.map(function (r: any) {
              return (
                <Link key={r.id} href={'/content/' + r.id} className="p-4 border border-rule hover:shadow-md transition-all group bg-white">
                  {r.image_url && (
                    <div className="w-full h-24 mb-3 overflow-hidden bg-paper">
                      <Image src={r.image_url} alt="" width={200} height={96} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <span className="text-sm font-bold text-ink group-hover:text-blue block line-clamp-2">{r.title_6th_grade}</span>
                  {r.summary_6th_grade && <span className="text-xs text-muted mt-1 block line-clamp-2">{r.summary_6th_grade.slice(0, 120)}</span>}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Show Up ── */
function ShowUpTab({ opportunities, actionItems, themeColor, typedContent }: ContentTabsProps) {
  const actions = [
    actionItems.volunteer_url && { href: actionItems.volunteer_url, label: 'Volunteer', desc: 'Give your time and talent', emoji: '\u{1f91d}' },
    actionItems.donate_url && { href: actionItems.donate_url, label: 'Donate', desc: 'Support this work financially', emoji: '\u{1f49b}' },
    actionItems.signup_url && { href: actionItems.signup_url, label: 'Sign Up', desc: 'Get involved today', emoji: '\u{270d}\u{fe0f}' },
    actionItems.register_url && { href: actionItems.register_url, label: 'Register', desc: 'Reserve your spot', emoji: '\u{1f4cb}' },
    actionItems.attend_url && { href: actionItems.attend_url, label: 'Attend', desc: 'Show up in person', emoji: '\u{1f4cd}' },
  ].filter(Boolean) as { href: string; label: string; desc: string; emoji: string }[]

  // DIY kits, videos, guides, tools, courses, events
  const hasTyped = typedContent.length > 0

  if (actions.length === 0 && opportunities.length === 0 && !hasTyped) {
    return (
      <div className="text-center py-12">
        <Megaphone size={40} className="mx-auto mb-3 text-muted/30" />
        <p className="text-sm text-muted">No actions or opportunities connected to this content yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {actions.length > 0 && (
        <div>
          <SectionHeader title="Take Action" subtitle="Ways you can get involved right now" icon={Megaphone} color="#4a2870" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {actions.map(function (a) {
              return (
                <a key={a.href} href={a.href} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-4 p-5 border-2 border-rule hover:border-purple-300 hover:shadow-lg transition-all group bg-white"
                >
                  <span className="text-2xl flex-shrink-0">{a.emoji}</span>
                  <div className="flex-1">
                    <span className="text-sm font-bold text-ink group-hover:text-purple-700 block">{a.label}</span>
                    <span className="text-xs text-muted">{a.desc}</span>
                  </div>
                  <ExternalLink size={16} className="flex-shrink-0 text-muted group-hover:text-purple-500" />
                </a>
              )
            })}
          </div>
        </div>
      )}

      {hasTyped && (
        <div>
          <SectionHeader title="Things You Can Use" subtitle="DIY kits, guides, videos, tools, and more from organizations working on this" icon={Wrench} color={themeColor} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {typedContent.map(function (c: any) {
              const TypeIcon = CONTENT_TYPE_ICONS[c.content_type] || BookOpen
              const typeLabel = CONTENT_TYPE_LABELS[c.content_type] || c.content_type
              return (
                <Link key={c.id} href={'/content/' + c.id}
                  className="flex items-start gap-4 p-4 border border-rule hover:shadow-md transition-all group bg-white"
                >
                  {c.image_url ? (
                    <div className="w-16 h-16 flex-shrink-0 overflow-hidden bg-paper">
                      <Image src={c.image_url} alt="" width={64} height={64} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 flex items-center justify-center flex-shrink-0" style={{ background: themeColor + '10' }}>
                      <TypeIcon size={24} style={{ color: themeColor }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="inline-block text-xs font-bold uppercase tracking-wider px-2 py-0.5 mb-1" style={{ background: themeColor + '15', color: themeColor }}>
                      {typeLabel}
                    </span>
                    <span className="text-sm font-bold text-ink group-hover:text-blue block line-clamp-2">{c.title_6th_grade}</span>
                    {c.summary_6th_grade && <span className="text-xs text-muted mt-0.5 block line-clamp-2">{c.summary_6th_grade.slice(0, 100)}</span>}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {opportunities.length > 0 && (
        <div>
          <SectionHeader title="Opportunities" subtitle="Ways to participate in your community" icon={Calendar} color="#1a6b56" />
          <div className="space-y-3">
            {opportunities.map(function (opp: any) {
              return (
                <Link key={opp.opportunity_id} href={'/opportunities/' + opp.opportunity_id}
                  className="flex items-center gap-4 p-4 border border-rule hover:shadow-md transition-all group bg-white"
                >
                  <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 bg-emerald-50 text-emerald-600">
                    <Calendar size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-bold text-ink group-hover:text-blue block truncate">{opp.opportunity_name}</span>
                    <div className="flex items-center gap-2 text-xs text-muted mt-0.5">
                      {opp.start_date && <span>{new Date(opp.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                      {opp.time_commitment && <span>&middot; {opp.time_commitment}</span>}
                    </div>
                  </div>
                  <ArrowRight size={16} className="flex-shrink-0 text-muted group-hover:text-emerald-500" />
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Go Deeper ── */
function DeeperTab({ relatedPolicies, libraryNuggets, programs, relatedBooks, themeColor }: ContentTabsProps) {
  const hasAnything = relatedPolicies.length > 0 || libraryNuggets.length > 0 || programs.length > 0 || relatedBooks.length > 0

  if (!hasAnything) {
    return (
      <div className="text-center py-12">
        <GraduationCap size={40} className="mx-auto mb-3 text-muted/30" />
        <p className="text-sm text-muted">No deeper resources connected to this content yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {relatedBooks.length > 0 && (
        <div>
          <SectionHeader title="Recommended Reading" subtitle="Books on this topic from our bookshelf" icon={BookMarked} color="#92400e" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {relatedBooks.map(function (book: any) {
              const href = book.free_url || book.purchase_url || '/bookshelf'
              const isExternal = href.startsWith('http')
              const Wrapper = isExternal ? 'a' : Link
              const extraProps = isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {}
              return (
                <Wrapper key={book.id} href={href} {...extraProps as any}
                  className="flex flex-col items-center text-center p-3 border border-rule hover:shadow-lg transition-all group bg-white"
                >
                  {book.cover_image_url ? (
                    <div className="w-20 h-28 mb-3 overflow-hidden shadow-md">
                      <Image src={book.cover_image_url} alt="" width={80} height={112} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-20 h-28 mb-3 flex items-center justify-center bg-amber-50">
                      <BookMarked size={28} className="text-amber-700" />
                    </div>
                  )}
                  <span className="text-xs font-bold text-ink group-hover:text-blue line-clamp-2">{book.title}</span>
                  {book.author && <span className="text-xs text-muted mt-0.5">{book.author}</span>}
                </Wrapper>
              )
            })}
          </div>
        </div>
      )}

      {programs.length > 0 && (
        <div>
          <SectionHeader title="Programs" subtitle="Structured programs you can join" icon={GraduationCap} color={themeColor} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {programs.map(function (prog: any, i: number) {
              return (
                <div key={i} className="p-5 border border-rule bg-white">
                  <div className="w-10 h-1 mb-3" style={{ background: themeColor }} />
                  <p className="text-sm font-bold text-ink">{prog.name}</p>
                  <p className="text-sm text-muted mt-1 leading-relaxed">{prog.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {relatedPolicies.length > 0 && (
        <div>
          <SectionHeader title="Related Legislation" subtitle="Policies and laws connected to this topic" icon={BookOpen} color="#7a2018" />
          <div className="space-y-3">
            {relatedPolicies.map(function (p: any) {
              return (
                <Link key={p.policy_id} href={'/policies/' + p.policy_id}
                  className="flex items-center gap-4 p-4 border border-rule hover:shadow-md transition-all group bg-white"
                >
                  <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 bg-red-50 text-red-700">
                    <BookOpen size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-bold text-ink group-hover:text-blue block">{p.title_6th_grade || p.policy_name}</span>
                    <span className="text-xs text-muted">{[p.level, p.status, p.bill_number].filter(Boolean).join(' \u00b7 ')}</span>
                  </div>
                  <ArrowRight size={16} className="flex-shrink-0 text-muted" />
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {libraryNuggets.length > 0 && (
        <div>
          <SectionHeader title="From the Library" subtitle="Research and reference materials" icon={BookOpen} color={themeColor} />
          <div className="space-y-3">
            {libraryNuggets.map(function (n: any) {
              return (
                <a key={n.documentId} href={n.link} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 border border-rule hover:shadow-md transition-all group bg-white"
                >
                  <div className="w-10 h-10 flex items-center justify-center flex-shrink-0" style={{ background: themeColor + '10' }}>
                    <BookOpen size={18} style={{ color: themeColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-bold text-ink group-hover:text-blue block truncate">{n.documentTitle}</span>
                    {n.chunkExcerpt && <span className="text-xs text-muted block line-clamp-2">{n.chunkExcerpt}</span>}
                  </div>
                  <ExternalLink size={16} className="flex-shrink-0 text-muted" />
                </a>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Make Your Move ── */
function MoveTab({ responsibleOfficials, relatedPolicies, themeColor }: ContentTabsProps) {
  if (responsibleOfficials.length === 0 && relatedPolicies.length === 0) {
    return (
      <div className="text-center py-12">
        <Rocket size={40} className="mx-auto mb-3 text-muted/30" />
        <p className="text-sm text-muted">No officials or advocacy actions connected to this content yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {responsibleOfficials.length > 0 && (
        <div>
          <SectionHeader title="Who Is Responsible" subtitle="Elected officials connected to this topic" icon={Users} color="#0d1117" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {responsibleOfficials.map(function (o: any) {
              return (
                <Link key={o.official_id} href={'/officials/' + o.official_id}
                  className="flex items-center gap-4 p-4 border border-rule hover:shadow-lg transition-all group bg-white"
                >
                  <div className="w-14 h-14 overflow-hidden flex-shrink-0 rounded-full border-2 border-rule">
                    {o.photo_url ? (
                      <Image src={o.photo_url} alt="" width={56} height={56} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-base font-bold" style={{ color: themeColor, background: themeColor + '15' }}>
                        {o.official_name?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-bold text-ink group-hover:text-blue block truncate">{o.official_name}</span>
                    <span className="text-xs text-muted truncate block">{[o.title, o.party, o.level].filter(Boolean).join(' \u00b7 ')}</span>
                    {(o.email || o.office_phone) && (
                      <span className="text-xs font-semibold mt-1 block" style={{ color: themeColor }}>
                        Contact &rarr;
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {relatedPolicies.length > 0 && (
        <div>
          <SectionHeader title="Track the Policy" subtitle="Follow the legislation that affects this issue" icon={BookOpen} color="#7a2018" />
          <div className="space-y-3">
            {relatedPolicies.map(function (p: any) {
              return (
                <Link key={p.policy_id} href={'/policies/' + p.policy_id}
                  className="flex items-center gap-4 p-4 border border-rule hover:shadow-md transition-all group bg-white"
                >
                  <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 bg-red-50 text-red-700">
                    <BookOpen size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-bold text-ink group-hover:text-blue block">{p.title_6th_grade || p.policy_name}</span>
                    <span className="text-xs text-muted">{[p.level, p.status].filter(Boolean).join(' \u00b7 ')}</span>
                  </div>
                  <ArrowRight size={16} className="flex-shrink-0 text-muted" />
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
