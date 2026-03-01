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
            alt=""
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
