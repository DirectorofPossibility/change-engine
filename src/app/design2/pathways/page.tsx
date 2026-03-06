import type { Metadata } from 'next'
import Link from 'next/link'
import { THEMES } from '@/lib/constants'
import { getPathwayCounts } from '@/lib/data/exchange'
import { FlowerOfLifeIcon } from '@/components/exchange/FlowerIcons'

export const revalidate = 600
export const metadata: Metadata = { title: 'Pathways — Community Exchange' }

const THEME_LIST = Object.entries(THEMES).map(function ([id, t]) { return { id, ...t } })

export default async function PathwaysPage() {
  const counts = await getPathwayCounts()

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
            <span style={{ color: 'rgba(255,255,255,0.8)' }}>Pathways</span>
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
            Pathways
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
            Seven lenses organizing everything in the Community Exchange
          </p>

          {/* Intro text */}
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)', maxWidth: '720px', lineHeight: 1.6 }}>
            Seven pathways organize everything in the Community Exchange — resources, services,
            officials, and policies — around the topics that matter most.
          </p>
        </div>
      </section>

      {/* Body */}
      <section style={{ background: '#FAF8F5', padding: '40px 32px 64px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="pth-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '24px' }}>
            {THEME_LIST.map(function (t) {
              const count = counts[t.id] || 0
              return (
                <Link
                  key={t.id}
                  href={'/design2/pathways/' + t.slug}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div className="pth-card" style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2DDD5',
                    borderRadius: '0.75rem',
                    overflow: 'hidden',
                    position: 'relative',
                    transition: 'box-shadow 0.2s, transform 0.2s',
                  }}>
                    {/* Color top bar */}
                    <div style={{ height: '6px', background: t.color }} />

                    {/* Watermark icon */}
                    <div style={{
                      position: 'absolute',
                      top: '-16px',
                      right: '-16px',
                      opacity: 0.04,
                    }}>
                      <FlowerOfLifeIcon size={140} color={t.color} />
                    </div>

                    <div style={{ padding: '24px', position: 'relative', zIndex: 1 }}>
                      {/* Dot + name */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <span style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: t.color,
                          display: 'inline-block',
                          flexShrink: 0,
                        }} />
                        <h2
                          className="font-serif"
                          style={{
                            fontSize: '18px',
                            fontWeight: 700,
                            color: '#1A1A1A',
                          }}
                        >
                          {t.name}
                        </h2>
                      </div>

                      {/* Description */}
                      <p style={{
                        fontSize: '13px',
                        color: '#6B6560',
                        lineHeight: 1.6,
                        marginBottom: '12px',
                      }}>
                        {count} resources, services, and policies connected to this pathway.
                      </p>

                      {/* Explore link */}
                      <span style={{
                        display: 'inline-block',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: t.color,
                      }}>
                        Explore &rarr;
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Responsive styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (min-width: 640px) {
          .pth-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (min-width: 1024px) {
          .pth-grid { grid-template-columns: repeat(4, 1fr) !important; }
        }
        .pth-card:hover {
          box-shadow: 0 6px 16px rgba(0,0,0,0.1);
          transform: translateY(-3px);
        }
      `}} />
    </div>
  )
}
