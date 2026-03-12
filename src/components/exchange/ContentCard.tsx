/**
 * @fileoverview Individual content card for the Change Engine grid.
 *
 * Displays a content item as a clickable card with a hero image (or a
 * gradient placeholder with a Houston skyline silhouette when no image is
 * available), a {@link ThemePill} for the primary pathway, a {@link CenterBadge},
 * the title and summary (clamped), optional {@link FocusAreaPills}, and a
 * publication date. The entire card links to `/content/[id]`.
 *
 * Supports pre-translated title/summary overrides via the `translatedTitle`
 * and `translatedSummary` props.
 */
'use client'

import Link from 'next/link'
import { ThemePill } from '@/components/ui/ThemePill'
import { CenterBadge } from '@/components/ui/CenterBadge'
import { useTranslation } from '@/lib/use-translation'
import { FocusAreaPills } from './FocusAreaPills'
import Image from 'next/image'
import { FolFallback } from '@/components/ui/FolFallback'

interface ContentCardProps {
  id: string
  title: string
  summary: string
  pathway: string | null
  center: string | null
  sourceUrl: string
  publishedAt: string | null
  focusAreaNames?: string[]
  translatedTitle?: string
  translatedSummary?: string
  imageUrl?: string | null
  href?: string
  onSelect?: () => void
}

/**
 * Clickable content card showing title, summary, pathway pill, and center badge.
 *
 * When no `imageUrl` is provided, displays a gradient placeholder with a
 * subtle Houston skyline silhouette pattern using the pathway's theme color.
 *
 * @param props.id - Unique content ID used to build the detail route.
 * @param props.title - Primary title (English or 6th-grade simplified).
 * @param props.summary - Primary summary text.
 * @param props.pathway - Pathway/theme ID rendered as a colored {@link ThemePill}.
 * @param props.center - Center name rendered as a {@link CenterBadge}.
 * @param props.sourceUrl - Original source URL for attribution.
 * @param props.publishedAt - ISO date string shown as a formatted date.
 * @param props.focusAreaNames - Optional list of focus-area display names.
 * @param props.translatedTitle - Optional pre-translated title override.
 * @param props.translatedSummary - Optional pre-translated summary override.
 * @param props.imageUrl - Optional hero image URL displayed at the top of the card.
 */
export function ContentCard({
  id, title, summary, pathway, center, sourceUrl, publishedAt,
  focusAreaNames, translatedTitle, translatedSummary, imageUrl, href, onSelect,
}: ContentCardProps) {
  const { t } = useTranslation()
  const displayTitle = translatedTitle || title
  const displaySummary = translatedSummary || summary
  const Wrapper = onSelect ? 'div' : Link
  const wrapperProps = onSelect
    ? { role: 'button' as const, tabIndex: 0, onClick: onSelect, onKeyDown: function (e: React.KeyboardEvent) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect() } }, className: 'block bg-white border border-brand-border overflow-hidden hover:border-ink transition-colors cursor-pointer' }
    : { href: href || '/content/' + id, className: 'block bg-white border border-brand-border overflow-hidden hover:border-ink transition-colors' }
  return (
    <Wrapper {...wrapperProps as any}>
      {/* TODO: Replace with real Houston photography */}
      {imageUrl ? (
        <div className="w-full h-40 relative bg-brand-bg">
          <Image
            src={imageUrl}
            alt={displayTitle}
            width={400}
            height={200}
            className="w-full h-full object-contain"
          />
        </div>
      ) : (
        <FolFallback pathway={pathway} />
      )}
      <div className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <ThemePill themeId={pathway} size="sm" linkable={false} />
        <CenterBadge center={center} linkable={false} />
      </div>
      <h3 className="font-semibold text-brand-text mb-2 line-clamp-2">{displayTitle}</h3>
      <p className="text-sm text-brand-muted mb-3 line-clamp-3">{displaySummary}</p>
      {focusAreaNames && focusAreaNames.length > 0 && (
        <div className="mb-3">
          <FocusAreaPills focusAreaNames={focusAreaNames} linkable={false} />
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className="text-xs text-brand-muted">
          {publishedAt ? new Date(publishedAt).toLocaleDateString() : ''}
        </span>
        <span className="text-xs text-brand-accent">
          {t('card.read_more')} &rarr;
        </span>
      </div>
      </div>
    </Wrapper>
  )
}
