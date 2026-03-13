import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
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
  const { data: service } = await supabase.from('municipal_services').select('*').eq('service_id', id).single()
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
  const { data: service } = await supabase.from('municipal_services').select('*').eq('service_id', id).single()
  if (!service) notFound()

  const s = service as any

  const userProfile = await getUserProfile()
  const wayfinderData = await getWayfinderContext('municipal_service' as any, s.service_id, userProfile?.role)

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
          <span style={{ fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: CLAY, display: 'block', marginTop: '0.75rem' }}>City Service</span>
          {s.department && (
            <span style={{ fontFamily: MONO, fontSize: '0.65rem', color: MUTED, display: 'block', marginTop: '0.25rem' }}>{s.department}</span>
          )}
          <h1 style={{ fontFamily: SERIF, fontSize: '2.2rem', color: INK, lineHeight: 1.15, marginTop: '0.5rem' }}>
            {s.service_name}
          </h1>
          {s.description_5th_grade && (
            <p style={{ fontFamily: SERIF, fontSize: '1rem', color: MUTED, marginTop: '0.75rem', maxWidth: '38rem', lineHeight: 1.7 }}>
              {s.description_5th_grade}
            </p>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontFamily: MONO, fontSize: '0.7rem', color: MUTED }}>
          <Link href="/" className="hover:underline" style={{ color: CLAY }}>Home</Link>
          <span className="mx-2">/</span>
          <Link href="/municipal-services" className="hover:underline" style={{ color: CLAY }}>City Services</Link>
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
              <h2 style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK }}>Contact</h2>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + RULE_COLOR, marginBottom: '1rem' }} />
            <div className="space-y-3">
              {s.phone && (
                <div style={{ fontFamily: SERIF, fontSize: '0.9rem' }}>
                  <span style={{ fontFamily: MONO, fontSize: '0.65rem', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Phone: </span>
                  <a href={`tel:${s.phone}`} style={{ color: CLAY }} className="hover:underline">{s.phone}</a>
                </div>
              )}
              {s.website && (
                <div style={{ fontFamily: SERIF, fontSize: '0.9rem' }}>
                  <span style={{ fontFamily: MONO, fontSize: '0.65rem', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Web: </span>
                  <a href={s.website} target="_blank" rel="noopener noreferrer" style={{ color: CLAY }} className="hover:underline truncate">
                    {s.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              {s.address && (
                <div style={{ fontFamily: SERIF, fontSize: '0.9rem' }}>
                  <span style={{ fontFamily: MONO, fontSize: '0.65rem', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Address: </span>
                  <span style={{ color: INK }}>{s.address}</span>
                </div>
              )}
              {s.agency_id && (
                <div className="pt-2 mt-2" style={{ borderTop: '1px solid ' + RULE_COLOR }}>
                  <Link href={`/agencies/${s.agency_id}`} style={{ fontFamily: SERIF, fontSize: '0.9rem', color: CLAY }} className="hover:underline">
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
              <h2 style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK }}>About This Service</h2>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + RULE_COLOR, marginBottom: '1rem' }} />
            <p style={{ fontFamily: SERIF, fontSize: '0.95rem', color: INK, lineHeight: 1.85 }}>{s.description}</p>
          </section>
        )}
      </div>

      {/* Footer */}
      <div className="my-10 max-w-[900px] mx-auto px-6" style={{ height: 1, background: RULE_COLOR }} />
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <Link href="/municipal-services" style={{ fontFamily: SERIF, fontStyle: 'italic', color: CLAY, fontSize: '0.95rem' }} className="hover:underline">
          Back to City Services
        </Link>
      </div>
    </div>
  )
}
