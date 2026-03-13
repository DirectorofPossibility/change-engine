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
  title: 'Accessibility | Change Engine',
  description: 'Our commitment to making civic participation accessible to everyone.',
}

export default function AccessibilityPage() {
  return (
    <div style={{ background: PARCHMENT }} className="min-h-screen">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden" style={{ background: PARCHMENT_WARM }}>
        <div className="absolute right-[-60px] top-[-20px]">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="relative z-10 max-w-[900px] mx-auto px-6 py-10">
          <p style={{ fontFamily: MONO, color: MUTED }} className="text-[11px] uppercase tracking-[0.15em] mb-1">changeengine.us</p>
          <h1 style={{ fontFamily: SERIF, color: INK }} className="text-2xl sm:text-3xl mt-2">Accessibility</h1>
          <p style={{ fontFamily: SERIF, color: MUTED }} className="text-base mt-2">
            Our commitment to making civic participation accessible to everyone.
          </p>
        </div>
        <div style={{ height: 1, background: RULE_COLOR }} />
      </section>

      {/* ── Breadcrumb ── */}
      <div className="max-w-[900px] mx-auto px-6 pt-4">
        <nav style={{ fontFamily: MONO, color: MUTED }} className="text-[11px] tracking-wide">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-1">/</span>
          <span style={{ color: INK }}>Accessibility</span>
        </nav>
      </div>

      <div className="max-w-[900px] mx-auto px-6 py-8">
        <div className="space-y-8">
          <section>
            <h2 style={{ fontFamily: SERIF, color: INK }} className="text-xl mb-1">Our Commitment</h2>
            <div style={{ borderBottom: '2px dotted ' + RULE_COLOR }} className="mb-4" />
            <p className="leading-relaxed" style={{ fontFamily: SERIF, color: MUTED }}>
              The Change Lab believes that civic life should be open to everyone. We are committed to ensuring that the Change Engine is accessible to people of all abilities, backgrounds, and circumstances. We continuously work to improve the usability and experience of our platform for all visitors.
            </p>
          </section>

          <div style={{ borderTop: '1px solid ' + RULE_COLOR }} />

          <section>
            <h2 style={{ fontFamily: SERIF, color: INK }} className="text-xl mb-1">What We Do</h2>
            <div style={{ borderBottom: '2px dotted ' + RULE_COLOR }} className="mb-4" />
            <ul className="space-y-2" style={{ fontFamily: SERIF, color: MUTED }}>
              <li className="flex gap-2">
                <span className="w-2 h-2 flex-shrink-0 mt-1.5" style={{ background: CLAY }} />
                <span>Write all content at a 6th-grade reading level so information is clear and easy to understand</span>
              </li>
              <li className="flex gap-2">
                <span className="w-2 h-2 flex-shrink-0 mt-1.5" style={{ background: CLAY }} />
                <span>Provide translations in Spanish and Vietnamese for key content</span>
              </li>
              <li className="flex gap-2">
                <span className="w-2 h-2 flex-shrink-0 mt-1.5" style={{ background: CLAY }} />
                <span>Use semantic HTML and proper heading structure for screen reader compatibility</span>
              </li>
              <li className="flex gap-2">
                <span className="w-2 h-2 flex-shrink-0 mt-1.5" style={{ background: CLAY }} />
                <span>Maintain sufficient color contrast throughout the platform</span>
              </li>
              <li className="flex gap-2">
                <span className="w-2 h-2 flex-shrink-0 mt-1.5" style={{ background: CLAY }} />
                <span>Support keyboard navigation across all interactive elements</span>
              </li>
              <li className="flex gap-2">
                <span className="w-2 h-2 flex-shrink-0 mt-1.5" style={{ background: CLAY }} />
                <span>Design responsive layouts that work across devices and screen sizes</span>
              </li>
            </ul>
          </section>

          <div style={{ borderTop: '1px solid ' + RULE_COLOR }} />

          <section>
            <h2 style={{ fontFamily: SERIF, color: INK }} className="text-xl mb-1">Standards</h2>
            <div style={{ borderBottom: '2px dotted ' + RULE_COLOR }} className="mb-4" />
            <p className="leading-relaxed" style={{ fontFamily: SERIF, color: MUTED }}>
              We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 at the AA level. We recognize that accessibility is an ongoing effort and we are continually working to improve.
            </p>
          </section>

          <div style={{ borderTop: '1px solid ' + RULE_COLOR }} />

          <section>
            <h2 style={{ fontFamily: SERIF, color: INK }} className="text-xl mb-1">Feedback</h2>
            <div style={{ borderBottom: '2px dotted ' + RULE_COLOR }} className="mb-4" />
            <p className="leading-relaxed" style={{ fontFamily: SERIF, color: MUTED }}>
              If you experience any difficulty accessing content on the Change Engine, or have suggestions for how we can improve accessibility, please reach out to us at{' '}
              <a href="mailto:hello@thechangelab.net" style={{ color: CLAY }} className="hover:underline">
                hello@thechangelab.net
              </a>
              . We take all feedback seriously and will do our best to respond promptly.
            </p>
          </section>
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
