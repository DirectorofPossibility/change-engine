'use client'

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: '#F5F1EB' }}>
      <div style={{ textAlign: 'center', maxWidth: '28rem' }}>
        <p style={{ fontSize: '3rem', fontWeight: 'bold', color: '#C75B2A', marginBottom: '1rem' }}>Oops</p>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#2C2C2C', marginBottom: '0.75rem' }}>Something went wrong</h1>
        <p style={{ color: '#8B7E74', marginBottom: '2rem', fontSize: '0.875rem' }}>
          We hit a snag loading this page. Please try again.
        </p>
        <button
          onClick={reset}
          style={{ background: '#C75B2A', color: 'white', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}
        >
          Try again
        </button>
      </div>
    </div>
  )
}
