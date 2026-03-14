import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { THEMES } from '@/lib/constants'
import { getEntitiesByPathways } from '@/lib/data/entity-graph'
import { getNewsFeed } from '@/lib/data/content'
import { FolFallback } from '@/components/ui/FolFallback'
import {
  Heart, Users, MapPin, Scale, Briefcase, Leaf, Globe,
  ArrowRight, ChevronRight, Phone, ExternalLink, Calendar,
  BookOpen, Megaphone, Building2, FileText,
  Landmark, Home as HomeIcon, Sparkles, Eye, Handshake,
} from 'lucide-react'

export const revalidate = 3600

const PATHWAY_ICONS: Record<string, typeof Heart> = {
  THEME_01: Heart, THEME_02: Users, THEME_03: MapPin, THEME_04: Scale,
  THEME_05: Briefcase, THEME_06: Leaf, THEME_07: Globe,
}

/* ═══════════════════════════════════════════════════════════
   THE FOUR GUIDES
   Each archetype surfaces the full entity graph — orgs, services,
   policies, officials, opportunities, content — filtered by pathway.
   Organizations are the primary objects. Everything else braids in.
   ═══════════════════════════════════════════════════════════ */

interface GuideConfig {
  id: string
  name: string
  title: string
  epigraph: string
  openingNarrative: string[]
  color: string
  accentBg: string
  icon: typeof Heart
  geoPattern: 'seed' | 'vesica' | 'metatron' | 'borromean'
  sections: {
    orgs: { heading: string; intro: string }
    services: { heading: string; intro: string }
    policies: { heading: string; intro: string }
    officials: { heading: string; intro: string }
    content: { heading: string; intro: string }
    opportunities: { heading: string; intro: string }
  }
  trailMarkers: { label: string; href: string; icon: typeof Heart; note: string }[]
  pathways: string[]
  closingLine: string
}

