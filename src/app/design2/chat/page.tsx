'use client'

import Link from 'next/link'
import { LibraryChat } from '@/components/exchange/LibraryChat'

export default function ChatPage() {
  return (
    <div>
      {/* Dark editorial hero */}
      <section style={{ background: '#2C2418' }}>
        <div className="max-w-[1152px] mx-auto px-8 py-10 pb-12">
          <div className="text-[13px] mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <Link href="/design2" className="hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.5)' }}>Home</Link>
            <span className="mx-2" style={{ color: '#C75B2A' }}>&rsaquo;</span>
            <span style={{ color: 'white' }}>Ask Chance</span>
          </div>
          <div className="h-[2px] w-10 mb-5" style={{ background: '#C75B2A' }} />
          <h1 className="font-serif text-[clamp(1.75rem,4vw,2.5rem)]" style={{ color: 'white' }}>Ask Chance</h1>
          <p className="font-serif text-[18px] italic mt-2" style={{ color: 'rgba(255,255,255,0.6)' }}>Your AI civic assistant</p>
          <p className="text-[16px] mt-4 max-w-[720px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Ask about services, policies, organizations, or anything happening in Houston.
          </p>
        </div>
      </section>

      <div className="max-w-[800px] mx-auto px-8 py-12" style={{ background: '#FAF8F5' }}>
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#E2DDD5', height: '600px' }}>
          <LibraryChat />
        </div>
        <p className="text-[12px] mt-3 text-center" style={{ color: '#9B9590' }}>
          Try asking: &quot;What services are near 77004?&quot; or &quot;Who represents me?&quot;
        </p>
      </div>
    </div>
  )
}
