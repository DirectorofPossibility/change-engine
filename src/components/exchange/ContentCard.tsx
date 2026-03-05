/**
 * @fileoverview Individual content card for the Community Exchange grid.
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

/** Gradient color pairs keyed by pathway ID for placeholder card images. */
const PATHWAY_GRADIENTS: Record<string, { from: string; to: string }> = {
  THEME_01: { from: '#e53e3e', to: '#c53030' },
  THEME_02: { from: '#dd6b20', to: '#c05621' },
  THEME_03: { from: '#d69e2e', to: '#b7791f' },
  THEME_04: { from: '#38a169', to: '#2f855a' },
  THEME_05: { from: '#3182ce', to: '#2b6cb0' },
  THEME_06: { from: '#319795', to: '#2c7a7b' },
  THEME_07: { from: '#805ad5', to: '#6b46c1' },
}

/** Default gradient used when no pathway is specified. */
const DEFAULT_GRADIENT = { from: '#8B7E74', to: '#6b5e52' }

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
  focusAreaNames, translatedTitle, translatedSummary, imageUrl, onSelect,
}: ContentCardProps) {
  const { t } = useTranslation()
  const displayTitle = translatedTitle || title
  const displaySummary = translatedSummary || summary
  const gradient = (pathway && PATHWAY_GRADIENTS[pathway]) || DEFAULT_GRADIENT
  const Wrapper = onSelect ? 'div' : Link
  const wrapperProps = onSelect
    ? { role: 'button' as const, tabIndex: 0, onClick: onSelect, onKeyDown: function (e: React.KeyboardEvent) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect() } }, className: 'block bg-white rounded-xl border border-brand-border overflow-hidden hover:shadow-md transition-shadow cursor-pointer' }
    : { href: '/content/' + id, className: 'block bg-white rounded-xl border border-brand-border overflow-hidden hover:shadow-md transition-shadow' }
  return (
    <Wrapper {...wrapperProps as any}>
      {/* TODO: Replace with real Houston photography */}
      {imageUrl ? (
        <div className="w-full h-40 relative">
          <img
            src={imageUrl}
            alt={displayTitle}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div
          className="w-full h-32 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }}
        >
          {/* Subtle skyline silhouette pattern */}
          <svg
            className="absolute bottom-0 left-0 w-full opacity-10"
            viewBox="0 0 400 80"
            preserveAspectRatio="none"
            fill="white"
          >
            <rect x="20" y="30" width="18" height="50"/>
            <rect x="45" y="20" width="15" height="60"/>
            <rect x="65" y="35" width="12" height="45"/>
            <rect x="100" y="10" width="22" height="70"/>
            <rect x="130" y="15" width="20" height="65"/>
            <rect x="155" y="5" width="25" height="75"/>
            <rect x="185" y="0" width="28" height="80"/>
            <rect x="220" y="8" width="22" height="72"/>
            <rect x="250" y="18" width="20" height="62"/>
            <rect x="280" y="25" width="18" height="55"/>
            <rect x="310" y="30" width="20" height="50"/>
            <rect x="340" y="40" width="15" height="40"/>
            <rect x="360" y="35" width="18" height="45"/>
          </svg>
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
          {t('card.read_more')} &rarr;
        </span>
      </div>
      </div>
    </Wrapper>
  )
}
