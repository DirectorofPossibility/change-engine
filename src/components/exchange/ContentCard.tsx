import Link from 'next/link'
import { ThemePill } from '@/components/ui/ThemePill'
import { CenterBadge } from '@/components/ui/CenterBadge'

interface ContentCardProps {
  id: string
  title: string
  summary: string
  pathway: string | null
  center: string | null
  sourceUrl: string
  publishedAt: string | null
}

export function ContentCard({ title, summary, pathway, center, sourceUrl, publishedAt }: ContentCardProps) {
  return (
    <div className="bg-white rounded-xl border border-brand-border p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-3">
        <ThemePill themeId={pathway} size="sm" />
        <CenterBadge center={center} />
      </div>
      <h3 className="font-semibold text-brand-text mb-2 line-clamp-2">{title}</h3>
      <p className="text-sm text-brand-muted mb-3 line-clamp-3">{summary}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-brand-muted">
          {publishedAt ? new Date(publishedAt).toLocaleDateString() : ''}
        </span>
        <Link
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-brand-accent hover:underline"
        >
          Read more &rarr;
        </Link>
      </div>
    </div>
  )
}
