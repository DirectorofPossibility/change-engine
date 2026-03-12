'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Heart, Users, MapPin, Scale, Briefcase, Leaf, Globe,
  ArrowRight, ArrowLeft, Phone, ExternalLink, Calendar,
  Settings2,
} from 'lucide-react'
import { useNeighborhood } from '@/lib/contexts/NeighborhoodContext'
import { ZipInput } from '@/components/exchange/ZipInput'
import { THEMES } from '@/lib/constants'
import { FlowerOfLife } from '@/components/geo/sacred'

/* ── Design Tokens (matches content detail pages) ── */
const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const PARCHMENT_LIGHT = '#F8F4EC'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

/* ── Types ── */

interface CompassClientProps {
  onboardingComplete: boolean
  zip?: string
  selectedThemes: string[]
  archetype?: string
  themeColors: string[]
  councilMember: any | null
  nearbyServices: any[]
  topPolicy: any | null
  nextEvent: any | null
  featuredContent: any | null
  recentNews: any[]
}

/* ── Constants ── */

const PATHWAY_ICONS: Record<string, typeof Heart> = {
  THEME_01: Heart,
  THEME_02: Users,
  THEME_03: MapPin,
  THEME_04: Scale,
  THEME_05: Briefcase,
  THEME_06: Leaf,
  THEME_07: Globe,
}

const ARCHETYPES = [
  {
    id: 'neighbor',
    label: 'Neighbor',
    description: 'I want to know what is happening around me and how to get help when I need it.',
    color: '#4a2870',
  },
  {
    id: 'advocate',
    label: 'Advocate',
    description: 'I want to hold leaders accountable and push for change on the issues I care about.',
    color: '#7a2018',
  },
  {
    id: 'researcher',
    label: 'Researcher',
    description: 'I want to understand the data, the policies, and the systems that shape Houston.',
    color: '#1e4d7a',
  },
  {
    id: 'partner',
    label: 'Partner',
    description: 'I run a program or organization and want to connect with the broader ecosystem.',
    color: '#1a6b56',
  },
]

const themeEntries = Object.entries(THEMES) as [string, { name: string; color: string; slug: string; description: string }][]

/* ── Component ── */

