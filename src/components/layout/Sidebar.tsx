'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { PipelineStats } from '@/lib/types/dashboard'
import { createClient } from '@/lib/supabase/client'

const ADMIN_NAV = [
  { href: '/dashboard', label: 'Overview', icon: '📊' },
  { href: '/dashboard/review', label: 'Review', icon: '🔍' },
  { href: '/dashboard/content', label: 'Content', icon: '📄' },
  { href: '/dashboard/ingestion', label: 'Ingestion', icon: '⚡' },
  { href: '/dashboard/api-keys', label: 'API Keys', icon: '🔑' },
  { href: '/dashboard/submit', label: 'Submit', icon: '➕' },
  { href: '/dashboard/translations', label: 'Translations', icon: '🌐' },
  { href: '/dashboard/taxonomy', label: 'Taxonomy', icon: '🗂️' },
  { href: '/dashboard/knowledge-graph', label: 'Knowledge Graph', icon: '🌌' },
  { href: '/dashboard/circles', label: 'Circle Graph', icon: '⭕' },
  { href: '/dashboard/users', label: 'Users', icon: '👤' },
  { href: '/dashboard/manual', label: 'Users Manual', icon: '📘' },
]

const PARTNER_NAV = [
  { href: '/dashboard/partner', label: 'Overview', icon: '📊' },
  { href: '/dashboard/partner/guides', label: 'My Guides', icon: '📖' },
  { href: '/dashboard/partner/events', label: 'My Events', icon: '📅' },
  { href: '/dashboard/partner/organization', label: 'My Organization', icon: '🏢' },
  { href: '/dashboard/manual', label: 'Users Manual', icon: '📘' },
]

interface SidebarProps {
  pipelineStats: PipelineStats
  role?: string
  orgName?: string | null
}

export function Sidebar({ pipelineStats, role = 'admin', orgName }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const navItems = role === 'partner' ? PARTNER_NAV : ADMIN_NAV

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
          <p className="text-xs text-white/50 mt-0.5">
            {role === 'partner' ? 'Partner Portal' : 'Pipeline Admin'}
          </p>
          {role === 'partner' && orgName && (
            <p className="text-xs text-brand-accent mt-1 truncate">{orgName}</p>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
              isActive(item.href)
                ? 'bg-sidebar-active text-white font-medium'
                : 'text-white/70 hover:bg-sidebar-hover hover:text-white'
            }`}
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Sign Out + Exchange Link */}
      <div className="px-3 py-3 border-t border-white/10 space-y-1">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-white/70 hover:bg-sidebar-hover hover:text-white"
        >
          <span className="text-base">🌐</span>
          <span>View Site</span>
        </Link>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-white/70 hover:bg-red-600/20 hover:text-red-300"
        >
          <span className="text-base">🚪</span>
          <span>Sign Out</span>
        </button>
      </div>

      {/* Pipeline Mini Status (admin only) */}
      {role === 'admin' && (
        <div className="px-5 py-4 border-t border-white/10">
          <p className="text-xs text-white/40 uppercase tracking-wide mb-2">Pipeline</p>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-blue-300 font-medium">{pipelineStats.totalIngested}</span>
            <span className="text-white/30">→</span>
            <span className="text-yellow-300 font-medium">{pipelineStats.needsReview}</span>
            <span className="text-white/30">→</span>
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
