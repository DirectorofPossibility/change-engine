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
  title: 'Donate -- Change Engine',
  description: 'Help us keep Change Engine free for everyone. Your donation keeps civic infrastructure running.',
}

const tiers = [
  { amount: '$10/month', label: 'Neighbor', desc: 'Keeps one data source synced for a month.' },
  { amount: '$25/month', label: 'Block Captain', desc: 'Covers translation costs for one language.' },
  { amount: '$50/month', label: 'Connector', desc: 'Supports one week of editorial review.' },
  { amount: '$100/month', label: 'Infrastructure Partner', desc: 'Covers hosting and database for a month.' },
]

const impactItems = [
  { bold: '174 tables', rest: ' of connected civic data -- updated every day.' },
  { bold: '4 levels of government', rest: ' synced every morning.' },
  { bold: '3 languages', rest: ' -- English, Spanish, Vietnamese.' },
  { bold: '6th-grade reading level', rest: ' on every piece of content.' },
  { bold: 'Zero ads.', rest: ' Ever.' },
]

export default function DonatePage() {
  return (
    <div style={{ background: PARCHMENT }} className="min-h-screen">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden" style={{ background: PARCHMENT_WARM }}>
        <div className="absolute right-[-60px] top-[-20px]">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="relative z-10 max-w-[900px] mx-auto px-6 py-10">
          <p style={{ fontFamily: MONO, color: MUTED }} className="text-[11px] uppercase tracking-[0.15em] mb-1">changeengine.us</p>
          <h1 style={{ fontFamily: SERIF, color: INK }} className="text-2xl sm:text-3xl mt-2">
            Help us keep it free for everyone.
          </h1>
          <p style={{ fontFamily: SERIF, color: MUTED }} className="text-base mt-2">
            Change Engine is free. It stays free because people like you think it should be.
          </p>
          <p style={{ fontFamily: SERIF, color: MUTED }} className="text-sm mt-1 italic">
            Civic infrastructure shouldn&apos;t cost money to access. Building it does.
          </p>
        </div>
        <div style={{ height: 1, background: RULE_COLOR }} />
      </section>

      {/* ── Breadcrumb ── */}
      <div className="max-w-[900px] mx-auto px-6 pt-4">
        <nav style={{ fontFamily: MONO, color: MUTED }} className="text-[11px] tracking-wide">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-1">/</span>
          <span style={{ color: INK }}>Donate</span>
        </nav>
      </div>

      <div className="max-w-[900px] mx-auto px-6 py-8">
        {/* Mission */}
        <section className="mb-12">
          <div className="space-y-4 text-lg leading-relaxed" style={{ fontFamily: SERIF, color: MUTED }}>
            <p>
              Knowing who represents you. Finding services in your neighborhood.
              Understanding how to get involved. That information shouldn&rsquo;t
              cost anything to access.
            </p>
            <p>
              But building and maintaining the platform that makes it all
              findable -- that costs real money.
            </p>
            <p>
              Your donation keeps the data accurate, the platform running, and
              the doors open.
            </p>
          </div>
        </section>

        {/* ── Divider ── */}
        <div style={{ borderTop: '1px solid ' + RULE_COLOR }} className="my-8" />

        {/* What Your Money Does */}
        <section className="mb-12">
          <div className="flex items-baseline justify-between mb-1">
            <h2 style={{ fontFamily: SERIF, color: INK }} className="text-xl">What your money does</h2>
            <span style={{ fontFamily: MONO, color: MUTED }} className="text-[11px]">{impactItems.length} facts</span>
          </div>
          <div style={{ borderBottom: '2px dotted ' + RULE_COLOR }} className="mb-4" />
          <div className="space-y-3">
            {impactItems.map(function (item, i) {
              return (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-2 h-2 flex-shrink-0 mt-2" style={{ background: CLAY }} />
                  <p className="leading-relaxed" style={{ fontFamily: SERIF, color: MUTED }}>
                    <strong style={{ color: INK }}>{item.bold}</strong>
                    {item.rest}
                  </p>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── Divider ── */}
        <div style={{ borderTop: '1px solid ' + RULE_COLOR }} className="my-8" />

        {/* Tiers */}
        <section className="mb-12">
          <div className="flex items-baseline justify-between mb-1">
            <h2 style={{ fontFamily: SERIF, color: INK }} className="text-xl">Choose your level</h2>
            <span style={{ fontFamily: MONO, color: MUTED }} className="text-[11px]">{tiers.length} tiers</span>
          </div>
          <div style={{ borderBottom: '2px dotted ' + RULE_COLOR }} className="mb-4" />
          <div className="space-y-3">
            {tiers.map(function (tier) {
              return (
                <div
                  key={tier.label}
                  className="p-5 relative overflow-hidden"
                  style={{ border: '1px solid ' + RULE_COLOR }}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: CLAY }} />
                  <div className="pl-3">
                    <p style={{ fontFamily: SERIF, color: INK }} className="font-bold">
                      {tier.amount} -- {tier.label}.
                    </p>
                    <p style={{ fontFamily: MONO, color: MUTED }} className="text-sm mt-1">{tier.desc}</p>
                  </div>
                </div>
              )
            })}
            {/* Custom amount */}
            <div
              className="p-5 relative overflow-hidden"
              style={{ border: '1px solid ' + RULE_COLOR, background: PARCHMENT_WARM }}
            >
              <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: CLAY }} />
              <div className="pl-3">
                <p style={{ fontFamily: SERIF, color: INK }} className="font-bold">
                  Your amount.
                </p>
                <p style={{ fontFamily: MONO, color: MUTED }} className="text-sm mt-1">
                  Give what you can. All of it matters.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mb-12 text-center">
          <a
            href="https://www.paypal.com/donate/?hosted_button_id=PLACEHOLDER"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-3 text-white text-base"
            style={{ fontFamily: MONO, background: CLAY }}
          >
            Make a Donation
          </a>
        </section>

        {/* ── Divider ── */}
        <div style={{ borderTop: '1px solid ' + RULE_COLOR }} className="my-8" />

        {/* Tax Info */}
        <section className="mb-12 p-6" style={{ background: PARCHMENT_WARM }}>
          <p style={{ fontFamily: MONO, color: MUTED }} className="text-sm leading-relaxed">
            The Change Lab is fiscally sponsored by Impact Hub Houston, a
            501(c)(3). Your donation is tax-deductible.
          </p>
        </section>

        {/* Closing */}
        <section className="relative p-8 text-center overflow-hidden" style={{ border: '1px solid ' + RULE_COLOR }}>
          <div className="absolute right-[-20px] bottom-[-20px]">
            <Image src="/images/fol/seed-of-life.svg" alt="" width={120} height={120} className="opacity-[0.04]" />
          </div>
          <p style={{ fontFamily: SERIF, color: INK }} className="text-lg">
            Civic infrastructure only works if someone maintains it.
          </p>
          <p style={{ fontFamily: SERIF, color: MUTED }} className="mt-2">
            Thank you for being that someone.
          </p>
        </section>
      </div>

      {/* ── Footer link ── */}
      <div className="max-w-[900px] mx-auto px-6 pb-10">
        <div style={{ borderTop: '1px solid ' + RULE_COLOR }} className="pt-4 mt-8">
          <Link href="/" style={{ fontFamily: MONO, color: CLAY }} className="text-sm hover:underline">&larr; Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
