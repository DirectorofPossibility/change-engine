/**
 * Flower of Life Icon System
 *
 * Every icon derives from the Flower of Life sacred geometry.
 * Sub-patterns map to platform concepts:
 *   - Seed of Life    → Seeker (beginning of journey)
 *   - Vesica Piscis   → Learner (lens of understanding)
 *   - Tripod of Life  → Builder (building structure)
 *   - Metatron's Cube → Watchdog (revealing hidden connections)
 *   - Borromean Rings → Partner (interdependence)
 *   - Full Flower     → Explorer (the complete pattern)
 *
 * Tier icons use progressive complexity:
 *   - Genesis (1-2 circles)   → Understand
 *   - Convergence (3 circles) → Get Involved
 *   - Full pattern (7 circles) → Go Deeper
 *
 * Engagement ladder: icons grow from 1 circle (Read) to 7 (Organize).
 */

import React from 'react'

interface IconProps {
  size?: number
  color?: string
  className?: string
}

// ─── ARCHETYPE ICONS ───────────────────────────────────────

export function SeekerIcon({ size = 20, color = '#4a2870', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="8" stroke={color} strokeWidth="1.5" opacity="0.7" />
      <circle cx="24" cy="16" r="8" stroke={color} strokeWidth="1" opacity="0.35" />
      <circle cx="30.9" cy="20" r="8" stroke={color} strokeWidth="1" opacity="0.35" />
      <circle cx="30.9" cy="28" r="8" stroke={color} strokeWidth="1" opacity="0.35" />
      <circle cx="24" cy="32" r="8" stroke={color} strokeWidth="1" opacity="0.35" />
      <circle cx="17.1" cy="28" r="8" stroke={color} strokeWidth="1" opacity="0.35" />
      <circle cx="17.1" cy="20" r="8" stroke={color} strokeWidth="1" opacity="0.35" />
    </svg>
  )
}

export function LearnerIcon({ size = 20, color = '#6a4e10', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <circle cx="19" cy="24" r="11" stroke={color} strokeWidth="1.5" opacity="0.5" />
      <circle cx="29" cy="24" r="11" stroke={color} strokeWidth="1.5" opacity="0.5" />
    </svg>
  )
}

export function BuilderIcon({ size = 20, color = '#7a2018', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <circle cx="24" cy="16" r="8" stroke={color} strokeWidth="1.5" opacity="0.5" />
      <circle cx="17" cy="28" r="8" stroke={color} strokeWidth="1.5" opacity="0.5" />
      <circle cx="31" cy="28" r="8" stroke={color} strokeWidth="1.5" opacity="0.5" />
    </svg>
  )
}

export function WatchdogIcon({ size = 20, color = '#1a3460', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="4" stroke={color} strokeWidth="1.5" />
      <circle cx="24" cy="14" r="4" stroke={color} strokeWidth="1" opacity="0.4" />
      <circle cx="24" cy="34" r="4" stroke={color} strokeWidth="1" opacity="0.4" />
      <circle cx="32.7" cy="19" r="4" stroke={color} strokeWidth="1" opacity="0.4" />
      <circle cx="32.7" cy="29" r="4" stroke={color} strokeWidth="1" opacity="0.4" />
      <circle cx="15.3" cy="19" r="4" stroke={color} strokeWidth="1" opacity="0.4" />
      <circle cx="15.3" cy="29" r="4" stroke={color} strokeWidth="1" opacity="0.4" />
      <line x1="24" y1="14" x2="32.7" y2="19" stroke={color} strokeWidth="0.5" opacity="0.3" />
      <line x1="32.7" y1="19" x2="32.7" y2="29" stroke={color} strokeWidth="0.5" opacity="0.3" />
      <line x1="32.7" y1="29" x2="24" y2="34" stroke={color} strokeWidth="0.5" opacity="0.3" />
      <line x1="24" y1="34" x2="15.3" y2="29" stroke={color} strokeWidth="0.5" opacity="0.3" />
      <line x1="15.3" y1="29" x2="15.3" y2="19" stroke={color} strokeWidth="0.5" opacity="0.3" />
      <line x1="15.3" y1="19" x2="24" y2="14" stroke={color} strokeWidth="0.5" opacity="0.3" />
    </svg>
  )
}

export function PartnerIcon({ size = 20, color = '#1e4d7a', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <circle cx="20" cy="20" r="10" stroke={color} strokeWidth="1.5" opacity="0.45" />
      <circle cx="28" cy="20" r="10" stroke={color} strokeWidth="1.5" opacity="0.45" />
      <circle cx="24" cy="28" r="10" stroke={color} strokeWidth="1.5" opacity="0.45" />
    </svg>
  )
}

