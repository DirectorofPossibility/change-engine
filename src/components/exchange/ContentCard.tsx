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
  const rawSummary = translatedSummary || summary
  const displaySummary = rawSummary.length > 300 ? rawSummary.slice(0, 300) + '...' : rawSummary
  const Wrapper = onSelect ? 'div' : Link
  const wrapperProps = onSelect
    ? { role: 'button' as const, tabIndex: 0, onClick: onSelect, onKeyDown: function (e: React.KeyboardEvent) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect() } }, className: 'block bg-white overflow-hidden hover:border-ink transition-colors cursor-pointer', style: { border: '1px solid #dde1e8' } }
    : { href: href || '/content/' + id, className: 'block bg-white overflow-hidden hover:border-ink transition-colors', style: { border: '1px solid #dde1e8' } }
  return (
    <Wrapper {...wrapperProps as any}>
      {imageUrl ? (
        <div className="w-full h-36 relative" style={{ borderBottom: '1px solid #dde1e8' }}>
          <Image
            src={imageUrl}
            alt={displayTitle}
            width={400}
            height={144}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <FolFallback pathway={pathway} />
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <ThemePill themeId={pathway} size="sm" linkable={false} />
          <CenterBadge center={center} linkable={false} />
        </div>
        <h3
          className="line-clamp-2 mb-1"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: '0.95rem', lineHeight: 1.35, fontWeight: 600, color: '#0d1117' }}
        >
          {displayTitle}
        </h3>
        <p
          className="line-clamp-2 mb-2"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: '0.8rem', lineHeight: 1.5, color: '#5c6474' }}
        >
          {displaySummary}
        </p>
        <div className="flex items-center justify-between">
          <span style={{ fontFamily: '"Courier New", Courier, monospace', fontSize: '0.6875rem', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#5c6474' }}>
            {publishedAt ? new Date(publishedAt).toLocaleDateString() : ''}
          </span>
          <span style={{ fontFamily: '"Courier New", Courier, monospace', fontSize: '0.6875rem', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#1b5e8a' }}>
            {t('card.read_more')} &rarr;
          </span>
        </div>
      </div>
    </Wrapper>
  )
}
