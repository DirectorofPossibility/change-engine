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
          {eyebrowParts.length > 0 && (
            <p style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: "#1b5e8a", marginTop: '0.75rem' }}>
              {eyebrowParts.join(' / ')}
            </p>
          )}
          <h1 style={{ fontSize: '2.2rem', lineHeight: 1.15, marginTop: '0.5rem' }}>
            {f.name}
          </h1>
          {f.mission && (
            <p style={{ fontSize: '1rem', color: "#5c6474", marginTop: '0.75rem', maxWidth: '38rem', lineHeight: 1.7 }}>
              {f.mission}
            </p>
          )}
          {f.website_url && (
            <a
              href={f.website_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '0.65rem', letterSpacing: '0.08em', color: "#1b5e8a", textTransform: 'uppercase', display: 'inline-block', marginTop: '1rem' }}
              className="hover:underline"
            >
              Visit Website
            </a>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontSize: '0.7rem', color: "#5c6474" }}>
          <Link href="/" className="hover:underline" style={{ color: "#1b5e8a" }}>Home</Link>
          <span className="mx-2">/</span>
          <Link href="/foundations" className="hover:underline" style={{ color: "#1b5e8a" }}>Foundations</Link>
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
              <h2 style={{ fontSize: '1.5rem',  }}>Details</h2>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
            <div className="space-y-3">
              {f.assets && (
                <div style={{ fontSize: '0.9rem',  }}>
                  <span style={{ color: "#5c6474" }}>Assets:</span> <strong>{f.assets}</strong>
                </div>
              )}
              {f.annual_giving && (
                <div style={{ fontSize: '0.9rem',  }}>
                  <span style={{ color: "#5c6474" }}>Annual giving:</span> <strong>{f.annual_giving}</strong>
                </div>
              )}
              {f.founded_year && (
                <div style={{ fontSize: '0.9rem',  }}>
                  <span style={{ color: "#5c6474" }}>Founded:</span> {f.founded_year}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Contact */}
        {(f.phone || f.email || address) && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontSize: '1.5rem',  }}>Contact</h2>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
            <div className="space-y-3">
              {f.phone && (
                <div style={{ fontSize: '0.9rem' }}>
                  <a href={'tel:' + f.phone} style={{ color: "#1b5e8a" }} className="hover:underline">{f.phone}</a>
                </div>
              )}
              {f.email && (
                <div style={{ fontSize: '0.9rem' }}>
                  <a href={'mailto:' + f.email} style={{ color: "#1b5e8a" }} className="hover:underline">{f.email}</a>
                </div>
              )}
              {address && (
                <div style={{ fontSize: '0.9rem',  }}>{address}</div>
              )}
            </div>
          </section>
        )}

        {/* Focus Areas */}
        {focusAreas.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontSize: '1.5rem',  }}>Focus Areas</h2>
              <span style={{ fontSize: '0.7rem', color: "#5c6474" }}>{focusAreas.length}</span>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
            <div className="flex flex-wrap gap-2">
              {focusAreas.map(function (fa) {
                return (
                  <Link
                    key={fa.focus_id}
                    href={'/explore/focus/' + fa.focus_id}
                    style={{ fontSize: '0.85rem', border: '1px solid #dde1e8', padding: '4px 12px' }}
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
              <h2 style={{ fontSize: '1.5rem',  }}>People</h2>
              <span style={{ fontSize: '0.7rem', color: "#5c6474" }}>{people.length}</span>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
            <div className="space-y-2">
              {people.slice(0, 4).map(function (p: any, i: number) {
                return (
                  <div key={i}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{p.person_name}</span>
                    {(p.role || p.title) && <span style={{ fontSize: '0.85rem', color: "#5c6474", marginLeft: '0.5rem' }}>{p.title || p.role}</span>}
                  </div>
                )
              })}
              {people.length > 4 && (
                <details className="mt-2">
                  <summary style={{ fontStyle: 'italic', color: "#1b5e8a", fontSize: '0.9rem', cursor: 'pointer' }}>
                    Show all {people.length} people
                  </summary>
                  <div className="space-y-2 mt-2">
                    {people.slice(4).map(function (p: any, i: number) {
                      return (
                        <div key={i + 4}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{p.person_name}</span>
                          {(p.role || p.title) && <span style={{ fontSize: '0.85rem', color: "#5c6474", marginLeft: '0.5rem' }}>{p.title || p.role}</span>}
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
      <div className="my-10 max-w-[900px] mx-auto px-6" style={{ height: 1, background: '#dde1e8' }} />
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <Link href="/foundations" style={{ fontStyle: 'italic', color: "#1b5e8a", fontSize: '0.95rem' }} className="hover:underline">
          Back to Foundations
        </Link>
      </div>
    </div>
  )
}
