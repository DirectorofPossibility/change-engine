import type { Metadata } from 'next'
import Link from 'next/link'
import { THEMES } from '@/lib/constants'
import { getExchangeStats } from '@/lib/data/exchange'
import { FlowerOfLifeIcon } from '@/components/exchange/FlowerIcons'

export const revalidate = 600
export const metadata: Metadata = { title: 'Explore — Community Exchange' }

const SECTIONS = [
  { href: '/design2/neighborhoods', label: 'Neighborhoods', desc: 'Explore 88 super neighborhoods across Houston', color: '#d69e2e' },
  { href: '/design2/organizations', label: 'Organizations', desc: 'Community organizations driving change', color: '#805ad5' },
  { href: '/design2/foundations', label: 'Foundations', desc: 'Philanthropic partners investing in Houston', color: '#805ad5' },
  { href: '/design2/events', label: 'Events', desc: 'Workshops, meetings, and community gatherings', color: '#805ad5' },
  { href: '/design2/officials', label: 'Officials', desc: 'Your elected representatives at every level', color: '#38a169' },
  { href: '/design2/policies', label: 'Policies', desc: 'Legislation and ordinances in plain language', color: '#38a169' },
  { href: '/design2/services', label: 'Services', desc: 'Help and support programs in your community', color: '#C75B2A' },
  { href: '/design2/opportunities', label: 'Opportunities', desc: 'Volunteer, participate, and get involved', color: '#38a169' },
  { href: '/design2/library', label: 'Library', desc: 'Articles, guides, research, and learning resources', color: '#3182ce' },
  { href: '/design2/news', label: 'News', desc: 'Latest stories and reports from Houston', color: '#C75B2A' },
  { href: '/design2/pathways', label: 'Pathways', desc: 'Seven themes that organize the Exchange', color: '#C75B2A' },
  { href: '/design2/chat', label: 'Ask Chance', desc: 'Your AI civic assistant for Houston', color: '#C75B2A' },
]

export default async function ExplorePage() {
  const stats = await getExchangeStats()

  return (
    <div>
      {/* Dark editorial hero */}
      <section style={{ background: '#1a1a2e' }}>
        <div className="max-w-[1152px] mx-auto px-8 py-10 pb-12">
          <div className="text-[13px] mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <Link href="/design2" className="hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.5)' }}>Home</Link>
            <span className="mx-2" style={{ color: '#C75B2A' }}>&rsaquo;</span>
            <span style={{ color: 'white' }}>Explore</span>
          </div>
          <div className="h-[2px] w-10 mb-5" style={{ background: '#C75B2A' }} />
          <h1 className="font-serif text-[clamp(1.75rem,4vw,2.5rem)]" style={{ color: 'white' }}>Explore</h1>
          <p className="font-serif text-[18px] italic mt-2" style={{ color: 'rgba(255,255,255,0.6)' }}>Everything in the Community Exchange</p>
          <p className="text-[16px] mt-4 max-w-[720px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Browse by category, discover new connections, and find your entry point into Houston&apos;s civic ecosystem.
          </p>
        </div>
      </section>

      <div className="max-w-[1152px] mx-auto px-8 py-12" style={{ background: '#FAF8F5' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SECTIONS.map(function (s) {
            return (
              <Link
                key={s.href}
                href={s.href}
                className="bg-white rounded-xl border p-5 transition-all hover:shadow-md hover:translate-y-[-2px]"
                style={{ borderColor: '#E2DDD5' }}
              >
                <div className="h-1 w-8 rounded-full mb-3" style={{ background: s.color }} />
                <h3 className="font-serif text-lg font-bold" style={{ color: '#1a1a1a' }}>{s.label}</h3>
                <p className="text-[13px] mt-1" style={{ color: '#6B6560' }}>{s.desc}</p>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
