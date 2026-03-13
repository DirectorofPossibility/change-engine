import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Action — Change Engine',
  description: 'Know who represents you, what policies affect you, and when to show up.',
}

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

const SECTIONS = [
  {
    href: '/officials',
    label: 'Officials',
    description: 'Every elected official who represents you -- from city council to Congress -- with contact information, committee assignments, and voting records.',
    countKey: 'officials',
  },
  {
    href: '/policies',
    label: 'Policies',
    description: 'Legislation, ordinances, and policy proposals at every level of government -- tracked and explained at a reading level everyone can access.',
    countKey: 'policies',
  },
  {
    href: '/elections',
    label: 'Elections',
    description: 'Upcoming elections, ballot information, polling locations, and registration deadlines -- everything you need to make your voice count.',
    countKey: 'elections',
  },
]

export default async function ActionIndexPage() {
  const supabase = await createClient()

  const [officials, policies, elections] = await Promise.all([
    supabase.from('elected_officials').select('official_id', { count: 'exact', head: true }),
    supabase.from('policies').select('policy_id', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('elections').select('election_id', { count: 'exact', head: true }).eq('is_active', 'Yes' as any),
  ])

  const counts: Record<string, number> = {
    officials: officials.count || 0,
    policies: policies.count || 0,
    elections: elections.count || 0,
  }

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
            Action
          </h1>
          <p style={{ fontFamily: SERIF, color: MUTED }} className="text-lg max-w-xl mx-auto leading-relaxed">
            Know who makes decisions, what they are deciding, and how to participate.
          </p>
          <div className="flex items-center justify-center gap-8 mt-8">
            {[
              { value: counts.officials, label: 'Elected Officials' },
              { value: counts.policies, label: 'Policies Tracked' },
              { value: counts.elections, label: 'Active Elections' },
            ].map(function (stat) {
              return (
                <div key={stat.label}>
                  <span style={{ fontFamily: SERIF, color: INK }} className="block text-2xl">{stat.value.toLocaleString()}</span>
                  <span style={{ fontFamily: MONO, color: MUTED }} className="text-[10px] uppercase tracking-wider">{stat.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontFamily: MONO, color: MUTED }} className="text-xs">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-2">/</span>
          <span style={{ color: INK }}>Action</span>
        </nav>
      </div>

      {/* Main content */}
      <div className="max-w-[900px] mx-auto px-6 py-10">
        {/* Section header */}
        <div className="mb-8">
          <h2 style={{ fontFamily: SERIF, color: INK }} className="text-2xl mb-2">Civic Categories</h2>
          <div style={{ borderTop: '2px dotted ' + RULE_COLOR }} className="pt-2">
            <span style={{ fontFamily: MONO, color: MUTED }} className="text-xs">{SECTIONS.length} sections</span>
          </div>
        </div>

        <div className="space-y-4">
          {SECTIONS.map(function (section) {
            const count = counts[section.countKey] || 0
            return (
              <Link
                key={section.href}
                href={section.href}
                className="block border border-transparent hover:border-current transition-colors"
                style={{ borderColor: RULE_COLOR }}
              >
                <div className="p-6" style={{ background: PARCHMENT_WARM }}>
                  <div className="flex items-start justify-between mb-2">
                    <h3 style={{ fontFamily: SERIF, color: INK }} className="text-xl">{section.label}</h3>
                    {count > 0 && (
                      <span style={{ fontFamily: MONO, color: MUTED }} className="text-xs mt-1">
                        {count.toLocaleString()} tracked
                      </span>
                    )}
                  </div>
                  <p style={{ color: MUTED }} className="text-sm leading-relaxed">
                    {section.description}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid ' + RULE_COLOR }} className="my-10" />

        {/* Quick actions */}
        <div className="mb-8">
          <h2 style={{ fontFamily: SERIF, color: INK }} className="text-2xl mb-2">Quick Actions</h2>
          <div style={{ borderTop: '2px dotted ' + RULE_COLOR }} className="pt-2">
            <span style={{ fontFamily: MONO, color: MUTED }} className="text-xs">2 actions</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/officials/lookup"
            className="block p-5 border hover:border-current transition-colors"
            style={{ background: PARCHMENT_WARM, borderColor: RULE_COLOR }}
          >
            <p style={{ fontFamily: SERIF, color: INK }} className="text-base mb-1">Find My Representatives</p>
            <p style={{ fontFamily: MONO, color: MUTED }} className="text-xs">Enter your address to see who represents you</p>
          </Link>
          <Link
            href="/call-your-senators"
            className="block p-5 border hover:border-current transition-colors"
            style={{ background: PARCHMENT_WARM, borderColor: RULE_COLOR }}
          >
            <p style={{ fontFamily: SERIF, color: INK }} className="text-base mb-1">Call Your Senators</p>
            <p style={{ fontFamily: MONO, color: MUTED }} className="text-xs">Script and contact info ready to go</p>
          </Link>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid ' + RULE_COLOR }} className="my-10" />

        {/* Footer */}
        <div className="text-center">
          <p style={{ fontFamily: SERIF, color: MUTED }} className="text-sm italic mb-4">
            Democracy works when people show up.
          </p>
          <Link href="/" style={{ fontFamily: MONO, color: CLAY }} className="text-xs hover:underline">
            Back to Change Engine
          </Link>
        </div>
      </div>
    </div>
  )
}
