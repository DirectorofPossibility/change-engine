import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'


export const metadata: Metadata = {
  title: 'Account Paused',
  description: 'Your account has been paused.',
}

export default function AccountLockedPage() {
  return (
    <div className="bg-paper min-h-screen">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-paper">
        <div className="absolute right-[-60px] top-[-20px]">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="relative z-10 max-w-[900px] mx-auto px-6 py-10">
          <p style={{ color: "#5c6474" }} className="text-[11px] uppercase tracking-[0.15em] mb-1">changeengine.us</p>
          <h1 style={{  }} className="text-2xl sm:text-3xl mt-2">Account Paused</h1>
        </div>
        <div style={{ height: 1, background: '#dde1e8' }} />
      </section>

      <div className="max-w-[900px] mx-auto px-6 py-16">
        <div className="max-w-lg mx-auto text-center p-8" style={{ border: '1px solid #dde1e8' }}>
          <p style={{ color: "#5c6474" }} className="mb-6">
            Your account has been paused. If you believe this is an error, please
            contact our support team for assistance.
          </p>
          <Link
            href="mailto:hello@thechangelab.net"
            className="inline-block px-6 py-2 text-white text-sm"
            style={{ background: '#1b5e8a' }}
          >
            Contact Support
          </Link>
        </div>
      </div>

      {/* ── Footer link ── */}
      <div className="max-w-[900px] mx-auto px-6 pb-10">
        <div style={{ borderTop: '1px solid #dde1e8' }} className="pt-4">
          <Link href="/" style={{ color: "#1b5e8a" }} className="text-sm hover:underline">&larr; Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
