import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Community — Change Engine',
  description: 'Explore your community — neighborhoods, organizations, foundations, and events across Houston.',
}

// ── Design tokens ─────────────────────────────────────────────────────


const SECTIONS = [
  {
    href: '/neighborhoods',
    label: 'Neighborhoods',
    description: 'Discover what is happening in your part of Houston -- officials, services, organizations, and resources mapped to where you live.',
    color: '#4a2870',
    countKey: 'neighborhoods',
  },
  {
    href: '/organizations',
    label: 'Organizations',
    description: 'Nonprofits, civic groups, faith communities, and service providers already doing the work in Houston.',
    color: '#1e4d7a',
    countKey: 'organizations',
  },
  {
    href: '/foundations',
    label: 'Foundations',
    description: 'Philanthropic organizations funding programs and initiatives across the region.',
    color: '#7a2018',
    countKey: 'foundations',
  },
  {
    href: '/calendar',
    label: 'Events & Calendar',
    description: 'Community events, public meetings, volunteer days, and civic gatherings happening near you.',
    color: '#1b5e8a',
    countKey: 'events',
  },
]

export default async function CommunityIndexPage() {
  const supabase = await createClient()

  const [neighborhoods, organizations, foundations, events] = await Promise.all([
    supabase.from('neighborhoods').select('neighborhood_id', { count: 'exact', head: true }),
    supabase.from('organizations').select('org_id', { count: 'exact', head: true }),
    supabase.from('organizations').select('org_id', { count: 'exact', head: true }).in('org_type', ['Foundation/Grantmaker']),
    supabase.from('events' as any).select('event_id', { count: 'exact', head: true }).eq('is_active', 'Yes'),
  ])

  const counts: Record<string, number> = {
    neighborhoods: neighborhoods.count || 0,
    organizations: organizations.count || 0,
    foundations: foundations.count || 0,
    events: events.count || 0,
  }

  return (
    <div className="bg-paper min-h-screen">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-paper">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="relative max-w-[900px] mx-auto px-6 py-16">
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.2em', color: "#5c6474" }} className="uppercase mb-4">
            Change Engine
          </p>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.1 }}>
            Community
          </h1>
          <p style={{ fontSize: '1.1rem', color: "#5c6474", lineHeight: 1.7 }} className="mt-4 max-w-xl">
            The people, places, and organizations that make Houston what it is.
          </p>
          <div className="flex flex-wrap gap-6 mt-6">
            <div>
              <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{counts.neighborhoods}</span>
              <span style={{ fontSize: '0.6875rem', color: "#5c6474", letterSpacing: '0.1em', marginLeft: '0.5rem' }} className="uppercase">Neighborhoods</span>
            </div>
            <div>
              <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{counts.organizations}</span>
              <span style={{ fontSize: '0.6875rem', color: "#5c6474", letterSpacing: '0.1em', marginLeft: '0.5rem' }} className="uppercase">Organizations</span>
            </div>
            {counts.events > 0 && (
              <div>
                <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{counts.events}</span>
                <span style={{ fontSize: '0.6875rem', color: "#5c6474", letterSpacing: '0.1em', marginLeft: '0.5rem' }} className="uppercase">Upcoming Events</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Breadcrumb ── */}
      <div className="max-w-[900px] mx-auto px-6 pt-6 pb-2">
        <nav style={{ fontSize: '0.65rem', letterSpacing: '0.12em', color: "#5c6474" }} className="uppercase">
          <Link href="/" className="hover:underline" style={{ color: "#1b5e8a" }}>Home</Link>
          <span className="mx-2">/</span>
          <span>Community</span>
        </nav>
      </div>

      <div className="max-w-[900px] mx-auto px-6 py-10">
        {/* ── Section cards ── */}
        <section>
          <div className="flex items-baseline gap-4 mb-6">
            <h2 style={{ fontSize: '1.5rem',  }}>Explore</h2>
            <div className="flex-1" style={{ height: 1, borderBottom: '1px dotted', borderColor: '#dde1e8' }} />
            <span style={{ fontSize: '0.6875rem', color: "#5c6474", letterSpacing: '0.1em' }} className="uppercase">{SECTIONS.length} sections</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0" style={{ border: '1px solid #dde1e8' }}>
            {SECTIONS.map(function (section) {
              const count = counts[section.countKey] || 0
              return (
                <Link
                  key={section.href}
                  href={section.href}
                  className="group p-6 transition-colors hover:bg-white/50"
                  style={{ borderRight: '1px solid #dde1e8', borderBottom: '1px solid #dde1e8' }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span className="w-2 h-8 flex-shrink-0 mt-0.5" style={{ backgroundColor: section.color }} />
                    <div>
                      <h3 style={{ fontSize: '1.2rem',  }} className="group-hover:underline">
                        {section.label}
                      </h3>
                      {count > 0 && (
                        <p style={{ fontSize: '0.6875rem', color: "#5c6474", letterSpacing: '0.08em' }} className="mt-0.5 uppercase">
                          {count.toLocaleString()} available
                        </p>
                      )}
                    </div>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: "#5c6474", lineHeight: 1.6 }}>
                    {section.description}
                  </p>
                </Link>
              )
            })}
          </div>
        </section>

        <div className="my-10" style={{ height: 1, background: '#dde1e8' }} />

        {/* ── Closing thought ── */}
        <div className="text-center py-6">
          <p style={{ fontSize: '1rem', color: "#5c6474", fontStyle: 'italic' }}>
            Community is not a place -- it is the connections between people.
          </p>
        </div>

        <div className="my-10" style={{ height: 1, background: '#dde1e8' }} />

        {/* ── Footer link ── */}
        <div className="text-center py-4">
          <Link href="/" style={{ fontSize: '0.7rem', color: "#1b5e8a", letterSpacing: '0.1em' }} className="uppercase hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
