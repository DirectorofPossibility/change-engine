/**
 * Shared OG image styles and helpers.
 * Used by opengraph-image.tsx routes.
 */

export const OG_SIZE = { width: 1200, height: 630 }

export const BRAND = {
  accent: '#1b5e8a',
  bg: '#0d1117',
  cream: '#f4f5f7',
  muted: '#5c6474',
}

/** Truncate text to fit OG images */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max - 1).trimEnd() + '\u2026'
}

/** Base OG layout with brand header and footer */
export function OGLayout({ title, subtitle, label, accentColor }: {
  title: string
  subtitle?: string
  label?: string
  accentColor?: string
}) {
  const color = accentColor || BRAND.accent
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: BRAND.bg,
        fontFamily: 'sans-serif',
      }}
    >
      {/* Accent bar */}
      <div style={{ height: 6, background: color, display: 'flex' }} />

      {/* Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 80px',
      }}>
        {label && (
          <div style={{
            fontSize: 20,
            color: color,
            textTransform: 'uppercase',
            letterSpacing: 3,
            fontWeight: 700,
            marginBottom: 16,
            display: 'flex',
          }}>
            {label}
          </div>
        )}
        <div style={{
          fontSize: title.length > 60 ? 42 : 52,
          fontWeight: 700,
          color: BRAND.cream,
          lineHeight: 1.2,
          display: 'flex',
        }}>
          {truncate(title, 100)}
        </div>
        {subtitle && (
          <div style={{
            fontSize: 24,
            color: BRAND.muted,
            marginTop: 20,
            lineHeight: 1.4,
            display: 'flex',
          }}>
            {truncate(subtitle, 150)}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 80px',
        borderTop: '1px solid #333',
      }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: BRAND.cream, display: 'flex' }}>
          Change Engine
        </div>
        <div style={{ fontSize: 16, color: BRAND.muted, display: 'flex' }}>
          changeengine.us
        </div>
      </div>
    </div>
  )
}
