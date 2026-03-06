import { getServices } from '@/lib/data/exchange';
import Link from 'next/link';

export const revalidate = 600;

export const metadata = {
  title: 'Services — Community Exchange',
};

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <div style={{ backgroundColor: '#F0EAE0', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ padding: '3rem 1.5rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <Link
          href="/design2"
          style={{
            display: 'inline-block',
            marginBottom: '1.5rem',
            color: '#C75B2A',
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          &larr; Back to Design Hub
        </Link>
        <div
          style={{
            width: '4rem',
            height: '4px',
            backgroundColor: '#C75B2A',
            borderRadius: '2px',
            marginBottom: '1rem',
          }}
        />
        <h1
          style={{
            fontFamily: '"DM Serif Display", serif',
            fontSize: '2.25rem',
            color: '#1A1A1A',
            marginBottom: '0.75rem',
          }}
        >
          Services
        </h1>
        <p style={{ color: '#6B6560', fontSize: '1.05rem', maxWidth: '640px', lineHeight: 1.6 }}>
          Find help and support services available in our community. From housing assistance to
          health programs, discover resources that can make a difference.
        </p>
      </div>

      {/* Grid */}
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1.5rem 3rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(1, 1fr)',
          gap: '1.25rem',
        }}
        className="svc-grid"
      >
        {services && services.length > 0 ? (
          services.map((svc: any) => (
            <Link
              key={svc.service_id}
              href={`/services/${svc.service_id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #D4CCBE',
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                  transition: 'box-shadow 0.2s, transform 0.2s',
                }}
                className="svc-card"
              >
                <h2
                  style={{
                    fontFamily: '"DM Serif Display", serif',
                    fontSize: '1.1rem',
                    color: '#1A1A1A',
                    marginBottom: '0.3rem',
                  }}
                >
                  {svc.service_name}
                </h2>

                {svc.org_name && (
                  <p
                    style={{
                      fontSize: '0.8rem',
                      color: '#C75B2A',
                      fontWeight: 600,
                      marginBottom: '0.5rem',
                    }}
                  >
                    {svc.org_name}
                  </p>
                )}

                {svc.description_5th_grade && (
                  <p
                    style={{
                      fontSize: '0.875rem',
                      color: '#6B6560',
                      lineHeight: 1.5,
                      marginBottom: '0.5rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {svc.description_5th_grade}
                  </p>
                )}

                {svc.eligibility && (
                  <span
                    style={{
                      display: 'inline-block',
                      fontSize: '0.75rem',
                      color: '#805ad5',
                      backgroundColor: '#F5F0FF',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '0.375rem',
                      fontWeight: 500,
                      border: '1px solid #E9DFFC',
                    }}
                  >
                    {svc.eligibility}
                  </span>
                )}
              </div>
            </Link>
          ))
        ) : (
          <div
            style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '3rem 1rem',
              backgroundColor: '#FFFFFF',
              borderRadius: '0.75rem',
              border: '1px solid #D4CCBE',
            }}
          >
            <p
              style={{
                fontFamily: '"DM Serif Display", serif',
                fontSize: '1.25rem',
                color: '#1A1A1A',
                marginBottom: '0.5rem',
              }}
            >
              Service listings are being updated.
            </p>
            <p style={{ color: '#6B6560', fontSize: '0.95rem' }}>Check back soon.</p>
          </div>
        )}
      </div>

      {/* Responsive styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
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
          `,
        }}
      />
    </div>
  );
}
