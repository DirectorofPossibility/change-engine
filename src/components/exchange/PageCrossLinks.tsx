import Link from 'next/link'
import { getSiteConfig } from '@/lib/data/site-config'

interface CrossLink {
  href: string
  title: string
  description: string
}

const CROSS_LINK_PRESETS: Record<string, CrossLink[]> = {
  civic: [
    { href: '/officials', title: 'Your Officials', description: 'See who represents you' },
    { href: '/elections', title: 'Elections & Voting', description: 'Upcoming elections and key dates' },
    { href: '/policies', title: 'Policies', description: 'Legislation and ordinances' },
  ],
  resources: [
    { href: '/help', title: 'Find Help', description: 'Resources for food, housing, jobs, and more' },
    { href: '/services', title: 'Service Directory', description: 'Browse 211 services by category' },
    { href: '/opportunities', title: 'Get Involved', description: 'Volunteer and community opportunities' },
  ],
  explore: [
    { href: '/news', title: 'News', description: 'Latest articles and reports' },
    { href: '/library', title: 'Library', description: 'In-depth guides and resources' },
    { href: '/pathways', title: 'Topics', description: 'Browse by community theme' },
  ],
  community: [
    { href: '/organizations', title: 'Organizations', description: 'Community groups doing the work' },
    { href: '/calendar', title: 'Events', description: 'Community events near you' },
    { href: '/opportunities', title: 'Opportunities', description: 'Ways to get involved' },
  ],
}

interface PageCrossLinksProps {
  /** Use a preset: 'civic' | 'resources' | 'explore' | 'community' */
  preset?: keyof typeof CROSS_LINK_PRESETS
  /** Or provide custom links */
  links?: CrossLink[]
  /** Optional label */
  label?: string
}

export async function PageCrossLinks({ preset, links, label = 'You might also want' }: PageCrossLinksProps) {
  const config = await getSiteConfig()
  if (config.page_cross_links === false) return null

  const items = links || (preset ? CROSS_LINK_PRESETS[preset] : CROSS_LINK_PRESETS.resources)

  return (
    <div className="mt-10 pt-8 border-t border-rule">
      <p className="font-mono text-micro uppercase tracking-wider text-faint mb-4">{label}</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {items.map(function (item) {
          return (
            <Link key={item.href} href={item.href} className="block p-4 border border-rule hover:border-ink transition-colors">
              <p className="font-body font-semibold text-ink mb-1">{item.title}</p>
              <p className="font-body text-sm text-muted">{item.description}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
