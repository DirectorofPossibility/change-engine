import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 300
export const metadata: Metadata = { title: 'Opportunities — Community Exchange' }

export default async function OpportunitiesPage() {
  const supabase = await createClient()
  const { data: opportunities } = await (supabase as any)
    .from('opportunities')
    .select('opportunity_id, title, description_5th_grade, opportunity_type, org_id, is_virtual, city')
    .order('created_at', { ascending: false })
    .limit(40)

  function typeColor(type: string | null): string {
    if (!type) return '#6B6560'
    const t = type.toLowerCase()
    if (t.includes('volunteer')) return '#047857'
    if (t.includes('event')) return '#7C3AED'
    if (t.includes('job') || t.includes('employ')) return '#B45309'
    return '#C75B2A'
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Dark Editorial Hero */}
      <section style={{ background: '#2C2418', padding: '40px 32px 48px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Breadcrumb */}
          <nav style={{ marginBottom: '24px', fontSize: '13px' }}>
            <Link href="/design2" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>
              Home
            </Link>
            <span style={{ color: '#C75B2A', margin: '0 8px' }}>/</span>
            <span style={{ color: 'rgba(255,255,255,0.8)' }}>Opportunities</span>
          </nav>

          {/* Accent bar */}
          <div style={{ width: '40px', height: '2px', background: '#C75B2A', marginBottom: '20px' }} />

          {/* Title */}
          <h1
            className="font-serif"
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              color: '#FFFFFF',
              marginBottom: '12px',
              lineHeight: 1.2,
            }}
          >
            Opportunities
          </h1>

          {/* Subtitle */}
          <p
            className="font-serif"
            style={{
              fontSize: '18px',
              fontStyle: 'italic',
              color: 'rgba(255,255,255,0.6)',
              marginBottom: '16px',
            }}
          >
            Ways to contribute, participate, and grow in your community
          </p>

          {/* Intro text */}
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)', maxWidth: '720px', lineHeight: 1.6 }}>
            Volunteer, attend, participate — find ways to get involved in your community
            and make a meaningful contribution.
          </p>
        </div>
      </section>

      {/* Body */}
      <section style={{ background: '#FAF8F5', padding: '40px 32px 64px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="opp-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '20px' }}>
            {(opportunities || []).map(function (opp: any) {
              const color = typeColor(opp.opportunity_type)
              return (
                <div
                  key={opp.opportunity_id}
                  className="opp-card"
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2DDD5',
                    borderRadius: '0.75rem',
                    overflow: 'hidden',
                    transition: 'box-shadow 0.2s, transform 0.2s',
                  }}
                >
                  {/* Color top bar */}
                  <div style={{ height: '4px', background: color }} />

                  <div style={{ padding: '20px' }}>
                    {/* Type + virtual badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      {opp.opportunity_type && (
                        <span style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: color,
                        }}>
                          {opp.opportunity_type}
                        </span>
                      )}
                      {opp.is_virtual && (
                        <span style={{
                          display: 'inline-block',
                          fontSize: '9px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: '#DBEAFE',
                          color: '#1D4ED8',
                        }}>
                          Virtual
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3
                      className="font-serif"
                      style={{
                        fontSize: '15px',
                        fontWeight: 600,
                        color: '#1A1A1A',
                        lineHeight: 1.4,
                        marginBottom: '6px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical' as const,
                        overflow: 'hidden',
                      }}
                    >
                      {opp.title}
                    </h3>

                    {/* Description */}
                    {opp.description_5th_grade && (
                      <p style={{
                        fontSize: '13px',
                        color: '#6B6560',
                        lineHeight: 1.5,
                        marginBottom: '8px',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical' as const,
                        overflow: 'hidden',
                      }}>
                        {opp.description_5th_grade}
                      </p>
                    )}

                    {/* City */}
                    {opp.city && (
                      <span style={{ fontSize: '11px', fontWeight: 500, color: '#9B9590' }}>
                        {opp.city}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {(!opportunities || opportunities.length === 0) && (
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2DDD5',
              borderRadius: '0.75rem',
              padding: '48px',
              textAlign: 'center',
            }}>
              <p style={{ color: '#6B6560', fontSize: '15px' }}>
                Opportunity listings are being compiled. Check back soon.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Responsive styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (min-width: 640px) {
          .opp-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (min-width: 1024px) {
          .opp-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
        .opp-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          transform: translateY(-2px);
        }
      `}} />
    </div>
  )
}
