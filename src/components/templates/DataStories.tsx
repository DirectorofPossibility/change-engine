interface DataStory {
  num: string
  hed: string
  copy?: string
}

interface DataStoriesProps {
  stories: DataStory[]
  themeColor: string
}

/**
 * 3-column data callout grid — narrative numbers, not charts.
 * Matches the .data-stories spec from the design system.
 */
export function DataStories({ stories, themeColor }: DataStoriesProps) {
  if (stories.length === 0) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 border-b border-rule" style={{ borderWidth: '1.5px' }}>
      {stories.map((s, i) => (
        <div
          key={i}
          className="p-7 md:border-r border-rule last:border-r-0"
          style={{ borderWidth: '1.5px' }}
        >
          <span
            className="font-display font-black text-[2.8rem] leading-none block mb-1"
            style={{ color: themeColor }}
          >
            {s.num}
          </span>
          <h3 className="font-body text-[0.9rem] font-bold mb-2">
            {s.hed}
          </h3>
          {s.copy && (
            <p className="font-body italic text-[0.78rem] leading-relaxed text-dim">
              {s.copy}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
