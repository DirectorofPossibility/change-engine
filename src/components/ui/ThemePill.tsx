/**
 * @fileoverview Colored pill badge for pathway/theme display.
 *
 * Looks up the given `themeId` in the global {@link THEMES} constant map to
 * resolve the theme's display name and brand color. Renders an inline
 * rounded pill with white text on the theme color background. Falls back to
 * a neutral gray pill when the theme ID is unrecognized, or a muted dash
 * when `themeId` is `null`.
 */
import { THEMES } from '@/lib/constants'

interface ThemePillProps {
  themeId: string | null
  size?: 'sm' | 'md'
}

/**
 * Colored pill badge that displays a pathway/theme name.
 *
 * @param props.themeId - Theme identifier from the THEMES constant map, or `null` for a placeholder dash.
 * @param props.size - Visual size variant: `'sm'` (default) or `'md'`.
 */
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
