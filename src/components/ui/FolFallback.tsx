/**
 * @fileoverview Flower of Life fallback image for content without photos.
 *
 * Each pathway gets a unique sacred geometry motif drawn inline as SVG:
 *   THEME_01 (Health)       → Seed of Life — wholeness, wellness
 *   THEME_02 (Families)     → Nested Circles — protection, nurturing
 *   THEME_03 (Neighborhood) → Hex Grid — community structure
 *   THEME_04 (Voice)        → Compass Rose — direction, civic power
 *   THEME_05 (Money)        → Golden Spiral — growth, abundance
 *   THEME_06 (Planet)       → Flower of Life — interconnection
 *   THEME_07 (Bigger We)    → Torus — unity, flow across difference
 *
 * Supports three size presets: 'card' (default), 'thumb', 'hero'.
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

/** Height classes for each size preset. */
const SIZE_HEIGHTS: Record<string, string> = {
  thumb: 'h-9',
  card: 'h-32',
  hero: 'h-[220px]',
}

interface FolFallbackProps {
  /** Pathway ID (THEME_01–THEME_07) or hex color */
  pathway?: string | null
  /** CSS class for the container */
  className?: string
  /** Height class override (default: h-32) */
  height?: string
  /** Size preset — overrides height */
  size?: 'thumb' | 'card' | 'hero'
}

/**
 * Full-width Flower of Life fallback image.
 *
 * Uses the pathway to pick gradient colors and a unique sacred geometry motif.
 */
export function FolFallback({ pathway, className = '', height, size = 'card' }: FolFallbackProps) {
  const grad = (pathway && PATHWAY_GRADIENTS[pathway]) || DEFAULT_GRADIENT
  const themeEntry = pathway ? (THEMES as Record<string, { name: string }>)[pathway] : null
  const h = height || SIZE_HEIGHTS[size] || 'h-32'

  return (
    <div
      className={`w-full ${h} relative overflow-hidden ${className}`}
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
        <g opacity="0.15">
          {pathway ? renderMotif(pathway) : renderDefaultMotif()}
        </g>
      </svg>
    </div>
  )
}

/** THEME_01 — Seed of Life: 7 interlocking circles */
function SeedOfLife() {
  const r = 12, cx = 50, cy = 50
  const offsets = [
    [0, 0], [r, 0], [-r, 0],
    [r / 2, -r * 0.866], [-r / 2, -r * 0.866],
    [r / 2, r * 0.866], [-r / 2, r * 0.866],
  ]
  return (
    <>
      {offsets.map(function ([dx, dy], i) {
        return <circle key={i} cx={cx + dx} cy={cy + dy} r={r} stroke="white" strokeWidth={i === 0 ? '0.7' : '0.5'} />
      })}
      <circle cx={cx} cy={cy} r={r * 2.2} stroke="white" strokeWidth="0.3" opacity="0.5" />
    </>
  )
}

/** THEME_02 — Nested Circles with petal trio */
function NestedCirclesMotif() {
  return (
    <>
      <circle cx="50" cy="50" r="30" stroke="white" strokeWidth="0.4" opacity="0.4" />
      <circle cx="50" cy="50" r="22" stroke="white" strokeWidth="0.5" opacity="0.6" />
      <circle cx="50" cy="50" r="14" stroke="white" strokeWidth="0.6" opacity="0.75" />
      <circle cx="50" cy="50" r="7"  stroke="white" strokeWidth="0.7" opacity="0.9" />
      <circle cx="50" cy="50" r="3"  stroke="white" strokeWidth="0.8" fill="white" fillOpacity="0.15" />
      <path d="M50 50 Q56 42 50 34 Q44 42 50 50Z" stroke="white" strokeWidth="0.4" fill="white" fillOpacity="0.06" />
      <path d="M50 50 Q58 54 56 64 Q48 56 50 50Z" stroke="white" strokeWidth="0.4" fill="white" fillOpacity="0.06" />
      <path d="M50 50 Q42 54 44 64 Q52 56 50 50Z" stroke="white" strokeWidth="0.4" fill="white" fillOpacity="0.06" />
    </>
  )
}

/** THEME_03 — Hex Grid: tessellated hexagons */
function HexGridMotif() {
  const hexPoints = function (cx: number, cy: number, r: number) {
    return Array.from({ length: 6 }, function (_, i) {
      const a = (Math.PI / 3) * i - Math.PI / 6
      return (cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1)
    }).join(' ')
  }
  const r = 10
  const dx = r * 1.732
  const dy = r * 1.5
  const centers = [
    [50, 50],
    [50 + dx, 50], [50 - dx, 50],
    [50 + dx / 2, 50 - dy], [50 - dx / 2, 50 - dy],
    [50 + dx / 2, 50 + dy], [50 - dx / 2, 50 + dy],
    [50 + dx, 50 - dy], [50 - dx, 50 - dy],
    [50 + dx, 50 + dy], [50 - dx, 50 + dy],
    [50, 50 - 2 * dy], [50, 50 + 2 * dy],
  ]
  return (
    <>
      {centers.map(function ([cx, cy], i) {
        const op = i === 0 ? '0.8' : i < 7 ? '0.5' : '0.25'
        return <polygon key={i} points={hexPoints(cx, cy, r)} stroke="white" strokeWidth={i === 0 ? '0.6' : '0.35'} opacity={op} fill="none" />
      })}
      <circle cx="50" cy="50" r="3" stroke="white" strokeWidth="0.5" opacity="0.6" />
    </>
  )
}

