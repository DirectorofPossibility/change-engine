'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { THEMES } from '@/lib/constants'

/**
 * Interactive Flower of Life navigation — 7 petals, each a pathway.
 * Full FOL geometry: center + inner ring (6) + outer ring (12) = 19 circles.
 * Labels hidden by default, appear on hover.
 */

const CX = 200
const CY = 200
const R = 58 // petal radius

// 6 outer petals at 60-degree intervals (starting at top = -90deg)
const OUTER_ANGLES = [-90, -30, 30, 90, 150, 210]

// Map THEME_IDs to petal positions
const PETAL_MAP = [
  { themeId: 'THEME_01', angle: -90 },   // Health — top
  { themeId: 'THEME_02', angle: -30 },   // Families — top right
  { themeId: 'THEME_03', angle: 30 },    // Neighborhood — bottom right
  { themeId: 'THEME_04', angle: 90 },    // Voice — bottom
  { themeId: 'THEME_05', angle: 150 },   // Money — bottom left
  { themeId: 'THEME_06', angle: 210 },   // Planet — top left
]

const CENTER_THEME_ID = 'THEME_07' as keyof typeof THEMES

function petalCenter(angle: number, dist: number = R): [number, number] {
  const rad = (angle * Math.PI) / 180
  return [CX + dist * Math.cos(rad), CY + dist * Math.sin(rad)]
}

// Outer ring: 12 circles at distance R * sqrt(3) ≈ R * 1.732
const OUTER_RING_DIST = R * Math.sqrt(3)
const OUTER_RING_ANGLES = Array.from({ length: 12 }, (_, i) => -90 + i * 30)

interface InteractiveFOLProps {
  pathwayCounts?: Record<string, number>
}

