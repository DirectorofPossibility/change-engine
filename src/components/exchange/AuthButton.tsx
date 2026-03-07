'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, LogOut, Settings, LayoutDashboard } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function AuthButton() {
  const [user, setUser] = useState<{ email?: string } | null>(null)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(function () {
    const supabase = createClient()
    supabase.auth.getUser().then(function ({ data }) {
      setUser(data.user)
    })
  }, [])

  useEffect(function () {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return function () { document.removeEventListener('mousedown', handleClick) }
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setOpen(false)
    router.push('/')
    router.refresh()
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="text-xs text-brand-text hover:text-brand-accent transition-colors px-2 py-1 border-2 border-brand-border rounded-lg"
      >
        Sign In
      </Link>
    )
  }

  const initial = user.email ? user.email.charAt(0).toUpperCase() : 'U'

  return (
    <div ref={ref} className="relative">
      <button
        onClick={function () { setOpen(!open) }}
        className="w-7 h-7 rounded-full bg-brand-accent text-white text-xs font-medium flex items-center justify-center hover:opacity-90 transition-opacity"
        aria-label="User menu"
      >
        {initial}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg border-2 border-brand-border shadow-lg py-1 z-50">
          <p className="px-3 py-2 text-xs text-brand-muted truncate border-b border-brand-border">
            {user.email}
          </p>
          <Link
            href="/me"
            className="flex items-center gap-2 px-3 py-2 text-sm text-brand-text hover:bg-brand-bg"
            onClick={function () { setOpen(false) }}
          >
            <User size={14} /> My Dashboard
          </Link>
          <Link
            href="/me/settings"
            className="flex items-center gap-2 px-3 py-2 text-sm text-brand-text hover:bg-brand-bg"
            onClick={function () { setOpen(false) }}
          >
            <Settings size={14} /> Settings
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 text-sm text-brand-text hover:bg-brand-bg"
            onClick={function () { setOpen(false) }}
          >
            <LayoutDashboard size={14} /> Admin
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      )}
    </div>
  )
}
