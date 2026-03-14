'use client'

import { useId } from 'react'

/**
 * Animated Flower of Life with cycling color gradient.
 *
 * The signature brand element — slowly rotates while its stroke
 * color flows through the full Change Engine palette.
 *
 * Variants:
 *  - full: 19-circle Flower of Life (default)
 *  - seed: 7-circle Seed of Life (lighter)
 *  - divider: horizontal row of overlapping circles for section breaks
 */

interface GradientFOLProps {
  className?: string
  variant?: 'full' | 'seed' | 'divider'
  /** Override the color cycle. Defaults to full brand palette. */
  colors?: string[]
  /** Animation duration for color cycle (seconds). Default 12. */
  colorDur?: number
  /** Animation duration for rotation (seconds). Default 90. 0 = no rotation. */
  spinDur?: number
  /** Base opacity for strokes. Default 1 (caller controls via wrapper opacity). */
  strokeOpacity?: number
}

const BRAND_COLORS = '#1a6b56;#1b5e8a;#3a4a2a;#5c2d3e;#4a2870;#1a6b56'

function shiftColors(colors: string, offset: number): string {
  const parts = colors.split(';')
  const shifted = [...parts.slice(offset), ...parts.slice(0, offset)]
  return shifted.join(';')
}

export function GradientFOL({
  className = '',
  variant = 'full',
  colors,
  colorDur = 12,
  spinDur = 90,
  strokeOpacity = 1,
}: GradientFOLProps) {
  const reactId = useId()
  const gradId = 'fol-grad-' + reactId.replace(/:/g, '')
  const gradUrl = `url(#${gradId})`

  const colorString = colors ? colors.join(';') + ';' + colors[0] : BRAND_COLORS

  const gradientDef = (
    <defs>
      <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#C75B2A">
          <animate attributeName="stop-color" values={colorString} dur={`${colorDur}s`} repeatCount="indefinite" />
        </stop>
        <stop offset="50%" stopColor="#1b5e8a">
          <animate attributeName="stop-color" values={shiftColors(colorString, 1)} dur={`${colorDur}s`} repeatCount="indefinite" />
        </stop>
        <stop offset="100%" stopColor="#6a4e10">
          <animate attributeName="stop-color" values={shiftColors(colorString, 2)} dur={`${colorDur}s`} repeatCount="indefinite" />
        </stop>
      </linearGradient>
    </defs>
  )

  const spinStyle = spinDur > 0
    ? { animation: `fol-spin ${spinDur}s linear infinite` }
    : undefined

  if (variant === 'divider') {
    return <FOLDivider gradId={gradId} gradUrl={gradUrl} gradientDef={gradientDef} colorString={colorString} colorDur={colorDur} className={className} />
  }

  const r = 18, cx = 100, cy = 100, outerR = r * 1.732

  return (
    <svg
      viewBox="49 49 102 102"
      fill="none"
      className={`pointer-events-none ${className}`}
      aria-hidden="true"
      style={spinStyle}
    >
      {gradientDef}

      {/* Outer bounding circle */}
      <circle cx={cx} cy={cy} r={r * 2.2} stroke={gradUrl} strokeWidth="1.2" opacity={0.3 * strokeOpacity} />

      {/* Outer ring — 6 petals (full variant only) */}
      {variant === 'full' && [30, 90, 150, 210, 270, 330].map((deg, i) => {
        const rad = (deg * Math.PI) / 180
        return (
          <circle
            key={'o' + i}
            cx={cx + outerR * Math.cos(rad)}
            cy={cy + outerR * Math.sin(rad)}
            r={r}
            stroke={gradUrl}
            strokeWidth="1.5"
            opacity={0.5 * strokeOpacity}
          />
        )
      })}

      {/* Inner ring — 6 petals */}
      {[0, 60, 120, 180, 240, 300].map((deg, i) => {
        const rad = (deg * Math.PI) / 180
        return (
          <circle
            key={'i' + i}
            cx={cx + r * Math.cos(rad)}
            cy={cy + r * Math.sin(rad)}
            r={r}
            stroke={gradUrl}
            strokeWidth="2"
            opacity={0.85 * strokeOpacity}
          />
        )
      })}

      {/* Center circle */}
      <circle cx={cx} cy={cy} r={r} stroke={gradUrl} strokeWidth="2.5" opacity={strokeOpacity} />
      {/* Center dot */}
      <circle cx={cx} cy={cy} r="3" fill={gradUrl} opacity={0.6 * strokeOpacity} />
    </svg>
  )
}

