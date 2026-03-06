import { getServices } from '@/lib/data/exchange'
import Link from 'next/link'

export const revalidate = 600

export const metadata = {
  title: 'Services — Community Exchange',
}

export default async function ServicesPage() {
  const services = await getServices()

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
            <span style={{ color: 'rgba(255,255,255,0.8)' }}>Services</span>
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
            Services
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
            Community support and assistance available across Houston
          </p>

          {/* Intro text */}
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)', maxWidth: '720px', lineHeight: 1.6 }}>
            Find help and support services available in our community. From housing
            assistance to health programs, discover resources that can make a difference.
          </p>
        </div>
      </section>

      {/* Body */}
      <section style={{ background: '#FAF8F5', padding: '40px 32px 64px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {services && services.length > 0 ? (
            <div className="svc-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '20px' }}>
              {services.map((svc: any) => (
                <Link
                  key={svc.service_id}
                  href={`/design2/services/${svc.service_id}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div className="svc-card" style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2DDD5',
                    borderRadius: '0.75rem',
                    overflow: 'hidden',
                    transition: 'box-shadow 0.2s, transform 0.2s',
                  }}>
                    {/* Color top bar */}
                    <div style={{ height: '4px', background: '#C75B2A' }} />

                    <div style={{ padding: '20px' }}>
                      {/* Type label */}
                      <span style={{
                        display: 'inline-block',
                        fontSize: '9px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: '#C75B2A',
                        marginBottom: '8px',
                      }}>
                        Service
                      </span>

                      {/* Title */}
                      <h2
                        className="font-serif"
                        style={{
                          fontSize: '15px',
                          fontWeight: 700,
                          color: '#1A1A1A',
                          marginBottom: '4px',
                          lineHeight: 1.4,
                        }}
                      >
                        {svc.service_name}
                      </h2>

                      {/* Org name subtitle */}
                      {svc.org_name && (
                        <p style={{
                          fontSize: '13px',
                          fontStyle: 'italic',
                          color: '#6B6560',
                          marginBottom: '8px',
                        }}>
                          {svc.org_name}
                        </p>
                      )}

                      {/* Description */}
                      {svc.description_5th_grade && (
                        <p style={{
                          fontSize: '13px',
                          color: '#6B6560',
                          lineHeight: 1.5,
                          marginBottom: '10px',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical' as const,
                          overflow: 'hidden',
                        }}>
                          {svc.description_5th_grade}
                        </p>
                      )}

                      {/* Eligibility badge */}
                      {svc.eligibility && (
                        <span style={{
                          display: 'inline-block',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#5B21B6',
                          background: '#F5F0FF',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          border: '1px solid #E9DFFC',
                        }}>
                          {svc.eligibility}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2DDD5',
              borderRadius: '0.75rem',
              padding: '48px',
              textAlign: 'center',
            }}>
              <p className="font-serif" style={{ fontSize: '18px', color: '#1A1A1A', marginBottom: '8px' }}>
                Service listings are being updated.
              </p>
              <p style={{ color: '#6B6560', fontSize: '15px' }}>Check back soon.</p>
            </div>
          )}
        </div>
      </section>

      {/* Responsive styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (min-width: 640px) {
          .svc-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (min-width: 1024px) {
          .svc-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
        .svc-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          transform: translateY(-2px);
        }
      `}} />
    </div>
  )
}
