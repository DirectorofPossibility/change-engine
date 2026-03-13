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
  const { data } = await supabase.from('foundations').select('name, mission').eq('id', id).single()
  if (!data) return { title: 'Not Found' }
  return { title: data.name, description: data.mission || 'Foundation details.' }
}

export default async function FoundationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: f } = await supabase.from('foundations').select('*').eq('id', id).single()
  if (!f) notFound()

  const { data: people } = await supabase
    .from('foundation_people')
    .select('person_name, role, title')
    .eq('foundation_id', id)
    .limit(20)

  const userProfile = await getUserProfile()

  const [focusJunctionsResult, wayfinderData] = await Promise.all([
    supabase.from('foundation_focus_areas').select('focus_id').eq('foundation_id', id),
    getWayfinderContext('foundation', id, userProfile?.role),
  ])

  const focusIds = (focusJunctionsResult.data || []).map((j: any) => j.focus_id)
  let focusAreas: Array<{ focus_id: string; focus_area_name: string }> = []
  if (focusIds.length > 0) {
    const { data } = await supabase.from('focus_areas').select('focus_id, focus_area_name').in('focus_id', focusIds)
    focusAreas = data || []
  }

  const address = [f.address, f.city, f.state_code, f.zip_code].filter(Boolean).join(', ')
  const eyebrowParts = [f.type, f.geo_level].filter(Boolean)

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
          {eyebrowParts.length > 0 && (
            <p style={{ fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: CLAY, marginTop: '0.75rem' }}>
              {eyebrowParts.join(' / ')}
            </p>
          )}
          <h1 style={{ fontFamily: SERIF, fontSize: '2.2rem', color: INK, lineHeight: 1.15, marginTop: '0.5rem' }}>
            {f.name}
          </h1>
          {f.mission && (
            <p style={{ fontFamily: SERIF, fontSize: '1rem', color: MUTED, marginTop: '0.75rem', maxWidth: '38rem', lineHeight: 1.7 }}>
              {f.mission}
            </p>
          )}
          {f.website_url && (
            <a
              href={f.website_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.08em', color: CLAY, textTransform: 'uppercase', display: 'inline-block', marginTop: '1rem' }}
              className="hover:underline"
            >
              Visit Website
            </a>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontFamily: MONO, fontSize: '0.7rem', color: MUTED }}>
          <Link href="/" className="hover:underline" style={{ color: CLAY }}>Home</Link>
          <span className="mx-2">/</span>
          <Link href="/foundations" className="hover:underline" style={{ color: CLAY }}>Foundations</Link>
          <span className="mx-2">/</span>
          <span>{f.name}</span>
        </nav>
      </div>

      {/* Main content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">

        {/* Details */}
        {(f.assets || f.annual_giving || f.founded_year) && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK }}>Details</h2>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + RULE_COLOR, marginBottom: '1rem' }} />
            <div className="space-y-3">
              {f.assets && (
                <div style={{ fontFamily: SERIF, fontSize: '0.9rem', color: INK }}>
                  <span style={{ color: MUTED }}>Assets:</span> <strong>{f.assets}</strong>
                </div>
              )}
              {f.annual_giving && (
                <div style={{ fontFamily: SERIF, fontSize: '0.9rem', color: INK }}>
                  <span style={{ color: MUTED }}>Annual giving:</span> <strong>{f.annual_giving}</strong>
                </div>
              )}
              {f.founded_year && (
                <div style={{ fontFamily: SERIF, fontSize: '0.9rem', color: INK }}>
                  <span style={{ color: MUTED }}>Founded:</span> {f.founded_year}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Contact */}
        {(f.phone || f.email || address) && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK }}>Contact</h2>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + RULE_COLOR, marginBottom: '1rem' }} />
            <div className="space-y-3">
              {f.phone && (
                <div style={{ fontFamily: SERIF, fontSize: '0.9rem' }}>
                  <a href={'tel:' + f.phone} style={{ color: CLAY }} className="hover:underline">{f.phone}</a>
                </div>
              )}
              {f.email && (
                <div style={{ fontFamily: SERIF, fontSize: '0.9rem' }}>
                  <a href={'mailto:' + f.email} style={{ color: CLAY }} className="hover:underline">{f.email}</a>
                </div>
              )}
              {address && (
                <div style={{ fontFamily: SERIF, fontSize: '0.9rem', color: INK }}>{address}</div>
              )}
            </div>
          </section>
        )}

        {/* Focus Areas */}
        {focusAreas.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK }}>Focus Areas</h2>
              <span style={{ fontFamily: MONO, fontSize: '0.7rem', color: MUTED }}>{focusAreas.length}</span>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + RULE_COLOR, marginBottom: '1rem' }} />
            <div className="flex flex-wrap gap-2">
              {focusAreas.map(function (fa) {
                return (
                  <Link
                    key={fa.focus_id}
                    href={'/explore/focus/' + fa.focus_id}
                    style={{ fontFamily: SERIF, fontSize: '0.85rem', color: INK, border: '1px solid ' + RULE_COLOR, padding: '4px 12px' }}
                    className="hover:opacity-80 transition-opacity"
                  >
                    {fa.focus_area_name}
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* People */}
        {people && people.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK }}>People</h2>
              <span style={{ fontFamily: MONO, fontSize: '0.7rem', color: MUTED }}>{people.length}</span>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + RULE_COLOR, marginBottom: '1rem' }} />
            <div className="space-y-2">
              {people.slice(0, 4).map(function (p: any, i: number) {
                return (
                  <div key={i}>
                    <span style={{ fontFamily: SERIF, fontSize: '0.9rem', color: INK, fontWeight: 600 }}>{p.person_name}</span>
                    {(p.role || p.title) && <span style={{ fontFamily: SERIF, fontSize: '0.85rem', color: MUTED, marginLeft: '0.5rem' }}>{p.title || p.role}</span>}
                  </div>
                )
              })}
              {people.length > 4 && (
                <details className="mt-2">
                  <summary style={{ fontFamily: SERIF, fontStyle: 'italic', color: CLAY, fontSize: '0.9rem', cursor: 'pointer' }}>
                    Show all {people.length} people
                  </summary>
                  <div className="space-y-2 mt-2">
                    {people.slice(4).map(function (p: any, i: number) {
                      return (
                        <div key={i + 4}>
                          <span style={{ fontFamily: SERIF, fontSize: '0.9rem', color: INK, fontWeight: 600 }}>{p.person_name}</span>
                          {(p.role || p.title) && <span style={{ fontFamily: SERIF, fontSize: '0.85rem', color: MUTED, marginLeft: '0.5rem' }}>{p.title || p.role}</span>}
                        </div>
                      )
                    })}
                  </div>
                </details>
              )}
            </div>
          </section>
        )}
      </div>

      {/* Footer */}
      <div className="my-10 max-w-[900px] mx-auto px-6" style={{ height: 1, background: RULE_COLOR }} />
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <Link href="/foundations" style={{ fontFamily: SERIF, fontStyle: 'italic', color: CLAY, fontSize: '0.95rem' }} className="hover:underline">
          Back to Foundations
        </Link>
      </div>
    </div>
  )
}
