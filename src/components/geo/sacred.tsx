// ============================================================
// Change Engine — Sacred Geometry SVG Component Library
// /components/geo/index.tsx
//
// 13 components, one file. Each focus area and theme has a
// unique geometric identity built from sacred geometry.
// Drop this file into your project at components/geo/index.tsx
// ============================================================

import React from 'react'

export interface GeoProps {
  color?: string
  size?: number
  opacity?: number
  animated?: boolean
  className?: string
}

// ── LOOKUP MAP ──────────────────────────────────────────────
// Maps geo_type strings from Supabase to components

export const GEO_MAP: Record<string, React.ComponentType<GeoProps>> = {
  vesica_piscis:    VesicaPiscis,
  flower_of_life:   FlowerOfLife,
  compass_rose:     CompassRose,
  nested_circles:   NestedCircles,
  outward_spiral:   OutwardSpiral,
  hub_and_spokes:   HubAndSpokes,
  six_petal_rose:   SixPetalRose,
  torus:            Torus,
  seed_of_life:     SeedOfLife,
  hex_grid:         HexGrid,
  concentric_rings:  ConcentricRings,
  golden_spiral:    GoldenSpiral,
  metatron_cube:    MetatronCube,
}

export function Geo({
  type,
  ...props
}: { type: string } & GeoProps) {
  const Component = GEO_MAP[type]
  if (!Component) return null
  return <Component {...props} />
}

// ── SHARED STYLE HELPER ──────────────────────────────────────

function animClass(animated?: boolean) {
  return animated ? 'animate-[spin_90s_linear_infinite]' : ''
}


// ════════════════════════════════════════════════════════════
// 01  VESICA PISCIS
// Focus area: Mental Health
// Two overlapping circles forming a lens — duality,
// the space between mind and community.
// ════════════════════════════════════════════════════════════

export function VesicaPiscis({
  color = '#1a6b56',
  size = 140,
  opacity = 1,
  animated = false,
  className = '',
}: GeoProps) {
  const h = Math.round(size * (120 / 140))
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 140 120"
      fill="none"
      style={{ opacity }}
      className={`${animClass(animated)} ${className}`}
    >
      <circle cx="55" cy="60" r="38" stroke={color} strokeWidth="1.5" />
      <circle cx="85" cy="60" r="38" stroke={color} strokeWidth="1.5" />
      {/* Vesica lens */}
      <path
        d="M70 24.2 Q55 60 70 95.8 Q85 60 70 24.2Z"
        stroke={color}
        strokeWidth="1"
        fill={`${color}18`}
      />
      {/* Center line */}
      <line x1="70" y1="22" x2="70" y2="98" stroke={color} strokeWidth=".8" opacity=".4" />
      {/* Outer boundary */}
      <circle cx="70" cy="60" r="55" stroke={color} strokeWidth=".6" opacity=".3" />
      {/* Center dot */}
      <circle cx="70" cy="60" r="8" stroke={color} strokeWidth="1.2" opacity=".6" />
    </svg>
  )
}


// ════════════════════════════════════════════════════════════
// 02  FLOWER OF LIFE
// Focus area: Food Access
// Theme background: all regions
// Full Flower of Life — abundance, seeds, everything
// growing from the same center.
// ════════════════════════════════════════════════════════════

export function FlowerOfLife({
  color = '#1a6b56',
  size = 140,
  opacity = 1,
  animated = false,
  className = '',
}: GeoProps) {
  const h = Math.round(size * (120 / 140))
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 140 120"
      fill="none"
      style={{ opacity }}
      className={`${animClass(animated)} ${className}`}
    >
      {/* Inner 7 — Seed of Life */}
      <circle cx="70" cy="60" r="22" stroke={color} strokeWidth="1.5" />
      <circle cx="92" cy="60" r="22" stroke={color} strokeWidth="1.5" />
      <circle cx="48" cy="60" r="22" stroke={color} strokeWidth="1.5" />
      <circle cx="81" cy="41" r="22" stroke={color} strokeWidth="1.5" />
      <circle cx="59" cy="41" r="22" stroke={color} strokeWidth="1.5" />
      <circle cx="81" cy="79" r="22" stroke={color} strokeWidth="1.5" />
      <circle cx="59" cy="79" r="22" stroke={color} strokeWidth="1.5" />
      {/* Outer ring 1 */}
      <circle cx="114" cy="60" r="22" stroke={color} strokeWidth=".7" opacity=".45" />
      <circle cx="26"  cy="60" r="22" stroke={color} strokeWidth=".7" opacity=".45" />
      <circle cx="103" cy="22" r="22" stroke={color} strokeWidth=".7" opacity=".4" />
      <circle cx="37"  cy="22" r="22" stroke={color} strokeWidth=".7" opacity=".4" />
      <circle cx="103" cy="98" r="22" stroke={color} strokeWidth=".7" opacity=".4" />
      <circle cx="37"  cy="98" r="22" stroke={color} strokeWidth=".7" opacity=".4" />
    </svg>
  )
}


