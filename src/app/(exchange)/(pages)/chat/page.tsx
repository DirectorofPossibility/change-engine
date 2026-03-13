import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { LibraryChat } from '@/components/exchange/LibraryChat'

export const revalidate = 300


export const metadata: Metadata = {
  title: 'Chat with Chance | Change Engine',
  description: 'Ask Chance about anything in Houston -- community resources, services, organizations, elected officials, policies, and more.',
}

export default function ChatPage() {
  return (
    <div className="bg-paper min-h-screen">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-paper">
        <div className="absolute right-[-60px] top-[-20px]">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="relative z-10 max-w-[900px] mx-auto px-6 py-10">
          <p style={{ color: "#5c6474" }} className="text-[11px] uppercase tracking-[0.15em] mb-1">changeengine.us</p>
          <h1 style={{  }} className="text-2xl sm:text-3xl mt-2">
            Chat with Chance
          </h1>
          <p style={{ color: "#5c6474" }} className="text-base mt-2">
            Your neighborhood guide to everything Houston. Ask about services, organizations, officials, policies, community research, and more.
          </p>
        </div>
        <div style={{ height: 1, background: '#dde1e8' }} />
      </section>

      {/* ── Breadcrumb ── */}
      <div className="max-w-[900px] mx-auto px-6 pt-4">
        <nav style={{ color: "#5c6474" }} className="text-[11px] tracking-wide">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-1">/</span>
          <span style={{  }}>Chat with Chance</span>
        </nav>
      </div>

      <div className="max-w-[900px] mx-auto px-6 py-8">
        <LibraryChat />
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
