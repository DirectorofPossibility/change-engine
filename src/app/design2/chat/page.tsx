import type { Metadata } from 'next'
import Link from 'next/link'
import { ChanceChatWidget } from '@/components/exchange/ChanceChatWidget'

export const metadata: Metadata = { title: 'Ask Chance — Community Exchange' }

export default function ChatPage() {
  return (
    <div style={{ background: '#F0EAE0' }}>
      <div className="max-w-[800px] mx-auto px-8 py-8">
        <Link href="/design2" className="text-[13px] font-semibold mb-4 inline-block" style={{ color: '#6B6560' }}>← Home</Link>
        <div className="mb-8">
          <h1 className="font-serif text-4xl mb-3" style={{ color: '#1a1a1a' }}>Ask Chance</h1>
          <p className="text-[15px]" style={{ color: '#6B6560' }}>Your AI civic assistant. Ask about services, policies, organizations, or anything happening in Houston.</p>
          <div className="h-1 w-16 rounded-full mt-4" style={{ background: '#C75B2A' }} />
        </div>
        <div className="bg-white rounded-2xl border-2 p-8 text-center" style={{ borderColor: '#1a1a1a', boxShadow: '3px 3px 0 #1a1a1a' }}>
          <p className="text-lg font-serif mb-4" style={{ color: '#1a1a1a' }}>Chat with Chance is available in the bottom-right corner.</p>
          <p className="text-[14px]" style={{ color: '#6B6560' }}>Try asking: &quot;What services are near 77004?&quot; or &quot;Who represents me?&quot;</p>
        </div>
      </div>
    </div>
  )
}