export function CompassClient({
  onboardingComplete,
  zip,
  selectedThemes: savedThemes,
  archetype: savedArchetype,
  themeColors,
  councilMember,
  nearbyServices,
  topPolicy,
  nextEvent,
  featuredContent,
  recentNews,
}: CompassClientProps) {
  const router = useRouter()
  const { neighborhood } = useNeighborhood()
  const neighborhoodName = neighborhood?.neighborhood_name || null

  // Onboarding state
  const [step, setStep] = useState(1)
  const [pickedThemes, setPickedThemes] = useState<string[]>(savedThemes)
  const [pickedArchetype, setPickedArchetype] = useState<string>(savedArchetype || '')
  const [saving, setSaving] = useState(false)

  // If editing preferences from guide view
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
      <div style={{ background: PARCHMENT, minHeight: '100vh' }}>
        {/* Top color bar */}
        <div className="flex h-[3px]">
          {themeColors.map((c, i) => <div key={i} className="flex-1" style={{ background: c }} />)}
        </div>

        <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-12">
          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-8">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className="w-6 h-6 flex items-center justify-center text-xs font-bold"
                  style={{
                    fontFamily: MONO,
                    background: step >= s ? INK : 'transparent',
                    color: step >= s ? PARCHMENT : MUTED,
                    border: `1px solid ${step >= s ? INK : MUTED}`,
                  }}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div className="w-8 h-px" style={{ background: step > s ? INK : RULE_COLOR }} />
                )}
              </div>
            ))}
            <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, marginLeft: 8 }}>
              Step {step} of 3
            </span>
          </div>

          {/* ── STEP 1: What's on your mind? ── */}
          {step === 1 && (
            <div>
              <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 400, color: INK, marginBottom: 8 }}>
                What&rsquo;s on your mind?
              </h1>
              <p style={{ fontFamily: SERIF, fontSize: 16, lineHeight: 1.7, color: MUTED, marginBottom: 32 }}>
                Every community is a web of connected issues. Pick up to three threads that matter most to you right now.
              </p>

              <div className="grid grid-cols-1 gap-3">
                {themeEntries.map(([id, theme]) => {
                  const Icon = PATHWAY_ICONS[id] || Heart
                  const selected = pickedThemes.includes(id)
                  return (
                    <button
                      key={id}
                      onClick={() => toggleTheme(id)}
                      className="text-left p-4 transition-all"
                      style={{
                        background: selected ? '#ffffff' : PARCHMENT_LIGHT,
                        border: selected ? `2px solid ${theme.color}` : `1px solid ${RULE_COLOR}`,
                        cursor: pickedThemes.length >= 3 && !selected ? 'not-allowed' : 'pointer',
                        opacity: pickedThemes.length >= 3 && !selected ? 0.5 : 1,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 flex items-center justify-center flex-shrink-0"
                          style={{ background: selected ? theme.color : theme.color + '18' }}
                        >
                          <Icon size={20} style={{ color: selected ? '#fff' : theme.color }} />
                        </div>
                        <div className="min-w-0">
                          <span className="block font-semibold" style={{ fontFamily: SERIF, fontSize: 15, color: INK }}>
                            {theme.name}
                          </span>
                          <span className="block mt-0.5" style={{ fontFamily: SERIF, fontSize: 13, color: MUTED, lineHeight: 1.5 }}>
                            {theme.description.split('.')[0]}.
                          </span>
                        </div>
                        {selected && (
                          <span className="ml-auto flex-shrink-0 w-5 h-5 flex items-center justify-center" style={{ background: theme.color }}>
                            <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>&check;</span>
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
                  className="inline-flex items-center gap-2 px-6 py-3 transition-opacity"
                  style={{
                    fontFamily: MONO,
                    fontSize: 12,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    background: pickedThemes.length > 0 ? INK : MUTED,
                    color: '#fff',
                    opacity: pickedThemes.length === 0 ? 0.4 : 1,
                    cursor: pickedThemes.length === 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  Continue <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Where are you? ── */}
          {step === 2 && (
            <div>
              <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 400, color: INK, marginBottom: 8 }}>
                Where are you?
              </h1>
              <p style={{ fontFamily: SERIF, fontSize: 16, lineHeight: 1.7, color: MUTED, marginBottom: 32 }}>
                Your ZIP code unlocks what&rsquo;s happening right where you live &mdash; who represents you, what services are nearby, and what policies affect your neighborhood.
              </p>

              <div className="p-6" style={{ background: '#fff', border: `1px solid ${RULE_COLOR}` }}>
                {neighborhoodName && (
                  <p className="mb-3" style={{ fontFamily: SERIF, fontSize: 15, color: INK }}>
                    Currently set to <strong style={{ color: CLAY }}>{neighborhoodName}</strong>
                    {zip && <span style={{ color: MUTED }}> (ZIP {zip})</span>}
                  </p>
                )}
                <ZipInput />
                {!zip && !neighborhoodName && (
                  <p className="mt-3" style={{ fontFamily: SERIF, fontSize: 13, color: MUTED }}>
                    Enter your address or ZIP code above. You can skip this and add it later.
                  </p>
                )}
              </div>

              <div className="mt-8 flex items-center justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-2 px-4 py-3 transition-colors"
                  style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: MUTED }}
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-2 px-6 py-3 transition-opacity"
                  style={{
                    fontFamily: MONO, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase',
                    fontWeight: 600, background: INK, color: '#fff',
                  }}
                >
                  Continue <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: How do you engage? ── */}
          {step === 3 && (
            <div>
              <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 400, color: INK, marginBottom: 8 }}>
                How do you like to engage?
              </h1>
              <p style={{ fontFamily: SERIF, fontSize: 16, lineHeight: 1.7, color: MUTED, marginBottom: 32 }}>
                There&rsquo;s no wrong answer. This just helps us show you the right starting points.
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
                        background: selected ? '#fff' : PARCHMENT_LIGHT,
                        border: selected ? `2px solid ${arch.color}` : `1px solid ${RULE_COLOR}`,
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <FlowerOfLife size={28} color={selected ? arch.color : MUTED} opacity={selected ? 1 : 0.4} />
                        <div>
                          <span className="block font-semibold" style={{ fontFamily: SERIF, fontSize: 15, color: INK }}>
                            {arch.label}
                          </span>
                          <span className="block mt-1" style={{ fontFamily: SERIF, fontSize: 13, color: MUTED, lineHeight: 1.5 }}>
                            {arch.description}
                          </span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="mt-8 flex items-center justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 px-4 py-3 transition-colors"
                  style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: MUTED }}
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  onClick={savePreferences}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-3 transition-opacity"
                  style={{
                    fontFamily: MONO, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase',
                    fontWeight: 600, background: CLAY, color: '#fff',
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  {saving ? 'Building your guide...' : 'See my guide'} <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  /* ═══════════════════════════════════════════════════════════
     PERSONALIZED GUIDE
     ═══════════════════════════════════════════════════════════ */

  const greeting = (() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  const selectedThemeEntries = themeEntries.filter(([id]) => savedThemes.includes(id))

  return (
    <div>
      {/* ── HEADER ── */}
      <section style={{ background: PARCHMENT }}>
        {/* Spectrum bar — only selected themes */}
        <div className="flex h-[3px]">
          {selectedThemeEntries.map(([id, theme]) => (
            <div key={id} className="flex-1" style={{ background: theme.color }} />
          ))}
        </div>

        <div className="max-w-[740px] mx-auto px-4 sm:px-6 pt-8 pb-6">
          <div className="flex items-center justify-between mb-4">
            <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: MUTED }}>
              Your Community Briefing
            </span>
            <button
              onClick={() => { setEditing(true); setStep(1) }}
              className="inline-flex items-center gap-1.5 transition-colors hover:opacity-70"
              style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: CLAY }}
            >
              <Settings2 size={12} /> Edit preferences
            </button>
          </div>

          <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 400, color: INK, lineHeight: 1.15 }}>
            {greeting}, {neighborhoodName || 'Houston'}
          </h1>

          {zip && (
            <p className="mt-2" style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 15, color: MUTED }}>
              ZIP {zip}{neighborhoodName ? ' — ' + neighborhoodName : ''}
            </p>
          )}

          {/* Selected pathways as inline tags */}
          <div className="flex flex-wrap gap-2 mt-4">
            {selectedThemeEntries.map(([id, theme]) => (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1"
                style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.color, border: `1px solid ${theme.color}40` }}
              >
                <span className="w-2 h-2" style={{ background: theme.color }} />
                {theme.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Thin rule ── */}
      <div className="max-w-[740px] mx-auto px-4 sm:px-6">
        <div style={{ height: 1, background: RULE_COLOR }} />
      </div>

      {/* ── GUIDE SECTIONS ── */}
      <div className="max-w-[740px] mx-auto px-4 sm:px-6 py-8 space-y-10">

        {/* ── YOUR COUNCIL MEMBER ── */}
        {councilMember && (
          <section>
            <p className="mb-3" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: MUTED }}>
              Your Council Member
            </p>
            <Link
              href={'/officials/' + councilMember.official_id}
              className="flex items-center gap-4 p-5 transition-colors group"
              style={{ background: '#fff', border: `1px solid ${RULE_COLOR}` }}
            >
              <div className="w-14 h-14 flex-shrink-0 overflow-hidden" style={{ background: PARCHMENT_WARM }}>
                {councilMember.photo_url ? (
                  <Image src={councilMember.photo_url} alt="" width={56} height={56} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 20, color: MUTED }}>
                    {councilMember.official_name?.charAt(0)}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <span className="block group-hover:underline" style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: INK }}>
                  {councilMember.official_name}
                </span>
                <span className="block mt-0.5" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: MUTED }}>
                  {[councilMember.title, councilMember.party].filter(Boolean).join(' · ')}
                </span>
              </div>
              <ArrowRight size={16} className="ml-auto flex-shrink-0" style={{ color: MUTED }} />
            </Link>
          </section>
        )}

        {/* ── NEAR YOU: Services ── */}
        {nearbyServices.length > 0 && (
          <section>
            <p className="mb-3" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: MUTED }}>
              Near You
            </p>
            <div className="space-y-0" style={{ border: `1px solid ${RULE_COLOR}` }}>
              {nearbyServices.map((svc: any, i: number) => (
                <Link
                  key={svc.service_id}
                  href={'/services/' + svc.service_id}
                  className="block p-4 transition-colors group"
                  style={{
                    background: '#fff',
                    borderTop: i > 0 ? `1px solid ${RULE_COLOR}` : undefined,
                  }}
                >
                  <span className="block group-hover:underline" style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 600, color: INK }}>
                    {svc.service_name}
                  </span>
                  {svc.description_5th_grade && (
                    <span className="block mt-1 line-clamp-2" style={{ fontFamily: SERIF, fontSize: 13, lineHeight: 1.6, color: MUTED }}>
                      {svc.description_5th_grade}
                    </span>
                  )}
                  <div className="flex items-center gap-3 mt-2" style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}>
                    {svc.org_name && <span>{svc.org_name}</span>}
                    {svc.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone size={10} /> {svc.phone}
                      </span>
                    )}
                    {svc.city && <span>{svc.city}</span>}
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-2 text-right">
              <Link
                href="/services"
                className="inline-flex items-center gap-1 transition-colors hover:opacity-70"
                style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: CLAY }}
              >
                All services <ArrowRight size={12} />
              </Link>
            </div>
          </section>
        )}

        {/* ── A POLICY THAT AFFECTS YOU ── */}
        {topPolicy && (
          <section>
            <p className="mb-3" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: MUTED }}>
              A Policy That Affects You
            </p>
            <Link
              href={'/policies/' + topPolicy.policy_id}
              className="block p-5 transition-colors group"
              style={{ background: '#fff', borderLeft: `3px solid ${CLAY}`, border: `1px solid ${RULE_COLOR}`, borderLeftWidth: 3, borderLeftColor: CLAY }}
            >
              <span className="block group-hover:underline" style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 600, color: INK }}>
                {topPolicy.title_6th_grade || topPolicy.policy_name}
              </span>
              {topPolicy.summary_5th_grade && (
                <span className="block mt-2 line-clamp-3" style={{ fontFamily: SERIF, fontSize: 14, lineHeight: 1.7, color: MUTED }}>
                  {topPolicy.summary_5th_grade}
                </span>
              )}
              <div className="flex items-center gap-3 mt-3" style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}>
                {topPolicy.level && <span className="uppercase">{topPolicy.level}</span>}
                {topPolicy.status && <span>&middot; {topPolicy.status}</span>}
                {topPolicy.bill_number && <span>&middot; {topPolicy.bill_number}</span>}
              </div>
            </Link>
          </section>
        )}

        {/* ── COMING UP ── */}
        {nextEvent && (
          <section>
            <p className="mb-3" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: MUTED }}>
              Coming Up
            </p>
            <div className="p-5" style={{ background: '#fff', border: `1px solid ${RULE_COLOR}` }}>
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 flex items-center justify-center flex-shrink-0"
                  style={{ background: PARCHMENT_WARM }}
                >
                  <Calendar size={20} style={{ color: CLAY }} />
                </div>
                <div className="min-w-0">
                  <span className="block" style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 600, color: INK }}>
                    {nextEvent.opportunity_name}
                  </span>
                  {nextEvent.start_date && (
                    <span className="block mt-1" style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}>
                      {new Date(nextEvent.start_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      {nextEvent.city && <> &middot; {nextEvent.city}</>}
                    </span>
                  )}
                  {nextEvent.description_5th_grade && (
                    <span className="block mt-2 line-clamp-2" style={{ fontFamily: SERIF, fontSize: 13, lineHeight: 1.6, color: MUTED }}>
                      {nextEvent.description_5th_grade}
                    </span>
                  )}
                  <div className="flex items-center gap-3 mt-3">
                    <Link
                      href={'/opportunities/' + nextEvent.opportunity_id}
                      className="inline-flex items-center gap-1 transition-colors hover:opacity-70"
                      style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: CLAY }}
                    >
                      Details <ArrowRight size={12} />
                    </Link>
                    {nextEvent.registration_url && (
                      <a
                        href={nextEvent.registration_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 transition-colors hover:opacity-70"
                        style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: CLAY }}
                      >
                        Register <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── FROM YOUR PATHWAYS ── */}
        {featuredContent && (
          <section>
            <p className="mb-3" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: MUTED }}>
              From Your Pathways
            </p>
            <Link
              href={'/content/' + (featuredContent.slug || featuredContent.id)}
              className="block group"
              style={{ background: '#fff', border: `1px solid ${RULE_COLOR}` }}
            >
              {featuredContent.image_url && (
                <div className="w-full h-48 overflow-hidden" style={{ borderBottom: `1px solid ${RULE_COLOR}` }}>
                  <img src={featuredContent.image_url} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-5">
                {featuredContent.pathway_primary && THEMES[featuredContent.pathway_primary as keyof typeof THEMES] && (
                  <span
                    className="block mb-2"
                    style={{
                      fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
                      color: THEMES[featuredContent.pathway_primary as keyof typeof THEMES].color,
                    }}
                  >
                    {THEMES[featuredContent.pathway_primary as keyof typeof THEMES].name}
                  </span>
                )}
                <span className="block group-hover:underline" style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: INK, lineHeight: 1.3 }}>
                  {featuredContent.title_6th_grade}
                </span>
                {featuredContent.summary_6th_grade && (
                  <span className="block mt-2 line-clamp-3" style={{ fontFamily: SERIF, fontSize: 14, lineHeight: 1.7, color: MUTED }}>
                    {featuredContent.summary_6th_grade}
                  </span>
                )}
                <div className="flex items-center gap-3 mt-3" style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}>
                  {featuredContent.source_org_name && <span>{featuredContent.source_org_name}</span>}
                  {featuredContent.published_at && (
                    <span>{new Date(featuredContent.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  )}
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* ── Empty state if nothing personalized ── */}
        {!councilMember && nearbyServices.length === 0 && !topPolicy && !featuredContent && (
          <section className="text-center py-8">
            <FlowerOfLife size={48} color={CLAY} opacity={0.3} />
            <p className="mt-4" style={{ fontFamily: SERIF, fontSize: 16, color: MUTED }}>
              We&rsquo;re building your guide. Try adding a ZIP code to see what&rsquo;s happening near you.
            </p>
            <button
              onClick={() => { setEditing(true); setStep(2) }}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 transition-opacity hover:opacity-80"
              style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, background: CLAY, color: '#fff' }}
            >
              Add your ZIP <ArrowRight size={14} />
            </button>
          </section>
        )}
      </div>

      {/* ── FOOTER CODA ── */}
      <section style={{ background: PARCHMENT, borderTop: `1px solid ${RULE_COLOR}` }}>
        <div className="max-w-[740px] mx-auto px-4 sm:px-6 py-6">
          {/* Crisis hotlines */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1" style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}>
            <span className="font-bold uppercase tracking-wider" style={{ color: INK }}>Need help now?</span>
            <span>Crisis: <strong style={{ color: INK }}>988</strong></span>
            <span>City: <strong style={{ color: INK }}>311</strong></span>
            <span>Social Services: <strong style={{ color: INK }}>211</strong></span>
            <span>DV Hotline: <strong style={{ color: INK }}>713-528-2121</strong></span>
          </div>
        </div>
      </section>
    </div>
  )
}
