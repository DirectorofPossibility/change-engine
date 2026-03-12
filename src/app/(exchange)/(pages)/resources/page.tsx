import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { IndexPageHero } from '@/components/exchange/IndexPageHero'
import { FlowerOfLifeIcon } from '@/components/exchange/FlowerIcons'
import { Layers, Sparkles, LifeBuoy } from 'lucide-react'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Resources — Community Exchange',
  description: 'Find services, opportunities, and support available across Houston.',
}

const SECTIONS = [
  {
    href: '/services',
    label: 'Services',
    description: 'Searchable directory of 211 social services — food, housing, healthcare, legal aid, childcare, and more — mapped to your neighborhood.',
    icon: Layers,
    color: '#38a169',
    countKey: 'services',
  },
  {
    href: '/opportunities',
    label: 'Opportunities',
    description: 'Volunteer positions, job openings, training programs, and ways to contribute your time and skills.',
    icon: Sparkles,
    color: '#d69e2e',
    countKey: 'opportunities',
  },
  {
    href: '/help',
    label: 'Available Resources',
    description: 'Life situations organized by urgency — from crisis support to long-term planning. Find what exists for your specific situation.',
    icon: LifeBuoy,
    color: '#e53e3e',
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

  return (
    <div>
      <IndexPageHero
        color="#C75B2A"
        pattern="tripod"
        title="Resources"
        subtitle="What is available to you — services, opportunities, and support already in place across Houston."
        stats={[
          { value: counts.services, label: 'Services' },
          { value: counts.opportunities, label: 'Opportunities' },
          { value: counts.situations, label: 'Life Situations' },
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
                className="group bg-white border border-brand-border overflow-hidden hover:shadow-lg transition-all"
               
              >
                <div className="flex">
                  <div
                    className="w-2 flex-shrink-0"
                    style={{ backgroundColor: section.color }}
                  />
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 flex items-center justify-center"
                          style={{ backgroundColor: section.color + '15' }}
                        >
                          <Icon size={20} style={{ color: section.color }} />
                        </div>
                        <div>
                          <h2 className="font-display text-xl font-bold text-brand-text group-hover:text-brand-accent transition-colors">
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

        {/* Crisis quick-access */}
        <div className="mt-8 p-5 bg-brand-bg border border-brand-border">
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted-light mb-3">Immediate Support</p>
          <div className="flex flex-wrap gap-6 font-mono text-sm text-brand-muted">
            <span>Crisis Line: <strong className="text-brand-text">988</strong></span>
            <span>City Services: <strong className="text-brand-text">311</strong></span>
            <span>Social Services: <strong className="text-brand-text">211</strong></span>
            <span>DV Hotline: <strong className="text-brand-text">713-528-2121</strong></span>
          </div>
        </div>

        <div className="mt-10 text-center">
          <div className="inline-flex items-center gap-2 text-brand-muted-light">
            <FlowerOfLifeIcon size={20} color="#C75B2A" />
            <p className="text-sm font-display italic">
              Everything here already exists. We just made it findable.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
