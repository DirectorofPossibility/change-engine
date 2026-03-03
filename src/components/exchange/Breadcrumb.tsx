import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-brand-muted py-3 overflow-x-auto">
      <Link href="/" className="flex items-center gap-1 hover:text-brand-text transition-colors flex-shrink-0">
        <Home size={14} />
        <span className="sr-only">Home</span>
      </Link>
      {items.map(function (item, i) {
        const isLast = i === items.length - 1
        return (
          <span key={i} className="flex items-center gap-1.5 min-w-0">
            <ChevronRight size={12} className="text-brand-muted/50 flex-shrink-0" />
            {isLast || !item.href ? (
              <span className="font-medium text-brand-text truncate">{item.label}</span>
            ) : (
              <Link href={item.href} className="hover:text-brand-text transition-colors truncate">
                {item.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
