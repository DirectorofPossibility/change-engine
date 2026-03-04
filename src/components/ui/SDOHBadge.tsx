import Link from 'next/link'

interface SDOHBadgeProps {
  sdohCode: string
  sdohName: string
  sdohDescription?: string | null
  linkToExplore?: boolean
}

export function SDOHBadge({ sdohCode, sdohName, sdohDescription, linkToExplore }: SDOHBadgeProps) {
  const badge = (
    <span
      className="inline-flex items-start gap-2 text-xs text-brand-text"
      style={{ borderLeft: '3px solid #22c55e', paddingLeft: 6 }}
    >
      <span>
        <span className="font-medium">{sdohName}</span>
        {sdohDescription && <span className="text-brand-muted ml-1">{sdohDescription}</span>}
      </span>
    </span>
  )

  if (linkToExplore) {
    return <Link href={'/explore?sdoh=' + encodeURIComponent(sdohCode)} className="hover:underline">{badge}</Link>
  }
  return badge
}
