'use client'

import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { usePanZoom } from '@/lib/hooks/usePanZoom'

// ═══════════════════════════════════════════════════════════════
// THE COMMUNITY EXCHANGE — Circle Knowledge Graph
// Front page: 7 overlapping pathway circles with bridges
// On select: circles reconfigure to show knowledge graph
// ═══════════════════════════════════════════════════════════════

const C = {
  cream: '#EDEAE3', card: '#F5F2EC', white: '#FAFAF7',
  charcoal: '#2D2D2D', txt: '#3A3632', mid: '#6B6560',
  lt: '#9A9080', lt2: '#B5AFA5', bdr: '#DAD5CC', rule: '#C5BFB5',
  orange: '#C65D28', teal: '#3D5A5A', tealLt: '#5B8A8A',
}

// ── 7 Pathways with knowledge graph data ──
const PW = [
  { id: 0, name: 'Health', color: '#D4654A', sub: 'Wellness, healing, and care',
    count: 26, focus: 45,
    topics: ['Mental health', 'Nutrition', 'Clinics', 'Insurance'],
    centers: { Learning: 8, Resource: 18, Action: 3, Responsible: 1 } as Record<string, number>,
    sdoh: [{ name: 'Healthcare', pct: 72 }, { name: 'Social', pct: 45 }, { name: 'Economic', pct: 20 }],
    sdgs: [{ id: 3, name: 'Good Health', n: 18 }, { id: 2, name: 'Zero Hunger', n: 9 }, { id: 10, name: 'Reduced Inequalities', n: 5 }],
    bridgeTo: [1, 5, 6],
  },
  { id: 1, name: 'Families', color: '#C4943C', sub: 'Education, safety, strong foundations',
    count: 21, focus: 44,
    topics: ['Schools', 'Childcare', 'Youth programs', 'Safety'],
    centers: { Learning: 15, Resource: 26, Action: 5, Responsible: 2 } as Record<string, number>,
    sdoh: [{ name: 'Education', pct: 68 }, { name: 'Social', pct: 52 }, { name: 'Economic', pct: 30 }],
    sdgs: [{ id: 4, name: 'Quality Education', n: 22 }, { id: 1, name: 'No Poverty', n: 8 }, { id: 5, name: 'Gender Equality', n: 4 }],
    bridgeTo: [0, 2, 4, 6],
  },
  { id: 2, name: 'Neighborhood', color: '#7B6BA8', sub: 'Housing, safety, places we share',
    count: 21, focus: 45,
    topics: ['Housing', 'Parks', 'Libraries', 'Safety'],
    centers: { Learning: 18, Resource: 17, Action: 7, Responsible: 2 } as Record<string, number>,
    sdoh: [{ name: 'Neighborhood', pct: 85 }, { name: 'Social', pct: 38 }, { name: 'Economic', pct: 28 }],
    sdgs: [{ id: 11, name: 'Sustainable Cities', n: 28 }, { id: 16, name: 'Peace & Justice', n: 12 }, { id: 1, name: 'No Poverty', n: 6 }],
    bridgeTo: [1, 3, 5],
  },
  { id: 3, name: 'Voice', color: '#3D7A7A', sub: 'Civic power, voting, participation',
    count: 75, focus: 45,
    topics: ['Voting', 'Advocacy', 'Town halls', 'Organizing'],
    centers: { Learning: 26, Resource: 8, Action: 8, Responsible: 2 } as Record<string, number>,
    sdoh: [{ name: 'Social', pct: 62 }, { name: 'Neighborhood', pct: 35 }, { name: 'Education', pct: 25 }],
    sdgs: [{ id: 16, name: 'Peace & Justice', n: 42 }, { id: 10, name: 'Reduced Inequalities', n: 15 }, { id: 17, name: 'Partnerships', n: 5 }],
    bridgeTo: [2, 4, 6],
  },
  { id: 4, name: 'Money', color: '#4A7A8A', sub: 'Jobs, financial health, opportunity',
    count: 22, focus: 44,
    topics: ['Jobs', 'Benefits', 'Credit', 'Small business'],
    centers: { Learning: 10, Resource: 4, Action: 2, Responsible: 0 } as Record<string, number>,
    sdoh: [{ name: 'Economic', pct: 90 }, { name: 'Education', pct: 40 }, { name: 'Social', pct: 18 }],
    sdgs: [{ id: 8, name: 'Decent Work', n: 14 }, { id: 1, name: 'No Poverty', n: 10 }, { id: 4, name: 'Quality Education', n: 5 }],
    bridgeTo: [1, 3],
  },
  { id: 5, name: 'Planet', color: '#5A8E5A', sub: 'Climate, environment, sustainability',
    count: 14, focus: 45,
    topics: ['Climate', 'Air quality', 'Flooding', 'Energy'],
    centers: { Learning: 4, Resource: 3, Action: 2, Responsible: 1 } as Record<string, number>,
    sdoh: [{ name: 'Neighborhood', pct: 70 }, { name: 'Healthcare', pct: 30 }, { name: 'Social', pct: 20 }],
    sdgs: [{ id: 13, name: 'Climate Action', n: 6 }, { id: 11, name: 'Sustainable Cities', n: 12 }, { id: 15, name: 'Life on Land', n: 5 }],
    bridgeTo: [0, 2, 6],
  },
  { id: 6, name: 'The Bigger We', color: '#8B6BA8', sub: 'Bridging difference, building together',
    count: 128, focus: 44, isCenter: true,
    topics: ['Bridging', 'Dialogue', 'Inclusion', 'Trust'],
    centers: { Learning: 5, Resource: 2, Action: 1, Responsible: 0 } as Record<string, number>,
    sdoh: [{ name: 'Social', pct: 88 }, { name: 'Education', pct: 35 }, { name: 'Neighborhood', pct: 22 }],
    sdgs: [{ id: 16, name: 'Peace & Justice', n: 20 }, { id: 17, name: 'Partnerships', n: 5 }, { id: 10, name: 'Reduced Inequalities', n: 8 }],
    bridgeTo: [0, 1, 3, 5],
  },
]

