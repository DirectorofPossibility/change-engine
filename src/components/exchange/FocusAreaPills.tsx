import Link from 'next/link'

interface FocusAreaObj {
  focus_id: string
  focus_area_name: string
  is_bridging?: boolean | null
  theme_id?: string | null
}

interface FocusAreaPillsProps {
  focusAreaNames?: string[]
  focusAreas?: FocusAreaObj[]
}

export function FocusAreaPills({ focusAreaNames, focusAreas }: FocusAreaPillsProps) {
  // Prefer rich focusAreas prop when available
  if (focusAreas && focusAreas.length > 0) {
    return (
      <div className="flex flex-wrap gap-1">
        {focusAreas.map(function (fa) {
          var baseClass = 'text-xs px-2 py-0.5 rounded-lg bg-brand-bg text-brand-muted hover:text-brand-accent transition-colors'
          if (fa.is_bridging) {
            baseClass += ' border border-dashed border-brand-muted'
          } else {
            baseClass += ' border border-brand-border'
          }
          return (
            <Link
              key={fa.focus_id}
              href={'/explore/focus/' + fa.focus_id}
              className={baseClass}
            >
              {fa.focus_area_name}
            </Link>
          )
        })}
      </div>
    )
  }

  // Fallback: plain string names (backward-compatible)
  if (!focusAreaNames || focusAreaNames.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1">
      {focusAreaNames.map(function (name) {
        return (
          <span
            key={name}
            className="text-xs px-2 py-0.5 rounded-lg bg-brand-bg text-brand-muted border border-brand-border"
          >
            {name}
          </span>
        )
      })}
    </div>
  )
}
