'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Globe, LogOut, FileText, Search,
} from 'lucide-react'

interface DashboardHeaderProps {
  displayName: string
  role: string
  orgName?: string | null
  reviewCount?: number
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  partner: 'Partner',
  neighbor: 'Neighbor',
}

export function DashboardHeader({ displayName, role, orgName, reviewCount = 0 }: DashboardHeaderProps) {
  const router = useRouter()

  function handleSignOut() {
    const supabase = createClient()
    supabase.auth.signOut().then(function () {
      router.push('/login')
      router.refresh()
    })
  }

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-brand-border">
      <div className="flex items-center justify-between h-14 px-6">
        {/* Left: greeting + role */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm font-medium text-brand-text truncate">
            {displayName}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-accent/10 text-brand-accent whitespace-nowrap">
            {ROLE_LABELS[role] || role}
          </span>
          {orgName && (
            <span className="text-xs text-brand-muted truncate hidden sm:inline">
              {orgName}
            </span>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1">
          {role === 'admin' && reviewCount > 0 && (
            <Link
              href="/dashboard/review"
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-brand-muted hover:bg-brand-bg-alt hover:text-brand-text transition-colors"
            >
              <Search size={15} />
              <span className="hidden md:inline">Review</span>
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                {reviewCount}
              </span>
            </Link>
          )}

          <Link
            href="/dashboard/submit"
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-brand-muted hover:bg-brand-bg-alt hover:text-brand-text transition-colors"
          >
            <FileText size={15} />
            <span className="hidden md:inline">Submit</span>
          </Link>

          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-brand-muted hover:bg-brand-bg-alt hover:text-brand-text transition-colors"
          >
            <Globe size={15} />
            <span className="hidden md:inline">View Site</span>
          </Link>

          <div className="w-px h-5 bg-brand-border mx-1" />

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
