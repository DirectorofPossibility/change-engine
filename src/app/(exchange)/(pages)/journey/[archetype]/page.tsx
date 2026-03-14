import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getNewsFeed } from '@/lib/data/content'
import { THEMES } from '@/lib/constants'
import { FolFallback } from '@/components/ui/FolFallback'
import {
  Heart, Users, MapPin, Scale, Briefcase, Leaf, Globe,
  ArrowRight, ChevronRight, Phone, ExternalLink, Calendar,
  BookOpen, Shield, Megaphone, Building2, Search, FileText,
  Star, Landmark, Home as HomeIcon, Sparkles, Eye, Handshake,
} from 'lucide-react'

export const revalidate = 3600

/* ═══════════════════════════════════════════════════════════
   ARCHETYPE DEFINITIONS
   ═══════════════════════════════════════════════════════════ */

const PATHWAY_ICONS: Record<string, typeof Heart> = {
  THEME_01: Heart, THEME_02: Users, THEME_03: MapPin, THEME_04: Scale,
  THEME_05: Briefcase, THEME_06: Leaf, THEME_07: Globe,
}

interface ArchetypeConfig {
  id: string
  name: string
  headline: string
  subhead: string
  description: string
  color: string
  accentBg: string
  icon: typeof Heart
  geoPattern: 'seed' | 'vesica' | 'metatron' | 'borromean'
  sections: {
    primary: string
    primaryLabel: string
    primaryDesc: string
    secondary: string
    secondaryLabel: string
    secondaryDesc: string
  }
  quickActions: { label: string; href: string; icon: typeof Heart }[]
  pathways: string[] // recommended theme IDs
  ctaLabel: string
  ctaHref: string
  quote: string
}

