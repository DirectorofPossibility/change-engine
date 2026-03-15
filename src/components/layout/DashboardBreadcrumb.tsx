'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  partner: 'Partner Portal',
  organization: 'Profile',
  guides: 'My Guides',
  events: 'My Events',
  new: 'New',
  ingestion: 'Ingestion',
  review: 'Review Queue',
  translations: 'Translations',
  content: 'Published',
  policies: 'Policies',
  library: 'Library',
  taxonomy: 'Taxonomy',
  quotes: 'Quotes',
  bookshelf: 'Bookshelf',
  'graph-explorer': 'Graph Explorer',
  'graph-coverage': 'Coverage Map',
  circles: 'Circle Graph',
  fidelity: 'Fidelity Check',
  analytics: 'Engagement',
  'content-performance': 'Content Performance',
  'sync-health': 'Sync Health',
  'translation-coverage': 'Translation Coverage',
  'data-freshness': 'Data Freshness',
  traffic: 'Traffic & SEO',
  edits: 'Feedback Loop',
  users: 'Users',
  promotions: 'Promotions',
  linkedin: 'LinkedIn',
  'site-config': 'Site Config',
  preferences: 'Content Preferences',
  utilities: 'Utilities',
  'tools-guides': 'Tools & Guides',
  manual: 'User Manual',
  sitemap: 'Sitemap',
  submit: 'Submit Content',
  pipeline: 'Pipeline',
  'api-keys': 'API Keys',
  'knowledge-graph': 'Knowledge Graph',
  feeds: 'Feeds',
}

export function DashboardBreadcrumb() {
  const pathname = usePathname()
  if (!pathname || pathname === '/dashboard' || pathname === '/dashboard/partner' || pathname === '/dashboard/neighbor') return null

  const segments = pathname.replace(/^\//, '').split('/')
  const crumbs: { label: string; href: string }[] = []

  let path = ''
  for (let i = 0; i < segments.length; i++) {
    path += '/' + segments[i]
    const seg = segments[i]

    // Skip dynamic segments (UUIDs, IDs)
    if (seg.length > 20 || /^[0-9a-f-]+$/i.test(seg)) {
      crumbs.push({ label: 'Detail', href: path })
      continue
    }

    const label = SEGMENT_LABELS[seg] || seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ')
    crumbs.push({ label, href: path })
  }

  // Don't show breadcrumb if only one level (e.g. /dashboard)
  if (crumbs.length <= 1) return null

  return (
    <div className="px-4 md:px-8 py-2" style={{ borderBottom: '1px solid #E8E4DF' }}>
      <nav className="flex items-center gap-1.5 text-xs font-mono" style={{ color: '#9B9590' }}>
        {crumbs.map(function (crumb, i) {
          const isLast = i === crumbs.length - 1
          return (
            <span key={crumb.href} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight size={10} className="flex-shrink-0" />}
              {isLast ? (
                <span style={{ color: '#1a1714' }}>{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="hover:underline">
                  {crumb.label}
                </Link>
              )}
            </span>
          )
        })}
      </nav>
    </div>
  )
}
