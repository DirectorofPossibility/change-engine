'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react'
import type { CircleData, CirclePathway, CircleGuide, CircleService } from '@/lib/data/circle'
import { searchCircleAction } from '@/app/circle/actions'

// ═══════════════════════════════════════════════════════════════
// THE COMMUNITY EXCHANGE — Concentric Knowledge Onion
// Two-column: Onion (left, sticky) + Detail Panel (right, scrollable)
// ═══════════════════════════════════════════════════════════════

const C = {
  cream: '#EDEAE3', card: '#F5F2EC', white: '#FAFAF7', cardW: '#FFFFFF',
  charcoal: '#2C2C2C', txt: '#3A3632', mid: '#6B6560',
  lt: '#9A9080', lt2: '#B5AFA5', bdr: '#DAD5CC', rule: '#C5BFB5',
  orange: '#C65D28', teal: '#3D5A5A', tealLt: '#5B8A8A',
}

const CENTERS = [
  { key: 'Learning', color: '#4C9F38' },
  { key: 'Action', color: '#DD1367' },
  { key: 'Resource', color: '#26BDE2' },
  { key: 'Responsible', color: '#8B6BA8' },
]

const ctrColor = (c: string) => ({ Learning: '#4C9F38', Action: '#DD1367', Resource: '#26BDE2', Responsible: '#8B6BA8' }[c] || '#999')
const lvlColor = (l: string) => ({ City: '#5B8A8A', County: '#8B7D3C', State: '#C65D28', Federal: '#7B6BA8' }[l] || '#999')
const stColor = (s: string) => s === 'Active' ? '#C65D28' : s === 'Enacted' ? '#5A8E5A' : '#8B7D3C'

type RingKey = 'resources' | 'guides' | 'services' | 'officials' | 'policies'

const RING_CONFIG: { key: RingKey; label: string; shortLabel: string }[] = [
  { key: 'resources', label: 'Resources', shortLabel: 'Resources' },
  { key: 'guides', label: 'Guides', shortLabel: 'Guides' },
  { key: 'services', label: '211 Services', shortLabel: '211' },
  { key: 'officials', label: "Who's Responsible", shortLabel: 'Officials' },
  { key: 'policies', label: 'Policies', shortLabel: 'Policies' },
]

function getRingCount(pw: CirclePathway, ring: RingKey): number {
  switch (ring) {
    case 'resources': return pw.resources.length
    case 'guides': return pw.guides.length
    case 'services': return pw.services.length
    case 'officials': return pw.officials.length
    case 'policies': return pw.policies.length
  }
}

// ─── CIRCLE GEOMETRY (same as before) ───
const VBW = 680, VBH = 500
const CX = VBW / 2, CY = 240
const ORBIT = 155, CR = 78, CTR_R = 68
const POS = (() => {
  const p: { x: number; y: number }[] = []
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 2
    p.push({ x: CX + ORBIT * Math.cos(a), y: CY + ORBIT * Math.sin(a) })
  }
  p.push({ x: CX, y: CY })
  return p
})()

const LOGO_COLORS = ['#D4654A', '#C4943C', '#7B6BA8', '#3D7A7A', '#4A7A8A', '#5A8E5A', '#8B6BA8']
const LOGO_CENTER = [false, false, false, false, false, false, true]
const Logo = ({ size = 36 }: { size?: number }) => (
  <svg width={size} height={size} viewBox={`0 0 ${VBW} ${VBH}`}>
    {POS.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={LOGO_CENTER[i] ? CTR_R : CR} fill="none" stroke={LOGO_COLORS[i] || '#999'} strokeWidth="18" opacity=".55" />)}
  </svg>
)

// ═══════════════════════════════════════
// THE CIRCLES (center of the onion)
// ═══════════════════════════════════════
const TheCircles = ({ sel, onSelect, ready, pathways, bridgeData }: {
  sel: number | null; onSelect: (i: number) => void; ready: boolean;
  pathways: CirclePathway[]; bridgeData: [number, number, number, string][]
}) => {
  const [hov, setHov] = useState<number | null>(null)
  const open = sel !== null
  const pw = sel !== null ? pathways[sel] : null

  const bridges = sel !== null ? bridgeData.filter(b => b[0] === sel || b[1] === sel).map(b => {
    const oi = b[0] === sel ? b[1] : b[0]
    return { idx: oi, shared: b[2], label: b[3], color: pathways[oi]?.color }
  }) : []

  const arc = (a: number, b: number) => {
    const p1 = POS[a], p2 = POS[b]
    const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2
    const dx = p2.x - p1.x, dy = p2.y - p1.y
    const len = Math.sqrt(dx * dx + dy * dy) || 1
    const off = 22
    const qx = mx + (-dy / len) * off, qy = my + (dx / len) * off
    return { d: `M${p1.x},${p1.y} Q${qx},${qy} ${p2.x},${p2.y}`, mx: qx, my: qy }
  }

  return (
    <g>
      {bridgeData.map((b, i) => {
        const [i1, i2, cnt] = b
        const active = open && (i1 === sel || i2 === sel)
        const dim = open && !active
        const { d, mx, my } = arc(i1, i2)
        const clr = active ? (pw?.color || '#999') : '#B5AFA5'
        return (
          <g key={`b${i}`} opacity={dim ? .03 : active ? .8 : .16} style={{ transition: 'opacity .35s' }}>
            <path d={d} fill="none" stroke={clr} strokeWidth={active ? 2.5 : 1.3} strokeDasharray={active ? 'none' : '7,5'}
              style={ready ? { strokeDashoffset: 0, animation: `drawL .9s ease ${.15 + i * .05}s both` } : {}} />
            {(!open || active) && (
              <g style={ready ? { animation: `fin .5s ease ${.4 + i * .05}s both` } : {}}>
                <circle cx={mx} cy={my} r={active ? 14 : 11} fill={active ? clr : C.cream} stroke={active ? 'none' : C.rule} strokeWidth={.7} />
                <text x={mx} y={my + .5} textAnchor="middle" dominantBaseline="middle" fill={active ? '#fff' : '#8A8578'} fontSize={active ? 10 : 8} fontWeight="700" style={{ fontFamily: "'DM Sans'", pointerEvents: 'none' }}>{cnt}</text>
              </g>
            )}
          </g>
        )
      })}
      {pathways.map((p, i) => {
        const { x, y } = POS[i]
        const isSel = sel === i, isHov = hov === i
        const isBr = open && bridges.some(b => b.idx === i)
        const dim = open && !isSel && !isBr
        const base = p.isCenter ? CTR_R : CR
        const r = isSel ? base + 10 : isHov ? base + 5 : base
        return (
          <g key={p.key} style={{ cursor: 'pointer', transition: 'opacity .35s' }} opacity={dim ? .12 : 1}
            onClick={() => onSelect(i)} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}>
            {(isSel || isHov) && <circle cx={x} cy={y} r={r + 16} fill={p.color} opacity={isSel ? .08 : .04} />}
            <circle cx={x} cy={y} r={r} fill="none" stroke={p.color}
              strokeWidth={isSel ? 3.8 : isHov ? 3 : 2.2} opacity={isSel ? 1 : isHov ? .85 : .45}
              style={{ transition: 'all .25s', ...(ready ? { strokeDasharray: 600, animation: `draw .9s ease ${i * .1}s both` } : {}) }} />
            <circle cx={x} cy={y} r={r * .52} fill="none" stroke={p.color} strokeWidth={.7} opacity={isSel ? .22 : .07} />
            <text x={x} y={y - 6} textAnchor="middle" dominantBaseline="middle"
              fill={isSel ? p.color : C.txt} fontSize={isSel ? 18 : isHov ? 17 : 16} fontWeight={isSel ? 700 : 600}
              style={{ fontFamily: "'DM Sans'", transition: 'all .2s', pointerEvents: 'none' }}>{p.name}</text>
            <text x={x} y={y + 13} textAnchor="middle" dominantBaseline="middle"
              fill={isSel ? p.color : '#8A8578'} fontSize="11" fontWeight="400" opacity={isSel ? .7 : .5}
              style={{ fontFamily: "'Newsreader',serif", fontStyle: 'italic', pointerEvents: 'none' }}>{p.count} resources</text>
            {isHov && !open && (
              <text x={x} y={y + 28} textAnchor="middle" fill={p.color} fontSize="10" opacity=".5"
                style={{ fontFamily: "'Newsreader',serif", fontStyle: 'italic', pointerEvents: 'none', animation: 'fin .12s ease' }}>{p.sub}</text>
            )}
            {isBr && !isSel && (() => {
              const br = bridges.find(b => b.idx === i)
              return (
                <g style={{ animation: 'fin .3s ease' }}>
                  <circle cx={x + r * .65} cy={y - r * .65} r={11} fill={p.color} opacity={.85} />
                  <text x={x + r * .65} y={y - r * .65 + .5} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="8" fontWeight="700" style={{ fontFamily: "'DM Sans'", pointerEvents: 'none' }}>{br?.shared}</text>
                </g>
              )
            })()}
          </g>
        )
      })}
    </g>
  )
}