const GUIDES: Record<string, GuideConfig> = {
  neighbor: {
    id: 'neighbor',
    name: 'The Neighbor',
    title: 'Your guide to everyday life in Houston.',
    epigraph: 'The city works better when you know how it works for you.',
    openingNarrative: [
      'You live here. You want to know what\u2019s available \u2014 where to go when something breaks, where to find help before you need it, and what\u2019s happening on your block that you might have missed.',
      'This guide organizes the city around your daily life. Services within reach. Organizations doing the work. News that matters to your neighborhood. Resources you didn\u2019t know existed until right now.',
      'Think of this as your operating manual for Houston.',
    ],
    color: '#4a2870',
    accentBg: '#f5f0ff',
    icon: HomeIcon,
    geoPattern: 'seed',
    sections: {
      orgs: { heading: 'Organizations Near You', intro: 'These organizations work on the issues closest to your daily life \u2014 health, housing, food, utilities, family support.' },
      services: { heading: 'Services Available Now', intro: 'Free and low-cost services operating in Houston right now. Health clinics, food pantries, legal aid, utility assistance.' },
      policies: { heading: 'Decisions That Affect You', intro: 'Policies moving through government that touch your daily life \u2014 housing, utilities, transportation, health.' },
      officials: { heading: 'Who Represents You', intro: 'The officials responsible for the services and policies that shape your neighborhood.' },
      content: { heading: 'What\u2019s Happening', intro: 'Stories, resources, and reporting from the community.' },
      opportunities: { heading: 'Get Involved', intro: 'Ways to participate \u2014 volunteer, attend, connect.' },
    },
    trailMarkers: [
      { label: 'Services', href: '/services', icon: Phone, note: 'Search by need, location, or category' },
      { label: 'Organizations', href: '/organizations', icon: Building2, note: 'Who\u2019s doing the work near you' },
      { label: 'News', href: '/news', icon: BookOpen, note: 'What just happened, organized by topic' },
      { label: 'Your Area', href: '/geography', icon: MapPin, note: 'Explore by neighborhood or ZIP' },
    ],
    pathways: ['THEME_01', 'THEME_02', 'THEME_03', 'THEME_05'],
    closingLine: 'The best resource is the one you know about. Now you know.',
  },
  advocate: {
    id: 'advocate',
    name: 'The Advocate',
    title: 'Your guide to civic power in Houston.',
    epigraph: 'Democracy only works when someone is watching.',
    openingNarrative: [
      'You\u2019re not here to browse. You\u2019re here because decisions are being made that affect your life, and you want to know who\u2019s making them, what they\u2019re deciding, and how to make your voice heard.',
      'This guide maps the power structure \u2014 from your city council member to the federal officials who represent your ZIP code. Every policy being debated. Every organization pushing for change.',
      'Advocacy starts with information. Here\u2019s yours.',
    ],
    color: '#7a2018',
    accentBg: '#fef2f2',
    icon: Megaphone,
    geoPattern: 'metatron',
    sections: {
      orgs: { heading: 'Advocacy Organizations', intro: 'Organizations doing the work of holding power accountable \u2014 civic engagement, policy advocacy, voter education.' },
      services: { heading: 'Civic Services', intro: 'Services that support civic participation \u2014 legal aid, voter registration, community organizing.' },
      policies: { heading: 'Policies Worth Your Attention', intro: 'Bills, ordinances, and resolutions moving through government right now. Each one summarized in plain language.' },
      officials: { heading: 'Who Makes the Calls', intro: 'Your elected officials at every level \u2014 city, county, state, and federal. These are the people accountable to you.' },
      content: { heading: 'Civic Intelligence', intro: 'Reporting, analysis, and resources about governance and civic power in Houston.' },
      opportunities: { heading: 'Ways to Show Up', intro: 'Town halls, hearings, campaigns, and civic events where your voice matters.' },
    },
    trailMarkers: [
      { label: 'Policies', href: '/policies', icon: FileText, note: 'Track what\u2019s being decided' },
      { label: 'Officials', href: '/officials', icon: Landmark, note: 'Find who represents you' },
      { label: 'Elections', href: '/elections', icon: Calendar, note: 'What\u2019s coming on the ballot' },
      { label: 'Organizations', href: '/organizations', icon: Building2, note: 'Who\u2019s doing advocacy work' },
    ],
    pathways: ['THEME_04', 'THEME_03', 'THEME_05'],
    closingLine: 'The people who show up are the people who shape what happens next.',
  },
  researcher: {
    id: 'researcher',
    name: 'The Researcher',
    title: 'Your guide to the data behind Houston.',
    epigraph: 'The most powerful thing a community can do is understand itself.',
    openingNarrative: [
      'You don\u2019t want the summary. You want the source material \u2014 the reports, the data, the policy analysis, the full context behind the headlines.',
      'This guide takes you to the deepest layer of the platform. Research organizations producing original work. Policies with the data to back them up. An AI assistant that can search across all of it.',
      'Houston is one of the most studied cities in America. Here\u2019s what the research says.',
    ],
    color: '#1e4d7a',
    accentBg: '#eff6ff',
    icon: Eye,
    geoPattern: 'vesica',
    sections: {
      orgs: { heading: 'Research Organizations', intro: 'Universities, think tanks, foundations, and civic organizations producing original research about Houston.' },
      services: { heading: 'Research Tools & Resources', intro: 'Data services, analysis tools, and research support available to the community.' },
      policies: { heading: 'Policy with Data', intro: 'Legislation grounded in research \u2014 where the numbers meet the decisions.' },
      officials: { heading: 'Who Oversees What', intro: 'Officials whose portfolios touch the systems researchers study.' },
      content: { heading: 'Analysis & Reporting', intro: 'In-depth reporting on the systems that shape Houston \u2014 housing, health, education, economy, environment.' },
      opportunities: { heading: 'Research Opportunities', intro: 'Fellowships, conferences, data collaborations, and ways to contribute to Houston\u2019s knowledge base.' },
    },
    trailMarkers: [
      { label: 'Library', href: '/library', icon: BookOpen, note: 'Reports, briefs, and research' },
      { label: 'Organizations', href: '/organizations', icon: Building2, note: 'Who\u2019s producing research' },
      { label: 'Ask Chance', href: '/chat', icon: Sparkles, note: 'AI-powered search across all data' },
      { label: 'News', href: '/news', icon: FileText, note: 'Reporting organized by pathway' },
    ],
    pathways: ['THEME_04', 'THEME_05', 'THEME_06', 'THEME_07'],
    closingLine: 'Understanding is the first step. What you do with it is the second.',
  },
  partner: {
    id: 'partner',
    name: 'The Partner',
    title: 'Your guide to Houston\u2019s civic ecosystem.',
    epigraph: 'No one organization can do it alone. That\u2019s the point.',
    openingNarrative: [
      'You run a program, lead an organization, or coordinate services. You already know the work \u2014 what you need is the landscape. Who else is doing this? Where are the gaps? How do you connect?',
      'This guide maps the ecosystem \u2014 hundreds of organizations working across seven pathways, the services they offer, the policies that affect them, and the collaboration opportunities that make Houston\u2019s civic infrastructure possible.',
      'The strongest communities are the ones where organizations know each other.',
    ],
    color: '#1a6b56',
    accentBg: '#f0fdf4',
    icon: Handshake,
    geoPattern: 'borromean',
    sections: {
      orgs: { heading: 'The Network', intro: 'Organizations working across Houston\u2019s pathways. Nonprofits, agencies, foundations, and community groups \u2014 each linked to the issues they serve.' },
      services: { heading: 'Services Across the Ecosystem', intro: 'What the network offers \u2014 direct services, programs, and support available through partner organizations.' },
      policies: { heading: 'Policy Landscape', intro: 'Legislation affecting the organizations and communities in this ecosystem.' },
      officials: { heading: 'Government Partners', intro: 'Officials whose work intersects with the civic ecosystem.' },
      content: { heading: 'What\u2019s Moving', intro: 'The latest on community initiatives, funding, and collaboration across the ecosystem.' },
      opportunities: { heading: 'Collaboration Opportunities', intro: 'Events, partnerships, volunteering, and ways to plug into the network.' },
    },
    trailMarkers: [
      { label: 'Organizations', href: '/organizations', icon: Building2, note: 'Search the full directory' },
      { label: 'Opportunities', href: '/opportunities', icon: Calendar, note: 'Events, volunteering, collaboration' },
      { label: 'Pathways', href: '/pathways', icon: Globe, note: 'See who works on what' },
      { label: 'Services', href: '/services', icon: Phone, note: 'What the network offers' },
    ],
    pathways: ['THEME_07', 'THEME_01', 'THEME_02', 'THEME_06'],
    closingLine: 'We go further when we go together. Here\u2019s the map.',
  },
}

