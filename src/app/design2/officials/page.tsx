import type { Metadata } from 'next'
import Link from 'next/link'
import { getOfficials } from '@/lib/data/exchange'
import Image from 'next/image'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Officials — Community Exchange',
  description: 'Elected officials serving the Houston community at every level of government.',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function levelBadgeStyle(level: string): { bg: string; color: string } {
  switch (level) {
    case 'Federal':
      return { bg: '#DBEAFE', color: '#1E40AF' }
    case 'State':
      return { bg: '#FEF3C7', color: '#92400E' }
    case 'County':
      return { bg: '#D1FAE5', color: '#065F46' }
    case 'City':
      return { bg: '#EDE9FE', color: '#5B21B6' }
    default:
      return { bg: '#F3F0EB', color: '#6B6560' }
  }
}

function partyBadgeStyle(party: string | null): { bg: string; color: string } {
  if (!party) return { bg: '#F3F0EB', color: '#6B6560' }
  const p = party.toLowerCase()
  if (p.includes('democrat')) return { bg: '#DBEAFE', color: '#1D4ED8' }
  if (p.includes('republican')) return { bg: '#FEE2E2', color: '#B91C1C' }
  return { bg: '#F3F0EB', color: '#6B6560' }
}

function initialsCircleBg(level: string): string {
  switch (level) {
    case 'Federal': return '#3B82F6'
    case 'State': return '#F59E0B'
    case 'County': return '#10B981'
    case 'City': return '#8B5CF6'
    default: return '#9B9590'
  }
}

export default async function OfficialsPage() {
  const { officials } = await getOfficials()

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Dark Editorial Hero */}
      <section style={{ background: '#1a1a2e', padding: '40px 32px 48px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Breadcrumb */}
          <nav style={{ marginBottom: '24px', fontSize: '13px' }}>
            <Link href="/design2" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>
              Home
            </Link>
            <span style={{ color: '#C75B2A', margin: '0 8px' }}>/</span>
            <span style={{ color: 'rgba(255,255,255,0.8)' }}>Officials</span>
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
            Officials
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
            {officials.length} elected officials tracked across every level of government
          </p>

          {/* Intro text */}
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)', maxWidth: '720px', lineHeight: 1.6 }}>
            The people who represent our community at every level of government.
            Learn who they are, what they stand for, and how to reach them.
          </p>
        </div>
      </section>

      {/* Body */}
      <section style={{ background: '#FAF8F5', padding: '40px 32px 64px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="off-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '20px' }}>
            {officials.map((official: any) => {
              const level = official.level || ''
              const circBg = initialsCircleBg(level)
              const lvl = levelBadgeStyle(level)
              const pty = partyBadgeStyle(official.party)

              return (
                <Link
                  key={official.official_id}
                  href={'/design2/officials/' + official.official_id}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div className="off-card" style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2DDD5',
                    borderRadius: '0.75rem',
                    padding: '20px',
                    transition: 'box-shadow 0.2s, transform 0.2s',
                  }}>
                    {/* Photo or Initials Circle */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                      {official.photo_url ? (
                        <Image
                          src={official.photo_url}
                          alt={official.official_name}
                          style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid #E2DDD5',
                          }}
                         width={80} height={80} />
                      ) : (
                        <div style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px',
                          fontWeight: 700,
                          color: '#FFFFFF',
                          background: circBg,
                        }}>
                          {getInitials(official.official_name || '')}
                        </div>
                      )}
                    </div>

                    {/* Name */}
                    <h2
                      className="font-serif"
                      style={{
                        fontSize: '16px',
                        fontWeight: 700,
                        color: '#1A1A1A',
                        textAlign: 'center',
                        marginBottom: '4px',
                      }}
                    >
                      {official.official_name}
                    </h2>

                    {/* Title */}
                    {official.title && (
                      <p style={{
                        fontSize: '13px',
                        color: '#6B6560',
                        textAlign: 'center',
                        marginBottom: '12px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical' as const,
                        overflow: 'hidden',
                      }}>
                        {official.title}
                      </p>
                    )}

                    {/* Badges */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px' }}>
                      {level && (
                        <span style={{
                          display: 'inline-block',
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: lvl.bg,
                          color: lvl.color,
                        }}>
                          {level}
                        </span>
                      )}
                      {official.party && (
                        <span style={{
                          display: 'inline-block',
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: pty.bg,
                          color: pty.color,
                        }}>
                          {official.party}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {officials.length === 0 && (
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2DDD5',
              borderRadius: '0.75rem',
              padding: '48px',
              textAlign: 'center',
            }}>
              <p style={{ color: '#6B6560', fontSize: '16px' }}>No officials found.</p>
            </div>
          )}
        </div>
      </section>

      {/* Responsive styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (min-width: 640px) {
          .off-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (min-width: 1024px) {
          .off-grid { grid-template-columns: repeat(4, 1fr) !important; }
        }
        .off-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          transform: translateY(-2px);
        }
      `}} />
    </div>
  )
}
