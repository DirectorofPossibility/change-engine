const CENTER_CONFIG: Record<string, { question: string }> = {
  Learning:       { question: 'How can I understand?' },
  Action:         { question: 'How can I help?' },
  Resource:       { question: "What's available to me?" },
  Accountability: { question: 'Who makes decisions?' },
}

interface CenterBadgeProps {
  center: string | null
  showQuestion?: boolean
}

export function CenterBadge({ center, showQuestion = false }: CenterBadgeProps) {
  if (!center) return <span className="text-brand-muted text-xs">-</span>
  const config = CENTER_CONFIG[center]
  if (!config) return <span className="text-xs">{center}</span>

  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <span>{center}</span>
      {showQuestion && <span className="text-brand-muted">— {config.question}</span>}
    </span>
  )
}
