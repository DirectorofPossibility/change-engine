'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Heart, Compass, User } from 'lucide-react'

const navItems = [
  { href: '/exchange', label: 'Home', icon: Home },
  { href: '/help', label: 'Help', icon: Heart },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/compass', label: 'Explore', icon: Compass },
  { href: '/me', label: 'Account', icon: User },
]

export default function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-sm border-t border-rule pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="flex items-center justify-around h-14">
        {navItems.map(function ({ href, label, icon: Icon }) {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 transition-colors ${
                isActive ? 'text-blue' : 'text-muted'
              }`}
            >
              <Icon size={20} />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
