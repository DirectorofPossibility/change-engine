import Link from 'next/link'

interface PathwayCardProps {
  themeId: string
  name: string
  color: string
  emoji: string
  slug: string
  count: number
  description?: string
}

export function PathwayCard({ name, color, slug, count, description }: PathwayCardProps) {
  return (
    <Link
      href={`/pathways/${slug}`}
      className="group block bg-white rounded-card border-2 border-brand-border overflow-hidden card-lift"
    >
      {/* Color top bar */}
      <div className="h-1.5" style={{ backgroundColor: color }} />
      <div className="p-5">
        <div className="flex items-center gap-2.5 mb-2">
          <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
          <h3 className="font-serif font-bold text-brand-text text-base">{name}</h3>
        </div>
        {description && (
          <p className="text-sm text-brand-muted mb-3 line-clamp-2 leading-relaxed">{description}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs text-brand-muted-light">{count} resources</span>
          <span
            className="text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color }}
          >
            Explore →
          </span>
        </div>
      </div>
    </Link>
  )
}
