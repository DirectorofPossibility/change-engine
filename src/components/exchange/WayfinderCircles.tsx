/**
 * @fileoverview Signature circle visualization for The Change Engine's Community Exchange.
 *
 * Renders the 7 pathways as interactive SVG circles that rearrange across three states:
 *   - **Home** — flower/orbital arrangement with bridge lines and platform stats
 *   - **Pathway selected** — selected circle enlarges; others orbit around it
 *   - **Compact** — horizontal row for persona or QA result views
 *
 * All positioning is calculated in a viewBox coordinate system, then rendered into
 * a single responsive SVG. CSS transitions on `transform` and `opacity` provide
 * smooth rearrangement between states (300ms ease-out).
 *
 * Colors and names are sourced from {@link THEMES} in `@/lib/constants`.
 */

'use client'

import { useCallback, useMemo } from 'react'
import { THEMES, BRAND } from '@/lib/constants'
import { usePanZoom } from '@/lib/hooks/usePanZoom'

// ── Types ────────────────────────────────────────────────────────────

interface WayfinderCirclesProps {
  /** Currently selected pathway ID (e.g. 'THEME_01'), or null for home state. */
  selectedPathway: string | null
  /** Callback to select or deselect a pathway. Pass null to return to home. */
  onSelectPathway: (id: string | null) => void
  /** Map of pathway IDs to their resource counts. */
  pathwayCounts: Record<string, number>
  /** Bridge connections between pathways: [pathwayA, pathwayB, sharedCount]. */
  bridges?: Array<[string, string, number]>
  /** Compact mode for non-home states (persona view, QA results). */
  compact?: boolean
  /** Aggregate stats shown beneath the home-state visualization. */
  stats?: {
    resources: number
    officials: number
    policies: number
    focusAreas: number
  }
}

/** Internal representation of a single pathway for layout calculations. */
interface PathwayNode {
  id: string
  name: string
  color: string
  count: number
}

// ── Constants ────────────────────────────────────────────────────────

/** Ordered list of theme keys matching THEME_01 through THEME_07. */
const THEME_KEYS = Object.keys(THEMES) as Array<keyof typeof THEMES>

/** SVG viewBox dimensions — all positions are computed relative to these. */
const VB_WIDTH = 600
const VB_HEIGHT = 580

/** Center point of the home-state flower arrangement. */
const CX = VB_WIDTH / 2
const CY = 260

/** Circle radii for each state. */
const HOME_RADIUS = 50
const SELECTED_RADIUS = 74
const ORBIT_RADIUS = 34
const COMPACT_RADIUS = 24
const COMPACT_ACTIVE_RADIUS = 32

/** Distance from center for flower petals. */
const FLOWER_ORBIT = 150

/** Distance from selected circle for orbiting satellites. */
const SATELLITE_ORBIT = 170

// ── Helpers ──────────────────────────────────────────────────────────

/** Build the array of pathway nodes from THEMES + counts. */
function buildNodes(counts: Record<string, number>): PathwayNode[] {
  return THEME_KEYS.map((key) => ({
    id: key,
    name: THEMES[key].name,
    color: THEMES[key].color,
    count: counts[key] ?? 0,
  }))
}

/**
 * Compute (x, y) positions for each pathway node depending on the current state.
 *
 * @param nodes - The 7 pathway nodes
 * @param selectedId - Currently selected pathway ID, or null
 * @param compact - Whether compact (row) mode is active
 * @returns Map of pathway ID to { x, y, r } where r is the circle radius
 */
