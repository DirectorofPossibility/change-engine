'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Heart, Users, MapPin, Scale, Briefcase, Leaf, Globe,
  ArrowRight, ArrowLeft, Phone, ExternalLink, Calendar,
  Settings2, Building2, Landmark, Star, Home,
  ChevronRight,
} from 'lucide-react'
import { useNeighborhood } from '@/lib/contexts/NeighborhoodContext'
import { ZipInput } from '@/components/exchange/ZipInput'
import { THEMES } from '@/lib/constants'
import { FlowerOfLife } from '@/components/geo/sacred'
import { FolFallback } from '@/components/ui/FolFallback'

/* ── Types ── */

interface CompassClientProps {
  onboardingComplete: boolean
  zip?: string
  selectedThemes: string[]
  archetype?: string
  themeColors: string[]
  guideOrgs: any[]
  guideContent: any[]
  guidePolicies: any[]
  guideOfficials: any[]
  guideServices: any[]
  guideEvents: any[]
  pathwayStats: Record<string, { content: number; orgs: number; policies: number }>
}

/* ── Constants ── */

const PATHWAY_ICONS: Record<string, typeof Heart> = {
  THEME_01: Heart, THEME_02: Users, THEME_03: MapPin, THEME_04: Scale,
  THEME_05: Briefcase, THEME_06: Leaf, THEME_07: Globe,
}

const LEVEL_ICONS: Record<string, typeof Building2> = {
  City: Building2, County: Home, State: Star, Federal: Landmark,
}

const ARCHETYPES = [
  { id: 'neighbor', label: 'Neighbor', description: 'I want to know what is happening around me and how to get help when I need it.', color: '#4a2870' },
  { id: 'advocate', label: 'Advocate', description: 'I want to hold leaders accountable and push for change on the issues I care about.', color: '#7a2018' },
  { id: 'researcher', label: 'Researcher', description: 'I want to understand the data, the policies, and the systems that shape Houston.', color: '#1e4d7a' },
  { id: 'partner', label: 'Partner', description: 'I run a program or organization and want to connect with the broader ecosystem.', color: '#1a6b56' },
]

const themeEntries = Object.entries(THEMES) as [string, { name: string; color: string; slug: string; description: string }][]

/* ── Guide Section wrapper ── */

