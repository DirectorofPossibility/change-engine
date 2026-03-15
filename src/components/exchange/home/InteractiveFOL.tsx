'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { THEMES } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'

/**
 * Interactive Flower of Life navigation — 7 petals, each a pathway.
 * Full FOL geometry: center + inner ring (6) + outer ring (12) = 19 circles.
 * Center shows user profile pic when logged in.
 * Labels hidden by default, appear on hover.
 */

const CX = 200
const CY = 200
const R = 58 // petal radius
const PETAL_DIST = R * 0.82 // distance from center to petal center (overlap)

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

function circleAt(angle: number, dist: number): [number, number] {
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [initials, setInitials] = useState<string | null>(null)
  const router = useRouter()

  // Fetch user avatar on mount
  useEffect(function () {
    const supabase = createClient()
    supabase.auth.getUser().then(async function ({ data }) {
      const user = data?.user
      if (!user) return
      // Try auth metadata first, then user_profiles table
      let url = user.user_metadata?.avatar_url || user.user_metadata?.picture || null
      if (!url) {
        const { data: prof } = await (supabase
          .from('user_profiles') as any)
          .select('avatar_url')
          .eq('auth_id', user.id)
          .single()
        if (prof?.avatar_url) url = prof.avatar_url
      }
      if (url) setAvatarUrl(url)
      const name = user.user_metadata?.display_name || user.user_metadata?.full_name || user.email || ''
      if (name) {
        const parts = name.split(/[\s@]+/)
        setInitials((parts[0]?.[0] || '').toUpperCase() + (parts[1]?.[0] || '').toUpperCase())
      }
    })
  }, [])

  const centerTheme = THEMES[CENTER_THEME_ID as keyof typeof THEMES]
  const isLoggedIn = !!(avatarUrl || initials)

  function handleClick(slug: string) {
    router.push('/pathways/' + slug)
  }

  function handleCenterClick() {
    if (isLoggedIn) {
      router.push('/me')
    } else {
      handleClick(centerTheme.slug)
    }
  }

  // Label position — push labels outward from center
  function labelPos(angle: number): [number, number] {
    const rad = (angle * Math.PI) / 180
    const dist = R * 1.75
    return [CX + dist * Math.cos(rad), CY + dist * Math.sin(rad)]
  }

  // Profile pic radius
  const avatarR = 18

  return (
    <div className="relative w-full max-w-[1160px] mx-auto">
      <svg
        viewBox="0 0 400 400"
        className="w-full h-auto"
        aria-label="Flower of Life pathway navigation"
      >
        <defs>
          {/* Clip path for circular profile pic */}
          <clipPath id="avatar-clip">
            <circle cx={CX} cy={CY} r={avatarR} />
          </clipPath>
        </defs>

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

        {/* Outer ring — 12 decorative circles (lines only, no fill) */}
        {OUTER_RING_ANGLES.map(function (angle, i) {
          const [px, py] = circleAt(angle, OUTER_RING_DIST)
          return (
            <circle
              key={'outer-' + i}
              cx={px} cy={py} r={R}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
              fill="none"
            />
          )
        })}

        {/* Inner ring — 6 Seed of Life circles (lines only) */}
        {OUTER_ANGLES.map(function (angle, i) {
          const [px, py] = circleAt(angle, R)
          return (
            <circle
              key={'geo-' + i}
              cx={px} cy={py} r={R}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
              fill="none"
            />
          )
        })}

        {/* Center geometry circle (line only) */}
        <circle
          cx={CX} cy={CY} r={R}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
          fill="none"
        />

        {/* 6 outer petals — clickable, positioned closer to center for overlap */}
        {PETAL_MAP.map(function ({ themeId, angle }) {
          const theme = THEMES[themeId as keyof typeof THEMES]
          if (!theme) return null
          const [px, py] = circleAt(angle, PETAL_DIST)
          const isHovered = hovered === themeId
          const count = pathwayCounts[themeId] || 0
          const petalR = R * 0.48

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
                r={isHovered ? petalR * 1.1 : petalR}
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

        {/* Center petal — The Bigger We / User */}
        <g
          className="cursor-pointer"
          onPointerEnter={function () { setHovered(CENTER_THEME_ID) }}
          onPointerLeave={function () { setHovered(null) }}
          onClick={handleCenterClick}
          role="button"
          tabIndex={0}
          aria-label={isLoggedIn ? 'Your profile' : centerTheme.name}
          onKeyDown={function (e) { if (e.key === 'Enter') handleCenterClick() }}
        >
          <circle
            cx={CX} cy={CY}
            r={hovered === CENTER_THEME_ID ? R * 0.52 : R * 0.48}
            fill={hovered === CENTER_THEME_ID ? centerTheme.color + '30' : centerTheme.color + '15'}
            stroke={centerTheme.color}
            strokeWidth={hovered === CENTER_THEME_ID ? 3 : 2}
            style={{ transition: 'all 0.25s ease' }}
          />

          {/* Profile pic, initials, or white dot */}
          {avatarUrl ? (
            <>
              <circle
                cx={CX} cy={CY} r={avatarR + 2}
                fill="none"
                stroke={centerTheme.color}
                strokeWidth="2"
                style={{ transition: 'all 0.25s ease' }}
              />
              <image
                href={avatarUrl}
                x={CX - avatarR} y={CY - avatarR}
                width={avatarR * 2} height={avatarR * 2}
                clipPath="url(#avatar-clip)"
                preserveAspectRatio="xMidYMid slice"
              />
            </>
          ) : initials ? (
            <>
              <circle
                cx={CX} cy={CY}
                r={avatarR}
                fill={centerTheme.color + '40'}
                stroke={centerTheme.color}
                strokeWidth="2"
              />
              <text
                x={CX} y={CY}
                textAnchor="middle"
                dominantBaseline="central"
                className="pointer-events-none select-none"
                style={{
                  fill: 'white',
                  fontSize: 14,
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                }}
              >
                {initials}
              </text>
            </>
          ) : (
            <circle
              cx={CX} cy={CY}
              r={hovered === CENTER_THEME_ID ? 9 : 7}
              fill="white"
              stroke={centerTheme.color}
              strokeWidth="2"
              style={{ transition: 'all 0.25s ease' }}
            />
          )}
        </g>

        {/* Pathway name — only visible on hover */}
        {PETAL_MAP.map(function ({ themeId, angle }) {
          const theme = THEMES[themeId as keyof typeof THEMES]
          if (!theme) return null
          const [lx, ly] = labelPos(angle)
          const isHovered = hovered === themeId

          let anchor: 'start' | 'middle' | 'end' = 'middle'
          if (angle > -80 && angle < 80) anchor = 'start'
          if (angle > 100 && angle < 260) anchor = 'end'
          if (angle === -90 || angle === 90) anchor = 'middle'

          return (
            <g key={'label-' + themeId} className="pointer-events-none select-none">
              <text
                x={lx} y={ly}
                textAnchor={anchor}
                dominantBaseline="central"
                style={{
                  fill: 'white',
                  fontSize: 13,
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  opacity: isHovered ? 1 : 0,
                  transition: 'opacity 0.25s ease',
                }}
              >
                {theme.name}
              </text>
            </g>
          )
        })}
      </svg>

    </div>
  )
}
