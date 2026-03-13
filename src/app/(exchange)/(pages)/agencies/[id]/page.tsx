import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { getWayfinderContext } from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'

export const revalidate = 300

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('agencies').select('agency_name, description_5th_grade').eq('agency_id', id).single()
  if (!data) return { title: 'Not Found' }
  return { title: data.agency_name, description: data.description_5th_grade || 'Government agency details.' }
}

export default async function AgencyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: agency } = await supabase.from('agencies').select('*').eq('agency_id', id).single()
  if (!agency) notFound()

  const userProfile = await getUserProfile()

  const [servicesResult] = await Promise.all([
    supabase.from('municipal_services').select('service_id, service_name, description_5th_grade').eq('agency_id', id).limit(10),
  ])
  const services = servicesResult.data

  const address = [agency.address, agency.city, agency.state, agency.zip_code].filter(Boolean).join(', ')

  const titleDisplay = agency.agency_acronym
    ? `${agency.agency_name} (${agency.agency_acronym})`
    : agency.agency_name

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
          {agency.jurisdiction && (
            <span style={{ fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: CLAY, display: 'block', marginTop: '0.75rem' }}>{agency.jurisdiction}</span>
          )}
          <h1 style={{ fontFamily: SERIF, fontSize: '2.2rem', color: INK, lineHeight: 1.15, marginTop: '0.5rem' }}>
            {titleDisplay}
          </h1>
          {agency.description_5th_grade && (
            <p style={{ fontFamily: SERIF, fontSize: '1rem', color: MUTED, marginTop: '0.75rem', maxWidth: '38rem', lineHeight: 1.7 }}>
              {agency.description_5th_grade}
            </p>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontFamily: MONO, fontSize: '0.7rem', color: MUTED }}>
          <Link href="/" className="hover:underline" style={{ color: CLAY }}>Home</Link>
          <span className="mx-2">/</span>
          <Link href="/agencies" className="hover:underline" style={{ color: CLAY }}>Agencies</Link>
          <span className="mx-2">/</span>
          <span>{agency.agency_name}</span>
        </nav>
      </div>

      {/* Main content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">

        {/* Contact */}
        {(agency.phone || agency.website || address) && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK }}>Contact</h2>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + RULE_COLOR, marginBottom: '1rem' }} />
            <div className="space-y-3">
              {agency.phone && (
                <div style={{ fontFamily: SERIF, fontSize: '0.9rem' }}>
                  <span style={{ fontFamily: MONO, fontSize: '0.65rem', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Phone: </span>
                  <a href={`tel:${agency.phone}`} style={{ color: CLAY }} className="hover:underline">{agency.phone}</a>
                </div>
              )}
              {agency.website && (
                <div style={{ fontFamily: SERIF, fontSize: '0.9rem' }}>
                  <span style={{ fontFamily: MONO, fontSize: '0.65rem', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Web: </span>
                  <a href={agency.website} target="_blank" rel="noopener noreferrer" style={{ color: CLAY }} className="hover:underline truncate">
                    {agency.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              {address && (
                <div style={{ fontFamily: SERIF, fontSize: '0.9rem' }}>
                  <span style={{ fontFamily: MONO, fontSize: '0.65rem', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Address: </span>
                  <span style={{ color: INK }}>{address}</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Services */}
        {services && services.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK }}>Services Provided</h2>
              <span style={{ fontFamily: MONO, fontSize: '0.7rem', color: MUTED }}>{services.length}</span>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + RULE_COLOR, marginBottom: '1rem' }} />
            <div className="space-y-2">
              {services.map(function (s: any) {
                return (
                  <Link key={s.service_id} href={`/municipal-services/${s.service_id}`}
                    className="block hover:underline" style={{ fontFamily: SERIF, fontSize: '0.9rem', color: CLAY }}>
                    {s.service_name}
                  </Link>
                )
              })}
            </div>
          </section>
        )}
      </div>

      {/* Footer */}
      <div className="my-10 max-w-[900px] mx-auto px-6" style={{ height: 1, background: RULE_COLOR }} />
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <Link href="/agencies" style={{ fontFamily: SERIF, fontStyle: 'italic', color: CLAY, fontSize: '0.95rem' }} className="hover:underline">
          Back to Agencies
        </Link>
      </div>
    </div>
  )
}
