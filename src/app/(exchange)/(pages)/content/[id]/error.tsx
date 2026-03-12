'use client'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-5xl font-bold text-brand-muted mb-4">Oops</p>
        <h1 className="text-2xl font-bold text-brand-text mb-3">Something went wrong</h1>
        <p className="text-brand-muted mb-8">
          We&apos;re sorry — this page ran into a problem. Please try again.
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-brand-accent text-white text-sm hover:opacity-90 transition-opacity"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
