import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { SenatorToolClient } from './SenatorToolClient'

export const revalidate = 3600


export const metadata: Metadata = {
  title: 'Call Your Senators — Change Engine',
  description: 'Two minutes. One call. Your senators have staff whose only job is to count opinions like yours.',
}

export default function CallYourSenatorsPage() {
  return (
    <div className="bg-paper min-h-screen">
      {/* Hero */}
      <div className="bg-paper relative overflow-hidden border-b">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="max-w-[900px] mx-auto px-6 py-12 relative">
          <p style={{ color: "#5c6474", fontSize: 11, letterSpacing: '0.12em' }} className="uppercase mb-3">
            The Change Engine
          </p>
          <h1 style={{  }} className="text-3xl sm:text-4xl mb-3">
            Call Your Senators
          </h1>
          <p style={{ color: "#5c6474", fontSize: 17 }} className="max-w-[600px] leading-relaxed">
            Two minutes. One call. Your senators have staff whose only job is to count opinions like yours.
          </p>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-4 pb-2">
        <nav style={{ fontSize: 11, color: "#5c6474", letterSpacing: '0.06em' }} className="uppercase">
          <Link href="/elections" className="hover:underline" style={{ color: "#1b5e8a" }}>Elections</Link>
          <span className="mx-2">/</span>
          <span>Call Your Senators</span>
        </nav>
      </div>

      {/* Main Content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">
        <SenatorToolClient />

        {/* Footer link */}
        <div className="my-10" style={{ height: 1, background: '#dde1e8' }} />
        <div className="text-center pb-12">
          <Link href="/elections" style={{ color: "#1b5e8a", fontSize: 12, letterSpacing: '0.06em' }} className="uppercase hover:underline">
            Back to Elections
          </Link>
        </div>
      </div>
    </div>
  )
}