// ════════════════════════════════════════════════════════════
// 03  COMPASS ROSE
// Focus area: Healthcare Access
// Cross inscribed in concentric circles — navigation,
// finding your way, precision in care.
// ════════════════════════════════════════════════════════════

export function CompassRose({
  color = '#1a6b56',
  size = 140,
  opacity = 1,
  animated = false,
  className = '',
}: GeoProps) {
  const h = Math.round(size * (120 / 140))
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 140 120"
      fill="none"
      style={{ opacity }}
      className={`${animClass(animated)} ${className}`}
    >
      <circle cx="70" cy="60" r="48" stroke={color} strokeWidth="1.2" opacity=".5" />
      <circle cx="70" cy="60" r="32" stroke={color} strokeWidth="1"   opacity=".65" />
      <circle cx="70" cy="60" r="16" stroke={color} strokeWidth="1.2" opacity=".8" />
      {/* Cardinal cross */}
      <line x1="70" y1="12"  x2="70"  y2="108" stroke={color} strokeWidth="1.2" />
      <line x1="22" y1="60"  x2="118" y2="60"  stroke={color} strokeWidth="1.2" />
      {/* Intercardinal */}
      <line x1="36" y1="26"  x2="104" y2="94"  stroke={color} strokeWidth=".6" opacity=".4" />
      <line x1="104" y1="26" x2="36"  y2="94"  stroke={color} strokeWidth=".6" opacity=".4" />
      {/* Cardinal point circles */}
      <circle cx="70"  cy="12"  r="5" stroke={color} strokeWidth="1.2" fill="none" />
      <circle cx="118" cy="60"  r="5" stroke={color} strokeWidth="1.2" fill="none" />
      <circle cx="70"  cy="108" r="5" stroke={color} strokeWidth="1.2" fill="none" />
      <circle cx="22"  cy="60"  r="5" stroke={color} strokeWidth="1.2" fill="none" />
    </svg>
  )
}


// ════════════════════════════════════════════════════════════
// 04  NESTED CIRCLES
// Focus area: Maternal Health
// Concentric circles with petal geometry — womb,
// protection, new life held inside community.
// ════════════════════════════════════════════════════════════

export function NestedCircles({
  color = '#1a6b56',
  size = 140,
  opacity = 1,
  animated = false,
  className = '',
}: GeoProps) {
  const h = Math.round(size * (120 / 140))
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 140 120"
      fill="none"
      style={{ opacity }}
      className={`${animClass(animated)} ${className}`}
    >
      <circle cx="70" cy="60" r="50" stroke={color} strokeWidth="1"   opacity=".45" />
      <circle cx="70" cy="60" r="38" stroke={color} strokeWidth="1.2" opacity=".6" />
      <circle cx="70" cy="60" r="26" stroke={color} strokeWidth="1.4" opacity=".75" />
      <circle cx="70" cy="60" r="15" stroke={color} strokeWidth="1.6" opacity=".9" />
      <circle cx="70" cy="60" r="6"  stroke={color} strokeWidth="2"   fill={`${color}25`} />
      {/* Petal trio */}
      <path d="M70 60 Q80 45 70 30 Q60 45 70 60Z"  stroke={color} strokeWidth=".8" fill={`${color}11`} />
      <path d="M70 60 Q85 68 82 84 Q68 70 70 60Z"  stroke={color} strokeWidth=".8" fill={`${color}11`} />
      <path d="M70 60 Q55 68 58 84 Q72 70 70 60Z"  stroke={color} strokeWidth=".8" fill={`${color}11`} />
    </svg>
  )
}