const BRIDGES: [number, number, number][] = [
  [0, 1, 12], [1, 2, 15], [2, 3, 8], [3, 6, 10],
  [0, 5, 5], [4, 1, 9], [2, 5, 7], [4, 3, 6],
  [0, 6, 4], [1, 6, 7], [5, 6, 5],
]

const CENTER_META = [
  { key: 'Learning', color: '#4C9F38', q: 'How can I understand?' },
  { key: 'Action', color: '#DD1367', q: 'How can I help?' },
  { key: 'Resource', color: '#26BDE2', q: "What's available to me?" },
  { key: 'Responsible', color: '#8B6BA8', q: 'Who makes decisions?' },
]

// ── Info Pane types ──
type NodeInfo =
  | { type: 'pathway'; idx: number }
  | { type: 'center'; key: string; count: number; question: string; color: string; pathwayName: string }
  | { type: 'bridge'; idx: number; shared: number }
  | { type: 'topic'; name: string; pathwayName: string; pathwayColor: string }
  | { type: 'sdoh'; name: string; pct: number; pathwayName: string; pathwayColor: string }
  | { type: 'sdg'; id: number; name: string; n: number; pathwayColor: string }

// ── Bottom Sheet Info Pane ──
function InfoPane({ info, onClose }: { info: NodeInfo; onClose: () => void }) {
  let title = ''
  let subtitle = ''
  let color = C.orange
  let details: { label: string; value: string }[] = []

  switch (info.type) {
    case 'pathway': {
      const pw = PW[info.idx]
      title = pw.name
      subtitle = pw.sub
      color = pw.color
      details = [
        { label: 'Resources', value: String(pw.count) },
        { label: 'Focus Areas', value: String(pw.focus) },
        { label: 'Topics', value: pw.topics.join(', ') },
        { label: 'Bridges to', value: pw.bridgeTo.map(i => PW[i].name).join(', ') },
      ]
      break
    }
    case 'center':
      title = info.key
      subtitle = info.question
      color = info.color
      details = [
        { label: 'Count', value: String(info.count) },
        { label: 'Pathway', value: info.pathwayName },
      ]
      break
    case 'bridge': {
      const bpw = PW[info.idx]
      title = bpw.name
      subtitle = bpw.sub
      color = bpw.color
      details = [
        { label: 'Shared Focus Areas', value: String(info.shared) },
        { label: 'Resources', value: String(bpw.count) },
        { label: 'Topics', value: bpw.topics.join(', ') },
      ]
      break
    }
    case 'topic':
      title = info.name
      subtitle = `Topic within ${info.pathwayName}`
      color = info.pathwayColor
      break
    case 'sdoh':
      title = info.name
      subtitle = 'Social Determinant of Health'
      color = info.pathwayColor
      details = [
        { label: 'Relevance', value: `${info.pct}% of ${info.pathwayName}` },
      ]
      break
    case 'sdg':
      title = `${info.id}. ${info.name}`
      subtitle = 'UN Sustainable Development Goal'
      color = info.pathwayColor
      details = [
        { label: 'Connected Resources', value: String(info.n) },
      ]
      break
  }

  return (
    <div style={{
      position: 'relative',
      background: C.white, borderTop: `3px solid ${color}`,
      borderRadius: '12px 12px 0 0', padding: '16px 20px 20px',
      boxShadow: '0 -4px 24px rgba(0,0,0,.08)',
      animation: 'sheetUp .3s cubic-bezier(.22,1,.36,1) both',
      fontFamily: "'DM Sans',sans-serif",
    }}>
      {/* Drag handle */}
      <div style={{
        width: 32, height: 3, borderRadius: 2, background: C.bdr,
        margin: '0 auto 12px', opacity: .6,
      }} />
      {/* Close button */}
      <button onClick={onClose} style={{
        position: 'absolute', top: 12, right: 16,
        width: 28, height: 28, borderRadius: '50%',
        border: `1px solid ${C.bdr}`, background: C.cream,
        fontSize: 14, color: C.mid, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>&times;</button>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, opacity: .7 }} />
        <span style={{
          fontFamily: 'Georgia,serif', fontSize: 18, fontWeight: 700, color: C.charcoal,
        }}>{title}</span>
      </div>
      {subtitle && (
        <div style={{
          fontFamily: 'Georgia,serif', fontStyle: 'italic', fontSize: 12,
          color: C.mid, marginBottom: details.length ? 12 : 0, paddingLeft: 18,
        }}>{subtitle}</div>
      )}
      {/* Details grid */}
      {details.length > 0 && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 16px',
          paddingLeft: 18,
        }}>
          {details.map(d => (
            <div key={d.label} style={{ display: 'contents' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: C.lt, textTransform: 'uppercase', letterSpacing: '.08em' }}>{d.label}</span>
              <span style={{ fontSize: 12, color: C.txt }}>{d.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Circle Geometry ──
const VBW = 700, VBH = 520
const CX = VBW / 2, CY = 250
const ORBIT = 160, CR = 80, CTR_R = 70

const homePos = (() => {
  const p: { x: number; y: number }[] = []
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 2
    p.push({ x: CX + ORBIT * Math.cos(a), y: CY + ORBIT * Math.sin(a) })
  }
  p.push({ x: CX, y: CY }) // The Bigger We at center
  return p
})()

// ── Node types for selected layout ──
type LayoutNode =
  | { type: 'pathway'; idx: number; x: number; y: number; r: number }
  | { type: 'center'; key: string; count: number; x: number; y: number; r: number }
  | { type: 'bridge'; idx: number; x: number; y: number; r: number }
  | { type: 'sdoh'; name: string; pct: number; x: number; y: number; r: number }
  | { type: 'sdg'; id: number; name: string; n: number; x: number; y: number; r: number }
  | { type: 'topic'; name: string; x: number; y: number; r: number }

// ── When a pathway is selected, compute positions for its sub-graph ──
function getSelectedLayout(selIdx: number): LayoutNode[] {
  const pw = PW[selIdx]
  const nodes: LayoutNode[] = []

  // Selected pathway large in center-left
  nodes.push({ type: 'pathway', idx: selIdx, x: CX - 60, y: CY, r: 90 })

  // 4 Centers orbit the selected pathway
  const centerKeys = Object.keys(pw.centers).filter(k => pw.centers[k] > 0)
  centerKeys.forEach((key, i) => {
    const a = (i / centerKeys.length) * Math.PI * 2 - Math.PI / 2
    const dist = 165
    nodes.push({
      type: 'center', key, count: pw.centers[key],
      x: CX - 60 + Math.cos(a) * dist,
      y: CY + Math.sin(a) * dist,
      r: 18 + pw.centers[key] * 1.2,
    })
  })

  // Bridging pathways on the right side
  pw.bridgeTo.forEach((bIdx, i) => {
    const a = -Math.PI / 3 + (i / Math.max(pw.bridgeTo.length - 1, 1)) * (2 * Math.PI / 3)
    nodes.push({
      type: 'bridge', idx: bIdx,
      x: CX + 200 + Math.cos(a) * 80,
      y: CY + Math.sin(a) * 100,
      r: 32,
    })
  })

  // SDOH dots in lower left
  pw.sdoh.forEach((s, i) => {
    nodes.push({
      type: 'sdoh', ...s,
      x: 85 + i * 70, y: CY + 170,
      r: 8 + s.pct * 0.18,
    })
  })

  // SDG dots across top
  pw.sdgs.forEach((s, i) => {
    nodes.push({
      type: 'sdg', ...s,
      x: 120 + i * 110, y: 50,
      r: 10 + s.n * 0.6,
    })
  })

  // Topics as small circles
  pw.topics.forEach((t, i) => {
    nodes.push({
      type: 'topic', name: t,
      x: CX - 60 + Math.cos(Math.PI / 2 + (i / pw.topics.length) * Math.PI) * 115,
      y: CY + Math.sin(Math.PI / 2 + (i / pw.topics.length) * Math.PI) * 115,
      r: 20,
    })
  })

  return nodes
}

// ── Circle Accent SVG ──
function CA({ color = C.orange, s = 20 }: { color?: string; s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
      <circle cx="10" cy="10" r="7" fill="none" stroke={color} strokeWidth="1.2" opacity=".4" />
      <circle cx="7" cy="8" r="4" fill="none" stroke={color} strokeWidth=".7" opacity=".25" />
      <circle cx="13" cy="12" r="3.5" fill="none" stroke={color} strokeWidth=".7" opacity=".25" />
    </svg>
  )
}

// ═══════════════════════════════════════
// HOME CIRCLES
// ═══════════════════════════════════════
const HomeCircles = memo(function HomeCirclesInner({ onSelect, hov, setHov, ready, pw: pwOverride }: {
  onSelect: (i: number) => void
  hov: number | null
  setHov: (i: number | null) => void
  ready: boolean
  pw?: typeof PW
}) {
  const pw = pwOverride || PW
  const arc = (a: number, b: number) => {
    const p1 = homePos[a], p2 = homePos[b]
    const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2
    const dx = p2.x - p1.x, dy = p2.y - p1.y
    const len = Math.sqrt(dx * dx + dy * dy) || 1
    const off = 22
    return {
      d: `M${p1.x},${p1.y} Q${mx + (-dy / len) * off},${my + (dx / len) * off} ${p2.x},${p2.y}`,
      mx: mx + (-dy / len) * off, my: my + (dx / len) * off,
    }
  }

  return (
    <svg viewBox={`0 0 ${VBW} ${VBH}`}
      style={{ width: '100%', maxHeight: 380, overflow: 'visible' }}
      preserveAspectRatio="xMidYMid meet">
      {/* Bridge arcs */}
      {BRIDGES.map((b, i) => {
        const [i1, i2, cnt] = b
        const { d, mx, my } = arc(i1, i2)
        const isHov = hov !== null && (i1 === hov || i2 === hov)
        return (
          <g key={`b${i}`} opacity={isHov ? 0.6 : 0.14}
            style={{ transition: 'opacity .4s' }}>
            <path d={d} fill="none" stroke={isHov ? pw[hov].color : '#B5AFA5'}
              strokeWidth={isHov ? 2.5 : 1.3} strokeDasharray={isHov ? 'none' : '7,5'}
              style={ready ? { strokeDashoffset: 0, animation: `drawL .9s ease ${.15 + i * .05}s both` } : {}} />
            <g style={ready ? { animation: `fin .5s ease ${.4 + i * .05}s both` } : { opacity: 0 }}>
              <circle cx={mx} cy={my} r={isHov ? 13 : 10} fill={isHov ? pw[hov].color : C.cream}
                stroke={isHov ? 'none' : C.rule} strokeWidth={.7} />
              <text x={mx} y={my + .5} textAnchor="middle" dominantBaseline="middle"
                fill={isHov ? '#fff' : '#8A8578'} fontSize={isHov ? 9 : 8} fontWeight="700"
                style={{ fontFamily: "'DM Sans',sans-serif", pointerEvents: 'none' }}>{cnt}</text>
            </g>
          </g>
        )
      })}

      {/* Pathway circles */}
      {pw.map((p, i) => {
        const { x, y } = homePos[i]
        const isHov = hov === i
        const base = p.isCenter ? CTR_R : CR
        const r = isHov ? base + 6 : base
        return (
          <g key={p.name} style={{ cursor: 'pointer' }}
            onClick={() => onSelect(i)}
            onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}>
            {isHov && <circle cx={x} cy={y} r={r + 18} fill={p.color} opacity={.06}
              style={{ transition: 'opacity .2s' }} />}
            <circle cx={x} cy={y} r={r} fill="none" stroke={p.color}
              strokeWidth={isHov ? 3.2 : 2.2} opacity={isHov ? 1 : .45}
              style={{
                transition: 'stroke-width .25s, opacity .25s',
                ...(ready ? { strokeDasharray: 600, animation: `draw .9s ease ${i * .1}s both` } : {}),
              }} />
            <circle cx={x} cy={y} r={r * .52} fill="none" stroke={p.color}
              strokeWidth={.7} opacity={isHov ? .25 : .08} />
            <text x={x} y={y - 6} textAnchor="middle" dominantBaseline="middle"
              fill={isHov ? p.color : C.txt}
              fontSize={isHov ? 18 : 16} fontWeight={isHov ? 700 : 600}
              style={{ fontFamily: "'DM Sans',sans-serif", transition: 'fill .2s, font-size .2s', pointerEvents: 'none' }}>
              {p.name}
            </text>
            <text x={x} y={y + 13} textAnchor="middle" dominantBaseline="middle"
              fill={isHov ? p.color : '#8A8578'} fontSize="11" fontWeight="400" opacity={isHov ? .7 : .5}
              style={{ fontFamily: 'Georgia,serif', fontStyle: 'italic', pointerEvents: 'none' }}>
              {p.count} resources
            </text>
            {isHov && (
              <text x={x} y={y + 28} textAnchor="middle" fill={p.color} fontSize="10" opacity=".5"
                style={{ fontFamily: 'Georgia,serif', fontStyle: 'italic', pointerEvents: 'none',
                  animation: 'fin .12s ease' }}>
                {p.sub}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
})

// ═══════════════════════════════════════
// SELECTED PATHWAY — Knowledge Graph Reconfiguration
// ═══════════════════════════════════════
const SelectedCircles = memo(function SelectedCirclesInner({ selIdx, onBack, onSwitch, ready, onNodeClick }: {
  selIdx: number
  onBack: () => void
  onSwitch: (i: number) => void
  ready: boolean
  onNodeClick?: (info: NodeInfo) => void
}) {
  const [hov, setHov] = useState<string | null>(null)
  const pw = PW[selIdx]
  const nodes = useMemo(() => getSelectedLayout(selIdx), [selIdx])
  const main = nodes[0] as LayoutNode & { type: 'pathway' }

  return (
    <svg viewBox={`0 0 ${VBW} ${VBH + 100}`}
      style={{ width: '100%', maxHeight: 420, overflow: 'visible' }}
      preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="selGlow">
          <stop offset="0%" stopColor={pw.color} stopOpacity=".08" />
          <stop offset="100%" stopColor={pw.color} stopOpacity="0" />
        </radialGradient>
        <filter id="softGlow">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Ambient glow behind main */}
      <circle cx={main.x} cy={main.y} r={180} fill="url(#selGlow)" />

      {/* Connecting lines from main to centers */}
      {nodes.filter((n): n is LayoutNode & { type: 'center' } => n.type === 'center').map((n, i) => (
        <line key={`mc${i}`} x1={main.x} y1={main.y} x2={n.x} y2={n.y}
          stroke={CENTER_META.find(c => c.key === n.key)?.color || '#999'}
          strokeWidth={1.2} opacity={.2} strokeDasharray="4,4"
          style={{ animation: `fin .6s ease ${.2 + i * .1}s both` }} />
      ))}

      {/* Lines from main to topics */}
      {nodes.filter((n): n is LayoutNode & { type: 'topic' } => n.type === 'topic').map((n, i) => (
        <line key={`mt${i}`} x1={main.x} y1={main.y} x2={n.x} y2={n.y}
          stroke={pw.color} strokeWidth={.8} opacity={.12} strokeDasharray="2,3"
          style={{ animation: `fin .5s ease ${.3 + i * .08}s both` }} />
      ))}

      {/* Bridge lines from main to bridge pathways */}
      {nodes.filter((n): n is LayoutNode & { type: 'bridge' } => n.type === 'bridge').map((n, i) => {
        const bpw = PW[n.idx]
        const shared = BRIDGES.find(b =>
          (b[0] === selIdx && b[1] === n.idx) || (b[1] === selIdx && b[0] === n.idx)
        )
        const mx = (main.x + n.x) / 2, my = (main.y + n.y) / 2
        const dx = n.x - main.x, dy = n.y - main.y
        const len = Math.sqrt(dx * dx + dy * dy) || 1
        const off = 20
        const qx = mx + (-dy / len) * off, qy = my + (dx / len) * off
        return (
          <g key={`bl${i}`} style={{ animation: `fin .6s ease ${.3 + i * .1}s both` }}>
            <path d={`M${main.x},${main.y} Q${qx},${qy} ${n.x},${n.y}`}
              fill="none" stroke={bpw.color} strokeWidth={1.5} opacity={.3}
              strokeDasharray="6,4" />
            {shared && (
              <g>
                <circle cx={qx} cy={qy} r={12} fill={bpw.color} opacity={.7} />
                <text x={qx} y={qy + 1} textAnchor="middle" dominantBaseline="middle"
                  fill="#fff" fontSize="8" fontWeight="700"
                  style={{ fontFamily: "'DM Sans',sans-serif" }}>{shared[2]}</text>
              </g>
            )}
          </g>
        )
      })}

      {/* ── MAIN PATHWAY CIRCLE ── */}
      <g style={{ cursor: 'pointer', animation: 'scaleIn .5s cubic-bezier(.22,1,.36,1) both' }}
        onClick={onBack}>
        <circle cx={main.x} cy={main.y} r={main.r + 12} fill={pw.color} opacity={.06} />
        <circle cx={main.x} cy={main.y} r={main.r} fill="none" stroke={pw.color}
          strokeWidth={3.5} filter="url(#softGlow)" />
        <circle cx={main.x} cy={main.y} r={main.r * .55} fill="none" stroke={pw.color}
          strokeWidth={.8} opacity={.2} />
        <text x={main.x} y={main.y - 14} textAnchor="middle" dominantBaseline="middle"
          fill={pw.color} fontSize="22" fontWeight="700"
          style={{ fontFamily: "'DM Sans',sans-serif" }}>{pw.name}</text>
        <text x={main.x} y={main.y + 6} textAnchor="middle" dominantBaseline="middle"
          fill={C.mid} fontSize="11"
          style={{ fontFamily: 'Georgia,serif', fontStyle: 'italic' }}>{pw.count} resources</text>
        <text x={main.x} y={main.y + 22} textAnchor="middle" dominantBaseline="middle"
          fill={C.lt} fontSize="9"
          style={{ fontFamily: "'DM Sans',sans-serif" }}>{pw.focus} focus areas</text>
      </g>

      {/* ── CENTER CIRCLES ── */}
      {nodes.filter((n): n is LayoutNode & { type: 'center' } => n.type === 'center').map((n, i) => {
        const meta = CENTER_META.find(c => c.key === n.key)
        const isH = hov === `center-${n.key}`
        return (
          <g key={`c${i}`}
            style={{ cursor: 'pointer', animation: `popIn .4s cubic-bezier(.22,1,.36,1) ${.15 + i * .08}s both` }}
            onClick={() => onNodeClick?.({ type: 'center', key: n.key, count: n.count, question: meta?.q || '', color: meta?.color || '#999', pathwayName: pw.name })}
            onMouseEnter={() => setHov(`center-${n.key}`)} onMouseLeave={() => setHov(null)}>
            {isH && <circle cx={n.x} cy={n.y} r={n.r + 10} fill={meta?.color} opacity={.08} />}
            <circle cx={n.x} cy={n.y} r={n.r} fill="none"
              stroke={meta?.color || '#999'} strokeWidth={isH ? 2.5 : 1.8}
              opacity={isH ? 1 : .6} style={{ transition: 'stroke-width .2s, opacity .2s' }} />
            <text x={n.x} y={n.y - 5} textAnchor="middle" dominantBaseline="middle"
              fill={meta?.color || C.txt} fontSize="11" fontWeight="700"
              style={{ fontFamily: "'DM Sans',sans-serif", pointerEvents: 'none' }}>
              {n.key}
            </text>
            <text x={n.x} y={n.y + 9} textAnchor="middle" dominantBaseline="middle"
              fill={C.mid} fontSize="14" fontWeight="800"
              style={{ fontFamily: "'DM Sans',sans-serif", pointerEvents: 'none' }}>
              {n.count}
            </text>
          </g>
        )
      })}

      {/* ── BRIDGE PATHWAY CIRCLES ── */}
      {nodes.filter((n): n is LayoutNode & { type: 'bridge' } => n.type === 'bridge').map((n, i) => {
        const bpw = PW[n.idx]
        const isH = hov === `bridge-${n.idx}`
        const shared = BRIDGES.find(b =>
          (b[0] === selIdx && b[1] === n.idx) || (b[1] === selIdx && b[0] === n.idx)
        )
        return (
          <g key={`br${i}`}
            style={{ cursor: 'pointer', animation: `popIn .4s cubic-bezier(.22,1,.36,1) ${.25 + i * .08}s both` }}
            onClick={() => onNodeClick?.({ type: 'bridge', idx: n.idx, shared: shared?.[2] || 0 })}
            onMouseEnter={() => setHov(`bridge-${n.idx}`)} onMouseLeave={() => setHov(null)}>
            {isH && <circle cx={n.x} cy={n.y} r={n.r + 8} fill={bpw.color} opacity={.1} />}
            <circle cx={n.x} cy={n.y} r={n.r} fill="none"
              stroke={bpw.color} strokeWidth={isH ? 2.5 : 1.5}
              opacity={isH ? .9 : .45} style={{ transition: 'stroke-width .2s, opacity .2s' }} />
            <text x={n.x} y={n.y - 2} textAnchor="middle" dominantBaseline="middle"
              fill={isH ? bpw.color : C.txt} fontSize="11" fontWeight="600"
              style={{ fontFamily: "'DM Sans',sans-serif", pointerEvents: 'none' }}>
              {bpw.name}
            </text>
            <text x={n.x} y={n.y + 12} textAnchor="middle" dominantBaseline="middle"
              fill={C.lt} fontSize="9"
              style={{ fontFamily: 'Georgia,serif', fontStyle: 'italic', pointerEvents: 'none' }}>
              {bpw.count}
            </text>
          </g>
        )
      })}

      {/* ── TOPIC CIRCLES ── */}
      {nodes.filter((n): n is LayoutNode & { type: 'topic' } => n.type === 'topic').map((n, i) => {
        const isH = hov === `topic-${n.name}`
        return (
          <g key={`t${i}`}
            style={{ cursor: 'pointer', animation: `popIn .35s cubic-bezier(.22,1,.36,1) ${.3 + i * .06}s both` }}
            onClick={() => onNodeClick?.({ type: 'topic', name: n.name, pathwayName: pw.name, pathwayColor: pw.color })}
            onMouseEnter={() => setHov(`topic-${n.name}`)} onMouseLeave={() => setHov(null)}>
            <circle cx={n.x} cy={n.y} r={n.r} fill={pw.color}
              opacity={isH ? .15 : .06} style={{ transition: 'opacity .2s' }} />
            <circle cx={n.x} cy={n.y} r={n.r} fill="none"
              stroke={pw.color} strokeWidth={isH ? 1.5 : .8}
              opacity={isH ? .7 : .3} strokeDasharray="3,2" />
            <text x={n.x} y={n.y + 1} textAnchor="middle" dominantBaseline="middle"
              fill={isH ? pw.color : C.mid} fontSize="9" fontWeight="600"
              style={{ fontFamily: "'DM Sans',sans-serif", pointerEvents: 'none' }}>
              {n.name}
            </text>
          </g>
        )
      })}

      {/* ── SDOH DOTS ── */}
      <text x={85} y={CY + 135} fill={C.lt} fontSize="8" fontWeight="700"
        letterSpacing=".12em" style={{ textTransform: 'uppercase', fontFamily: "'DM Sans',sans-serif",
          animation: 'fin .5s ease .4s both' }}>
        Social Determinants
      </text>
      {nodes.filter((n): n is LayoutNode & { type: 'sdoh' } => n.type === 'sdoh').map((n, i) => (
        <g key={`sd${i}`} style={{ cursor: 'pointer', animation: `popIn .35s ease ${.45 + i * .08}s both` }}
          onClick={() => onNodeClick?.({ type: 'sdoh', name: n.name, pct: n.pct, pathwayName: pw.name, pathwayColor: pw.color })}>
          <circle cx={n.x} cy={n.y} r={n.r} fill={pw.color} opacity={.12} />
          <circle cx={n.x} cy={n.y} r={n.r} fill="none" stroke={pw.color}
            strokeWidth={1} opacity={.4} />
          <text x={n.x} y={n.y - 1} textAnchor="middle" dominantBaseline="middle"
            fill={pw.color} fontSize="10" fontWeight="800"
            style={{ fontFamily: "'DM Sans',sans-serif", pointerEvents: 'none' }}>
            {n.pct}%
          </text>
          <text x={n.x} y={n.y + 22} textAnchor="middle" fill={C.mid}
            fontSize="9" fontWeight="500"
            style={{ fontFamily: "'DM Sans',sans-serif" }}>
            {n.name}
          </text>
        </g>
      ))}

      {/* ── SDG DOTS ── */}
      <text x={120} y={28} fill={C.lt} fontSize="8" fontWeight="700"
        letterSpacing=".12em" style={{ textTransform: 'uppercase', fontFamily: "'DM Sans',sans-serif",
          animation: 'fin .5s ease .35s both' }}>
        UN Sustainable Development Goals
      </text>
      {nodes.filter((n): n is LayoutNode & { type: 'sdg' } => n.type === 'sdg').map((n, i) => {
        const isH = hov === `sdg-${n.id}`
        return (
          <g key={`sg${i}`}
            style={{ cursor: 'pointer', animation: `popIn .35s ease ${.4 + i * .08}s both` }}
            onClick={() => onNodeClick?.({ type: 'sdg', id: n.id, name: n.name, n: n.n, pathwayColor: pw.color })}
            onMouseEnter={() => setHov(`sdg-${n.id}`)} onMouseLeave={() => setHov(null)}>
            <circle cx={n.x} cy={n.y} r={n.r} fill={pw.color} opacity={isH ? .18 : .08} />
            <circle cx={n.x} cy={n.y} r={n.r} fill="none"
              stroke={pw.color} strokeWidth={isH ? 1.5 : .8} opacity={isH ? .6 : .3} />
            <text x={n.x} y={n.y - 1} textAnchor="middle" dominantBaseline="middle"
              fill={pw.color} fontSize="11" fontWeight="800"
              style={{ fontFamily: "'DM Sans',sans-serif", pointerEvents: 'none' }}>
              {n.n}
            </text>
            <text x={n.x} y={n.y + n.r + 12} textAnchor="middle"
              fill={isH ? pw.color : C.mid} fontSize="8" fontWeight="500"
              style={{ fontFamily: "'DM Sans',sans-serif" }}>
              {n.name}
            </text>
          </g>
        )
      })}

      {/* Back button */}
      <g style={{ cursor: 'pointer' }} onClick={onBack}>
        <rect x={12} y={12} width={80} height={26} rx={4}
          fill={C.cream} stroke={C.bdr} strokeWidth={1} />
        <text x={52} y={26} textAnchor="middle" dominantBaseline="middle"
          fill={C.teal} fontSize="11" fontWeight="600"
          style={{ fontFamily: "'DM Sans',sans-serif", pointerEvents: 'none' }}>
          All Circles
        </text>
      </g>

      {/* Label: Bridges */}
      <text x={CX + 200} y={CY - 130} textAnchor="middle" fill={C.lt}
        fontSize="8" fontWeight="700" letterSpacing=".12em"
        style={{ textTransform: 'uppercase', fontFamily: "'DM Sans',sans-serif",
          animation: 'fin .5s ease .3s both' }}>
        Bridging Pathways
      </text>
    </svg>
  )
})

// ═══════════════════════════════════════
// INDEX-TO-THEME MAPPING
// ═══════════════════════════════════════
const IDX_TO_THEME = [
  'THEME_01', 'THEME_02', 'THEME_03', 'THEME_04',
  'THEME_05', 'THEME_06', 'THEME_07',
]

// ═══════════════════════════════════════
// ANIMATION STYLES (shared)
// ═══════════════════════════════════════
const CIRCLE_ANIM_STYLES = `
  @keyframes draw { from { stroke-dashoffset: 600 } to { stroke-dashoffset: 0 } }
  @keyframes drawL { from { stroke-dashoffset: 500 } to { stroke-dashoffset: 0 } }
  @keyframes fin { from { opacity: 0 } to { opacity: 1 } }
  @keyframes scaleIn { from { opacity: 0; transform: scale(.85) } to { opacity: 1; transform: scale(1) } }
  @keyframes popIn { from { opacity: 0; transform: scale(.7) } to { opacity: 1; transform: scale(1) } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
  @keyframes sheetUp { from { opacity: 0; transform: translateY(100%) } to { opacity: 1; transform: translateY(0) } }
`

// ═══════════════════════════════════════
// EMBEDDABLE CIRCLES (for use inside Wayfinder)
// ═══════════════════════════════════════
interface EmbeddableCirclesProps {
  onSelectPathway?: (themeId: string) => void
  pathwayCounts?: Record<string, number>
  selectedPathway?: string | null
}

export function EmbeddableCircles({
  onSelectPathway,
  pathwayCounts,
  selectedPathway,
}: EmbeddableCirclesProps) {
  const [ready, setReady] = useState(false)
  const [sel, setSel] = useState<number | null>(null)
  const [hov, setHov] = useState<number | null>(null)
  const [nodeInfo, setNodeInfo] = useState<NodeInfo | null>(null)

  useEffect(() => { setTimeout(() => setReady(true), 80) }, [])

  // Sync with external selectedPathway prop
  useEffect(() => {
    if (selectedPathway) {
      const idx = IDX_TO_THEME.indexOf(selectedPathway)
      if (idx >= 0) setSel(idx)
    } else {
      setSel(null)
    }
  }, [selectedPathway])

  const handleSelect = useCallback((idx: number) => {
    setSel(idx)
    setNodeInfo(null)
    if (onSelectPathway) {
      onSelectPathway(IDX_TO_THEME[idx])
    }
  }, [onSelectPathway])

  const handleBack = useCallback(() => {
    setSel(null)
    setNodeInfo(null)
    if (onSelectPathway) {
      onSelectPathway('')
    }
  }, [onSelectPathway])

  const setHovStable = useCallback((v: number | null) => {
    setHov(v)
  }, [])

  // Override displayed counts with real data
  const displayPW = pathwayCounts ? PW.map((p, i) => {
    const themeId = IDX_TO_THEME[i]
    const realCount = pathwayCounts[themeId]
    return realCount !== undefined ? { ...p, count: realCount } : p
  }) : PW

  const isHome = sel === null

  const pz = usePanZoom({ minZoom: 0.5, maxZoom: 4 })

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif" }}>
      <style>{CIRCLE_ANIM_STYLES}</style>

      {/* Circles — pan/zoom container */}
      <div
        ref={pz.containerRef}
        {...pz.containerHandlers}
        style={{ animation: 'fin .35s ease both', overflow: 'hidden', cursor: pz.cursor, touchAction: 'none', position: 'relative' }}>
        <div style={pz.svgStyle}>
          {isHome ? (
            <HomeCircles onSelect={handleSelect} hov={hov} setHov={setHovStable} ready={ready} pw={displayPW} />
          ) : (
            <SelectedCircles
              selIdx={sel}
              onBack={handleBack}
              onSwitch={handleSelect}
              ready={ready}
              onNodeClick={(info) => setNodeInfo(info)}
            />
          )}
        </div>
        {/* Reset zoom button */}
        {pz.zoom !== 1 && (
          <button onClick={pz.resetView} style={{
            position: 'absolute', bottom: 8, right: 8, zIndex: 10,
            padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600,
            background: C.white, border: `1px solid ${C.bdr}`, color: C.mid,
            cursor: 'pointer',
          }}>Reset zoom</button>
        )}
      </div>

      {/* Bottom sheet info pane */}
      {nodeInfo && <InfoPane info={nodeInfo} onClose={() => setNodeInfo(null)} />}

      {/* Bottom legend (selected state) */}
      {!isHome && sel !== null && (
        <div style={{
          display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap',
          padding: '4px 0 12px', animation: 'slideUp .4s ease .3s both',
        }}>
          {CENTER_META.map(c => {
            const count = PW[sel].centers[c.key] || 0
            if (count === 0) return null
            return (
              <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', border: `2px solid ${c.color}`, opacity: .6 }} />
                <span style={{ fontSize: 10, color: C.mid }}>
                  <span style={{ fontWeight: 700, color: c.color }}>{count}</span> {c.key}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Pathway quick-switch (selected state) */}
      {!isHome && (
        <div style={{
          display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap',
          padding: '0 0 8px', animation: 'slideUp .4s ease .4s both',
        }}>
          {PW.map((p, i) => (
            <button key={p.name} onClick={() => handleSelect(i)} style={{
              padding: '5px 14px', borderRadius: 20, fontSize: 11, fontWeight: 600,
              border: `1.5px solid ${i === sel ? p.color : C.bdr}`,
              background: i === sel ? `${p.color}10` : 'transparent',
              color: i === sel ? p.color : C.mid,
              cursor: 'pointer', transition: 'border-color .15s, background .15s, color .15s',
              fontFamily: "'DM Sans',sans-serif",
            }}>
              {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════
// MAIN COMPONENT (standalone page)
// ═══════════════════════════════════════
export default function CircleKnowledgeGraph() {
  const [ready, setReady] = useState(false)
  const [sel, setSel] = useState<number | null>(null)
  const [hov, setHov] = useState<number | null>(null)
  const [nodeInfo, setNodeInfo] = useState<NodeInfo | null>(null)
  const pz = usePanZoom({ minZoom: 0.5, maxZoom: 4 })

  useEffect(() => { setTimeout(() => setReady(true), 80) }, [])

  const isHome = sel === null

  return (
    <div style={{
      minHeight: '100vh', background: C.cream,
      fontFamily: "'DM Sans',sans-serif", color: C.charcoal,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ${CIRCLE_ANIM_STYLES}
        ::selection { background: #C65D2833 }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 24px', borderBottom: `1px solid ${C.bdr}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CA color={C.orange} s={28} />
          <div>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: 15, fontWeight: 700, lineHeight: 1.1 }}>
              Community <em style={{ fontStyle: 'italic', color: C.orange, fontWeight: 400 }}>Exchange</em>
            </div>
            <div style={{ fontSize: 8, color: C.lt, letterSpacing: '.14em', textTransform: 'uppercase' }}>
              Houston, Texas
            </div>
          </div>
        </div>
        <div style={{ fontSize: 10, color: C.lt }}>
          307 resources, 200 officials, 80 policies, 312 focus areas
        </div>
      </div>

      {/* ── Circle Area ── */}
      <div style={{
        maxWidth: 780, margin: '0 auto', padding: '12px 20px 0',
      }}>
        {/* Title area */}
        <div style={{
          textAlign: 'center', padding: isHome ? '20px 0 4px' : '10px 0 4px',
          animation: 'slideUp .5s ease both',
        }}>
          {isHome ? (
            <>
              <div style={{
                fontFamily: 'Georgia,serif', fontSize: 28, fontWeight: 400,
                letterSpacing: '-.02em', lineHeight: 1.2, color: C.charcoal,
              }}>
                Everything connects.
              </div>
              <div style={{
                fontSize: 12, color: C.mid, marginTop: 6, maxWidth: 420, margin: '6px auto 0',
                lineHeight: 1.5, fontFamily: 'Georgia,serif', fontStyle: 'italic',
              }}>
                Explore 7 pathways of civic life. Each circle connects to the others
                through shared focus areas, officials, and policies.
              </div>
            </>
          ) : (
            <div style={{
              fontFamily: 'Georgia,serif', fontSize: 14, color: C.mid,
              fontStyle: 'italic', lineHeight: 1.5,
            }}>
              <span style={{ color: PW[sel].color, fontWeight: 600, fontStyle: 'normal' }}>
                {PW[sel].name}
              </span>
              {' '}{PW[sel].sub} -- showing how this pathway connects across the knowledge graph
            </div>
          )}
        </div>

        {/* Circles — pan/zoom container */}
        <div
          ref={pz.containerRef}
          {...pz.containerHandlers}
          style={{ animation: 'fin .35s ease both', overflow: 'hidden', cursor: pz.cursor, touchAction: 'none', position: 'relative' }}>
          <div style={pz.svgStyle}>
            {isHome ? (
              <HomeCircles onSelect={setSel} hov={hov} setHov={setHov} ready={ready} />
            ) : (
              <SelectedCircles
                selIdx={sel}
                onBack={() => setSel(null)}
                onSwitch={(i) => setSel(i)}
                ready={ready}
                onNodeClick={(info) => setNodeInfo(info)}
              />
            )}
          </div>
          {pz.zoom !== 1 && (
            <button onClick={pz.resetView} style={{
              position: 'absolute', bottom: 8, right: 8, zIndex: 10,
              padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600,
              background: C.white, border: `1px solid ${C.bdr}`, color: C.mid,
              cursor: 'pointer',
            }}>Reset zoom</button>
          )}
        </div>

        {/* Bottom sheet info pane */}
        {nodeInfo && <InfoPane info={nodeInfo} onClose={() => setNodeInfo(null)} />}

        {/* ── Bottom legend (selected state) ── */}
        {!isHome && sel !== null && (
          <div style={{
            display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap',
            padding: '8px 0 16px', animation: 'slideUp .4s ease .3s both',
          }}>
            {CENTER_META.map(c => {
              const count = PW[sel].centers[c.key] || 0
              if (count === 0) return null
              return (
                <div key={c.key} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    border: `2px solid ${c.color}`, opacity: .6,
                  }} />
                  <span style={{ fontSize: 10, color: C.mid }}>
                    <span style={{ fontWeight: 700, color: c.color }}>{count}</span> {c.key}
                  </span>
                </div>
              )
            })}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: PW[sel].color, opacity: .3,
              }} />
              <span style={{ fontSize: 10, color: C.mid }}>
                <span style={{ fontWeight: 700 }}>{PW[sel].focus}</span> focus areas
              </span>
            </div>
          </div>
        )}

        {/* ── Pathway quick-switch (selected state) ── */}
        {!isHome && (
          <div style={{
            display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap',
            padding: '0 0 20px', animation: 'slideUp .4s ease .4s both',
          }}>
            {PW.map((p, i) => (
              <button key={p.name} onClick={() => setSel(i)} style={{
                padding: '5px 14px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                border: `1.5px solid ${i === sel ? p.color : C.bdr}`,
                background: i === sel ? `${p.color}10` : 'transparent',
                color: i === sel ? p.color : C.mid,
                cursor: 'pointer', transition: 'border-color .15s, background .15s, color .15s',
                fontFamily: "'DM Sans',sans-serif",
              }}>
                {p.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div style={{
        textAlign: 'center', padding: '16px 20px 24px',
        borderTop: `1px solid ${C.bdr}`, marginTop: 8,
      }}>
        <div style={{ fontSize: 10, color: C.lt }}>
          Community Exchange — powered by The Change Lab
        </div>
        <div style={{ fontSize: 9, color: C.lt2, marginTop: 2 }}>
          Community Life, Organized
        </div>
      </div>
    </div>
  )
}
