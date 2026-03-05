'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { PipelineStats } from '@/lib/types/dashboard'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Search, FileText, Zap, BarChart3,
  Languages, Wrench, Users, BookOpen, HelpCircle,
  Briefcase, CalendarDays, Building2, Globe,
  LogOut, Compass, BookMarked,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

const ADMIN_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/review', label: 'Review', icon: Search },
  { href: '/dashboard/content', label: 'Content', icon: FileText },
  { href: '/dashboard/pipeline', label: 'Pipeline', icon: Zap },
  { href: '/dashboard/graphs', label: 'Graphs', icon: BarChart3 },
  { href: '/dashboard/utilities', label: 'Utilities', icon: Wrench },
  { href: '/dashboard/users', label: 'Users', icon: Users },
  { href: '/dashboard/library', label: 'Library', icon: BookOpen },
  { href: '/dashboard/tools-guides', label: 'Tools & Guides', icon: BookMarked },
  { href: '/dashboard/manual', label: 'Users Manual', icon: HelpCircle },
]

const PARTNER_NAV: NavItem[] = [
  { href: '/dashboard/partner', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/partner/guides', label: 'My Guides', icon: BookOpen },
  { href: '/dashboard/partner/events', label: 'My Events', icon: CalendarDays },
  { href: '/dashboard/partner/organization', label: 'My Organization', icon: Building2 },
  { href: '/dashboard/pipeline', label: 'Pipeline', icon: Zap },
  { href: '/dashboard/graphs', label: 'Graphs', icon: BarChart3 },
  { href: '/dashboard/tools-guides', label: 'Tools & Guides', icon: BookMarked },
  { href: '/dashboard/library', label: 'Knowledge Base', icon: BookOpen },
  { href: '/dashboard/manual', label: 'Users Manual', icon: HelpCircle },
]

const NEIGHBOR_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/submit', label: 'Submit Content', icon: FileText },
  { href: '/dashboard/library', label: 'Knowledge Base', icon: BookOpen },
  { href: '/dashboard/tools-guides', label: 'Tools & Guides', icon: BookMarked },
  { href: '/dashboard/manual', label: 'Users Manual', icon: HelpCircle },
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

  const navItems = role === 'partner'
    ? PARTNER_NAV
    : role === 'neighbor'
      ? NEIGHBOR_NAV
      : ADMIN_NAV

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

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-sidebar-bg text-white flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/10">
        <Link href={role === 'partner' ? '/dashboard/partner' : '/dashboard'} className="block">
          <h1 className="text-lg font-bold tracking-tight">THE CHANGE LAB</h1>
          <p className="text-xs text-white/50 mt-0.5">{portalLabel}</p>
          {role === 'partner' && orgName && (
            <p className="text-xs text-brand-accent mt-1 truncate">{orgName}</p>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                isActive(item.href)
                  ? 'bg-sidebar-active text-white font-medium'
                  : 'text-white/70 hover:bg-sidebar-hover hover:text-white'
              }`}
            >
              <Icon size={16} className="flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.href === '/dashboard/users' && pendingRequestCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {pendingRequestCount}
                </span>
              )}
            </Link>
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
