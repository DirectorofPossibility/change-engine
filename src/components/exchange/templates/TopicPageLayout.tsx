/**
 * @fileoverview Topic/Pathway page template — inspired by Greater Good Magazine topic pages.
 *
 * Structure:
 *   - Topic header with title, description, and accent color
 *   - Two-column layout: main content (articles) + sidebar (definition box, related quizzes, newsletter)
 *   - Filter tabs: Most Recent / Most Popular
 *   - Load-more pagination
 *
 * @see https://greatergood.berkeley.edu/topic/happiness for reference pattern
 */

import type { ReactNode } from 'react'
import Link from 'next/link'

interface TopicPageLayoutProps {
  /** Topic/pathway name */
  title: string
  /** Topic description or definition */
  description?: string | null
  /** Accent color for the topic */
  color: string
  /** Optional eyebrow text above title */
  eyebrow?: string
  /** Optional breadcrumb trail */
  breadcrumbs?: { label: string; href?: string }[]
  /** Stats to show in header (e.g. "2,400 resources") */
  stats?: { value: string | number; label: string }[]
  /** Main content area — typically a filtered article/card grid */
  children: ReactNode
  /** Sidebar content — definition box, related links, newsletter */
  sidebar?: ReactNode
  /** Optional footer section below the grid */
  footer?: ReactNode
}

export function TopicPageLayout({
  title,
  description,
  color,
  eyebrow,
  breadcrumbs,
  stats,
  children,
  sidebar,
  footer,
}: TopicPageLayoutProps) {
  return (
    <div className="min-h-screen" style={{ background: '#ffffff' }}>
      {/* ── TOPIC HEADER ── */}
      <section
        className="w-full"
        style={{ borderBottom: `3px solid ${color}` }}
      >
        <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-1.5 text-xs text-faint mb-4" aria-label="Breadcrumb">
              {breadcrumbs.map((bc, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-rule">/</span>}
                  {bc.href ? (
                    <Link href={bc.href} className="hover:text-ink transition-colors">{bc.label}</Link>
                  ) : (
                    <span className="text-muted">{bc.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}

          {/* Eyebrow */}
          {eyebrow && (
            <p className="font-mono text-xs uppercase tracking-[0.2em] mb-2" style={{ color }}>
              {eyebrow}
            </p>
          )}

          {/* Title */}
          <h1
            className="font-display leading-tight mb-3"
            style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, color: '#0d1117' }}
          >
            {title}
          </h1>

          {/* Description */}
          {description && (
            <p className="text-[15px] leading-relaxed max-w-2xl" style={{ color: '#5c6474' }}>
              {description}
            </p>
          )}

          {/* Stats row */}
          {stats && stats.length > 0 && (
            <div className="flex items-center gap-5 mt-4 flex-wrap">
              {stats.map((stat, i) => (
                <div key={i} className="flex items-baseline gap-1.5">
                  <span className="font-display text-xl font-bold" style={{ color: '#0d1117' }}>
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </span>
                  <span className="text-xs" style={{ color: '#5c6474' }}>{stat.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── TWO-COLUMN BODY ── */}
      <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`grid grid-cols-1 ${sidebar ? 'lg:grid-cols-[1fr_300px]' : ''} gap-8`}>
          {/* Main content */}
          <div className="min-w-0">
            {children}
          </div>

          {/* Sidebar */}
          {sidebar && (
            <aside className="space-y-6">
              {sidebar}
            </aside>
          )}
        </div>
      </div>

      {/* ── FOOTER ── */}
      {footer && (
        <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          {footer}
        </div>
      )}
    </div>
  )
}
