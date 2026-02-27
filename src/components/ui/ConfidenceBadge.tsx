interface ConfidenceBadgeProps {
  confidence: number | null
}

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  if (confidence === null || confidence === undefined) {
    return <span className="text-brand-muted text-xs">-</span>
  }

  const pct = Math.round(confidence * 100)
  let colorClasses: string

  if (confidence >= 0.8) {
    colorClasses = 'bg-green-50 text-green-700 border-green-200'
  } else if (confidence >= 0.5) {
    colorClasses = 'bg-yellow-50 text-yellow-700 border-yellow-200'
  } else {
    colorClasses = 'bg-red-50 text-red-700 border-red-200'
  }

  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded border ${colorClasses}`}>
      {pct}%
    </span>
  )
}
