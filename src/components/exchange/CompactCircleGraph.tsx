'use client'

import { THEMES } from '@/lib/constants'

const THEME_KEYS = Object.keys(THEMES) as Array<keyof typeof THEMES>

interface CompactCircleGraphProps {
  /** Highlighted pathway IDs (e.g. from focus areas on the current entity) */
  activePathways?: string[]
  /** Accent color for the glow ring */
  accentColor?: string
}

/**
 * Compact 7-circle flower arrangement for the wayfinder sidebar.
 * Shows the 7 pathways as small circles in a Flower-of-Life pattern,
 * with active pathways pulsing/highlighted.
 */
export function CompactCircleGraph({ activePathways = [], accentColor }: CompactCircleGraphProps) {
  const r = 18
  const cx = 80
  const cy = 80
  const orbit = 28

  const angles = [0, 60, 120, 180, 240, 300]

  return (
    <div className="flex items-center justify-center py-3">
      <svg width="160" height="160" viewBox="0 0 160 160" className="overflow-visible">
        {/* Outer bounding circle */}
        <circle cx={cx} cy={cy} r={orbit + r + 6} fill="none" stroke="#D1D5E0" strokeWidth="0.5" opacity="0.4" />

        {/* Center circle — always the brand accent or first active pathway */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={accentColor || '#C75B2A'}
          strokeWidth="1.5"
          opacity="0.3"
        />

        {/* 6 surrounding pathway circles (THEME_01 is center, THEME_02–07 are petals) */}
        {THEME_KEYS.slice(1).map(function (key, i) {
          const theme = THEMES[key] as { name: string; color: string }
          const rad = (angles[i] * Math.PI) / 180
          const px = cx + orbit * Math.cos(rad)
          const py = cy + orbit * Math.sin(rad)
          const isActive = activePathways.includes(key)

          return (
            <g key={key}>
              {isActive && (
                <circle
                  cx={px}
                  cy={py}
                  r={r + 4}
                  fill="none"
                  stroke={theme.color}
                  strokeWidth="1"
                  opacity="0.3"
                >
                  <animate attributeName="r" values={`${r + 2};${r + 6};${r + 2}`} dur="3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.3;0.15;0.3" dur="3s" repeatCount="indefinite" />
                </circle>
              )}
              <circle
                cx={px}
                cy={py}
                r={isActive ? r * 0.65 : r * 0.45}
                fill={theme.color}
                opacity={isActive ? 0.85 : 0.25}
                className="transition-all duration-500"
              />
            </g>
          )
        })}

        {/* Center pathway (THEME_01) */}
        {(() => {
          const key = THEME_KEYS[0]
          const theme = THEMES[key] as { name: string; color: string }
          const isActive = activePathways.includes(key)
          return (
            <g>
              {isActive && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={r + 4}
                  fill="none"
                  stroke={theme.color}
                  strokeWidth="1"
                  opacity="0.3"
                >
                  <animate attributeName="r" values={`${r + 2};${r + 6};${r + 2}`} dur="3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.3;0.15;0.3" dur="3s" repeatCount="indefinite" />
                </circle>
              )}
              <circle
                cx={cx}
                cy={cy}
                r={isActive ? r * 0.65 : r * 0.45}
                fill={theme.color}
                opacity={isActive ? 0.85 : 0.25}
                className="transition-all duration-500"
              />
            </g>
          )
        })()}
      </svg>
    </div>
  )
}
