'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BookOpen, Users, Megaphone, GraduationCap, Rocket, ArrowRight, Globe, ExternalLink } from 'lucide-react'
import { BreakItDown } from './BreakItDown'

const TABS = [
  { key: 'curious', name: 'Get Curious', icon: BookOpen, color: '#1b5e8a' },
  { key: 'people', name: 'Find Your People', icon: Users, color: '#1a6b56' },
  { key: 'showup', name: 'Show Up', icon: Megaphone, color: '#4a2870' },
  { key: 'deeper', name: 'Go Deeper', icon: GraduationCap, color: '#7a2018' },
  { key: 'move', name: 'Make Your Move', icon: Rocket, color: '#0d1117' },
]

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
  /* Make Your Move */
  responsibleOfficials: any[]
}

export function ContentTabs(props: ContentTabsProps) {
  const [active, setActive] = useState('curious')
  const c = props.themeColor

  return (
    <div>
      {/* Tab bar */}
      <div className="flex overflow-x-auto border-b border-rule gap-0">
        {TABS.map(function (tab) {
          const Icon = tab.icon
          const isActive = active === tab.key
          return (
            <button
              key={tab.key}
              onClick={function () { setActive(tab.key) }}
              className="flex items-center gap-2 px-4 py-3 text-sm whitespace-nowrap transition-colors border-b-2 -mb-px"
              style={{
                borderColor: isActive ? tab.color : 'transparent',
                color: isActive ? tab.color : undefined,
                fontWeight: isActive ? 600 : 400,
              }}
            >
              <Icon size={16} />
              {tab.name}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="py-6">
        {active === 'curious' && <CuriousTab {...props} />}
        {active === 'people' && <PeopleTab {...props} />}
        {active === 'showup' && <ShowUpTab {...props} />}
        {active === 'deeper' && <DeeperTab {...props} />}
        {active === 'move' && <MoveTab {...props} />}
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
        <div className="mb-6">
          <div className="relative w-full overflow-hidden" style={{ paddingBottom: '56.25%', border: '1px solid #dde1e8' }}>
            <iframe className="absolute inset-0 w-full h-full" src={embedSrc} title="Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          </div>
        </div>
      )}

      {heroQuote && (
        <div className="pl-5 py-4 pr-6 mb-6 border-l-4" style={{ borderColor: themeColor, background: '#fafafa' }}>
          <p className="italic text-lg text-muted">&ldquo;{heroQuote}&rdquo;</p>
        </div>
      )}

      {bodyHtml ? (
        <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      ) : summary ? (
        <p className="text-base leading-relaxed">{summary}</p>
      ) : null}

      {(summary || bodyHtml) && (
        <div className="mt-8 p-5 border border-rule bg-paper">
          <p className="text-xs uppercase tracking-wider text-muted mb-1">AI Summary</p>
          <p className="text-sm text-muted mb-3">Let us break this down in plain language.</p>
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
    return <p className="text-sm text-muted py-4">No organizations or community resources connected to this content yet.</p>
  }

  return (
    <div className="space-y-8">
      {orgData && (
        <div>
          <h3 className="text-base font-bold text-ink mb-3">Organization</h3>
          <Link href={'/organizations/' + orgData.org_id} className="flex items-start gap-4 p-4 border border-rule hover:shadow-md transition-all group">
            <div className="w-12 h-12 flex items-center justify-center flex-shrink-0" style={{ background: themeColor + '15' }}>
              <Users size={20} style={{ color: themeColor }} />
            </div>
            <div>
              <span className="text-sm font-bold text-ink group-hover:text-blue block">{orgData.org_name}</span>
              {orgData.description_5th_grade && <span className="text-sm text-muted mt-1 block line-clamp-2">{orgData.description_5th_grade}</span>}
              {orgData.website && <span className="text-xs text-muted mt-1 block">{orgData.website}</span>}
            </div>
          </Link>
        </div>
      )}

      {relatedServices.length > 0 && (
        <div>
          <h3 className="text-base font-bold text-ink mb-3">Community Resources</h3>
          <div className="space-y-2">
            {relatedServices.map(function (svc: any) {
              return (
                <Link key={svc.service_id} href={'/services/' + svc.service_id}
                  className="flex items-center gap-3 p-3 border border-rule hover:shadow-sm transition-all group"
                >
                  <Globe size={16} className="flex-shrink-0 text-muted" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-ink group-hover:text-blue block truncate">{svc.service_name}</span>
                    {svc.phone && <span className="text-xs text-muted">{svc.phone}</span>}
                    {svc.address && <span className="text-xs text-muted"> &middot; {svc.address}{svc.city ? `, ${svc.city}` : ''}</span>}
                  </div>
                  <ArrowRight size={14} className="flex-shrink-0 text-muted" />
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {relatedContent.length > 0 && (
        <div>
          <h3 className="text-base font-bold text-ink mb-3">Related</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {relatedContent.map(function (r: any) {
              return (
                <Link key={r.id} href={'/content/' + r.id} className="p-3 border border-rule hover:shadow-sm transition-all group">
                  <span className="text-sm font-semibold text-ink group-hover:text-blue block line-clamp-2">{r.title_6th_grade}</span>
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
function ShowUpTab({ opportunities, actionItems, themeColor }: ContentTabsProps) {
  const actions = [
    actionItems.volunteer_url && { href: actionItems.volunteer_url, label: 'Volunteer', desc: 'Give your time and talent' },
    actionItems.donate_url && { href: actionItems.donate_url, label: 'Donate', desc: 'Support this work' },
    actionItems.signup_url && { href: actionItems.signup_url, label: 'Sign Up', desc: 'Get involved today' },
    actionItems.register_url && { href: actionItems.register_url, label: 'Register', desc: 'Reserve your spot' },
    actionItems.attend_url && { href: actionItems.attend_url, label: 'Attend', desc: 'Show up in person' },
  ].filter(Boolean) as { href: string; label: string; desc: string }[]

  if (actions.length === 0 && opportunities.length === 0) {
    return <p className="text-sm text-muted py-4">No actions or opportunities connected to this content yet.</p>
  }

  return (
    <div className="space-y-8">
      {actions.length > 0 && (
        <div>
          <h3 className="text-base font-bold text-ink mb-3">Take Action</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {actions.map(function (a) {
              return (
                <a key={a.href} href={a.href} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 border border-rule hover:shadow-md transition-all group"
                >
                  <ExternalLink size={16} style={{ color: themeColor }} className="flex-shrink-0" />
                  <div>
                    <span className="text-sm font-bold text-ink group-hover:text-blue block">{a.label}</span>
                    <span className="text-xs text-muted">{a.desc}</span>
                  </div>
                </a>
              )
            })}
          </div>
        </div>
      )}

      {opportunities.length > 0 && (
        <div>
          <h3 className="text-base font-bold text-ink mb-3">Opportunities</h3>
          <div className="space-y-2">
            {opportunities.map(function (opp: any) {
              return (
                <Link key={opp.opportunity_id} href={'/opportunities/' + opp.opportunity_id}
                  className="flex items-center gap-3 p-3 border border-rule hover:shadow-sm transition-all group"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-ink group-hover:text-blue block truncate">{opp.opportunity_name}</span>
                    {opp.start_date && <span className="text-xs text-muted">{new Date(opp.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                    {opp.time_commitment && <span className="text-xs text-muted"> &middot; {opp.time_commitment}</span>}
                  </div>
                  <ArrowRight size={14} className="flex-shrink-0 text-muted" />
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
function DeeperTab({ relatedPolicies, libraryNuggets, programs, themeColor }: ContentTabsProps) {
  const hasAnything = relatedPolicies.length > 0 || libraryNuggets.length > 0 || programs.length > 0

  if (!hasAnything) {
    return <p className="text-sm text-muted py-4">No deeper resources connected to this content yet.</p>
  }

  return (
    <div className="space-y-8">
      {programs.length > 0 && (
        <div>
          <h3 className="text-base font-bold text-ink mb-3">Programs</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {programs.map(function (prog: any, i: number) {
              return (
                <div key={i} className="p-4 border border-rule">
                  <div className="w-1 h-6 mb-2" style={{ background: themeColor }} />
                  <p className="text-sm font-bold text-ink">{prog.name}</p>
                  <p className="text-sm text-muted mt-1">{prog.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {relatedPolicies.length > 0 && (
        <div>
          <h3 className="text-base font-bold text-ink mb-3">Related Legislation</h3>
          <div className="space-y-2">
            {relatedPolicies.map(function (p: any) {
              return (
                <Link key={p.policy_id} href={'/policies/' + p.policy_id}
                  className="flex items-center gap-3 p-3 border border-rule hover:shadow-sm transition-all group"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-ink group-hover:text-blue block">{p.title_6th_grade || p.policy_name}</span>
                    <span className="text-xs text-muted">{[p.level, p.status, p.bill_number].filter(Boolean).join(' &middot; ')}</span>
                  </div>
                  <ArrowRight size={14} className="flex-shrink-0 text-muted" />
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {libraryNuggets.length > 0 && (
        <div>
          <h3 className="text-base font-bold text-ink mb-3">From the Library</h3>
          <div className="space-y-2">
            {libraryNuggets.map(function (n: any) {
              return (
                <a key={n.documentId} href={n.link} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 border border-rule hover:shadow-sm transition-all group"
                >
                  <BookOpen size={16} className="flex-shrink-0 text-muted" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-ink group-hover:text-blue block truncate">{n.documentTitle}</span>
                    {n.chunkExcerpt && <span className="text-xs text-muted block line-clamp-2">{n.chunkExcerpt}</span>}
                  </div>
                  <ExternalLink size={14} className="flex-shrink-0 text-muted" />
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
    return <p className="text-sm text-muted py-4">No officials or advocacy actions connected to this content yet.</p>
  }

  return (
    <div className="space-y-8">
      {responsibleOfficials.length > 0 && (
        <div>
          <h3 className="text-base font-bold text-ink mb-3">Who Is Responsible</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {responsibleOfficials.map(function (o: any) {
              return (
                <Link key={o.official_id} href={'/officials/' + o.official_id}
                  className="flex items-center gap-3 p-3 border border-rule hover:shadow-sm transition-all group"
                >
                  <div className="w-10 h-10 overflow-hidden flex-shrink-0 rounded-full border border-rule">
                    {o.photo_url ? (
                      <img src={o.photo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-bold" style={{ color: themeColor, background: themeColor + '15' }}>
                        {o.official_name?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-ink group-hover:text-blue block truncate">{o.official_name}</span>
                    <span className="text-xs text-muted truncate block">{[o.title, o.party, o.level].filter(Boolean).join(' · ')}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {relatedPolicies.length > 0 && (
        <div>
          <h3 className="text-base font-bold text-ink mb-3">Track the Policy</h3>
          <div className="space-y-2">
            {relatedPolicies.map(function (p: any) {
              return (
                <Link key={p.policy_id} href={'/policies/' + p.policy_id}
                  className="flex items-center gap-3 p-3 border border-rule hover:shadow-sm transition-all group"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-ink group-hover:text-blue block">{p.title_6th_grade || p.policy_name}</span>
                    <span className="text-xs text-muted">{[p.level, p.status].filter(Boolean).join(' · ')}</span>
                  </div>
                  <ArrowRight size={14} className="flex-shrink-0 text-muted" />
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
