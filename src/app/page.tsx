import { BRAND, THEMES } from '@/lib/constants'

export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui', background: BRAND.background, minHeight: '100vh', color: BRAND.text }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{BRAND.name}</h1>
      <p style={{ color: BRAND.muted, marginBottom: '2rem' }}>{BRAND.tagline}</p>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {Object.values(THEMES).map((theme) => (
          <span
            key={theme.slug}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '9999px',
              backgroundColor: theme.color,
              color: 'white',
              fontSize: '0.875rem',
            }}
          >
            {theme.name}
          </span>
        ))}
      </div>
    </main>
  )
}
