'use client'

import { THEMES } from '@/lib/constants'

const THEME_KEYS = Object.keys(THEMES) as Array<keyof typeof THEMES>

interface CompactCircleGraphProps {
  /** Highlighted pathway IDs (e.g. from focus areas on the current entity) */
  activePathways?: string[]
  /** Accent color for the center circle */
  accentColor?: string
}

/**
 * Compact Flower-of-Life circle graph for the Wayfinder sidebar.
 * Matches the Change Engine logo: 6 overlapping stroked circles
 * arranged in a FOL pattern with a small accent center circle.
 * Active pathways glow brighter; inactive are faint.
 */
export function CompactCircleGraph({ activePathways = [], accentColor }: CompactCircleGraphProps) {
  const cx = 80
  const cy = 80
  const r = 28 // petal radius — sized so circles overlap significantly
  const orbit = 28 // distance from center to petal center (equal to r for classic FOL)

  // 6 petals at 60-degree intervals, starting from top (-90 deg)
  // This matches the logo's arrangement
  const petalAngles = [-90, -30, 30, 90, 150, 210]

  // Map petals to theme keys (skip THEME_01 which is the center)
  const petalThemes = THEME_KEYS.slice(1, 7)

  // Center theme (THEME_01)
  const centerKey = THEME_KEYS[0]
  const centerTheme = THEMES[centerKey] as { name: string; color: string }
  const centerActive = activePathways.includes(centerKey)

  return (
    <div className="flex items-center justify-center py-3">
      <svg width="160" height="160" viewBox="0 0 160 160" className="overflow-visible">
        {/* 6 petal circles — stroked, overlapping */}
        {petalThemes.map(function (key, i) {
          const theme = THEMES[key] as { name: string; color: string }
          const angle = petalAngles[i]
          const rad = (angle * Math.PI) / 180
          const px = cx + orbit * Math.cos(rad)
          const py = cy + orbit * Math.sin(rad)
          const isActive = activePathways.includes(key)

          return (
            <g key={key}>
              {/* Glow ring for active pathways */}
              {isActive && (
                <circle
                  cx={px}
                  cy={py}
                  r={r + 3}
                  fill="none"
                  stroke={theme.color}
                  strokeWidth="2"
                  opacity="0.2"
                >
                  <animate attributeName="opacity" values="0.2;0.08;0.2" dur="4s" repeatCount="indefinite" />
                </circle>
              )}
              {/* Main petal circle — stroked like the logo */}
              <circle
                cx={px}
                cy={py}
                r={r}
                fill="none"
                stroke={theme.color}
                strokeWidth={isActive ? 2.5 : 1.5}
                opacity={isActive ? 0.85 : 0.25}
                className="transition-all duration-500"
              />
            </g>
          )
        })}

        {/* Bridge lines between active petals — shows cross-pathway connections */}
        {petalThemes.map(function (keyA, i) {
          if (!activePathways.includes(keyA)) return null
          return petalThemes.slice(i + 1).map(function (keyB, j) {
            if (!activePathways.includes(keyB)) return null
            const idxB = i + 1 + j
            const radA = (petalAngles[i] * Math.PI) / 180
            const radB = (petalAngles[idxB] * Math.PI) / 180
            const ax = cx + orbit * Math.cos(radA)
            const ay = cy + orbit * Math.sin(radA)
            const bx = cx + orbit * Math.cos(radB)
            const by = cy + orbit * Math.sin(radB)
            return (
              <line
                key={keyA + '-' + keyB}
                x1={ax} y1={ay} x2={bx} y2={by}
                stroke="#C75B2A"
                strokeWidth="1"
                opacity="0.12"
                strokeDasharray="3 3"
                className="transition-all duration-500"
              />
            )
          })
        })}

        {/* Center accent circle — smaller, matching the logo's inner circle */}
        <circle
          cx={cx}
          cy={cy}
          r={r * 0.4}
          fill="none"
          stroke={accentColor || centerTheme.color || '#C75B2A'}
          strokeWidth={centerActive ? 2.5 : 1.5}
          opacity={centerActive ? 0.85 : 0.35}
          className="transition-all duration-500"
        />
      </svg>
    </div>
  )
}
