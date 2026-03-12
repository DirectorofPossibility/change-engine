'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from '@/lib/use-translation'

interface WayfinderCrumb {
  label: string
  href?: string
  here?: boolean
}

interface WayfinderProps {
  crumbs?: WayfinderCrumb[]
}

/**
 * Wayfinder — dark breadcrumb bar that appears below the site nav.
 * Matches the .wayfinder spec from change-engine-page-system.html.
 *
 * If no crumbs are passed, it reads the current pathname to build
 * a basic breadcrumb trail automatically.
 */
export function Wayfinder({ crumbs }: WayfinderProps) {
  const pathname = usePathname()
  const { t } = useTranslation()

  // Auto-generate crumbs from pathname if none provided
  const breadcrumbs = crumbs ?? generateCrumbs(pathname, t('wayfinder.guide'))

  return (
    <div className="bg-ink" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="max-w-[1080px] mx-auto px-6 flex items-stretch flex-wrap">
        {/* Breadcrumb strip */}
        <div
          className="flex items-center flex-1 min-w-0 overflow-x-auto scrollbar-hide"
        >
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center">
              {i > 0 && (
                <span
                  className="text-[.75rem] px-1"
                  style={{ color: 'rgba(255,255,255,0.15)' }}
                >
                  ›
                </span>
              )}
              {crumb.href && !crumb.here ? (
                <Link
                  href={crumb.href}
                  className="font-mono text-[.75rem] uppercase tracking-[0.06em] whitespace-nowrap px-3 py-[0.85rem] transition-colors"
                  style={{
                    color: 'rgba(255,255,255,0.4)',
                    borderBottom: '2px solid transparent',
                  }}
                  onMouseEnter={e => { (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.7)' }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.4)' }}
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  className="font-mono text-[.75rem] uppercase tracking-[0.06em] whitespace-nowrap px-3 py-[0.85rem]"
                  style={{
                    color: crumb.here ? '#7ec8e3' : 'rgba(255,255,255,0.4)',
                    borderBottom: crumb.here ? '2px solid #7ec8e3' : '2px solid transparent',
                  }}
                >
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </div>

      </div>
    </div>
  )
}

// Human-readable labels for known route segments
const ROUTE_LABELS: Record<string, string> = {
  explore: 'Browse Topics',
  focus: 'Topic',
  officials: 'Who Runs This',
  services: 'Local Services',
  organizations: 'Local Orgs',
  policies: 'Policy Watch',
  neighborhoods: 'Neighborhoods',
  'super-neighborhoods': 'Neighborhoods',
  opportunities: 'Get Involved',
  elections: 'Elections',
  content: 'Stories',
  pathways: 'Sections',
  community: 'Community',
  learning: 'Learning',
  'learning-paths': 'Learning Paths',
  about: 'About',
  search: 'Search',
  library: 'Library',
  doc: 'Document',
  category: 'Category',
  governance: 'Governance',
  districts: 'Districts',
  lookup: 'Find Your Reps',
  calendar: 'Calendar',
  events: 'Events',
  help: 'Field Guide',
  news: 'The Wire',
  foundations: 'Foundations',
  stories: 'Stories',
  guides: 'Guides',
  candidates: 'Candidates',
  agencies: 'Agencies',
  tirz: 'TIRZ Zones',
  collections: 'Collections',
  benefits: 'Benefits',
  campaigns: 'Campaigns',
  adventures: 'Adventures',
  centers: 'Centers',
  compass: 'Compass',
  glossary: 'Glossary',
  faq: 'FAQ',
  'my-neighborhood': 'My Neighborhood',
  'my-area': 'My Area',
  'municipal-services': 'City Services',
  'call-your-senators': 'Call Your Senators',
  geography: 'Geography',
  'knowledge-graph': 'Knowledge Graph',
  bookshelf: 'Bookshelf',
  chat: 'Ask Chance',
  for: 'For You',
  data: 'Data',
  action: 'Take Action',
  donate: 'Donate',
  'coming-soon': 'Coming Soon',
  goodthings: 'Three Good Things',
  'polling-places': 'Polling Places',
  me: 'My Profile',
}

function generateCrumbs(pathname: string | null, guideLabel = 'Guide'): WayfinderCrumb[] {
  if (!pathname) return [{ label: guideLabel, href: '/', here: true }]

  const segments = pathname.split('/').filter(Boolean)
  const crumbs: WayfinderCrumb[] = [{ label: guideLabel, href: '/' }]

  let path = ''
  segments.forEach((seg, i) => {
    path += '/' + seg

    // Skip raw IDs — the page's own Breadcrumb handles entity names
    // Matches: UUIDs, PREFIX_xxx (FA_055, OFF_abc, SN_12, SVC_xxx), pure numeric, hex hashes
    if (/^[0-9a-f]{8}-|^[A-Z]{1,}_[0-9a-zA-Z]|^\d+$|^[0-9a-f]{12,}$/.test(seg)) return

    const label = ROUTE_LABELS[seg] || seg
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
    crumbs.push({
      label,
      href: path,
      here: i === segments.length - 1,
    })
  })

  return crumbs
}
