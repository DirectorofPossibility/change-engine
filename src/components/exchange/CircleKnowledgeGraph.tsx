'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { CircleGraphData } from '@/lib/data/exchange'

// ═══════════════════════════════════════════════════════════════
// THE COMMUNITY EXCHANGE — Circle Knowledge Graph
// 7 pathway circles orbit around YOU (center). Click to explore.
// Bridges show cross-pathway connections. Focus areas orbit pathways.
// ═══════════════════════════════════════════════════════════════

const C = {
  bg: '#FAF8F5', card: '#FFFFFF', bgAlt: '#EDE8E0',
  text: '#1A1A1A', muted: '#6B6560', mutedLight: '#9B9590',
  border: '#E2DDD5', sand: '#D5D0C8', accent: '#C75B2A',
}

const ENTITY_META: Record<string, { label: string; color: string; href: string }> = {
  content: { label: 'Content', color: '#C75B2A', href: '/news' },
  services: { label: 'Services', color: '#d69e2e', href: '/services' },
  officials: { label: 'Officials', color: '#805ad5', href: '/officials' },
  organizations: { label: 'Orgs', color: '#dd6b20', href: '/organizations' },
  policies: { label: 'Policies', color: '#3182ce', href: '/policies' },
}

// ── Geometry ──
const VBW = 600, VBH = 540
const CX = VBW / 2, CY = 260
const ORBIT = 155, PW_R = 60, CENTER_R = 42

function getPathwayPos(i: number, total: number) {
  const a = (i / total) * Math.PI * 2 - Math.PI / 2
  return { x: CX + ORBIT * Math.cos(a), y: CY + ORBIT * Math.sin(a), angle: a }
}

// ── Types ──
interface Props {
  data: CircleGraphData
  /** Compact mode: smaller, no detail panel, for embedding */
  compact?: boolean
  /** Highlight specific pathways */
  activePathways?: string[]
  /** External pathway select callback */
  onPathwayClick?: (pathwayId: string) => void
}

