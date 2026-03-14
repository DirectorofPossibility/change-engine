'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Heart, Users, MapPin, Scale, Briefcase, Leaf, Globe,
  ArrowRight, ArrowLeft, Phone, ExternalLink, Calendar,
  Settings2, Building2, Landmark, Star, Home,
  ChevronRight, BookOpen, Shield, FileText, Handshake,
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

/* ── The 5 Journey Steps ── */

const JOURNEY_STEPS = [
  { num: 1, name: 'Understand', verb: 'Learn the landscape', icon: BookOpen, color: '#1b5e8a' },
  { num: 2, name: 'Discover', verb: 'Meet who\u2019s doing the work', icon: Handshake, color: '#1a6b56' },
  { num: 3, name: 'Access', verb: 'Find help and resources', icon: Phone, color: '#4a2870' },
  { num: 4, name: 'Engage', verb: 'Know the stakes and the players', icon: Shield, color: '#7a2018' },
  { num: 5, name: 'Show Up', verb: 'Get involved in person', icon: Calendar, color: '#0d1117' },
]

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
          <div className="flex items-center gap-3 mb-10">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className="w-7 h-7 flex items-center justify-center text-xs font-bold font-mono" style={{ background: step >= s ? '#0d1117' : 'transparent', color: step >= s ? '#f4f5f7' : '#5c6474', border: `2px solid ${step >= s ? '#0d1117' : '#dde1e8'}` }}>
                  {s}
                </div>
                {s < 3 && <div className="w-10 h-[2px]" style={{ background: step > s ? '#0d1117' : '#dde1e8' }} />}
              </div>
            ))}
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted ml-2">Step {step} of 3</span>
          </div>

          {step === 1 && (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted mb-2">Calibrate Your Compass</p>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink leading-tight">What matters to you?</h1>
              <p className="text-base text-muted mt-3 mb-8 leading-relaxed">
                Pick up to <strong>three threads</strong>. We&rsquo;ll build a guide around the organizations, policies, leaders, and services working on those issues.
              </p>
              <div className="grid grid-cols-1 gap-2">
                {themeEntries.map(([id, theme]) => {
                  const Icon = PATHWAY_ICONS[id] || Heart
                  const selected = pickedThemes.includes(id)
                  const disabled = pickedThemes.length >= 3 && !selected
                  return (
                    <button key={id} onClick={() => toggleTheme(id)} className="text-left p-4 transition-all" style={{ background: selected ? '#fff' : 'transparent', border: selected ? `2px solid ${theme.color}` : '1px solid #dde1e8', opacity: disabled ? 0.4 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}>
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 flex items-center justify-center flex-shrink-0" style={{ background: selected ? theme.color : theme.color + '12' }}>
                          <Icon size={20} style={{ color: selected ? '#fff' : theme.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="block font-display font-bold text-[15px] text-ink">{theme.name}</span>
                          <span className="block text-[13px] text-muted mt-0.5 leading-snug">{theme.description.split('.')[0]}.</span>
                        </div>
                        {selected && <span className="w-6 h-6 flex items-center justify-center flex-shrink-0" style={{ background: theme.color }}><span className="text-white text-sm font-bold">&check;</span></span>}
                      </div>
                    </button>
                  )
                })}
              </div>
              <div className="mt-8 flex justify-end">
                <button onClick={() => setStep(2)} disabled={pickedThemes.length === 0} className="inline-flex items-center gap-2 px-6 py-3 font-mono text-xs uppercase tracking-[0.08em] font-bold text-white" style={{ background: pickedThemes.length > 0 ? '#0d1117' : '#5c6474', opacity: pickedThemes.length === 0 ? 0.4 : 1 }}>
                  Continue <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted mb-2">Your Location</p>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink leading-tight">Where are you?</h1>
              <p className="text-base text-muted mt-3 mb-8 leading-relaxed">Your ZIP code connects you to local leaders and services.</p>
              <div className="p-6 bg-white border-2 border-rule">
                {neighborhoodName && <p className="mb-3 text-[15px]">Currently: <strong className="text-blue">{neighborhoodName}</strong>{zip && <span className="text-muted"> ({zip})</span>}</p>}
                <ZipInput />
              </div>
              <div className="mt-8 flex items-center justify-between">
                <button onClick={() => setStep(1)} className="inline-flex items-center gap-2 px-4 py-3 font-mono text-xs uppercase tracking-[0.08em] text-muted"><ArrowLeft size={14} /> Back</button>
                <button onClick={() => setStep(3)} className="inline-flex items-center gap-2 px-6 py-3 font-mono text-xs uppercase tracking-[0.08em] font-bold text-white bg-ink">Continue <ArrowRight size={14} /></button>
              </div>
            </div>
          )}

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
                <button onClick={() => setStep(2)} className="inline-flex items-center gap-2 px-4 py-3 font-mono text-xs uppercase tracking-[0.08em] text-muted"><ArrowLeft size={14} /> Back</button>
                <button onClick={savePreferences} disabled={saving} className="inline-flex items-center gap-2 px-6 py-3 font-mono text-xs uppercase tracking-[0.08em] font-bold text-white" style={{ background: '#1b5e8a', opacity: saving ? 0.6 : 1 }}>
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
     THE GUIDE — 5-Step Journey
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

  return (
    <div className="bg-paper min-h-screen">

      {/* ── HERO ── */}
      <section>
        <div className="flex h-[4px]">
          {selectedThemeEntries.map(([id, theme]) => (
            <div key={id} className="flex-1" style={{ background: theme.color }} />
          ))}
        </div>

        <div className="max-w-[760px] mx-auto px-4 sm:px-6 pt-10 pb-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted mb-3">Your Civic Compass</p>
              <h1 className="font-display text-3xl sm:text-[2.5rem] font-bold text-ink leading-[1.1]">
                {greeting}, {neighborhoodName || 'Houston'}
              </h1>
              <p className="text-[15px] text-muted mt-3 leading-relaxed max-w-[520px]">
                A guide to the organizations, knowledge, services, decisions, and people connected to what matters to you.
              </p>

              {/* Pathway tags with stats */}
              <div className="flex flex-wrap gap-2 mt-5">
                {selectedThemeEntries.map(([id, theme]) => {
                  const Icon = PATHWAY_ICONS[id] || Heart
                  const stats = pathwayStats[id]
                  return (
                    <Link key={id} href={'/pathways/' + theme.slug} className="inline-flex items-center gap-1.5 px-3 py-2 border transition-colors hover:bg-white group" style={{ borderColor: theme.color + '40' }}>
                      <Icon size={13} style={{ color: theme.color }} />
                      <span className="font-display text-[13px] font-bold text-ink group-hover:text-blue">{theme.name}</span>
                      {stats && <span className="font-mono text-[9px] text-muted ml-1">{stats.orgs} orgs · {stats.content} articles</span>}
                    </Link>
                  )
                })}
              </div>
            </div>
            <div className="hidden sm:flex flex-col items-center gap-2 flex-shrink-0 pt-2">
              <FlowerOfLife size={64} color="#0d1117" opacity={0.06} />
              <button onClick={() => { setEditing(true); setStep(1) }} className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.08em] text-blue hover:underline">
                <Settings2 size={11} /> Edit
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── JOURNEY STEP NAV ── */}
      <div className="border-y border-rule bg-white">
        <div className="max-w-[760px] mx-auto px-4 sm:px-6">
          <div className="flex overflow-x-auto gap-0 -mx-1">
            {JOURNEY_STEPS.map(function (js) {
              const Icon = js.icon
              const hasContent = (js.num === 1 && guideContent.length > 0) ||
                (js.num === 2 && guideOrgs.length > 0) ||
                (js.num === 3 && guideServices.length > 0) ||
                (js.num === 4 && (guidePolicies.length > 0 || guideOfficials.length > 0)) ||
                (js.num === 5 && guideEvents.length > 0)
              return (
                <a
                  key={js.num}
                  href={'#step-' + js.num}
                  className={'flex items-center gap-2 px-3 py-3.5 font-mono text-[10px] uppercase tracking-[0.08em] border-b-2 transition-colors whitespace-nowrap ' + (hasContent ? 'text-ink border-transparent hover:border-ink' : 'text-faint border-transparent')}
                >
                  <span className="w-5 h-5 flex items-center justify-center text-[9px] font-bold flex-shrink-0" style={{ background: hasContent ? js.color : '#dde1e8', color: '#fff' }}>{js.num}</span>
                  {js.name}
                </a>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── GUIDE BODY ── */}
      <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-10 space-y-14">

        {/* ═══════════════════════════════════════════
            STEP 1: UNDERSTAND — Content highlights
            ═══════════════════════════════════════════ */}
        {guideContent.length > 0 && (
          <section id="step-1">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 flex items-center justify-center flex-shrink-0" style={{ background: JOURNEY_STEPS[0].color }}>
                <span className="text-white text-xs font-bold font-mono">1</span>
              </div>
              <div className="flex-1">
                <h2 className="font-display text-lg font-bold text-ink">Understand</h2>
                <p className="text-[12px] text-muted">The latest from your pathways — news, analysis, and context.</p>
              </div>
              <Link href="/news" className="font-mono text-[10px] uppercase tracking-[0.1em] text-blue hover:underline inline-flex items-center gap-1">Explore <ArrowRight size={10} /></Link>
            </div>

            {/* Compact highlight cards — 2 column */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {guideContent.slice(0, 4).map(function (c: any) {
                const theme = c.pathway_primary && THEMES[c.pathway_primary as keyof typeof THEMES]
                return (
                  <Link key={c.id} href={'/content/' + c.id} className="flex gap-3 p-3 bg-white border border-rule hover:border-ink transition-colors group">
                    <div className="w-16 h-16 flex-shrink-0 overflow-hidden border border-rule">
                      {c.image_url ? (
                        <Image src={c.image_url} alt="" width={64} height={64} className="w-full h-full object-cover" />
                      ) : (
                        <FolFallback pathway={c.pathway_primary} height="h-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {theme && <span className="font-mono text-[9px] uppercase tracking-[0.1em] block mb-0.5" style={{ color: theme.color }}>{theme.name}</span>}
                      <span className="block text-[13px] font-bold text-ink group-hover:text-blue leading-snug line-clamp-2">{c.title_6th_grade}</span>
                      <span className="block text-[10px] text-faint mt-0.5 font-mono">{c.source_org_name}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════
            STEP 2: DISCOVER — Organizations (THE PRIMARY SECTION)
            ═══════════════════════════════════════════ */}
        {guideOrgs.length > 0 && (
          <section id="step-2">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 flex items-center justify-center flex-shrink-0" style={{ background: JOURNEY_STEPS[1].color }}>
                <span className="text-white text-xs font-bold font-mono">2</span>
              </div>
              <div className="flex-1">
                <h2 className="font-display text-xl font-bold text-ink">Discover Who&rsquo;s Doing the Work</h2>
                <p className="text-[12px] text-muted">Organizations in Houston aligned with your pathways. Start here.</p>
              </div>
              <Link href="/organizations" className="font-mono text-[10px] uppercase tracking-[0.1em] text-blue hover:underline inline-flex items-center gap-1">All orgs <ArrowRight size={10} /></Link>
            </div>

            <p className="text-[14px] text-muted mb-5 leading-relaxed pl-11">
              These are the groups running programs, providing services, and organizing around the issues you selected. Click through to learn what they offer and how to connect.
            </p>

            {/* Rich org cards — THE HERO of the guide */}
            <div className="space-y-3">
              {guideOrgs.slice(0, 10).map(function (org: any) {
                const themeColor = org.theme_id && THEMES[org.theme_id as keyof typeof THEMES]?.color
                const themeName = org.theme_id && THEMES[org.theme_id as keyof typeof THEMES]?.name
                return (
                  <Link
                    key={org.org_id}
                    href={'/organizations/' + org.org_id}
                    className="block bg-white border-2 border-rule hover:border-ink transition-colors group"
                  >
                    {/* Thin pathway color bar */}
                    {themeColor && <div className="h-[3px]" style={{ background: themeColor }} />}

                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        {/* Logo */}
                        <div className="w-14 h-14 flex-shrink-0 overflow-hidden border border-rule bg-white flex items-center justify-center">
                          {org.logo_url ? (
                            <Image src={org.logo_url} alt="" width={56} height={56} className="w-full h-full object-contain p-1" />
                          ) : (
                            <span className="font-display font-bold text-lg text-muted">{org.org_name?.charAt(0)}</span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Pathway tag */}
                          {themeName && (
                            <span className="font-mono text-[9px] uppercase tracking-[0.12em] mb-1 block" style={{ color: themeColor }}>{themeName}</span>
                          )}

                          {/* Org name */}
                          <h3 className="font-display text-[17px] font-bold text-ink group-hover:text-blue leading-snug">{org.org_name}</h3>

                          {/* Mission / description */}
                          {(org.mission_statement || org.description_5th_grade) && (
                            <p className="text-[13px] text-muted mt-1.5 leading-relaxed line-clamp-2">
                              {org.mission_statement || org.description_5th_grade}
                            </p>
                          )}

                          {/* Meta row */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 font-mono text-[10px] text-faint">
                            {org.city && <span className="inline-flex items-center gap-1"><MapPin size={10} /> {org.city}</span>}
                            {org.phone && <span className="inline-flex items-center gap-1"><Phone size={10} /> {org.phone}</span>}
                            {org.website && <span className="text-blue inline-flex items-center gap-1"><ExternalLink size={10} /> Website</span>}
                          </div>
                        </div>

                        <ChevronRight size={18} className="text-muted flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            {guideOrgs.length > 10 && (
              <Link href="/organizations" className="block mt-3 text-center font-mono text-[11px] uppercase tracking-[0.08em] text-blue hover:underline py-3 border border-rule bg-white">
                View all {guideOrgs.length}+ organizations <ArrowRight size={11} className="inline ml-1" />
              </Link>
            )}
          </section>
        )}

        {/* ═══════════════════════════════════════════
            STEP 3: ACCESS — Services (compact highlights)
            ═══════════════════════════════════════════ */}
        {guideServices.length > 0 && (
          <section id="step-3" className="bg-white border-2 border-rule p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-7 h-7 flex items-center justify-center flex-shrink-0" style={{ background: JOURNEY_STEPS[2].color }}>
                <span className="text-white text-[10px] font-bold font-mono">3</span>
              </div>
              <h2 className="font-display text-base font-bold text-ink flex-1">Access Help &amp; Resources</h2>
              <Link href="/services" className="font-mono text-[10px] uppercase tracking-[0.1em] text-blue hover:underline inline-flex items-center gap-1">All services <ArrowRight size={10} /></Link>
            </div>
            <p className="text-[12px] text-muted mb-4 leading-relaxed">Free and low-cost services{zip ? ` near ZIP ${zip}` : ' in Houston'}, aligned with your topics.</p>

            <div className="divide-y divide-rule">
              {guideServices.slice(0, 5).map(function (svc: any) {
                return (
                  <Link key={svc.service_id} href={'/services/' + svc.service_id} className="flex items-center gap-3 py-3 group">
                    <Phone size={14} className="text-muted flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-[13px] font-bold text-ink group-hover:text-blue truncate block">{svc.service_name}</span>
                      {svc.description_5th_grade && <span className="text-[11px] text-muted line-clamp-1 block">{svc.description_5th_grade}</span>}
                    </div>
                    {svc.phone && <span className="font-mono text-[10px] text-faint flex-shrink-0 hidden sm:block">{svc.phone}</span>}
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════
            STEP 4: ENGAGE — Policies + Officials (compact highlights)
            ═══════════════════════════════════════════ */}
        {(guidePolicies.length > 0 || guideOfficials.length > 0) && (
          <section id="step-4">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 flex items-center justify-center flex-shrink-0" style={{ background: JOURNEY_STEPS[3].color }}>
                <span className="text-white text-xs font-bold font-mono">4</span>
              </div>
              <div className="flex-1">
                <h2 className="font-display text-base font-bold text-ink">Engage — The Stakes &amp; The Players</h2>
                <p className="text-[12px] text-muted">What&rsquo;s being decided and who&rsquo;s making the calls.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Policies highlight box */}
              {guidePolicies.length > 0 && (
                <div className="bg-white border-2 border-rule p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted font-bold">Policies to Watch</h3>
                    <Link href="/policies" className="font-mono text-[10px] uppercase tracking-[0.08em] text-blue hover:underline">All</Link>
                  </div>
                  <div className="space-y-3">
                    {guidePolicies.slice(0, 4).map(function (p: any) {
                      return (
                        <Link key={p.policy_id} href={'/policies/' + p.policy_id} className="block group">
                          <div className="flex items-start gap-2">
                            <div className="w-1 mt-1 self-stretch flex-shrink-0 bg-blue" style={{ minHeight: 16 }} />
                            <div className="min-w-0">
                              <span className="text-[13px] font-bold text-ink group-hover:text-blue leading-snug line-clamp-2 block">{p.title_6th_grade || p.policy_name}</span>
                              <span className="font-mono text-[9px] text-faint uppercase mt-0.5 block">{[p.level, p.status, p.bill_number].filter(Boolean).join(' · ')}</span>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Officials highlight box */}
              {guideOfficials.length > 0 && (
                <div className="bg-white border-2 border-rule p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted font-bold">Who&rsquo;s Accountable</h3>
                    <Link href="/officials" className="font-mono text-[10px] uppercase tracking-[0.08em] text-blue hover:underline">All</Link>
                  </div>
                  <div className="space-y-3">
                    {['City', 'County', 'State', 'Federal'].map(function (level) {
                      const group = officialsByLevel[level]
                      if (!group || group.length === 0) return null
                      const LIcon = LEVEL_ICONS[level] || Building2
                      return (
                        <div key={level}>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <LIcon size={11} className="text-faint" />
                            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-faint font-bold">{level}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {group.slice(0, 4).map(function (o: any) {
                              return (
                                <Link key={o.official_id} href={'/officials/' + o.official_id} className="inline-flex items-center gap-1.5 px-2 py-1 bg-paper border border-rule hover:border-ink transition-colors text-[11px] font-bold text-ink hover:text-blue">
                                  {o.photo_url ? (
                                    <Image src={o.photo_url} alt="" width={18} height={18} className="w-[18px] h-[18px] object-cover rounded-full" />
                                  ) : (
                                    <span className="w-[18px] h-[18px] bg-rule rounded-full flex items-center justify-center text-[8px] text-muted font-bold">{o.official_name?.charAt(0)}</span>
                                  )}
                                  <span className="truncate max-w-[120px]">{o.official_name}</span>
                                </Link>
                              )
                            })}
                            {group.length > 4 && <span className="text-[10px] text-faint self-center font-mono">+{group.length - 4}</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════
            STEP 5: SHOW UP — Events (compact highlights)
            ═══════════════════════════════════════════ */}
        {guideEvents.length > 0 && (
          <section id="step-5" className="bg-white border-2 border-rule p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-7 h-7 flex items-center justify-center flex-shrink-0" style={{ background: JOURNEY_STEPS[4].color }}>
                <span className="text-white text-[10px] font-bold font-mono">5</span>
              </div>
              <h2 className="font-display text-base font-bold text-ink flex-1">Show Up</h2>
              <Link href="/opportunities" className="font-mono text-[10px] uppercase tracking-[0.1em] text-blue hover:underline inline-flex items-center gap-1">All <ArrowRight size={10} /></Link>
            </div>

            <div className="divide-y divide-rule">
              {guideEvents.map(function (evt: any) {
                return (
                  <div key={evt.opportunity_id} className="flex items-start gap-3 py-3">
                    <div className="w-9 h-9 flex items-center justify-center flex-shrink-0 bg-paper border border-rule">
                      <Calendar size={14} className="text-blue" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={'/opportunities/' + evt.opportunity_id} className="text-[13px] font-bold text-ink hover:text-blue leading-snug block">{evt.opportunity_name}</Link>
                      <span className="font-mono text-[10px] text-muted mt-0.5 block">
                        {evt.start_date && new Date(evt.start_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        {evt.city && <> · {evt.city}</>}
                        {evt.is_virtual && ' · Virtual'}
                      </span>
                      {evt.registration_url && (
                        <a href={evt.registration_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.08em] text-blue hover:underline mt-1">
                          Register <ExternalLink size={9} />
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
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