// ════════════════════════════════════════════════════════════
// 05  OUTWARD SPIRAL
// Focus area: Substance Use & Recovery
// Expanding Archimedean spiral from a single center —
// transformation, the path out, recovery as motion.
// ════════════════════════════════════════════════════════════

export function OutwardSpiral({
  color = '#1a6b56',
  size = 140,
  opacity = 1,
  animated = false,
  className = '',
}: GeoProps) {
  const h = Math.round(size * (120 / 140))
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 140 120"
      fill="none"
      style={{ opacity }}
      className={`${animClass(animated)} ${className}`}
    >
      <path
        d="M70 60
           Q70 48 82 48
           Q94 48 94 60
           Q94 78 70 78
           Q46 78 46 60
           Q46 36 70 36
           Q100 36 100 60
           Q100 88 70 88
           Q38 88 38 60
           Q38 28 70 28
           Q108 28 108 60"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
      />
      {/* Center origin */}
      <circle cx="70"  cy="60" r="6" stroke={color} strokeWidth="1.5" fill={`${color}18`} />
      {/* End point */}
      <circle cx="108" cy="60" r="4" stroke={color} strokeWidth="1.2" fill="none" />
      {/* Outer boundary */}
      <circle cx="70"  cy="60" r="50" stroke={color} strokeWidth=".5" opacity=".2" />
    </svg>
  )
}


// ════════════════════════════════════════════════════════════
// 06  HUB AND SPOKES
// Focus area: Disability & Access
// Radial wheel — full symmetry, every direction
// accessible from the same center.
// ════════════════════════════════════════════════════════════

export function HubAndSpokes({
  color = '#1a6b56',
  size = 140,
  opacity = 1,
  animated = false,
  className = '',
}: GeoProps) {
  const h = Math.round(size * (120 / 140))
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 140 120"
      fill="none"
      style={{ opacity }}
      className={`${animClass(animated)} ${className}`}
    >
      <circle cx="70" cy="60" r="48" stroke={color} strokeWidth="1"   opacity=".5" />
      <circle cx="70" cy="60" r="30" stroke={color} strokeWidth="1.2" opacity=".7" />
      <circle cx="70" cy="60" r="10" stroke={color} strokeWidth="1.5" fill={`${color}18`} />
      {/* Cardinal spokes */}
      <line x1="70" y1="50" x2="70"  y2="12"  stroke={color} strokeWidth="1.2" />
      <line x1="70" y1="70" x2="70"  y2="108" stroke={color} strokeWidth="1.2" />
      <line x1="60" y1="60" x2="22"  y2="60"  stroke={color} strokeWidth="1.2" />
      <line x1="80" y1="60" x2="118" y2="60"  stroke={color} strokeWidth="1.2" />
      {/* Intercardinal spokes */}
      <line x1="63" y1="53" x2="36"  y2="26"  stroke={color} strokeWidth=".8" opacity=".6" />
      <line x1="77" y1="53" x2="104" y2="26"  stroke={color} strokeWidth=".8" opacity=".6" />
      <line x1="63" y1="67" x2="36"  y2="94"  stroke={color} strokeWidth=".8" opacity=".6" />
      <line x1="77" y1="67" x2="104" y2="94"  stroke={color} strokeWidth=".8" opacity=".6" />
      {/* Spoke end circles */}
      <circle cx="70"  cy="12"  r="4" stroke={color} strokeWidth="1.2" fill="none" />
      <circle cx="118" cy="60"  r="4" stroke={color} strokeWidth="1.2" fill="none" />
      <circle cx="70"  cy="108" r="4" stroke={color} strokeWidth="1.2" fill="none" />
      <circle cx="22"  cy="60"  r="4" stroke={color} strokeWidth="1.2" fill="none" />
    </svg>
  )
}


// ════════════════════════════════════════════════════════════
// 07  SIX PETAL ROSE
// Focus area: Oral Health
// Six circles around a center forming a rose —
// simple, complete, whole.
// ════════════════════════════════════════════════════════════

