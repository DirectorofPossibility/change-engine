import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Building2, Landmark, Scale, GraduationCap, Users, Flag, TrendingUp } from 'lucide-react'

export const revalidate = 3600


export const metadata: Metadata = {
  title: 'Districts — Change Engine',
  description: 'Every district. Every representative. Mapped. City council, county precinct, state house and senate, Congress — they all overlap where you live.',
}

const DISTRICT_TYPES = [
  {
    title: 'City Council',
    description: 'Your city council represents your interests at City Hall. Your council member is your closest connection to city government.',
    icon: Building2,
    href: '/officials',
  },
  {
    title: 'Congressional Districts',
    description: 'Your area may span multiple U.S. congressional districts. Your representative carries your voice to Washington.',
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
    description: 'Your county commissioners court oversees county roads, flood control, public health, and the county budget.',
    icon: Users,
    href: '/officials',
  },
  {
    title: 'School District Trustees',
    description: 'Your local school district trustees govern education policy, budgets, and programs for students in your community.',
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
            Every District. Every Representative. Mapped.
          </h1>
          <p style={{ color: "#5c6474", fontSize: 17 }} className="max-w-[600px] leading-relaxed mb-4">
            City council. County precinct. State house and senate. Congress. They all overlap where you live. Understanding your districts is the first step to knowing who represents you.
          </p>
          <div className="flex gap-6" style={{ fontSize: 12, color: "#5c6474" }}>
            <span><strong style={{  }}>7</strong> District Types</span>
            <span><strong style={{  }}>11</strong> City Council</span>
            <span><strong style={{  }}>4</strong> County Precincts</span>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-4 pb-2">
        <nav style={{ fontSize: 11, color: "#5c6474", letterSpacing: '0.06em' }} className="uppercase">
          <span>Districts</span>
        </nav>
      </div>

      {/* Main Content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">

        {/* Find Your Districts CTA */}
        <div className="border p-6 sm:p-8 mb-8" style={{ borderColor: '#dde1e8', background: "#f4f5f7" }}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 flex items-center justify-center flex-shrink-0 bg-paper">
              <MapPin size={24} style={{ color: "#1b5e8a" }} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 style={{ fontSize: 20 }} className="mb-2">
                Find Your Districts
              </h2>
              <p style={{ color: "#5c6474", fontSize: 14 }} className="leading-relaxed mb-4">
                Enter your address to see every political boundary that covers your block
                and every person responsible for what happens inside it.
              </p>
              <Link
                href="/officials/lookup"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-80"
                style={{ background: '#1b5e8a', color: '#fff', fontSize: 12, letterSpacing: '0.06em' }}
              >
                <MapPin size={16} />
                Look Up Your Address
              </Link>
            </div>
          </div>
        </div>

        <div className="my-10" style={{ height: 1, background: '#dde1e8' }} />

        {/* District Types */}
        <div className="flex items-baseline justify-between mb-1">
          <h2 style={{ fontSize: 24 }}>Explore by District Type</h2>
        </div>
        <div style={{ height: 1, background: '#dde1e8' }} className="mb-1" />
        <p style={{ color: "#5c6474", fontSize: 11 }} className="mb-6">
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
                style={{ borderColor: '#dde1e8', background: "#f4f5f7" }}
              >
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 bg-paper">
                      <Icon size={20} style={{ color: "#1b5e8a" }} />
                    </div>
                    <h3 style={{ fontSize: 17 }}>
                      {district.title}
                    </h3>
                  </div>
                  <p style={{ color: "#5c6474", fontSize: 14 }} className="leading-relaxed">
                    {district.description}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>

        {hasMore && (
          <details className="mt-4">
            <summary style={{ fontStyle: 'italic', color: "#1b5e8a", cursor: 'pointer', fontSize: 15 }} className="mb-4">
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
                    style={{ borderColor: '#dde1e8', background: "#f4f5f7" }}
                  >
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 bg-paper">
                          <Icon size={20} style={{ color: "#1b5e8a" }} />
                        </div>
                        <h3 style={{ fontSize: 17 }}>
                          {district.title}
                        </h3>
                      </div>
                      <p style={{ color: "#5c6474", fontSize: 14 }} className="leading-relaxed">
                        {district.description}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </details>
        )}

        <div className="my-10" style={{ height: 1, background: '#dde1e8' }} />

        {/* How Districts Work */}
        <div className="flex items-baseline justify-between mb-1">
          <h2 style={{ fontSize: 24 }}>How Districts Work</h2>
        </div>
        <div style={{ height: 1, background: '#dde1e8' }} className="mb-4" />

        <p style={{ color: "#5c6474", fontSize: 15 }} className="leading-relaxed max-w-2xl mb-6">
          Every resident lives inside multiple overlapping political boundaries.
          Your home address determines which city council member, county commissioner,
          state representative, state senator, and congressional representative speaks for you.
          District lines are redrawn every ten years after the census.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="border p-4" style={{ borderColor: '#dde1e8', background: "#f4f5f7" }}>
            <p style={{ fontSize: 14, fontWeight: 600 }} className="mb-1">Local</p>
            <p style={{ color: "#5c6474", fontSize: 12 }} className="leading-relaxed">
              City council and county commissioners handle roads, parks, public safety, and local budgets.
            </p>
          </div>
          <div className="border p-4" style={{ borderColor: '#dde1e8', background: "#f4f5f7" }}>
            <p style={{ fontSize: 14, fontWeight: 600 }} className="mb-1">State</p>
            <p style={{ color: "#5c6474", fontSize: 12 }} className="leading-relaxed">
              State house and senate members shape education, healthcare, criminal justice, and state taxes.
            </p>
          </div>
          <div className="border p-4" style={{ borderColor: '#dde1e8', background: "#f4f5f7" }}>
            <p style={{ fontSize: 14, fontWeight: 600 }} className="mb-1">Federal</p>
            <p style={{ color: "#5c6474", fontSize: 12 }} className="leading-relaxed">
              Congressional representatives and senators set national policy, defense, immigration, and federal funding.
            </p>
          </div>
        </div>

        {/* Footer link */}
        <div className="my-10" style={{ height: 1, background: '#dde1e8' }} />
        <div className="text-center pb-12">
          <Link href="/" style={{ color: "#1b5e8a", fontSize: 12, letterSpacing: '0.06em' }} className="uppercase hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
