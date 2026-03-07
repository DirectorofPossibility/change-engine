'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { PipelineStats } from '@/lib/types/dashboard'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Search, FileText, Zap, BarChart3,
  Languages, Wrench, Users, BookOpen, HelpCircle,
  Briefcase, CalendarDays, Building2, Globe,
  LogOut, Compass, BookMarked, Quote, Library,
  ChevronDown, Rss, Scale, Megaphone, Key,
  Tag, Network, Linkedin, CircleDot, Map,
  Settings, Layers,
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
      { href: '/dashboard/review', label: 'Review Queue', icon: Search },
      { href: '/dashboard/content', label: 'Published Content', icon: FileText },
      { href: '/dashboard/policies', label: 'Policies', icon: Scale },
      { href: '/dashboard/ingestion', label: 'Ingestion', icon: Zap },
      { href: '/dashboard/feeds', label: 'RSS Feeds', icon: Rss },
      { href: '/dashboard/translations', label: 'Translations', icon: Languages },
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
      { href: '/dashboard/graphs', label: 'Graph Views', icon: BarChart3 },
      { href: '/dashboard/graph-explorer', label: 'Graph Explorer', icon: Network },
      { href: '/dashboard/graph-coverage', label: 'Coverage Map', icon: Map },
      { href: '/dashboard/circles', label: 'Circle Graph', icon: CircleDot },
      { href: '/dashboard/fidelity', label: 'Fidelity Check', icon: Layers },
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
      { href: '/dashboard/api-keys', label: 'API Keys', icon: Key },
      { href: '/dashboard/utilities', label: 'Utilities', icon: Wrench },
      { href: '/dashboard/pipeline', label: 'Pipeline Status', icon: Settings },
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
      { href: '/dashboard/graphs', label: 'Graphs', icon: BarChart3 },
      { href: '/dashboard/library', label: 'Knowledge Base', icon: BookOpen },
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
}

export function Sidebar({ pipelineStats, role = 'admin', orgName, pendingRequestCount = 0 }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

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

  function handleSignOut() {
    const supabase = createClient()
    supabase.auth.signOut().then(function () {
      router.push('/login')
      router.refresh()
    })
  }

  const isActive = (href: string) => {
    if (href === '/dashboard' || href === '/dashboard/partner') return pathname === href
    return pathname.startsWith(href)
  }

  // Check if any item in group is active
  const groupHasActive = (group: NavGroup) => {
    return group.items.some(item => isActive(item.href))
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-sidebar-bg text-white flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <Link href={role === 'partner' ? '/dashboard/partner' : '/dashboard'} className="block">
          <h1 className="text-lg font-bold tracking-tight">THE CHANGE LAB</h1>
          <p className="text-xs text-white/50 mt-0.5">{portalLabel}</p>
          {role === 'partner' && orgName && (
            <p className="text-xs text-brand-accent mt-1 truncate">{orgName}</p>
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
            />
          )
        })}
      </nav>

      {/* Sign Out + Exchange Link */}
      <div className="px-3 py-3 border-t border-white/10 space-y-1">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-white/70 hover:bg-sidebar-hover hover:text-white"
        >
          <Globe size={16} className="flex-shrink-0" />
          <span>View Site</span>
        </Link>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-white/70 hover:bg-red-600/20 hover:text-red-300"
        >
          <LogOut size={16} className="flex-shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Pipeline Mini Status (admin only) */}
      {role === 'admin' && (
        <div className="px-5 py-4 border-t border-white/10">
          <p className="text-xs text-white/40 uppercase tracking-wide mb-2">Pipeline</p>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-blue-300 font-medium">{pipelineStats.totalIngested}</span>
            <span className="text-white/30">&rarr;</span>
            <span className="text-yellow-300 font-medium">{pipelineStats.needsReview}</span>
            <span className="text-white/30">&rarr;</span>
            <span className="text-green-300 font-medium">{pipelineStats.published}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-white/30 mt-0.5">
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

function NavGroupSection({ group, isActive, pendingRequestCount }: {
  group: NavGroup
  isActive: (href: string) => boolean
  pendingRequestCount: number
}) {
  const hasActive = group.items.some(item => isActive(item.href))
  const [open, setOpen] = useState(group.defaultOpen || hasActive)

  return (
    <div>
      <button
        onClick={function () { setOpen(!open) }}
        className="flex items-center justify-between w-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/40 hover:text-white/60 transition-colors"
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
                className={'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ' +
                  (isActive(item.href)
                    ? 'bg-sidebar-active text-white font-medium'
                    : 'text-white/70 hover:bg-sidebar-hover hover:text-white')
                }
              >
                <Icon size={15} className="flex-shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                {item.href === '/dashboard/users' && pendingRequestCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
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
