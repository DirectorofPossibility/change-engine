import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { IndexPageHero } from '@/components/exchange/IndexPageHero'
import { IndexWayfinder } from '@/components/exchange/IndexWayfinder'
import { ALL_ADVENTURES } from '@/lib/data/adventures'
import { Landmark, Search, CloudRain, Clock, MapPin, Compass } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Community Adventures — The Change Engine',
  description: 'Interactive stories that put you at the center of civic life. Navigate a town hall meeting, discover hidden neighborhood assets, or prepare your community for hurricane season.',
}

const ICON_MAP: Record<string, typeof Landmark> = {
  landmark: Landmark,
  search: Search,
  'cloud-rain': CloudRain,
}

export default function AdventuresPage() {
  return (
    <div>
      <IndexPageHero
        color="#805ad5"
        pattern="seed"
        title="Community Adventures"
        subtitle="Interactive stories where your choices shape the outcome."
        intro="Step into real civic scenarios — attending your first public meeting, mapping your neighborhood's hidden assets, or preparing your block for a storm. Every choice teaches you something real."
        stats={[
          { value: String(ALL_ADVENTURES.length), label: 'Adventures' },
          { value: '~5 min', label: 'Each' },
          { value: 'Free', label: 'Always' },
        ]}
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[{ label: 'Adventures' }]} />

        <div className="flex flex-col lg:flex-row gap-8 mt-4">
          <div className="flex-1 min-w-0">
            <div className="mb-6">
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-muted">
                Choose Your Adventure
              </p>
            </div>

            <div className="space-y-5">
              {ALL_ADVENTURES.map(function (adventure) {
                const Icon = ICON_MAP[adventure.icon] || Compass
                return (
                  <Link
                    key={adventure.slug}
                    href={'/adventures/' + adventure.slug}
                    className="group block bg-white border border-brand-border overflow-hidden hover:shadow-lg hover:translate-y-[-2px] transition-all"
                   
                  >
                    <div className="flex">
                      <div className="w-2 flex-shrink-0" style={{ backgroundColor: adventure.color }} />
                      <div className="flex-1 p-6">
                        <div className="flex items-start gap-4">
                          <div
                            className="w-12 h-12 flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: adventure.color + '15' }}
                          >
                            <Icon size={22} style={{ color: adventure.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h2 className="font-display text-lg font-bold text-brand-text group-hover:text-brand-accent transition-colors">
                              {adventure.title}
                            </h2>
                            <p className="text-xs font-medium mt-0.5" style={{ color: adventure.color }}>
                              {adventure.subtitle}
                            </p>
                            <p className="text-sm text-brand-muted leading-relaxed mt-2">
                              {adventure.description}
                            </p>
                            <div className="flex items-center gap-4 mt-3 text-[11px] font-mono text-brand-muted-light">
                              <span className="flex items-center gap-1">
                                <Clock size={11} /> ~{adventure.estimatedMinutes} min
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin size={11} /> {adventure.nodeCount} scenes
                              </span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white" style={{ backgroundColor: adventure.color }}>
                                Play Now
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* How it works */}
            <div className="mt-10 border-t-2 border-brand-border pt-8">
              <h2 className="font-display text-xl font-bold text-brand-text mb-4">How Community Adventures Work</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { step: '1', title: 'Read the Scene', desc: 'Each scene puts you in a real civic situation with illustrated context.' },
                  { step: '2', title: 'Make a Choice', desc: 'Your decisions shape the story. There\'s no wrong answer — every path teaches something.' },
                  { step: '3', title: 'Learn & Connect', desc: 'Scenes include real facts and links to explore topics further on The Change Engine.' },
                ].map(function (item) {
                  return (
                    <div key={item.step} className="bg-white border border-brand-border p-5">
                      <div className="w-8 h-8 rounded-full bg-brand-accent/10 flex items-center justify-center mb-3">
                        <span className="text-sm font-bold text-brand-accent">{item.step}</span>
                      </div>
                      <h3 className="font-display font-bold text-brand-text text-sm mb-1">{item.title}</h3>
                      <p className="text-xs text-brand-muted leading-relaxed">{item.desc}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block lg:w-[280px] flex-shrink-0">
            <div className="sticky top-24">
              <IndexWayfinder
                currentPage="adventures"
                color="#805ad5"
                related={[
                  { label: 'Pathways', href: '/pathways', color: '#805ad5' },
                  { label: 'Knowledge Graph', href: '/knowledge-graph', color: '#d69e2e' },
                  { label: 'Library', href: '/library', color: '#3182ce' },
                  { label: 'Ask Chance', href: '/chat', color: '#38a169' },
                ]}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
