import Link from 'next/link'

interface SDOHBadgeProps {
  sdohCode: string
  sdohName: string
  sdohDescription?: string | null
  linkToExplore?: boolean
}

export function SDOHBadge({ sdohCode, sdohName, sdohDescription, linkToExplore }: SDOHBadgeProps) {
  const pill = (
    <span
      className="inline-block text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium"
      title={sdohDescription || undefined}
    >
      {sdohName}
    </span>
  )

  if (linkToExplore) {
    return <Link href={'/explore?sdoh=' + encodeURIComponent(sdohCode)}>{pill}</Link>
  }
  return pill
}
