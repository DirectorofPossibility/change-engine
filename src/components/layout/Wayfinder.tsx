'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from '@/lib/use-translation'

interface WayfinderCrumb {
  label: string
  href?: string
  here?: boolean
}

interface WayfinderProps {
  crumbs?: WayfinderCrumb[]
  trailLevel?: number
  trailLabel?: string
}

/**
 * Wayfinder — dark breadcrumb bar that appears below the site nav.
 * Matches the .wayfinder spec from change-engine-page-system.html.
 *
 * If no crumbs are passed, it reads the current pathname to build
 * a basic breadcrumb trail automatically.
 */
export function Wayfinder({ crumbs, trailLevel = 0, trailLabel }: WayfinderProps) {
  const pathname = usePathname()
  const { t } = useTranslation()

  // Auto-generate crumbs from pathname if none provided
  const breadcrumbs = crumbs ?? generateCrumbs(pathname, t('wayfinder.guide'))
  const label = trailLabel ?? t('wayfinder.trail_depth') ?? 'Trail depth'

  return (
    <div className="bg-ink" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="max-w-[1080px] mx-auto px-6 flex items-stretch flex-wrap">
        {/* Breadcrumb strip */}
        <div
          className="flex items-center flex-1 min-w-0 overflow-x-auto scrollbar-hide"
          style={{ borderRight: '1px solid rgba(255,255,255,0.08)' }}
        >
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center">
              {i > 0 && (
                <span
                  className="text-[.65rem] px-0.5"
                  style={{ color: 'rgba(255,255,255,0.15)' }}
                >
                  ›
                </span>
              )}
              {crumb.href && !crumb.here ? (
                <Link
                  href={crumb.href}
                  className="font-mono text-[.62rem] uppercase tracking-[0.06em] whitespace-nowrap px-3 py-[0.7rem] transition-colors"
                  style={{
                    color: 'rgba(255,255,255,0.35)',
                    borderBottom: '2px solid transparent',
                  }}
                  onMouseEnter={e => { (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.65)' }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.35)' }}
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  className="font-mono text-[.62rem] uppercase tracking-[0.06em] whitespace-nowrap px-3 py-[0.7rem]"
                  style={{
                    color: crumb.here ? '#7ec8e3' : 'rgba(255,255,255,0.35)',
                    borderBottom: crumb.here ? '2px solid #7ec8e3' : '2px solid transparent',
                  }}
                >
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </div>

        {/* Trail level indicator */}
        <div className="flex items-center gap-2 px-4 py-[0.7rem]">
          <span
            className="font-mono text-[.56rem] uppercase tracking-[0.12em] whitespace-nowrap"
            style={{ color: 'rgba(255,255,255,0.25)' }}
          >
            {label}
          </span>
          <div className="flex gap-[3px]">
            {[1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                className="w-[7px] h-[7px] rounded-full"
                style={{
                  background: i <= trailLevel ? '#7ec8e3' : 'rgba(255,255,255,0.15)',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function generateCrumbs(pathname: string | null, guideLabel = 'Guide'): WayfinderCrumb[] {
  if (!pathname) return [{ label: guideLabel, href: '/', here: true }]

  const segments = pathname.split('/').filter(Boolean)
  const crumbs: WayfinderCrumb[] = [{ label: guideLabel, href: '/' }]

  let path = ''
  segments.forEach((seg, i) => {
    path += '/' + seg
    const label = seg
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
    crumbs.push({
      label,
      href: path,
      here: i === segments.length - 1,
    })
  })

  return crumbs
}