export function InteractiveFOL({ pathwayCounts = {} }: InteractiveFOLProps) {
  const [hovered, setHovered] = useState<string | null>(null)
  const router = useRouter()

  const centerTheme = THEMES[CENTER_THEME_ID as keyof typeof THEMES]

  function handleClick(slug: string) {
    router.push('/pathways/' + slug)
  }

  // Label position — push labels outward from center
  function labelPos(angle: number): [number, number] {
    const rad = (angle * Math.PI) / 180
    const dist = R * 1.75
    return [CX + dist * Math.cos(rad), CY + dist * Math.sin(rad)]
  }

  return (
    <div className="relative w-full max-w-[504px] mx-auto">
      <svg
        viewBox="0 0 400 400"
        className="w-full h-auto"
        aria-label="Flower of Life pathway navigation"
      >
        {/* Outermost boundary circle */}
        <circle
          cx={CX} cy={CY} r={R * 2.6}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1.5"
          fill="none"
        />
        <circle
          cx={CX} cy={CY} r={R * 2.3}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="2"
          fill="none"
        />

        {/* Outer ring — 12 decorative circles (Flower of Life layer 2) */}
        {OUTER_RING_ANGLES.map(function (angle, i) {
          const [px, py] = petalCenter(angle, OUTER_RING_DIST)
          return (
            <circle
              key={'outer-' + i}
              cx={px} cy={py} r={R}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1.5"
              fill="rgba(255,255,255,0.015)"
            />
          )
        })}

        {/* Inner ring — 6 Seed of Life circles with overlap fill */}
        {OUTER_ANGLES.map(function (angle, i) {
          const [px, py] = petalCenter(angle)
          return (
            <circle
              key={'geo-' + i}
              cx={px} cy={py} r={R}
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="2"
              fill="rgba(255,255,255,0.03)"
            />
          )
        })}

        {/* Center geometry circle with overlap fill */}
        <circle
          cx={CX} cy={CY} r={R}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="2"
          fill="rgba(255,255,255,0.03)"
        />

        {/* Intermediate ring — 6 circles offset 30deg at R distance (adds density) */}
        {OUTER_ANGLES.map(function (angle, i) {
          const offsetAngle = angle + 30
          const [px, py] = petalCenter(offsetAngle, R * 1.15)
          return (
            <circle
              key={'mid-' + i}
              cx={px} cy={py} r={R * 0.7}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="1.2"
              fill="rgba(255,255,255,0.02)"
            />
          )
        })}

        {/* 6 outer petals — clickable */}
        {PETAL_MAP.map(function ({ themeId, angle }) {
          const theme = THEMES[themeId as keyof typeof THEMES]
          if (!theme) return null
          const [px, py] = petalCenter(angle)
          const isHovered = hovered === themeId
          const count = pathwayCounts[themeId] || 0

          return (
            <g
              key={themeId}
              className="cursor-pointer"
              onPointerEnter={function () { setHovered(themeId) }}
              onPointerLeave={function () { setHovered(null) }}
              onClick={function () { handleClick(theme.slug) }}
              role="button"
              tabIndex={0}
              aria-label={theme.name + ' — ' + count + ' resources'}
              onKeyDown={function (e) { if (e.key === 'Enter') handleClick(theme.slug) }}
            >
              {/* Petal circle */}
              <circle
                cx={px} cy={py}
                r={isHovered ? R * 0.52 : R * 0.45}
                fill={isHovered ? theme.color + '30' : theme.color + '15'}
                stroke={theme.color}
                strokeWidth={isHovered ? 3 : 2}
                style={{ transition: 'all 0.25s ease' }}
              />
              {/* Inner dot */}
              <circle
                cx={px} cy={py}
                r={isHovered ? 7 : 5}
                fill={theme.color}
                style={{ transition: 'all 0.25s ease' }}
              />
            </g>
          )
        })}

        {/* Center petal — The Bigger We */}
        <g
          className="cursor-pointer"
          onPointerEnter={function () { setHovered(CENTER_THEME_ID) }}
          onPointerLeave={function () { setHovered(null) }}
          onClick={function () { handleClick(centerTheme.slug) }}
          role="button"
          tabIndex={0}
          aria-label={centerTheme.name}
          onKeyDown={function (e) { if (e.key === 'Enter') handleClick(centerTheme.slug) }}
        >
          <circle
            cx={CX} cy={CY}
            r={hovered === CENTER_THEME_ID ? R * 0.52 : R * 0.45}
            fill={hovered === CENTER_THEME_ID ? centerTheme.color + '30' : centerTheme.color + '15'}
            stroke={centerTheme.color}
            strokeWidth={hovered === CENTER_THEME_ID ? 3 : 2}
            style={{ transition: 'all 0.25s ease' }}
          />
          {/* "You" dot at center */}
          <circle
            cx={CX} cy={CY}
            r={hovered === CENTER_THEME_ID ? 9 : 7}
            fill="white"
            stroke={centerTheme.color}
            strokeWidth="2"
            style={{ transition: 'all 0.25s ease' }}
          />
        </g>

        {/* Hover labels — only visible on hover */}
        {PETAL_MAP.map(function ({ themeId, angle }) {
          const theme = THEMES[themeId as keyof typeof THEMES]
          if (!theme) return null
          const [lx, ly] = labelPos(angle)
          const isHovered = hovered === themeId
          const count = pathwayCounts[themeId] || 0

          if (!isHovered) return null

          let anchor: 'start' | 'middle' | 'end' = 'middle'
          if (angle > -80 && angle < 80) anchor = 'start'
          if (angle > 100 && angle < 260) anchor = 'end'
          if (angle === -90 || angle === 90) anchor = 'middle'

          return (
            <g key={'label-' + themeId}>
              <text
                x={lx} y={ly}
                textAnchor={anchor}
                dominantBaseline="central"
                className="pointer-events-none select-none"
                style={{
                  fill: 'white',
                  fontSize: 14,
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  transition: 'all 0.25s ease',
                }}
              >
                {theme.name}
              </text>
              {count > 0 && (
                <text
                  x={lx} y={ly + 16}
                  textAnchor={anchor}
                  dominantBaseline="central"
                  className="pointer-events-none select-none"
                  style={{
                    fill: 'rgba(255,255,255,0.45)',
                    fontSize: 10,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {count} resources
                </text>
              )}
            </g>
          )
        })}

        {/* Center label — only on hover */}
        {hovered === CENTER_THEME_ID && (
          <text
            x={CX} y={CY + R * 0.75}
            textAnchor="middle"
            className="pointer-events-none select-none"
            style={{
              fill: 'white',
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
            }}
          >
            The Bigger We
          </text>
        )}
      </svg>

      {/* Mobile fallback — simple list below md */}
      <div className="md:hidden mt-6 space-y-2">
        {[...PETAL_MAP.map(function (p) { return p.themeId }), CENTER_THEME_ID].map(function (themeId) {
          const theme = THEMES[themeId as keyof typeof THEMES]
          if (!theme) return null
          const count = pathwayCounts[themeId] || 0
          return (
            <button
              key={themeId}
              onClick={function () { handleClick(theme.slug) }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
              style={{ background: theme.color + '12', borderLeft: '3px solid ' + theme.color }}
            >
              <span className="w-2.5 h-2.5 flex-shrink-0" style={{ background: theme.color }} />
              <span className="flex-1 text-sm text-white font-medium">{theme.name}</span>
              {count > 0 && (
                <span className="text-[11px] font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>{count}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
