import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const revalidate = 600

export const metadata = {
  title: 'Organizations — Community Exchange',
}

export default async function OrganizationsPage() {
  const supabase = await createClient()

  const { data: orgs } = await supabase
    .from('organizations')
    .select('org_id, org_name, description_5th_grade, logo_url, website, city, state')
    .order('org_name')

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
            <span style={{ color: 'rgba(255,255,255,0.8)' }}>Organizations</span>
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
            Organizations
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
            The groups and institutions strengthening Houston communities
          </p>

          {/* Intro text */}
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)', maxWidth: '720px', lineHeight: 1.6 }}>
            Explore the organizations working across Houston to strengthen communities,
            expand opportunity, and drive lasting change.
          </p>
        </div>
      </section>

      {/* Body */}
      <section style={{ background: '#FAF8F5', padding: '40px 32px 64px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {orgs && orgs.length > 0 ? (
            <div className="org-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '20px' }}>
              {orgs.map((org) => {
                const initial = (org.org_name || '?').charAt(0).toUpperCase()
                return (
                  <Link
                    key={org.org_id}
                    href={`/design2/organizations/${org.org_id}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div className="org-card" style={{
                      background: '#FFFFFF',
                      border: '1px solid #E2DDD5',
                      borderRadius: '0.75rem',
                      padding: '20px',
                      display: 'flex',
                      gap: '16px',
                      alignItems: 'flex-start',
                      transition: 'box-shadow 0.2s, transform 0.2s',
                    }}>
                      {/* Logo or Initial */}
                      {org.logo_url ? (
                        <img
                          src={org.logo_url}
                          alt={`${org.org_name} logo`}
                          style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '0.5rem',
                            objectFit: 'cover',
                            flexShrink: 0,
                            border: '1px solid #E2DDD5',
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '0.5rem',
                          background: '#C75B2A',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: '"DM Serif Display", serif',
                          fontSize: '1.5rem',
                          flexShrink: 0,
                        }}>
                          {initial}
                        </div>
                      )}

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Type label */}
                        <span style={{
                          display: 'inline-block',
                          fontSize: '9px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: '#9B9590',
                          marginBottom: '4px',
                        }}>
                          Organization
                        </span>

                        <h2
                          className="font-serif"
                          style={{
                            fontSize: '15px',
                            fontWeight: 700,
                            color: '#1A1A1A',
                            marginBottom: '6px',
                            lineHeight: 1.4,
                          }}
                        >
                          {org.org_name}
                        </h2>

                        {org.description_5th_grade && (
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
                            {org.description_5th_grade}
                          </p>
                        )}

                        {org.city && (
                          <span style={{ fontSize: '12px', color: '#9B9590' }}>
                            {org.city}{org.state ? `, ${org.state}` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2DDD5',
              borderRadius: '0.75rem',
              padding: '48px',
              textAlign: 'center',
            }}>
              <p style={{ color: '#6B6560', fontSize: '15px' }}>
                Organization listings are being updated. Check back soon.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Responsive styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (min-width: 640px) {
          .org-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (min-width: 1024px) {
          .org-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
        .org-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          transform: translateY(-2px);
        }
      `}} />
    </div>
  )
}
