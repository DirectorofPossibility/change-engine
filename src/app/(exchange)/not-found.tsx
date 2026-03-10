import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-6xl font-bold text-brand-accent mb-4">404</p>
        <h1 className="text-2xl font-bold text-brand-text mb-3">Page Not Found</h1>
        <p className="text-brand-muted mb-8">
          We couldn&apos;t find what you&apos;re looking for. Here are some places to start:
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/help" className="px-4 py-2 bg-brand-accent text-white rounded-lg text-sm hover:opacity-90 transition-opacity">
            Available Resources
          </Link>
          <Link href="/services" className="px-4 py-2 bg-white border border-brand-border rounded-lg text-sm text-brand-text hover:bg-brand-bg transition-colors">
            Find Services
          </Link>
          <Link href="/pathways" className="px-4 py-2 bg-white border border-brand-border rounded-lg text-sm text-brand-text hover:bg-brand-bg transition-colors">
            Browse Pathways
          </Link>
          <Link href="/officials/lookup" className="px-4 py-2 bg-white border border-brand-border rounded-lg text-sm text-brand-text hover:bg-brand-bg transition-colors">
            Find My Reps
          </Link>
        </div>
        <div className="mt-8">
          <Link href="/" className="text-sm text-brand-accent hover:underline">
            &larr; Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