export function ExplorerIcon({ size = 20, color = '#E8723A', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="6" stroke={color} strokeWidth="1.5" opacity="0.7" />
      <circle cx="24" cy="18" r="6" stroke={color} strokeWidth="1" opacity="0.4" />
      <circle cx="24" cy="30" r="6" stroke={color} strokeWidth="1" opacity="0.4" />
      <circle cx="29.2" cy="21" r="6" stroke={color} strokeWidth="1" opacity="0.4" />
      <circle cx="29.2" cy="27" r="6" stroke={color} strokeWidth="1" opacity="0.4" />
      <circle cx="18.8" cy="21" r="6" stroke={color} strokeWidth="1" opacity="0.4" />
      <circle cx="18.8" cy="27" r="6" stroke={color} strokeWidth="1" opacity="0.4" />
    </svg>
  )
}

// ─── WAYFINDER TIER ICONS ──────────────────────────────────

export function UnderstandIcon({ size = 16, color = '#92400e', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
      <circle cx="20" cy="20" r="10" stroke={color} strokeWidth="1.5" opacity="0.6" />
      <circle cx="20" cy="15" r="4.5" stroke={color} strokeWidth="1" opacity="0.3" />
      <circle cx="20" cy="25" r="4.5" stroke={color} strokeWidth="1" opacity="0.3" />
    </svg>
  )
}

export function InvolveIcon({ size = 16, color = '#065f46', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
      <circle cx="20" cy="16" r="7" stroke={color} strokeWidth="1.5" opacity="0.5" />
      <circle cx="14" cy="26" r="7" stroke={color} strokeWidth="1.5" opacity="0.5" />
      <circle cx="26" cy="26" r="7" stroke={color} strokeWidth="1.5" opacity="0.5" />
    </svg>
  )
}

export function DeeperIcon({ size = 16, color = '#1e40af', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
      <circle cx="20" cy="20" r="5" stroke={color} strokeWidth="1.2" opacity="0.6" />
      <circle cx="20" cy="15" r="5" stroke={color} strokeWidth="0.8" opacity="0.35" />
      <circle cx="20" cy="25" r="5" stroke={color} strokeWidth="0.8" opacity="0.35" />
      <circle cx="24.3" cy="17.5" r="5" stroke={color} strokeWidth="0.8" opacity="0.35" />
      <circle cx="24.3" cy="22.5" r="5" stroke={color} strokeWidth="0.8" opacity="0.35" />
      <circle cx="15.7" cy="17.5" r="5" stroke={color} strokeWidth="0.8" opacity="0.35" />
      <circle cx="15.7" cy="22.5" r="5" stroke={color} strokeWidth="0.8" opacity="0.35" />
    </svg>
  )
}

// ─── FULL FLOWER OF LIFE (brand mark) ──────────────────────

export function FlowerOfLifeIcon({ size = 48, color = '#C75B2A', className }: IconProps) {
  // Bold, vivid Flower of Life — the brand mark should COMMAND attention
  const r = 18
  const cx = 100, cy = 100
  // Inner ring of 6 around center
  const inner = [0, 60, 120, 180, 240, 300].map(deg => {
    const rad = (deg * Math.PI) / 180
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)] as [number, number]
  })
  // Outer ring of 6 (offset 30deg, radius * sqrt(3))
  const outerR = r * 1.732
  const outer = [30, 90, 150, 210, 270, 330].map(deg => {
    const rad = (deg * Math.PI) / 180
    return [cx + outerR * Math.cos(rad), cy + outerR * Math.sin(rad)] as [number, number]
  })
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" className={className} aria-hidden="true">
      {/* Outer bounding circle */}
      <circle cx={cx} cy={cy} r={r * 2.2} stroke={color} strokeWidth="1.2" opacity="0.25" />
      {/* Outer ring — 6 petals */}
      {outer.map(([x, y], i) => (
        <circle key={'o' + i} cx={x} cy={y} r={r} stroke={color} strokeWidth="1.5" opacity="0.5" />
      ))}
      {/* Inner ring — 6 petals */}
      {inner.map(([x, y], i) => (
        <circle key={'i' + i} cx={x} cy={y} r={r} stroke={color} strokeWidth="2" opacity="0.85" />
      ))}
      {/* Center circle — strongest */}
      <circle cx={cx} cy={cy} r={r} stroke={color} strokeWidth="2.5" opacity="1" />
      {/* Center dot — fills with color for warmth */}
      <circle cx={cx} cy={cy} r="3" fill={color} opacity="0.6" />
    </svg>
  )
}

// ─── ARCHETYPE CONFIG ──────────────────────────────────────

export const ARCHETYPES = [
  { id: 'seeker', name: 'The Seeker', desc: 'Find resources & services', Icon: SeekerIcon, center: 'Resource' },
  { id: 'learner', name: 'The Learner', desc: 'Understand & explore', Icon: LearnerIcon, center: 'Learning' },
  { id: 'builder', name: 'The Builder', desc: 'Volunteer & create', Icon: BuilderIcon, center: 'Action' },
  { id: 'watchdog', name: 'The Watchdog', desc: 'Track accountability', Icon: WatchdogIcon, center: 'Accountability' },
  { id: 'partner', name: 'The Partner', desc: 'Connect & collaborate', Icon: PartnerIcon, center: null },
  { id: 'explorer', name: 'The Explorer', desc: 'Browse & discover', Icon: ExplorerIcon, center: null },
] as const

export type ArchetypeId = typeof ARCHETYPES[number]['id']
