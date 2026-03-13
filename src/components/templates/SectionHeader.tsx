import Link from 'next/link'

interface SectionHeaderProps {
  kicker?: string
  heading: string
  headingEm?: string
  allHref?: string
  allLabel?: string
}

/**
 * Section header with optional kicker, heading, and "see all" link.
 * Matches the .section-hed-row spec from the design system.
 */
export function SectionHeader({ kicker, heading, headingEm, allHref, allLabel }: SectionHeaderProps) {
  return (
    <div className="flex items-baseline justify-between mb-6">
      <div>
        {kicker && (
          <span className="font-mono text-[0.6875rem] tracking-[0.2em] uppercase text-dim block mb-1">
            {kicker}
          </span>
        )}
        <h2 className="font-display text-[1.5rem] font-bold tracking-[-0.015em]">
          {heading}
          {headingEm && <em className="italic"> {headingEm}</em>}
        </h2>
      </div>
      {allHref && (
        <Link
          href={allHref}
          className="font-mono text-[0.6875rem] tracking-[0.1em] uppercase text-blue whitespace-nowrap hover:underline"
        >
          {allLabel || 'See all'} →
        </Link>
      )}
    </div>
  )
}