/** Horizontal row of overlapping FOL circles — replaces spectrum-bar */
function FOLDivider({
  gradId,
  gradUrl,
  gradientDef,
  colorString,
  colorDur,
  className,
}: {
  gradId: string
  gradUrl: string
  gradientDef: React.ReactNode
  colorString: string
  colorDur: number
  className: string
}) {
  // 7 overlapping circles in a row (one per pathway color)
  const PATHWAY_COLORS = ['#1a6b56', '#1e4d7a', '#4a2870', '#5c2d3e', '#3a4a2a', '#1a5030', '#1b5e8a']
  const circleR = 8
  const spacing = 13
  const totalW = spacing * 6 + circleR * 2
  const h = circleR * 2 + 4

  return (
    <div className={`w-full flex justify-center ${className}`} aria-hidden="true">
      <svg
        viewBox={`0 0 ${totalW} ${h}`}
        fill="none"
        className="w-full max-w-[600px]"
        style={{ height: '20px' }}
      >
        {PATHWAY_COLORS.map((color, i) => (
          <circle
            key={i}
            cx={circleR + i * spacing}
            cy={h / 2}
            r={circleR}
            stroke={color}
            strokeWidth="1.5"
            opacity="0.6"
            fill={color}
            fillOpacity="0.08"
          >
            <animate
              attributeName="opacity"
              values="0.4;0.8;0.4"
              dur={`${3 + i * 0.5}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}
      </svg>
    </div>
  )
}

/** Small animated FOL for loading states */
export function FOLSpinner({ size = 40, className = '' }: { size?: number; className?: string }) {
  const reactId = useId()
  const gradId = 'fol-spinner-' + reactId.replace(/:/g, '')
  const gradUrl = `url(#${gradId})`
  const r = 18, cx = 100, cy = 100

  return (
    <svg
      width={size}
      height={size}
      viewBox="49 49 102 102"
      fill="none"
      className={`pointer-events-none ${className}`}
      aria-hidden="true"
      style={{ animation: 'fol-spin 4s linear infinite' }}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C75B2A">
            <animate attributeName="stop-color" values={BRAND_COLORS} dur="6s" repeatCount="indefinite" />
          </stop>
          <stop offset="50%" stopColor="#1b5e8a">
            <animate attributeName="stop-color" values={shiftColors(BRAND_COLORS, 1)} dur="6s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stopColor="#6a4e10">
            <animate attributeName="stop-color" values={shiftColors(BRAND_COLORS, 2)} dur="6s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>

      {/* Draw circles with staggered opacity animation to create "blooming" effect */}
      {[0, 60, 120, 180, 240, 300].map((deg, i) => {
        const rad = (deg * Math.PI) / 180
        return (
          <circle
            key={i}
            cx={cx + r * Math.cos(rad)}
            cy={cy + r * Math.sin(rad)}
            r={r}
            stroke={gradUrl}
            strokeWidth="2"
            opacity="0"
          >
            <animate
              attributeName="opacity"
              values="0;0.8;0"
              dur="3s"
              begin={`${i * 0.4}s`}
              repeatCount="indefinite"
            />
          </circle>
        )
      })}
      <circle cx={cx} cy={cy} r={r} stroke={gradUrl} strokeWidth="2.5" opacity="0.9" />
      <circle cx={cx} cy={cy} r="3" fill={gradUrl} opacity="0.6" />
    </svg>
  )
}