// ═══════════════════════════════════════
// ONION RINGS SVG
// ═══════════════════════════════════════
function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const s = (startAngle * Math.PI) / 180
  const e = (endAngle * Math.PI) / 180
  const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s)
  const x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e)
  const large = endAngle - startAngle > 180 ? 1 : 0
  return `M${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2}`
}

const OnionRings = ({ pathways, bridgeData, sel, onSelect, activeRing, onRingClick, ready }: {
  pathways: CirclePathway[]
  bridgeData: [number, number, number, string][]
  sel: number | null
  onSelect: (i: number) => void
  activeRing: RingKey | null
  onRingClick: (ring: RingKey, pwIdx: number) => void
  ready: boolean
}) => {
  const [hovRing, setHovRing] = useState<{ ring: RingKey; pw: number } | null>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null)

  const ONION_CX = 450, ONION_CY = 270
  const RING_RADII = [
    { key: 'resources' as RingKey, r: 230, thickness: 28 },
    { key: 'guides' as RingKey, r: 266, thickness: 22 },
    { key: 'services' as RingKey, r: 296, thickness: 22 },
    { key: 'officials' as RingKey, r: 326, thickness: 22 },
    { key: 'policies' as RingKey, r: 356, thickness: 22 },
  ]

  const GAP_DEG = 4
  const NUM_SEGMENTS = 7
  const TOTAL_GAP = GAP_DEG * NUM_SEGMENTS
  const AVAILABLE_DEG = 360 - TOTAL_GAP
  const SEGMENT_DEG = AVAILABLE_DEG / NUM_SEGMENTS

  // Compute segment angles for each pathway
  const segments = pathways.map((_, i) => {
    const start = -90 + i * (SEGMENT_DEG + GAP_DEG)
    const end = start + SEGMENT_DEG
    return { start, end }
  })

  // Scale factor + offset to embed TheCircles inside onion center
  const circlesScale = 0.55
  const circlesOffsetX = ONION_CX - CX * circlesScale
  const circlesOffsetY = ONION_CY - CY * circlesScale

  return (
    <svg
      viewBox="0 0 900 560"
      style={{ width: '100%', height: '100%', overflow: 'visible' }}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Ring labels outside */}
      {RING_RADII.map((ring, ri) => {
        const labelR = ring.r + ring.thickness / 2
        const angle = (-90) * Math.PI / 180
        const lx = ONION_CX + labelR * Math.cos(angle)
        const ly = ONION_CY + labelR * Math.sin(angle)
        const cfg = RING_CONFIG[ri]
        const isActive = activeRing === ring.key
        return (
          <text
            key={ring.key}
            x={lx}
            y={ly - ring.thickness / 2 - 4}
            textAnchor="middle"
            fontSize={isActive ? 11 : 9}
            fontWeight={isActive ? 700 : 500}
            fill={isActive ? C.charcoal : C.lt}
            opacity={isActive ? 1 : 0.6}
            style={{ fontFamily: "'DM Sans'", pointerEvents: 'none', transition: 'all .2s' }}
          >
            {cfg.shortLabel}
          </text>
        )
      })}

      {/* Concentric ring segments */}
      {RING_RADII.map((ring, ri) => (
        <g key={ring.key}>
          {pathways.map((pw, pi) => {
            const count = getRingCount(pw, ring.key)
            const seg = segments[pi]
            const isHov = hovRing?.ring === ring.key && hovRing?.pw === pi
            const isActive = activeRing === ring.key && sel === pi
            const isPathwayActive = sel === pi
            const isRingActive = activeRing === ring.key
            const isDimmed = (sel !== null && !isPathwayActive && !isRingActive) ||
              (activeRing !== null && !isActive && !isPathwayActive)

            const midAngle = ((seg.start + seg.end) / 2) * Math.PI / 180
            const tipX = ONION_CX + ring.r * Math.cos(midAngle)
            const tipY = ONION_CY + ring.r * Math.sin(midAngle)

            return (
              <path
                key={`${ring.key}-${pi}`}
                d={arcPath(ONION_CX, ONION_CY, ring.r, seg.start, seg.end)}
                fill="none"
                stroke={pw.color}
                strokeWidth={isActive ? ring.thickness + 8 : isHov ? ring.thickness + 4 : ring.thickness}
                strokeLinecap="round"
                opacity={isDimmed ? 0.1 : isActive ? 0.95 : isHov ? 0.7 : isPathwayActive ? 0.5 : 0.25}
                style={{ cursor: 'pointer', transition: 'all .2s' }}
                onClick={() => onRingClick(ring.key, pi)}
                onMouseEnter={() => {
                  setHovRing({ ring: ring.key, pw: pi })
                  setTooltip({ x: tipX, y: tipY, text: `${pw.name} ${RING_CONFIG[ri].label}: ${count}` })
                }}
                onMouseLeave={() => { setHovRing(null); setTooltip(null) }}
              />
            )
          })}
        </g>
      ))}

      {/* TheCircles in center, scaled down */}
      <g transform={`translate(${circlesOffsetX},${circlesOffsetY}) scale(${circlesScale})`}>
        <TheCircles sel={sel} onSelect={onSelect} ready={ready} pathways={pathways} bridgeData={bridgeData} />
      </g>

      {/* Tooltip */}
      {tooltip && (
        <g style={{ pointerEvents: 'none', animation: 'fin .1s ease' }}>
          <rect
            x={tooltip.x - 80} y={tooltip.y - 28}
            width={160} height={24}
            rx={4}
            fill={C.charcoal}
            opacity={0.9}
          />
          <text
            x={tooltip.x} y={tooltip.y - 13}
            textAnchor="middle"
            fill="#fff"
            fontSize={10}
            fontWeight={600}
            style={{ fontFamily: "'DM Sans'", pointerEvents: 'none' }}
          >
            {tooltip.text}
          </text>
        </g>
      )}
    </svg>
  )
}

