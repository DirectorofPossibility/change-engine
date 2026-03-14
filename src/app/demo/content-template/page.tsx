import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { THEMES } from '@/lib/constants'
import { getFocusAreasByIds } from '@/lib/data/exchange'
import { getSDGMap, getSDOHMap } from '@/lib/data/taxonomy'
import { FlowerOfLife } from '@/components/geo/sacred'
import { ContentImage } from '@/components/exchange/ContentImage'
import { ExternalLink, Globe, ArrowRight, BookOpen, Users, Megaphone, GraduationCap, Rocket } from 'lucide-react'

/* ── Design Tokens ── */
const SIDEBAR_BG = '#f4f5f7'
const SIDEBAR_BORDER = '2px solid #dde1e8'
const RULE = '#dde1e8'
const DIM = '#5c6474'
const INK = '#0d1117'

const TRAIL_LEVELS = [
  { name: 'Get Curious', subtitle: 'Learn', color: '#1b5e8a', icon: BookOpen },
  { name: 'Find Your People', subtitle: 'Connect', color: '#1a6b56', icon: Users },
  { name: 'Show Up', subtitle: 'Participate', color: '#4a2870', icon: Megaphone },
  { name: 'Go Deeper', subtitle: 'Build skills & capacity', color: '#7a2018', icon: GraduationCap },
  { name: 'Make Your Move', subtitle: 'Take action in whatever form fits you', color: '#0d1117', icon: Rocket },
]

export const revalidate = 86400

