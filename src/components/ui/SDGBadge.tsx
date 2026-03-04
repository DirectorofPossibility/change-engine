import Link from 'next/link'

interface SDGBadgeProps {
  sdgNumber: number
  sdgName: string
  sdgColor: string | null
  linkToExplore?: boolean
}

export function SDGBadge({ sdgNumber, sdgName, sdgColor, linkToExplore }: SDGBadgeProps) {
  const color = sdgColor || '#3182ce'
  const badge = (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-text">
      <span className="w-4 h-4 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
      {sdgNumber}. {sdgName}
    </span>
  )

  if (linkToExplore) {
    return <Link href={'/explore?sdg=SDG_' + sdgNumber} className="hover:underline">{badge}</Link>
  }
  return badge
}
