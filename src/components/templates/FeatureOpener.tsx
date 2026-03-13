interface PullQuote {
  quote: string
  source?: string
}

interface FeatureOpenerProps {
  lede: string
  themeColor: string
  dropCap?: string
  quotes?: PullQuote[]
}

/**
 * Two-column Feature Opener — lede paragraph with drop cap + pull quotes.
 * Matches the .feature-open spec from the design system.
 */
export function FeatureOpener({ lede, themeColor, dropCap, quotes }: FeatureOpenerProps) {
  const firstChar = dropCap || lede.charAt(0)
  const restOfLede = dropCap ? lede : lede.slice(1)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 border-b border-rule-inner">
      {/* Lede */}
      <div className="py-6 pr-10 md:border-r border-rule border-rule-inner">
        <p className="font-body text-[0.92rem] leading-[1.85] text-ink">
          <span
            className="font-display font-black text-[3.5rem] leading-[0.85] float-left mr-3 mt-1"
            style={{ color: themeColor }}
          >
            {firstChar}
          </span>
          {restOfLede}
        </p>
      </div>

      {/* Pull quotes */}
      <div className="py-6 md:pl-10 flex flex-col justify-center gap-6">
        {quotes?.map((q, i) => (
          <div key={i}>
            <blockquote
              className="font-display text-[1.35rem] font-bold italic leading-snug pl-5"
              style={{ borderLeft: `3px solid ${themeColor}` }}
            >
              {q.quote}
            </blockquote>
            {q.source && (
              <span className="font-mono text-[0.6875rem] tracking-[0.1em] uppercase text-dim mt-2 block pl-5">
                {q.source}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
