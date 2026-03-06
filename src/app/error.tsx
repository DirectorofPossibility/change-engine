'use client'

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: '#F8F9FB' }}>
      <div style={{ textAlign: 'center', maxWidth: '28rem' }}>
        <p style={{ fontSize: '3rem', fontWeight: 'bold', color: '#E8723A', marginBottom: '1rem' }}>Oops</p>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1A1A1A', marginBottom: '0.75rem' }}>Something went wrong</h1>
        <p style={{ color: '#6C7380', marginBottom: '2rem', fontSize: '0.875rem' }}>
          We hit a snag loading this page. Please try again.
        </p>
        <button
          onClick={reset}
          style={{ background: '#E8723A', color: 'white', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}
        >
          Try again
        </button>
      </div>
    </div>
  )
}
