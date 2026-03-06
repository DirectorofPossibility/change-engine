import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export const revalidate = 600;

export const metadata = {
  title: 'Organizations — Community Exchange',
};

export default async function OrganizationsPage() {
  const supabase = await createClient();

  const { data: orgs } = await supabase
    .from('organizations')
    .select('org_id, org_name, description_5th_grade, logo_url, website, city, state')
    .order('org_name');

  return (
    <div style={{ backgroundColor: '#F0EAE0', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ padding: '3rem 1.5rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <Link
          href="/design2"
          style={{
            display: 'inline-block',
            marginBottom: '1.5rem',
            color: '#805ad5',
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
            backgroundColor: '#805ad5',
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
          Organizations
        </h1>
        <p style={{ color: '#6B6560', fontSize: '1.05rem', maxWidth: '640px', lineHeight: 1.6 }}>
          Explore the organizations working across Houston to strengthen communities, expand
          opportunity, and drive lasting change.
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
        className="org-grid"
      >
        {orgs && orgs.length > 0 ? (
          orgs.map((org) => {
            const initial = (org.org_name || '?').charAt(0).toUpperCase();
            return (
              <Link
                key={org.org_id}
                href={`/organizations/${org.org_id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #D4CCBE',
                    borderRadius: '0.75rem',
                    padding: '1.25rem',
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'flex-start',
                    transition: 'box-shadow 0.2s, transform 0.2s',
                  }}
                  className="org-card"
                >
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
                        border: '1px solid #D4CCBE',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '0.5rem',
                        backgroundColor: '#805ad5',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: '"DM Serif Display", serif',
                        fontSize: '1.5rem',
                        flexShrink: 0,
                      }}
                    >
                      {initial}
                    </div>
                  )}

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2
                      style={{
                        fontFamily: '"DM Serif Display", serif',
                        fontSize: '1.1rem',
                        color: '#1A1A1A',
                        marginBottom: '0.35rem',
                      }}
                    >
                      {org.org_name}
                    </h2>
                    {org.description_5th_grade && (
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
                        {org.description_5th_grade}
                      </p>
                    )}
                    {org.city && (
                      <span style={{ fontSize: '0.8rem', color: '#9B9590' }}>
                        {org.city}
                        {org.state ? `, ${org.state}` : ''}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <p style={{ color: '#6B6560', fontSize: '1rem', gridColumn: '1 / -1' }}>
            Organization listings are being updated. Check back soon.
          </p>
        )}
      </div>

      {/* Responsive styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
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
          `,
        }}
      />
    </div>
  );
}