export function SixPetalRose({
  color = '#1a6b56',
  size = 140,
  opacity = 1,
  animated = false,
  className = '',
}: GeoProps) {
  const h = Math.round(size * (120 / 140))
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 140 120"
      fill="none"
      style={{ opacity }}
      className={`${animClass(animated)} ${className}`}
    >
      {/* 6 petals */}
      <circle cx="70" cy="38" r="22" stroke={color} strokeWidth="1.2" opacity=".8" />
      <circle cx="70" cy="82" r="22" stroke={color} strokeWidth="1.2" opacity=".8" />
      <circle cx="51" cy="49" r="22" stroke={color} strokeWidth="1.2" opacity=".8" />
      <circle cx="89" cy="49" r="22" stroke={color} strokeWidth="1.2" opacity=".8" />
      <circle cx="51" cy="71" r="22" stroke={color} strokeWidth="1.2" opacity=".8" />
      <circle cx="89" cy="71" r="22" stroke={color} strokeWidth="1.2" opacity=".8" />
      {/* Center */}
      <circle cx="70" cy="60" r="22" stroke={color} strokeWidth="1.5" />
      <circle cx="70" cy="60" r="8"  stroke={color} strokeWidth="1.2" fill={`${color}20`} />
      {/* Outer boundary */}
      <circle cx="70" cy="60" r="52" stroke={color} strokeWidth=".5" opacity=".25" />
    </svg>
  )
}


// ════════════════════════════════════════════════════════════
// 08  TORUS
// Focus area: Environmental Health
// Theme: Our Planet
// Torus cross-section viewed from above — Earth's
// field, atmosphere, the system we all live inside.
// ════════════════════════════════════════════════════════════

export function Torus({
  color = '#1a6b56',
  size = 140,
  opacity = 1,
  animated = false,
  className = '',
}: GeoProps) {
  const h = Math.round(size * (120 / 140))
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 140 120"
      fill="none"
      style={{ opacity }}
      className={`${animClass(animated)} ${className}`}
    >
      {/* Torus rings — horizontal ellipses */}
      <ellipse cx="70" cy="60" rx="55" ry="22" stroke={color} strokeWidth="1.5" />
      <ellipse cx="70" cy="60" rx="55" ry="55" stroke={color} strokeWidth=".8" opacity=".5" />
      <ellipse cx="70" cy="60" rx="32" ry="13" stroke={color} strokeWidth="1.2" opacity=".8" />
      <ellipse cx="70" cy="60" rx="32" ry="32" stroke={color} strokeWidth=".6" opacity=".4" />
      <ellipse cx="70" cy="60" rx="14" ry="6"  stroke={color} strokeWidth="1"  opacity=".9" />
      {/* Vertical axis */}
      <line x1="70" y1="5"   x2="70" y2="115" stroke={color} strokeWidth=".7" opacity=".3" />
      <circle cx="70" cy="5"   r="3" stroke={color} strokeWidth="1" fill="none" opacity=".6" />
      <circle cx="70" cy="115" r="3" stroke={color} strokeWidth="1" fill="none" opacity=".6" />
      {/* Center */}
      <circle cx="70" cy="60" r="4" stroke={color} strokeWidth="1.5" fill={`${color}30`} />
    </svg>
  )
}


// ════════════════════════════════════════════════════════════
// 09  SEED OF LIFE
// Usage: Site nav brand mark, Our Families theme
// Seven circles — the original creation pattern,
// the seed from which the Flower of Life grows.
// ════════════════════════════════════════════════════════════

export function SeedOfLife({
  color = '#1b5e8a',
  size = 100,
  opacity = 1,
  animated = false,
  className = '',
}: GeoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      style={{ opacity }}
      className={`${animClass(animated)} ${className}`}
    >
      <circle cx="50"   cy="50"   r="18" stroke={color} strokeWidth="2.2" />
      <circle cx="68"   cy="50"   r="18" stroke={color} strokeWidth="2.2" />
      <circle cx="32"   cy="50"   r="18" stroke={color} strokeWidth="2.2" />
      <circle cx="59"   cy="34.4" r="18" stroke={color} strokeWidth="2.2" />
      <circle cx="41"   cy="34.4" r="18" stroke={color} strokeWidth="2.2" />
      <circle cx="59"   cy="65.6" r="18" stroke={color} strokeWidth="2.2" />
      <circle cx="41"   cy="65.6" r="18" stroke={color} strokeWidth="2.2" />
    </svg>
  )
}


