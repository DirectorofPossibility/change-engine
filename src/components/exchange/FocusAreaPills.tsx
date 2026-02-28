interface FocusAreaPillsProps {
  focusAreaNames: string[]
}

export function FocusAreaPills({ focusAreaNames }: FocusAreaPillsProps) {
  if (focusAreaNames.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1">
      {focusAreaNames.map(function (name) {
        return (
          <span
            key={name}
            className="text-xs px-2 py-0.5 rounded-full bg-brand-bg text-brand-muted border border-brand-border"
          >
            {name}
          </span>
        )
      })}
    </div>
  )
}
