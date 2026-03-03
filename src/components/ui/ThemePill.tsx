import { THEMES } from '@/lib/constants'

interface ThemePillProps {
  themeId: string | null
  size?: 'sm' | 'md'
}

export function ThemePill({ themeId, size = 'sm' }: ThemePillProps) {
  if (!themeId) return <span className="text-brand-muted text-xs">-</span>
  const theme = THEMES[themeId as keyof typeof THEMES]
  if (!theme) return <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-lg">{themeId}</span>

  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'

  return (
    <span
      className={`inline-block rounded-lg text-white font-medium ${sizeClasses}`}
      style={{ backgroundColor: theme.color }}
    >
      {theme.name}
    </span>
  )
}