// ════════════════════════════════════════════════════════════
// 10  HEX GRID
// Theme: Our Neighborhood
// Hexagonal tessellation — cells, blocks, the
// structure of how neighborhoods fit together.
// ════════════════════════════════════════════════════════════

export function HexGrid({
  color = '#4a2870',
  size = 240,
  opacity = 1,
  animated = false,
  className = '',
}: GeoProps) {
  const h = Math.round(size * (240 / 240))
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 240 240"
      fill="none"
      style={{ opacity }}
      className={`${animClass(animated)} ${className}`}
    >
      {/* Center hex */}
      <polygon points="120,80 153,99 153,137 120,156 87,137 87,99"
        stroke={color} strokeWidth="1.2" fill="none" />
      {/* 6 surrounding hexes */}
      <polygon points="120,12 153,31 153,69 120,88 87,69 87,31"
        stroke={color} strokeWidth=".7" fill="none" opacity=".6" />
      <polygon points="120,148 153,167 153,205 120,224 87,205 87,167"
        stroke={color} strokeWidth=".7" fill="none" opacity=".6" />
      <polygon points="54,46 87,65 87,103 54,122 21,103 21,65"
        stroke={color} strokeWidth=".7" fill="none" opacity=".6" />
      <polygon points="186,46 219,65 219,103 186,122 153,103 153,65"
        stroke={color} strokeWidth=".7" fill="none" opacity=".6" />
      <polygon points="54,114 87,133 87,171 54,190 21,171 21,133"
        stroke={color} strokeWidth=".7" fill="none" opacity=".6" />
      <polygon points="186,114 219,133 219,171 186,190 153,171 153,133"
        stroke={color} strokeWidth=".7" fill="none" opacity=".6" />
      {/* Center mark */}
      <circle cx="120" cy="118" r="6"  stroke={color} strokeWidth="1.2" fill="none" />
      <circle cx="120" cy="118" r="100" stroke={color} strokeWidth=".4" opacity=".2" />
    </svg>
  )
}


// ════════════════════════════════════════════════════════════
// 11  CONCENTRIC RINGS
// Theme: Our Voice
// Radiating rings from a single point — a voice
// expanding outward, reaching further with each level.
// ════════════════════════════════════════════════════════════

export function ConcentricRings({
  color = '#7a2018',
  size = 240,
  opacity = 1,
  animated = false,
  className = '',
}: GeoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      fill="none"
      style={{ opacity }}
      className={`${animClass(animated)} ${className}`}
    >
      <circle cx="120" cy="120" r="20"  stroke={color} strokeWidth="1.2" opacity=".9" />
      <circle cx="120" cy="120" r="44"  stroke={color} strokeWidth="1"   opacity=".7" />
      <circle cx="120" cy="120" r="68"  stroke={color} strokeWidth=".8"  opacity=".55" />
      <circle cx="120" cy="120" r="92"  stroke={color} strokeWidth=".6"  opacity=".4" />
      <circle cx="120" cy="120" r="116" stroke={color} strokeWidth=".4"  opacity=".25" />
      {/* Cardinal radials */}
      <line x1="120" y1="120" x2="120" y2="4"   stroke={color} strokeWidth=".6" opacity=".4" />
      <line x1="120" y1="120" x2="236" y2="120"  stroke={color} strokeWidth=".6" opacity=".4" />
      <line x1="120" y1="120" x2="120" y2="236"  stroke={color} strokeWidth=".6" opacity=".4" />
      <line x1="120" y1="120" x2="4"   y2="120"  stroke={color} strokeWidth=".6" opacity=".4" />
      {/* Diagonal radials */}
      <line x1="120" y1="120" x2="202" y2="38"   stroke={color} strokeWidth=".4" opacity=".3" />
      <line x1="120" y1="120" x2="202" y2="202"  stroke={color} strokeWidth=".4" opacity=".3" />
      <line x1="120" y1="120" x2="38"  y2="202"  stroke={color} strokeWidth=".4" opacity=".3" />
      <line x1="120" y1="120" x2="38"  y2="38"   stroke={color} strokeWidth=".4" opacity=".3" />
    </svg>
  )
}


