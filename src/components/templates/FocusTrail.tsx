import Link from 'next/link'
import { Geo } from '@/components/geo/sacred'

/**
 * Trail level definitions — the 5-level progressive journey.
 * Matches the .ft-level spec from the design system.
 */
const LEVEL_META: Record<number, {
  name: string
  subtitle: string
  actionType: string
  color: string
  geoType: string
}> = {
  1: { name: 'Before You Go', subtitle: 'News, data, explainers', actionType: 'Read, watch, listen from home', color: '#1b5e8a', geoType: 'compass_rose' },
  2: { name: 'Packing List', subtitle: 'Guides, tools, self-study', actionType: 'Do something, from home', color: '#1a6b56', geoType: 'vesica_piscis' },
  3: { name: 'Day Trips', subtitle: 'Classes, events near you', actionType: 'Leave the house, come back', color: '#4a2870', geoType: 'hex_grid' },
  4: { name: 'Local Guides', subtitle: 'Organizations & services', actionType: 'Connect, volunteer, get help', color: '#7a2018', geoType: 'flower_of_life' },
  5: { name: 'The Deep Journey', subtitle: 'Ongoing commitments', actionType: 'Long-term involvement', color: '#0d1117', geoType: 'metatron_cube' },
}

interface TrailEntry {
  id: string
  href: string
  title: string
  type?: string
  meta?: string
  geoType?: string
}

interface TrailLevel {
  level: number
  entries: TrailEntry[]
  totalCount?: number
}

interface FocusTrailProps {
  levels: TrailLevel[]
  themeColor: string
  focusName: string
  seeAllHref?: string
}

/**
 * Five-level trail layout with spine + entries.
 * Matches the .focus-trail spec from the design system.
 *
 * Grid: 180px spine | 1fr content
 * Each level has a colored pip, geo SVG, level name, and entry cards.
 */
export function FocusTrail({ levels, themeColor, focusName, seeAllHref }: FocusTrailProps) {
  return (
    <div className="max-w-[1080px] mx-auto px-6">
      {levels.map(function (lvl) {
        const meta = LEVEL_META[lvl.level] || LEVEL_META[1]
        const levelColor = meta.color
        const count = lvl.totalCount ?? lvl.entries.length

        return (
          <div
            key={lvl.level}
            className="grid grid-cols-1 md:grid-cols-[180px_1fr] border-b border-rule-inner"
          >
            {/* Spine */}
            <div className="py-8 md:pr-6 md:border-r border-rule-inner flex flex-col gap-3">
              {/* Geo SVG */}
              <div className="w-[60px] h-[60px] opacity-[0.35]">
                <Geo type={meta.geoType} size={60} color={levelColor} />
              </div>

              {/* Level pip */}
              <div className="flex items-center gap-2">
                <span
                  className="w-[8px] h-[8px] flex-shrink-0"
                  style={{ background: levelColor }}
                />
                <span className="font-mono text-[0.6rem] uppercase tracking-[0.14em]" style={{ color: levelColor }}>
                  Level {lvl.level}
                </span>
              </div>

              {/* Name */}
              <span className="font-display text-[0.88rem] font-bold leading-tight">
                {meta.name}
              </span>

              {/* Subtitle */}
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.08em] text-dim">
                {meta.actionType}
              </span>

              {/* Count */}
              <span className="font-mono text-[0.6875rem] text-faint">
                {count} {count === 1 ? 'resource' : 'resources'}
              </span>
            </div>

            {/* Content — entries */}
            <div className="py-6 md:pl-8">
              <div className="space-y-0">
                {lvl.entries.map(function (entry) {
                  const entryGeo = entry.geoType || meta.geoType
                  return (
                    <Link
                      key={entry.id}
                      href={entry.href}
                      className="group flex items-center gap-4 py-4 border-b border-rule hover:bg-paper transition-colors -mx-4 px-4"
                    >
                      {/* Entry geo icon */}
                      <div className="w-[40px] h-[40px] flex-shrink-0 opacity-[0.3] group-hover:opacity-[0.5] transition-opacity">
                        <Geo type={entryGeo} size={40} color={levelColor} />
                      </div>

                      {/* Entry body */}
                      <div className="flex-1 min-w-0">
                        {entry.type && (
                          <span className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-dim block mb-0.5">
                            {entry.type}
                          </span>
                        )}
                        <span className="font-display text-[0.85rem] font-bold leading-tight group-hover:underline block line-clamp-2">
                          {entry.title}
                        </span>
                        {entry.meta && (
                          <span className="font-mono text-[0.6rem] text-faint block mt-0.5">
                            {entry.meta}
                          </span>
                        )}
                      </div>

                      {/* Arrow */}
                      <span className="font-mono text-[0.78rem] text-blue flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        &rarr;
                      </span>
                    </Link>
                  )
                })}
              </div>

              {/* See all link */}
              {count > lvl.entries.length && seeAllHref && (
                <Link
                  href={seeAllHref}
                  className="font-mono text-[0.6875rem] tracking-[0.1em] uppercase text-blue hover:underline mt-4 block"
                >
                  See all {count} resources &rarr;
                </Link>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export { LEVEL_META }
export type { TrailEntry, TrailLevel }
