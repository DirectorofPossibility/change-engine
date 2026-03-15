import Link from 'next/link'

interface HomeIndexProps {
  stats: {
    services: number
    organizations: number
    officials: number
    policies: number
    opportunities: number
    elections: number
    newsCount: number
  }
}

const INDEX_ITEMS = [
  { label: 'Services & Resources', key: 'services' as const, href: '/services' },
  { label: 'Organizations', key: 'organizations' as const, href: '/organizations' },
  { label: 'Elected Officials', key: 'officials' as const, href: '/officials' },
  { label: 'Policies & Legislation', key: 'policies' as const, href: '/policies' },
  { label: 'Opportunities', key: 'opportunities' as const, href: '/opportunities' },
  { label: 'Elections', key: 'elections' as const, href: '/elections', suffix: ' tracked' },
  { label: 'News & Articles', key: 'newsCount' as const, href: '/news' },
]

export function HomeIndex({ stats }: HomeIndexProps) {
  return (
    <section className="bg-paper">
      <div className="max-w-[720px] mx-auto px-6 py-16">
        <p className="font-mono text-xs tracking-[0.14em] text-blue uppercase mb-1.5">
          The index
        </p>
        <p className="font-display text-[clamp(20px,3vw,28px)] leading-snug mb-8">
          Everything in this guide.
        </p>

        {INDEX_ITEMS.map(function (item, i) {
          const count = stats[item.key]
          return (
            <Link
              key={item.href}
              href={item.href}
              className={'group flex items-baseline gap-3 py-3' + (i < INDEX_ITEMS.length - 1 ? ' border-b border-clay/10' : '')}
            >
              <span className="font-body text-[17px] shrink-0 group-hover:text-blue transition-colors">
                {item.label}
              </span>
              <span className="flex-1 border-b border-dotted border-muted/25 min-w-[20px]" />
              <span className="font-body text-[13px] text-muted shrink-0">
                {typeof count === 'number' ? count.toLocaleString() : count}{item.suffix || ''}
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