const ARCHETYPES: Record<string, ArchetypeConfig> = {
  neighbor: {
    id: 'neighbor',
    name: 'The Neighbor',
    headline: 'Know what\u2019s happening around you.',
    subhead: 'Services, news, and resources for everyday life in Houston.',
    description: 'You want to stay informed, find help when you need it, and know what\u2019s available in your community. This page puts the most useful information within reach — services near you, local news, and resources organized by what matters to your daily life.',
    color: '#4a2870',
    accentBg: '#f5f0ff',
    icon: HomeIcon,
    geoPattern: 'seed',
    sections: {
      primary: 'services',
      primaryLabel: 'Services Near You',
      primaryDesc: 'Free and low-cost services available in your area.',
      secondary: 'news',
      secondaryLabel: 'Local Updates',
      secondaryDesc: 'What\u2019s happening in Houston right now.',
    },
    quickActions: [
      { label: 'Find services', href: '/services', icon: Phone },
      { label: 'Browse resources', href: '/resources', icon: Search },
      { label: 'Read the news', href: '/news', icon: BookOpen },
      { label: 'Explore your area', href: '/geography', icon: MapPin },
    ],
    pathways: ['THEME_01', 'THEME_02', 'THEME_03', 'THEME_05'],
    ctaLabel: 'Find services near me',
    ctaHref: '/services',
    quote: 'The best resource is the one you know about.',
  },
  advocate: {
    id: 'advocate',
    name: 'The Advocate',
    headline: 'Hold power accountable.',
    subhead: 'Track policies, know your officials, and push for change.',
    description: 'You believe civic engagement is more than voting. You want to understand who makes decisions, what policies are being debated, and how to make your voice heard. This page connects you to the tools of civic power — officials, policies, voting, and direct action.',
    color: '#7a2018',
    accentBg: '#fef2f2',
    icon: Megaphone,
    geoPattern: 'metatron',
    sections: {
      primary: 'policies',
      primaryLabel: 'Policies to Watch',
      primaryDesc: 'Bills, ordinances, and decisions that affect your life.',
      secondary: 'officials',
      secondaryLabel: 'Who\u2019s Accountable',
      secondaryDesc: 'The officials making decisions at every level of government.',
    },
    quickActions: [
      { label: 'Track policies', href: '/policies', icon: FileText },
      { label: 'Find your officials', href: '/officials', icon: Landmark },
      { label: 'Governance data', href: '/governance', icon: Shield },
      { label: 'Election info', href: '/elections', icon: Star },
    ],
    pathways: ['THEME_04', 'THEME_03', 'THEME_05'],
    ctaLabel: 'See your officials',
    ctaHref: '/officials',
    quote: 'Democracy is not a spectator sport.',
  },
  researcher: {
    id: 'researcher',
    name: 'The Researcher',
    headline: 'Understand the systems.',
    subhead: 'Data, policy analysis, and the context behind the headlines.',
    description: 'You don\u2019t want summaries — you want the source material. Research reports, policy briefs, civic data, and the full picture of how Houston\u2019s systems work. This page connects you to the deepest layer of the platform — the library, the data, and the analysis.',
    color: '#1e4d7a',
    accentBg: '#eff6ff',
    icon: Eye,
    geoPattern: 'vesica',
    sections: {
      primary: 'library',
      primaryLabel: 'Research Library',
      primaryDesc: 'Reports, briefs, and deep dives from trusted sources.',
      secondary: 'news',
      secondaryLabel: 'Analysis & Reporting',
      secondaryDesc: 'In-depth reporting on the issues that shape Houston.',
    },
    quickActions: [
      { label: 'Browse library', href: '/library', icon: BookOpen },
      { label: 'Explore data', href: '/data', icon: FileText },
      { label: 'Read analysis', href: '/news', icon: Search },
      { label: 'Ask Chance', href: '/chat', icon: Sparkles },
    ],
    pathways: ['THEME_04', 'THEME_05', 'THEME_06', 'THEME_07'],
    ctaLabel: 'Open the library',
    ctaHref: '/library',
    quote: 'The most powerful thing a community can do is understand itself.',
  },
  partner: {
    id: 'partner',
    name: 'The Partner',
    headline: 'Connect with the ecosystem.',
    subhead: 'Organizations, collaboration, and the broader network.',
    description: 'You run a program, lead an organization, or coordinate services. You need to see the full landscape — who else is doing this work, where the gaps are, and how to plug into the broader Houston ecosystem. This page is your operational dashboard.',
    color: '#1a6b56',
    accentBg: '#f0fdf4',
    icon: Handshake,
    geoPattern: 'borromean',
    sections: {
      primary: 'organizations',
      primaryLabel: 'The Network',
      primaryDesc: 'Organizations working across Houston\u2019s seven pathways.',
      secondary: 'opportunities',
      secondaryLabel: 'Get Involved',
      secondaryDesc: 'Events, volunteer opportunities, and ways to collaborate.',
    },
    quickActions: [
      { label: 'Browse organizations', href: '/organizations', icon: Building2 },
      { label: 'See opportunities', href: '/opportunities', icon: Calendar },
      { label: 'Explore pathways', href: '/pathways', icon: Globe },
      { label: 'Partner dashboard', href: '/dashboard/partner', icon: Star },
    ],
    pathways: ['THEME_07', 'THEME_01', 'THEME_02', 'THEME_06'],
    ctaLabel: 'Browse organizations',
    ctaHref: '/organizations',
    quote: 'We go further together.',
  },
}

const VALID_ARCHETYPES = Object.keys(ARCHETYPES)

/* ═══════════════════════════════════════════════════════════ */

export async function generateStaticParams() {
  return VALID_ARCHETYPES.map(a => ({ archetype: a }))
}

export async function generateMetadata({ params }: { params: Promise<{ archetype: string }> }): Promise<Metadata> {
  const { archetype } = await params
  const config = ARCHETYPES[archetype]
  if (!config) return { title: 'Journey — Change Engine' }
  return {
    title: `${config.name} — Your Journey | Change Engine`,
    description: config.description,
  }
}

/* ═══════════════════════════════════════════════════════════ */

