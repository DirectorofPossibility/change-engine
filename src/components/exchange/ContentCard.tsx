/**
 * @fileoverview Individual content card for the Community Exchange grid.
 *
 * Displays a content item as a clickable card with an optional hero image,
 * a {@link ThemePill} for the primary pathway, a {@link CenterBadge},
 * the title and summary (clamped), optional {@link FocusAreaPills}, and a
 * publication date. The entire card links to `/content/[id]`.
 *
 * Supports pre-translated title/summary overrides via the `translatedTitle`
 * and `translatedSummary` props.
 */
import Link from 'next/link'
import { ThemePill } from '@/components/ui/ThemePill'
import { CenterBadge } from '@/components/ui/CenterBadge'
import { FocusAreaPills } from './FocusAreaPills'

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
}

/**
 * Clickable content card showing title, summary, pathway pill, and center badge.
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
  focusAreaNames, translatedTitle, translatedSummary, imageUrl,
}: ContentCardProps) {
  const displayTitle = translatedTitle || title
  const displaySummary = translatedSummary || summary

  return (
    <Link href={'/content/' + id} className="block bg-white rounded-xl border border-brand-border overflow-hidden hover:shadow-md transition-shadow">
      {imageUrl && (
        <div className="w-full h-40 relative">
          <img
            src={imageUrl}
            alt={displayTitle}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <ThemePill themeId={pathway} size="sm" />
        <CenterBadge center={center} />
      </div>
      <h3 className="font-semibold text-brand-text mb-2 line-clamp-2">{displayTitle}</h3>
      <p className="text-sm text-brand-muted mb-3 line-clamp-3">{displaySummary}</p>
      {focusAreaNames && focusAreaNames.length > 0 && (
        <div className="mb-3">
          <FocusAreaPills focusAreaNames={focusAreaNames} />
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className="text-xs text-brand-muted">
          {publishedAt ? new Date(publishedAt).toLocaleDateString() : ''}
        </span>
        <span className="text-xs text-brand-accent">
          Read more &rarr;
        </span>
      </div>
      </div>
    </Link>
  )
}