const VALID_ARCHETYPES = Object.keys(GUIDES)

/* ═══════════════════════════════════════════════════════════ */

function GeoWatermark({ pattern, color }: { pattern: string; color: string }) {
  const r = 70, o = 0.06
  if (pattern === 'seed') {
    return (<svg viewBox="0 0 400 400" className="w-full h-full">
      {Array.from({ length: 7 }, (_, i) => { const a = (i * 60 - 90) * Math.PI / 180; return <circle key={i} cx={200 + (i === 6 ? 0 : r * 0.7 * Math.cos(a))} cy={200 + (i === 6 ? 0 : r * 0.7 * Math.sin(a))} r={r * 0.7} stroke={color} strokeWidth="1.5" fill="none" opacity={o} /> })}
      <circle cx={200} cy={200} r={r * 1.5} stroke={color} strokeWidth="1" fill="none" opacity={o * 0.5} />
    </svg>)
  }
  if (pattern === 'metatron') {
    const pts: [number, number][] = [[200, 200]]; for (let i = 0; i < 6; i++) { const a = (i * 60 - 90) * Math.PI / 180; pts.push([200 + r * 0.7 * Math.cos(a), 200 + r * 0.7 * Math.sin(a)]) }
    return (<svg viewBox="0 0 400 400" className="w-full h-full">
      {pts.map((p, i) => pts.slice(i + 1).map((q, j) => <line key={`${i}-${j}`} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke={color} strokeWidth="0.5" opacity={o * 0.6} />))}
      {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={r * 0.35} stroke={color} strokeWidth="1.5" fill="none" opacity={o} />)}
    </svg>)
  }
  if (pattern === 'vesica') {
    return (<svg viewBox="0 0 400 400" className="w-full h-full">
      <circle cx={170} cy={200} r={r} stroke={color} strokeWidth="2" fill="none" opacity={o} />
      <circle cx={230} cy={200} r={r} stroke={color} strokeWidth="2" fill="none" opacity={o} />
      <circle cx={200} cy={200} r={r * 1.6} stroke={color} strokeWidth="1" fill="none" opacity={o * 0.4} />
    </svg>)
  }
  return (<svg viewBox="0 0 400 400" className="w-full h-full">
    <circle cx={175} cy={180} r={r * 0.85} stroke={color} strokeWidth="2" fill="none" opacity={o} />
    <circle cx={225} cy={180} r={r * 0.85} stroke={color} strokeWidth="2" fill="none" opacity={o} />
    <circle cx={200} cy={225} r={r * 0.85} stroke={color} strokeWidth="2" fill="none" opacity={o} />
  </svg>)
}

