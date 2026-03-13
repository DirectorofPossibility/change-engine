import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { THEMES } from '@/lib/constants'
import {
  getArchetypeDashboardData,
  getRandomQuote,
} from '@/lib/data/exchange'
import { DashboardClient } from './DashboardClient'
import Image from 'next/image'
import Link from 'next/link'


const PERSONA_CONFIG: Record<string, {
  name: string
  tagline: string
  description: string
  color: string
  folImage: string
  primaryCenter: string
  heroQuestion: string
  /** Center order (first = primary) */
  centerOrder: string[]
  quickActions: Array<{ label: string; href: string; color: string; effort?: string }>
  externalLinks?: Array<{ label: string; href: string; description: string }>
}> = {
  seeker: {
    name: 'The Seeker',
    tagline: 'Find what is available to you',
    description: 'You are looking for resources, services, and support. Whether it is food access, legal help, job training, or healthcare — you want to know what exists and how to reach it.',
    color: '#4a2870',
    folImage: '/images/fol/seed-of-life.svg',
    primaryCenter: 'Resource',
    heroQuestion: "What's available to me?",
    centerOrder: ['Resource', 'Learning', 'Action', 'Accountability'],
    quickActions: [
      { label: 'Search Services', href: '/services', color: '#4a2870', effort: 'Browse' },
      { label: 'Find Organizations', href: '/organizations', color: '#1e4d7a', effort: 'Browse' },
      { label: 'Benefits Finder', href: '/benefits', color: '#7a2018', effort: 'Tool' },
      { label: 'Ask Chance', href: '/chat', color: '#C75B2A', effort: 'Chat' },
    ],
  },
  learner: {
    name: 'The Learner',
    tagline: 'Understand issues through community',
    description: 'You want to learn how things work — from housing policy to climate resilience to education access. You read, watch, and listen to build understanding before acting.',
    color: '#6a4e10',
    folImage: '/images/fol/vesica-piscis.svg',
    primaryCenter: 'Learning',
    heroQuestion: 'How can I understand?',
    centerOrder: ['Learning', 'Resource', 'Accountability', 'Action'],
    quickActions: [
      { label: 'Browse Library', href: '/library', color: '#6a4e10', effort: 'Read' },
      { label: 'Learning Paths', href: '/learn', color: '#1b5e8a', effort: '30-90 min' },
      { label: 'Read the News', href: '/news', color: '#1a5030', effort: '5 min' },
      { label: 'Ask Chance', href: '/chat', color: '#C75B2A', effort: 'Chat' },
    ],
  },
  builder: {
    name: 'The Builder',
    tagline: 'Contribute and create solutions',
    description: 'You are ready to act. You volunteer, organize events, join campaigns, and build alongside your neighbors. Your energy and skills can shape the community you want to live in.',
    color: '#7a2018',
    folImage: '/images/fol/tripod-of-life.svg',
    primaryCenter: 'Action',
    heroQuestion: 'How can I help?',
    centerOrder: ['Action', 'Resource', 'Learning', 'Accountability'],
    quickActions: [
      { label: 'Volunteer', href: '/opportunities', color: '#7a2018', effort: 'Recurring' },
      { label: 'View Calendar', href: '/calendar', color: '#6a4e10', effort: 'Events' },
      { label: 'Organizations', href: '/organizations', color: '#1e4d7a', effort: 'Browse' },
      { label: 'Submit a Resource', href: '/me/submit', color: '#C75B2A', effort: '5 min' },
    ],
  },
  watchdog: {
    name: 'The Watchdog',
    tagline: 'Hold power accountable',
    description: 'You track decisions, follow the money, attend public meetings, and hold elected officials accountable. Transparency is your tool for change.',
    color: '#1b5e8a',
    folImage: '/images/fol/metatrons-cube.svg',
    primaryCenter: 'Accountability',
    heroQuestion: 'Who makes decisions?',
    centerOrder: ['Accountability', 'Learning', 'Action', 'Resource'],
    quickActions: [
      { label: 'Find Your Officials', href: '/officials', color: '#1b5e8a', effort: 'Browse' },
      { label: 'Track Policies', href: '/policies', color: '#6a4e10', effort: 'Browse' },
      { label: 'Elections Hub', href: '/elections', color: '#1a6b56', effort: 'Dashboard' },
      { label: 'Call Your Reps', href: '/officials/lookup', color: '#C75B2A', effort: '5 min' },
    ],
  },
  partner: {
    name: 'The Partner',
    tagline: 'Connect and collaborate',
    description: 'You are an organization, a civic leader, or a community connector. You work across boundaries — bridging the gap between institutions and the people they serve.',
    color: '#1e4d7a',
    folImage: '/images/fol/fruit-of-life.svg',
    primaryCenter: 'Resource',
    heroQuestion: 'How do we work together?',
    centerOrder: ['Resource', 'Action', 'Learning', 'Accountability'],
    quickActions: [
      { label: 'Organizations', href: '/organizations', color: '#1e4d7a', effort: 'Browse' },
      { label: 'Foundations', href: '/foundations', color: '#1b5e8a', effort: 'Browse' },
      { label: 'Submit a Resource', href: '/me/submit', color: '#7a2018', effort: '5 min' },
      { label: 'Partner Dashboard', href: '/me', color: '#C75B2A', effort: 'Dashboard' },
    ],
    externalLinks: [
      { label: 'Become a Partner', href: 'https://app.betterunite.com/thechangelab#bnte_p_bwThbDPG', description: 'Join The Change Lab partner network' },
    ],
  },
  explorer: {
    name: 'The Explorer',
    tagline: 'See the full picture',
    description: 'You are curious about how everything connects — pathways to policies, services to neighborhoods, officials to organizations. You explore to find patterns others miss.',
    color: '#E8723A',
    folImage: '/images/fol/flower-full.svg',
    primaryCenter: 'Learning',
    heroQuestion: 'What can I discover?',
    centerOrder: ['Learning', 'Resource', 'Action', 'Accountability'],
    quickActions: [
      { label: 'Explore Pathways', href: '/pathways', color: '#E8723A', effort: 'Browse' },
      { label: 'Knowledge Graph', href: '/knowledge-graph', color: '#1b5e8a', effort: 'Interactive' },
      { label: 'Neighborhoods', href: '/neighborhoods', color: '#7a2018', effort: 'Map' },
      { label: 'Search Everything', href: '/search', color: '#6a4e10', effort: 'Search' },
    ],
  },
}

