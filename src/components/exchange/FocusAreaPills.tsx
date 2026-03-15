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
  linkable?: boolean
}

export function FocusAreaPills({ focusAreaNames, focusAreas, linkable = true }: FocusAreaPillsProps) {
  if (focusAreas && focusAreas.length > 0) {
    return (
      <span className="text-sm italic text-brand-muted">
        {focusAreas.map(function (fa, i) {
          return (
            <span key={fa.focus_id}>
              {i > 0 && <span className="mx-1">&middot;</span>}
              {linkable ? (
                <Link
                  href={'/explore/focus/' + fa.focus_id}
                  className="hover:text-brand-accent transition-colors"
                >
                  {fa.focus_area_name}
                </Link>
              ) : (
                fa.focus_area_name
              )}
            </span>
          )
        })}
      </span>
    )
  }

  if (!focusAreaNames || focusAreaNames.length === 0) return null

  return (
    <span className="text-sm italic text-brand-muted">
      {focusAreaNames.map(function (name, i) {
        return (
          <span key={name}>
            {i > 0 && <span className="mx-1">&middot;</span>}
            {linkable ? (
              <Link
                href={'/search?q=' + encodeURIComponent(name)}
                className="hover:text-brand-accent transition-colors"
              >
                {name}
              </Link>
            ) : (
              name
            )}
          </span>
        )
      })}
    </span>
  )
}