/** THEME_04 — Compass Rose: cross inscribed in concentric circles */
function CompassRoseMotif() {
  return (
    <>
      <circle cx="50" cy="50" r="28" stroke="white" strokeWidth="0.5" opacity="0.4" />
      <circle cx="50" cy="50" r="18" stroke="white" strokeWidth="0.5" opacity="0.6" />
      <circle cx="50" cy="50" r="9"  stroke="white" strokeWidth="0.6" opacity="0.8" />
      <line x1="50" y1="20" x2="50" y2="80" stroke="white" strokeWidth="0.5" />
      <line x1="20" y1="50" x2="80" y2="50" stroke="white" strokeWidth="0.5" />
      <line x1="29" y1="29" x2="71" y2="71" stroke="white" strokeWidth="0.3" opacity="0.4" />
      <line x1="71" y1="29" x2="29" y2="71" stroke="white" strokeWidth="0.3" opacity="0.4" />
      <circle cx="50" cy="20" r="3" stroke="white" strokeWidth="0.5" />
      <circle cx="80" cy="50" r="3" stroke="white" strokeWidth="0.5" />
      <circle cx="50" cy="80" r="3" stroke="white" strokeWidth="0.5" />
      <circle cx="20" cy="50" r="3" stroke="white" strokeWidth="0.5" />
    </>
  )
}

/** THEME_05 — Golden Spiral: expanding arcs with ratio guides */
function GoldenSpiralMotif() {
  return (
    <>
      <path
        d="M50 50 Q50 38 62 38 Q74 38 74 50 Q74 68 50 68 Q26 68 26 50 Q26 26 50 26 Q80 26 80 50"
        stroke="white" strokeWidth="0.6" opacity="0.7" fill="none"
      />
      <path
        d="M80 50 Q80 80 50 80 Q14 80 14 50"
        stroke="white" strokeWidth="0.4" opacity="0.4" fill="none"
      />
      <rect x="38" y="38" width="24" height="24" stroke="white" strokeWidth="0.3" opacity="0.25" />
      <rect x="26" y="26" width="48" height="48" stroke="white" strokeWidth="0.25" opacity="0.2" />
      <circle cx="50" cy="50" r="2" stroke="white" strokeWidth="0.5" fill="white" fillOpacity="0.2" />
      <circle cx="50" cy="50" r="30" stroke="white" strokeWidth="0.25" opacity="0.2" />
    </>
  )
}

/** THEME_06 — Full Flower of Life: 19 circles */
function FlowerOfLifeMotif() {
  const r = 9, cx = 50, cy = 50
  const rings = [
    [[0, 0]],
    [[r, 0], [-r, 0], [r / 2, -r * 0.866], [-r / 2, -r * 0.866], [r / 2, r * 0.866], [-r / 2, r * 0.866]],
    [[2 * r, 0], [-2 * r, 0], [1.5 * r, -r * 0.866], [-1.5 * r, -r * 0.866], [1.5 * r, r * 0.866], [-1.5 * r, r * 0.866],
     [0, -2 * r * 0.866], [0, 2 * r * 0.866], [r, -2 * r * 0.866], [-r, -2 * r * 0.866], [r, 2 * r * 0.866], [-r, 2 * r * 0.866]],
  ]
  return (
    <>
      {rings.map(function (ring, ri) {
        return ring.map(function ([dx, dy], ci) {
          const op = ri === 0 ? 0.8 : ri === 1 ? 0.5 : 0.3
          return <circle key={ri + '-' + ci} cx={cx + dx} cy={cy + dy} r={r} stroke="white" strokeWidth={ri === 0 ? '0.6' : '0.35'} opacity={op} />
        })
      })}
      <circle cx={cx} cy={cy} r={r * 3} stroke="white" strokeWidth="0.3" opacity="0.25" />
    </>
  )
}

/** THEME_07 — Torus: overlapping rings radiating from center */
function TorusMotif() {
  const cx = 50, cy = 50, r = 16
  return (
    <>
      {Array.from({ length: 12 }, function (_, i) {
        const angle = (Math.PI / 6) * i
        const ox = cx + r * 0.6 * Math.cos(angle)
        const oy = cy + r * 0.6 * Math.sin(angle)
        return <circle key={i} cx={ox} cy={oy} r={r} stroke="white" strokeWidth="0.35" opacity={0.3 + (i % 3) * 0.1} />
      })}
      <circle cx={cx} cy={cy} r={r * 0.6} stroke="white" strokeWidth="0.5" opacity="0.6" />
      <circle cx={cx} cy={cy} r={r * 1.6} stroke="white" strokeWidth="0.3" opacity="0.3" />
      <circle cx={cx} cy={cy} r="2" fill="white" fillOpacity="0.3" />
    </>
  )
}

/** Default motif when no pathway is specified — simple seed of life */
function renderDefaultMotif() {
  return <SeedOfLife />
}

/** Route a pathway ID to its unique motif */
function renderMotif(pathway: string) {
  switch (pathway) {
    case 'THEME_01': return <SeedOfLife />
    case 'THEME_02': return <NestedCirclesMotif />
    case 'THEME_03': return <HexGridMotif />
    case 'THEME_04': return <CompassRoseMotif />
    case 'THEME_05': return <GoldenSpiralMotif />
    case 'THEME_06': return <FlowerOfLifeMotif />
    case 'THEME_07': return <TorusMotif />
    default: return <SeedOfLife />
  }
}
