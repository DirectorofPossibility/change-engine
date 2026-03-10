import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { PageHero } from '@/components/exchange/PageHero'
import { Building2, Globe, Phone } from 'lucide-react'
import { IndexWayfinder } from '@/components/exchange/IndexWayfinder'
import { FeaturedPromo } from '@/components/exchange/FeaturedPromo'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Government Agencies — Community Exchange',
  description: 'Federal, state, and local government agencies serving the Houston area.',
}

export default async function AgenciesPage() {
  const supabase = await createClient()
  const { data: agencies } = await supabase
    .from('agencies')
    .select('agency_id, agency_name, agency_acronym, gov_level_id, jurisdiction, description_5th_grade, website, phone')
    .order('agency_name')

  const grouped: Record<string, typeof agencies> = {}
  for (const a of agencies || []) {
    const level = a.gov_level_id || 'Other'
    if (!grouped[level]) grouped[level] = []
    grouped[level].push(a)
  }

  const levelOrder = ['GOV_FED', 'GOV_STATE', 'GOV_COUNTY', 'GOV_CITY', 'Other']
  const levelLabels: Record<string, string> = {
    GOV_FED: 'Federal', GOV_STATE: 'State of Texas', GOV_COUNTY: 'Harris County', GOV_CITY: 'City of Houston', Other: 'Other'
  }

  return (
    <div>
      <PageHero variant="sacred" sacredPattern="metatron" gradientColor="#3182ce" title="Government Agencies" subtitle="Federal, state, and local agencies serving Houston and Harris County." />
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumb items={[{ label: 'Agencies' }]} />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
          <div>
            {levelOrder.map(function (level) {
              const items = grouped[level]
              if (!items || items.length === 0) return null
              return (
                <div key={level} className="mb-10">
                  <h2 className="text-lg font-serif font-bold text-brand-text mb-4 border-b border-brand-border pb-2">{levelLabels[level] || level}</h2>
                  <div className="space-y-3">
                    {items.map(function (a) {
                      return (
                        <Link key={a.agency_id} href={`/agencies/${a.agency_id}`} className="block bg-white rounded-lg border border-brand-border p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start gap-3">
                            <Building2 className="w-5 h-5 text-brand-accent mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-brand-text">
                                {a.agency_name}
                                {a.agency_acronym && <span className="ml-2 text-sm text-brand-muted">({a.agency_acronym})</span>}
                              </h3>
                              {a.description_5th_grade && <p className="text-sm text-brand-muted mt-1 line-clamp-2">{a.description_5th_grade}</p>}
                              <div className="flex items-center gap-4 mt-2 text-xs text-brand-muted">
                                {a.jurisdiction && <span>{a.jurisdiction}</span>}
                                {a.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{a.phone}</span>}
                                {a.website && <span className="flex items-center gap-1"><Globe className="w-3 h-3" />Website</span>}
                              </div>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <IndexWayfinder currentPage="agencies" related={[{label:'Officials',href:'/officials'},{label:'City Services',href:'/municipal-services'},{label:'Policies',href:'/policies'}]} color="#3182ce" />
              <FeaturedPromo variant="card" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
