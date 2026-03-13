import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getWayfinderContext } from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'

export const revalidate = 300


export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: service } = await supabase.from('municipal_services').select('*').eq('id', id).single()
  if (!service) return { title: 'Service Not Found' }
  const s = service as any
  return {
    title: s.service_name || 'City Service',
    description: s.description || `${s.service_name} — a City of Houston municipal service${s.department ? ' from ' + s.department : ''}.`,
  }
}

export default async function MunicipalServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: service } = await supabase.from('municipal_services').select('*').eq('id', id).single()
  if (!service) notFound()

  const s = service as any

  const userProfile = await getUserProfile()
  const wayfinderData = await getWayfinderContext('municipal_service' as any, s.id, userProfile?.role)

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
          <span style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: "#1b5e8a", display: 'block', marginTop: '0.75rem' }}>City Service</span>
          {s.department && (
            <span style={{ fontSize: '0.65rem', color: "#5c6474", display: 'block', marginTop: '0.25rem' }}>{s.department}</span>
          )}
          <h1 style={{ fontSize: '2.2rem', lineHeight: 1.15, marginTop: '0.5rem' }}>
            {s.service_name}
          </h1>
          {s.description_5th_grade && (
            <p style={{ fontSize: '1rem', color: "#5c6474", marginTop: '0.75rem', maxWidth: '38rem', lineHeight: 1.7 }}>
              {s.description_5th_grade}
            </p>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontSize: '0.7rem', color: "#5c6474" }}>
          <Link href="/" className="hover:underline" style={{ color: "#1b5e8a" }}>Home</Link>
          <span className="mx-2">/</span>
          <Link href="/municipal-services" className="hover:underline" style={{ color: "#1b5e8a" }}>City Services</Link>
          <span className="mx-2">/</span>
          <span>{s.service_name}</span>
        </nav>
      </div>

      {/* Main content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">

        {/* Contact */}
        {(s.phone || s.website || s.address) && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontSize: '1.5rem',  }}>Contact</h2>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
            <div className="space-y-3">
              {s.phone && (
                <div style={{ fontSize: '0.9rem' }}>
                  <span style={{ fontSize: '0.65rem', color: "#5c6474", textTransform: 'uppercase', letterSpacing: '0.08em' }}>Phone: </span>
                  <a href={`tel:${s.phone}`} style={{ color: "#1b5e8a" }} className="hover:underline">{s.phone}</a>
                </div>
              )}
              {s.website && (
                <div style={{ fontSize: '0.9rem' }}>
                  <span style={{ fontSize: '0.65rem', color: "#5c6474", textTransform: 'uppercase', letterSpacing: '0.08em' }}>Web: </span>
                  <a href={s.website} target="_blank" rel="noopener noreferrer" style={{ color: "#1b5e8a" }} className="hover:underline truncate">
                    {s.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              {s.address && (
                <div style={{ fontSize: '0.9rem' }}>
                  <span style={{ fontSize: '0.65rem', color: "#5c6474", textTransform: 'uppercase', letterSpacing: '0.08em' }}>Address: </span>
                  <span style={{  }}>{s.address}</span>
                </div>
              )}
              {s.agency_id && (
                <div className="pt-2 mt-2" style={{ borderTop: '1px solid #dde1e8' }}>
                  <Link href={`/agencies/${s.agency_id}`} style={{ fontSize: '0.9rem', color: "#1b5e8a" }} className="hover:underline">
                    View parent agency
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}

        {/* About */}
        {s.description && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontSize: '1.5rem',  }}>About This Service</h2>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
            <p style={{ fontSize: '0.95rem', lineHeight: 1.85 }}>{s.description}</p>
          </section>
        )}
      </div>

      {/* Footer */}
      <div className="my-10 max-w-[900px] mx-auto px-6" style={{ height: 1, background: '#dde1e8' }} />
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <Link href="/municipal-services" style={{ fontStyle: 'italic', color: "#1b5e8a", fontSize: '0.95rem' }} className="hover:underline">
          Back to City Services
        </Link>
      </div>
    </div>
  )
}
