'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LanguageSwitcher } from '@/components/exchange/LanguageSwitcher'
import {
  Globe, LogOut, FileText, Search, Menu,
} from 'lucide-react'

interface DashboardHeaderProps {
  displayName: string
  role: string
  orgName?: string | null
  reviewCount?: number
  onMenuToggle?: () => void
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  partner: 'Partner',
  neighbor: 'Neighbor',
}

export function DashboardHeader({ displayName, role, orgName, reviewCount = 0, onMenuToggle }: DashboardHeaderProps) {
  const router = useRouter()

  function handleSignOut() {
    const supabase = createClient()
    supabase.auth.signOut().then(function () {
      router.push('/login')
      router.refresh()
    })
  }

  return (
    <header className="sticky top-0 z-20" style={{ background: '#FAF8F5', borderBottom: '1px solid #E8E4DF' }}>
      <div className="flex items-center justify-between h-14 px-4 md:px-6">
        {/* Left: hamburger + greeting + role */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuToggle}
            className="md:hidden p-1.5 rounded-md hover:bg-black/5 transition-colors"
            aria-label="Toggle menu"
          >
            <Menu size={20} style={{ color: '#1a1714' }} />
          </button>
          <span className="text-sm font-medium truncate hidden sm:block" style={{ color: '#1a1714' }}>
            {displayName}
          </span>
          <span className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: 'rgba(199,91,42,0.1)', color: '#C75B2A' }}>
            {ROLE_LABELS[role] || role}
          </span>
          {orgName && (
            <span className="text-xs truncate hidden sm:inline" style={{ color: '#5c6474' }}>
              {orgName}
            </span>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1">
          {role === 'admin' && reviewCount > 0 && (
            <Link
              href="/dashboard/review"
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors"
              style={{ color: '#5c6474' }}
            >
              <Search size={15} />
              <span className="hidden md:inline">Review</span>
              <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
                {reviewCount}
              </span>
            </Link>
          )}

          <Link
            href="/dashboard/submit"
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors hidden sm:flex"
            style={{ color: '#5c6474' }}
          >
            <FileText size={15} />
            <span className="hidden md:inline">Submit</span>
          </Link>

          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors hidden sm:flex"
            style={{ color: '#5c6474' }}
          >
            <Globe size={15} />
            <span className="hidden md:inline">View Site</span>
          </Link>

          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>

          <div className="w-px h-5 mx-1" style={{ background: '#E8E4DF' }} />

          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-brand-muted hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={15} />
            <span className="hidden md:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  )
}
