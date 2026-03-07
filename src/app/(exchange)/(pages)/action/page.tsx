import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { IndexPageHero } from '@/components/exchange/IndexPageHero'
import { FlowerOfLifeIcon } from '@/components/exchange/FlowerIcons'
import { Users, ScrollText, Vote } from 'lucide-react'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Action — Community Exchange',
  description: 'Know who represents you, what policies affect you, and when to show up.',
}

const SECTIONS = [
  {
    href: '/officials',
    label: 'Officials',
    description: 'Every elected official who represents you — from city council to Congress — with contact information, committee assignments, and voting records.',
    icon: Users,
    color: '#3182ce',
    countKey: 'officials',
  },
  {
    href: '/policies',
    label: 'Policies',
    description: 'Legislation, ordinances, and policy proposals at every level of government — tracked and explained at a reading level everyone can access.',
    icon: ScrollText,
    color: '#805ad5',
    countKey: 'policies',
  },
  {
    href: '/elections',
    label: 'Elections',
    description: 'Upcoming elections, ballot information, polling locations, and registration deadlines — everything you need to make your voice count.',
    icon: Vote,
    color: '#e53e3e',
    countKey: 'elections',
  },
]

export default async function ActionIndexPage() {
  const supabase = await createClient()

  const [officials, policies, elections] = await Promise.all([
    supabase.from('elected_officials').select('official_id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('policies').select('policy_id', { count: 'exact', head: true }),
    supabase.from('elections').select('election_id', { count: 'exact', head: true }).eq('is_active', 'true' as any),
  ])

  const counts: Record<string, number> = {
    officials: officials.count || 0,
    policies: policies.count || 0,
    elections: elections.count || 0,
  }

  return (
    <div>
      <IndexPageHero
        color="#38a169"
        pattern="vesica"
        title="Action"
        subtitle="Know who makes decisions, what they are deciding, and how to participate."
        stats={[
          { value: counts.officials, label: 'Elected Officials' },
          { value: counts.policies, label: 'Policies Tracked' },
          { value: counts.elections, label: 'Active Elections' },
        ]}
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
                              {count.toLocaleString()} tracked
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

        {/* Quick actions */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/officials/lookup"
            className="flex items-center gap-3 p-4 bg-white rounded-xl border-2 border-brand-border hover:border-brand-accent transition-colors"
            style={{ boxShadow: '3px 3px 0 #D5D0C8' }}
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users size={16} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-text">Find My Representatives</p>
              <p className="text-[11px] text-brand-muted">Enter your address to see who represents you</p>
            </div>
          </Link>
          <Link
            href="/call-your-senators"
            className="flex items-center gap-3 p-4 bg-white rounded-xl border-2 border-brand-border hover:border-brand-accent transition-colors"
            style={{ boxShadow: '3px 3px 0 #D5D0C8' }}
          >
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <span className="text-green-600 text-sm">&#9742;</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-text">Call Your Senators</p>
              <p className="text-[11px] text-brand-muted">Script and contact info ready to go</p>
            </div>
          </Link>
        </div>

        <div className="mt-10 text-center">
          <div className="inline-flex items-center gap-2 text-brand-muted-light">
            <FlowerOfLifeIcon size={20} color="#38a169" />
            <p className="text-sm font-serif italic">
              Democracy works when people show up.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
