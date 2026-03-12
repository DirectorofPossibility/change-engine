import type { ReactNode } from 'react'
import { DetailWayfinder } from './DetailWayfinder'
import { TranslatePageButton } from './TranslatePageButton'
import { ShareButtons } from './ShareButtons'
import { FeedbackLoop } from './FeedbackLoop'
import { FlowerOfLife } from '@/components/geo/sacred'
import { Breadcrumb } from './Breadcrumb'

/**
 * DetailPageLayout — shared template for all entity detail pages.
 *
 * Provides the standard masthead (2/3 hero + 1/3 wayfinder + FOL),
 * 2-column body grid, and sidebar with mobile wayfinder fallback.
 */

interface EyebrowItem {
  text: string
  bgColor?: string // defaults to '#0d1117' (ink)
  textColor?: string // defaults to '#ffffff'
}

interface BreadcrumbItem {
  label: string
  href?: string
}

interface DetailPageLayoutProps {
  // Page background
  bgColor?: string

  // Breadcrumb
  breadcrumbs?: BreadcrumbItem[]

  // Masthead — left column
  eyebrow?: EyebrowItem
  eyebrowMeta?: ReactNode // additional inline meta after pill
  title: string
  subtitle?: string | null // mission statement, summary, etc.
  heroImage?: ReactNode // image component or null
  metaRow?: ReactNode // date, quick facts, inline items
  actions?: {
    translate?: { isTranslated: boolean; contentType: string; contentId: string }
    share?: { title?: string; url: string; via?: string }
  }

  // Masthead — styling
  mastheadBorderTop?: string // e.g. '3px solid #color' for policies
  mastheadBorderLeft?: string // e.g. '4px solid #b03a2a' for active policies

  // Right column
  themeColor?: string // FOL color, defaults to '#1b5e8a'
  wayfinderData: any
  wayfinderType: string // 'content' | 'organization' | 'policy' etc.
  wayfinderEntityId: string
  userRole?: string | null

  // Body
  children: ReactNode // main content column
  sidebar?: ReactNode // sidebar content (below wayfinder on mobile)

  // Footer sections (below the grid)
  footer?: ReactNode

  // Feedback
  feedbackType?: string
  feedbackId?: string
  feedbackName?: string

  // JSON-LD
  jsonLd?: object
}

export function DetailPageLayout({
  bgColor = '#f4f5f7',
  breadcrumbs,
  eyebrow,
  eyebrowMeta,
  title,
  subtitle,
  heroImage,
  metaRow,
  actions,
  mastheadBorderTop,
  mastheadBorderLeft,
  themeColor = '#1b5e8a',
  wayfinderData,
  wayfinderType,
  wayfinderEntityId,
  userRole,
  children,
  sidebar,
  footer,
  feedbackType,
  feedbackId,
  feedbackName,
  jsonLd,
}: DetailPageLayoutProps) {
  return (
    <div style={{ background: bgColor }}>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}

      {/* ── MASTHEAD ── */}
      <header style={{
        background: '#ffffff',
        borderBottom: '2px solid #0d1117',
        borderTop: mastheadBorderTop || 'none',
        borderLeft: mastheadBorderLeft || 'none',
      }}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div className="mb-4">
              <Breadcrumb items={breadcrumbs} />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-0">
            {/* Left: Hero content (2/3) */}
            <div className="pr-0 lg:pr-8">
              {/* Eyebrow */}
              {(eyebrow || eyebrowMeta) && (
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  {eyebrow && (
                    <span
                      className="font-mono uppercase tracking-[0.2em] text-[0.58rem] px-3 py-1"
                      style={{
                        background: eyebrow.bgColor || '#0d1117',
                        color: eyebrow.textColor || '#ffffff',
                      }}
                    >
                      {eyebrow.text}
                    </span>
                  )}
                  {eyebrowMeta}
                </div>
              )}

              {/* Title */}
              <h1
                className="font-display leading-[1.15] mb-3"
                style={{ fontSize: 'clamp(1.6rem, 4vw, 2.8rem)', color: '#0d1117', fontWeight: 900 }}
              >
                {title}
              </h1>

              {/* Subtitle */}
              {subtitle && (
                <p className="font-body leading-relaxed mb-4" style={{ color: '#5c6474', fontSize: '1.05rem' }}>
                  {subtitle}
                </p>
              )}

              {/* Meta row + Actions */}
              <div className="flex items-center gap-3 flex-wrap mb-4">
                {metaRow}
                {actions?.translate && (
                  <TranslatePageButton
                    isTranslated={actions.translate.isTranslated}
                    contentType={actions.translate.contentType}
                    contentId={actions.translate.contentId}
                  />
                )}
                {actions?.share && (
                  <ShareButtons
                    title={actions.share.title}
                    via={actions.share.via}
                    url={actions.share.url}
                    compact
                  />
                )}
              </div>

              {/* Hero image */}
              {heroImage}
            </div>

            {/* Right: FOL + Wayfinder (1/3) */}
            <div
              className="hidden lg:flex lg:flex-col lg:items-center lg:gap-6 lg:pl-8"
              style={{ borderLeft: '1px solid #dde1e8' }}
            >
              <FlowerOfLife size={192} color={themeColor} opacity={0.15} />
              <DetailWayfinder
                data={wayfinderData}
                currentType={wayfinderType}
                currentId={wayfinderEntityId}
                userRole={userRole}
              />
            </div>
          </div>
        </div>
      </header>

      {/* ── BODY: 2-column grid ── */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-0">
          {/* Main content column */}
          <div className="pr-0 lg:pr-8" style={{ borderRight: 'none' }}>
            <style>{`@media (min-width: 1024px) { .detail-main { border-right: 1px solid #dde1e8; padding-right: 2rem; } }`}</style>
            <div className="detail-main">
              {children}
            </div>
          </div>

          {/* Sidebar */}
          <div className="pl-0 lg:pl-8 space-y-6 mt-8 lg:mt-0">
            {/* Wayfinder (mobile only — desktop is in masthead) */}
            <div className="lg:hidden">
              <DetailWayfinder
                data={wayfinderData}
                currentType={wayfinderType}
                currentId={wayfinderEntityId}
                userRole={userRole}
              />
            </div>

            {sidebar}

            {/* Feedback */}
            {feedbackType && feedbackId && (
              <FeedbackLoop
                entityType={feedbackType}
                entityId={feedbackId}
                entityName={feedbackName || ''}
              />
            )}
          </div>
        </div>
      </div>

      {/* Footer sections */}
      {footer}
    </div>
  )
}