// ═══════════════════════════════════════
// SLIDE-OUT PANEL (kept from v13)
// ═══════════════════════════════════════
const SlidePanel = ({ panel, onClose, onNavigate, panelList, panelIdx }: any) => {
  if (!panel) return null
  const { type, data, pw: pwData } = panel

  const relatedOfficials = type === 'resource' && pwData ? pwData.officials || [] : []
  const relatedPolicies = type === 'resource' && pwData ? pwData.policies || [] : []
  const relatedResources = type !== 'resource' && pwData ? pwData.resources || [] : []
  const officialPolicies = type === 'official' && pwData ? pwData.policies || [] : []
  const policyOfficials = type === 'policy' && pwData ? pwData.officials || [] : []

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.25)', zIndex: 200, animation: 'fin .2s ease' }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 520, maxWidth: '94vw', background: C.cardW, zIndex: 201, display: 'flex', flexDirection: 'column', boxShadow: '-12px 0 48px rgba(0,0,0,.12)', animation: 'slideIn .3s cubic-bezier(.22,1,.36,1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: `1px solid ${C.bdr}`, background: C.white, position: 'sticky', top: 0, zIndex: 10 }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 600, color: C.mid, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 4, cursor: 'pointer' }}>
            <span style={{ fontSize: 16 }}>{'\u2190'}</span> Back
          </button>
          <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: C.lt2 }}>{type === 'resource' ? 'Resource' : type === 'official' ? 'Official' : type === 'guide' ? 'Guide' : type === 'service' ? 'Service' : 'Policy'}</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => onNavigate(-1)} disabled={panelIdx <= 0} style={{ background: 'none', border: `1px solid ${C.bdr}`, borderRadius: 4, padding: '4px 10px', fontSize: 11, color: C.mid, cursor: panelIdx <= 0 ? 'default' : 'pointer', opacity: panelIdx <= 0 ? .3 : 1 }}>{'\u2190'}</button>
            <button onClick={() => onNavigate(1)} disabled={panelIdx >= panelList.length - 1} style={{ background: 'none', border: `1px solid ${C.bdr}`, borderRadius: 4, padding: '4px 10px', fontSize: 11, color: C.mid, cursor: panelIdx >= panelList.length - 1 ? 'default' : 'pointer', opacity: panelIdx >= panelList.length - 1 ? .3 : 1 }}>{'\u2192'}</button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 48px' }}>
          {type === 'resource' && (() => {
            const r = data; const cc = ctrColor(r.center)
            return (<div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>{pwData && <Tag color={pwData.color}>{pwData.name}</Tag>}<Tag color={cc}>{r.center}</Tag></div>
              <h2 style={{ fontFamily: "'Newsreader',serif", fontSize: 22, fontWeight: 700, lineHeight: 1.2, marginBottom: 4 }}>{r.title}</h2>
              {r.org && <div style={{ fontFamily: "'DM Sans'", fontSize: 11, color: C.lt, marginBottom: 10 }}>via {r.org}</div>}
              <p style={{ fontFamily: "'Newsreader',serif", fontSize: 13, color: C.mid, lineHeight: 1.7, marginBottom: 14 }}>{r.desc || r.summary}</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>{r.source_url ? <a href={r.source_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}><ActionBtn primary>Visit Resource {'\u2192'}</ActionBtn></a> : null}<a href={`/content/${r.id}`} style={{ textDecoration: 'none' }}><ActionBtn>Full Details</ActionBtn></a></div>
              {relatedOfficials.length > 0 && (<PanelSection title="Who's Responsible" color={C.teal}>{relatedOfficials.map((off: any, i: number) => (<MiniCard key={i} onClick={() => onNavigate('official', off)} bar={lvlColor(off.level)} label={off.level}><div style={{ fontSize: 12, fontWeight: 700 }}>{off.name}</div><div style={{ fontSize: 10, color: C.mid }}>{off.role}</div></MiniCard>))}</PanelSection>)}
              {relatedPolicies.length > 0 && (<PanelSection title="Policies to Watch" color={C.orange}>{relatedPolicies.map((pol: any, i: number) => (<MiniCard key={i} onClick={() => onNavigate('policy', pol)} bar={stColor(pol.status)} label={pol.status} labelColor={stColor(pol.status)}><div style={{ fontSize: 12, fontWeight: 700 }}>{pol.name}</div><div style={{ fontSize: 10, color: C.mid }}>{pol.level} {'\u00b7'} {pol.body}</div></MiniCard>))}</PanelSection>)}
            </div>)
          })()}
          {type === 'official' && (() => {
            const off = data
            return (<div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}><Tag color={lvlColor(off.level)}>{off.level}</Tag>{pwData && <Tag color={pwData.color}>{pwData.name}</Tag>}</div>
              <h2 style={{ fontFamily: "'Newsreader',serif", fontSize: 24, fontWeight: 700, lineHeight: 1.15, marginBottom: 2 }}>{off.name}</h2>
              <div style={{ fontSize: 14, color: C.mid, fontFamily: "'Newsreader',serif", marginBottom: 2 }}>{off.role}</div>
              <div style={{ fontSize: 11, color: C.lt, marginBottom: 10 }}>{off.jur}</div>
              {off.note && <p style={{ fontFamily: "'Newsreader',serif", fontSize: 13, color: C.mid, lineHeight: 1.65, marginBottom: 12 }}>{off.note}</p>}
              {off.phone && (<div style={{ background: C.card, border: `1px solid ${C.bdr}`, borderRadius: 8, padding: 14, marginBottom: 14 }}><div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: C.tealLt, marginBottom: 4 }}>Phone</div><a href={`tel:${off.phone?.replace(/[^0-9]/g, '')}`} style={{ fontSize: 20, fontFamily: "'Newsreader',serif", fontWeight: 700, color: C.teal, textDecoration: 'none' }}>{off.phone}</a></div>)}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>{off.website ? <a href={off.website} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}><ActionBtn primary>Official Website {'\u2192'}</ActionBtn></a> : null}{off.phone && <a href={`tel:${off.phone.replace(/[^0-9]/g, '')}`} style={{ textDecoration: 'none' }}><ActionBtn>Call Now</ActionBtn></a>}</div>
              {officialPolicies.length > 0 && (<PanelSection title="Policies in Their Area" color={C.orange}>{officialPolicies.map((pol: any, i: number) => (<MiniCard key={i} onClick={() => onNavigate('policy', pol)} bar={stColor(pol.status)} label={pol.status} labelColor={stColor(pol.status)}><div style={{ fontSize: 12, fontWeight: 700 }}>{pol.name}</div>{pol.plain && <div style={{ fontSize: 10, color: C.mid, marginTop: 2, lineHeight: 1.45 }}>{pol.plain}</div>}</MiniCard>))}</PanelSection>)}
              {relatedResources.length > 0 && (<PanelSection title="Related Resources" color={pwData?.color || C.teal}><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>{relatedResources.slice(0, 6).map((res: any, i: number) => (<MiniCardCompact key={i} onClick={() => onNavigate('resource', res)}><div style={{ fontSize: 10, fontWeight: 700, lineHeight: 1.3 }}>{res.title}</div><div style={{ fontSize: 8, color: C.lt, marginTop: 2 }}>{res.org}</div></MiniCardCompact>))}</div></PanelSection>)}
            </div>)
          })()}
          {type === 'policy' && (() => {
            const pol = data
            return (<div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}><Tag color={stColor(pol.status)}>{pol.status}</Tag>{pwData && <Tag color={pwData.color}>{pwData.name}</Tag>}<Tag color={lvlColor(pol.level)}>{pol.level}</Tag></div>
              <h2 style={{ fontFamily: "'Newsreader',serif", fontSize: 22, fontWeight: 700, lineHeight: 1.2, marginBottom: 4 }}>{pol.name}</h2>
              <div style={{ fontSize: 11, color: C.lt, marginBottom: 8 }}>Decided by: <span style={{ color: C.teal, fontWeight: 700 }}>{pol.body}</span></div>
              {pol.desc && <p style={{ fontFamily: "'Newsreader',serif", fontSize: 13, color: C.mid, lineHeight: 1.65, marginBottom: 10 }}>{pol.desc}</p>}
              {pol.plain && (<div style={{ background: '#FAF8F2', border: `1px solid ${C.bdr}`, borderLeft: `3px solid ${C.tealLt}`, borderRadius: 6, padding: 16, marginBottom: 14 }}><div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: C.tealLt, marginBottom: 6 }}>In Plain Language</div><p style={{ fontFamily: "'Newsreader',serif", fontSize: 13.5, color: C.txt, lineHeight: 1.7 }}>{pol.plain}</p></div>)}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>{pol.source_url ? <a href={pol.source_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}><ActionBtn primary>Read Full Policy {'\u2192'}</ActionBtn></a> : null}</div>
              {policyOfficials.length > 0 && (<PanelSection title="Who's Responsible" color={C.teal}>{policyOfficials.map((off: any, i: number) => (<MiniCard key={i} onClick={() => onNavigate('official', off)} bar={lvlColor(off.level)} label={off.level}><div style={{ fontSize: 12, fontWeight: 700 }}>{off.name}</div><div style={{ fontSize: 10, color: C.mid }}>{off.role} {'\u00b7'} {off.jur}</div></MiniCard>))}</PanelSection>)}
              {relatedResources.length > 0 && (<PanelSection title="Related Resources" color={pwData?.color || C.teal}><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>{relatedResources.slice(0, 6).map((res: any, i: number) => (<MiniCardCompact key={i} onClick={() => onNavigate('resource', res)}><div style={{ fontSize: 10, fontWeight: 700, lineHeight: 1.3 }}>{res.title}</div><div style={{ fontSize: 8, color: C.lt, marginTop: 2 }}>{res.org}</div></MiniCardCompact>))}</div></PanelSection>)}
            </div>)
          })()}
          {type === 'guide' && (() => {
            const g = data as CircleGuide
            return (<div>
              {pwData && <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}><Tag color={pwData.color}>{pwData.name}</Tag><Tag color={C.tealLt}>Guide</Tag></div>}
              <h2 style={{ fontFamily: "'Newsreader',serif", fontSize: 22, fontWeight: 700, lineHeight: 1.2, marginBottom: 8 }}>{g.title}</h2>
              <p style={{ fontFamily: "'Newsreader',serif", fontSize: 13, color: C.mid, lineHeight: 1.7, marginBottom: 14 }}>{g.description}</p>
              <a href={`/guides/${g.slug}`} style={{ textDecoration: 'none' }}><ActionBtn primary>Read Full Guide {'\u2192'}</ActionBtn></a>
            </div>)
          })()}
          {type === 'service' && (() => {
            const s = data as CircleService
            return (<div>
              {pwData && <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}><Tag color={pwData.color}>{pwData.name}</Tag><Tag color={C.tealLt}>211 Service</Tag></div>}
              <h2 style={{ fontFamily: "'Newsreader',serif", fontSize: 22, fontWeight: 700, lineHeight: 1.2, marginBottom: 4 }}>{s.name}</h2>
              {s.org && <div style={{ fontSize: 11, color: C.lt, marginBottom: 10 }}>via {s.org}</div>}
              {s.phone && (<div style={{ background: C.card, border: `1px solid ${C.bdr}`, borderRadius: 8, padding: 14, marginBottom: 14 }}><div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: C.tealLt, marginBottom: 4 }}>Phone</div><a href={`tel:${s.phone.replace(/[^0-9]/g, '')}`} style={{ fontSize: 20, fontFamily: "'Newsreader',serif", fontWeight: 700, color: C.teal, textDecoration: 'none' }}>{s.phone}</a></div>)}
              {s.address && <div style={{ fontSize: 12, color: C.mid, marginBottom: 8 }}>{s.address}</div>}
              <a href={`/services/${s.id}`} style={{ textDecoration: 'none' }}><ActionBtn primary>View Service Details {'\u2192'}</ActionBtn></a>
            </div>)
          })()}
        </div>
      </div>
    </>
  )
}