function computePositions(
  nodes: PathwayNode[],
  selectedId: string | null,
  compact: boolean
): Record<string, { x: number; y: number; r: number }> {
  const positions: Record<string, { x: number; y: number; r: number }> = {}

  if (compact) {
    // Horizontal row, evenly spaced
    const totalWidth = VB_WIDTH - 80
    const spacing = totalWidth / (nodes.length - 1 || 1)
    const startX = 40
    const rowY = 50
    nodes.forEach((node, i) => {
      const isActive = node.id === selectedId
      positions[node.id] = {
        x: startX + i * spacing,
        y: rowY,
        r: isActive ? COMPACT_ACTIVE_RADIUS : COMPACT_RADIUS,
      }
    })
    return positions
  }

  if (!selectedId) {
    // Home state: flower/orbital arrangement
    // Place circles evenly around a center point
    nodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2
      positions[node.id] = {
        x: CX + FLOWER_ORBIT * Math.cos(angle),
        y: CY + FLOWER_ORBIT * Math.sin(angle),
        r: HOME_RADIUS,
      }
    })
    return positions
  }

  // Selected state: chosen pathway is prominent, others orbit
  positions[selectedId] = { x: CX, y: CY, r: SELECTED_RADIUS }

  const others = nodes.filter((n) => n.id !== selectedId)
  others.forEach((node, i) => {
    const angle = (2 * Math.PI * i) / others.length - Math.PI / 2
    positions[node.id] = {
      x: CX + SATELLITE_ORBIT * Math.cos(angle),
      y: CY + SATELLITE_ORBIT * Math.sin(angle),
      r: ORBIT_RADIUS,
    }
  })

  return positions
}

// ── Component ────────────────────────────────────────────────────────

/**
 * Signature interactive circle visualization for the Community Exchange.
 *
 * Displays the 7 pathways as colored SVG circles that smoothly rearrange
 * between home (flower), selected (orbit), and compact (row) states.
 * Bridge lines show shared resources between connected pathways.
 *
 * @param props - {@link WayfinderCirclesProps}
 */
