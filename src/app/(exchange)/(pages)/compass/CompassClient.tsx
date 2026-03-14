'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Heart, Users, MapPin, Scale, Briefcase, Leaf, Globe,
  ArrowRight, ArrowLeft, Phone, ExternalLink, Calendar,
  Settings2, Shield, Building2, Landmark, Star, Home,
  Newspaper, FileText, Handshake, ChevronRight,
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
  yourOfficials: any[]
  nearbyServices: any[]
  yourPolicies: any[]
  nextEvents: any[]
  pathwayContent: any[]
  recentNews: any[]
  pathwayStats: Record<string, { content: number; services: number; policies: number }>
  platformStats: { content: number; services: number; officials: number; policies: number; organizations: number; opportunities: number }
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

/* ── Component ── */

export function CompassClient({
  onboardingComplete,
  zip,
  selectedThemes: savedThemes,
  archetype: savedArchetype,
  themeColors,
  yourOfficials,
  nearbyServices,
  yourPolicies,
  nextEvents,
  pathwayContent,
  recentNews,
  pathwayStats,
  platformStats,
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
        {/* Spectrum bar */}
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
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted ml-2">
              Step {step} of 3
            </span>
          </div>

          {/* STEP 1 */}
          {step === 1 && (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted mb-2">Calibrate Your Compass</p>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink leading-tight">
                What matters to you?
              </h1>
              <p className="text-base text-muted mt-3 mb-8 leading-relaxed">
                Every community is a web of connected issues. Pick up to <strong>three threads</strong> that matter most to you right now.
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
                        <div
                          className="w-11 h-11 flex items-center justify-center flex-shrink-0 transition-colors"
                          style={{ background: selected ? theme.color : theme.color + '12' }}
                        >
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
                  style={{
                    background: pickedThemes.length > 0 ? '#0d1117' : '#5c6474',
                    opacity: pickedThemes.length === 0 ? 0.4 : 1,
                  }}
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
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink leading-tight">
                Where are you?
              </h1>
              <p className="text-base text-muted mt-3 mb-8 leading-relaxed">
                Your ZIP code unlocks who represents you, what services are nearby, and what policies affect your neighborhood.
              </p>

              <div className="p-6 bg-white border-2 border-rule">
                {neighborhoodName && (
                  <p className="mb-3 font-body text-[15px]">
                    Currently set to <strong className="text-blue">{neighborhoodName}</strong>
                    {zip && <span className="text-muted"> (ZIP {zip})</span>}
                  </p>
                )}
                <ZipInput />
                {!zip && !neighborhoodName && (
                  <p className="mt-3 text-[13px] text-muted">Enter your ZIP code above. You can skip this and add it later.</p>
                )}
              </div>

              <div className="mt-8 flex items-center justify-between">
                <button onClick={() => setStep(1)} className="inline-flex items-center gap-2 px-4 py-3 font-mono text-xs uppercase tracking-[0.08em] text-muted">
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-2 px-6 py-3 font-mono text-xs uppercase tracking-[0.08em] font-bold text-white bg-ink"
                >
                  Continue <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted mb-2">Your Style</p>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink leading-tight">
                How do you engage?
              </h1>
              <p className="text-base text-muted mt-3 mb-8 leading-relaxed">
                No wrong answer. This helps us show you the right starting points.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ARCHETYPES.map(arch => {
                  const selected = pickedArchetype === arch.id
                  return (
                    <button
                      key={arch.id}
                      onClick={() => setPickedArchetype(arch.id)}
                      className="text-left p-5 transition-all"
                      style={{
                        background: selected ? '#fff' : 'transparent',
                        border: selected ? `2px solid ${arch.color}` : '1px solid #dde1e8',
                      }}
                    >
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
                <button
                  onClick={savePreferences}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-3 font-mono text-xs uppercase tracking-[0.08em] font-bold text-white transition-opacity"
                  style={{ background: '#1b5e8a', opacity: saving ? 0.6 : 1 }}
                >
                  {saving ? 'Building your compass...' : 'Launch My Compass'} <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  /* ═══════════════════════════════════════════════════════════
     CIVIC MISSION CONTROL
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
  for (const o of yourOfficials) {
    const level = o.level || 'Other'
    if (!officialsByLevel[level]) officialsByLevel[level] = []
    officialsByLevel[level].push(o)
  }
  const levelOrder = ['City', 'County', 'State', 'Federal']

  return (
    <div className="bg-paper min-h-screen">
      {/* ── HERO: Your Compass ── */}
      <section className="relative overflow-hidden">
        {/* Pathway spectrum bar */}
        <div className="flex h-[4px]">
          {selectedThemeEntries.map(([id, theme]) => (
            <div key={id} className="flex-1" style={{ background: theme.color }} />
          ))}
        </div>

        <div className="max-w-[960px] mx-auto px-4 sm:px-6 pt-8 pb-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted mb-2">
                Your Civic Compass
              </p>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink leading-tight">
                {greeting}, {neighborhoodName || 'Houston'}
              </h1>
              {zip && (
                <p className="mt-2 font-body text-[15px] text-muted italic">
                  ZIP {zip}{neighborhoodName ? ' · ' + neighborhoodName : ''}
                </p>
              )}

              {/* Selected pathways */}
              <div className="flex flex-wrap gap-2 mt-4">
                {selectedThemeEntries.map(([id, theme]) => {
                  const Icon = PATHWAY_ICONS[id] || Heart
                  return (
                    <Link
                      key={id}
                      href={'/pathways/' + theme.slug}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono uppercase tracking-[0.06em] border transition-colors hover:bg-white"
                      style={{ color: theme.color, borderColor: theme.color + '40' }}
                    >
                      <Icon size={12} />
                      {theme.name}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Flower of Life + edit */}
            <div className="hidden sm:flex flex-col items-center gap-2 flex-shrink-0">
              <FlowerOfLife size={72} color="#0d1117" opacity={0.08} />
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

      {/* ── YOUR POWER MAP ── */}
      <section className="border-y border-rule bg-white">
        <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-5">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 text-center">
            {[
              { n: platformStats.content, label: 'Articles', href: '/news', icon: Newspaper },
              { n: platformStats.services, label: 'Services', href: '/services', icon: Phone },
              { n: platformStats.officials, label: 'Officials', href: '/officials', icon: Shield },
              { n: platformStats.policies, label: 'Policies', href: '/policies', icon: FileText },
              { n: platformStats.organizations, label: 'Orgs', href: '/organizations', icon: Handshake },
              { n: platformStats.opportunities, label: 'Opportunities', href: '/opportunities', icon: Calendar },
            ].map(s => (
              <Link key={s.label} href={s.href} className="group">
                <div className="font-display text-xl sm:text-2xl font-bold text-ink group-hover:text-blue transition-colors">{s.n.toLocaleString()}</div>
                <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted mt-0.5">{s.label}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── MAIN 3-COLUMN LAYOUT ── */}
      <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">

          {/* ── LEFT COLUMN: Main feed ── */}
          <div className="space-y-8">

            {/* ── YOUR REPRESENTATIVES (Concentric rings) ── */}
            {yourOfficials.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-lg font-bold text-ink">Your Representatives</h2>
                  <Link href="/officials" className="font-mono text-[10px] uppercase tracking-[0.1em] text-blue hover:underline inline-flex items-center gap-1">
                    All officials <ArrowRight size={10} />
                  </Link>
                </div>

                <div className="space-y-4">
                  {levelOrder.map(function (level) {
                    const group = officialsByLevel[level]
                    if (!group || group.length === 0) return null
                    const LIcon = LEVEL_ICONS[level] || Building2
                    return (
                      <div key={level}>
                        <div className="flex items-center gap-2 mb-2">
                          <LIcon size={14} className="text-muted" />
                          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted font-bold">{level}</span>
                          <div className="flex-1 h-px bg-rule" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {group.slice(0, 4).map(function (o: any) {
                            return (
                              <Link
                                key={o.official_id}
                                href={'/officials/' + o.official_id}
                                className="flex items-center gap-3 p-3 bg-white border border-rule hover:border-ink transition-colors group"
                              >
                                <div className="w-10 h-10 flex-shrink-0 overflow-hidden bg-paper border border-rule">
                                  {o.photo_url ? (
                                    <Image src={o.photo_url} alt="" width={40} height={40} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center font-bold text-sm text-muted">
                                      {o.official_name?.charAt(0)}
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="block text-[14px] font-bold text-ink group-hover:text-blue truncate">{o.official_name}</span>
                                  <span className="block text-[11px] text-muted truncate">{o.title}{o.party ? ' · ' + o.party : ''}</span>
                                </div>
                                <ChevronRight size={14} className="text-muted flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </Link>
                            )
                          })}
                        </div>
                        {group.length > 4 && (
                          <Link href="/officials" className="block mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-blue hover:underline">
                            + {group.length - 4} more
                          </Link>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* ── WHAT'S BEING DECIDED ── */}
            {yourPolicies.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-lg font-bold text-ink">What&rsquo;s Being Decided</h2>
                  <Link href="/policies" className="font-mono text-[10px] uppercase tracking-[0.1em] text-blue hover:underline inline-flex items-center gap-1">
                    All policies <ArrowRight size={10} />
                  </Link>
                </div>
                <div className="space-y-2">
                  {yourPolicies.map(function (p: any) {
                    return (
                      <Link
                        key={p.policy_id}
                        href={'/policies/' + p.policy_id}
                        className="block p-4 bg-white border border-rule hover:border-ink transition-colors group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-1 self-stretch flex-shrink-0 bg-blue" />
                          <div className="flex-1 min-w-0">
                            <span className="block text-[14px] font-bold text-ink group-hover:text-blue leading-snug">
                              {p.title_6th_grade || p.policy_name}
                            </span>
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
              </section>
            )}

            {/* ── FROM YOUR PATHWAYS (content feed) ── */}
            {pathwayContent.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-lg font-bold text-ink">From Your Pathways</h2>
                  <Link href="/news" className="font-mono text-[10px] uppercase tracking-[0.1em] text-blue hover:underline inline-flex items-center gap-1">
                    All news <ArrowRight size={10} />
                  </Link>
                </div>

                {/* Hero content card */}
                {pathwayContent[0] && (
                  <Link
                    href={'/content/' + pathwayContent[0].id}
                    className="block bg-white border border-rule hover:border-ink transition-colors group mb-3"
                  >
                    <div className="h-44 overflow-hidden">
                      {pathwayContent[0].image_url ? (
                        <Image src={pathwayContent[0].image_url} alt="" width={800} height={400} className="w-full h-full object-cover" />
                      ) : (
                        <FolFallback pathway={pathwayContent[0].pathway_primary} height="h-full" />
                      )}
                    </div>
                    <div className="p-4">
                      {pathwayContent[0].pathway_primary && THEMES[pathwayContent[0].pathway_primary as keyof typeof THEMES] && (
                        <span className="font-mono text-[10px] uppercase tracking-[0.1em] mb-1 block"
                          style={{ color: THEMES[pathwayContent[0].pathway_primary as keyof typeof THEMES].color }}>
                          {THEMES[pathwayContent[0].pathway_primary as keyof typeof THEMES].name}
                        </span>
                      )}
                      <span className="block text-[16px] font-bold text-ink group-hover:text-blue leading-snug">
                        {pathwayContent[0].title_6th_grade}
                      </span>
                      {pathwayContent[0].summary_6th_grade && (
                        <span className="block text-[13px] text-muted mt-1.5 line-clamp-2 leading-relaxed">{pathwayContent[0].summary_6th_grade}</span>
                      )}
                    </div>
                  </Link>
                )}

                {/* Remaining content as compact list */}
                {pathwayContent.length > 1 && (
                  <div className="border border-rule divide-y divide-rule bg-white">
                    {pathwayContent.slice(1, 6).map(function (c: any) {
                      const theme = c.pathway_primary && THEMES[c.pathway_primary as keyof typeof THEMES]
                      return (
                        <Link
                          key={c.id}
                          href={'/content/' + c.id}
                          className="flex items-center gap-3 p-3 hover:bg-paper transition-colors group"
                        >
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
              </section>
            )}
          </div>

          {/* ── RIGHT COLUMN: Action sidebar ── */}
          <div className="space-y-6">

            {/* ── PATHWAY PULSE ── */}
            {Object.keys(pathwayStats).length > 0 && (
              <div className="border-2 border-rule bg-white p-4">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted font-bold mb-3">Your Pathway Pulse</h3>
                <div className="space-y-3">
                  {selectedThemeEntries.map(([id, theme]) => {
                    const stats = pathwayStats[id] || { content: 0, services: 0, policies: 0 }
                    const Icon = PATHWAY_ICONS[id] || Heart
                    return (
                      <Link
                        key={id}
                        href={'/pathways/' + theme.slug}
                        className="block group"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon size={14} style={{ color: theme.color }} />
                          <span className="font-display text-[13px] font-bold text-ink group-hover:text-blue">{theme.name}</span>
                        </div>
                        <div className="flex gap-3 font-mono text-[10px] text-muted">
                          <span>{stats.content} articles</span>
                          <span>{stats.services} services</span>
                        </div>
                        {/* Mini bar */}
                        <div className="h-1 mt-1.5 bg-rule overflow-hidden">
                          <div
                            className="h-full transition-all"
                            style={{
                              width: Math.min(100, Math.max(5, stats.content / 4)) + '%',
                              background: theme.color,
                            }}
                          />
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── COMING UP ── */}
            {nextEvents.length > 0 && (
              <div className="border-2 border-rule bg-white p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted font-bold">Coming Up</h3>
                  <Link href="/opportunities" className="font-mono text-[10px] uppercase tracking-[0.08em] text-blue hover:underline">All</Link>
                </div>
                <div className="space-y-3">
                  {nextEvents.map(function (evt: any) {
                    return (
                      <Link
                        key={evt.opportunity_id}
                        href={'/opportunities/' + evt.opportunity_id}
                        className="block group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 bg-paper border border-rule">
                            <Calendar size={16} className="text-blue" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="block text-[13px] font-bold text-ink group-hover:text-blue leading-snug line-clamp-2">
                              {evt.opportunity_name}
                            </span>
                            {evt.start_date && (
                              <span className="block text-[10px] text-muted font-mono mt-0.5">
                                {new Date(evt.start_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                {evt.city && <> · {evt.city}</>}
                                {evt.is_virtual && ' · Virtual'}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── NEAR YOU ── */}
            {nearbyServices.length > 0 && (
              <div className="border-2 border-rule bg-white p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted font-bold">Services Near You</h3>
                  <Link href="/services" className="font-mono text-[10px] uppercase tracking-[0.08em] text-blue hover:underline">All</Link>
                </div>
                <div className="divide-y divide-rule">
                  {nearbyServices.slice(0, 4).map(function (svc: any) {
                    return (
                      <Link
                        key={svc.service_id}
                        href={'/services/' + svc.service_id}
                        className="block py-2.5 group"
                      >
                        <span className="block text-[13px] font-bold text-ink group-hover:text-blue leading-snug">{svc.service_name}</span>
                        <div className="flex items-center gap-2 mt-0.5 font-mono text-[10px] text-muted">
                          {svc.city && <span className="truncate">{svc.city}</span>}
                          {svc.phone && <span className="flex-shrink-0"><Phone size={9} className="inline mr-0.5" />{svc.phone}</span>}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── LATEST PULSE ── */}
            {recentNews.length > 0 && (
              <div className="border-2 border-rule bg-white p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted font-bold">Latest</h3>
                  <Link href="/news" className="font-mono text-[10px] uppercase tracking-[0.08em] text-blue hover:underline">All news</Link>
                </div>
                <div className="divide-y divide-rule">
                  {recentNews.slice(0, 5).map(function (item: any) {
                    return (
                      <Link
                        key={item.id || item.inbox_id}
                        href={'/content/' + (item.id || item.inbox_id)}
                        className="block py-2 group"
                      >
                        <span className="block text-[12px] font-bold text-ink group-hover:text-blue leading-snug line-clamp-2">{item.title_6th_grade || item.title}</span>
                        <span className="block text-[10px] text-faint mt-0.5 font-mono">{item.source_org_name || item.source_domain}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── 24/7 HOTLINES ── */}
            <div className="border border-rule bg-paper p-4">
              <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted font-bold mb-2">24/7 Lines</h3>
              <div className="space-y-1 font-mono text-[11px] text-muted">
                <p>Crisis: <strong className="text-ink">988</strong></p>
                <p>City Services: <strong className="text-ink">311</strong></p>
                <p>Social Services: <strong className="text-ink">211</strong></p>
                <p>DV Hotline: <strong className="text-ink">713-528-2121</strong></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── EMPTY STATE ── */}
      {yourOfficials.length === 0 && nearbyServices.length === 0 && yourPolicies.length === 0 && pathwayContent.length === 0 && (
        <div className="text-center py-12">
          <FlowerOfLife size={56} color="#1b5e8a" opacity={0.2} />
          <p className="mt-4 text-base text-muted">
            Your compass is warming up. Add a ZIP code to see what&rsquo;s happening near you.
          </p>
          <button
            onClick={() => { setEditing(true); setStep(2) }}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 font-mono text-xs uppercase tracking-[0.08em] font-bold text-white bg-blue"
          >
            Add your ZIP <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
