import Link from 'next/link'

interface SDGBadgeProps {
  sdgNumber: number
  sdgName: string
  sdgColor: string | null
  linkToExplore?: boolean
}

export function SDGBadge({ sdgNumber, sdgName, sdgColor, linkToExplore }: SDGBadgeProps) {
  const bg = sdgColor || '#3182ce'
  const pill = (
    <span
      className="inline-block text-xs px-2 py-0.5 rounded-full text-white font-medium"
      style={{ backgroundColor: bg }}
    >
      SDG {sdgNumber}: {sdgName}
    </span>
  )

  if (linkToExplore) {
    return <Link href={'/explore?sdg=SDG_' + sdgNumber}>{pill}</Link>
  }
  return pill
}