// ═══════════════════════════════════════════════════════════════
// EMBEDDABLE version for homepage / page heroes
// ═══════════════════════════════════════════════════════════════
export function EmbeddableCircles({
  data,
  onSelectPathway,
  selectedPathway,
}: {
  data: CircleGraphData
  onSelectPathway?: (id: string) => void
  selectedPathway?: string
}) {
  return (
    <CircleKnowledgeGraph
      data={data}
      compact={false}
      activePathways={selectedPathway ? [selectedPathway] : undefined}
      onPathwayClick={onSelectPathway}
    />
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function CircleKnowledgeGraph({ data, compact = false, activePathways, onPathwayClick }: Props) {
  const [user, setUser] = useState<{ name: string; avatar: string | null } | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [hoveredFocus, setHoveredFocus] = useState<{ id: string; name: string; x: number; y: number } | null>(null)

  // Fetch logged-in user for center avatar
  useEffect(function () {
    const supabase = createClient()
    supabase.auth.getUser().then(function ({ data: userData }: { data: any }) {
      if (userData.user) {
        const meta = userData.user.user_metadata || {}
        setUser({
          name: meta.full_name || meta.name || userData.user.email?.split('@')[0] || 'You',
          avatar: meta.avatar_url || meta.picture || null,
        })
      }
    })
  }, [])

  // Geometry: scale for compact
  const scale = compact ? 0.5 : 1
  const viewW = compact ? VBW * 0.6 : VBW
  const viewH = compact ? VBH * 0.55 : VBH
  const vbX = compact ? VBW * 0.2 : 0
  const vbY = compact ? VBH * 0.15 : 0

  // Pathway positions
  const pwPositions = useMemo(function () {
    return data.pathways.map(function (pw, i) {
      const pos = getPathwayPos(i, data.pathways.length)
      return { ...pw, ...pos }
    })
  }, [data.pathways])

  // Focus area dot positions (full mode only)
  const focusDots = useMemo(function () {
    if (compact) return []
    const dots: Array<{ id: string; name: string; x: number; y: number; color: string; pwId: string }> = []
    for (const pw of pwPositions) {
      const fas = pw.focusAreas.slice(0, 10)
      for (let j = 0; j < fas.length; j++) {
        const spread = (j - (fas.length - 1) / 2) * 0.2
        const dist = PW_R + 18
        dots.push({
          id: fas[j].id, name: fas[j].name,
          x: pw.x + dist * Math.cos(pw.angle + spread),
          y: pw.y + dist * Math.sin(pw.angle + spread),
          color: pw.color, pwId: pw.id,
        })
      }
    }
    return dots
  }, [pwPositions, compact])

  const activePw = selected || hovered
  const activeDetail = activePw ? data.pathways.find(function (p) { return p.id === activePw }) : null

  const handleClick = useCallback(function (pwId: string) {
    if (onPathwayClick) {
      onPathwayClick(pwId)
    } else {
      setSelected(function (prev) { return prev === pwId ? null : pwId })
    }
  }, [onPathwayClick])

  const totalEntities = data.totals.content + data.totals.services + data.totals.officials + data.totals.organizations + data.totals.policies

  // ── Render ──
  return (
    <div className={compact ? '' : 'flex flex-col lg:flex-row gap-6 items-start'}>
      {/* ── SVG Circle Graph ── */}
      <div className={compact ? 'mx-auto' : 'flex-shrink-0 mx-auto lg:mx-0'} style={{ maxWidth: compact ? 260 : 520 }}>
        <svg
          viewBox={vbX + ' ' + vbY + ' ' + viewW + ' ' + viewH}
          className="w-full h-auto"
          style={{ maxHeight: compact ? 260 : 520 }}
        >
          <defs>
            <clipPath id="avatar-clip-kg">
              <circle cx={CX} cy={CY} r={CENTER_R - 3} />
            </clipPath>
          </defs>

          {/* Bridge arcs between pathways */}
          {data.bridges.map(function (b, i) {
            const from = pwPositions.find(function (p) { return p.id === b.from })
            const to = pwPositions.find(function (p) { return p.id === b.to })
            if (!from || !to) return null
            const isHighlighted = activePw === b.from || activePw === b.to
            const opacity = activePw ? (isHighlighted ? 0.3 : 0.04) : 0.1
            const width = Math.min(0.8 + b.count * 0.12, 3)
            return (
              <line key={'bridge-' + i}
                x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                stroke={C.sand} strokeWidth={width}
                strokeDasharray="5 4" opacity={opacity}
              />
            )
          })}

          {/* Spokes from center to pathways */}
          {pwPositions.map(function (pw) {
            const isActive = (activePathways || []).includes(pw.id) || activePw === pw.id
            return (
              <line key={'spoke-' + pw.id}
                x1={CX} y1={CY} x2={pw.x} y2={pw.y}
                stroke={pw.color} strokeWidth={isActive ? 1.5 : 0.8}
                opacity={activePw ? (isActive ? 0.25 : 0.06) : 0.12}
              />
            )
          })}

          {/* Focus area dots (full mode) */}
          {focusDots.map(function (fa) {
            const isVisible = !activePw || activePw === fa.pwId
            const isHov = hoveredFocus?.id === fa.id
            return (
              <circle key={fa.id}
                cx={fa.x} cy={fa.y} r={isHov ? 5 : 3}
                fill={fa.color} opacity={isVisible ? (isHov ? 0.9 : 0.35) : 0.06}
                style={{ cursor: 'pointer', transition: 'opacity .2s, r .15s' }}
                onMouseEnter={function () { setHoveredFocus({ id: fa.id, name: fa.name, x: fa.x, y: fa.y }) }}
                onMouseLeave={function () { setHoveredFocus(null) }}
              />
            )
          })}

          {/* Focus area tooltip */}
          {hoveredFocus && (
            <g style={{ pointerEvents: 'none' }}>
              <rect
                x={hoveredFocus.x - 60} y={hoveredFocus.y - 24}
                width="120" height="18" rx="4"
                fill="white" stroke={C.border} strokeWidth="0.5"
              />
              <text x={hoveredFocus.x} y={hoveredFocus.y - 12}
                textAnchor="middle" fontSize="8" fontWeight="600" fill={C.text}>
                {hoveredFocus.name.length > 28 ? hoveredFocus.name.slice(0, 26) + '...' : hoveredFocus.name}
              </text>
            </g>
          )}

          {/* 7 Pathway circles */}
          {pwPositions.map(function (pw) {
            const isActive = (activePathways || []).includes(pw.id) || activePw === pw.id
            const isDimmed = activePw && !isActive
            const totalCount = pw.entityCounts.content + pw.entityCounts.services + pw.entityCounts.officials + pw.entityCounts.organizations + pw.entityCounts.policies
            return (
              <g key={pw.id}
                onClick={function () { handleClick(pw.id) }}
                onMouseEnter={function () { setHovered(pw.id) }}
                onMouseLeave={function () { setHovered(null) }}
                style={{ cursor: 'pointer', transition: 'opacity .2s' }}
                opacity={isDimmed ? 0.2 : 1}
              >
                {/* Glow pulse for active */}
                {isActive && !compact && (
                  <circle cx={pw.x} cy={pw.y} r={PW_R + 8}
                    fill="none" stroke={pw.color} strokeWidth="1.5" opacity="0.15">
                    <animate attributeName="r" values={(PW_R + 6) + ';' + (PW_R + 12) + ';' + (PW_R + 6)} dur="3s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.2;0.05;0.2" dur="3s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* Main circle */}
                <circle cx={pw.x} cy={pw.y} r={PW_R}
                  fill={isActive ? pw.color + '14' : C.bg}
                  stroke={pw.color} strokeWidth={isActive ? 2.5 : 1.5}
                />

                {/* Pathway name */}
                <text x={pw.x} y={pw.y - (compact ? 0 : 8)}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize={compact ? 10 : 13} fontWeight="700"
                  fill={pw.color} fontFamily="'DM Sans', sans-serif">
                  {pw.name.replace('Our ', '').replace('The ', '')}
                </text>

                {/* Item count */}
                {!compact && totalCount > 0 && (
                  <text x={pw.x} y={pw.y + 10}
                    textAnchor="middle" fontSize="10" fill={C.muted}
                    fontFamily="'DM Sans', sans-serif">
                    {totalCount} items
                  </text>
                )}

                {/* Focus area count badge */}
                {!compact && pw.focusAreas.length > 0 && (
                  <g>
                    <circle cx={pw.x + PW_R - 6} cy={pw.y - PW_R + 6} r="10" fill={pw.color} />
                    <text x={pw.x + PW_R - 6} y={pw.y - PW_R + 6}
                      textAnchor="middle" dominantBaseline="central"
                      fontSize="8" fontWeight="700" fill="white"
                      fontFamily="'DM Sans', sans-serif">
                      {pw.focusAreas.length}
                    </text>
                  </g>
                )}
              </g>
            )
          })}

          {/* Center circle — YOU */}
          <circle cx={CX} cy={CY} r={CENTER_R}
            fill={C.bg} stroke={C.accent} strokeWidth="2.5" />

          {user?.avatar ? (
            <image
              href={user.avatar}
              x={CX - CENTER_R + 3} y={CY - CENTER_R + 3}
              width={(CENTER_R - 3) * 2} height={(CENTER_R - 3) * 2}
              clipPath="url(#avatar-clip-kg)"
            />
          ) : (
            <>
              <text x={CX} y={CY - (user ? 0 : 0)}
                textAnchor="middle" dominantBaseline="central"
                fontSize={user ? 14 : 16} fontWeight="800" fill={C.accent}
                fontFamily="'DM Serif Display', serif">
                {user ? user.name.split(' ').map(function (w) { return w[0] }).join('').slice(0, 2) : 'You'}
              </text>
            </>
          )}

          {/* Subtitle under center */}
          {!compact && (
            <text x={CX} y={CY + CENTER_R + 16}
              textAnchor="middle" fontSize="9" fill={C.mutedLight}
              fontFamily="'DM Sans', sans-serif">
              {totalEntities.toLocaleString()} connected entities
            </text>
          )}
        </svg>
      </div>

      {/* ── Detail Panel (full mode) ── */}
      {!compact && (
        <div className="flex-1 min-w-0 py-2">
          {activeDetail ? (
            <PathwayDetail
              pw={activeDetail}
              allPathways={data.pathways}
              bridges={data.bridges}
              onSelect={function (id) { setSelected(id) }}
            />
          ) : (
            <GraphSummary
              data={data}
              totalEntities={totalEntities}
              onSelect={function (id) { setSelected(id) }}
            />
          )}
        </div>
      )}
    </div>
  )
}

// ── Pathway Detail Panel ──
function PathwayDetail({ pw, allPathways, bridges, onSelect }: {
  pw: CircleGraphData['pathways'][number]
  allPathways: CircleGraphData['pathways']
  bridges: CircleGraphData['bridges']
  onSelect: (id: string) => void
}) {
  const total = pw.entityCounts.content + pw.entityCounts.services + pw.entityCounts.officials + pw.entityCounts.organizations + pw.entityCounts.policies
  const pwBridges = bridges.filter(function (b) { return b.from === pw.id || b.to === pw.id })

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-3">
        <span className="w-3.5 h-3.5 rounded" style={{ backgroundColor: pw.color }} />
        <h3 className="font-serif font-bold text-xl text-brand-text">{pw.name}</h3>
        <Link href={'/pathways/' + pw.slug}
          className="text-xs font-semibold ml-auto hover:underline" style={{ color: pw.color }}>
          Explore pathway
        </Link>
      </div>

      {/* Entity counts */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        {Object.entries(ENTITY_META).map(function ([key, meta]) {
          const count = pw.entityCounts[key as keyof typeof pw.entityCounts] || 0
          return (
            <Link key={key} href={meta.href}
              className="bg-white rounded-lg border-2 border-brand-border p-2.5 text-center hover:border-brand-accent transition-colors">
              <p className="text-base font-bold" style={{ color: count > 0 ? meta.color : C.mutedLight }}>{count}</p>
              <p className="text-[9px] font-bold uppercase tracking-wider text-brand-muted">{meta.label}</p>
            </Link>
          )
        })}
      </div>

      {/* Focus Areas */}
      {pw.focusAreas.length > 0 && (
        <div className="mb-4">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-2">
            Focus Areas ({pw.focusAreas.length})
          </h4>
          <div className="flex flex-wrap gap-1">
            {pw.focusAreas.slice(0, 24).map(function (fa) {
              return (
                <Link key={fa.id} href={'/explore/focus/' + fa.id}
                  className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-brand-bg-alt hover:bg-brand-border transition-colors text-brand-text">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: pw.color }} />
                  {fa.name}
                </Link>
              )
            })}
            {pw.focusAreas.length > 24 && (
              <span className="text-[10px] text-brand-muted px-2 py-1">+{pw.focusAreas.length - 24} more</span>
            )}
          </div>
        </div>
      )}

      {/* Bridge connections */}
      {pwBridges.length > 0 && (
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-2">
            Connected Pathways
          </h4>
          <div className="space-y-0.5">
            {pwBridges.slice(0, 6).map(function (b) {
              const otherId = b.from === pw.id ? b.to : b.from
              const other = allPathways.find(function (p) { return p.id === otherId })
              if (!other) return null
              return (
                <button key={otherId}
                  onClick={function () { onSelect(otherId) }}
                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-brand-bg-alt transition-colors text-left">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: other.color }} />
                  <span className="text-xs font-medium text-brand-text flex-1">{other.name}</span>
                  <span className="text-[10px] text-brand-muted">{b.count} shared</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Graph Summary (no pathway selected) ──
function GraphSummary({ data, totalEntities, onSelect }: {
  data: CircleGraphData
  totalEntities: number
  onSelect: (id: string) => void
}) {
  return (
    <div>
      <h3 className="font-serif font-bold text-xl text-brand-text mb-1">Civic Knowledge Graph</h3>
      <p className="text-sm text-brand-muted mb-4">
        Click a pathway to explore focus areas, entity connections, and bridges.
        {' '}{totalEntities.toLocaleString()} entities across {data.totals.focusAreas} focus areas.
      </p>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {[
          { v: data.totals.content, l: 'Content', c: '#C75B2A' },
          { v: data.totals.organizations, l: 'Organizations', c: '#dd6b20' },
          { v: data.totals.services, l: 'Services', c: '#d69e2e' },
          { v: data.totals.officials, l: 'Officials', c: '#805ad5' },
          { v: data.totals.policies, l: 'Policies', c: '#3182ce' },
          { v: data.totals.focusAreas, l: 'Focus Areas', c: '#38a169' },
        ].map(function (s) {
          return (
            <div key={s.l} className="bg-white rounded-lg border-2 border-brand-border p-2 text-center">
              <p className="text-base font-bold" style={{ color: s.c }}>{s.v}</p>
              <p className="text-[9px] font-bold uppercase tracking-wider text-brand-muted">{s.l}</p>
            </div>
          )
        })}
      </div>

      {/* Pathway list */}
      <h4 className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-2">7 Topics</h4>
      <div className="space-y-0.5 mb-4">
        {data.pathways.map(function (pw) {
          const total = pw.entityCounts.content + pw.entityCounts.services + pw.entityCounts.officials + pw.entityCounts.organizations + pw.entityCounts.policies
          return (
            <button key={pw.id}
              onClick={function () { onSelect(pw.id) }}
              className="flex items-center gap-2.5 w-full px-2 py-2 rounded-lg hover:bg-brand-bg-alt transition-colors text-left group">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: pw.color }} />
              <span className="text-sm font-medium text-brand-text flex-1">{pw.name}</span>
              <span className="text-[10px] text-brand-muted">{pw.focusAreas.length} topics</span>
              <span className="text-[10px] font-medium" style={{ color: pw.color }}>{total}</span>
            </button>
          )
        })}
      </div>

      {/* Top bridges */}
      {data.bridges.length > 0 && (
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-2">Strongest Connections</h4>
          <div className="space-y-0.5">
            {data.bridges.slice(0, 5).map(function (b, i) {
              const from = data.pathways.find(function (p) { return p.id === b.from })
              const to = data.pathways.find(function (p) { return p.id === b.to })
              if (!from || !to) return null
              return (
                <div key={i} className="flex items-center gap-2 px-2 py-1.5 text-xs text-brand-text">
                  <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: from.color }} />
                  <span className="font-medium">{from.name.replace('Our ', '')}</span>
                  <span className="text-brand-muted flex-shrink-0">--</span>
                  <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: to.color }} />
                  <span className="font-medium">{to.name.replace('Our ', '')}</span>
                  <span className="text-[10px] text-brand-muted ml-auto">{b.count} shared</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
