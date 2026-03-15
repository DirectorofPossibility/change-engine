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
      className="group block bg-white overflow-hidden hover:border-ink transition-colors"
      style={{ border: '1px solid #dde1e8' }}
    >
      {/* Color top bar */}
      <div className="h-1.5" style={{ backgroundColor: color }} />
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 flex-shrink-0" style={{ backgroundColor: color }} />
          <h3 style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: '0.95rem', lineHeight: 1.35, fontWeight: 600, color: '#0d1117' }}>{name}</h3>
        </div>
        {description && (
          <p className="line-clamp-2 mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: '0.875rem', lineHeight: 1.5, color: '#5c6474' }}>{description}</p>
        )}
        <div className="flex items-center justify-between">
          <span style={{ fontFamily: '"Courier New", Courier, monospace', fontSize: '0.875rem', letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#1b5e8a' }}>{count} resources</span>
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
