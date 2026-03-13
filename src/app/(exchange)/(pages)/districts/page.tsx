import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Building2, Landmark, Scale, GraduationCap, Users, Flag, TrendingUp } from 'lucide-react'

export const revalidate = 3600

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

export const metadata: Metadata = {
  title: 'Districts — Change Engine',
  description: 'Every district. Every representative. Mapped. City council, county precinct, state house and senate, Congress — they all overlap where you live.',
}

const DISTRICT_TYPES = [
  {
    title: 'City Council',
    description: 'Houston is divided into 11 council districts plus 5 at-large positions. Your council member is your closest connection to city government.',
    icon: Building2,
    href: '/officials',
  },
  {
    title: 'Congressional Districts',
    description: 'Houston spans multiple U.S. congressional districts. Your representative carries your voice to Washington.',
    icon: Landmark,
    href: '/officials',
  },
  {
    title: 'State House Districts',
    description: 'Texas House representatives serve districts of roughly 190,000 people. They shape state law, budgets, and education policy.',
    icon: Scale,
    href: '/officials',
  },
  {
    title: 'State Senate Districts',
    description: 'Texas Senators represent larger districts and confirm gubernatorial appointments, pass legislation, and set state priorities.',
    icon: Flag,
    href: '/officials',
  },
  {
    title: 'County Precincts',
    description: 'Harris County Commissioners Court oversees county roads, flood control, public health, and a multi-billion dollar budget.',
    icon: Users,
    href: '/officials',
  },
  {
    title: 'HISD Trustee Districts',
    description: 'Houston Independent School District trustees govern the largest school district in Texas, serving over 180,000 students.',
    icon: GraduationCap,
    href: '/officials',
  },
  {
    title: 'TIRZ Zones',
    description: 'Tax Increment Reinvestment Zones capture property tax growth and reinvest it locally -- funding infrastructure, housing, and development.',
    icon: TrendingUp,
    href: '/tirz',
  },
]