function GuideSection({ number, title, subtitle, children, seeAllHref, seeAllLabel }: {
  number: number
  title: string
  subtitle: string
  children: React.ReactNode
  seeAllHref?: string
  seeAllLabel?: string
}) {
  return (
    <section className="relative">
      {/* Section header */}
      <div className="flex items-start gap-4 mb-5">
        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 bg-ink text-white font-mono text-xs font-bold">
          {number}
        </div>
        <div className="flex-1">
          <h2 className="font-display text-xl font-bold text-ink leading-tight">{title}</h2>
          <p className="text-[13px] text-muted mt-0.5 leading-relaxed">{subtitle}</p>
        </div>
        {seeAllHref && (
          <Link href={seeAllHref} className="font-mono text-[10px] uppercase tracking-[0.1em] text-blue hover:underline inline-flex items-center gap-1 flex-shrink-0 mt-1">
            {seeAllLabel || 'See all'} <ArrowRight size={10} />
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}

/* ── Component ── */

export function CompassClient({
  onboardingComplete,
  zip,
  selectedThemes: savedThemes,
  archetype: savedArchetype,
  themeColors,
  guideOrgs,
  guideContent,
  guidePolicies,
  guideOfficials,
  guideServices,
  guideEvents,
  pathwayStats,
}: CompassClientProps) {
  const router = useRouter()
  const { neighborhood } = useNeighborhood()
  const neighborhoodName = neighborhood?.neighborhood_name || null

  const [step, setStep] = useState(1)
  const [pickedThemes, setPickedThemes] = useState<string[]>(savedThemes)
  const [pickedArchetype, setPickedArchetype] = useState<string>(savedArchetype || '')
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const showOnboarding = !onboardingComplete || editing

  function toggleTheme(id: string) {
    setPickedThemes(prev => {
      if (prev.includes(id)) return prev.filter(t => t !== id)
      if (prev.length >= 3) return prev
      return [...prev, id]
    })
  }

  async function savePreferences() {
    setSaving(true)
    await fetch('/api/compass-preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ themes: pickedThemes, archetype: pickedArchetype }),
    })
    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  /* ═══════════════════════════════════════════════════════════
     ONBOARDING FLOW
     ═══════════════════════════════════════════════════════════ */
  if (showOnboarding) {
    return (
      <div className="bg-paper min-h-screen">
        <div className="flex h-[3px]">
          {themeColors.map((c, i) => <div key={i} className="flex-1" style={{ background: c }} />)}
        </div>

        <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-12">
          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-10">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className="w-7 h-7 flex items-center justify-center text-xs font-bold font-mono"
                  style={{
                    background: step >= s ? '#0d1117' : 'transparent',
                    color: step >= s ? '#f4f5f7' : '#5c6474',
                    border: `2px solid ${step >= s ? '#0d1117' : '#dde1e8'}`,
                  }}
                >
                  {s}
                </div>
                {s < 3 && <div className="w-10 h-[2px]" style={{ background: step > s ? '#0d1117' : '#dde1e8' }} />}
              </div>
            ))}
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted ml-2">Step {step} of 3</span>
          </div>

          {/* STEP 1 */}
          {step === 1 && (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted mb-2">Calibrate Your Compass</p>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink leading-tight">What matters to you?</h1>
              <p className="text-base text-muted mt-3 mb-8 leading-relaxed">
                Pick up to <strong>three threads</strong> that matter most to you. We&rsquo;ll build a guide around the organizations, policies, leaders, and services working on those issues.
              </p>

              <div className="grid grid-cols-1 gap-2">
                {themeEntries.map(([id, theme]) => {
                  const Icon = PATHWAY_ICONS[id] || Heart
                  const selected = pickedThemes.includes(id)
                  const disabled = pickedThemes.length >= 3 && !selected
                  return (
                    <button
                      key={id}
                      onClick={() => toggleTheme(id)}
                      className="text-left p-4 transition-all group"
                      style={{
                        background: selected ? '#fff' : 'transparent',
                        border: selected ? `2px solid ${theme.color}` : '1px solid #dde1e8',
                        opacity: disabled ? 0.4 : 1,
                        cursor: disabled ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 flex items-center justify-center flex-shrink-0 transition-colors" style={{ background: selected ? theme.color : theme.color + '12' }}>
                          <Icon size={20} style={{ color: selected ? '#fff' : theme.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="block font-display font-bold text-[15px] text-ink">{theme.name}</span>
                          <span className="block text-[13px] text-muted mt-0.5 leading-snug">{theme.description.split('.')[0]}.</span>
                        </div>
                        {selected && (
                          <span className="w-6 h-6 flex items-center justify-center flex-shrink-0" style={{ background: theme.color }}>
                            <span className="text-white text-sm font-bold">&check;</span>
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  disabled={pickedThemes.length === 0}
                  className="inline-flex items-center gap-2 px-6 py-3 font-mono text-xs uppercase tracking-[0.08em] font-bold text-white transition-opacity"
                  style={{ background: pickedThemes.length > 0 ? '#0d1117' : '#5c6474', opacity: pickedThemes.length === 0 ? 0.4 : 1 }}
                >
                  Continue <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted mb-2">Your Location</p>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink leading-tight">Where are you?</h1>
              <p className="text-base text-muted mt-3 mb-8 leading-relaxed">
                Your ZIP code connects you to the leaders and services in your area.
              </p>
              <div className="p-6 bg-white border-2 border-rule">
                {neighborhoodName && (
                  <p className="mb-3 font-body text-[15px]">
                    Currently: <strong className="text-blue">{neighborhoodName}</strong>
                    {zip && <span className="text-muted"> (ZIP {zip})</span>}
                  </p>
                )}
                <ZipInput />
              </div>
              <div className="mt-8 flex items-center justify-between">
                <button onClick={() => setStep(1)} className="inline-flex items-center gap-2 px-4 py-3 font-mono text-xs uppercase tracking-[0.08em] text-muted">
                  <ArrowLeft size={14} /> Back
                </button>
                <button onClick={() => setStep(3)} className="inline-flex items-center gap-2 px-6 py-3 font-mono text-xs uppercase tracking-[0.08em] font-bold text-white bg-ink">
                  Continue <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted mb-2">Your Style</p>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink leading-tight">How do you engage?</h1>
              <p className="text-base text-muted mt-3 mb-8 leading-relaxed">No wrong answer — this helps us prioritize what we show you.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ARCHETYPES.map(arch => {
                  const selected = pickedArchetype === arch.id
                  return (
                    <button key={arch.id} onClick={() => setPickedArchetype(arch.id)} className="text-left p-5 transition-all" style={{ background: selected ? '#fff' : 'transparent', border: selected ? `2px solid ${arch.color}` : '1px solid #dde1e8' }}>
                      <FlowerOfLife size={28} color={selected ? arch.color : '#5c6474'} opacity={selected ? 1 : 0.3} />
                      <span className="block font-display font-bold text-[15px] text-ink mt-3">{arch.label}</span>
                      <span className="block text-[13px] text-muted mt-1 leading-snug">{arch.description}</span>
                    </button>
                  )
                })}
              </div>
              <div className="mt-8 flex items-center justify-between">
                <button onClick={() => setStep(2)} className="inline-flex items-center gap-2 px-4 py-3 font-mono text-xs uppercase tracking-[0.08em] text-muted">
                  <ArrowLeft size={14} /> Back
                </button>
                <button onClick={savePreferences} disabled={saving} className="inline-flex items-center gap-2 px-6 py-3 font-mono text-xs uppercase tracking-[0.08em] font-bold text-white transition-opacity" style={{ background: '#1b5e8a', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Building your guide...' : 'Build My Guide'} <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  /* ═══════════════════════════════════════════════════════════
     THE GUIDE
     ═══════════════════════════════════════════════════════════ */

  const greeting = (() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  const selectedThemeEntries = themeEntries.filter(([id]) => savedThemes.includes(id))

  // Group officials by level
  const officialsByLevel: Record<string, any[]> = {}
  for (const o of guideOfficials) {
    const level = o.level || 'Other'
    if (!officialsByLevel[level]) officialsByLevel[level] = []
    officialsByLevel[level].push(o)
  }

  // Track guide section numbering
  let sectionNum = 0

  return (
    <div className="bg-paper min-h-screen">
      {/* ── HERO ── */}
      <section>
        <div className="flex h-[4px]">
          {selectedThemeEntries.map(([id, theme]) => (
            <div key={id} className="flex-1" style={{ background: theme.color }} />
          ))}
        </div>

        <div className="max-w-[720px] mx-auto px-4 sm:px-6 pt-10 pb-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted mb-3">Your Civic Compass</p>
              <h1 className="font-display text-3xl sm:text-[2.5rem] font-bold text-ink leading-[1.1]">
                {greeting}, {neighborhoodName || 'Houston'}
              </h1>
              <p className="text-[15px] text-muted mt-3 leading-relaxed max-w-[520px]">
                This is your personalized guide to the organizations, policies, leaders, and services aligned with what matters to you.
              </p>

              {/* Pathway tags */}
              <div className="flex flex-wrap gap-2 mt-5">
                {selectedThemeEntries.map(([id, theme]) => {
                  const Icon = PATHWAY_ICONS[id] || Heart
                  const stats = pathwayStats[id]
                  return (
                    <Link
                      key={id}
                      href={'/pathways/' + theme.slug}
                      className="inline-flex items-center gap-1.5 px-3 py-2 border transition-colors hover:bg-white group"
                      style={{ borderColor: theme.color + '40' }}
                    >
                      <Icon size={13} style={{ color: theme.color }} />
                      <span className="font-display text-[13px] font-bold text-ink group-hover:text-blue">{theme.name}</span>
                      {stats && (
                        <span className="font-mono text-[9px] text-muted ml-1">
                          {stats.orgs} orgs · {stats.content} articles
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>

            <div className="hidden sm:flex flex-col items-center gap-2 flex-shrink-0 pt-2">
              <FlowerOfLife size={64} color="#0d1117" opacity={0.06} />
              <button
                onClick={() => { setEditing(true); setStep(1) }}
                className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.08em] text-blue hover:underline"
              >
                <Settings2 size={11} /> Edit
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[720px] mx-auto px-4 sm:px-6">
        <div className="h-px bg-rule" />
      </div>

      {/* ── GUIDE SECTIONS ── */}
      <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-10 space-y-12">

        {/* ═══ 1. WHO'S DOING THE WORK — Organizations ═══ */}
        {guideOrgs.length > 0 && (
          <GuideSection
            number={++sectionNum}
            title="Who&rsquo;s Doing the Work"
            subtitle="Organizations in Houston working on the issues you care about."
            seeAllHref="/organizations"
            seeAllLabel="All organizations"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {guideOrgs.slice(0, 8).map(function (org: any) {
                const themeColor = org.theme_id && THEMES[org.theme_id as keyof typeof THEMES]?.color
                return (
                  <Link
                    key={org.org_id}
                    href={'/organizations/' + org.org_id}
                    className="flex items-start gap-3 p-4 bg-white border border-rule hover:border-ink transition-colors group"
                  >
                    <div className="w-10 h-10 flex-shrink-0 overflow-hidden border border-rule bg-white flex items-center justify-center">
                      {org.logo_url ? (
                        <Image src={org.logo_url} alt="" width={40} height={40} className="w-full h-full object-contain p-0.5" />
                      ) : (
                        <span className="font-bold text-sm text-muted">{org.org_name?.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block text-[14px] font-bold text-ink group-hover:text-blue leading-snug line-clamp-1">{org.org_name}</span>
                      {org.description_5th_grade && (
                        <span className="block text-[12px] text-muted mt-0.5 line-clamp-2 leading-relaxed">{org.description_5th_grade}</span>
                      )}
                      <div className="flex items-center gap-2 mt-1.5 font-mono text-[10px] text-faint">
                        {org.city && <span>{org.city}</span>}
                        {org.website && <span className="text-blue">Website</span>}
                        {themeColor && <span className="w-1.5 h-1.5 flex-shrink-0" style={{ background: themeColor }} />}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </GuideSection>
        )}

        {/* ═══ 2. WHAT TO KNOW — Content from your pathways ═══ */}
        {guideContent.length > 0 && (
          <GuideSection
            number={++sectionNum}
            title="What to Know"
            subtitle="The latest articles, reports, and resources from your pathways."
            seeAllHref="/news"
            seeAllLabel="All news"
          >
            {/* Lead story */}
            {guideContent[0] && (
              <Link
                href={'/content/' + guideContent[0].id}
                className="block bg-white border border-rule hover:border-ink transition-colors group mb-3"
              >
                <div className="h-44 overflow-hidden">
                  {guideContent[0].image_url ? (
                    <Image src={guideContent[0].image_url} alt="" width={800} height={400} className="w-full h-full object-cover" />
                  ) : (
                    <FolFallback pathway={guideContent[0].pathway_primary} height="h-full" />
                  )}
                </div>
                <div className="p-4">
                  {guideContent[0].pathway_primary && THEMES[guideContent[0].pathway_primary as keyof typeof THEMES] && (
                    <span className="font-mono text-[10px] uppercase tracking-[0.1em] mb-1 block"
                      style={{ color: THEMES[guideContent[0].pathway_primary as keyof typeof THEMES].color }}>
                      {THEMES[guideContent[0].pathway_primary as keyof typeof THEMES].name}
                    </span>
                  )}
                  <span className="block text-[17px] font-display font-bold text-ink group-hover:text-blue leading-snug">{guideContent[0].title_6th_grade}</span>
                  {guideContent[0].summary_6th_grade && (
                    <span className="block text-[13px] text-muted mt-1.5 line-clamp-2 leading-relaxed">{guideContent[0].summary_6th_grade}</span>
                  )}
                </div>
              </Link>
            )}

            {/* Remaining articles */}
            {guideContent.length > 1 && (
              <div className="border border-rule divide-y divide-rule bg-white">
                {guideContent.slice(1, 6).map(function (c: any) {
                  const theme = c.pathway_primary && THEMES[c.pathway_primary as keyof typeof THEMES]
                  return (
                    <Link key={c.id} href={'/content/' + c.id} className="flex items-center gap-3 p-3 hover:bg-paper transition-colors group">
                      <div className="w-12 h-12 flex-shrink-0 overflow-hidden border border-rule">
                        {c.image_url ? (
                          <Image src={c.image_url} alt="" width={48} height={48} className="w-full h-full object-cover" />
                        ) : (
                          <FolFallback pathway={c.pathway_primary} height="h-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="block text-[13px] font-bold text-ink group-hover:text-blue leading-snug line-clamp-2">{c.title_6th_grade}</span>
                        <span className="block text-[10px] text-faint mt-0.5 font-mono">
                          {theme && <span style={{ color: theme.color }}>{theme.name}</span>}
                          {c.source_org_name && <> · {c.source_org_name}</>}
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </GuideSection>
        )}

        {/* ═══ 3. WHAT'S BEING DECIDED — Policies ═══ */}
        {guidePolicies.length > 0 && (
          <GuideSection
            number={++sectionNum}
            title="What&rsquo;s Being Decided"
            subtitle="Legislation, ordinances, and policy actions that touch your topics."
            seeAllHref="/policies"
            seeAllLabel="All policies"
          >
            <div className="space-y-2">
              {guidePolicies.map(function (p: any) {
                return (
                  <Link key={p.policy_id} href={'/policies/' + p.policy_id} className="block p-4 bg-white border border-rule hover:border-ink transition-colors group">
                    <div className="flex items-start gap-3">
                      <div className="w-1 self-stretch flex-shrink-0 bg-blue mt-1" style={{ minHeight: 24 }} />
                      <div className="flex-1 min-w-0">
                        <span className="block text-[14px] font-bold text-ink group-hover:text-blue leading-snug">{p.title_6th_grade || p.policy_name}</span>
                        {p.summary_5th_grade && (
                          <span className="block text-[13px] text-muted mt-1 line-clamp-2 leading-relaxed">{p.summary_5th_grade}</span>
                        )}
                        <div className="flex items-center gap-2 mt-2 font-mono text-[10px] uppercase tracking-[0.08em] text-faint">
                          {p.level && <span>{p.level}</span>}
                          {p.status && <><span>·</span><span>{p.status}</span></>}
                          {p.bill_number && <><span>·</span><span>{p.bill_number}</span></>}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </GuideSection>
        )}

        {/* ═══ 4. WHO'S RESPONSIBLE — Officials ═══ */}
        {guideOfficials.length > 0 && (
          <GuideSection
            number={++sectionNum}
            title="Who&rsquo;s Responsible"
            subtitle="The elected leaders accountable to you — from City Hall to the Capitol."
            seeAllHref="/officials"
            seeAllLabel="All officials"
          >
            <div className="space-y-4">
              {['City', 'County', 'State', 'Federal'].map(function (level) {
                const group = officialsByLevel[level]
                if (!group || group.length === 0) return null
                const LIcon = LEVEL_ICONS[level] || Building2
                return (
                  <div key={level}>
                    <div className="flex items-center gap-2 mb-2">
                      <LIcon size={13} className="text-muted" />
                      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted font-bold">{level}</span>
                      <div className="flex-1 h-px bg-rule" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {group.slice(0, 6).map(function (o: any) {
                        return (
                          <Link key={o.official_id} href={'/officials/' + o.official_id} className="flex items-center gap-3 p-3 bg-white border border-rule hover:border-ink transition-colors group">
                            <div className="w-10 h-10 flex-shrink-0 overflow-hidden bg-paper border border-rule">
                              {o.photo_url ? (
                                <Image src={o.photo_url} alt="" width={40} height={40} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-sm text-muted">{o.official_name?.charAt(0)}</div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="block text-[13px] font-bold text-ink group-hover:text-blue truncate">{o.official_name}</span>
                              <span className="block text-[11px] text-muted truncate">{o.title}{o.party ? ' · ' + o.party : ''}</span>
                            </div>
                            <ChevronRight size={14} className="text-muted flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        )
                      })}
                    </div>
                    {group.length > 6 && (
                      <Link href="/officials" className="block mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-blue hover:underline">+ {group.length - 6} more</Link>
                    )}
                  </div>
                )
              })}
            </div>
          </GuideSection>
        )}

        {/* ═══ 5. WHERE TO GET HELP — 211 Services ═══ */}
        {guideServices.length > 0 && (
          <GuideSection
            number={++sectionNum}
            title="Where to Get Help"
            subtitle={zip ? `Free and low-cost services near ZIP ${zip}, aligned with your topics.` : 'Free and low-cost services in the Houston area.'}
            seeAllHref="/services"
            seeAllLabel="All services"
          >
            <div className="border border-rule divide-y divide-rule bg-white">
              {guideServices.map(function (svc: any) {
                return (
                  <Link key={svc.service_id} href={'/services/' + svc.service_id} className="block p-4 hover:bg-paper transition-colors group">
                    <span className="block text-[14px] font-bold text-ink group-hover:text-blue leading-snug">{svc.service_name}</span>
                    {svc.description_5th_grade && (
                      <span className="block text-[12px] text-muted mt-1 line-clamp-2 leading-relaxed">{svc.description_5th_grade}</span>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 font-mono text-[10px] text-faint">
                      {svc.city && <span>{svc.city}</span>}
                      {svc.phone && <span className="inline-flex items-center gap-0.5"><Phone size={9} /> {svc.phone}</span>}
                    </div>
                  </Link>
                )
              })}
            </div>
          </GuideSection>
        )}

        {/* ═══ COMING UP — Events ═══ */}
        {guideEvents.length > 0 && (
          <GuideSection
            number={++sectionNum}
            title="Coming Up"
            subtitle="Upcoming events and opportunities to get involved."
            seeAllHref="/opportunities"
            seeAllLabel="All opportunities"
          >
            <div className="border border-rule divide-y divide-rule bg-white">
              {guideEvents.map(function (evt: any) {
                return (
                  <div key={evt.opportunity_id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 bg-paper border border-rule">
                        <Calendar size={16} className="text-blue" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={'/opportunities/' + evt.opportunity_id} className="block text-[14px] font-bold text-ink hover:text-blue leading-snug">
                          {evt.opportunity_name}
                        </Link>
                        {evt.start_date && (
                          <span className="block text-[11px] text-muted font-mono mt-0.5">
                            {new Date(evt.start_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            {evt.city && <> · {evt.city}</>}
                            {evt.is_virtual && ' · Virtual'}
                          </span>
                        )}
                        {evt.description_5th_grade && (
                          <span className="block text-[12px] text-muted mt-1 line-clamp-2 leading-relaxed">{evt.description_5th_grade}</span>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          {evt.registration_url && (
                            <a href={evt.registration_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.08em] text-blue hover:underline">
                              Register <ExternalLink size={9} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </GuideSection>
        )}

        {/* ── Empty state ── */}
        {guideOrgs.length === 0 && guideContent.length === 0 && guidePolicies.length === 0 && guideOfficials.length === 0 && guideServices.length === 0 && (
          <div className="text-center py-12">
            <FlowerOfLife size={56} color="#1b5e8a" opacity={0.15} />
            <p className="mt-4 text-base text-muted">Your guide is warming up. Try adding a ZIP code to unlock local results.</p>
            <button onClick={() => { setEditing(true); setStep(2) }} className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 font-mono text-xs uppercase tracking-[0.08em] font-bold text-white bg-blue">
              Add your ZIP <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* ── 24/7 Hotlines ── */}
        <div className="border-t border-rule pt-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted font-bold mb-3">24/7 Lines — Always Available</p>
          <div className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-[11px] text-muted">
            <span>Crisis: <strong className="text-ink">988</strong></span>
            <span>City: <strong className="text-ink">311</strong></span>
            <span>Social Services: <strong className="text-ink">211</strong></span>
            <span>DV Hotline: <strong className="text-ink">713-528-2121</strong></span>
          </div>
        </div>
      </div>
    </div>
  )
}