// ── Panel Sub-components ──
const Tag = ({ children, color }: { children: React.ReactNode; color: string }) => (
  <span style={{ fontSize: 8, fontWeight: 700, padding: '3px 10px', borderRadius: 3, background: `${color}14`, color, letterSpacing: '.04em' }}>{children}</span>
)

const ActionBtn = ({ children, primary }: { children: React.ReactNode; primary?: boolean }) => (
  <button style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '9px 18px', borderRadius: 6, fontSize: 11, fontWeight: 700, border: primary ? 'none' : `1px solid ${C.bdr}`, background: primary ? C.teal : C.cardW, color: primary ? '#fff' : C.mid, cursor: 'pointer', transition: '.15s' }}>{children}</button>
)

const PanelSection = ({ title, color, children }: { title: string; color: string; children: React.ReactNode }) => (
  <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${C.bdr}` }}>
    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: C.lt, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', border: `1.5px solid ${color}`, display: 'inline-block' }} />{title}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{children}</div>
  </div>
)

const MiniCard = ({ children, onClick, bar, label, labelColor }: { children: React.ReactNode; onClick?: () => void; bar?: string; label?: string; labelColor?: string }) => (
  <div onClick={onClick} className="ch" style={{ padding: '12px 14px', background: C.white, border: `1px solid ${C.bdr}`, borderLeft: bar ? `3px solid ${bar}` : `1px solid ${C.bdr}`, borderRadius: 6, cursor: 'pointer', transition: '.15s' }}>
    {label && (<span style={{ fontSize: 7, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: labelColor || bar, background: `${labelColor || bar}12`, padding: '2px 8px', borderRadius: 3, marginBottom: 4, display: 'inline-block' }}>{label}</span>)}
    {children}
    <div style={{ marginTop: 6, fontSize: 10, color: C.tealLt, fontWeight: 600 }}>View details {'\u203a'}</div>
  </div>
)

const MiniCardCompact = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
  <div onClick={onClick} className="ch" style={{ padding: '10px 12px', background: C.card, border: `1px solid ${C.bdr}`, borderRadius: 6, cursor: 'pointer', transition: '.15s' }}>{children}</div>
)

const InitialsCircle = ({ name, color, size = 38 }: { name: string; color: string; size?: number }) => (
  <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
    <circle cx={size/2} cy={size/2} r={size/2-2} fill="none" stroke={color} strokeWidth="1.5" opacity=".4" />
    <text x={size/2} y={size/2+1} textAnchor="middle" dominantBaseline="middle" fill={color} fontSize={size*0.28} fontWeight="700" style={{ fontFamily: "'Newsreader',serif" }}>{name.split(' ').map(n => n[0]).join('')}</text>
  </svg>
)

// ═══════════════════════════════════════
// RING CARD — unified card for all rings
// ═══════════════════════════════════════
const RingCard = ({ title, subtitle, meta, accentColor, onClick }: {
  title: string; subtitle?: string; meta?: string; accentColor: string; onClick?: () => void
}) => (
  <div onClick={onClick} className="ch" style={{
    background: C.white,
    border: `1px solid ${C.bdr}`,
    borderLeft: `3px solid ${accentColor}`,
    borderRadius: 8,
    padding: 16,
    cursor: 'pointer',
    transition: 'box-shadow .15s, transform .15s',
  }}>
    <div style={{ fontSize: 14, fontWeight: 600, color: C.charcoal, lineHeight: 1.35 }}>{title}</div>
    {subtitle && <div style={{ fontSize: 12, color: C.mid, marginTop: 4, lineHeight: 1.5 }}>{subtitle}</div>}
    {meta && <div style={{ fontSize: 12, color: C.lt, marginTop: 8 }}>{meta}</div>}
  </div>
)

// ═══════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════
export default function CommunityExchangeV13({ data }: { data: CircleData }) {
  const PW = data.pathways
  const BRIDGES = data.bridges
  const STATS = data.stats

  const [ready, setReady] = useState(false)
  const [sel, setSel] = useState<number | null>(null)
  const [activeRing, setActiveRing] = useState<RingKey | null>(null)
  const [centerFilter, setCenterFilter] = useState<string | null>(null)
  const [searchVal, setSearchVal] = useState('')
  const [searchResults, setSearchResults] = useState<any>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [zip, setZip] = useState('')

  const [panel, setPanel] = useState<any>(null)
  const [panelHistory, setPanelHistory] = useState<any[]>([])
  const [panelList, setPanelList] = useState<any[]>([])
  const [panelIdx, setPanelIdx] = useState(0)

  useEffect(() => { setTimeout(() => setReady(true), 60) }, [])

  const pw = sel !== null ? PW[sel] : null

  const pick = useCallback((i: number) => {
    if (i === sel) {
      setSel(null)
      setActiveRing(null)
      setCenterFilter(null)
    } else {
      setSel(i)
      setActiveRing(null)
      setCenterFilter(null)
    }
  }, [sel])

  const handleRingClick = useCallback((ring: RingKey, pwIdx: number) => {
    if (sel === pwIdx && activeRing === ring) {
      setActiveRing(null)
      setCenterFilter(null)
    } else {
      setSel(pwIdx)
      setActiveRing(ring)
      setCenterFilter(null)
    }
  }, [sel, activeRing])

  const openPanel = useCallback((type: string, data: any, pwIdx?: number) => {
    const pwData = pwIdx !== undefined ? PW[pwIdx] : (sel !== null ? PW[sel] : null)
    const foundPw = pwData || PW.find(p =>
      (type === 'resource' && p.resources.some(r => r.id === data.id)) ||
      (type === 'official' && p.officials?.some((o: any) => o.id === data.id)) ||
      (type === 'policy' && p.policies?.some((p2: any) => p2.id === data.id))
    )
    setPanel({ type, data, pw: foundPw })
    setPanelHistory(prev => [...prev, { type, data, pw: foundPw }])
  }, [sel, PW])

  const closePanel = () => { setPanel(null); setPanelHistory([]) }

  const navigatePanel = useCallback((dirOrType: number | string, data?: any) => {
    if (typeof dirOrType === 'string') {
      const foundPw = PW.find(p =>
        (dirOrType === 'resource' && p.resources.some(r => r.id === data.id)) ||
        (dirOrType === 'official' && p.officials?.some((o: any) => o.id === data.id)) ||
        (dirOrType === 'policy' && p.policies?.some((p2: any) => p2.id === data.id))
      )
      setPanel({ type: dirOrType, data, pw: foundPw || panel?.pw })
      setPanelHistory(prev => [...prev, { type: dirOrType, data, pw: foundPw || panel?.pw }])
    } else {
      const newIdx = panelIdx + dirOrType
      if (newIdx >= 0 && newIdx < panelList.length) {
        setPanelIdx(newIdx)
        const item = panelList[newIdx]
        const foundPw = PW.find(p =>
          (item.type === 'resource' && p.resources.some((r: any) => r.id === item.data.id)) ||
          (item.type === 'official' && p.officials?.some((o: any) => o.id === item.data.id)) ||
          (item.type === 'policy' && p.policies?.some((p2: any) => p2.id === item.data.id))
        )
        setPanel({ type: item.type, data: item.data, pw: foundPw })
      }
    }
  }, [panel, panelIdx, panelList, PW])

  const handleSearch = async () => {
    const q = searchVal.trim()
    if (!q) return
    setSearchLoading(true)
    setSel(null); setActiveRing(null); setCenterFilter(null)
    try {
      const results = await searchCircleAction(q)
      setSearchResults(results)
    } catch {
      setSearchResults(null)
    } finally {
      setSearchLoading(false)
    }
  }

  const goHome = () => {
    setSel(null); setActiveRing(null); setCenterFilter(null)
    setSearchResults(null); setSearchVal('')
  }

  // Build panel list when ring+pathway is selected for prev/next navigation
  useEffect(() => {
    if (sel !== null && activeRing && pw) {
      const items: any[] = []
      if (activeRing === 'resources') {
        const filtered = centerFilter
          ? pw.resources.filter(r => r.center === centerFilter)
          : pw.resources
        filtered.forEach(r => items.push({ type: 'resource', data: r }))
      } else if (activeRing === 'guides') {
        pw.guides.forEach(g => items.push({ type: 'guide', data: g }))
      } else if (activeRing === 'services') {
        pw.services.forEach(s => items.push({ type: 'service', data: s }))
      } else if (activeRing === 'officials') {
        pw.officials.forEach(o => items.push({ type: 'official', data: o }))
      } else if (activeRing === 'policies') {
        pw.policies.forEach(p => items.push({ type: 'policy', data: p }))
      }
      setPanelList(items)
      setPanelIdx(0)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel, activeRing, centerFilter])

  // Bridges for the selected pathway
  const bridges = sel !== null ? BRIDGES.filter(b => b[0] === sel || b[1] === sel).map(b => {
    const oi = b[0] === sel ? b[1] : b[0]
    return { idx: oi, name: PW[oi]?.name, shared: b[2], color: PW[oi]?.color }
  }) : []

  return (
    <div style={{ minHeight: '100vh', background: C.cream, fontFamily: "'DM Sans',sans-serif", color: C.charcoal }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;0,6..72,500;0,6..72,600;0,6..72,700;1,6..72,400;1,6..72,500&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0} button{font-family:inherit}
        @keyframes up{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fin{from{opacity:0}to{opacity:1}}
        @keyframes draw{from{stroke-dashoffset:600}to{stroke-dashoffset:0}}
        @keyframes drawL{from{stroke-dashoffset:500}to{stroke-dashoffset:0}}
        @keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
        .ch{transition:transform .18s,box-shadow .18s}.ch:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.07)}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#ccc;border-radius:3px}
        ::selection{background:#C65D2833}
        @media(max-width:1024px){
          .onion-layout{flex-direction:column !important}
          .onion-left{position:static !important;height:50vh !important;width:100% !important}
          .onion-right{width:100% !important;height:auto !important}
        }
        @media(max-width:768px){
          .onion-left{height:40vh !important}
        }
      `}</style>

      <SlidePanel panel={panel} onClose={closePanel} onNavigate={navigatePanel} panelList={panelList} panelIdx={panelIdx} />

      {/* TOP BAR */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: 48, background: C.charcoal, position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={goHome}>
          <Logo size={28} />
          <span style={{ fontFamily: "'Newsreader',serif", fontSize: 16, fontWeight: 600, color: '#fff' }}>
            Community <em style={{ fontStyle: 'italic', color: C.orange, fontWeight: 400 }}>Exchange</em>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search resources, officials, policies..."
            style={{ fontSize: 12, padding: '6px 12px', borderRadius: 4, border: 'none', background: 'rgba(255,255,255,.12)', color: '#fff', outline: 'none', width: 240 }}
          />
          <input
            value={zip}
            onChange={e => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
            placeholder="ZIP"
            style={{ fontSize: 12, padding: '6px 8px', borderRadius: 4, border: 'none', background: 'rgba(255,255,255,.12)', color: '#fff', outline: 'none', width: 64, textAlign: 'center' }}
          />
        </div>
      </div>

      {/* ELECTION BANNER */}
      <div style={{ background: '#8B7D3C', color: '#fff', padding: '6px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontSize: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', opacity: .8 }}>Upcoming</span>
        <span style={{ fontWeight: 600 }}>Texas Primary Election</span>
        <span style={{ fontSize: 10, opacity: .7 }}>Polls 7am-7pm</span>
        <a href="/polling-places" style={{ background: 'rgba(255,255,255,.18)', padding: '2px 12px', borderRadius: 3, fontSize: 10, fontWeight: 700, cursor: 'pointer', textDecoration: 'none', color: '#fff' }}>Find your polling place</a>
      </div>

      {/* TWO COLUMN LAYOUT */}
      <div className="onion-layout" style={{ display: 'flex', width: '100%', minHeight: 'calc(100vh - 48px)' }}>

        {/* LEFT: Onion SVG */}
        <div
          className="onion-left"
          style={{
            width: '50%',
            position: 'sticky',
            top: 48,
            height: 'calc(100vh - 48px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            opacity: ready ? 1 : 0,
            transition: 'opacity .4s ease .1s',
          }}
        >
          <OnionRings
            pathways={PW}
            bridgeData={BRIDGES}
            sel={sel}
            onSelect={pick}
            activeRing={activeRing}
            onRingClick={handleRingClick}
            ready={ready}
          />
        </div>

        {/* RIGHT: Detail Panel */}
        <div
          className="onion-right"
          style={{
            width: '50%',
            height: 'calc(100vh - 48px)',
            overflowY: 'auto',
            padding: '32px 32px 48px',
            opacity: ready ? 1 : 0,
            transition: 'opacity .4s ease .2s',
          }}
        >
          {/* STATE A: Landing (nothing selected) */}
          {!sel && !searchResults && (
            <div style={{ animation: 'up .5s ease .2s both' }}>
              <h1 style={{ fontFamily: "'Newsreader',serif", fontSize: 32, fontWeight: 400, lineHeight: 1.15, letterSpacing: '-.02em', marginBottom: 8 }}>
                Community Life, <span style={{ color: C.orange, fontWeight: 600 }}>Organized.</span>
              </h1>
              <div style={{ fontFamily: "'Newsreader',serif", fontStyle: 'italic', color: C.lt, fontSize: 16, lineHeight: 1.6, marginBottom: 32 }}>
                Houston, Texas
              </div>
              <p style={{ fontSize: 14, color: C.mid, lineHeight: 1.7, marginBottom: 32, maxWidth: 400 }}>
                Tap any circle to explore a pathway.<br />
                Tap a ring to see resources, guides, services, officials, or policies.
              </p>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                {[
                  { n: STATS.resources, l: 'Resources' },
                  { n: STATS.guides, l: 'Guides' },
                  { n: STATS.services, l: '211 Services' },
                  { n: STATS.officials, l: 'Officials' },
                  { n: STATS.policies, l: 'Policies' },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Newsreader',serif", fontSize: 24, fontWeight: 300, color: C.orange }}>{s.n}</div>
                    <div style={{ fontSize: 10, color: C.lt, textTransform: 'uppercase', letterSpacing: '.1em' }}>{s.l}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 48, paddingTop: 24, borderTop: `1px solid ${C.bdr}` }}>
                <div style={{ fontSize: 10, color: C.lt }}>The Community Exchange -- a product of The Change Engine</div>
              </div>
            </div>
          )}

          {/* STATE B: Pathway selected, no ring */}
          {pw && !activeRing && !searchResults && (
            <div style={{ animation: 'up .4s cubic-bezier(.22,1,.36,1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" fill="none" stroke={pw.color} strokeWidth="2.5" opacity=".6" />
                  <circle cx="12" cy="12" r="4" fill={pw.color} opacity=".2" />
                </svg>
                <h2 style={{ fontFamily: "'Newsreader',serif", fontSize: 24, fontWeight: 600, color: pw.color }}>{pw.name}</h2>
              </div>
              <p style={{ fontFamily: "'Newsreader',serif", fontStyle: 'italic', color: C.mid, fontSize: 16, marginBottom: 24 }}>{pw.sub}</p>

              {/* Ring summary rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 32 }}>
                {RING_CONFIG.map(ring => {
                  const count = getRingCount(pw, ring.key)
                  return (
                    <div
                      key={ring.key}
                      onClick={() => handleRingClick(ring.key, sel!)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 16px', borderRadius: 8,
                        background: count > 0 ? C.white : C.card,
                        border: `1px solid ${C.bdr}`,
                        cursor: count > 0 ? 'pointer' : 'default',
                        opacity: count > 0 ? 1 : 0.5,
                        transition: 'all .15s',
                      }}
                      className={count > 0 ? 'ch' : undefined}
                    >
                      <span style={{ fontSize: 14, fontWeight: 600, color: C.txt }}>{ring.label}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 20, fontWeight: 300, fontFamily: "'Newsreader',serif", color: count > 0 ? pw.color : C.lt }}>{count}</span>
                        {count > 0 && <span style={{ fontSize: 14, color: C.lt }}>{'\u2192'}</span>}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Topics */}
              {pw.topics.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: C.lt, marginBottom: 8 }}>Topics</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {pw.topics.map(t => (
                      <span key={t} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 99, background: `${pw.color}10`, border: `1px solid ${pw.color}25`, color: pw.color, fontWeight: 600 }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Bridges */}
              {bridges.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: C.lt, marginBottom: 8 }}>Bridges</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {bridges.map((b, i) => (
                      <div key={i} onClick={() => pick(b.idx)} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 12px', borderRadius: 6, cursor: 'pointer',
                        background: `${b.color}08`, border: `1px solid ${b.color}18`,
                      }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: b.color }}>{pw.name} + {b.name}</span>
                        <span style={{ fontSize: 12, color: C.lt }}>{b.shared} shared</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STATE C: Ring + Pathway selected */}
          {pw && activeRing && !searchResults && (
            <div style={{ animation: 'up .4s cubic-bezier(.22,1,.36,1)' }}>
              <div style={{ marginBottom: 4 }}>
                <span onClick={() => setActiveRing(null)} style={{ fontSize: 12, color: C.tealLt, cursor: 'pointer', fontWeight: 600 }}>{'\u2190'} {pw.name}</span>
              </div>
              <h2 style={{ fontFamily: "'Newsreader',serif", fontSize: 20, fontWeight: 600, marginBottom: 4 }}>
                <span style={{ color: pw.color }}>{pw.name}</span>
                <span style={{ color: C.lt, fontWeight: 400 }}> {'\u2192'} </span>
                {RING_CONFIG.find(r => r.key === activeRing)?.label}
                <span style={{ color: C.lt, fontWeight: 300 }}> ({getRingCount(pw, activeRing)})</span>
              </h2>
              <div style={{ height: 2, background: `${pw.color}30`, borderRadius: 1, marginBottom: 16 }} />

              {/* Center filter pills (resources only) */}
              {activeRing === 'resources' && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                  <button onClick={() => setCenterFilter(null)} style={{
                    background: !centerFilter ? C.charcoal : '#fff', color: !centerFilter ? '#fff' : C.mid,
                    padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                    border: centerFilter ? `1px solid ${C.bdr}` : 'none', cursor: 'pointer',
                  }}>All</button>
                  {CENTERS.map(c => {
                    const cnt = pw.resources.filter(r => r.center === c.key).length
                    if (!cnt) return null
                    return (
                      <button key={c.key} onClick={() => setCenterFilter(centerFilter === c.key ? null : c.key)} style={{
                        background: centerFilter === c.key ? c.color : '#fff',
                        color: centerFilter === c.key ? '#fff' : c.color,
                        padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                        border: `1px solid ${centerFilter === c.key ? c.color : c.color + '30'}`, cursor: 'pointer',
                      }}>{c.key} ({cnt})</button>
                    )
                  })}
                </div>
              )}

              {/* Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {activeRing === 'resources' && (() => {
                  const items = centerFilter ? pw.resources.filter(r => r.center === centerFilter) : pw.resources
                  return items.length > 0 ? items.map((r, i) => (
                    <RingCard key={i} title={r.title} subtitle={r.summary} meta={`${r.center} · ${r.org}`} accentColor={pw.color} onClick={() => openPanel('resource', r)} />
                  )) : <EmptyState label="resources" />
                })()}

                {activeRing === 'guides' && (() => {
                  return pw.guides.length > 0 ? pw.guides.map((g, i) => (
                    <RingCard key={i} title={g.title} subtitle={g.description} accentColor={pw.color} onClick={() => openPanel('guide', g)} />
                  )) : <EmptyState label="guides" />
                })()}

                {activeRing === 'services' && (() => {
                  return pw.services.length > 0 ? pw.services.map((s, i) => (
                    <RingCard key={i} title={s.name} subtitle={s.org} meta={[s.phone, s.address].filter(Boolean).join(' · ')} accentColor={pw.color} onClick={() => openPanel('service', s)} />
                  )) : <EmptyState label="211 services" />
                })()}

                {activeRing === 'officials' && (() => {
                  return pw.officials.length > 0 ? pw.officials.map((o, i) => (
                    <div key={i} onClick={() => openPanel('official', o)} className="ch" style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      background: C.white, border: `1px solid ${C.bdr}`, borderLeft: `3px solid ${lvlColor(o.level)}`,
                      borderRadius: 8, padding: 16, cursor: 'pointer', transition: 'all .15s',
                    }}>
                      <InitialsCircle name={o.name} color={lvlColor(o.level)} size={40} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: C.charcoal }}>{o.name}</div>
                        <div style={{ fontSize: 12, color: C.mid }}>{o.role}</div>
                        <div style={{ fontSize: 10, color: C.lt }}>{o.level} {'\u00b7'} {o.jur}</div>
                      </div>
                    </div>
                  )) : <EmptyState label="officials" />
                })()}

                {activeRing === 'policies' && (() => {
                  return pw.policies.length > 0 ? pw.policies.map((p, i) => (
                    <RingCard key={i} title={p.name} subtitle={p.plain || p.desc} meta={`${p.status} · ${p.level} · ${p.body}`} accentColor={stColor(p.status)} onClick={() => openPanel('policy', p)} />
                  )) : <EmptyState label="policies" />
                })()}
              </div>
            </div>
          )}

          {/* SEARCH RESULTS */}
          {searchResults && (
            <div style={{ animation: 'up .35s ease' }}>
              <div style={{ marginBottom: 4 }}>
                <span onClick={goHome} style={{ fontSize: 12, color: C.tealLt, cursor: 'pointer', fontWeight: 600 }}>{'\u2190'} Home</span>
              </div>
              <h2 style={{ fontFamily: "'Newsreader',serif", fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Search Results</h2>
              <div style={{ fontSize: 12, color: C.lt, marginBottom: 16 }}>Results for: <em style={{ color: C.teal }}>{searchVal}</em></div>
              {searchLoading && <div style={{ textAlign: 'center', padding: 24, color: C.lt, fontSize: 12 }}>Searching...</div>}
              {!searchLoading && <SearchResultsView results={searchResults} openPanel={openPanel} PW={PW} />}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Empty state ──
function EmptyState({ label }: { label: string }) {
  return (
    <div style={{ padding: 32, textAlign: 'center', color: C.lt, fontSize: 14 }}>
      <div style={{ fontFamily: "'Newsreader',serif", fontStyle: 'italic', marginBottom: 4 }}>Coming soon</div>
      <div style={{ fontSize: 12 }}>No {label} mapped to this pathway yet.</div>
    </div>
  )
}

// ── Search Results View ──
function SearchResultsView({ results, openPanel, PW }: { results: any; openPanel: (type: string, data: any, pwIdx?: number) => void; PW: CirclePathway[] }) {
  const hasContent = results?.content?.length > 0
  const hasOfficials = results?.officials?.length > 0
  const hasPolicies = results?.policies?.length > 0
  const hasServices = results?.services?.length > 0
  const total = (results?.content?.length || 0) + (results?.officials?.length || 0) + (results?.policies?.length || 0) + (results?.services?.length || 0)

  if (total === 0) return <div style={{ padding: 24, textAlign: 'center', color: C.lt, fontSize: 12 }}>No results found. Try a different search term.</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 12, color: C.lt }}>{total} results found</div>
      {hasContent && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.orange, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8 }}>Resources ({results.content.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {results.content.slice(0, 10).map((c: any) => {
              const matchPw = PW.find(p => p.key === c.pathway_primary)
              return (
                <RingCard key={c.id} title={c.title_6th_grade || c.title || ''} subtitle={c.summary_6th_grade ? c.summary_6th_grade.slice(0, 120) : ''} meta={matchPw?.name} accentColor={matchPw?.color || C.orange}
                  onClick={() => openPanel('resource', { id: c.id, title: c.title_6th_grade, center: c.center, summary: c.summary_6th_grade, source_url: c.source_url })} />
              )
            })}
          </div>
        </div>
      )}
      {hasOfficials && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.teal, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8 }}>Officials ({results.officials.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {results.officials.slice(0, 8).map((o: any) => (
              <RingCard key={o.official_id} title={o.official_name} subtitle={`${o.title || ''} · ${o.level || ''}`} accentColor={lvlColor(o.level)}
                onClick={() => openPanel('official', { id: o.official_id, name: o.official_name, role: o.title || '', level: o.level || '', phone: o.office_phone || '', website: o.website })} />
            ))}
          </div>
        </div>
      )}
      {hasPolicies && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#8B7D3C', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8 }}>Policies ({results.policies.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {results.policies.slice(0, 6).map((p: any) => (
              <RingCard key={p.policy_id} title={p.policy_name || p.bill_number || ''} subtitle={p.summary_5th_grade ? p.summary_5th_grade.slice(0, 120) : ''} meta={`${p.status || ''} · ${p.level || ''}`} accentColor={stColor(p.status)}
                onClick={() => openPanel('policy', { id: p.policy_id, name: p.policy_name || p.bill_number || '', status: p.status || '', level: p.level || '', desc: p.summary_5th_grade || '' })} />
            ))}
          </div>
        </div>
      )}
      {hasServices && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.tealLt, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8 }}>Services ({results.services.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {results.services.slice(0, 6).map((s: any, i: number) => (
              <RingCard key={i} title={s.service_name} subtitle={s.org_name || ''} meta={s.phone || ''} accentColor={C.tealLt} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
