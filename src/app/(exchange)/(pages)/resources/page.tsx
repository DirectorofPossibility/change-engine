import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 3600

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

export const metadata: Metadata = {
  title: 'Resources -- Change Engine',
  description: 'Find services, opportunities, and support available across Houston.',
}

const SECTIONS = [
  {
    href: '/services',
    label: 'Services',
    description: 'Searchable directory of 211 social services -- food, housing, healthcare, legal aid, childcare, and more -- mapped to your neighborhood.',
    countKey: 'services',
  },
  {
    href: '/opportunities',
    label: 'Opportunities',
    description: 'Volunteer positions, job openings, training programs, and ways to contribute your time and skills.',
    countKey: 'opportunities',
  },
  {
    href: '/help',
    label: 'Available Resources',
    description: 'Life situations organized by urgency -- from crisis support to long-term planning. Find what exists for your specific situation.',
    countKey: 'situations',
  },
]

export default async function ResourcesIndexPage() {
  const supabase = await createClient()

  const [services, opportunities, situations] = await Promise.all([
    supabase.from('services_211').select('service_id', { count: 'exact', head: true }).eq('is_active', 'Yes'),
    supabase.from('opportunities').select('opportunity_id', { count: 'exact', head: true }).eq('is_active', 'Yes' as any),
    supabase.from('life_situations').select('situation_id', { count: 'exact', head: true }),
  ])

  const counts: Record<string, number> = {
    services: services.count || 0,
    opportunities: opportunities.count || 0,
    situations: situations.count || 0,
  }

  const totalCount = counts.services + counts.opportunities + counts.situations

  return (
    <div style={{ background: PARCHMENT }} className="min-h-screen">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden" style={{ background: PARCHMENT_WARM }}>
        <div className="absolute right-[-60px] top-[-20px]">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="relative z-10 max-w-[900px] mx-auto px-6 py-10">
          <p style={{ fontFamily: MONO, color: MUTED }} className="text-[11px] uppercase tracking-[0.15em] mb-1">changeengine.us</p>
          <h1 style={{ fontFamily: SERIF, color: INK }} className="text-2xl sm:text-3xl mt-2">Resources</h1>
          <p style={{ fontFamily: SERIF, color: MUTED }} className="text-base mt-2">
            What is available to you -- services, opportunities, and support already in place across Houston.
          </p>
          {/* Stats */}
          <div className="flex items-center gap-6 mt-6">
            <div>
              <p style={{ fontFamily: SERIF, color: INK }} className="text-xl font-bold">{counts.services.toLocaleString()}</p>
              <p style={{ fontFamily: MONO, color: MUTED }} className="text-[11px] uppercase tracking-wide">Services</p>
            </div>
            <div className="w-px h-8" style={{ background: RULE_COLOR }} />
            <div>
              <p style={{ fontFamily: SERIF, color: INK }} className="text-xl font-bold">{counts.opportunities.toLocaleString()}</p>
              <p style={{ fontFamily: MONO, color: MUTED }} className="text-[11px] uppercase tracking-wide">Opportunities</p>
            </div>
            <div className="w-px h-8" style={{ background: RULE_COLOR }} />
            <div>
              <p style={{ fontFamily: SERIF, color: INK }} className="text-xl font-bold">{counts.situations.toLocaleString()}</p>
              <p style={{ fontFamily: MONO, color: MUTED }} className="text-[11px] uppercase tracking-wide">Life Situations</p>
            </div>
          </div>
        </div>
        <div style={{ height: 1, background: RULE_COLOR }} />
      </section>

      {/* ── Breadcrumb ── */}
      <div className="max-w-[900px] mx-auto px-6 pt-4">
        <nav style={{ fontFamily: MONO, color: MUTED }} className="text-[11px] tracking-wide">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-1">/</span>
          <span style={{ color: INK }}>Resources</span>
        </nav>
      </div>

      <div className="max-w-[900px] mx-auto px-6 py-8">
        <div className="flex items-baseline justify-between mb-1">
          <h2 style={{ fontFamily: SERIF, color: INK }} className="text-xl">Browse by Category</h2>
          <span style={{ fontFamily: MONO, color: MUTED }} className="text-[11px]">{SECTIONS.length} categories</span>
        </div>
        <div style={{ borderBottom: '2px dotted ' + RULE_COLOR }} className="mb-6" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {SECTIONS.map(function (section) {
            const count = counts[section.countKey] || 0
            return (
              <Link
                key={section.href}
                href={section.href}
                className="block overflow-hidden hover:opacity-80 transition-opacity"
                style={{ border: '1px solid ' + RULE_COLOR }}
              >
                <div className="flex">
                  <div className="w-1 flex-shrink-0" style={{ background: CLAY }} />
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 style={{ fontFamily: SERIF, color: INK }} className="text-xl">
                          {section.label}
                        </h3>
                        {count > 0 && (
                          <p style={{ fontFamily: MONO, color: MUTED }} className="text-[11px] mt-0.5">
                            {count.toLocaleString()} available
                          </p>
                        )}
                      </div>
                      <span style={{ color: CLAY }} className="text-lg">&rarr;</span>
                    </div>
                    <p style={{ fontFamily: SERIF, color: MUTED }} className="text-sm leading-relaxed">
                      {section.description}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* ── Divider ── */}
        <div style={{ borderTop: '1px solid ' + RULE_COLOR }} className="my-8" />

        {/* Crisis quick-access */}
        <div className="p-5" style={{ border: '1px solid ' + RULE_COLOR, background: PARCHMENT_WARM }}>
          <p style={{ fontFamily: MONO, color: MUTED }} className="text-[10px] uppercase tracking-wider mb-3">Immediate Support</p>
          <div className="flex flex-wrap gap-6 text-sm" style={{ fontFamily: MONO, color: MUTED }}>
            <span>Crisis Line: <strong style={{ color: INK }}>988</strong></span>
            <span>City Services: <strong style={{ color: INK }}>311</strong></span>
            <span>Social Services: <strong style={{ color: INK }}>211</strong></span>
            <span>DV Hotline: <strong style={{ color: INK }}>713-528-2121</strong></span>
          </div>
        </div>

        <div className="mt-10 text-center">
          <p style={{ fontFamily: SERIF, color: MUTED }} className="text-sm italic">
            Everything here already exists. We just made it findable.
          </p>
        </div>
      </div>

      {/* ── Footer link ── */}
      <div className="max-w-[900px] mx-auto px-6 pb-10">
        <div style={{ borderTop: '1px solid ' + RULE_COLOR }} className="pt-4">
          <Link href="/" style={{ fontFamily: MONO, color: CLAY }} className="text-sm hover:underline">&larr; Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
