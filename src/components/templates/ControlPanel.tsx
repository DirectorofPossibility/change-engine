import Link from 'next/link'
import { Geo } from '@/components/geo/sacred'

interface InstrumentProps {
  name: string
  href: string
  geoType?: string
  themeColor: string
  themeLt?: string
  levelsFilled?: number
  totalLevels?: number
  statusText?: string
  isHot?: boolean
}

/**
 * Single instrument in the Control Panel grid.
 * Shows sacred geometry gauge + destination label.
 */
function Instrument({
  name,
  href,
  geoType = 'seed_of_life',
  themeColor,
  themeLt,
  levelsFilled = 0,
  totalLevels = 5,
  statusText,
  isHot,
}: InstrumentProps) {
  const lt = themeLt || `${themeColor}18`
  const circumference = 2 * Math.PI * 42
  const fillPct = totalLevels > 0 ? levelsFilled / totalLevels : 0
  const dashoffset = circumference * (1 - fillPct)

  return (
    <Link
      href={href}
      className="group block border-r-2 border-b-2 border-ink relative overflow-hidden transition-colors"
      style={{ background: 'white' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = lt }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'white' }}
    >
      {/* Gauge face */}
      <div
        className="aspect-square flex items-center justify-center relative overflow-hidden"
        style={{ borderBottom: '1px solid var(--color-rule)', background: lt }}
      >
        {/* Geo SVG background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="w-[85%] transition-all duration-300 group-hover:opacity-[0.22] group-hover:rotate-[15deg] group-hover:scale-105"
            style={{ opacity: 0.14 }}
          >
            <Geo type={geoType} color={themeColor} opacity={1} />
          </div>
        </div>

        {/* Status arc SVG */}
        <svg viewBox="0 0 100 100" className="absolute w-[70%] aspect-square">
          {/* Track */}
          <circle
            cx="50" cy="50" r="42"
            fill="none"
            stroke="var(--color-rule)"
            strokeWidth="4"
          />
          {/* Fill arc */}
          {fillPct > 0 && (
            <circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke={themeColor}
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={dashoffset}
              strokeLinecap="butt"
              transform="rotate(-90 50 50)"
            />
          )}
        </svg>
      </div>

      {/* Label panel */}
      <div className="px-3 py-3">
        <span className="font-display text-[0.85rem] font-bold leading-tight block mb-1">
          {name}
        </span>
        <div className="flex items-center justify-between">
          {/* Level dots */}
          <div className="flex gap-[2.5px]">
            {Array.from({ length: totalLevels }).map((_, i) => (
              <span
                key={i}
                className="w-[5px] h-[5px] rounded-full"
                style={{ background: i < levelsFilled ? themeColor : 'var(--color-rule)' }}
              />
            ))}
          </div>
          {/* Status */}
          <span
            className={`font-mono text-[0.6875rem] tracking-[0.1em] uppercase ${isHot ? 'text-civic font-semibold' : 'text-dim'}`}
          >
            {statusText || `${levelsFilled} of ${totalLevels}`}
          </span>
        </div>
        <span className="font-mono text-[0.6875rem] tracking-[0.1em] uppercase text-blue block mt-1">
          Explore →
        </span>
      </div>
    </Link>
  )
}

interface ControlPanelProps {
  instruments: InstrumentProps[]
  kicker?: string
  heading?: string
}

/**
 * Control Panel — grid of focus area instruments.
 * Matches the .cp-grid spec: 4 cols desktop, 3 tablet, 2 mobile.
 * Outer border: 2px solid ink. Inner borders on each instrument.
 */
export function ControlPanel({ instruments, kicker, heading }: ControlPanelProps) {
  return (
    <section className="py-10">
      {(kicker || heading) && (
        <div className="mb-8">
          {kicker && (
            <span className="font-mono text-[0.6875rem] tracking-[0.2em] uppercase text-dim block mb-1">
              {kicker}
            </span>
          )}
          {heading && (
            <h2 className="font-display text-[1.5rem] font-bold tracking-[-0.015em]">
              {heading}
            </h2>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 border-l-2 border-t-2 border-ink">
        {instruments.map((inst, i) => (
          <Instrument key={i} {...inst} />
        ))}
      </div>
    </section>
  )
}

export type { InstrumentProps }
