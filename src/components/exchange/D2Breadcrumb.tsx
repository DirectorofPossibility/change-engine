import Link from 'next/link'

interface Crumb {
  label: string
  href?: string
}

interface D2BreadcrumbProps {
  crumbs: Crumb[]
}

export function D2Breadcrumb({ crumbs }: D2BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="max-w-[1200px] mx-auto px-8 py-3"
    >
      <ol className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-brand-muted-light">
        <li>
          <Link href="/" className="hover:text-brand-accent transition-colors">
            Home
          </Link>
        </li>
        {crumbs.map(function (crumb, i) {
          const isLast = i === crumbs.length - 1
          return (
            <li key={i} className="flex items-center gap-1.5">
              <span className="text-brand-border" aria-hidden="true">/</span>
              {isLast || !crumb.href ? (
                <span className="text-brand-muted">{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="hover:text-brand-accent transition-colors">
                  {crumb.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
