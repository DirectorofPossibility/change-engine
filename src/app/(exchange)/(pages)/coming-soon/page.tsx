import Link from 'next/link'
import { Clock, ArrowLeft, Sparkles } from 'lucide-react'

export const metadata = {
  title: 'Coming Soon — The Change Engine',
  description: 'This feature is coming soon to The Change Engine.',
}

export default function ComingSoonPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-brand-accent/10 flex items-center justify-center mx-auto mb-6">
          <Sparkles size={28} className="text-brand-accent" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-brand-text mb-3">
          Coming Soon
        </h1>
        <p className="text-brand-muted mb-2">
          We&apos;re building something great for the Houston community.
          This feature will be available in an upcoming update.
        </p>
        <p className="text-sm text-brand-muted-light mb-8">
          In the meantime, explore what&apos;s already live — there&apos;s
          plenty to discover.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/compass"
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-accent text-white rounded-lg text-sm font-semibold hover:bg-brand-accent-hover transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Compass
          </Link>
          <Link
            href="/search"
            className="flex items-center gap-2 px-5 py-2.5 border border-brand-border rounded-lg text-sm font-medium text-brand-text hover:bg-white transition-colors"
          >
            Search the platform
          </Link>
        </div>
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-brand-muted-light">
          <Clock size={12} />
          <span>Updates roll out regularly — check back soon</span>
        </div>
      </div>
    </div>
  )
}
