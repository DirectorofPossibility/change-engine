import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { IndexPageHero } from '@/components/exchange/IndexPageHero'
import { FlowerOfLifeIcon } from '@/components/exchange/FlowerIcons'
import { MapPin, Building2, Heart, CalendarDays } from 'lucide-react'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Community — Community Exchange',
  description: 'Explore your community — neighborhoods, organizations, foundations, and events across Houston.',
}

const SECTIONS = [
  {
    href: '/neighborhoods',
    label: 'Neighborhoods',
    description: 'Discover what is happening in your part of Houston — officials, services, organizations, and resources mapped to where you live.',
    icon: MapPin,
    color: '#d69e2e',
    countKey: 'neighborhoods',
  },
  {
    href: '/organizations',
    label: 'Organizations',
    description: 'Nonprofits, civic groups, faith communities, and service providers already doing the work in Houston.',
    icon: Building2,
    color: '#dd6b20',
    countKey: 'organizations',
  },
  {
    href: '/foundations',
    label: 'Foundations',
    description: 'Philanthropic organizations funding programs and initiatives across the region.',
    icon: Heart,
    color: '#e53e3e',
    countKey: 'foundations',
  },
  {
    href: '/calendar',
    label: 'Events & Calendar',
    description: 'Community events, public meetings, volunteer days, and civic gatherings happening near you.',
    icon: CalendarDays,
    color: '#3182ce',
    countKey: 'events',
  },
]

export default async function CommunityIndexPage() {
  const supabase = await createClient()

  const [neighborhoods, organizations, foundations, events] = await Promise.all([
    supabase.from('neighborhoods').select('neighborhood_id', { count: 'exact', head: true }),
    supabase.from('organizations').select('org_id', { count: 'exact', head: true }),
    supabase.from('organizations').select('org_id', { count: 'exact', head: true }).in('org_type', ['Foundation/Grantmaker']),
    supabase.from('community_events' as any).select('event_id', { count: 'exact', head: true }).eq('is_active', true),
  ])

  const counts: Record<string, number> = {
    neighborhoods: neighborhoods.count || 0,
    organizations: organizations.count || 0,
    foundations: foundations.count || 0,
    events: events.count || 0,
  }

  return (
    <div>
      <IndexPageHero
        color="#805ad5"
        pattern="flower"
        title="Community"
        subtitle="The people, places, and organizations that make Houston what it is."
        stats={[
          { value: counts.neighborhoods, label: 'Neighborhoods' },
          { value: counts.organizations, label: 'Organizations' },
          { value: counts.events, label: 'Upcoming Events' },
        ]}
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {SECTIONS.map(function (section) {
            const Icon = section.icon
            const count = counts[section.countKey] || 0
            return (
              <Link
                key={section.href}
                href={section.href}
                className="group bg-white rounded-xl border-2 border-brand-border overflow-hidden hover:shadow-lg transition-all"
                style={{ boxShadow: '3px 3px 0 #D5D0C8' }}
              >
                <div className="flex">
                  <div
                    className="w-2 flex-shrink-0 rounded-l-xl"
                    style={{ backgroundColor: section.color }}
                  />
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: section.color + '15' }}
                        >
                          <Icon size={20} style={{ color: section.color }} />
                        </div>
                        <div>
                          <h2 className="font-serif text-xl font-bold text-brand-text group-hover:text-brand-accent transition-colors">
                            {section.label}
                          </h2>
                          {count > 0 && (
                            <p className="text-[11px] font-mono text-brand-muted-light mt-0.5">
                              {count.toLocaleString()} available
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-brand-muted group-hover:text-brand-accent transition-colors text-lg">&rarr;</span>
                    </div>
                    <p className="text-sm text-brand-muted leading-relaxed">
                      {section.description}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Community callout */}
        <div className="mt-10 text-center">
          <div className="inline-flex items-center gap-2 text-brand-muted-light">
            <FlowerOfLifeIcon size={20} color="#805ad5" />
            <p className="text-sm font-serif italic">
              Community is not a place — it is the connections between people.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
