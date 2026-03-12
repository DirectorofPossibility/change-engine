'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { THEMES } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'

const THEME_KEYS = Object.keys(THEMES) as Array<keyof typeof THEMES>

interface PathwayContextBarProps {
  /** Active pathway IDs (highlighted) */
  activePathways?: string[]
  /** Show label text alongside dots */
  showLabels?: boolean
}

/**
 * Seven-ring flower visualization with the user at the center.
 * Active pathways glow; inactive are muted. Center ring shows
 * user avatar/initial if logged in, or a neutral dot if not.
 */
export function PathwayContextBar({ activePathways = [], showLabels = false }: PathwayContextBarProps) {
  const [user, setUser] = useState<{ name: string; avatar: string | null } | null>(null)

  useEffect(function () {
    const supabase = createClient()
    supabase.auth.getUser().then(function ({ data }: { data: any }) {
      if (data.user) {
        const meta = data.user.user_metadata || {}
        setUser({
          name: meta.full_name || meta.name || data.user.email?.split('@')[0] || 'You',
          avatar: meta.avatar_url || null,
        })
      }
    })
  }, [])

  const r = 14           // petal circle radius
  const centerR = 16     // center circle radius
  const cx = 80          // center x
  const cy = 80          // center y
  const orbit = 32       // distance from center to petals
  const svgSize = 160

  // 6 petals around center (skip first theme which goes to center conceptually)
  // Actually, show all 7 as petals with user at true center
  const angles = [0, 360/7, 2*360/7, 3*360/7, 4*360/7, 5*360/7, 6*360/7]

  return (
    <div className="flex items-center gap-4 py-2">
      <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`} className="flex-shrink-0">
        {/* Connection lines from center to petals */}
        {THEME_KEYS.map(function (key, i) {
          const theme = THEMES[key]
          const isActive = activePathways.includes(key)
          const rad = (angles[i] - 90) * Math.PI / 180
          const px = cx + orbit * Math.cos(rad)
          const py = cy + orbit * Math.sin(rad)

          return (
            <line
              key={'line-' + key}
              x1={cx}
              y1={cy}
              x2={px}
              y2={py}
              stroke={theme.color}
              strokeWidth={isActive ? 1.5 : 0.5}
              opacity={isActive ? 0.4 : 0.15}
            />
          )
        })}

        {/* 7 pathway petal circles */}
        {THEME_KEYS.map(function (key, i) {
          const theme = THEMES[key]
          const isActive = activePathways.includes(key)
          const rad = (angles[i] - 90) * Math.PI / 180
          const px = cx + orbit * Math.cos(rad)
          const py = cy + orbit * Math.sin(rad)

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
                  <animate attributeName="r" values={`${r+3};${r+6};${r+3}`} dur="3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.3;0.1;0.3" dur="3s" repeatCount="indefinite" />
                </circle>
              )}
              <circle
                cx={px}
                cy={py}
                r={r}
                fill={isActive ? theme.color + '18' : 'transparent'}
                stroke={theme.color}
                strokeWidth={isActive ? 2 : 1}
                opacity={isActive ? 1 : 0.25}
              />
              <text
                x={px}
                y={py}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="7"
                fontWeight={isActive ? '600' : '400'}
                fill={theme.color}
                opacity={isActive ? 1 : 0.4}
              >
                {theme.name.replace('Our ', '').replace('The ', '')}
              </text>
            </g>
          )
        })}

        {/* Center circle — the user */}
        <circle
          cx={cx}
          cy={cy}
          r={centerR}
          fill="#f4f5f7"
          stroke="#C75B2A"
          strokeWidth="2"
        />
        {user?.avatar ? (
          <>
            <defs>
              <clipPath id="avatar-clip">
                <circle cx={cx} cy={cy} r={centerR - 2} />
              </clipPath>
            </defs>
            <image
              href={user.avatar}
              x={cx - centerR + 2}
              y={cy - centerR + 2}
              width={(centerR - 2) * 2}
              height={(centerR - 2) * 2}
              clipPath="url(#avatar-clip)"
            />
          </>
        ) : user ? (
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="12"
            fontWeight="700"
            fill="#C75B2A"
          >
            {user.name.charAt(0).toUpperCase()}
          </text>
        ) : (
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="8"
            fontWeight="600"
            fill="#C75B2A"
          >
            You
          </text>
        )}
      </svg>

      {/* Labels for active pathways */}
      {showLabels && activePathways.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activePathways.map(function (key) {
            const theme = THEMES[key as keyof typeof THEMES]
            if (!theme) return null
            return (
              <Link
                key={key}
                href={'/pathways/' + theme.slug}
                className="inline-flex items-center gap-1.5 text-sm font-medium hover:opacity-80 transition-opacity"
                style={{ color: theme.color }}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.color }} />
                {theme.name}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