// Sacred geometry SVG patterns per archetype
function GeoHero({ pattern, color }: { pattern: string; color: string }) {
  const opacity = 0.06
  const r = 80

  if (pattern === 'seed') {
    // Seed of Life — 7 circles
    return (
      <svg viewBox="0 0 400 400" className="w-full h-full">
        {Array.from({ length: 7 }, (_, i) => {
          const angle = (i * 60 - 90) * Math.PI / 180
          const cx = 200 + (i === 6 ? 0 : r * 0.7 * Math.cos(angle))
          const cy = 200 + (i === 6 ? 0 : r * 0.7 * Math.sin(angle))
          return <circle key={i} cx={cx} cy={cy} r={r * 0.7} stroke={color} strokeWidth="1.5" fill="none" opacity={opacity} />
        })}
        <circle cx={200} cy={200} r={r * 1.5} stroke={color} strokeWidth="1" fill="none" opacity={opacity * 0.5} />
      </svg>
    )
  }

  if (pattern === 'metatron') {
    // Metatron's Cube — 7 circles + connecting lines
    const pts: [number, number][] = [[200, 200]]
    for (let i = 0; i < 6; i++) {
      const angle = (i * 60 - 90) * Math.PI / 180
      pts.push([200 + r * 0.7 * Math.cos(angle), 200 + r * 0.7 * Math.sin(angle)])
    }
    return (
      <svg viewBox="0 0 400 400" className="w-full h-full">
        {pts.map((p, i) => pts.slice(i + 1).map((q, j) => (
          <line key={`${i}-${j}`} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke={color} strokeWidth="0.5" opacity={opacity * 0.6} />
        )))}
        {pts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r={r * 0.35} stroke={color} strokeWidth="1.5" fill="none" opacity={opacity} />
        ))}
        <circle cx={200} cy={200} r={r * 1.5} stroke={color} strokeWidth="1" fill="none" opacity={opacity * 0.5} />
      </svg>
    )
  }

  if (pattern === 'vesica') {
    // Vesica Piscis — 2 overlapping circles + radiating study lines
    return (
      <svg viewBox="0 0 400 400" className="w-full h-full">
        <circle cx={170} cy={200} r={r} stroke={color} strokeWidth="2" fill="none" opacity={opacity} />
        <circle cx={230} cy={200} r={r} stroke={color} strokeWidth="2" fill="none" opacity={opacity} />
        <circle cx={200} cy={200} r={r * 1.6} stroke={color} strokeWidth="1" fill="none" opacity={opacity * 0.4} />
        <circle cx={200} cy={200} r={r * 2} stroke={color} strokeWidth="0.5" fill="none" opacity={opacity * 0.3} />
        {Array.from({ length: 12 }, (_, i) => {
          const angle = (i * 30) * Math.PI / 180
          return <line key={i} x1={200} y1={200} x2={200 + r * 2 * Math.cos(angle)} y2={200 + r * 2 * Math.sin(angle)} stroke={color} strokeWidth="0.3" opacity={opacity * 0.3} />
        })}
      </svg>
    )
  }

  // Borromean — 3 interlocked circles
  return (
    <svg viewBox="0 0 400 400" className="w-full h-full">
      <circle cx={175} cy={180} r={r * 0.9} stroke={color} strokeWidth="2" fill="none" opacity={opacity} />
      <circle cx={225} cy={180} r={r * 0.9} stroke={color} strokeWidth="2" fill="none" opacity={opacity} />
      <circle cx={200} cy={225} r={r * 0.9} stroke={color} strokeWidth="2" fill="none" opacity={opacity} />
      <circle cx={200} cy={200} r={r * 1.7} stroke={color} strokeWidth="1" fill="none" opacity={opacity * 0.4} />
    </svg>
  )
}

/* ═══════════════════════════════════════════════════════════ */

