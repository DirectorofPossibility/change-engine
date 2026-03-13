import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getMunicipalServices } from '@/lib/data/services'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'City Services — Change Engine',
  description: 'City of Houston municipal services and programs available to residents.',
}

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

const VISIBLE_COUNT = 4

export default async function MunicipalServicesPage() {
  const cookieStore = await cookies()
  const userZip = cookieStore.get('zip')?.value || ''
  const supabase = await createClient()

  // Fetch all services + ZIP-filtered services in parallel
  const [{ data: rawServices }, zipFiltered] = await Promise.all([
    supabase
      .from('municipal_services')
      .select('service_id, service_name, description_5th_grade, department, agency_id, website, phone')
      .order('service_name'),
    userZip ? getMunicipalServices(userZip) : Promise.resolve(null),
  ])

  // If ZIP available, show relevant services first
  let allServices: any[]
  if (zipFiltered) {
    const zipMatched = [
      ...zipFiltered.emergency, ...zipFiltered.police, ...zipFiltered.fire,
      ...zipFiltered.medical, ...zipFiltered.parks, ...zipFiltered.library,
      ...zipFiltered.utilities,
    ]
    const zipMatchedIds = new Set(zipMatched.map((s: any) => s.service_id))
    const rest = (rawServices || []).filter((s: any) => !zipMatchedIds.has(s.service_id))
    allServices = [...zipMatched, ...rest]
  } else {
    allServices = rawServices || []
  }
  const visible = allServices.slice(0, VISIBLE_COUNT)
  const rest = allServices.slice(VISIBLE_COUNT)

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
            City Services
          </h1>
          <p style={{ fontFamily: SERIF, fontSize: '1.1rem', color: MUTED, marginTop: '0.75rem', maxWidth: '38rem', lineHeight: 1.7 }}>
            Municipal services and programs provided by the City of Houston for residents.
          </p>
          {allServices.length > 0 && (
            <div className="flex flex-wrap gap-8 mt-8">
              <div>
                <span style={{ fontFamily: SERIF, fontSize: '2rem', color: INK }}>{allServices.length}</span>
                <span style={{ fontFamily: MONO, fontSize: '0.65rem', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block' }}>Services</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontFamily: MONO, fontSize: '0.7rem', color: MUTED }}>
          <Link href="/" className="hover:underline" style={{ color: CLAY }}>Home</Link>
          <span className="mx-2">/</span>
          <span>City Services</span>
        </nav>
      </div>

      {/* Main content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">
        <div className="flex items-baseline justify-between mb-1">
          <h2 style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK }}>All Services</h2>
          <span style={{ fontFamily: MONO, fontSize: '0.7rem', color: MUTED }}>{allServices.length}</span>
        </div>
        <div style={{ height: 1, borderBottom: '1px dotted ' + RULE_COLOR, marginBottom: '1.5rem' }} />

        <div className="space-y-3">
          {visible.map(function (s: any) {
            return (
              <Link key={s.service_id} href={`/municipal-services/${s.service_id}`}
                className="block p-5 border hover:border-current transition-colors"
                style={{ borderColor: RULE_COLOR, background: PARCHMENT_WARM }}>
                <h3 style={{ fontFamily: SERIF, color: INK, fontSize: '1rem' }}>{s.service_name}</h3>
                {s.description_5th_grade && <p style={{ fontFamily: SERIF, color: MUTED, fontSize: '0.85rem' }} className="mt-1 line-clamp-2">{s.description_5th_grade}</p>}
                <div className="flex items-center gap-4 mt-2" style={{ fontFamily: MONO, color: MUTED, fontSize: '0.7rem' }}>
                  {s.department && <span>{s.department}</span>}
                  {s.phone && <span>{s.phone}</span>}
                </div>
              </Link>
            )
          })}
        </div>

        {rest.length > 0 && (
          <details className="mt-3">
            <summary style={{ fontFamily: SERIF, fontStyle: 'italic', color: CLAY, fontSize: '0.9rem', cursor: 'pointer' }}>
              See {rest.length} more service{rest.length > 1 ? 's' : ''}
            </summary>
            <div className="space-y-3 mt-3">
              {rest.map(function (s: any) {
                return (
                  <Link key={s.service_id} href={`/municipal-services/${s.service_id}`}
                    className="block p-5 border hover:border-current transition-colors"
                    style={{ borderColor: RULE_COLOR, background: PARCHMENT_WARM }}>
                    <h3 style={{ fontFamily: SERIF, color: INK, fontSize: '1rem' }}>{s.service_name}</h3>
                    {s.description_5th_grade && <p style={{ fontFamily: SERIF, color: MUTED, fontSize: '0.85rem' }} className="mt-1 line-clamp-2">{s.description_5th_grade}</p>}
                    <div className="flex items-center gap-4 mt-2" style={{ fontFamily: MONO, color: MUTED, fontSize: '0.7rem' }}>
                      {s.department && <span>{s.department}</span>}
                      {s.phone && <span>{s.phone}</span>}
                    </div>
                  </Link>
                )
              })}
            </div>
          </details>
        )}
      </div>

      {/* Footer rule + link */}
      <div className="my-10 max-w-[900px] mx-auto px-6" style={{ height: 1, background: RULE_COLOR }} />
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <Link href="/" style={{ fontFamily: SERIF, fontStyle: 'italic', color: CLAY, fontSize: '0.95rem' }} className="hover:underline">
          Back to the Guide
        </Link>
      </div>
    </div>
  )
}
