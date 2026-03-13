import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { CENTER_COLORS } from '@/lib/constants'
import {
  SeekerIcon, LearnerIcon, BuilderIcon,
  WatchdogIcon, PartnerIcon, ExplorerIcon,
} from '@/components/exchange/FlowerIcons'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Your Journey | Change Engine',
  description: 'Find the path that matches how you want to engage with your community.',
}

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

const PERSONAS = [
  {
    id: 'seeker',
    name: 'The Seeker',
    tagline: 'Find what is available to you',
    description: 'You are looking for resources, services, and support. Whether it is food access, legal help, job training, or healthcare -- you want to know what exists and how to reach it.',
    center: 'Resource' as const,
    Icon: SeekerIcon,
    color: '#4a2870',
    actions: ['Search local services', 'Find organizations near you', 'Connect with 211 resources'],
  },
  {
    id: 'learner',
    name: 'The Learner',
    tagline: 'Understand issues through community',
    description: 'You want to learn how things work -- from housing policy to climate resilience to education access. You read, watch, and listen to build understanding before acting.',
    center: 'Learning' as const,
    Icon: LearnerIcon,
    color: '#6a4e10',
    actions: ['Read community research', 'Explore pathways', 'Browse the library'],
  },
  {
    id: 'builder',
    name: 'The Builder',
    tagline: 'Contribute and create solutions',
    description: 'You are ready to act. You volunteer, organize events, join campaigns, and build alongside your neighbors. You see problems as opportunities to create something better.',
    center: 'Action' as const,
    Icon: BuilderIcon,
    color: '#7a2018',
    actions: ['Find volunteer opportunities', 'View the calendar', 'Join a campaign'],
  },
  {
    id: 'watchdog',
    name: 'The Watchdog',
    tagline: 'Hold power accountable',
    description: 'You track decisions, follow the money, attend public meetings, and hold elected officials accountable. Transparency and civic engagement are your tools for change.',
    center: 'Accountability' as const,
    Icon: WatchdogIcon,
    color: '#1a3460',
    actions: ['Track elected officials', 'Follow policy changes', 'View civic calendar'],
  },
  {
    id: 'partner',
    name: 'The Partner',
    tagline: 'Connect and collaborate',
    description: 'You are an organization, a civic leader, or a community connector. You work in partnership -- bridging the gap between institutions and neighborhoods.',
    center: null,
    Icon: PartnerIcon,
    color: '#1e4d7a',
    actions: ['Partner dashboard', 'Manage your organization', 'Submit events'],
  },
  {
    id: 'explorer',
    name: 'The Explorer',
    tagline: 'See the full picture',
    description: 'You are curious about how everything connects -- pathways to policies, services to SDGs, neighborhoods to officials. You explore the knowledge graph to find patterns others miss.',
    center: null,
    Icon: ExplorerIcon,
    color: '#E8723A',
    actions: ['Browse the knowledge graph', 'Explore by geography', 'Search everything'],
  },
]

export default function PersonasPage() {
  return (
    <div style={{ background: PARCHMENT }} className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: PARCHMENT_WARM }}>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="relative z-10 max-w-[900px] mx-auto px-6 py-16 text-center">
          <p style={{ fontFamily: MONO, color: MUTED }} className="text-xs uppercase tracking-widest mb-4">
            Change Engine
          </p>
          <h1 style={{ fontFamily: SERIF, color: INK }} className="text-4xl sm:text-5xl mb-4">
            Your Journey
          </h1>
          <p style={{ fontFamily: SERIF, color: MUTED }} className="text-lg max-w-xl mx-auto leading-relaxed">
            Everyone engages differently. Choose the path that fits where you are right now -- you can always explore another.
          </p>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontFamily: MONO, color: MUTED }} className="text-xs">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-2">/</span>
          <span style={{ color: INK }}>Your Journey</span>
        </nav>
      </div>

      {/* Main content */}
      <div className="max-w-[900px] mx-auto px-6 py-10">
        <div className="mb-8">
          <h2 style={{ fontFamily: SERIF, color: INK }} className="text-2xl mb-2">Choose Your Path</h2>
          <div style={{ borderTop: '2px dotted ' + RULE_COLOR }} className="pt-2">
            <span style={{ fontFamily: MONO, color: MUTED }} className="text-xs">{PERSONAS.length} journeys</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PERSONAS.map(function (p) {
            const centerColor = p.center ? CENTER_COLORS[p.center] || p.color : p.color

            return (
              <Link
                key={p.id}
                href={'/for/' + p.id}
                className="group block border hover:border-current transition-colors"
                style={{ borderColor: RULE_COLOR }}
              >
                {/* Color top bar */}
                <div className="h-1" style={{ backgroundColor: centerColor }} />

                {/* Header */}
                <div className="flex items-center gap-4 p-5 pb-3" style={{ background: PARCHMENT_WARM }}>
                  <div
                    className="w-14 h-14 flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: centerColor + '15', border: '2px solid ' + centerColor + '25' }}
                  >
                    <p.Icon size={32} color={centerColor} />
                  </div>
                  <div>
                    <h2 style={{ fontFamily: SERIF, color: INK }} className="text-lg">{p.name}</h2>
                    <p style={{ fontFamily: SERIF, color: MUTED }} className="text-sm italic">{p.tagline}</p>
                  </div>
                </div>

                {/* Description */}
                <div className="px-5 pb-4" style={{ background: PARCHMENT_WARM }}>
                  <p style={{ color: INK }} className="text-sm leading-relaxed">{p.description}</p>
                </div>

                {/* Actions */}
                <div className="px-5 pb-5" style={{ background: PARCHMENT_WARM }}>
                  <div className="flex flex-wrap gap-2">
                    {p.actions.map(function (action) {
                      return (
                        <span
                          key={action}
                          className="text-xs px-2.5 py-1"
                          style={{ backgroundColor: centerColor + '12', color: centerColor }}
                        >
                          {action}
                        </span>
                      )
                    })}
                  </div>
                </div>

                {/* CTA */}
                <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: '1px solid ' + RULE_COLOR, background: PARCHMENT_WARM }}>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: centerColor, fontFamily: MONO }}
                  >
                    Start as {p.name}
                  </span>
                  <span style={{ color: centerColor }}>&rarr;</span>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid ' + RULE_COLOR }} className="my-10" />

        {/* Footer */}
        <div className="text-center">
          <Link href="/" style={{ fontFamily: MONO, color: CLAY }} className="text-xs hover:underline">
            Back to Change Engine
          </Link>
        </div>
      </div>
    </div>
  )
}
