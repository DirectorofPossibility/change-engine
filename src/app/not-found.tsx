import Link from 'next/link'

export default function RootNotFound() {
  return (
    <html lang="en">
      <body style={{ background: '#F5F1EB', margin: 0 }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ textAlign: 'center', maxWidth: '28rem' }}>
            <p style={{ fontSize: '4rem', fontWeight: 'bold', color: '#C75B2A', marginBottom: '1rem' }}>404</p>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2C2C2C', marginBottom: '0.75rem' }}>Page Not Found</h1>
            <p style={{ color: '#8B7E74', marginBottom: '2rem' }}>
              We couldn&apos;t find what you&apos;re looking for.
            </p>
            <Link href="/" style={{ color: '#C75B2A', textDecoration: 'underline' }}>
              Go to homepage
            </Link>
          </div>
        </div>
      </body>
    </html>
  )
}