export default async function ContentTemplateDemo() {
  const supabase = await createClient()

  // Grab a real content item that has good data
  const { data: items } = await supabase
    .from('content_published')
    .select('*')
    .eq('is_active', true)
    .not('body', 'is', null)
    .not('image_url', 'is', null)
    .not('pathway_primary', 'is', null)
    .not('org_id', 'is', null)
    .order('published_at', { ascending: false })
    .limit(5)

  const item = items?.[0]
  if (!item) return <div className="p-20 text-center">No content with body + image + org found</div>

  // Parallel data fetches
  const focusAreaIds: string[] = item.focus_area_ids || []
  const sdgIds: string[] = (item as any).sdg_ids || []
  const audienceIds: string[] = (item as any).audience_segments || []
  const actionTypeIds: string[] = (item as any).action_type_ids || []
  const timeCommitmentId: string | null = (item as any).time_commitment_id || null
  const geoScope: string | null = (item as any).geographic_scope || null
  const govLevel: string | null = (item as any).gov_level_id || null
  const contentType: string | null = (item as any).content_type || null

  const [focusAreas, sdgMap, sdohMap, orgData, audienceData, actionTypeData, timeData, govData] = await Promise.all([
    focusAreaIds.length > 0 ? getFocusAreasByIds(focusAreaIds) : Promise.resolve([]),
    getSDGMap(),
    getSDOHMap(),
    item.org_id ? supabase.from('organizations').select('org_id, org_name, website, description_5th_grade, logo_url, mission_statement').eq('org_id', item.org_id).single().then(r => r.data) : Promise.resolve(null),
    audienceIds.length > 0 ? supabase.from('audience_segments').select('segment_id, segment_name').in('segment_id', audienceIds).then(r => r.data) : Promise.resolve([]),
    actionTypeIds.length > 0 ? supabase.from('action_types').select('action_type_id, action_type_name').in('action_type_id', actionTypeIds).then(r => r.data) : Promise.resolve([]),
    timeCommitmentId ? supabase.from('time_commitments').select('time_id, time_name').eq('time_id', timeCommitmentId).single().then(r => r.data) : Promise.resolve(null),
    govLevel ? supabase.from('government_levels').select('gov_level_id, gov_level_name').eq('gov_level_id', govLevel).single().then(r => r.data) : Promise.resolve(null),
  ])

  // Related policies via focus areas
  let relatedPolicies: any[] = []
  if (focusAreaIds.length > 0) {
    const { data: policyJunctions } = await supabase
      .from('policy_focus_areas')
      .select('policy_id')
      .in('focus_id', focusAreaIds)
      .limit(10)
    if (policyJunctions && policyJunctions.length > 0) {
      const pIds = Array.from(new Set(policyJunctions.map(j => j.policy_id)))
      const { data: pols } = await supabase
        .from('policies')
        .select('policy_id, policy_name, title_6th_grade, level, status')
        .in('policy_id', pIds)
        .eq('is_published', true)
        .limit(4)
      relatedPolicies = pols || []
    }
  }

  // Related services via focus areas
  let relatedServices: any[] = []
  if (focusAreaIds.length > 0) {
    const { data: svcJunctions } = await supabase
      .from('service_focus_areas')
      .select('service_id')
      .in('focus_id', focusAreaIds)
      .limit(10)
    if (svcJunctions && svcJunctions.length > 0) {
      const sIds = Array.from(new Set(svcJunctions.map(j => j.service_id)))
      const { data: svcs } = await supabase
        .from('services_211')
        .select('service_id, service_name, org_id, phone, address, city')
        .in('service_id', sIds)
        .eq('is_active', 'Yes')
        .limit(4)
      relatedServices = svcs || []
    }
  }

  // Officials
  let officials: any[] = []
  if (relatedPolicies.length > 0) {
    const pIds = relatedPolicies.map(p => p.policy_id)
    const { data: oj } = await supabase.from('policy_officials').select('official_id').in('policy_id', pIds)
    if (oj && oj.length > 0) {
      const oIds = Array.from(new Set(oj.map(j => j.official_id)))
      const { data: offs } = await supabase
        .from('elected_officials')
        .select('official_id, official_name, title, party, level, photo_url')
        .in('official_id', oIds)
        .limit(5)
      officials = offs || []
    }
  }

  // AI classification data
  let heroQuote: string | null = null
  let programs: Array<{ name: string; description: string }> = []
  if (item.inbox_id) {
    const { data: q } = await supabase.from('content_review_queue').select('ai_classification').eq('inbox_id', item.inbox_id).single()
    if (q?.ai_classification) {
      const c = q.ai_classification as any
      heroQuote = c.hero_quote || null
      programs = Array.isArray(c.programs) ? c.programs.filter((p: any) => p?.name) : []
    }
  }

  const themeEntry = item.pathway_primary ? (THEMES as Record<string, { name: string; color: string; slug: string }>)[item.pathway_primary] : null
  const themeColor = themeEntry?.color || '#1b5e8a'
  const themeSlug = themeEntry?.slug || ''
  const title = item.title_6th_grade || 'Untitled'
  const summary = item.summary_6th_grade || ''
  const sourceDomain = item.source_url ? (() => { try { return new URL(item.source_url).hostname } catch { return 'source' } })() : null

  const bodyText = (item.body || '').replace(/\n{3,}/g, '\n\n').trim()
  const bodyBlocks = bodyText.split(/\n\n+/).map(b => b.trim()).filter(Boolean)
  let sectionNumber = 0

  const sdohCode = (item as any).sdoh_domain
  const sdohEntry = sdohCode ? sdohMap[sdohCode] : null
  const matchedSDGs = sdgIds.map(id => sdgMap[id]).filter(Boolean)

  const currentLevel = (item as any).trail_level || 1
  const actionItems = (item as any).action_items || {}
  const hasActions = Object.values(actionItems).some(Boolean)

  return (
    <>
      {/* ── DEMO BANNER ── */}
      <div className="bg-amber-100 border-b-2 border-amber-400 px-6 py-3 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-amber-800 font-bold">
          Demo Template — Content Detail Page Redesign
        </p>
        <p className="text-sm text-amber-700 mt-1">
          Showing real data from: <strong>{title}</strong> (ID: {item.id.slice(0, 8)}...)
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 1: GRADIENT HERO
          Change Lab pattern: gradient bg, badge, title, description, CTA, image
         ══════════════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}dd 40%, #C75B2A 100%)` }}
      >
        {/* Radial glow */}
        <div className="absolute top-[-30%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }} />

        <div className="max-w-[1080px] mx-auto px-6 py-12 sm:py-16 relative z-10">
          <div className="flex flex-col lg:flex-row gap-10 items-center">
            <div className="flex-1">
              {/* Breadcrumb */}
              <nav className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-white/70 mb-4">
                <Link href="/guide" className="hover:text-white transition-colors">Guide</Link>
                {themeEntry && (
                  <>
                    <span className="mx-1.5">&rsaquo;</span>
                    <Link href={'/pathways/' + themeSlug} className="hover:text-white transition-colors">{themeEntry.name}</Link>
                  </>
                )}
              </nav>

              {/* Badge */}
              {contentType && (
                <span className="inline-block px-4 py-1.5 rounded-full text-white font-mono text-[0.65rem] uppercase tracking-[0.14em] font-bold mb-5"
                  style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}
                >
                  {contentType}
                </span>
              )}

              {/* Title */}
              <h1 className="font-display font-black text-white leading-[1.1] tracking-[-0.02em] mb-5"
                style={{ fontSize: 'clamp(28px, 4vw, 44px)' }}
              >
                {title}
              </h1>

              {/* Summary */}
              {summary && (
                <p className="text-white/90 leading-[1.7] mb-6 max-w-[600px]" style={{ fontSize: '1.1rem' }}>
                  {summary.length > 200 ? summary.slice(0, 200) + '...' : summary}
                </p>
              )}

              {/* CTA */}
              {item.source_url && (
                <a
                  href={item.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-white rounded-full font-bold text-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  style={{ color: themeColor }}
                >
                  <ExternalLink size={16} />
                  {contentType === 'video' ? 'Watch Now' : contentType === 'tool' ? 'Use the Tool' : 'Read the Full Resource'}
                </a>
              )}

              {/* Meta strip */}
              <div className="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-white/60 flex flex-wrap items-center gap-x-3 gap-y-1 mt-6">
                {item.published_at && (
                  <span>{new Date(item.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                )}
                {orgData && (
                  <>
                    <span>&middot;</span>
                    <span>{orgData.org_name}</span>
                  </>
                )}
                {sourceDomain && (
                  <>
                    <span>&middot;</span>
                    <span>{sourceDomain}</span>
                  </>
                )}
              </div>
            </div>

            {/* Hero image */}
            {item.image_url && (
              <div className="w-full lg:w-[380px] flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl border-[3px] border-white/30">
                <ContentImage src={item.image_url} alt={title} themeColor={themeColor} pathway={item.pathway_primary} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── QUOTE BANNER ── */}
      {heroQuote && (
        <section className="bg-white">
          <div className="max-w-[1080px] mx-auto px-6 py-8">
            <div className="rounded-r-2xl pl-6 py-6 pr-8" style={{ borderLeft: `5px solid ${themeColor}`, background: '#fafafa' }}>
              <p className="italic leading-[1.7] text-slate-600" style={{ fontSize: '1.2rem' }}>
                &ldquo;{heroQuote}&rdquo;
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 2: TWO-COLUMN LAYOUT — Body + Taxonomy Wayfinder Sidebar
         ══════════════════════════════════════════════════════════════════ */}
      <section className="bg-white">
        <div className="max-w-[1200px] mx-auto px-6 py-8 sm:py-10">
          <div className="flex flex-col lg:flex-row gap-10">

            {/* ── LEFT: Body Content ── */}
            <div className="flex-1 min-w-0" style={{ maxWidth: 740 }}>

              {/* Body blocks with numbered sections + highlight boxes */}
              {bodyBlocks.length > 0 ? (
                <div className="space-y-5 font-body">
                  {bodyBlocks.map(function (block, i) {
                    if (!block) return null

                    {/* Section headers with numbered badges */}
                    if (block.startsWith('## ')) {
                      sectionNumber++
                      return (
                        <div key={i} className="flex items-center gap-4 mt-10 first:mt-0 pb-3" style={{ borderBottom: `1px solid ${RULE}` }}>
                          <span
                            className="w-10 h-10 flex items-center justify-center rounded-full flex-shrink-0 text-white font-bold text-sm"
                            style={{ background: `linear-gradient(135deg, ${themeColor} 0%, #C75B2A 100%)` }}
                          >
                            {sectionNumber}
                          </span>
                          <h2 className="font-display text-xl font-bold text-ink">{block.replace(/^## /, '')}</h2>
                        </div>
                      )
                    }

                    {/* Blockquotes → Highlight boxes */}
                    if (block.startsWith('> ')) {
                      const quoteText = block.replace(/^> /gm, '').trim()
                      return (
                        <div key={i} className="rounded-r-xl py-5 px-6 my-4" style={{ background: '#fef3c7', borderLeft: '5px solid #F59E0B' }}>
                          <p className="text-amber-900 leading-[1.7]" style={{ fontSize: '1rem' }}>{quoteText}</p>
                        </div>
                      )
                    }

                    {/* Bullet lists with arrow markers */}
                    if (block.match(/^[-\u2022*] /m)) {
                      const listItems = block.split(/\n/).filter(l => l.trim())
                      return (
                        <ul key={i} className="space-y-2 my-4">
                          {listItems.map(function (li, j) {
                            return (
                              <li key={j} className="flex gap-3 items-start" style={{ fontSize: '1.0625rem', lineHeight: 1.8 }}>
                                <span className="flex-shrink-0 font-bold mt-0.5" style={{ color: themeColor }}>&rarr;</span>
                                <span className="text-ink">{li.replace(/^[-\u2022*]\s*/, '').trim()}</span>
                              </li>
                            )
                          })}
                        </ul>
                      )
                    }

                    {/* Drop cap on first paragraph */}
                    const isFirst = i === bodyBlocks.findIndex(b => b && !b.startsWith('## ') && !b.startsWith('> ') && !b.match(/^[-\u2022*] /m))
                    if (isFirst && block.length > 40) {
                      const firstChar = block.charAt(0)
                      const rest = block.slice(1)
                      return (
                        <p key={i} className="text-ink" style={{ fontSize: '1.0625rem', lineHeight: 1.85 }}>
                          <span className="float-left mr-2.5 mt-1 font-display" style={{ fontSize: '3.5rem', fontWeight: 900, lineHeight: 0.8, color: themeColor }}>
                            {firstChar}
                          </span>
                          {rest}
                        </p>
                      )
                    }

                    {/* Bold parsing */}
                    if (block.match(/\*\*[^*]+\*\*/)) {
                      const parts = block.split(/(\*\*[^*]+\*\*)/)
                      return (
                        <p key={i} className="text-ink" style={{ fontSize: '1.0625rem', lineHeight: 1.85 }}>
                          {parts.map(function (part, j) {
                            if (part.startsWith('**') && part.endsWith('**')) {
                              return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>
                            }
                            return <span key={j}>{part}</span>
                          })}
                        </p>
                      )
                    }

                    return <p key={i} className="text-ink" style={{ fontSize: '1.0625rem', lineHeight: 1.85 }}>{block}</p>
                  })}
                </div>
              ) : summary ? (
                <p className="text-ink" style={{ fontSize: '1.0625rem', lineHeight: 1.85 }}>{summary}</p>
              ) : null}

              {/* ── SOURCE CTA BOX ── */}
              {item.source_url && (
                <div className="mt-8 p-5 flex items-center justify-between gap-4 rounded-lg" style={{ border: `1px solid ${RULE}`, background: SIDEBAR_BG }}>
                  <div>
                    <p className="font-mono text-[0.65rem] uppercase tracking-[0.1em] mb-1" style={{ color: DIM }}>
                      {contentType === 'video' ? 'Watch the video' : contentType === 'tool' ? 'Use the tool' : 'Go to this resource'}
                    </p>
                    <p style={{ fontSize: '0.9rem' }}>
                      We found this for you at <strong>{(item as any).source_org_name || sourceDomain}</strong>
                    </p>
                  </div>
                  <a href={item.source_url} target="_blank" rel="noopener noreferrer"
                    className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 text-white transition-opacity hover:opacity-90 rounded-full font-mono text-[0.7rem] uppercase tracking-[0.08em] font-bold"
                    style={{ background: themeColor }}
                  >
                    <ExternalLink size={14} /> Take me there
                  </a>
                </div>
              )}

              {/* ── PROGRAMS ── */}
              {programs.length > 0 && (
                <div className="mt-10">
                  <h3 className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] mb-4" style={{ color: DIM }}>Programs</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {programs.map(function (prog, i) {
                      return (
                        <div key={i} className="p-5 rounded-lg flex gap-3" style={{ border: `1px solid ${RULE}`, background: 'white' }}>
                          <div className="w-1 flex-shrink-0 rounded-full" style={{ backgroundColor: themeColor }} />
                          <div>
                            <p className="font-semibold text-sm">{prog.name}</p>
                            <p className="mt-1 text-sm leading-relaxed" style={{ color: DIM }}>{prog.description}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════
                  ACTION CARDS — Change Lab pattern: icon + title + CTA
                 ══════════════════════════════════════════════════════════ */}
              {(hasActions || relatedPolicies.length > 0) && (
                <div className="mt-10">
                  <h3 className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] mb-5" style={{ color: DIM }}>Take Action</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {actionItems.volunteer_url && (
                      <a href={actionItems.volunteer_url} target="_blank" rel="noopener noreferrer"
                        className="block p-6 rounded-xl text-center border-[2px] border-gray-200 transition-all hover:-translate-y-1 hover:border-orange-400 hover:shadow-lg bg-white"
                      >
                        <span className="text-3xl block mb-3">🤝</span>
                        <h4 className="font-bold mb-2">Volunteer</h4>
                        <p className="text-sm mb-4" style={{ color: DIM }}>Give your time and talent</p>
                        <span className="inline-block px-5 py-2 rounded-full text-white text-xs font-bold uppercase tracking-wider"
                          style={{ background: `linear-gradient(135deg, ${themeColor}, #C75B2A)` }}
                        >Show Up &rarr;</span>
                      </a>
                    )}
                    {actionItems.donate_url && (
                      <a href={actionItems.donate_url} target="_blank" rel="noopener noreferrer"
                        className="block p-6 rounded-xl text-center border-[2px] border-gray-200 transition-all hover:-translate-y-1 hover:border-orange-400 hover:shadow-lg bg-white"
                      >
                        <span className="text-3xl block mb-3">💛</span>
                        <h4 className="font-bold mb-2">Donate</h4>
                        <p className="text-sm mb-4" style={{ color: DIM }}>Support this work</p>
                        <span className="inline-block px-5 py-2 rounded-full text-white text-xs font-bold uppercase tracking-wider"
                          style={{ background: `linear-gradient(135deg, ${themeColor}, #C75B2A)` }}
                        >Contribute &rarr;</span>
                      </a>
                    )}
                    {actionItems.signup_url && (
                      <a href={actionItems.signup_url} target="_blank" rel="noopener noreferrer"
                        className="block p-6 rounded-xl text-center border-[2px] border-gray-200 transition-all hover:-translate-y-1 hover:border-orange-400 hover:shadow-lg bg-white"
                      >
                        <span className="text-3xl block mb-3">✍️</span>
                        <h4 className="font-bold mb-2">Sign Up</h4>
                        <p className="text-sm mb-4" style={{ color: DIM }}>Get involved today</p>
                        <span className="inline-block px-5 py-2 rounded-full text-white text-xs font-bold uppercase tracking-wider"
                          style={{ background: `linear-gradient(135deg, ${themeColor}, #C75B2A)` }}
                        >Join &rarr;</span>
                      </a>
                    )}
                    {relatedPolicies.length > 0 && (
                      <Link href={'/policies/' + relatedPolicies[0].policy_id}
                        className="block p-6 rounded-xl text-center border-[2px] border-gray-200 transition-all hover:-translate-y-1 hover:border-purple-400 hover:shadow-lg bg-white"
                      >
                        <span className="text-3xl block mb-3">📜</span>
                        <h4 className="font-bold mb-2">Follow the Policy</h4>
                        <p className="text-sm mb-4" style={{ color: DIM }}>Track related legislation</p>
                        <span className="inline-block px-5 py-2 rounded-full text-white text-xs font-bold uppercase tracking-wider"
                          style={{ background: `linear-gradient(135deg, #4a2870, ${themeColor})` }}
                        >Learn More &rarr;</span>
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* ── COMMUNITY RESOURCES (211-style) ── */}
              {relatedServices.length > 0 && (
                <div className="mt-10">
                  <h3 className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] mb-2" style={{ color: DIM }}>Community Resources</h3>
                  <p className="text-sm mb-5" style={{ color: DIM }}>Services available in your community related to this topic</p>
                  <div className="space-y-3">
                    {relatedServices.map(function (svc: any) {
                      return (
                        <Link key={svc.service_id} href={'/services/' + svc.service_id}
                          className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-emerald-400 hover:shadow-sm transition-all bg-white group"
                        >
                          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: '#dcfce7', color: '#16a34a' }}
                          >
                            <Globe size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="block text-sm font-bold group-hover:underline truncate">{svc.service_name}</span>
                            {svc.phone && <span className="block text-xs mt-0.5" style={{ color: DIM }}>{svc.phone}</span>}
                            {svc.address && <span className="block text-xs" style={{ color: DIM }}>{svc.address}{svc.city ? `, ${svc.city}` : ''}</span>}
                          </div>
                          <ArrowRight size={14} className="flex-shrink-0 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ── WHO IS RESPONSIBLE ── */}
              {officials.length > 0 && (
                <div className="mt-10">
                  <h3 className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] mb-5" style={{ color: DIM }}>Who Is Responsible</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {officials.map(function (o: any) {
                      return (
                        <Link key={o.official_id} href={'/officials/' + o.official_id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all group bg-white"
                        >
                          <div className="w-12 h-12 overflow-hidden flex-shrink-0 rounded-full border-2 border-gray-200">
                            {o.photo_url ? (
                              <img src={o.photo_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-sm" style={{ color: themeColor, background: themeColor + '15' }}>
                                {o.official_name?.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="block text-sm font-bold group-hover:underline truncate">{o.official_name}</span>
                            <span className="block text-xs truncate" style={{ color: DIM }}>
                              {[o.title, o.party, o.level].filter(Boolean).join(' · ')}
                            </span>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                RIGHT: TAXONOMY WAYFINDER SIDEBAR
                Change Lab pattern: all classification dimensions as navigable sections
               ══════════════════════════════════════════════════════════════════ */}
            <aside className="w-full lg:w-[340px] flex-shrink-0">
              <div className="lg:sticky lg:top-4 space-y-0 rounded-2xl overflow-hidden" style={{ border: '2px solid #1a1a1a', background: 'white' }}>

                {/* Wayfinder Header */}
                <div className="px-6 pt-6 pb-4" style={{ borderBottom: '3px solid transparent', borderImage: `linear-gradient(90deg, ${themeColor}, #C75B2A) 1` }}>
                  <h2 className="font-display text-lg font-black uppercase tracking-[0.05em] mb-1"
                    style={{ background: `linear-gradient(135deg, ${themeColor}, #C75B2A)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                  >
                    Wayfinder
                  </h2>
                  <p className="text-xs" style={{ color: DIM }}>Navigate by topic to find related resources</p>
                </div>

                {/* Source Box */}
                {item.source_url && (
                  <div className="px-6 py-4" style={{ background: SIDEBAR_BG, borderBottom: `1px solid ${RULE}` }}>
                    <h4 className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.1em] mb-2" style={{ color: DIM }}>Source</h4>
                    <a href={item.source_url} target="_blank" rel="noopener noreferrer"
                      className="text-sm font-semibold hover:underline block truncate" style={{ color: themeColor }}
                    >
                      {(item as any).source_org_name || sourceDomain} &rarr;
                    </a>
                  </div>
                )}

                {/* Organization */}
                {orgData && (
                  <div className="px-6 py-4" style={{ borderBottom: `1px solid ${RULE}` }}>
                    <h4 className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.1em] mb-2" style={{ color: DIM }}>Organization</h4>
                    <Link href={'/organizations/' + orgData.org_id} className="group">
                      <span className="text-sm font-bold group-hover:underline block" style={{ color: INK }}>{orgData.org_name}</span>
                      {orgData.description_5th_grade && (
                        <span className="text-xs block mt-1 line-clamp-2" style={{ color: DIM }}>{orgData.description_5th_grade}</span>
                      )}
                    </Link>
                  </div>
                )}

                {/* Trail Position */}
                <div className="px-6 py-4" style={{ borderBottom: `1px solid ${RULE}` }}>
                  <h4 className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.1em] mb-3" style={{ color: DIM }}>Trail Position</h4>
                  <div className="space-y-0">
                    {TRAIL_LEVELS.map(function (level, i) {
                      const n = i + 1
                      const isActive = n === currentLevel
                      const isPast = n < currentLevel
                      const Icon = level.icon
                      return (
                        <div key={n} className="flex items-center gap-2.5 py-1.5"
                          style={{ opacity: isActive ? 1 : isPast ? 0.7 : 0.35 }}
                        >
                          <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 rounded-full"
                            style={{ background: isActive ? level.color : 'transparent' }}
                          >
                            <Icon size={11} style={{ color: isActive ? 'white' : level.color }} strokeWidth={2.5} />
                          </div>
                          <span className={'text-xs leading-tight ' + (isActive ? 'font-bold' : 'font-medium')}
                            style={{ color: isActive ? INK : undefined }}
                          >
                            {level.name}
                          </span>
                          {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: level.color }} />}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Pathway */}
                {themeEntry && (
                  <SidebarSection title="Pathway">
                    <Link href={'/pathways/' + themeSlug} className="flex items-center gap-2 group">
                      <FlowerOfLife size={18} color={themeColor} opacity={0.7} />
                      <span className="text-sm font-semibold group-hover:underline" style={{ color: themeColor }}>{themeEntry.name}</span>
                    </Link>
                  </SidebarSection>
                )}

                {/* Focus Areas */}
                {focusAreas.length > 0 && (
                  <SidebarSection title="Focus Areas">
                    {focusAreas.map(function (fa: any) {
                      return (
                        <Link key={fa.focus_id} href={'/explore/focus/' + fa.focus_id}
                          className="text-sm font-medium hover:underline block py-0.5" style={{ color: themeColor }}
                        >
                          {fa.focus_area_name}
                        </Link>
                      )
                    })}
                  </SidebarSection>
                )}

                {/* UN Sustainable Development Goals */}
                {matchedSDGs.length > 0 && (
                  <SidebarSection title="UN Sustainable Development Goals">
                    {matchedSDGs.map(function (sdg) {
                      return (
                        <Link key={sdg.sdg_number} href={'/explore?sdg=SDG-' + String(sdg.sdg_number).padStart(2, '0')}
                          className="flex items-center gap-2 py-0.5 group"
                        >
                          <span className="w-5 h-5 rounded-sm flex items-center justify-center text-white text-[0.6rem] font-bold flex-shrink-0"
                            style={{ background: sdg.sdg_color || themeColor }}
                          >
                            {sdg.sdg_number}
                          </span>
                          <span className="text-sm font-medium group-hover:underline" style={{ color: themeColor }}>{sdg.sdg_name}</span>
                        </Link>
                      )
                    })}
                  </SidebarSection>
                )}

                {/* SDOH Domain */}
                {sdohEntry && (
                  <SidebarSection title="Social Determinant of Health">
                    <span className="text-sm font-medium" style={{ color: themeColor }}>{sdohEntry.sdoh_name}</span>
                  </SidebarSection>
                )}

                {/* Audience */}
                {audienceData && (audienceData as any[]).length > 0 && (
                  <SidebarSection title="Audience">
                    {(audienceData as any[]).map(function (seg: any) {
                      return (
                        <Link key={seg.segment_id} href={'/explore?audience=' + seg.segment_id}
                          className="text-sm font-medium hover:underline block py-0.5" style={{ color: themeColor }}
                        >
                          {seg.segment_name}
                        </Link>
                      )
                    })}
                  </SidebarSection>
                )}

                {/* Action Types */}
                {actionTypeData && (actionTypeData as any[]).length > 0 && (
                  <SidebarSection title="Action Types">
                    {(actionTypeData as any[]).map(function (at: any) {
                      return (
                        <span key={at.action_type_id} className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full mr-1.5 mb-1.5"
                          style={{ background: themeColor + '15', color: themeColor }}
                        >
                          {at.action_type_name}
                        </span>
                      )
                    })}
                  </SidebarSection>
                )}

                {/* Time Commitment */}
                {timeData && (
                  <SidebarSection title="Time Commitment">
                    <span className="text-sm font-medium" style={{ color: themeColor }}>{(timeData as any).time_name}</span>
                  </SidebarSection>
                )}

                {/* Government Level */}
                {govData && (
                  <SidebarSection title="Government Level">
                    <span className="text-sm font-medium" style={{ color: themeColor }}>{(govData as any).gov_level_name}</span>
                  </SidebarSection>
                )}

                {/* Geographic Scope */}
                {geoScope && (
                  <SidebarSection title="Location">
                    <span className="text-sm font-medium" style={{ color: themeColor }}>{geoScope}</span>
                  </SidebarSection>
                )}

                {/* Content Type */}
                {contentType && (
                  <SidebarSection title="Content Type">
                    <span className="text-sm font-medium capitalize" style={{ color: themeColor }}>{contentType}</span>
                  </SidebarSection>
                )}

                {/* Related Policies */}
                {relatedPolicies.length > 0 && (
                  <SidebarSection title="Related Legislation">
                    {relatedPolicies.map(function (p: any) {
                      return (
                        <Link key={p.policy_id} href={'/policies/' + p.policy_id}
                          className="text-sm font-medium hover:underline block py-0.5" style={{ color: themeColor }}
                        >
                          {p.title_6th_grade || p.policy_name}
                          {p.level && <span className="text-xs ml-1" style={{ color: DIM }}>({p.level})</span>}
                        </Link>
                      )
                    })}
                  </SidebarSection>
                )}

                {/* Bottom padding */}
                <div className="h-4" />
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 3: CTA FOOTER
         ══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: INK }} className="text-center">
        <div className="max-w-[820px] mx-auto px-6 py-12">
          <h2 className="font-display text-2xl font-black text-white mb-3">Ready to go deeper?</h2>
          <p className="text-white/70 mb-6">Explore more resources along this pathway or find community organizations working on these issues.</p>
          <div className="flex flex-wrap justify-center gap-4">
            {themeSlug && (
              <Link href={'/pathways/' + themeSlug}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-white text-sm font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg"
                style={{ background: `linear-gradient(135deg, ${themeColor}, #C75B2A)` }}
              >
                Explore {themeEntry?.name} &rarr;
              </Link>
            )}
            <Link href="/explore"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full border-2 border-white/30 text-white text-sm font-bold transition-all hover:border-white/60"
            >
              Browse All Resources
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

/* ── Sidebar Section Component ── */
function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-6 py-4" style={{ borderBottom: '1px solid #dde1e8' }}>
      <h4 className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.1em] mb-2"
        style={{ color: '#5c6474' }}
      >
        {title}
      </h4>
      <div>{children}</div>
    </div>
  )
}