// ════════════════════════════════════════════════════════════
// 12  GOLDEN SPIRAL
// Theme: Our Money
// Fibonacci spiral with underlying squares —
// natural growth, proportional accumulation,
// the geometry of wealth and scarcity.
// ════════════════════════════════════════════════════════════

export function GoldenSpiral({
  color = '#6a4e10',
  size = 240,
  opacity = 1,
  animated = false,
  className = '',
}: GeoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      fill="none"
      style={{ opacity }}
      className={`${animClass(animated)} ${className}`}
    >
      {/* Fibonacci spiral arc path */}
      <path
        d="M 120 120
           Q 120 60 180 60
           Q 240 60 240 120
           Q 240 210 120 210
           Q 10 210 10 90
           Q 10 0 140 0"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
        opacity=".8"
      />
      {/* Underlying Fibonacci squares */}
      <rect x="60"  y="60"  width="60" height="60" stroke={color} strokeWidth=".6" fill="none" opacity=".35" />
      <rect x="120" y="60"  width="60" height="60" stroke={color} strokeWidth=".6" fill="none" opacity=".35" />
      <rect x="60"  y="120" width="120" height="120" stroke={color} strokeWidth=".6" fill="none" opacity=".35" />
      <rect x="60"  y="0"   width="120" height="60"  stroke={color} strokeWidth=".6" fill="none" opacity=".25" />
      {/* Center */}
      <circle cx="120" cy="120" r="18" stroke={color} strokeWidth="1" opacity=".5" />
      <circle cx="120" cy="120" r="70" stroke={color} strokeWidth=".4" opacity=".2" />
    </svg>
  )
}


// ════════════════════════════════════════════════════════════
// 13  METATRON'S CUBE
// Theme: The Bigger We
// Full Flower of Life with connecting lines —
// everything related to everything, the whole
// that contains all the other patterns.
// ════════════════════════════════════════════════════════════

export function MetatronCube({
  color = '#1b5e8a',
  size = 240,
  opacity = 1,
  animated = false,
  className = '',
}: GeoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      fill="none"
      style={{ opacity }}
      className={`${animClass(animated)} ${className}`}
    >
      {/* Inner Seed of Life */}
      <circle cx="120" cy="120" r="33" stroke={color} strokeWidth="1.2" />
      <circle cx="153" cy="120" r="33" stroke={color} strokeWidth="1.2" />
      <circle cx="87"  cy="120" r="33" stroke={color} strokeWidth="1.2" />
      <circle cx="136" cy="91"  r="33" stroke={color} strokeWidth="1.2" />
      <circle cx="104" cy="91"  r="33" stroke={color} strokeWidth="1.2" />
      <circle cx="136" cy="149" r="33" stroke={color} strokeWidth="1.2" />
      <circle cx="104" cy="149" r="33" stroke={color} strokeWidth="1.2" />
      {/* Outer ring */}
      <circle cx="186" cy="120" r="33" stroke={color} strokeWidth=".6" opacity=".5" />
      <circle cx="54"  cy="120" r="33" stroke={color} strokeWidth=".6" opacity=".5" />
      <circle cx="169" cy="91"  r="33" stroke={color} strokeWidth=".6" opacity=".5" />
      <circle cx="71"  cy="91"  r="33" stroke={color} strokeWidth=".6" opacity=".5" />
      <circle cx="169" cy="149" r="33" stroke={color} strokeWidth=".6" opacity=".5" />
      <circle cx="71"  cy="149" r="33" stroke={color} strokeWidth=".6" opacity=".5" />
      {/* Metatron connecting lines */}
      <line x1="120" y1="87"  x2="120" y2="153" stroke={color} strokeWidth=".5" opacity=".35" />
      <line x1="87"  y1="120" x2="153" y2="120" stroke={color} strokeWidth=".5" opacity=".35" />
      <line x1="95"  y1="97"  x2="145" y2="143" stroke={color} strokeWidth=".5" opacity=".35" />
      <line x1="145" y1="97"  x2="95"  y2="143" stroke={color} strokeWidth=".5" opacity=".35" />
      {/* Outer boundary */}
      <circle cx="120" cy="120" r="108" stroke={color} strokeWidth=".4" opacity=".2" />
    </svg>
  )
}
