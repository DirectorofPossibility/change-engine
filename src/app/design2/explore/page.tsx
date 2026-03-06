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
    <div style={{ background: '#F0EAE0' }}>
      <div className="max-w-[1200px] mx-auto px-8 py-8">
        <Link href="/design2" className="text-[13px] font-semibold mb-4 inline-block" style={{ color: '#6B6560' }}>← Home</Link>
        <div className="mb-10 relative overflow-hidden">
          <div className="absolute top-[-60px] right-[-60px] opacity-[0.05]">
            <FlowerOfLifeIcon size={400} color="#C75B2A" />
          </div>
          <div className="relative z-10">
            <h1 className="font-serif text-4xl mb-3" style={{ color: '#1a1a1a' }}>Explore</h1>
            <p className="text-[15px] max-w-[640px]" style={{ color: '#6B6560' }}>
              Everything in the Community Exchange — browse by category, discover new connections, and find your entry point.
            </p>
            <div className="h-1 w-16 rounded-full mt-4" style={{ background: '#C75B2A' }} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SECTIONS.map(function (s) {
            return (
              <Link
                key={s.href}
                href={s.href}
                className="bg-white rounded-xl border p-5 transition-all hover:shadow-md hover:translate-y-[-2px]"
                style={{ borderColor: '#D4CCBE' }}
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
