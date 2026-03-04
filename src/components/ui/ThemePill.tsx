import { THEMES } from '@/lib/constants'

interface ThemePillProps {
  themeId: string | null
  size?: 'sm' | 'md'
}

export function ThemePill({ themeId, size = 'sm' }: ThemePillProps) {
  if (!themeId) return <span className="text-brand-muted text-xs">-</span>
  const theme = THEMES[themeId as keyof typeof THEMES]
  if (!theme) return <span className="text-xs text-gray-500">{themeId}</span>

  const sizeClasses = size === 'sm' ? 'text-xs' : 'text-sm'

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold uppercase tracking-wide ${sizeClasses}`}
      style={{ borderLeft: `3px solid ${theme.color}`, paddingLeft: 6, color: theme.color }}
    >
      {theme.name}
    </span>
  )
}
