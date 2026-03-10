import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { IndexPageHero } from '@/components/exchange/IndexPageHero'
import { IndexWayfinder } from '@/components/exchange/IndexWayfinder'
import { MapPin, Building2, Landmark, Scale, GraduationCap, Users, Flag, TrendingUp } from 'lucide-react'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Districts — Community Exchange',
  description: 'Every district. Every representative. Mapped. City council, county precinct, state house and senate, Congress — they all overlap where you live.',
}

const DISTRICT_TYPES = [
  {
    title: 'City Council',
    description: 'Houston is divided into 11 council districts plus 5 at-large positions. Your council member is your closest connection to city government.',
    icon: Building2,
    color: '#C75B2A',
    href: '/officials',
    level: 'City',
  },
  {
    title: 'Congressional Districts',
    description: 'Houston spans multiple U.S. congressional districts. Your representative carries your voice to Washington.',
    icon: Landmark,
    color: '#805ad5',
    href: '/officials',
    level: 'Federal',
  },
  {
    title: 'State House Districts',
    description: 'Texas House representatives serve districts of roughly 190,000 people. They shape state law, budgets, and education policy.',
    icon: Scale,
    color: '#3182ce',
    href: '/officials',
    level: 'State',
  },
  {
    title: 'State Senate Districts',
    description: 'Texas Senators represent larger districts and confirm gubernatorial appointments, pass legislation, and set state priorities.',
    icon: Flag,
    color: '#319795',
    href: '/officials',
    level: 'State',
  },
  {
    title: 'County Precincts',
    description: 'Harris County Commissioners Court oversees county roads, flood control, public health, and a multi-billion dollar budget.',
    icon: Users,
    color: '#d69e2e',
    href: '/officials',
    level: 'County',
  },
  {
    title: 'HISD Trustee Districts',
    description: 'Houston Independent School District trustees govern the largest school district in Texas, serving over 180,000 students.',
    icon: GraduationCap,
    color: '#38a169',
    href: '/officials',
    level: 'City',
  },
  {
    title: 'TIRZ Zones',
    description: 'Tax Increment Reinvestment Zones capture property tax growth and reinvest it locally — funding infrastructure, housing, and development.',
    icon: TrendingUp,
    color: '#C75B2A',
    href: '/tirz',
    level: 'City',
  },
]

export default function DistrictsPage() {
  return (
    <div>
      <IndexPageHero
        color="#805ad5"
        pattern="metatron"
        title="Every District. Every Representative. Mapped."
        subtitle="You live in more districts than you think."
        intro="City council. County precinct. State house and senate. Congress. They all overlap where you live. Understanding your districts is the first step to knowing who represents you."
        stats={[
          { value: '7', label: 'District Types' },
          { value: '11', label: 'City Council' },
          { value: '4', label: 'County Precincts' },
          { value: '150', label: 'State House' },
        ]}
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[{ label: 'Districts' }]} />

        <div className="flex flex-col lg:flex-row gap-8 mt-4">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Find Your Districts CTA */}
            <div
              className="border border-brand-border rounded-[0.75rem] bg-white overflow-hidden mb-8"
             
            >
              <div className="h-1.5" style={{ backgroundColor: '#805ad5' }} />
              <div className="p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: '#805ad515' }}
                  >
                    <MapPin size={24} style={{ color: '#805ad5' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-serif text-xl font-bold text-brand-text mb-2">
                      Find Your Districts
                    </h2>
                    <p className="text-sm leading-relaxed text-brand-muted mb-4">
                      Enter your address to see every political boundary that covers your block
                      and every person responsible for what happens inside it.
                    </p>
                    <Link
                      href="/officials/lookup"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-accent text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
                    >
                      <MapPin size={16} />
                      Look Up Your Address
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* District Types Grid */}
            <div className="mb-6">
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-muted mb-4">
                Explore by District Type
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {DISTRICT_TYPES.map(function (district) {
                const Icon = district.icon
                return (
                  <Link
                    key={district.title}
                    href={district.href}
                    className="group border border-brand-border rounded-[0.75rem] overflow-hidden bg-white hover:translate-y-[-2px] transition-all duration-200"
                   
                  >
                    <div className="flex">
                      <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: district.color }} />
                      <div className="p-5 flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: district.color + '15' }}
                          >
                            <Icon size={20} style={{ color: district.color }} />
                          </div>
                          <h3 className="font-serif text-lg font-bold text-brand-text group-hover:text-brand-accent transition-colors">
                            {district.title}
                          </h3>
                        </div>
                        <p className="text-sm leading-relaxed text-brand-muted">
                          {district.description}
                        </p>
                        <div className="mt-3 flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-brand-accent opacity-0 group-hover:opacity-100 transition-opacity">
                          {district.href === '/tirz' ? 'Explore Zones' : 'View Officials'}
                          <span aria-hidden="true">&rarr;</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* How Districts Work */}
            <div className="mt-10 border-t-2 border-brand-border pt-8">
              <h2 className="font-serif text-2xl font-bold text-brand-text mb-4">
                How Districts Work
              </h2>
              <p className="text-sm leading-relaxed text-brand-muted max-w-2xl mb-6">
                Every person in Houston lives inside multiple overlapping political boundaries.
                Your home address determines which city council member, county commissioner,
                state representative, state senator, and congressional representative speaks for you.
                District lines are redrawn every ten years after the census.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="border border-brand-border rounded-[0.75rem] p-4 bg-brand-bg">
                  <p className="font-serif font-bold text-brand-text text-sm mb-1">Local</p>
                  <p className="text-[12px] leading-relaxed text-brand-muted">
                    City council and county commissioners handle roads, parks, public safety, and local budgets.
                  </p>
                </div>
                <div className="border border-brand-border rounded-[0.75rem] p-4 bg-brand-bg">
                  <p className="font-serif font-bold text-brand-text text-sm mb-1">State</p>
                  <p className="text-[12px] leading-relaxed text-brand-muted">
                    State house and senate members shape education, healthcare, criminal justice, and state taxes.
                  </p>
                </div>
                <div className="border border-brand-border rounded-[0.75rem] p-4 bg-brand-bg">
                  <p className="font-serif font-bold text-brand-text text-sm mb-1">Federal</p>
                  <p className="text-[12px] leading-relaxed text-brand-muted">
                    Congressional representatives and senators set national policy, defense, immigration, and federal funding.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Wayfinder sidebar */}
          <div className="hidden lg:block lg:w-[280px] flex-shrink-0">
            <div className="sticky top-24">
              <IndexWayfinder
                currentPage="districts"
                color="#805ad5"
                related={[
                  { label: 'Officials Directory', href: '/officials', color: '#805ad5' },
                  { label: 'Look Up Your Address', href: '/officials/lookup', color: '#C75B2A' },
                  { label: 'Governance Overview', href: '/governance', color: '#3182ce' },
                  { label: 'Elections', href: '/elections', color: '#38a169' },
                  { label: 'Neighborhoods', href: '/neighborhoods', color: '#d69e2e' },
                ]}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
