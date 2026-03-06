import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 300
export const metadata: Metadata = { title: 'Policies — Community Exchange' }

export default async function PoliciesPage() {
  const supabase = await createClient()
  const { data: policies } = await supabase
    .from('policies')
    .select('policy_id, policy_name, title_6th_grade, summary_6th_grade, bill_number, status, government_level, introduced_date')
    .order('introduced_date', { ascending: false })
    .limit(60)

  function levelColor(level: string | null): string {
    switch (level) {
      case 'Federal': return '#1D4ED8'
      case 'State': return '#B45309'
      case 'County': return '#047857'
      case 'City': return '#7C3AED'
      default: return '#6B6560'
    }
  }

  function levelBg(level: string | null): string {
    switch (level) {
      case 'Federal': return '#DBEAFE'
      case 'State': return '#FEF3C7'
      case 'County': return '#D1FAE5'
      case 'City': return '#EDE9FE'
      default: return '#F3F0EB'
    }
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
            <span style={{ color: 'rgba(255,255,255,0.8)' }}>Policies</span>
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
            Policies
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
            Legislation and policy decisions that shape our community
          </p>

          {/* Intro text */}
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)', maxWidth: '720px', lineHeight: 1.6 }}>
            Legislation, ordinances, and policy decisions at every level of government — explained in plain language.
          </p>
        </div>
      </section>

      {/* Body */}
      <section style={{ background: '#FAF8F5', padding: '40px 32px 64px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="pol-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '20px' }}>
            {(policies || []).map(function (p: any) {
              const color = levelColor(p.government_level)
              const bg = levelBg(p.government_level)
              return (
                <Link
                  key={p.policy_id}
                  href={'/design2/policies/' + p.policy_id}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div className="pol-card" style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2DDD5',
                    borderRadius: '0.75rem',
                    overflow: 'hidden',
                    transition: 'box-shadow 0.2s, transform 0.2s',
                  }}>
                    {/* Color top bar */}
                    <div style={{ height: '4px', background: color }} />

                    <div style={{ padding: '20px' }}>
                      {/* Level + bill number */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '9px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: color,
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, display: 'inline-block' }} />
                          {p.government_level || 'Policy'}
                        </span>
                        {p.bill_number && (
                          <span style={{ fontSize: '11px', fontWeight: 500, color: '#9B9590' }}>
                            {p.bill_number}
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
                        {p.title_6th_grade || p.policy_name}
                      </h3>

                      {/* Summary */}
                      {p.summary_6th_grade && (
                        <p style={{
                          fontSize: '13px',
                          color: '#6B6560',
                          lineHeight: 1.5,
                          marginBottom: '12px',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical' as const,
                          overflow: 'hidden',
                        }}>
                          {p.summary_6th_grade}
                        </p>
                      )}

                      {/* Status + date */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {p.status && (
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: bg,
                            color: color,
                          }}>
                            {p.status}
                          </span>
                        )}
                        {p.introduced_date && (
                          <span style={{ fontSize: '11px', color: '#9B9590' }}>
                            {new Date(p.introduced_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {(!policies || policies.length === 0) && (
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2DDD5',
              borderRadius: '0.75rem',
              padding: '48px',
              textAlign: 'center',
            }}>
              <p style={{ color: '#6B6560', fontSize: '15px' }}>
                Policy listings are being updated. Check back soon.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Responsive styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (min-width: 768px) {
          .pol-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        .pol-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          transform: translateY(-2px);
        }
      `}} />
    </div>
  )
}
