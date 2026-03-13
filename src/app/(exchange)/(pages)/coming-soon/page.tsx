import Link from 'next/link'
import Image from 'next/image'

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

export const metadata = {
  title: 'Coming Soon -- The Change Engine',
  description: 'This feature is coming soon to The Change Engine.',
}

export default function ComingSoonPage() {
  return (
    <div style={{ background: PARCHMENT }} className="min-h-screen">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden" style={{ background: PARCHMENT_WARM }}>
        <div className="absolute right-[-60px] top-[-20px]">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="relative z-10 max-w-[900px] mx-auto px-6 py-10">
          <p style={{ fontFamily: MONO, color: MUTED }} className="text-[11px] uppercase tracking-[0.15em] mb-1">changeengine.us</p>
          <h1 style={{ fontFamily: SERIF, color: INK }} className="text-2xl sm:text-3xl mt-2">Coming Soon</h1>
          <p style={{ fontFamily: SERIF, color: MUTED }} className="text-base mt-2">
            We&apos;re building something great for the Houston community.
          </p>
        </div>
        <div style={{ height: 1, background: RULE_COLOR }} />
      </section>

      <div className="max-w-[900px] mx-auto px-6 py-16">
        <div className="max-w-md mx-auto text-center">
          <p style={{ fontFamily: SERIF, color: MUTED }} className="mb-2">
            This feature will be available in an upcoming update.
          </p>
          <p style={{ fontFamily: MONO, color: MUTED }} className="text-sm mb-8">
            In the meantime, explore what&apos;s already live -- there&apos;s
            plenty to discover.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/compass"
              className="flex items-center gap-2 px-5 py-2.5 text-white text-sm"
              style={{ fontFamily: MONO, background: CLAY }}
            >
              &larr; Back to Compass
            </Link>
            <Link
              href="/search"
              className="flex items-center gap-2 px-5 py-2.5 text-sm"
              style={{ fontFamily: MONO, color: INK, border: '1px solid ' + RULE_COLOR }}
            >
              Search the platform
            </Link>
          </div>
          <div className="mt-8 flex items-center justify-center gap-2" style={{ fontFamily: MONO, color: MUTED }} >
            <span className="text-xs">Updates roll out regularly -- check back soon</span>
          </div>
        </div>
      </div>

      {/* ── Footer link ── */}
      <div className="max-w-[900px] mx-auto px-6 pb-10">
        <div style={{ borderTop: '1px solid ' + RULE_COLOR }} className="pt-4">
          <Link href="/" style={{ fontFamily: MONO, color: CLAY }} className="text-sm hover:underline">&larr; Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