export default async function JourneyPage({ params }: { params: Promise<{ archetype: string }> }) {
  const { archetype } = await params
  const config = ARCHETYPES[archetype]
  if (!config) notFound()

  const supabase = await createClient()
  const THEME_LIST = Object.entries(THEMES).map(([id, t]) => ({ id, ...t }))

  // Fetch content based on archetype focus
  const [
    latestNews,
    servicesResult,
    policiesResult,
    officialsResult,
    orgsResult,
    oppsResult,
    docsResult,
  ] = await Promise.all([
    getNewsFeed(undefined, 6),
    supabase
      .from('services_211')
      .select('service_id, service_name, phone, city, description_5th_grade')
      .eq('is_active', 'Yes')
      .limit(6),
    supabase
      .from('policies')
      .select('policy_id, policy_name, title_6th_grade, summary_5th_grade, level, status, bill_number')
      .eq('is_published', true)
      .order('last_action_date', { ascending: false })
      .limit(6),
    supabase
      .from('elected_officials')
      .select('official_id, official_name, title, party, level, photo_url')
      .limit(12),
    supabase
      .from('organizations')
      .select('org_id, org_name, description_5th_grade, logo_url, city, theme_id, website')
      .order('org_name')
      .limit(8),
    (supabase as any)
      .from('opportunities')
      .select('opportunity_id, opportunity_name, description_5th_grade, start_date, city, is_virtual')
      .eq('is_active', 'Yes')
      .gte('end_date', new Date().toISOString())
      .order('start_date', { ascending: true })
      .limit(4),
    supabase
      .from('kb_documents' as any)
      .select('id, title, summary, theme_ids, page_count')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(4),
  ])

  const services = servicesResult.data || []
  const policies = policiesResult.data || []
  const officials = officialsResult.data || []
  const orgs = orgsResult.data || []
  const opps = oppsResult.data || []
  const docs = docsResult.data || []

  // Group officials by level
  const officialsByLevel: Record<string, any[]> = {}
  for (const o of officials) {
    const level = o.level || 'Other'
    if (!officialsByLevel[level]) officialsByLevel[level] = []
    officialsByLevel[level].push(o)
  }

  const recommendedThemes = config.pathways.map(id => {
    const theme = THEMES[id as keyof typeof THEMES]
    return theme ? { id, ...theme } : null
  }).filter(Boolean) as (typeof THEME_LIST[0])[]

  return (
    <div className="min-h-screen" style={{ background: '#FAF9F6' }}>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden" style={{ background: `linear-gradient(170deg, ${config.accentBg} 0%, #F0EDE6 100%)` }}>
        {/* Epic geometry watermark */}
        <div className="absolute right-[-100px] top-1/2 -translate-y-1/2 w-[500px] h-[500px] pointer-events-none" aria-hidden="true">
          <GeoHero pattern={config.geoPattern} color={config.color} />
        </div>

        <div className="relative z-10 max-w-[1060px] mx-auto px-6 pt-10 pb-14 sm:pt-14 sm:pb-20">
          <nav className="text-[11px] tracking-wide mb-8" style={{ color: '#9B9590' }}>
            <Link href="/" className="hover:underline" style={{ color: '#6B6560' }}>Home</Link>
            <span className="mx-2">/</span>
            <Link href="/compass" className="hover:underline" style={{ color: '#6B6560' }}>Compass</Link>
            <span className="mx-2">/</span>
            <span style={{ color: '#3A3A35' }}>{config.name}</span>
          </nav>

          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 flex items-center justify-center" style={{ background: config.color }}>
                <config.icon size={24} color="white" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] font-semibold" style={{ color: config.color }}>
                  Your Journey
                </p>
                <p className="text-[15px] font-bold" style={{ color: '#2D2D2A' }}>{config.name}</p>
              </div>
            </div>

            <h1 className="font-serif text-[clamp(2rem,5vw,3.2rem)] leading-[1.08] mb-4" style={{ color: '#2D2D2A' }}>
              {config.headline}
            </h1>
            <p className="text-[17px] leading-relaxed" style={{ color: '#6B6560' }}>
              {config.description}
            </p>
          </div>
        </div>

        {/* Accent bar */}
        <div className="h-1" style={{ background: config.color }} />
      </section>

      <div className="max-w-[1060px] mx-auto px-6">

        {/* ── QUICK ACTIONS ── */}
        <section className="py-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {config.quickActions.map(function (action) {
              const Icon = action.icon
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="bg-white border p-4 text-center transition-all hover:shadow-lg hover:translate-y-[-2px] group"
                  style={{ borderColor: '#E2DDD5' }}
                >
                  <div className="w-10 h-10 flex items-center justify-center mx-auto mb-2" style={{ background: config.accentBg }}>
                    <Icon size={20} style={{ color: config.color }} />
                  </div>
                  <span className="text-[13px] font-bold group-hover:underline" style={{ color: '#2D2D2A' }}>{action.label}</span>
                </Link>
              )
            })}
          </div>
        </section>

        <hr className="border-0 h-px" style={{ background: 'linear-gradient(to right, #E2DDD5, rgba(226,221,213,0.3))' }} />

        {/* ── PRIMARY CONTENT SECTION ── */}
        <section className="py-12">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="font-serif text-2xl" style={{ color: '#2D2D2A' }}>{config.sections.primaryLabel}</h2>
              <p className="text-[13px] mt-1" style={{ color: '#9B9590' }}>{config.sections.primaryDesc}</p>
            </div>
            <Link href={config.ctaHref} className="hidden sm:inline-flex items-center gap-1 text-[13px] font-semibold" style={{ color: config.color }}>
              See all <ArrowRight size={14} />
            </Link>
          </div>

          {/* Render based on archetype primary */}
          {config.sections.primary === 'services' && services.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map(function (svc: any) {
                return (
                  <Link
                    key={svc.service_id}
                    href={'/services/' + svc.service_id}
                    className="bg-white border overflow-hidden transition-all hover:shadow-md group"
                    style={{ borderColor: '#E2DDD5' }}
                  >
                    <div className="h-2" style={{ background: config.color }} />
                    <div className="p-4">
                      <h3 className="text-[14px] font-bold leading-snug line-clamp-2 group-hover:underline" style={{ color: '#2D2D2A' }}>{svc.service_name}</h3>
                      {svc.description_5th_grade && <p className="text-[12px] mt-1.5 line-clamp-2 leading-relaxed" style={{ color: '#6B6560' }}>{svc.description_5th_grade}</p>}
                      <div className="flex items-center gap-3 mt-3 text-[11px] font-mono" style={{ color: '#9B9590' }}>
                        {svc.city && <span className="inline-flex items-center gap-1"><MapPin size={10} /> {svc.city}</span>}
                        {svc.phone && <span className="inline-flex items-center gap-1"><Phone size={10} /> {svc.phone}</span>}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {config.sections.primary === 'policies' && policies.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {policies.slice(0, 6).map(function (p: any) {
                return (
                  <Link
                    key={p.policy_id}
                    href={'/policies/' + p.policy_id}
                    className="bg-white border overflow-hidden transition-all hover:shadow-md group"
                    style={{ borderColor: '#E2DDD5' }}
                  >
                    <div className="flex">
                      <div className="w-1.5 flex-shrink-0" style={{ background: config.color }} />
                      <div className="p-4 flex-1">
                        <h3 className="text-[14px] font-bold leading-snug line-clamp-2 group-hover:underline" style={{ color: '#2D2D2A' }}>{p.title_6th_grade || p.policy_name}</h3>
                        {p.summary_5th_grade && <p className="text-[12px] mt-1.5 line-clamp-2 leading-relaxed" style={{ color: '#6B6560' }}>{p.summary_5th_grade}</p>}
                        <div className="flex items-center gap-2 mt-2 text-[10px] font-mono uppercase" style={{ color: '#9B9590' }}>
                          {p.level && <span>{p.level}</span>}
                          {p.status && <><span>&middot;</span><span>{p.status}</span></>}
                          {p.bill_number && <><span>&middot;</span><span>{p.bill_number}</span></>}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {config.sections.primary === 'library' && docs.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {docs.map(function (doc: any) {
                const themeId = doc.theme_ids?.[0]
                const theme = themeId ? THEMES[themeId as keyof typeof THEMES] : null
                return (
                  <Link
                    key={doc.id}
                    href={'/library/' + doc.id}
                    className="bg-white border overflow-hidden transition-all hover:shadow-lg hover:translate-y-[-2px] group"
                    style={{ borderColor: '#E2DDD5' }}
                  >
                    <div className="h-[70px] relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${theme?.color || config.color}, ${(theme?.color || config.color)}88)` }}>
                      <svg viewBox="0 0 120 70" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" fill="none">
                        <g opacity="0.12">
                          {Array.from({ length: 7 }, (_, i) => {
                            const angle = (i * 60 - 90) * Math.PI / 180
                            const cx = 60 + (i === 6 ? 0 : 18 * Math.cos(angle))
                            const cy = 35 + (i === 6 ? 0 : 18 * Math.sin(angle))
                            return <circle key={i} cx={cx} cy={cy} r={18} stroke="white" strokeWidth="0.5" />
                          })}
                        </g>
                      </svg>
                      <div className="absolute bottom-2 left-3 flex items-center gap-1.5">
                        <BookOpen size={11} color="white" />
                        {doc.page_count && <span className="text-[10px] font-mono text-white/70">{doc.page_count} pg</span>}
                      </div>
                    </div>
                    <div className="p-3">
                      <h4 className="text-[13px] font-bold leading-snug line-clamp-3 group-hover:underline" style={{ color: '#2D2D2A' }}>{doc.title}</h4>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {config.sections.primary === 'organizations' && orgs.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {orgs.slice(0, 6).map(function (org: any) {
                const theme = org.theme_id ? THEMES[org.theme_id as keyof typeof THEMES] : null
                return (
                  <Link
                    key={org.org_id}
                    href={'/organizations/' + org.org_id}
                    className="flex gap-4 bg-white border p-4 transition-all hover:shadow-md group"
                    style={{ borderColor: '#E2DDD5' }}
                  >
                    <div className="w-14 h-14 flex-shrink-0 overflow-hidden border flex items-center justify-center bg-white" style={{ borderColor: '#E2DDD5' }}>
                      {org.logo_url ? (
                        <Image src={org.logo_url} alt="" width={56} height={56} className="w-full h-full object-contain p-1" />
                      ) : (
                        <span className="font-serif font-bold text-lg" style={{ color: '#9B9590' }}>{org.org_name?.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {theme && <span className="text-[10px] uppercase tracking-wider font-semibold mb-0.5 block" style={{ color: theme.color }}>{theme.name}</span>}
                      <h3 className="text-[14px] font-bold leading-snug line-clamp-2 group-hover:underline" style={{ color: '#2D2D2A' }}>{org.org_name}</h3>
                      {org.description_5th_grade && <p className="text-[12px] mt-1 line-clamp-1" style={{ color: '#6B6560' }}>{org.description_5th_grade}</p>}
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] font-mono" style={{ color: '#9B9590' }}>
                        {org.city && <span><MapPin size={9} className="inline" /> {org.city}</span>}
                        {org.website && <span style={{ color: config.color }}><ExternalLink size={9} className="inline" /> Website</span>}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        <hr className="border-0 h-px" style={{ background: 'linear-gradient(to right, #E2DDD5, rgba(226,221,213,0.3))' }} />

        {/* ── SECONDARY + NEWS ── */}
        <section className="py-12">
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8">

            {/* News / content feed */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-serif text-xl" style={{ color: '#2D2D2A' }}>{config.sections.secondaryLabel}</h2>
                <Link href="/news" className="text-[12px] font-semibold" style={{ color: config.color }}>All <ChevronRight size={12} className="inline" /></Link>
              </div>

              {config.sections.secondary === 'officials' && officials.length > 0 ? (
                <div className="space-y-4">
                  {['City', 'County', 'State', 'Federal'].map(function (level) {
                    const group = officialsByLevel[level]
                    if (!group || group.length === 0) return null
                    return (
                      <div key={level}>
                        <p className="text-[10px] uppercase tracking-[0.15em] font-bold mb-2" style={{ color: '#9B9590' }}>{level}</p>
                        <div className="grid grid-cols-2 gap-2">
                          {group.slice(0, 4).map(function (o: any) {
                            return (
                              <Link
                                key={o.official_id}
                                href={'/officials/' + o.official_id}
                                className="flex items-center gap-2.5 bg-white border p-3 transition-all hover:shadow-md group"
                                style={{ borderColor: '#E2DDD5' }}
                              >
                                {o.photo_url ? (
                                  <Image src={o.photo_url} alt="" width={36} height={36} className="w-9 h-9 object-cover rounded-full flex-shrink-0" />
                                ) : (
                                  <span className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0" style={{ background: '#E2DDD5', color: '#6B6560' }}>{o.official_name?.charAt(0)}</span>
                                )}
                                <div className="min-w-0">
                                  <span className="text-[13px] font-bold block truncate group-hover:underline" style={{ color: '#2D2D2A' }}>{o.official_name}</span>
                                  <span className="text-[10px] block truncate" style={{ color: '#9B9590' }}>{o.title}</span>
                                </div>
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  {latestNews.slice(0, 4).map(function (item: any) {
                    const theme = item.pathway_primary ? THEMES[item.pathway_primary as keyof typeof THEMES] : null
                    return (
                      <Link
                        key={item.id}
                        href={'/content/' + item.id}
                        className="flex gap-3 bg-white border p-3 transition-all hover:shadow-md group"
                        style={{ borderColor: '#E2DDD5' }}
                      >
                        <div className="w-16 h-16 flex-shrink-0 overflow-hidden">
                          {item.image_url ? (
                            <Image src={item.image_url} alt="" width={128} height={128} className="w-full h-full object-cover" />
                          ) : (
                            <FolFallback pathway={item.pathway_primary} height="h-full" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          {theme && (
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="w-1.5 h-1.5" style={{ background: theme.color }} />
                              <span className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: theme.color }}>{theme.name}</span>
                            </div>
                          )}
                          <h4 className="text-[13px] font-bold leading-snug line-clamp-2 group-hover:underline" style={{ color: '#2D2D2A' }}>{item.title_6th_grade}</h4>
                          <span className="text-[10px] font-mono mt-1 block" style={{ color: '#9B9590' }}>{item.source_domain}</span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Recommended pathways + opportunities */}
            <div className="space-y-8">
              {/* Pathways for this archetype */}
              <div>
                <h3 className="text-[11px] uppercase tracking-[0.15em] font-bold mb-3" style={{ color: '#9B9590' }}>Recommended Pathways</h3>
                <div className="space-y-2">
                  {recommendedThemes.map(function (t) {
                    const Icon = PATHWAY_ICONS[t.id] || Heart
                    return (
                      <Link
                        key={t.id}
                        href={'/pathways/' + t.slug}
                        className="flex items-center gap-3 bg-white border px-4 py-3 transition-all hover:shadow-md group"
                        style={{ borderColor: '#E2DDD5' }}
                      >
                        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0" style={{ background: t.color + '15' }}>
                          <Icon size={16} style={{ color: t.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[14px] font-bold group-hover:underline" style={{ color: '#2D2D2A' }}>{t.name}</span>
                          <span className="text-[11px] block mt-0.5 line-clamp-1" style={{ color: '#9B9590' }}>{t.description.split('.')[0]}.</span>
                        </div>
                        <ChevronRight size={14} style={{ color: '#9B9590' }} />
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* Upcoming opportunities */}
              {opps.length > 0 && (
                <div>
                  <h3 className="text-[11px] uppercase tracking-[0.15em] font-bold mb-3" style={{ color: '#9B9590' }}>Upcoming Opportunities</h3>
                  <div className="space-y-2">
                    {opps.map(function (evt: any) {
                      return (
                        <Link
                          key={evt.opportunity_id}
                          href={'/opportunities/' + evt.opportunity_id}
                          className="flex items-start gap-3 bg-white border p-3 transition-all hover:shadow-md group"
                          style={{ borderColor: '#E2DDD5' }}
                        >
                          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0" style={{ background: config.accentBg }}>
                            <Calendar size={14} style={{ color: config.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[13px] font-bold leading-snug line-clamp-2 group-hover:underline" style={{ color: '#2D2D2A' }}>{evt.opportunity_name}</h4>
                            <span className="text-[10px] font-mono block mt-0.5" style={{ color: '#9B9590' }}>
                              {evt.start_date && new Date(evt.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              {evt.city && <> &middot; {evt.city}</>}
                              {evt.is_virtual && ' &middot; Virtual'}
                            </span>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── CLOSING ── */}
        <section className="py-8 mb-10">
          <div className="relative overflow-hidden p-8 sm:p-10 text-center" style={{ background: `linear-gradient(135deg, ${config.accentBg}, #F0EDE6)`, border: '1px solid #E2DDD5' }}>
            <div className="absolute right-[-60px] bottom-[-60px] w-[250px] h-[250px] pointer-events-none opacity-50" aria-hidden="true">
              <GeoHero pattern={config.geoPattern} color={config.color} />
            </div>
            <p className="font-serif text-xl relative z-10 italic" style={{ color: '#2D2D2A' }}>
              &ldquo;{config.quote}&rdquo;
            </p>
            <div className="flex items-center justify-center gap-3 mt-6 relative z-10 flex-wrap">
              <Link href={config.ctaHref} className="inline-flex items-center gap-2 px-6 py-2.5 text-[13px] font-semibold text-white transition-all hover:shadow-md" style={{ background: config.color }}>
                {config.ctaLabel} <ArrowRight size={14} />
              </Link>
              <Link href="/compass" className="inline-flex items-center gap-2 px-6 py-2.5 text-[13px] font-semibold border transition-all hover:shadow-md bg-white" style={{ color: '#2D2D2A', borderColor: '#E2DDD5' }}>
                Use the Compass <ArrowRight size={14} />
              </Link>
            </div>

            {/* Other journeys */}
            <div className="mt-8 pt-6 relative z-10" style={{ borderTop: '1px solid #E2DDD5' }}>
              <p className="text-[11px] uppercase tracking-[0.15em] font-bold mb-3" style={{ color: '#9B9590' }}>Other Journeys</p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {VALID_ARCHETYPES.filter(a => a !== archetype).map(function (a) {
                  const c = ARCHETYPES[a]
                  const Icon = c.icon
                  return (
                    <Link
                      key={a}
                      href={'/journey/' + a}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border text-[13px] font-semibold transition-all hover:shadow-md"
                      style={{ borderColor: '#E2DDD5', color: c.color }}
                    >
                      <Icon size={16} />
                      {c.name}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
