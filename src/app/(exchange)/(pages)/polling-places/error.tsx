'use client'

import Link from 'next/link'

export default function PollingPlacesError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-5xl font-bold text-muted mb-4">Polling Places</p>
        <h1 className="text-2xl font-bold text-ink mb-3">Unable to load polling locations</h1>
        <p className="text-muted mb-6">
          We ran into a problem loading polling place data. Try again or check your voter registration directly.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-blue text-white font-mono text-micro uppercase tracking-wider font-semibold hover:opacity-90 transition-opacity"
          >
            Try again
          </button>
          <Link href="/elections" className="px-5 py-2.5 border border-rule font-mono text-micro uppercase tracking-wider font-semibold text-ink hover:bg-faint transition-colors">
            Elections Hub
          </Link>
        </div>
      </div>
    </div>
  )
}
