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
  bgColor = '#ffffff',
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

      {/* ── HERO IMAGE — full bleed ── */}
      {heroImage && (
        <div className="w-full">
          {heroImage}
        </div>
      )}

      {/* ── MASTHEAD ── */}
      <header style={{
        background: '#ffffff',
        borderTop: mastheadBorderTop || 'none',
        borderLeft: mastheadBorderLeft || 'none',
      }}>
        <div className="max-w-[820px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div className="mb-4">
              <Breadcrumb items={breadcrumbs} />
            </div>
          )}

          {/* Eyebrow + meta */}
          {(eyebrow || eyebrowMeta) && (
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              {eyebrow && (
                <span
                  className="font-mono uppercase tracking-[0.2em] text-xs px-3 py-1"
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
            className="font-display leading-[1.1] mb-4"
            style={{ fontSize: 'clamp(1.8rem, 4.5vw, 3rem)', color: '#0d1117', fontWeight: 900 }}
          >
            {title}
          </h1>

          {/* Subtitle — rendered as a pull quote, not a metadata block */}
          {subtitle && (
            <p
              className="font-body italic leading-relaxed mb-4"
              style={{ color: '#5c6474', fontSize: '1.1rem', borderLeft: `3px solid ${themeColor}`, paddingLeft: '1rem' }}
            >
              {subtitle}
            </p>
          )}

          {/* Meta row + Actions */}
          <div className="flex items-center gap-3 flex-wrap">
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
        </div>
      </header>

      {/* ── Thin color rule — editorial section divider ── */}
      <div className="max-w-[820px] mx-auto px-4 sm:px-6 lg:px-8">
        <div style={{ height: 2, background: themeColor, opacity: 0.3 }} />
      </div>

      {/* ── BODY ── */}
      <div className="max-w-[820px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main content — single column, readable width */}
        <div className="mb-10">
          {children}
        </div>

        {/* Sidebar content — rendered below main on all viewports */}
        {sidebar && (
          <div className="space-y-6 pt-8" style={{ borderTop: '1px solid #dde1e8' }}>
            {sidebar}
          </div>
        )}

        {/* Wayfinder — contextual, at the bottom */}
        <div className="mt-8 pt-6" style={{ borderTop: '1px solid #dde1e8' }}>
          <DetailWayfinder
            data={wayfinderData}
            currentType={wayfinderType}
            currentId={wayfinderEntityId}
            userRole={userRole ?? undefined}
          />
        </div>

        {/* Feedback */}
        {feedbackType && feedbackId && (
          <div className="mt-6">
            <FeedbackLoop
              entityType={feedbackType}
              entityId={feedbackId}
              entityName={feedbackName || ''}
            />
          </div>
        )}
      </div>

      {/* Footer sections */}
      {footer}
    </div>
  )
}
