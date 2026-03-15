'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { PipelineStats } from '@/lib/types/dashboard'
import {
  LayoutDashboard, Search, FileText, Zap,
  Languages, Wrench, Users, BookOpen, HelpCircle,
  Briefcase, CalendarDays, Building2,
  Compass, BookMarked, Quote, Library,
  ChevronDown, Scale, Megaphone, MapPin,
  Tag, Network, Linkedin, CircleDot, Map,
  Layers, Activity, SlidersHorizontal, Settings,
  TrendingUp, HeartPulse, Clock, BarChart3,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  badge?: number
}

interface NavGroup {
  label: string
  items: NavItem[]
  defaultOpen?: boolean
}

const ADMIN_GROUPS: NavGroup[] = [
  {
    label: 'Pipeline',
    defaultOpen: true,
    items: [
      { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
      { href: '/dashboard/ingestion', label: 'Ingestion', icon: Zap },
      { href: '/dashboard/review', label: 'Review Queue', icon: Search },
      { href: '/dashboard/translations', label: 'Translations', icon: Languages },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/dashboard/content', label: 'Published', icon: FileText },
      { href: '/dashboard/policies', label: 'Policies', icon: Scale },
    ],
  },
  {
    label: 'Knowledge',
    items: [
      { href: '/dashboard/library', label: 'Library', icon: BookOpen },
      { href: '/dashboard/taxonomy', label: 'Taxonomy', icon: Tag },
      { href: '/dashboard/quotes', label: 'Quotes', icon: Quote },
      { href: '/dashboard/bookshelf', label: 'Bookshelf', icon: Library },
    ],
  },
  {
    label: 'Visualizations',
    items: [
      { href: '/dashboard/graph-explorer', label: 'Graph Explorer', icon: Network },
      { href: '/dashboard/graph-coverage', label: 'Coverage Map', icon: Map },
      { href: '/dashboard/circles', label: 'Circle Graph', icon: CircleDot },
      { href: '/dashboard/fidelity', label: 'Fidelity Check', icon: Layers },
      { href: '/dashboard/analytics', label: 'Engagement', icon: Activity },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/dashboard/content-performance', label: 'Content Performance', icon: TrendingUp },
      { href: '/dashboard/sync-health', label: 'Sync Health', icon: HeartPulse },
      { href: '/dashboard/translation-coverage', label: 'Translation Coverage', icon: Languages },
      { href: '/dashboard/data-freshness', label: 'Data Freshness', icon: Clock },
      { href: '/dashboard/traffic', label: 'Traffic & SEO', icon: BarChart3 },
    ],
  },
  {
    label: 'Community',
    items: [
      { href: '/dashboard/edits', label: 'Feedback Loop', icon: HelpCircle },
      { href: '/dashboard/users', label: 'Users', icon: Users },
      { href: '/dashboard/promotions', label: 'Promotions', icon: Megaphone },
      { href: '/dashboard/linkedin', label: 'LinkedIn', icon: Linkedin },
    ],
  },
  {
    label: 'Settings',
    items: [
      { href: '/dashboard/site-config', label: 'Site Config', icon: Settings },
      { href: '/dashboard/preferences', label: 'Content Preferences', icon: SlidersHorizontal },
      { href: '/dashboard/utilities', label: 'Utilities', icon: Wrench },
    ],
  },
  {
    label: 'Help',
    items: [
      { href: '/dashboard/tools-guides', label: 'Tools & Guides', icon: BookMarked },
      { href: '/dashboard/manual', label: 'User Manual', icon: HelpCircle },
      { href: '/dashboard/sitemap', label: 'Sitemap & Wireframe', icon: MapPin },
    ],
  },
]

const PARTNER_GROUPS: NavGroup[] = [
  {
    label: 'My Organization',
    defaultOpen: true,
    items: [
      { href: '/dashboard/partner', label: 'Overview', icon: LayoutDashboard },
      { href: '/dashboard/partner/organization', label: 'Profile', icon: Building2 },
      { href: '/dashboard/partner/guides', label: 'My Guides', icon: BookOpen },
      { href: '/dashboard/partner/events', label: 'My Events', icon: CalendarDays },
    ],
  },
  {
    label: 'Explore',
    items: [
      { href: '/dashboard/pipeline', label: 'Pipeline', icon: Zap },
      { href: '/dashboard/library', label: 'Knowledge Base', icon: BookOpen },
    ],
  },
  {
    label: 'Settings',
    items: [
      { href: '/dashboard/preferences', label: 'Content Preferences', icon: SlidersHorizontal },
    ],
  },
  {
    label: 'Help',
    items: [
      { href: '/dashboard/tools-guides', label: 'Tools & Guides', icon: BookMarked },
      { href: '/dashboard/manual', label: 'User Manual', icon: HelpCircle },
    ],
  },
]

const NEIGHBOR_GROUPS: NavGroup[] = [
  {
    label: 'Dashboard',
    defaultOpen: true,
    items: [
      { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
      { href: '/dashboard/submit', label: 'Submit Content', icon: FileText },
      { href: '/dashboard/library', label: 'Knowledge Base', icon: BookOpen },
      { href: '/dashboard/preferences', label: 'Content Preferences', icon: SlidersHorizontal },
    ],
  },
  {
    label: 'Help',
    items: [
      { href: '/dashboard/tools-guides', label: 'Tools & Guides', icon: BookMarked },
      { href: '/dashboard/manual', label: 'User Manual', icon: HelpCircle },
    ],
  },
]

interface SidebarProps {
  pipelineStats: PipelineStats
  role?: string
  orgName?: string | null
  pendingRequestCount?: number
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function Sidebar({ pipelineStats, role = 'admin', orgName, pendingRequestCount = 0, mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname()

  const groups = role === 'partner'
    ? PARTNER_GROUPS
    : role === 'neighbor'
      ? NEIGHBOR_GROUPS
      : ADMIN_GROUPS

  const portalLabel = role === 'partner'
    ? 'Partner Portal'
    : role === 'neighbor'
      ? 'Neighbor Portal'
      : 'Pipeline Admin'

  const isActive = (href: string) => {
    if (href === '/dashboard' || href === '/dashboard/partner') return pathname === href
    return pathname.startsWith(href)
  }

  // Check if any item in group is active
  const groupHasActive = (group: NavGroup) => {
    return group.items.some(item => isActive(item.href))
  }

  return (
    <aside
      className={'fixed left-0 top-0 bottom-0 w-60 text-white flex flex-col z-40 transition-transform duration-200 md:translate-x-0 ' + (mobileOpen ? 'translate-x-0' : '-translate-x-full')}
      style={{ background: '#1a1714' }}
    >
      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Link href={role === 'partner' ? '/dashboard/partner' : '/dashboard'} className="block">
          <h1 className="font-display text-lg font-bold tracking-tight">The Change Engine</h1>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{portalLabel}</p>
          {role === 'partner' && orgName && (
            <p className="text-xs mt-1 truncate" style={{ color: '#C75B2A' }}>{orgName}</p>
          )}
        </Link>
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 py-3 px-3 overflow-y-auto space-y-1">
        {groups.map(function (group) {
          return (
            <NavGroupSection
              key={group.label}
              group={group}
              isActive={isActive}
              pendingRequestCount={pendingRequestCount}
              onNavClick={onMobileClose}
            />
          )
        })}
      </nav>

      {/* Pipeline Mini Status (admin only) */}
      {role === 'admin' && (
        <div className="px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-xs text-white/40 uppercase tracking-wide mb-2">Pipeline</p>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-blue-300 font-medium">{pipelineStats.totalIngested}</span>
            <span className="text-white/30">&rarr;</span>
            <span className="text-yellow-300 font-medium">{pipelineStats.needsReview}</span>
            <span className="text-white/30">&rarr;</span>
            <span className="text-green-300 font-medium">{pipelineStats.published}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-white/30 mt-0.5">
            <span>inbox</span>
            <span></span>
            <span>review</span>
            <span></span>
            <span>published</span>
          </div>
        </div>
      )}
    </aside>
  )
}

function NavGroupSection({ group, isActive, pendingRequestCount, onNavClick }: {
  group: NavGroup
  isActive: (href: string) => boolean
  pendingRequestCount: number
  onNavClick?: () => void
}) {
  const hasActive = group.items.some(item => isActive(item.href))
  const [open, setOpen] = useState(group.defaultOpen || hasActive)

  return (
    <div>
      <button
        onClick={function () { setOpen(!open) }}
        aria-expanded={open}
        className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider text-white/40 hover:text-white/60 transition-colors"
      >
        {group.label}
        <ChevronDown
          size={12}
          className={'transition-transform ' + (open ? 'rotate-0' : '-rotate-90')}
        />
      </button>
      {open && (
        <div className="space-y-0.5 mt-0.5 mb-2">
          {group.items.map(function (item) {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavClick}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors"
                style={isActive(item.href)
                  ? { background: 'rgba(199,91,42,0.15)', color: '#C75B2A', fontWeight: 500 }
                  : { color: 'rgba(255,255,255,0.7)' }
                }
              >
                <Icon size={15} className="flex-shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                {item.href === '/dashboard/users' && pendingRequestCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
                    {pendingRequestCount}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
