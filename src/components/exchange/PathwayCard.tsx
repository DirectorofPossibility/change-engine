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

export function PathwayCard({ name, color, emoji, slug, count, description }: PathwayCardProps) {
  return (
    <Link
      href={`/pathways/${slug}`}
      className="block bg-white rounded-xl border border-brand-border p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{emoji}</span>
        <h3 className="font-bold text-brand-text">{name}</h3>
      </div>
      {description && (
        <p className="text-sm text-brand-muted mb-3 line-clamp-2">{description}</p>
      )}
      <div className="flex items-center gap-2">
        <span
          className="inline-block w-3 h-3 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs text-brand-muted">{count} resources</span>
      </div>
    </Link>
  )
}
