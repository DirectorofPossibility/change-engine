'use client'

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
 * Sacred geometry centered with outer progress ring — the circle wraps the geometry.
 */
function Instrument({
  name,
  href,
  geoType = 'seed_of_life',
  themeColor,
  levelsFilled = 0,
  totalLevels = 5,
  statusText,
  isHot,
}: InstrumentProps) {
  const fillPct = totalLevels > 0 ? levelsFilled / totalLevels : 0
  // Progress ring math
  const ringR = 46
  const circumference = 2 * Math.PI * ringR
  const dashoffset = circumference * (1 - fillPct)

  return (
    <Link
      href={href}
      className="group block relative overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={{ background: 'white', border: '1px solid var(--color-rule, #dde1e8)' }}
    >
      {/* Top color accent */}
      <div className="h-1" style={{ background: `linear-gradient(90deg, ${themeColor}, ${themeColor}66)` }} />

      {/* Gauge face */}
      <div className="aspect-square flex items-center justify-center relative p-4">
        {/* Subtle radial background */}
        <div
          className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            opacity: 0.4,
            background: `radial-gradient(circle at center, ${themeColor}08 0%, ${themeColor}03 50%, transparent 70%)`,
          }}
        />

        {/* Outer progress ring — wraps AROUND the geometry */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" style={{ padding: '6%' }}>
          {/* Track ring */}
          <circle
            cx="50" cy="50" r={ringR}
            fill="none"
            stroke={`${themeColor}15`}
            strokeWidth="2.5"
          />
          {/* Progress arc */}
          {fillPct > 0 && (
            <circle
              cx="50" cy="50" r={ringR}
              fill="none"
              stroke={themeColor}
              strokeWidth="2.5"
              strokeDasharray={circumference}
              strokeDashoffset={dashoffset}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              className="transition-all duration-500"
              style={{ opacity: 0.7 }}
            />
          )}
          {/* Tick marks around the ring */}
          {Array.from({ length: totalLevels }).map((_, i) => {
            const angle = -90 + (i / totalLevels) * 360
            const rad = (angle * Math.PI) / 180
            const filled = i < levelsFilled
            const innerR = ringR + 3
            const outerR = ringR + (filled ? 7 : 5)
            return (
              <line
                key={i}
                x1={50 + innerR * Math.cos(rad)}
                y1={50 + innerR * Math.sin(rad)}
                x2={50 + outerR * Math.cos(rad)}
                y2={50 + outerR * Math.sin(rad)}
                stroke={filled ? themeColor : `${themeColor}30`}
                strokeWidth={filled ? '2' : '1.5'}
                strokeLinecap="round"
              />
            )
          })}
        </svg>

        {/* Sacred geometry — centered inside the ring */}
        <div
          className="relative z-10 w-[58%] transition-all duration-300 group-hover:scale-110 group-hover:opacity-90"
          style={{ opacity: 0.65 }}
        >
          <Geo type={geoType} color={themeColor} opacity={1} />
        </div>
      </div>

      {/* Label panel */}
      <div className="px-4 py-3 border-t" style={{ borderColor: `${themeColor}15` }}>
        <span className="font-display text-[0.82rem] font-bold leading-tight block mb-2 group-hover:underline">
          {name}
        </span>
        <div className="flex items-center justify-between">
          {/* Level indicator — mini bar */}
          <div className="flex gap-[3px]">
            {Array.from({ length: totalLevels }).map((_, i) => (
              <span
                key={i}
                className="h-[6px] rounded-full transition-all duration-300"
                style={{
                  width: i < levelsFilled ? 14 : 8,
                  background: i < levelsFilled ? themeColor : `${themeColor}20`,
                }}
              />
            ))}
          </div>
          {/* Status */}
          <span
            className={`font-mono text-[0.625rem] tracking-[0.1em] uppercase ${isHot ? 'font-bold' : ''}`}
            style={{ color: isHot ? themeColor : 'var(--color-dim, #8a929e)' }}
          >
            {statusText || `${levelsFilled}/${totalLevels}`}
          </span>
        </div>
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
 * 4 cols desktop, 3 tablet, 2 mobile.
 */
export function ControlPanel({ instruments, kicker, heading }: ControlPanelProps) {
  return (
    <section className="py-10 border-b border-rule-inner">
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {instruments.map((inst, i) => (
          <Instrument key={i} {...inst} />
        ))}
      </div>
    </section>
  )
}

export type { InstrumentProps }
