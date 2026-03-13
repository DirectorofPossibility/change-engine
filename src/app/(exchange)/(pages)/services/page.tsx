import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getServices, getLangId, fetchTranslationsForTable } from '@/lib/data/exchange'
import { getServicesByZip } from '@/lib/data/services'
import { ServicesClient } from './ServicesClient'

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Find Services — Change Engine',
  description: 'Free and low-cost services in the Houston area — a community resource directory.',
}

export default async function ServicesPage({ searchParams }: { searchParams: Promise<{ zip?: string }> }) {
  const { zip: urlZip } = await searchParams
  const cookieStore = await cookies()
  const userZip = urlZip || cookieStore.get('zip')?.value || ''
  const supabase = await createClient()

  const [allServices, zipServices, { data: categories }] = await Promise.all([
    getServices(),
    userZip ? getServicesByZip(userZip) : Promise.resolve([]),
    supabase.from('service_categories').select('*').order('service_cat_name'),
  ])

  // If ZIP available, put local services first
  let services: typeof allServices
  if (zipServices.length > 0) {
    const zipIds = new Set(zipServices.map(s => s.service_id))
    const rest = allServices.filter(s => !zipIds.has(s.service_id))
    services = [...zipServices, ...rest]
  } else {
    services = allServices
  }

  const langId = await getLangId()
  const serviceIds = services.map(function (s) { return s.service_id })
  const translations = langId ? await fetchTranslationsForTable('services_211', serviceIds, langId) : {}

  const categoryMap = (categories ?? []).reduce<Record<string, { name: string; description: string; examples: string }>>(
    function (acc, c) {
      acc[c.service_cat_id] = {
        name: c.service_cat_name,
        description: c.description_5th_grade ?? '',
        examples: c.example_services ?? '',
      }
      return acc
    }, {}
  )

  const withLocation = services.filter(function (s) { return s.latitude != null }).length
  const uniqueOrgs = new Set(services.map(function (s) { return s.org_id }).filter(Boolean)).size

  return (
    <div style={{ background: PARCHMENT }} className="min-h-screen">
      {/* Hero */}
      <div style={{ background: PARCHMENT_WARM }} className="relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="max-w-[900px] mx-auto px-6 py-16 relative z-10">
          <p style={{ fontFamily: MONO, fontSize: '0.7rem', letterSpacing: '0.15em', color: MUTED, textTransform: 'uppercase' }}>
            The Change Engine
          </p>
          <h1 style={{ fontFamily: SERIF, fontSize: '2.5rem', color: INK, lineHeight: 1.15, marginTop: '0.75rem' }}>
            Community Services
          </h1>
          <p style={{ fontFamily: SERIF, fontSize: '1.1rem', color: MUTED, marginTop: '0.75rem', maxWidth: '38rem', lineHeight: 1.7 }}>
            Houston has a deep network of services dedicated to your well-being. Browse by category, search by name, or switch to map view.
          </p>
          <div className="flex flex-wrap gap-8 mt-8">
            <div>
              <span style={{ fontFamily: SERIF, fontSize: '2rem', color: INK }}>{services.length}</span>
              <span style={{ fontFamily: MONO, fontSize: '0.65rem', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block' }}>Services</span>
            </div>
            <div>
              <span style={{ fontFamily: SERIF, fontSize: '2rem', color: INK }}>{uniqueOrgs}</span>
              <span style={{ fontFamily: MONO, fontSize: '0.65rem', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block' }}>Organizations</span>
            </div>
            <div>
              <span style={{ fontFamily: SERIF, fontSize: '2rem', color: INK }}>{Object.keys(categoryMap).length}</span>
              <span style={{ fontFamily: MONO, fontSize: '0.65rem', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block' }}>Categories</span>
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontFamily: MONO, fontSize: '0.7rem', color: MUTED }}>
          <Link href="/" className="hover:underline" style={{ color: CLAY }}>Home</Link>
          <span className="mx-2">/</span>
          <span>Services</span>
        </nav>
      </div>

      {/* Main content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">
        <ServicesClient
          services={services}
          translations={translations}
          categories={categoryMap}
          initialZip={urlZip}
          hasLocations={withLocation > 0}
        />
      </div>

      {/* Footer */}
      <div className="my-10 max-w-[900px] mx-auto px-6" style={{ height: 1, background: RULE_COLOR }} />
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <Link href="/" style={{ fontFamily: SERIF, fontStyle: 'italic', color: CLAY, fontSize: '0.95rem' }} className="hover:underline">
          Back to the Guide
        </Link>
      </div>
    </div>
  )
}