export default function DistrictsPage() {
  const initialCount = 4
  const hasMore = DISTRICT_TYPES.length > initialCount

  return (
    <div style={{ background: PARCHMENT }} className="min-h-screen">
      {/* Hero */}
      <div style={{ background: PARCHMENT_WARM }} className="relative overflow-hidden border-b">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="max-w-[900px] mx-auto px-6 py-12 relative">
          <p style={{ fontFamily: MONO, color: MUTED, fontSize: 11, letterSpacing: '0.12em' }} className="uppercase mb-3">
            The Change Engine
          </p>
          <h1 style={{ fontFamily: SERIF, color: INK }} className="text-3xl sm:text-4xl mb-3">
            Every District. Every Representative. Mapped.
          </h1>
          <p style={{ fontFamily: SERIF, color: MUTED, fontSize: 17 }} className="max-w-[600px] leading-relaxed mb-4">
            City council. County precinct. State house and senate. Congress. They all overlap where you live. Understanding your districts is the first step to knowing who represents you.
          </p>
          <div className="flex gap-6" style={{ fontFamily: MONO, fontSize: 12, color: MUTED }}>
            <span><strong style={{ color: INK }}>7</strong> District Types</span>
            <span><strong style={{ color: INK }}>11</strong> City Council</span>
            <span><strong style={{ color: INK }}>4</strong> County Precincts</span>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-4 pb-2">
        <nav style={{ fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: '0.06em' }} className="uppercase">
          <span>Districts</span>
        </nav>
      </div>

      {/* Main Content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">

        {/* Find Your Districts CTA */}
        <div className="border p-6 sm:p-8 mb-8" style={{ borderColor: RULE_COLOR, background: PARCHMENT_WARM }}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 flex items-center justify-center flex-shrink-0" style={{ background: PARCHMENT }}>
              <MapPin size={24} style={{ color: CLAY }} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 style={{ fontFamily: SERIF, color: INK, fontSize: 20 }} className="mb-2">
                Find Your Districts
              </h2>
              <p style={{ fontFamily: SERIF, color: MUTED, fontSize: 14 }} className="leading-relaxed mb-4">
                Enter your address to see every political boundary that covers your block
                and every person responsible for what happens inside it.
              </p>
              <Link
                href="/officials/lookup"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-80"
                style={{ background: CLAY, color: '#fff', fontFamily: MONO, fontSize: 12, letterSpacing: '0.06em' }}
              >
                <MapPin size={16} />
                Look Up Your Address
              </Link>
            </div>
          </div>
        </div>

        <div className="my-10" style={{ height: 1, background: RULE_COLOR }} />

        {/* District Types */}
        <div className="flex items-baseline justify-between mb-1">
          <h2 style={{ fontFamily: SERIF, color: INK, fontSize: 24 }}>Explore by District Type</h2>
        </div>
        <div style={{ height: 1, background: RULE_COLOR }} className="mb-1" />
        <p style={{ fontFamily: MONO, color: MUTED, fontSize: 11 }} className="mb-6">
          {DISTRICT_TYPES.length} types
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {DISTRICT_TYPES.slice(0, initialCount).map(function (district) {
            const Icon = district.icon
            return (
              <Link
                key={district.title}
                href={district.href}
                className="block border overflow-hidden transition-colors hover:border-current"
                style={{ borderColor: RULE_COLOR, background: PARCHMENT_WARM }}
              >
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 flex items-center justify-center flex-shrink-0" style={{ background: PARCHMENT }}>
                      <Icon size={20} style={{ color: CLAY }} />
                    </div>
                    <h3 style={{ fontFamily: SERIF, color: INK, fontSize: 17 }}>
                      {district.title}
                    </h3>
                  </div>
                  <p style={{ fontFamily: SERIF, color: MUTED, fontSize: 14 }} className="leading-relaxed">
                    {district.description}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>

        {hasMore && (
          <details className="mt-4">
            <summary style={{ fontFamily: SERIF, fontStyle: 'italic', color: CLAY, cursor: 'pointer', fontSize: 15 }} className="mb-4">
              Show all {DISTRICT_TYPES.length} district types...
            </summary>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {DISTRICT_TYPES.slice(initialCount).map(function (district) {
                const Icon = district.icon
                return (
                  <Link
                    key={district.title}
                    href={district.href}
                    className="block border overflow-hidden transition-colors hover:border-current"
                    style={{ borderColor: RULE_COLOR, background: PARCHMENT_WARM }}
                  >
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 flex items-center justify-center flex-shrink-0" style={{ background: PARCHMENT }}>
                          <Icon size={20} style={{ color: CLAY }} />
                        </div>
                        <h3 style={{ fontFamily: SERIF, color: INK, fontSize: 17 }}>
                          {district.title}
                        </h3>
                      </div>
                      <p style={{ fontFamily: SERIF, color: MUTED, fontSize: 14 }} className="leading-relaxed">
                        {district.description}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </details>
        )}

        <div className="my-10" style={{ height: 1, background: RULE_COLOR }} />

        {/* How Districts Work */}
        <div className="flex items-baseline justify-between mb-1">
          <h2 style={{ fontFamily: SERIF, color: INK, fontSize: 24 }}>How Districts Work</h2>
        </div>
        <div style={{ height: 1, background: RULE_COLOR }} className="mb-4" />

        <p style={{ fontFamily: SERIF, color: MUTED, fontSize: 15 }} className="leading-relaxed max-w-2xl mb-6">
          Every person in Houston lives inside multiple overlapping political boundaries.
          Your home address determines which city council member, county commissioner,
          state representative, state senator, and congressional representative speaks for you.
          District lines are redrawn every ten years after the census.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="border p-4" style={{ borderColor: RULE_COLOR, background: PARCHMENT_WARM }}>
            <p style={{ fontFamily: SERIF, color: INK, fontSize: 14, fontWeight: 600 }} className="mb-1">Local</p>
            <p style={{ fontFamily: SERIF, color: MUTED, fontSize: 12 }} className="leading-relaxed">
              City council and county commissioners handle roads, parks, public safety, and local budgets.
            </p>
          </div>
          <div className="border p-4" style={{ borderColor: RULE_COLOR, background: PARCHMENT_WARM }}>
            <p style={{ fontFamily: SERIF, color: INK, fontSize: 14, fontWeight: 600 }} className="mb-1">State</p>
            <p style={{ fontFamily: SERIF, color: MUTED, fontSize: 12 }} className="leading-relaxed">
              State house and senate members shape education, healthcare, criminal justice, and state taxes.
            </p>
          </div>
          <div className="border p-4" style={{ borderColor: RULE_COLOR, background: PARCHMENT_WARM }}>
            <p style={{ fontFamily: SERIF, color: INK, fontSize: 14, fontWeight: 600 }} className="mb-1">Federal</p>
            <p style={{ fontFamily: SERIF, color: MUTED, fontSize: 12 }} className="leading-relaxed">
              Congressional representatives and senators set national policy, defense, immigration, and federal funding.
            </p>
          </div>
        </div>

        {/* Footer link */}
        <div className="my-10" style={{ height: 1, background: RULE_COLOR }} />
        <div className="text-center pb-12">
          <Link href="/" style={{ fontFamily: MONO, color: CLAY, fontSize: 12, letterSpacing: '0.06em' }} className="uppercase hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
