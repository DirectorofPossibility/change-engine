import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Account Paused',
  description: 'Your account has been paused.',
}

export default function AccountLockedPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <div className="bg-white border border-brand-border p-8">
        <h1 className="text-2xl font-bold text-brand-text mb-4 font-display">Account Paused</h1>
        <p className="text-brand-muted mb-6">
          Your account has been paused. If you believe this is an error, please
          contact our support team for assistance.
        </p>
        <Link
          href="mailto:hello@thechangelab.net"
          className="inline-block bg-brand-accent text-white px-6 py-2 hover:opacity-90 transition-opacity text-sm"
        >
          Contact Support
        </Link>
      </div>
    </div>
  )
}
