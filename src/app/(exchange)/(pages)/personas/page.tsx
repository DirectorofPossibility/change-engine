import type { Metadata } from 'next'
import Link from 'next/link'
import { CENTERS, CENTER_COLORS } from '@/lib/constants'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import {
  SeekerIcon, LearnerIcon, BuilderIcon,
  WatchdogIcon, PartnerIcon, ExplorerIcon,
} from '@/components/exchange/FlowerIcons'

export const metadata: Metadata = {
  title: 'Your Journey | Community Exchange',
  description: 'Find the path that matches how you want to engage with your community.',
}

const PERSONAS = [
  {
    id: 'seeker',
    name: 'The Seeker',
    tagline: 'Find what is available to you',
    description: 'You are looking for resources, services, and support. Whether it is food access, legal help, job training, or healthcare — you want to know what exists and how to reach it.',
    center: 'Resource' as const,
    Icon: SeekerIcon,
    color: '#d69e2e',
    actions: ['Search local services', 'Find organizations near you', 'Connect with 211 resources'],
  },
  {
    id: 'learner',
    name: 'The Learner',
    tagline: 'Understand issues through community',
    description: 'You want to learn how things work — from housing policy to climate resilience to education access. You read, watch, and listen to build understanding before acting.',
    center: 'Learning' as const,
    Icon: LearnerIcon,
    color: '#3182ce',
    actions: ['Read community research', 'Explore pathways', 'Browse the library'],
  },
  {
    id: 'builder',
    name: 'The Builder',
    tagline: 'Contribute and create solutions',
    description: 'You are ready to act. You volunteer, organize events, join campaigns, and build alongside your neighbors. You see problems as opportunities to create something better.',
    center: 'Action' as const,
    Icon: BuilderIcon,
    color: '#38a169',
    actions: ['Find volunteer opportunities', 'View the calendar', 'Join a campaign'],
  },
  {
    id: 'watchdog',
    name: 'The Watchdog',
    tagline: 'Hold power accountable',
    description: 'You track decisions, follow the money, attend public meetings, and hold elected officials accountable. Transparency and civic engagement are your tools for change.',
    center: 'Accountability' as const,
    Icon: WatchdogIcon,
    color: '#805ad5',
    actions: ['Track elected officials', 'Follow policy changes', 'View civic calendar'],
  },
  {
    id: 'partner',
    name: 'The Partner',
    tagline: 'Connect and collaborate',
    description: 'You are an organization, a civic leader, or a community connector. You work in partnership — bridging the gap between institutions and neighborhoods.',
    center: null,
    Icon: PartnerIcon,
    color: '#dd6b20',
    actions: ['Partner dashboard', 'Manage your organization', 'Submit events'],
  },
  {
    id: 'explorer',
    name: 'The Explorer',
    tagline: 'See the full picture',
    description: 'You are curious about how everything connects — pathways to policies, services to SDGs, neighborhoods to officials. You explore the knowledge graph to find patterns others miss.',
    center: null,
    Icon: ExplorerIcon,
    color: '#E8723A',
    actions: ['Browse the knowledge graph', 'Explore by geography', 'Search everything'],
  },
]

function getCenterLink(center: string | null) {
  if (!center) return null
  const c = CENTERS[center]
  return c ? '/centers/' + c.slug : null
}

export default function PersonasPage() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[{ label: 'Your Journey' }]} />

      <div className="mb-10 text-center">
        <h1 className="font-serif text-3xl font-bold text-brand-text mb-3">Your Journey</h1>
        <p className="text-brand-muted max-w-xl mx-auto">
          Everyone engages differently. Choose the path that fits where you are right now — you can always explore another.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PERSONAS.map(function (p) {
          const centerLink = getCenterLink(p.center)
          const centerColor = p.center ? CENTER_COLORS[p.center] || p.color : p.color

          return (
            <div
              key={p.id}
              className="bg-white rounded-xl border border-brand-border overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex items-center gap-4 p-5 pb-3">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: centerColor + '15' }}
                >
                  <p.Icon size={32} color={centerColor} />
                </div>
                <div>
                  <h2 className="font-serif text-lg font-bold text-brand-text">{p.name}</h2>
                  <p className="text-sm text-brand-muted italic">{p.tagline}</p>
                </div>
              </div>

              {/* Description */}
              <div className="px-5 pb-4">
                <p className="text-sm text-brand-text leading-relaxed">{p.description}</p>
              </div>

              {/* Actions */}
              <div className="px-5 pb-5">
                <div className="flex flex-wrap gap-2">
                  {p.actions.map(function (action) {
                    return (
                      <span
                        key={action}
                        className="text-xs px-2.5 py-1 rounded-lg"
                        style={{ backgroundColor: centerColor + '12', color: centerColor }}
                      >
                        {action}
                      </span>
                    )
                  })}
                </div>
              </div>

              {/* CTA */}
              {centerLink && (
                <div className="border-t border-brand-border px-5 py-3">
                  <Link
                    href={centerLink}
                    className="text-sm font-medium hover:underline transition-colors"
                    style={{ color: centerColor }}
                  >
                    Start as {p.name} &rarr;
                  </Link>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
