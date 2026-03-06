import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  /** Use 'dark' when breadcrumb is on a dark background */
  variant?: 'light' | 'dark'
}

export function Breadcrumb({ items, variant = 'light' }: BreadcrumbProps) {
  const isDark = variant === 'dark'
  const baseColor = isDark ? 'text-white/40' : 'text-brand-muted'
  const activeColor = isDark ? 'text-white/70' : 'text-brand-text'
  const chevronColor = isDark ? 'text-white/20' : 'text-brand-muted/50'
  const hoverColor = isDark ? 'hover:text-white/60' : 'hover:text-brand-text'

  return (
    <nav aria-label="Breadcrumb" className={`flex items-center gap-1.5 text-sm ${baseColor} py-3 overflow-x-auto`}>
      <Link href="/" className={`flex items-center gap-1 ${hoverColor} transition-colors flex-shrink-0`}>
        <Home size={14} />
        <span className="sr-only">Home</span>
      </Link>
      {items.map(function (item, i) {
        const isLast = i === items.length - 1
        return (
          <span key={i} className="flex items-center gap-1.5 min-w-0">
            <ChevronRight size={12} className={`${chevronColor} flex-shrink-0`} />
            {isLast || !item.href ? (
              <span className={`font-medium ${activeColor} truncate`}>{item.label}</span>
            ) : (
              <Link href={item.href} className={`${hoverColor} transition-colors truncate`}>
                {item.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
