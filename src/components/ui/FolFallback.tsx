/**
 * @fileoverview Flower of Life fallback image for content without photos.
 *
 * Renders a pathway-colored gradient background with an SVG Flower of Life
 * pattern. Each pathway gets a unique geometric variation (rotation, scale,
 * number of rings) so the fallback feels intentional, not broken.
 *
 * Drop-in replacement for gradient+skyline and gradient+circles placeholders.
 */

import { THEMES } from '@/lib/constants'

/** Gradient endpoints per pathway — darker, editorial feel. */
const PATHWAY_GRADIENTS: Record<string, { from: string; to: string; angle: number }> = {
  THEME_01: { from: '#1a6b56', to: '#0a2a22', angle: 135 },
  THEME_02: { from: '#1e4d7a', to: '#0e2a45', angle: 150 },
  THEME_03: { from: '#4a2870', to: '#2a1640', angle: 120 },
  THEME_04: { from: '#7a2018', to: '#4a1210', angle: 160 },
  THEME_05: { from: '#6a4e10', to: '#3a2a08', angle: 140 },
  THEME_06: { from: '#1a5030', to: '#0a2818', angle: 130 },
  THEME_07: { from: '#1b5e8a', to: '#0a1a30', angle: 145 },
}

const DEFAULT_GRADIENT = { from: '#5c6474', to: '#2c3038', angle: 135 }

/**
 * Geometric variation per pathway: rotate the FOL differently and offset
 * the pattern so each pathway has a distinct visual fingerprint.
 */
const PATHWAY_GEOMETRY: Record<string, { rotate: number; scale: number; cx: number; cy: number }> = {
  THEME_01: { rotate: 0,   scale: 1.0,  cx: 50, cy: 50 },
  THEME_02: { rotate: 15,  scale: 1.1,  cx: 55, cy: 45 },
  THEME_03: { rotate: 30,  scale: 0.9,  cx: 45, cy: 55 },
  THEME_04: { rotate: -10, scale: 1.05, cx: 50, cy: 48 },
  THEME_05: { rotate: 20,  scale: 1.15, cx: 48, cy: 52 },
  THEME_06: { rotate: -15, scale: 0.95, cx: 52, cy: 50 },
  THEME_07: { rotate: 45,  scale: 1.0,  cx: 50, cy: 50 },
}

const DEFAULT_GEOMETRY = { rotate: 0, scale: 1.0, cx: 50, cy: 50 }

interface FolFallbackProps {
  /** Pathway ID (THEME_01–THEME_07) or hex color */
  pathway?: string | null
  /** CSS class for the container */
  className?: string
  /** Height class override (default: h-32) */
  height?: string
}

/**
 * Full-width Flower of Life fallback image.
 *
 * Uses the pathway to pick gradient colors and geometric variation.
 * Renders an SVG FOL at low opacity over the gradient.
 */
export function FolFallback({ pathway, className = '', height = 'h-32' }: FolFallbackProps) {
  const grad = (pathway && PATHWAY_GRADIENTS[pathway]) || DEFAULT_GRADIENT
  const geo = (pathway && PATHWAY_GEOMETRY[pathway]) || DEFAULT_GEOMETRY
  const themeEntry = pathway ? (THEMES as Record<string, { name: string }>)[pathway] : null

  return (
    <div
      className={`w-full ${height} relative overflow-hidden ${className}`}
      style={{ background: `linear-gradient(${grad.angle}deg, ${grad.from}, ${grad.to})` }}
      role="img"
      aria-label={themeEntry ? `${themeEntry.name} pathway` : 'Content placeholder'}
    >
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <g
          transform={`rotate(${geo.rotate} ${geo.cx} ${geo.cy}) scale(${geo.scale})`}
          opacity="0.12"
        >
          {/* Inner 7 — Seed of Life core */}
          <circle cx={geo.cx} cy={geo.cy} r="12" stroke="white" strokeWidth="0.5" />
          <circle cx={geo.cx + 12} cy={geo.cy} r="12" stroke="white" strokeWidth="0.5" />
          <circle cx={geo.cx - 12} cy={geo.cy} r="12" stroke="white" strokeWidth="0.5" />
          <circle cx={geo.cx + 6} cy={geo.cy - 10.4} r="12" stroke="white" strokeWidth="0.5" />
          <circle cx={geo.cx - 6} cy={geo.cy - 10.4} r="12" stroke="white" strokeWidth="0.5" />
          <circle cx={geo.cx + 6} cy={geo.cy + 10.4} r="12" stroke="white" strokeWidth="0.5" />
          <circle cx={geo.cx - 6} cy={geo.cy + 10.4} r="12" stroke="white" strokeWidth="0.5" />

          {/* Outer ring — second layer petals */}
          <circle cx={geo.cx + 24} cy={geo.cy} r="12" stroke="white" strokeWidth="0.3" opacity="0.6" />
          <circle cx={geo.cx - 24} cy={geo.cy} r="12" stroke="white" strokeWidth="0.3" opacity="0.6" />
          <circle cx={geo.cx + 18} cy={geo.cy - 20.8} r="12" stroke="white" strokeWidth="0.3" opacity="0.5" />
          <circle cx={geo.cx - 18} cy={geo.cy - 20.8} r="12" stroke="white" strokeWidth="0.3" opacity="0.5" />
          <circle cx={geo.cx + 18} cy={geo.cy + 20.8} r="12" stroke="white" strokeWidth="0.3" opacity="0.5" />
          <circle cx={geo.cx - 18} cy={geo.cy + 20.8} r="12" stroke="white" strokeWidth="0.3" opacity="0.5" />
          <circle cx={geo.cx} cy={geo.cy - 20.8} r="12" stroke="white" strokeWidth="0.3" opacity="0.55" />
          <circle cx={geo.cx} cy={geo.cy + 20.8} r="12" stroke="white" strokeWidth="0.3" opacity="0.55" />
          <circle cx={geo.cx + 12} cy={geo.cy - 20.8} r="12" stroke="white" strokeWidth="0.3" opacity="0.45" />
          <circle cx={geo.cx - 12} cy={geo.cy - 20.8} r="12" stroke="white" strokeWidth="0.3" opacity="0.45" />
          <circle cx={geo.cx + 12} cy={geo.cy + 20.8} r="12" stroke="white" strokeWidth="0.3" opacity="0.45" />
          <circle cx={geo.cx - 12} cy={geo.cy + 20.8} r="12" stroke="white" strokeWidth="0.3" opacity="0.45" />

          {/* Bounding circle */}
          <circle cx={geo.cx} cy={geo.cy} r="36" stroke="white" strokeWidth="0.4" opacity="0.3" />
        </g>
      </svg>
    </div>
  )
}