const ALL_SLUGS = Object.keys(PERSONA_CONFIG)

export async function generateStaticParams() {
  return ALL_SLUGS.map(function (slug) { return { slug } })
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const config = PERSONA_CONFIG[slug]
  if (!config) return { title: 'Not Found' }
  return {
    title: config.name + ' — Your Journey | Change Engine',
    description: config.description,
  }
}

export const revalidate = 300

export default async function PersonaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const config = PERSONA_CONFIG[slug]
  if (!config) notFound()

  const [dashData, quote] = await Promise.all([
    getArchetypeDashboardData(),
    getRandomQuote(),
  ])

  const pathways = Object.entries(THEMES).map(function ([id, t]) {
    return { id, name: t.name, color: t.color, slug: t.slug }
  })

  return (
    <div className="bg-paper min-h-screen">
      <div className="relative overflow-hidden bg-paper">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
          <Image src={config.folImage} alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="relative z-10 max-w-[900px] mx-auto px-6 py-16 md:py-20">
          <p style={{ fontSize: 11, letterSpacing: '0.12em', color: config.color, textTransform: 'uppercase' }}>
            The Change Engine
          </p>
          <h1 className="mt-4" style={{ fontSize: 40, lineHeight: 1.1,  }}>
            {config.name}
          </h1>
          <p className="mt-2" style={{ fontSize: 20, color: config.color }}>
            {config.tagline}
          </p>
          <p className="mt-4 max-w-[560px]" style={{ fontSize: 17, lineHeight: 1.7, color: "#5c6474" }}>
            {config.description}
          </p>
        </div>
        <div style={{ height: 1, background: '#dde1e8' }} />
      </div>
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontSize: 11, letterSpacing: '0.06em', color: "#5c6474" }}>
          <Link href="/" className="hover:underline" style={{ color: "#1b5e8a" }}>Home</Link>
          <span className="mx-2">/</span>
          <span>{config.name}</span>
        </nav>
      </div>
      <div className="max-w-[900px] mx-auto px-6 py-10">
        <DashboardClient
          slug={slug}
          config={config}
          data={dashData}
          quote={quote}
          pathways={pathways}
        />
      </div>
      <div className="max-w-[900px] mx-auto px-6">
        <div style={{ height: 1, background: '#dde1e8' }} />
        <div className="py-8">
          <Link href="/personas" className="hover:underline" style={{ fontSize: 13, fontStyle: 'italic', color: "#5c6474" }}>
            &larr; Choose a different path
          </Link>
        </div>
      </div>
    </div>
  )
}
