import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { getWayfinderContext } from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'

export const revalidate = 300


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

  // municipal_services has no agency_id column — query via agency's service_ids if available
  const agencyAny = agency as any
  let services: any[] = []
  if (agencyAny.service_ids && Array.isArray(agencyAny.service_ids) && agencyAny.service_ids.length > 0) {
    const { data } = await supabase.from('municipal_services').select('id, service_name, service_type').in('id', agencyAny.service_ids).limit(10)
    services = data || []
  }

  const address = [agency.address, agency.city, agency.state, agency.zip_code].filter(Boolean).join(', ')

  const titleDisplay = agency.agency_acronym
    ? `${agency.agency_name} (${agency.agency_acronym})`
    : agency.agency_name

  return (
    <div className="bg-paper min-h-screen">
      {/* Hero */}
      <div className="bg-paper relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="max-w-[900px] mx-auto px-6 py-16 relative z-10">
          <p style={{ fontSize: '0.7rem', letterSpacing: '0.15em', color: "#5c6474", textTransform: 'uppercase' }}>
            The Change Engine
          </p>
          {agency.jurisdiction && (
            <span style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: "#1b5e8a", display: 'block', marginTop: '0.75rem' }}>{agency.jurisdiction}</span>
          )}
          <h1 style={{ fontSize: '2.2rem', lineHeight: 1.15, marginTop: '0.5rem' }}>
            {titleDisplay}
          </h1>
          {agency.description_5th_grade && (
            <p style={{ fontSize: '1rem', color: "#5c6474", marginTop: '0.75rem', maxWidth: '38rem', lineHeight: 1.7 }}>
              {agency.description_5th_grade}
            </p>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontSize: '0.7rem', color: "#5c6474" }}>
          <Link href="/" className="hover:underline" style={{ color: "#1b5e8a" }}>Home</Link>
          <span className="mx-2">/</span>
          <Link href="/agencies" className="hover:underline" style={{ color: "#1b5e8a" }}>Agencies</Link>
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
              <h2 style={{ fontSize: '1.5rem',  }}>Contact</h2>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
            <div className="space-y-3">
              {agency.phone && (
                <div style={{ fontSize: '0.9rem' }}>
                  <span style={{ fontSize: '0.65rem', color: "#5c6474", textTransform: 'uppercase', letterSpacing: '0.08em' }}>Phone: </span>
                  <a href={`tel:${agency.phone}`} style={{ color: "#1b5e8a" }} className="hover:underline">{agency.phone}</a>
                </div>
              )}
              {agency.website && (
                <div style={{ fontSize: '0.9rem' }}>
                  <span style={{ fontSize: '0.65rem', color: "#5c6474", textTransform: 'uppercase', letterSpacing: '0.08em' }}>Web: </span>
                  <a href={agency.website} target="_blank" rel="noopener noreferrer" style={{ color: "#1b5e8a" }} className="hover:underline truncate">
                    {agency.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              {address && (
                <div style={{ fontSize: '0.9rem' }}>
                  <span style={{ fontSize: '0.65rem', color: "#5c6474", textTransform: 'uppercase', letterSpacing: '0.08em' }}>Address: </span>
                  <span style={{  }}>{address}</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Services */}
        {services && services.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontSize: '1.5rem',  }}>Services Provided</h2>
              <span style={{ fontSize: '0.7rem', color: "#5c6474" }}>{services.length}</span>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
            <div className="space-y-2">
              {services.map(function (s: any) {
                return (
                  <Link key={s.id} href={`/municipal-services/${s.id}`}
                    className="block hover:underline" style={{ fontSize: '0.9rem', color: "#1b5e8a" }}>
                    {s.service_name}
                  </Link>
                )
              })}
            </div>
          </section>
        )}
      </div>

      {/* Footer */}
      <div className="my-10 max-w-[900px] mx-auto px-6" style={{ height: 1, background: '#dde1e8' }} />
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <Link href="/agencies" style={{ fontStyle: 'italic', color: "#1b5e8a", fontSize: '0.95rem' }} className="hover:underline">
          Back to Agencies
        </Link>
      </div>
    </div>
  )
}
