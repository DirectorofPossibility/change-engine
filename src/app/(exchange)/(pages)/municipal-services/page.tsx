import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { PageHero } from '@/components/exchange/PageHero'
import { Landmark, Globe, Phone } from 'lucide-react'
import { IndexWayfinder } from '@/components/exchange/IndexWayfinder'
import { FeaturedPromo } from '@/components/exchange/FeaturedPromo'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'City Services — Community Exchange',
  description: 'City of Houston municipal services and programs available to residents.',
}

export default async function MunicipalServicesPage() {
  const supabase = await createClient()
  const { data: services } = await supabase
    .from('municipal_services')
    .select('service_id, service_name, description_5th_grade, department, agency_id, website, phone')
    .order('service_name')

  return (
    <div>
      <PageHero variant="sacred" sacredPattern="tripod" gradientColor="#38a169" title="City Services" subtitle="Municipal services and programs provided by the City of Houston for residents." />
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumb items={[{ label: 'City Services' }]} />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 mt-4">
          <div className="space-y-3">
            {(services || []).map(function (s: any) {
              return (
                <Link key={s.service_id} href={`/municipal-services/${s.service_id}`} className="block bg-white rounded-lg border-2 border-brand-border p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <Landmark className="w-5 h-5 text-theme-voice mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-brand-text">{s.service_name}</h3>
                      {s.description_5th_grade && <p className="text-sm text-brand-muted mt-1 line-clamp-2">{s.description_5th_grade}</p>}
                      <div className="flex items-center gap-4 mt-2 text-xs text-brand-muted">
                        {s.department && <span>{s.department}</span>}
                        {s.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{s.phone}</span>}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <IndexWayfinder currentPage="municipal-services" related={[{label:'Agencies',href:'/agencies'},{label:'Services',href:'/services'},{label:'Officials',href:'/officials'}]} color="#38a169" />
              <FeaturedPromo variant="card" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