export function WayfinderCircles({
  selectedPathway,
  onSelectPathway,
  pathwayCounts,
  bridges = [],
  compact = false,
  stats,
}: WayfinderCirclesProps) {
  const nodes = useMemo(() => buildNodes(pathwayCounts), [pathwayCounts])

  const positions = useMemo(
    () => computePositions(nodes, selectedPathway, compact),
    [nodes, selectedPathway, compact]
  )

  /** Toggle selection: clicking the already-selected pathway deselects it. */
  const handleClick = useCallback(
    (id: string) => {
      onSelectPathway(selectedPathway === id ? null : id)
    },
    [selectedPathway, onSelectPathway]
  )

  // Determine viewBox height based on mode
  const viewHeight = compact ? 120 : VB_HEIGHT
  const showStats = !compact && !selectedPathway && stats
  const pz = usePanZoom({ minZoom: 0.5, maxZoom: 4 })

  return (
    <div className="w-full flex flex-col items-center">
      {/* SVG visualization — pan/zoom container */}
      <div
        ref={pz.containerRef}
        {...pz.containerHandlers}
        className="w-full max-w-[640px] relative"
        style={{ overflow: 'hidden', cursor: pz.cursor, touchAction: 'none' }}
      >
      <svg
        viewBox={`0 0 ${VB_WIDTH} ${viewHeight}`}
        className="w-full"
        role="img"
        aria-label="Change Engine pathway navigation"
        style={pz.svgStyle}
      >
        {/* Bridge lines between connected pathways */}
        {!compact &&
          bridges.map(([a, b, sharedCount], i) => {
            const posA = positions[a]
            const posB = positions[b]
            if (!posA || !posB) return null

            const midX = (posA.x + posB.x) / 2
            const midY = (posA.y + posB.y) / 2

            return (
              <g key={`bridge-${i}`} className="pointer-events-none">
                <line
                  x1={posA.x}
                  y1={posA.y}
                  x2={posB.x}
                  y2={posB.y}
                  stroke={BRAND.muted}
                  strokeWidth={1.5}
                  strokeOpacity={0.35}
                  strokeDasharray="4 3"
                  className="transition-all duration-300 ease-out"
                />
                {sharedCount > 0 && (
                  <text
                    x={midX}
                    y={midY - 6}
                    textAnchor="middle"
                    fill={BRAND.muted}
                    fontSize={10}
                    className="font-display transition-all duration-300 ease-out"
                  >
                    {sharedCount}
                  </text>
                )}
              </g>
            )
          })}

        {/* Subtle center mark in home state */}
        {!compact && !selectedPathway && (
          <circle
            cx={CX}
            cy={CY}
            r={22}
            fill={BRAND.accent}
            fillOpacity={0.08}
            stroke={BRAND.accent}
            strokeWidth={1}
            strokeOpacity={0.15}
            className="transition-all duration-300 ease-out"
          />
        )}

        {/* Pathway circles */}
        {nodes.map((node) => {
          const pos = positions[node.id]
          if (!pos) return null

          const isSelected = node.id === selectedPathway

          return (
            <g
              key={node.id}
              className="cursor-pointer transition-all duration-300 ease-out"
              transform={`translate(${pos.x}, ${pos.y})`}
              onClick={() => handleClick(node.id)}
              role="button"
              tabIndex={0}
              aria-label={`${node.name}: ${node.count} resources`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleClick(node.id)
                }
              }}
            >
              {/* Concentric overlapping rings — outermost glow */}
              <circle
                cx={0}
                cy={0}
                r={pos.r + 6}
                fill={node.color}
                fillOpacity={isSelected ? 0.06 : 0.03}
                className="transition-all duration-300 ease-out"
                style={{ pointerEvents: 'none' }}
              >
                <set attributeName="fill-opacity" to={isSelected ? '0.08' : '0.06'} begin="mouseover" end="mouseout" />
              </circle>

              {/* Outer ring */}
              <circle
                cx={0}
                cy={0}
                r={pos.r}
                fill={node.color}
                fillOpacity={isSelected ? 0.08 : 0.04}
                stroke={node.color}
                strokeWidth={isSelected ? 3 : 2}
                strokeOpacity={0.4}
                className="transition-all duration-300 ease-out"
              />

              {/* Middle ring */}
              <circle
                cx={0}
                cy={0}
                r={pos.r * 0.7}
                fill={node.color}
                fillOpacity={isSelected ? 0.14 : 0.08}
                className="transition-all duration-300 ease-out"
              />

              {/* Inner solid core */}
              <circle
                cx={0}
                cy={0}
                r={pos.r * 0.4}
                fill={node.color}
                fillOpacity={isSelected ? 0.25 : 0.15}
                className="transition-all duration-300 ease-out"
              />

              {/* Resource count inside circle */}
              <text
                x={0}
                y={compact ? 1 : -2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={node.color}
                fontSize={compact ? 12 : isSelected ? 22 : 18}
                fontWeight="600"
                className="font-display transition-all duration-300 ease-out pointer-events-none"
              >
                {node.count}
              </text>

              {/* Pathway name below circle (not in compact mode for small circles) */}
              {(!compact || isSelected) && (
                <text
                  x={0}
                  y={pos.r + (compact ? 16 : 20)}
                  textAnchor="middle"
                  fill={BRAND.text}
                  fontSize={compact ? 11 : isSelected ? 15 : 13}
                  fontWeight={isSelected ? '600' : '400'}
                  className="font-display transition-all duration-300 ease-out pointer-events-none"
                >
                  {node.name}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      {pz.zoom !== 1 && (
        <button onClick={pz.resetView} style={{
          position: 'absolute', bottom: 8, right: 8, zIndex: 10,
          padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600,
          background: '#fff', border: '1px solid #e5e0d8', color: '#6b6157',
          cursor: 'pointer',
        }}>Reset zoom</button>
      )}
      </div>

      {/* Stats bar — visible only in home state */}
      {showStats && (
        <div
          className="mt-4 flex flex-wrap items-center justify-center gap-6 sm:gap-10
                     transition-opacity duration-300 ease-out"
        >
          <StatItem label="Resources" value={stats.resources} />
          <StatItem label="Officials" value={stats.officials} />
          <StatItem label="Policies" value={stats.policies} />
          <StatItem label="Focus Areas" value={stats.focusAreas} />
        </div>
      )}
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────────────

/** Single stat number + label for the home-state stats bar. */
function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center">
      <span
        className="text-3xl sm:text-4xl font-semibold font-display leading-none"
        style={{ color: BRAND.accent }}
      >
        {value.toLocaleString()}
      </span>
      <span className="text-sm text-brand-muted mt-1">{label}</span>
    </div>
  )
}
