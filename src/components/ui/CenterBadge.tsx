import Link from 'next/link'
import { CENTERS } from '@/lib/constants'

const CENTER_COLORS: Record<string, string> = {
  Learning:       '#4a2870',
  Action:         '#7a2018',
  Resource:       '#6a4e10',
  Accountability: '#1a3460',
}

const CENTER_CONFIG: Record<string, { question: string }> = {
  Learning:       { question: 'How can I understand?' },
  Action:         { question: 'How can I help?' },
  Resource:       { question: "What's available to me?" },
  Accountability: { question: 'Who makes decisions?' },
}

interface CenterBadgeProps {
  center: string | null
  showQuestion?: boolean
  linkable?: boolean
}

export function CenterBadge({ center, showQuestion = false, linkable = true }: CenterBadgeProps) {
  if (!center) return null
  const config = CENTER_CONFIG[center]
  if (!config) return <span className="text-xs text-brand-muted">{center}</span>

  const color = CENTER_COLORS[center] || '#6B6560'

  const inner = (
    <span className="inline-flex items-center gap-1.5 text-xs text-brand-muted">
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      {center}
      {showQuestion && <span className="text-brand-muted">— {config.question}</span>}
    </span>
  )

  if (linkable) {
    const slug = CENTERS[center]?.slug || center.toLowerCase()
    return (
      <Link href={'/centers/' + slug} className="hover:text-brand-accent transition-colors">
        {inner}
      </Link>
    )
  }

  return inner
}
