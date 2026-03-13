import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const revalidate = 86400

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

export const metadata: Metadata = {
  title: 'Contact Us -- Change Engine',
  description: 'Get in touch with The Change Lab team.',
}

export default function ContactPage() {
  return (
    <div style={{ background: PARCHMENT }} className="min-h-screen">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden" style={{ background: PARCHMENT_WARM }}>
        <div className="absolute right-[-60px] top-[-20px]">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="relative z-10 max-w-[900px] mx-auto px-6 py-10">
          <p style={{ fontFamily: MONO, color: MUTED }} className="text-[11px] uppercase tracking-[0.15em] mb-1">changeengine.us</p>
          <h1 style={{ fontFamily: SERIF, color: INK }} className="text-2xl sm:text-3xl mt-2">Contact Us</h1>
          <p style={{ fontFamily: SERIF, color: MUTED }} className="text-base mt-2">
            Have a question, suggestion, or want to partner with us? We would love to hear from you.
          </p>
        </div>
        <div style={{ height: 1, background: RULE_COLOR }} />
      </section>

      {/* ── Breadcrumb ── */}
      <div className="max-w-[900px] mx-auto px-6 pt-4">
        <nav style={{ fontFamily: MONO, color: MUTED }} className="text-[11px] tracking-wide">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-1">/</span>
          <span style={{ color: INK }}>Contact</span>
        </nav>
      </div>

      <div className="max-w-[900px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-6" style={{ border: '1px solid ' + RULE_COLOR }}>
            <h2 style={{ fontFamily: MONO, color: MUTED }} className="text-sm uppercase tracking-wide mb-4">The Change Lab</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <span style={{ color: MUTED }}>Email</span>
                <a href="mailto:hello@thechangelab.net" style={{ color: CLAY }} className="hover:underline">hello@thechangelab.net</a>
              </div>
              <div className="flex items-start gap-2">
                <span style={{ color: MUTED }}>Location</span>
                <span style={{ color: INK }}>Houston, Texas</span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: MUTED }}>Web</span>
                <a href="https://www.changeengine.us" style={{ color: CLAY }} className="hover:underline">www.changeengine.us</a>
              </div>
            </div>
          </div>
          <div className="p-6" style={{ border: '1px solid ' + RULE_COLOR }}>
            <h2 style={{ fontFamily: MONO, color: MUTED }} className="text-sm uppercase tracking-wide mb-4">Ways to Connect</h2>
            <ul className="space-y-3 text-sm" style={{ color: INK }}>
              <li><strong style={{ color: INK }}>Report an issue</strong> -- Something wrong or outdated? Let us know.</li>
              <li><strong style={{ color: INK }}>Suggest content</strong> -- Know a resource we should feature? Share it.</li>
              <li><strong style={{ color: INK }}>Partner with us</strong> -- Organizations and agencies can join the Exchange.</li>
              <li><strong style={{ color: INK }}>Volunteer</strong> -- Help us build a better civic platform for Houston.</li>
            </ul>
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