/* ═══════════════════════════════════════════════════════════ */

export async function generateStaticParams() {
  return VALID_ARCHETYPES.map(a => ({ archetype: a }))
}

export async function generateMetadata({ params }: { params: Promise<{ archetype: string }> }): Promise<Metadata> {
  const { archetype } = await params
  const g = GUIDES[archetype]
  if (!g) return { title: 'Journey \u2014 Change Engine' }
  return { title: `${g.name} \u2014 ${g.title} | Change Engine`, description: g.openingNarrative[0] }
}

/* ═══════════════════════════════════════════════════════════ */

export const dynamic = 'force-dynamic'

export default async function JourneyPage({ params }: { params: Promise<{ archetype: string }> }) {
  const { archetype } = await params
  const guide = GUIDES[archetype]
  if (!guide) notFound()

  // Read the user's geography anchor from cookie
  const cookieStore = await cookies()
  const zip = cookieStore.get('zip')?.value || null

  // Fetch the full entity graph for this archetype's pathways, anchored to geography
  const entities = await getEntitiesByPathways(guide.pathways, {
    content: 6, services: 6, orgs: 8, policies: 6, officials: 12, opportunities: 4,
  }, zip)

  const recommendedThemes = guide.pathways.map(id => {
    const t = THEMES[id as keyof typeof THEMES]
    return t ? { id, ...t } : null
  }).filter(Boolean) as { id: string; name: string; color: string; slug: string; description: string }[]

  // Group officials by level
  const officialsByLevel: Record<string, any[]> = {}
  for (const o of entities.officials) {
    const lvl = o.level || 'Other'
    if (!officialsByLevel[lvl]) officialsByLevel[lvl] = []
    officialsByLevel[lvl].push(o)
  }

  return (
    <div className="min-h-screen" style={{ background: '#FAF9F6' }}>

      {/* ═══ COVER ═══ */}
      <section className="relative overflow-hidden" style={{ background: `linear-gradient(170deg, ${guide.accentBg} 0%, #F0EDE6 100%)` }}>
        <div className="absolute right-[-80px] top-1/2 -translate-y-1/2 w-[450px] h-[450px] pointer-events-none" aria-hidden="true">
          <GeoWatermark pattern={guide.geoPattern} color={guide.color} />
        </div>

        <div className="relative z-10 max-w-[820px] mx-auto px-6 pt-10 pb-16 sm:pt-14 sm:pb-24">
          <nav className="text-[11px] tracking-wide mb-10" style={{ color: '#9B9590' }}>
            <Link href="/" className="hover:underline" style={{ color: '#6B6560' }}>Home</Link>
            <span className="mx-2">/</span>
            <Link href="/journey" className="hover:underline" style={{ color: '#6B6560' }}>Journeys</Link>
            <span className="mx-2">/</span>
            <span style={{ color: '#3A3A35' }}>{guide.name}</span>
          </nav>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 flex items-center justify-center" style={{ background: guide.color }}>
              <guide.icon size={22} color="white" />
            </div>
            <p className="text-[11px] uppercase tracking-[0.2em] font-semibold" style={{ color: guide.color }}>{guide.name}</p>
          </div>

          <h1 className="font-serif text-[clamp(2rem,5vw,3rem)] leading-[1.12] mb-3" style={{ color: '#2D2D2A' }}>
            {guide.title}
          </h1>
          <p className="font-serif text-lg italic mb-10" style={{ color: '#6B6560' }}>
            {guide.epigraph}
          </p>

          <div className="space-y-4 text-[16px] leading-[1.75]" style={{ color: '#4A4A45' }}>
            {guide.openingNarrative.map((p, i) => <p key={i}>{p}</p>)}
          </div>

          {/* Geography anchor */}
          {entities.geo && (
            <div className="flex items-center gap-2 mt-8 mb-4">
              <MapPin size={14} style={{ color: guide.color }} />
              <span className="text-[13px]" style={{ color: '#4A4A45' }}>
                Your guide for <strong style={{ color: guide.color }}>{entities.geo.zip}</strong>
                {entities.geo.neighborhoodName && <span> &mdash; {entities.geo.neighborhoodName}</span>}
                {entities.geo.superNeighborhoodName && <span className="text-[11px]" style={{ color: '#6B6560' }}> ({entities.geo.superNeighborhoodName})</span>}
              </span>
            </div>
          )}
          {!entities.geo && (
            <p className="mt-8 mb-4 text-[13px]" style={{ color: '#6B6560' }}>
              <MapPin size={12} className="inline mr-1" />
              <Link href="/geography" className="underline" style={{ color: guide.color }}>Enter your ZIP code</Link> to see what&rsquo;s available in your neighborhood.
            </p>
          )}

          {/* Entity counts strip */}
          <div className="flex items-center gap-4 flex-wrap">
            {entities.counts.organizations > 0 && (
              <span className="text-[11px] font-mono px-3 py-1.5" style={{ background: 'white', color: guide.color, border: `1px solid ${guide.color}30` }}>
                {entities.counts.organizations} organizations
              </span>
            )}
            {entities.counts.services > 0 && (
              <span className="text-[11px] font-mono px-3 py-1.5" style={{ background: 'white', color: guide.color, border: `1px solid ${guide.color}30` }}>
                {entities.counts.services} services
              </span>
            )}
            {entities.counts.policies > 0 && (
              <span className="text-[11px] font-mono px-3 py-1.5" style={{ background: 'white', color: guide.color, border: `1px solid ${guide.color}30` }}>
                {entities.counts.policies} policies
              </span>
            )}
            {entities.counts.content > 0 && (
              <span className="text-[11px] font-mono px-3 py-1.5" style={{ background: 'white', color: guide.color, border: `1px solid ${guide.color}30` }}>
                {entities.counts.content} resources
              </span>
            )}
          </div>
        </div>

        <div className="h-[3px]" style={{ background: guide.color }} />
      </section>

      <div className="max-w-[820px] mx-auto px-6">

        {/* ═══ TRAIL MARKERS ═══ */}
        <section className="py-10">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold mb-4" style={{ color: '#9B9590' }}>Where to Start</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {guide.trailMarkers.map(function (marker) {
              const Icon = marker.icon
              return (
                <Link key={marker.href} href={marker.href} className="flex items-start gap-4 bg-white border p-4 transition-all hover:shadow-md hover:translate-y-[-1px] group" style={{ borderColor: '#E2DDD5' }}>
                  <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: guide.accentBg }}>
                    <Icon size={18} style={{ color: guide.color }} />
                  </div>
                  <div className="flex-1">
                    <span className="text-[15px] font-bold group-hover:underline block" style={{ color: '#2D2D2A' }}>{marker.label}</span>
                    <span className="text-[13px] block mt-0.5" style={{ color: '#6B6560' }}>{marker.note}</span>
                  </div>
                  <ChevronRight size={16} className="flex-shrink-0 mt-2.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#9B9590' }} />
                </Link>
              )
            })}
          </div>
        </section>

        <hr className="border-0 h-px" style={{ background: '#E2DDD5' }} />

        {/* ═══ ORGANIZATIONS — the primary objects ═══ */}
        {entities.organizations.length > 0 && (
          <section className="py-12">
            <div className="mb-8">
              <h2 className="font-serif text-2xl mb-2" style={{ color: '#2D2D2A' }}>{guide.sections.orgs.heading}</h2>
              <p className="text-[15px] leading-relaxed max-w-xl" style={{ color: '#6B6560' }}>{guide.sections.orgs.intro}</p>
            </div>
            <div className="space-y-2">
              {entities.organizations.map(function (org: any) {
                const theme = org.theme_id ? THEMES[org.theme_id as keyof typeof THEMES] : null
                return (
                  <Link key={org.org_id} href={'/organizations/' + org.org_id} className="flex items-center gap-4 p-4 bg-white border transition-all hover:shadow-md group" style={{ borderColor: '#E2DDD5' }}>
                    <div className="w-12 h-12 flex-shrink-0 overflow-hidden border flex items-center justify-center bg-white" style={{ borderColor: '#E2DDD5' }}>
                      {org.logo_url ? (
                        <Image src={org.logo_url} alt="" width={48} height={48} className="w-full h-full object-contain p-1" />
                      ) : (
                        <span className="font-serif font-bold text-lg" style={{ color: '#9B9590' }}>{org.org_name?.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {theme && <span className="text-[10px] uppercase tracking-wider font-semibold mb-0.5 block" style={{ color: theme.color }}>{theme.name}</span>}
                      <h3 className="text-[15px] font-bold leading-snug group-hover:underline" style={{ color: '#2D2D2A' }}>{org.org_name}</h3>
                      {org.description_5th_grade && <p className="text-[13px] mt-1 line-clamp-1" style={{ color: '#6B6560' }}>{org.description_5th_grade}</p>}
                    </div>
                    <ChevronRight size={16} className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#9B9590' }} />
                  </Link>
                )
              })}
              <Link href="/organizations" className="flex items-center justify-center gap-2 py-3 text-[13px] font-semibold bg-white border transition-all hover:shadow-md" style={{ color: guide.color, borderColor: '#E2DDD5' }}>
                Browse all {entities.counts.organizations} organizations <ArrowRight size={14} />
              </Link>
            </div>
          </section>
        )}

        <hr className="border-0 h-px" style={{ background: '#E2DDD5' }} />

        {/* ═══ SERVICES — 211 resources ═══ */}
        {entities.services.length > 0 && (
          <section className="py-12">
            <div className="mb-8">
              <h2 className="font-serif text-2xl mb-2" style={{ color: '#2D2D2A' }}>{guide.sections.services.heading}</h2>
              <p className="text-[15px] leading-relaxed max-w-xl" style={{ color: '#6B6560' }}>{guide.sections.services.intro}</p>
            </div>
            <div className="space-y-2">
              {entities.services.map(function (svc: any) {
                return (
                  <Link key={svc.service_id} href={'/services/' + svc.service_id} className="flex items-start gap-4 p-4 bg-white border transition-all hover:shadow-md group" style={{ borderColor: '#E2DDD5' }}>
                    <div className="w-1 self-stretch flex-shrink-0 mt-0.5" style={{ background: guide.color }} />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15px] font-bold leading-snug group-hover:underline" style={{ color: '#2D2D2A' }}>{svc.service_name}</h3>
                      {svc.description_5th_grade && <p className="text-[13px] mt-1 line-clamp-2 leading-relaxed" style={{ color: '#6B6560' }}>{svc.description_5th_grade}</p>}
                      <div className="flex items-center gap-4 mt-2 text-[11px]" style={{ color: '#9B9590' }}>
                        {svc.city && <span className="inline-flex items-center gap-1"><MapPin size={10} /> {svc.city}</span>}
                        {svc.phone && <span className="inline-flex items-center gap-1"><Phone size={10} /> {svc.phone}</span>}
                      </div>
                    </div>
                  </Link>
                )
              })}
              <Link href="/services" className="flex items-center justify-center gap-2 py-3 text-[13px] font-semibold bg-white border transition-all hover:shadow-md" style={{ color: guide.color, borderColor: '#E2DDD5' }}>
                Browse all {entities.counts.services} services <ArrowRight size={14} />
              </Link>
            </div>
          </section>
        )}

        <hr className="border-0 h-px" style={{ background: '#E2DDD5' }} />

        {/* ═══ TWO-COLUMN: Policies + Officials ═══ */}
        {(entities.policies.length > 0 || entities.officials.length > 0) && (
          <section className="py-12">
            <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-10">

              {/* Policies */}
              {entities.policies.length > 0 && (
                <div>
                  <h2 className="font-serif text-2xl mb-2" style={{ color: '#2D2D2A' }}>{guide.sections.policies.heading}</h2>
                  <p className="text-[15px] leading-relaxed mb-6" style={{ color: '#6B6560' }}>{guide.sections.policies.intro}</p>
                  <div className="space-y-2">
                    {entities.policies.map(function (p: any) {
                      return (
                        <Link key={p.policy_id} href={'/policies/' + p.policy_id} className="flex items-start gap-4 p-4 bg-white border transition-all hover:shadow-md group" style={{ borderColor: '#E2DDD5' }}>
                          <div className="w-1 self-stretch flex-shrink-0" style={{ background: guide.color }} />
                          <div className="flex-1 min-w-0">
                            <h3 className="text-[15px] font-bold leading-snug group-hover:underline" style={{ color: '#2D2D2A' }}>{p.title_6th_grade || p.policy_name}</h3>
                            {(p.summary_6th_grade || p.summary_5th_grade) && <p className="text-[13px] mt-1 line-clamp-2 leading-relaxed" style={{ color: '#6B6560' }}>{p.summary_6th_grade || p.summary_5th_grade}</p>}
                            <div className="flex items-center gap-2 mt-2 text-[10px] font-mono uppercase" style={{ color: '#9B9590' }}>
                              {[p.authoring_body || p.level, p.status, p.bill_number].filter(Boolean).join(' \u00b7 ')}
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                    <Link href="/policies" className="flex items-center justify-center gap-2 py-3 text-[13px] font-semibold bg-white border transition-all hover:shadow-md" style={{ color: guide.color, borderColor: '#E2DDD5' }}>
                      See all {entities.counts.policies} policies <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              )}

              {/* Officials */}
              {entities.officials.length > 0 && (
                <div>
                  <h2 className="font-serif text-2xl mb-2" style={{ color: '#2D2D2A' }}>{guide.sections.officials.heading}</h2>
                  <p className="text-[15px] leading-relaxed mb-6" style={{ color: '#6B6560' }}>{guide.sections.officials.intro}</p>
                  <div className="space-y-5">
                    {['City', 'County', 'State', 'Federal'].map(function (level) {
                      const group = officialsByLevel[level]
                      if (!group || group.length === 0) return null
                      return (
                        <div key={level}>
                          <p className="text-[10px] uppercase tracking-[0.15em] font-bold mb-2" style={{ color: '#9B9590' }}>{level}</p>
                          <div className="space-y-1.5">
                            {group.slice(0, 4).map(function (o: any) {
                              return (
                                <Link key={o.official_id} href={'/officials/' + o.official_id} className="flex items-center gap-3 bg-white border p-3 transition-all hover:shadow-md group" style={{ borderColor: '#E2DDD5' }}>
                                  {o.photo_url ? (
                                    <Image src={o.photo_url} alt="" width={36} height={36} className="w-9 h-9 object-cover rounded-full flex-shrink-0" />
                                  ) : (
                                    <span className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0" style={{ background: '#E2DDD5', color: '#6B6560' }}>{o.official_name?.charAt(0)}</span>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <span className="text-[14px] font-bold block truncate group-hover:underline" style={{ color: '#2D2D2A' }}>{o.official_name}</span>
                                    <span className="text-[11px] block truncate" style={{ color: '#9B9590' }}>{o.title}{o.party ? ` (${o.party})` : ''}</span>
                                  </div>
                                </Link>
                              )
                            })}
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

        <hr className="border-0 h-px" style={{ background: '#E2DDD5' }} />

        {/* ═══ CONTENT — braided resources ═══ */}
        {entities.content.length > 0 && (
          <section className="py-12">
            <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-10">
              <div>
                <h2 className="font-serif text-2xl mb-2" style={{ color: '#2D2D2A' }}>{guide.sections.content.heading}</h2>
                <p className="text-[15px] leading-relaxed mb-6" style={{ color: '#6B6560' }}>{guide.sections.content.intro}</p>
                <div className="space-y-3">
                  {entities.content.map(function (item: any) {
                    const theme = item.pathway_primary ? THEMES[item.pathway_primary as keyof typeof THEMES] : null
                    return (
                      <Link key={item.id} href={'/content/' + (item.slug || item.id)} className="flex gap-3.5 bg-white border p-3.5 transition-all hover:shadow-md group" style={{ borderColor: '#E2DDD5' }}>
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
                          <h4 className="text-[14px] font-bold leading-snug line-clamp-2 group-hover:underline" style={{ color: '#2D2D2A' }}>{item.title_6th_grade}</h4>
                          <span className="text-[10px] font-mono mt-1 block" style={{ color: '#9B9590' }}>{item.source_domain}{item.content_type ? ` \u00b7 ${item.content_type}` : ''}</span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* Sidebar: pathways + opportunities */}
              <div className="space-y-8">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold mb-3" style={{ color: '#9B9590' }}>Pathways for You</p>
                  <div className="space-y-2">
                    {recommendedThemes.map(function (t) {
                      const Icon = PATHWAY_ICONS[t.id] || Heart
                      return (
                        <Link key={t.id} href={'/pathways/' + t.slug} className="flex items-center gap-3 bg-white border px-4 py-3 transition-all hover:shadow-md group" style={{ borderColor: '#E2DDD5' }}>
                          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0" style={{ background: t.color + '15' }}>
                            <Icon size={15} style={{ color: t.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[14px] font-bold group-hover:underline block" style={{ color: '#2D2D2A' }}>{t.name}</span>
                            <span className="text-[11px] line-clamp-1 block" style={{ color: '#9B9590' }}>{t.description.split('.')[0]}.</span>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>

                {entities.opportunities.length > 0 && (
                  <div>
                    <h3 className="font-serif text-lg mb-2" style={{ color: '#2D2D2A' }}>{guide.sections.opportunities.heading}</h3>
                    <p className="text-[13px] leading-relaxed mb-3" style={{ color: '#6B6560' }}>{guide.sections.opportunities.intro}</p>
                    <div className="space-y-2">
                      {entities.opportunities.map(function (evt: any) {
                        return (
                          <Link key={evt.opportunity_id} href={'/opportunities/' + evt.opportunity_id} className="flex items-start gap-3 bg-white border p-3 transition-all hover:shadow-md group" style={{ borderColor: '#E2DDD5' }}>
                            <div className="w-8 h-8 flex items-center justify-center flex-shrink-0" style={{ background: guide.accentBg }}>
                              <Calendar size={14} style={{ color: guide.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-[13px] font-bold leading-snug line-clamp-2 group-hover:underline" style={{ color: '#2D2D2A' }}>{evt.opportunity_name}</h4>
                              <span className="text-[10px] font-mono mt-0.5 block" style={{ color: '#9B9590' }}>
                                {evt.start_date && new Date(evt.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                {evt.city && ` \u00b7 ${evt.city}`}
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
        )}

        {/* ═══ CLOSING ═══ */}
        <section className="py-8 mb-10">
          <div className="relative overflow-hidden p-8 sm:p-10" style={{ background: `linear-gradient(135deg, ${guide.accentBg}, #F0EDE6)`, border: '1px solid #E2DDD5' }}>
            <div className="absolute right-[-40px] bottom-[-40px] w-[200px] h-[200px] pointer-events-none opacity-60" aria-hidden="true">
              <GeoWatermark pattern={guide.geoPattern} color={guide.color} />
            </div>

            <p className="font-serif text-xl italic relative z-10" style={{ color: '#2D2D2A' }}>
              &ldquo;{guide.closingLine}&rdquo;
            </p>

            <div className="flex items-center gap-3 mt-6 relative z-10 flex-wrap">
              <Link href="/compass" className="inline-flex items-center gap-2 px-6 py-2.5 text-[13px] font-semibold text-white transition-all hover:shadow-md" style={{ background: guide.color }}>
                Use the Compass <ArrowRight size={14} />
              </Link>
            </div>

            <div className="mt-8 pt-6 relative z-10" style={{ borderTop: '1px solid #E2DDD5' }}>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold mb-3" style={{ color: '#9B9590' }}>Other Guides</p>
              <div className="flex items-center gap-3 flex-wrap">
                {VALID_ARCHETYPES.filter(a => a !== archetype).map(function (a) {
                  const g = GUIDES[a]
                  const Icon = g.icon
                  return (
                    <Link key={a} href={'/journey/' + a} className="inline-flex items-center gap-2 px-4 py-2 bg-white border text-[13px] font-semibold transition-all hover:shadow-md" style={{ borderColor: '#E2DDD5', color: g.color }}>
                      <Icon size={15} /> {g.name}
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
