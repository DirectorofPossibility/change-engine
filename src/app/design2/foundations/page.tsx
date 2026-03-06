import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 600
export const metadata: Metadata = { title: 'Foundations — Community Exchange' }

export default async function FoundationsPage() {
  const supabase = await createClient()
  const { data: foundations } = await supabase
    .from('foundations')
    .select('foundation_id, foundation_name, description, website, ein, total_giving, total_assets, city, state')
    .order('foundation_name')

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
            <span style={{ color: 'rgba(255,255,255,0.8)' }}>Foundations</span>
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
            Foundations
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
            Philanthropic organizations investing in Houston communities
          </p>

          {/* Intro text */}
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)', maxWidth: '720px', lineHeight: 1.6 }}>
            Discover the foundations and philanthropic organizations shaping Houston through
            their priorities, funding, and impact.
          </p>
        </div>
      </section>

      {/* Body */}
      <section style={{ background: '#FAF8F5', padding: '40px 32px 64px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="fnd-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '20px' }}>
            {(foundations || []).map(function (f: any) {
              const initial = (f.foundation_name || '?').charAt(0).toUpperCase()
              return (
                <div
                  key={f.foundation_id}
                  className="fnd-card"
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2DDD5',
                    borderRadius: '0.75rem',
                    overflow: 'hidden',
                    transition: 'box-shadow 0.2s, transform 0.2s',
                  }}
                >
                  {/* Color top bar */}
                  <div style={{ height: '4px', background: '#C75B2A' }} />

                  <div style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                      {/* Initial square */}
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '0.5rem',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: '"DM Serif Display", serif',
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: '#FFFFFF',
                        background: '#C75B2A',
                      }}>
                        {initial}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Type label */}
                        <span style={{
                          display: 'inline-block',
                          fontSize: '9px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: '#9B9590',
                          marginBottom: '2px',
                        }}>
                          Foundation
                        </span>

                        <h3
                          className="font-serif"
                          style={{
                            fontSize: '15px',
                            fontWeight: 600,
                            color: '#1A1A1A',
                            lineHeight: 1.4,
                          }}
                        >
                          {f.foundation_name}
                        </h3>

                        {f.city && (
                          <span style={{
                            fontSize: '11px',
                            fontStyle: 'italic',
                            color: '#9B9590',
                          }}>
                            {f.city}{f.state ? ', ' + f.state : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    {f.description && (
                      <p style={{
                        fontSize: '13px',
                        color: '#6B6560',
                        lineHeight: 1.5,
                        marginTop: '12px',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical' as const,
                        overflow: 'hidden',
                      }}>
                        {f.description}
                      </p>
                    )}

                    {/* Giving + website */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                      {f.total_giving && (
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#047857' }}>
                          ${(Number(f.total_giving) / 1000000).toFixed(1)}M giving
                        </span>
                      )}
                      {f.total_assets && (
                        <span style={{ fontSize: '11px', color: '#9B9590' }}>
                          ${(Number(f.total_assets) / 1000000).toFixed(1)}M assets
                        </span>
                      )}
                      {f.website && (
                        <a
                          href={f.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: '11px', fontWeight: 600, color: '#C75B2A', textDecoration: 'none' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          Website
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {(!foundations || foundations.length === 0) && (
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2DDD5',
              borderRadius: '0.75rem',
              padding: '48px',
              textAlign: 'center',
            }}>
              <p style={{ color: '#6B6560', fontSize: '15px' }}>
                Foundation data is being compiled. Check back soon.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Responsive styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (min-width: 640px) {
          .fnd-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (min-width: 1024px) {
          .fnd-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
        .fnd-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          transform: translateY(-2px);
        }
      `}} />
    </div>
  )
}
