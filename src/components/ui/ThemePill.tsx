import Link from 'next/link'
import { THEMES } from '@/lib/constants'

interface ThemePillProps {
  themeId: string | null
  size?: 'sm' | 'md'
  linkable?: boolean
}

/**
 * Pathway indicator — color dot + pathway name as a simple text link.
 * Component kept named ThemePill for backwards compat but renders as dot+text, NOT a pill.
 */
export function ThemePill({ themeId, size = 'sm', linkable = true }: ThemePillProps) {
  if (!themeId) return null
  const theme = THEMES[themeId as keyof typeof THEMES]
  if (!theme) return <span className="text-xs text-gray-500">{themeId}</span>

  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'

  const inner = (
    <span className={`inline-flex items-center gap-1.5 ${textSize} text-brand-muted`}>
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: theme.color }}
      />
      {theme.name}
    </span>
  )

  if (linkable && theme.slug) {
    return (
      <Link href={'/pathways/' + theme.slug} className="hover:text-brand-accent transition-colors">
        {inner}
      </Link>
    )
  }

  return inner
}
