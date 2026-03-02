'use client'

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { useState, useEffect, useRef, useCallback } from 'react'
import type { CircleData, CirclePathway } from '@/lib/data/circle'
import { lookupZipAction, searchCircleAction } from '@/app/circle/actions'

// ═══════════════════════════════════════════════════════════════
// THE COMMUNITY EXCHANGE v13
// Slide-out braiding panel (from Exchange 2 pattern),
// 4 Centers + Explore Topics in left menu, polished home,
// improved cards. 2-col locked: left 220px + center flex.
// v13: Removed redundant Community Exchange title from center (already in left nav).
// ═══════════════════════════════════════════════════════════════

const C = {
  cream: '#EDEAE3', card: '#F5F2EC', white: '#FAFAF7', cardW: '#FFFFFF',
  charcoal: '#2D2D2D', txt: '#3A3632', mid: '#6B6560',
  lt: '#9A9080', lt2: '#B5AFA5', bdr: '#DAD5CC', rule: '#C5BFB5',
  orange: '#C65D28', teal: '#3D5A5A', tealLt: '#5B8A8A',
}

const CENTERS = [
  { key: 'Learning', color: '#4C9F38', desc: 'Know your world' },
  { key: 'Action', color: '#DD1367', desc: 'Show up and do' },
  { key: 'Resource', color: '#26BDE2', desc: 'Get what you need' },
  { key: 'Responsible', color: '#8B6BA8', desc: 'Lead and govern' },
]

const ctrColor = (c: string) => ({ Learning: '#4C9F38', Action: '#DD1367', Resource: '#26BDE2', Responsible: '#8B6BA8' }[c] || '#999')
const lvlColor = (l: string) => ({ City: '#5B8A8A', County: '#8B7D3C', State: '#C65D28', Federal: '#7B6BA8' }[l] || '#999')
const stColor = (s: string) => s === 'Active' ? '#C65D28' : s === 'Enacted' ? '#5A8E5A' : '#8B7D3C'

// ── Editorial constants (personas, quick actions) ──

const PERSONAS = [
  { id: 'starter', name: 'Starter', q: 'Where do I even start?', color: '#4A6A8A',
    match: [3, 6], firstMove: 'Start with Voice -- voter registration and community events are the quickest on-ramp. Then explore The Bigger We for connection.',
    centers: ['Learning', 'Resource'] },
  { id: 'hard-worker', name: 'Hard Worker', q: 'I need resources and I want to give back.', color: '#7A6E8A',
    match: [4, 0, 1], firstMove: 'Money and Health have the most direct resources. Families offers volunteer opportunities where your experience helps others.',
    centers: ['Resource', 'Action'] },
  { id: 'next-steps', name: 'Next Steps', q: 'I just finished something. What now?', color: '#A85C3B',
    match: [3, 2], firstMove: 'Voice connects your experience to civic action. Neighborhood shows where local change is happening that you can join.',
    centers: ['Action', 'Learning'] },
  { id: 'looking', name: 'Looking for Answers', q: 'Who\'s in charge? And why?', color: '#8B7D3C',
    match: [3, 2, 4], firstMove: 'Voice maps the power structure. Neighborhood and Money show where those decisions land in your daily life.',
    centers: ['Responsible', 'Learning'] },
  { id: 'spark', name: 'Spark Plug', q: '5 minutes. What can I do?', color: '#4A6B52',
    match: [3, 6], firstMove: 'Register to vote (2 min). Sign up for a bridge-building conversation (3 min). You\'re already making a difference.',
    centers: ['Action'] },
  { id: 'bridge', name: 'Bridge Builder', q: 'How do we stop talking past each other?', color: '#3D7A7A',
    match: [6, 3, 1], firstMove: 'The Bigger We is your home base. Voice and Families are where bridging skills matter most right now.',
    centers: ['Action', 'Learning'] },
  { id: 'scout', name: 'Scout', q: 'I care about everything. Where do I focus?', color: C.orange,
    match: [6, 0, 5], firstMove: 'Start at The Bigger We -- it connects to every pathway. Then follow the bridges to Health and Planet.',
    centers: ['Learning', 'Action', 'Resource'] },
]

const QA = [
  { label: 'Find a volunteer opportunity', search: 'volunteer Houston' },
  { label: 'Register to vote', search: 'voter registration' },
  { label: 'Find housing resources', search: 'housing assistance' },
  { label: 'Get job training', search: 'workforce development' },
  { label: 'Meet your neighbors', search: 'community events' },
  { label: 'Find resources near you', search: 'services resources' },
]

// ─── CIRCLE GEOMETRY ───
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

// ═══════════════════════════════════════
// CIRCLES
// ═══════════════════════════════════════
const TheCircles = ({ sel, onSelect, compact, ready, pathways, bridgeData }: { sel: number | null; onSelect: (i: number) => void; compact: boolean; ready: boolean; pathways: CirclePathway[]; bridgeData: [number, number, number, string][] }) => {
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

  const height = compact ? 260 : open ? 320 : 500

  return (
    <div style={{ width: '100%', maxWidth: compact ? 400 : open ? 460 : 680, margin: '0 auto', transition: 'all .5s cubic-bezier(.22,1,.36,1)' }}>
      <svg viewBox={`0 0 ${VBW} ${VBH}`}
        style={{ width: '100%', height, overflow: 'visible', transition: 'height .5s cubic-bezier(.22,1,.36,1)' }}
        preserveAspectRatio="xMidYMid meet">
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
              {isHov && !open && !compact && (
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
      </svg>
    </div>
  )
}

// ── Circle Accent ──
const CA = ({ color = C.orange, s = 20 }: { color?: string; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
    <circle cx="10" cy="10" r="7" fill="none" stroke={color} strokeWidth="1.2" opacity=".4" />
    <circle cx="7" cy="8" r="4" fill="none" stroke={color} strokeWidth=".7" opacity=".25" />
    <circle cx="13" cy="12" r="3.5" fill="none" stroke={color} strokeWidth=".7" opacity=".25" />
  </svg>
)

// ── Decorative Circle Components ──
const CircleArc = ({ color = C.lt2, size = 60, startAngle = 0, endAngle = 180, strokeWidth: sw = 1.5, opacity: op = 0.15, style: st = {} }: { color?: string; size?: number; startAngle?: number; endAngle?: number; strokeWidth?: number; opacity?: number; style?: React.CSSProperties }) => {
  const r = (size - sw) / 2
  const cxA = size / 2, cyA = size / 2
  const sa = startAngle * Math.PI / 180, ea = endAngle * Math.PI / 180
  const start = { x: cxA + r * Math.cos(sa), y: cyA + r * Math.sin(sa) }
  const end = { x: cxA + r * Math.cos(ea), y: cyA + r * Math.sin(ea) }
  const large = endAngle - startAngle > 180 ? 1 : 0
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute', pointerEvents: 'none', ...st }}>
      <path d={`M${start.x},${start.y} A${r},${r} 0 ${large},1 ${end.x},${end.y}`} fill="none" stroke={color} strokeWidth={sw} opacity={op} strokeLinecap="round" />
    </svg>
  )
}

const CardArcAccent = ({ color = C.orange, height = 60 }: { color?: string; height?: number }) => (
  <svg width="12" height={height} viewBox={`0 0 12 ${height}`} style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
    <path d={`M12,${height * 0.1} A${height * 0.4},${height * 0.4} 0 0,0 12,${height * 0.9}`} fill="none" stroke={color} strokeWidth="2.5" opacity=".4" strokeLinecap="round" />
    <path d={`M12,${height * 0.2} A${height * 0.3},${height * 0.3} 0 0,0 12,${height * 0.8}`} fill="none" stroke={color} strokeWidth="1" opacity=".2" strokeLinecap="round" />
  </svg>
)

const BgCircleDecor = ({ color = C.lt2, size = 300, top, left, right, bottom, opacity: op = 0.06 }: { color?: string; size?: number; top?: string | number; left?: string | number; right?: string | number; bottom?: string | number; opacity?: number }) => (
  <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute', top, left, right, bottom, pointerEvents: 'none', zIndex: 0 }}>
    <circle cx={size/2} cy={size/2} r={size/2 - 10} fill="none" stroke={color} strokeWidth="1.5" opacity={op} />
    <circle cx={size/2} cy={size/2} r={size/3} fill="none" stroke={color} strokeWidth="1" opacity={op * 0.7} strokeDasharray="8,6" />
    <circle cx={size/2} cy={size/2} r={size/5} fill="none" stroke={color} strokeWidth=".7" opacity={op * 0.5} />
  </svg>
)

const CircleDivider = ({ color = C.rule }: { color?: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
    <div style={{ flex: 1, height: 1, background: color }} />
    <svg width="40" height="12" viewBox="0 0 40 12" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="6" r="5" fill="none" stroke={color} strokeWidth="1" opacity=".5" />
      <circle cx="20" cy="6" r="4" fill="none" stroke={color} strokeWidth="1" opacity=".35" />
      <circle cx="28" cy="6" r="5" fill="none" stroke={color} strokeWidth="1" opacity=".5" />
    </svg>
    <div style={{ flex: 1, height: 1, background: color }} />
  </div>
)

const LOGO_COLORS = ['#D4654A', '#C4943C', '#7B6BA8', '#3D7A7A', '#4A7A8A', '#5A8E5A', '#8B6BA8']
const LOGO_CENTER = [false, false, false, false, false, false, true]
const Logo = ({ size = 36 }: { size?: number }) => (
  <svg width={size} height={size} viewBox={`0 0 ${VBW} ${VBH}`}>
    {POS.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={LOGO_CENTER[i] ? CTR_R : CR} fill="none" stroke={LOGO_COLORS[i] || '#999'} strokeWidth="18" opacity=".55" />)}
  </svg>
)

// ═══════════════════════════════════════
// SLIDE-OUT PANEL (Exchange 2 pattern)
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
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 600, color: C.mid, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 4 }}>
            <span style={{ fontSize: 16 }}>{'\u2190'}</span> Back
          </button>
          <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: C.lt2 }}>{type === 'resource' ? 'Resource' : type === 'official' ? 'Official' : 'Policy'}</span>
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
              {relatedOfficials.length > 0 && (<PanelSection title="Who's Responsible" color={C.teal}>{relatedOfficials.map((off: any, i: number) => (<MiniCard key={i} onClick={() => onNavigate('official', off)} bar={lvlColor(off.level)} label={off.level}><div style={{ fontSize: 12, fontWeight: 700 }}>{off.name}</div><div style={{ fontSize: 10, color: C.mid }}>{off.role}</div>{off.rel && <div style={{ fontSize: 10, color: C.lt, fontStyle: 'italic', marginTop: 3, lineHeight: 1.4 }}>{off.rel}</div>}</MiniCard>))}</PanelSection>)}
              {relatedPolicies.length > 0 && (<PanelSection title="Policies to Watch" color={C.orange}>{relatedPolicies.map((pol: any, i: number) => (<MiniCard key={i} onClick={() => onNavigate('policy', pol)} bar={stColor(pol.status)} label={pol.status} labelColor={stColor(pol.status)}><div style={{ fontSize: 12, fontWeight: 700 }}>{pol.name}</div><div style={{ fontSize: 10, color: C.mid }}>{pol.level} {'\u00b7'} {pol.body}</div>{pol.plain && <div style={{ fontSize: 10, color: C.lt, fontStyle: 'italic', marginTop: 3, lineHeight: 1.45 }}>{pol.plain.slice(0, 100)}...</div>}</MiniCard>))}</PanelSection>)}
              {pwData && pwData.resources.filter((x: any) => x.id !== r.id).length > 0 && (<PanelSection title={`More in ${pwData.name}`} color={pwData.color}><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>{pwData.resources.filter((x: any) => x.id !== r.id).map((res: any, i: number) => (<MiniCardCompact key={i} onClick={() => onNavigate('resource', res)}><div style={{ fontSize: 10, fontWeight: 700, lineHeight: 1.3 }}>{res.title}</div><div style={{ fontSize: 8, color: C.lt, marginTop: 2 }}>{res.org}</div></MiniCardCompact>))}</div></PanelSection>)}
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
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>{off.website ? <a href={off.website} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}><ActionBtn primary>Official Website {'\u2192'}</ActionBtn></a> : null}{off.phone && <a href={`tel:${off.phone.replace(/[^0-9]/g, '')}`} style={{ textDecoration: 'none' }}><ActionBtn>Call Now</ActionBtn></a>}<a href={`/officials/${off.id}`} style={{ textDecoration: 'none' }}><ActionBtn>Full Profile</ActionBtn></a></div>
              {officialPolicies.length > 0 && (<PanelSection title="Policies in Their Area" color={C.orange}>{officialPolicies.map((pol: any, i: number) => (<MiniCard key={i} onClick={() => onNavigate('policy', pol)} bar={stColor(pol.status)} label={pol.status} labelColor={stColor(pol.status)}><div style={{ fontSize: 12, fontWeight: 700 }}>{pol.name}</div>{pol.plain && <div style={{ fontSize: 10, color: C.mid, marginTop: 2, lineHeight: 1.45 }}>{pol.plain}</div>}</MiniCard>))}</PanelSection>)}
              {relatedResources.length > 0 && (<PanelSection title="Related Resources" color={pwData?.color || C.teal}><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>{relatedResources.map((res: any, i: number) => (<MiniCardCompact key={i} onClick={() => onNavigate('resource', res)}><div style={{ fontSize: 10, fontWeight: 700, lineHeight: 1.3 }}>{res.title}</div><div style={{ fontSize: 8, color: C.lt, marginTop: 2 }}>{res.org}</div></MiniCardCompact>))}</div></PanelSection>)}
            </div>)
          })()}
          {type === 'policy' && (() => {
            const pol = data
            return (<div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}><Tag color={stColor(pol.status)}>{pol.status}</Tag>{pwData && <Tag color={pwData.color}>{pwData.name}</Tag>}<Tag color={lvlColor(pol.level)}>{pol.level}</Tag></div>
              <h2 style={{ fontFamily: "'Newsreader',serif", fontSize: 22, fontWeight: 700, lineHeight: 1.2, marginBottom: 4 }}>{pol.name}</h2>
              <div style={{ fontSize: 11, color: C.lt, marginBottom: 8 }}>Decided by: <span style={{ color: C.teal, fontWeight: 700 }}>{pol.body}</span></div>
              {pol.desc && <p style={{ fontFamily: "'Newsreader',serif", fontSize: 13, color: C.mid, lineHeight: 1.65, marginBottom: 10 }}>{pol.desc}</p>}
              {pol.plain && (<div style={{ background: '#FAF8F2', border: `1px solid ${C.bdr}`, borderLeft: `3px solid ${C.tealLt}`, borderRadius: 6, padding: 16, marginBottom: 14 }}><div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: C.tealLt, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ fontSize: 14 }}>{'\ud83d\udca1'}</span> In Plain Language</div><p style={{ fontFamily: "'Newsreader',serif", fontSize: 13.5, color: C.txt, lineHeight: 1.7 }}>{pol.plain}</p></div>)}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>{pol.source_url ? <a href={pol.source_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}><ActionBtn primary>Read Full Policy {'\u2192'}</ActionBtn></a> : null}<a href={`/policies/${pol.id}`} style={{ textDecoration: 'none' }}><ActionBtn>Full Details</ActionBtn></a></div>
              {policyOfficials.length > 0 && (<PanelSection title="Who's Responsible" color={C.teal}>{policyOfficials.map((off: any, i: number) => (<MiniCard key={i} onClick={() => onNavigate('official', off)} bar={lvlColor(off.level)} label={off.level}><div style={{ fontSize: 12, fontWeight: 700 }}>{off.name}</div><div style={{ fontSize: 10, color: C.mid }}>{off.role} {'\u00b7'} {off.jur}</div></MiniCard>))}</PanelSection>)}
              {relatedResources.length > 0 && (<PanelSection title="Related Resources" color={pwData?.color || C.teal}><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>{relatedResources.map((res: any, i: number) => (<MiniCardCompact key={i} onClick={() => onNavigate('resource', res)}><div style={{ fontSize: 10, fontWeight: 700, lineHeight: 1.3 }}>{res.title}</div><div style={{ fontSize: 8, color: C.lt, marginTop: 2 }}>{res.org}</div></MiniCardCompact>))}</div></PanelSection>)}
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

const PanelSection = ({ title, color, children }: { icon?: string; title: string; color: string; children: React.ReactNode }) => (
  <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${C.bdr}` }}>
    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: C.lt, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
      <CA color={color} s={16} />{title}
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

// ── Feed Cards ──
const FeedCard = ({ type, data, pwColor, onClick }: { type: string; data: any; pwColor?: string; onClick?: () => void }) => {
  if (type === 'resource') {
    const cc = ctrColor(data.center)
    return (
      <div className="ch" onClick={onClick} style={{ position: 'relative', overflow: 'hidden', background: C.white, borderRadius: 8, padding: '14px 16px 14px 18px', border: `1px solid ${C.bdr}40`, cursor: 'pointer' }}>
        <CardArcAccent color={pwColor || cc} height={70} />
        <CircleArc color={pwColor || cc} size={40} startAngle={-30} endAngle={90} strokeWidth={1} opacity={0.08} style={{ top: -4, right: -4 }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, position: 'relative', zIndex: 1 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: cc, marginTop: 5, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.charcoal, lineHeight: 1.35, marginBottom: 3 }}>{data.title}</div>
            <div style={{ fontSize: 11.5, color: C.mid, lineHeight: 1.55 }}>{data.summary}</div>
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8, fontSize: 10 }}>
              <span style={{ color: cc, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: cc, display: 'inline-block' }} />{data.center}</span>
              {data.org && <span style={{ color: C.lt }}>via {data.org}</span>}
              <span style={{ marginLeft: 'auto', color: C.tealLt, fontWeight: 600 }}>Open {'\u203a'}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }
  if (type === 'official') {
    return (
      <div className="ch" onClick={onClick} style={{ position: 'relative', overflow: 'hidden', background: `${C.teal}05`, borderRadius: 8, padding: '12px 16px 12px 18px', border: `1px solid ${C.teal}15`, cursor: 'pointer' }}>
        <CardArcAccent color={C.teal} height={60} />
        <CircleArc color={C.teal} size={36} startAngle={-30} endAngle={90} strokeWidth={1} opacity={0.08} style={{ top: -2, right: -2 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
          <InitialsCircle name={data.name} color={C.teal} size={40} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 8, fontWeight: 700, color: C.teal, letterSpacing: '.08em', textTransform: 'uppercase' }}>Who Decides</div>
            <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3, marginTop: 1 }}>{data.name}</div>
            <div style={{ fontSize: 11, color: C.mid }}>{data.role}</div>
            {data.rel && <div style={{ fontSize: 10, color: C.lt, marginTop: 3, fontStyle: 'italic', lineHeight: 1.4 }}>{data.rel}</div>}
          </div>
          <span style={{ color: C.tealLt, fontSize: 18 }}>{'\u203a'}</span>
        </div>
      </div>
    )
  }
  if (type === 'policy') {
    const sc = stColor(data.status)
    return (
      <div className="ch" onClick={onClick} style={{ position: 'relative', overflow: 'hidden', background: `${sc}05`, borderRadius: 8, padding: '12px 16px 12px 18px', border: `1px solid ${sc}12`, cursor: 'pointer' }}>
        <CardArcAccent color={sc} height={60} />
        <CircleArc color={sc} size={36} startAngle={-30} endAngle={90} strokeWidth={1} opacity={0.08} style={{ top: -2, right: -2 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, position: 'relative', zIndex: 1 }}>
          <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: sc, background: `${sc}10`, padding: '2px 8px', borderRadius: 3 }}>{data.status}</span>
          <span style={{ fontSize: 8, fontWeight: 700, color: C.lt, letterSpacing: '.08em', textTransform: 'uppercase' }}>Policy</span>
          <span style={{ marginLeft: 'auto', color: C.tealLt, fontSize: 14 }}>{'\u203a'}</span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3, marginBottom: 2 }}>{data.name}</div>
        {data.rel && <div style={{ fontSize: 11, color: C.mid, lineHeight: 1.5, marginBottom: 3 }}>{data.rel}</div>}
        <div style={{ fontSize: 10, color: C.lt }}>Decided by: <span style={{ color: C.teal, fontWeight: 600 }}>{data.body}</span></div>
      </div>
    )
  }
  return null
}

const InitialsCircle = ({ name, color, size = 38 }: { name: string; color: string; size?: number }) => (
  <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
    <circle cx={size/2} cy={size/2} r={size/2-2} fill="none" stroke={color} strokeWidth="1.5" opacity=".4" />
    <circle cx={size/2} cy={size/2} r={size/2-8} fill="none" stroke={color} strokeWidth=".7" opacity=".2" />
    <text x={size/2} y={size/2+1} textAnchor="middle" dominantBaseline="middle" fill={color} fontSize={size*0.28} fontWeight="700" style={{ fontFamily: "'Newsreader',serif" }}>{name.split(' ').map(n => n[0]).join('')}</text>
  </svg>
)

const SH = ({ title, extra, color }: { title: string; extra?: string; color?: string }) => (
  <div style={{ margin: '28px 0 14px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
      <svg width="32" height="32" viewBox="0 0 32 32" style={{ flexShrink: 0 }}>
        <circle cx="16" cy="16" r="13" fill="none" stroke={color || C.orange} strokeWidth="1.2" opacity=".2" strokeDasharray="4,3" />
        <circle cx="16" cy="16" r="7" fill="none" stroke={color || C.orange} strokeWidth=".8" opacity=".15" />
      </svg>
      <div>
        <div style={{ fontFamily: "'Newsreader',serif", fontSize: 18, fontWeight: 600, letterSpacing: '-.015em' }}>{title}</div>
        {extra && <div style={{ fontSize: 9, color: C.lt, fontStyle: 'italic' }}>{extra}</div>}
      </div>
      <div style={{ flex: 1, marginLeft: 6 }}><CircleDivider color={color || C.rule} /></div>
    </div>
  </div>
)

// ═══════════════════════════════════════
// MAIN
// ═══════════════════════════════════════
export default function CommunityExchangeV13({ data }: { data: CircleData }) {
  const PW = data.pathways
  const BRIDGES = data.bridges
  const STATS = data.stats
  const OFFICIALS_HOME = data.officialsHome
  const TOPICS = Array.from(new Set(PW.flatMap(p => p.topics))).slice(0, 12)
  const [ready, setReady] = useState(false)
  const [sel, setSel] = useState<number | null>(null)
  const [activePersona, setActivePersona] = useState<any>(null)
  const [activeQA, setActiveQA] = useState<any>(null)
  const [activeCenter, setActiveCenter] = useState<string | null>(null)
  const [zip, setZip] = useState('')
  const [zipEntered, setZipEntered] = useState(false)
  const [neighborhood, setNeighborhood] = useState('')
  const [zipData, setZipData] = useState<{ neighborhood_name: string; council_district: string | null; population: number | null; median_income: number | null; officials: { official_name: string; title: string | null; level: string | null }[] } | null>(null)
  const [zipLoading, setZipLoading] = useState(false)
  const [searchVal, setSearchVal] = useState('')
  const [searchResults, setSearchResults] = useState<any>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [activeEngagement, setActiveEngagement] = useState<string | null>(null)
  const [activeTopic, setActiveTopic] = useState<string | null>(null)
  const [qaOpen, setQaOpen] = useState(true)
  const [perOpen, setPerOpen] = useState(false)
  const [engOpen, setEngOpen] = useState(false)
  const [topicsOpen, setTopicsOpen] = useState(true)
  const [centersOpen, setCentersOpen] = useState(true)
  const cRef = useRef<HTMLDivElement>(null)

  const [panel, setPanel] = useState<any>(null)
  const [panelHistory, setPanelHistory] = useState<any[]>([])
  const [panelList, setPanelList] = useState<any[]>([])
  const [panelIdx, setPanelIdx] = useState(0)

  useEffect(() => { setTimeout(() => setReady(true), 60) }, [])

  const pw = sel !== null ? PW[sel] : null
  const open = sel !== null
  const isHome = !open && !activePersona && !activeQA && !searchResults && !activeTopic

  const goHome = () => { setSel(null); setActivePersona(null); setActiveQA(null); setActiveCenter(null); setSearchResults(null); setSearchVal(''); setActiveEngagement(null); setActiveTopic(null) }

  const pick = useCallback((i: number) => {
    setSel(i === sel ? null : i)
    setActivePersona(null); setActiveQA(null); setActiveCenter(null)
    if (i !== sel && i !== null)
      setTimeout(() => cRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 350)
  }, [sel])

  const openPanel = useCallback((type: string, data: any, pwIdx?: number) => {
    const pwData = pwIdx !== undefined ? PW[pwIdx] : (sel !== null ? PW[sel] : null)
    const foundPw = pwData || PW.find(p =>
      (type === 'resource' && p.resources.some(r => r.id === data.id)) ||
      (type === 'official' && p.officials?.some((o: any) => o.id === data.id)) ||
      (type === 'policy' && p.policies?.some((p2: any) => p2.id === data.id))
    )
    setPanel({ type, data, pw: foundPw })
    setPanelHistory(prev => [...prev, { type, data, pw: foundPw }])
  }, [sel])

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
  }, [panel, panelIdx, panelList])

  const braided = pw ? (() => {
    const items: any[] = [];
    (pw.officials || []).forEach((o: any) => items.push({ type: 'official', data: o }))
    const resources = [...pw.resources]
    const policies = [...(pw.policies || [])]
    let ri = 0, pi = 0
    while (ri < resources.length || pi < policies.length) {
      if (ri < resources.length) items.push({ type: 'resource', data: resources[ri++] })
      if (ri < resources.length) items.push({ type: 'resource', data: resources[ri++] })
      if (pi < policies.length) items.push({ type: 'policy', data: policies[pi++] })
    }
    return items
  })() : []

  useEffect(() => {
    if (braided.length > 0) { setPanelList(braided); setPanelIdx(0) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel])

  const filteredBraid = braided.filter((f: any) => {
    if (activeCenter) {
      if (f.type === 'resource' && f.data.center !== activeCenter) return false
      if (activeCenter !== 'Responsible' && (f.type === 'official' || f.type === 'policy')) return false
    }
    if (activeEngagement && f.type === 'resource' && f.data.engagement_level !== activeEngagement) return false
    return true
  })

  const selectPersona = (p: any) => { setActivePersona(activePersona?.id === p.id ? null : p); setSel(null); setActiveQA(null) }
  const selectQA = async (qa: any) => {
    setActiveQA(qa); setSel(null); setActivePersona(null); setSearchVal(qa.search); setSearchResults(null); setActiveTopic(null)
    setSearchLoading(true)
    try {
      const results = await searchCircleAction(qa.search)
      setActiveQA({ ...qa, results })
    } catch { /* keep showing QA without results */ }
    finally { setSearchLoading(false) }
  }

  const handleZip = async () => {
    if (zip.length === 5) {
      setZipLoading(true)
      try {
        const result = await lookupZipAction(zip)
        setZipEntered(true)
        if (result) {
          setNeighborhood(result.neighborhood_name)
          setZipData(result)
        } else {
          setNeighborhood('Houston')
          setZipData(null)
        }
      } catch {
        setZipEntered(true)
        setNeighborhood('Houston')
        setZipData(null)
      } finally {
        setZipLoading(false)
      }
    }
  }

  const handleSearch = async () => {
    const q = searchVal.trim()
    if (!q) return
    setSearchLoading(true)
    setSel(null); setActivePersona(null); setActiveQA(null); setActiveCenter(null); setActiveEngagement(null); setActiveTopic(null)
    try {
      const results = await searchCircleAction(q)
      setSearchResults(results)
    } catch {
      setSearchResults(null)
    } finally {
      setSearchLoading(false)
    }
  }

  const bridges = sel !== null ? BRIDGES.filter(b => b[0] === sel || b[1] === sel).map(b => {
    const oi = b[0] === sel ? b[1] : b[0]
    return { idx: oi, name: PW[oi]?.name, shared: b[2], label: b[3], color: PW[oi]?.color }
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
        @keyframes pulse{0%,100%{opacity:.3}50%{opacity:1}}
        @keyframes arcDraw{from{stroke-dashoffset:200}to{stroke-dashoffset:0}}
        .ch{transition:transform .18s,box-shadow .18s}.ch:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.07)}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#ccc;border-radius:3px}
        ::selection{background:#C65D2833}
        body.panel-lock{overflow:hidden}
        @media(max-width:768px){.two-col-layout{flex-direction:column !important}.right-col-sticky{position:static !important;order:-1;max-width:100% !important;flex:1 1 auto !important}}
      `}</style>

      <SlidePanel panel={panel} onClose={closePanel} onNavigate={navigatePanel} panelList={panelList} panelIdx={panelIdx} />

      {/* TOP BAR */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 20px', borderBottom: `1px solid ${C.bdr}`, background: 'rgba(237,234,227,.95)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: "'Newsreader',serif", fontStyle: 'italic', color: C.lt, fontSize: 11 }}>
            {isHome ? 'Monday, March 2, 2026' : pw ? pw.name : activePersona ? activePersona.name : activeQA ? activeQA.label : searchResults ? `Search: ${searchVal}` : activeTopic ? `Topic: ${activeTopic}` : ''}
          </span>
          {!isHome && <span onClick={goHome} style={{ color: C.tealLt, fontWeight: 600, cursor: 'pointer', fontSize: 10 }}>Back to Home</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', gap: 1, background: C.card, borderRadius: 3, border: `1px solid ${C.bdr}`, padding: 1 }}>
            {['EN', 'ES', 'VI'].map((l, i) => (
              <span key={l} style={{ fontSize: 9, fontWeight: i === 0 ? 700 : 500, padding: '3px 8px', borderRadius: 2, cursor: 'pointer', color: i === 0 ? C.charcoal : C.lt, background: i === 0 ? C.cream : 'transparent' }}>{l}</span>
            ))}
          </div>
          <a href="/login" style={{ fontWeight: 600, color: C.teal, textDecoration: 'none', fontSize: 11 }}>Log in</a>
          <a href="/signup" style={{ fontWeight: 600, color: '#fff', background: C.teal, padding: '4px 14px', borderRadius: 3, textDecoration: 'none', fontSize: 10, display: 'inline-block' }}>Sign up</a>
        </div>
      </div>

      {/* ELECTION BANNER */}
      <div style={{ background: '#8B7D3C', color: '#fff', padding: '6px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontSize: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', opacity: .8 }}>Tomorrow</span>
        <span style={{ fontWeight: 600 }}>Texas Primary Election -- March 3, 2026</span>
        <span style={{ fontSize: 10, opacity: .7 }}>Polls 7am-7pm</span>
        <span style={{ background: 'rgba(255,255,255,.18)', padding: '2px 12px', borderRadius: 3, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Find your polling place</span>
      </div>

      {/* TWO COLUMN LAYOUT */}
      <div style={{ display: 'flex', maxWidth: 1100, margin: '0 auto', width: '100%', minHeight: 'calc(100vh - 72px)' }}>

        {/* LEFT PANEL */}
        <aside style={{ width: 220, flexShrink: 0, padding: '12px 12px', borderRight: `1px solid ${C.bdr}`, background: C.cream, position: 'sticky', top: 36, height: 'calc(100vh - 36px)', overflowY: 'auto', opacity: ready ? 1 : 0, transition: 'opacity .3s' }}>
          <div style={{ textAlign: 'center', marginBottom: 8, cursor: 'pointer' }} onClick={goHome}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 2 }}><Logo size={36} /></div>
            <div style={{ fontFamily: "'Newsreader',serif", fontSize: 13, fontWeight: 700, lineHeight: 1.1 }}>
              Community <em style={{ fontStyle: 'italic', color: C.orange, fontWeight: 500 }}>Exchange</em>
            </div>
            <div style={{ fontSize: 7, color: C.lt, letterSpacing: '.14em', textTransform: 'uppercase' }}>Houston, Texas</div>
          </div>

          {!zipEntered ? (
            <div style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                <input value={zip} onChange={e => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))} placeholder="Enter ZIP code" onKeyDown={e => e.key === 'Enter' && handleZip()} disabled={zipLoading} style={{ flex: 1, fontSize: 11, padding: '5px 8px', borderRadius: 3, border: `1px solid ${C.bdr}`, background: C.card, outline: 'none', opacity: zipLoading ? 0.6 : 1 }} />
                <button onClick={handleZip} disabled={zipLoading} style={{ fontSize: 10, fontWeight: 700, padding: '5px 10px', background: C.teal, color: '#fff', border: 'none', borderRadius: 3, cursor: 'pointer', opacity: zipLoading ? 0.6 : 1 }}>{zipLoading ? '...' : 'Go'}</button>
              </div>
              <div style={{ fontSize: 7, color: C.lt, marginTop: 1, fontStyle: 'italic' }}>Personalizes officials and local resources</div>
            </div>
          ) : (
            <div style={{ background: C.teal + '0a', border: `1px solid ${C.teal}18`, borderRadius: 3, padding: '5px 8px', marginBottom: 6 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.teal }}>{neighborhood} Edition</div>
              <div style={{ fontSize: 9, color: C.lt }}>ZIP {zip} <span onClick={() => { setZipEntered(false); setZip(''); setZipData(null) }} style={{ color: C.tealLt, cursor: 'pointer', marginLeft: 4 }}>change</span></div>
              {zipData?.population && <div style={{ fontSize: 8, color: C.lt, marginTop: 2 }}>Pop. {zipData.population.toLocaleString()}{zipData.median_income ? ` · Income $${zipData.median_income.toLocaleString()}` : ''}</div>}
              {zipData?.officials && zipData.officials.length > 0 && (
                <div style={{ marginTop: 4, borderTop: `1px solid ${C.teal}15`, paddingTop: 3 }}>
                  <div style={{ fontSize: 7, fontWeight: 700, color: C.teal, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 2 }}>Your Reps</div>
                  {zipData.officials.slice(0, 3).map((o, i) => (
                    <div key={i} style={{ fontSize: 8, color: C.mid, lineHeight: 1.4 }}>{o.official_name} · <span style={{ color: C.lt }}>{o.title}</span></div>
                  ))}
                </div>
              )}
            </div>
          )}

          <input value={searchVal} onChange={e => setSearchVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="Search resources, officials..." style={{ fontSize: 11, padding: '5px 8px', borderRadius: 3, width: '100%', border: `1px solid ${searchResults ? C.teal : C.bdr}`, background: C.card, outline: 'none', marginBottom: 6 }} />

          <SBtn active={isHome} onClick={goHome}>Home</SBtn>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px', margin: '2px 0' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.tealLt, animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 8, color: C.tealLt, fontWeight: 700 }}>LIVE</span>
            <span style={{ fontSize: 8, color: C.lt }}>{STATS.resources} items</span>
            <span style={{ fontSize: 8, color: C.orange, fontWeight: 700, marginLeft: 'auto' }}>Live</span>
          </div>

          <Dv />
          <SL click={() => setCentersOpen(!centersOpen)}>4 Centers <Ch open={centersOpen} /></SL>
          {centersOpen && CENTERS.map(c => (<SBtn key={c.key} active={activeCenter === c.key} onClick={() => setActiveCenter(activeCenter === c.key ? null : c.key)} dot={c.color}>{c.key}</SBtn>))}

          <Dv />
          <SL>Explore Houston</SL>
          {PW.map(p => <SBtn key={p.id} active={sel === p.id} onClick={() => pick(p.id)} dot={p.color} count={p.count}>{p.name}</SBtn>)}

          <Dv />
          <SL click={() => setTopicsOpen(!topicsOpen)}>Explore Topics <Ch open={topicsOpen} /></SL>
          {topicsOpen && (<div style={{ padding: '2px 10px 6px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>{TOPICS.map(t => (<span key={t} onClick={() => { setActiveTopic(activeTopic === t ? null : t); setSel(null); setActivePersona(null); setActiveQA(null); setSearchResults(null) }} style={{ fontSize: 9, padding: '3px 8px', borderRadius: 3, background: activeTopic === t ? C.teal : C.card, border: `1px solid ${activeTopic === t ? C.teal : C.bdr}`, color: activeTopic === t ? '#fff' : C.mid, cursor: 'pointer', fontWeight: activeTopic === t ? 700 : 500, transition: 'all .15s' }}>{t}</span>))}</div>)}

          <Dv />
          <SL click={() => setQaOpen(!qaOpen)}>Get Started <Ch open={qaOpen} /></SL>
          {qaOpen && QA.map((q, i) => <SBtn key={i} active={activeQA?.label === q.label} onClick={() => selectQA(q)}>{q.label}</SBtn>)}

          <Dv />
          <SL click={() => setPerOpen(!perOpen)}>Not sure where to start? <Ch open={perOpen} /></SL>
          {perOpen && PERSONAS.map(p => <SBtn key={p.id} active={activePersona?.id === p.id} onClick={() => selectPersona(p)} dot={p.color}>{p.name}</SBtn>)}

          <Dv />
          <SL click={() => setEngOpen(!engOpen)}>Engagement Levels <Ch open={engOpen} /></SL>
          {engOpen && data.engagementLevels.length > 0
            ? data.engagementLevels.map((lvl, i) => {
                const colors = ['#5B8A8A', '#C65D28', '#C9A84C', '#7B6BA8', '#5A8E5A']
                return <SBtn key={lvl} active={activeEngagement === lvl} onClick={() => setActiveEngagement(activeEngagement === lvl ? null : lvl)} dot={colors[i % colors.length]}>{lvl}</SBtn>
              })
            : engOpen && <><SBtn active={activeEngagement === 'On the Couch'} onClick={() => setActiveEngagement(activeEngagement === 'On the Couch' ? null : 'On the Couch')} dot="#5B8A8A">On the Couch</SBtn><SBtn active={activeEngagement === 'Off the Couch'} onClick={() => setActiveEngagement(activeEngagement === 'Off the Couch' ? null : 'Off the Couch')} dot="#C65D28">Off the Couch</SBtn><SBtn active={activeEngagement === 'Use Your Superpower'} onClick={() => setActiveEngagement(activeEngagement === 'Use Your Superpower' ? null : 'Use Your Superpower')} dot="#C9A84C">Use Your Superpower</SBtn></>}

          <Dv />
          <div style={{ padding: '2px 10px' }}>
            {[
              { label: 'Browse Full Site', href: '/' },
              { label: 'Pathways', href: '/pathways' },
              { label: 'Officials', href: '/officials' },
              { label: 'Policies', href: '/policies' },
              { label: 'Services', href: '/services' },
            ].map(l => (<a key={l.label} href={l.href} style={{ fontSize: 10, fontWeight: 600, color: C.lt, padding: '2px 0', cursor: 'pointer', display: 'block', textDecoration: 'none' }}>{l.label}</a>))}
          </div>
        </aside>

        {/* CENTER CONTENT */}
        <main style={{ flex: 1, minWidth: 0, overflowY: 'auto', opacity: ready ? 1 : 0, transition: 'opacity .3s ease .1s' }}>
          <div style={{ padding: '0 24px 80px', maxWidth: 880, margin: '0 auto' }}>

            {/* ── HERO (home only): circles BIG centered ── */}
            {isHome && (
              <div style={{ position: 'relative', padding: '24px 0 0', animation: 'up .5s ease .3s both', overflow: 'hidden' }}>
                <BgCircleDecor color={C.orange} size={340} top={-40} left={-60} opacity={0.04} />
                <BgCircleDecor color={C.teal} size={280} top={20} right={-40} opacity={0.03} />
                {zipEntered && (<div style={{ textAlign: 'center', marginBottom: 4, animation: 'fin .6s ease' }}><span style={{ fontFamily: "'Newsreader',serif", fontStyle: 'italic', color: C.teal, fontSize: 13 }}>{neighborhood} Edition</span></div>)}
                <h1 style={{ fontFamily: "'Newsreader',serif", fontSize: 28, fontWeight: 400, lineHeight: 1.15, letterSpacing: '-.02em', textAlign: 'center', marginBottom: 4 }}>
                  Community Life, <span style={{ color: C.orange, fontWeight: 600 }}>Organized.</span>
                </h1>
                <p style={{ fontFamily: "'Newsreader',serif", fontStyle: 'italic', color: C.lt, fontSize: 12, lineHeight: 1.6, textAlign: 'center', marginBottom: 4, maxWidth: 460, marginLeft: 'auto', marginRight: 'auto' }}>
                  7 pathways. 4 centers. One Houston. Tap any circle to explore.
                </p>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <TheCircles sel={sel} onSelect={pick} compact={false} ready={ready} pathways={PW} bridgeData={BRIDGES} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 8 }}>
                  {[{ n: STATS.resources, l: 'Resources' }, { n: STATS.officials, l: 'Officials' }, { n: STATS.policies, l: 'Policies' }, { n: STATS.focusAreas, l: 'Focus Areas' }].map((s, i) => (
                    <div key={i} style={{ textAlign: 'center', cursor: 'pointer' }}>
                      <div style={{ fontFamily: "'Newsreader',serif", fontSize: 26, fontWeight: 300, color: C.orange }}>{s.n}</div>
                      <div style={{ fontSize: 8, color: C.lt, textTransform: 'uppercase', letterSpacing: '.1em' }}>{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div ref={cRef}>
              {/* HOME CONTENT */}
              {isHome && (
                <div style={{ animation: 'up .5s ease .5s both' }}>
                  {/* Weather bar */}
                  <div style={{ display: 'flex', gap: 6, padding: '10px 0', marginBottom: 16, borderTop: `1px solid ${C.rule}`, borderBottom: `1px solid ${C.rule}` }}>
                    {[{ l: 'TEMP', v: '72\u00b0F', s: 'Sunny', c: C.orange }, { l: 'AIR', v: '85', s: 'Moderate', c: '#C9A84C' }, { l: 'BAYOU', v: 'Normal', s: 'Buffalo', c: '#3D7A7A' }, { l: 'NWS', v: '0', s: 'All clear', c: '#4A6B52' }].map((w, i) => (
                      <div key={i} style={{ flex: '1 1 0', padding: '5px 6px', background: C.card, borderRadius: 4, border: `1px solid ${C.bdr}`, textAlign: 'center', borderTop: `2px solid ${w.c}` }}>
                        <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: '.1em', color: C.lt, textTransform: 'uppercase' }}>{w.l}</div>
                        <div style={{ fontFamily: "'Newsreader',serif", fontSize: 15, fontWeight: 400, color: w.c }}>{w.v}</div>
                        <div style={{ fontSize: 7, color: C.lt }}>{w.s}</div>
                      </div>
                    ))}
                  </div>

                  <SH title="What Your Community Offers" extra="Organized by what's available, not what's missing" />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 24 }}>
                    {[{ n: 'Fresh Food', c: '#D4654A', ct: 42 }, { n: 'Healthcare', c: '#C4706E', ct: 38 }, { n: 'Housing', c: '#7B6BA8', ct: 27 }, { n: 'Job Training', c: '#4A7A8A', ct: 31 }, { n: 'Education', c: '#C4943C', ct: 45 }, { n: 'Legal Aid', c: '#8B7D3C', ct: 19 }, { n: 'Mental Health', c: '#3D7A7A', ct: 22 }, { n: 'Youth Programs', c: '#8B6BA8', ct: 34 }].map((a, i) => (
                      <div key={i} className="ch" style={{ position: 'relative', overflow: 'hidden', background: C.card, border: `1px solid ${C.bdr}`, borderRadius: 6, padding: '10px 8px', textAlign: 'center', cursor: 'pointer', borderTop: `2px solid ${a.c}` }}>
                        <CircleArc color={a.c} size={28} startAngle={200} endAngle={340} strokeWidth={1} opacity={0.1} style={{ top: -2, right: -2 }} />
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.charcoal, position: 'relative', zIndex: 1 }}>{a.n}</div>
                        <div style={{ fontSize: 9, color: C.lt, marginTop: 2, position: 'relative', zIndex: 1 }}>{a.ct} resources</div>
                      </div>
                    ))}
                  </div>

                  <SH title={zipEntered ? `Your Representatives (${zip})` : 'Your Representatives'} extra={zipData?.council_district ? `District ${zipData.council_district}` : 'Enter ZIP for local reps'} color={C.teal} />
                  {!zipEntered && (<div style={{ background: C.teal + '08', borderLeft: `3px solid ${C.teal}`, borderRadius: 4, padding: '8px 14px', marginBottom: 12 }}><div style={{ fontSize: 12, color: C.mid }}>Enter your ZIP code to see your exact officials from city council to Congress.</div></div>)}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 24 }}>
                    {(zipData?.officials && zipData.officials.length > 0
                      ? zipData.officials.slice(0, 4).map(o => ({ name: o.official_name, title: o.title || '', level: o.level || '', since: '' }))
                      : OFFICIALS_HOME
                    ).map((o, i) => (
                      <div key={i} className="ch" style={{ background: C.card, border: `1px solid ${C.bdr}`, borderRadius: 6, padding: '12px 8px', textAlign: 'center', cursor: 'pointer' }}>
                        <InitialsCircle name={o.name} color={C.teal} size={36} />
                        <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.2, marginTop: 4 }}>{o.name}</div>
                        <div style={{ fontSize: 9, color: C.mid, marginTop: 2 }}>{o.title}</div>
                        <div style={{ fontSize: 8, color: C.lt, marginTop: 1 }}>{o.level}{o.since ? ` · ${o.since}` : ''}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ position: 'relative', overflow: 'hidden' }}>
                    <BgCircleDecor color={C.teal} size={260} top={-30} right={-60} opacity={0.04} />
                    <SH title="Houston at a Glance" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 24, position: 'relative', zIndex: 1 }}>
                      <div style={{ background: C.card, border: `1px solid ${C.bdr}`, borderRadius: 6, padding: 14 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: C.lt, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Quick Numbers</div>
                        {[{ n: 'Houston 311', d: 'City services', p: '311' }, { n: 'Harris County 211', d: 'Social services', p: '211' }, { n: 'Flood Warning', d: 'harriscountyfws.org' }, { n: 'METRO', d: 'ridemetro.org' }].map((x, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: i < 3 ? `1px solid ${C.bdr}` : 'none' }}>
                            <div><div style={{ fontSize: 11, fontWeight: 700 }}>{x.n}</div><div style={{ fontSize: 8, color: C.lt }}>{x.d}</div></div>
                            {x.p && <div style={{ fontSize: 13, fontWeight: 700, color: C.teal, fontFamily: "'Newsreader',serif" }}>{x.p}</div>}
                          </div>
                        ))}
                      </div>
                      <div style={{ background: C.card, border: `1px solid ${C.bdr}`, borderRadius: 6, padding: 14 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: C.lt, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Key Indicators</div>
                        {[{ l: 'Median Income', v: '$56,019' }, { l: 'Rent Increase', v: '+9% YoY' }, { l: 'Flood Risk', v: '500K+' }, { l: 'Uninsured', v: '21.4%' }].map((x, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: i < 3 ? `1px solid ${C.bdr}` : 'none' }}>
                            <span style={{ fontSize: 10, color: C.mid }}>{x.l}</span>
                            <span style={{ fontSize: 11, fontWeight: 700 }}>{x.v}</span>
                          </div>
                        ))}
                        <div style={{ fontSize: 7, color: C.lt2, marginTop: 6, fontStyle: 'italic' }}>Kinder Institute 2025, Census ACS</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ position: 'relative', textAlign: 'center', padding: '20px 0 0', overflow: 'hidden' }}>
                    <BgCircleDecor color={C.orange} size={180} top={-30} left={-40} opacity={0.03} />
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}><CA color={C.teal} /></div>
                      <div style={{ fontFamily: "'Newsreader',serif", fontSize: 15, fontWeight: 600 }}>Stay Connected</div>
                      <div style={{ fontSize: 11, color: C.lt, marginBottom: 8 }}>Weekly digest of what your community offers</div>
                      <div style={{ display: 'flex', gap: 4, maxWidth: 300, margin: '0 auto' }}>
                        <input placeholder="your@email.com" style={{ flex: 1, padding: '7px 10px', border: `1px solid ${C.bdr}`, borderRadius: 3, fontSize: 11, background: C.card, outline: 'none' }} />
                        <button style={{ padding: '7px 14px', background: C.teal, color: '#fff', border: 'none', borderRadius: 3, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Subscribe</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* NON-HOME: TWO-COLUMN LAYOUT */}
              {!isHome && (
                <div className="two-col-layout" style={{ display: 'flex', gap: 24, padding: '16px 0 0', alignItems: 'flex-start' }}>
                  {/* LEFT: page content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* PATHWAY */}
                    {open && pw && (
                      <div style={{ animation: 'up .4s cubic-bezier(.22,1,.36,1)' }}>
                        <div style={{ marginBottom: 20, borderBottom: `2px solid ${pw.color}20`, paddingBottom: 16 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                            <svg width="30" height="30" viewBox="0 0 30 30"><circle cx="15" cy="15" r="13" fill="none" stroke={pw.color} strokeWidth="2.5" opacity=".6" /><circle cx="15" cy="15" r="5.5" fill={pw.color} opacity=".15" /></svg>
                            <h2 style={{ fontFamily: "'Newsreader',serif", fontSize: 28, fontWeight: 400, color: pw.color }}>{pw.name}</h2>
                          </div>
                          <p style={{ fontFamily: "'Newsreader',serif", fontStyle: 'italic', color: '#7A7268', fontSize: 14 }}>{pw.sub}</p>
                        </div>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
                          <span style={{ fontSize: 10, color: C.lt, fontWeight: 600 }}>Filter:</span>
                          <button onClick={() => setActiveCenter(null)} style={{ background: !activeCenter ? C.charcoal : '#fff', color: !activeCenter ? '#fff' : C.mid, padding: '5px 12px', borderRadius: 99, fontSize: 11, fontWeight: 600, border: activeCenter ? `1px solid ${C.bdr}` : 'none', cursor: 'pointer' }}>All ({braided.length})</button>
                          {CENTERS.map(c => {
                            const cnt = c.key === 'Responsible' ? (pw.officials?.length || 0) + (pw.policies?.length || 0) : pw.resources.filter(r => r.center === c.key).length
                            if (!cnt) return null
                            return (<button key={c.key} onClick={() => setActiveCenter(activeCenter === c.key ? null : c.key)} style={{ background: activeCenter === c.key ? c.color : '#fff', color: activeCenter === c.key ? '#fff' : c.color, padding: '5px 12px', borderRadius: 99, fontSize: 11, fontWeight: 600, border: `1px solid ${activeCenter === c.key ? c.color : c.color + '30'}`, cursor: 'pointer' }}>{c.key} ({cnt})</button>)
                          })}
                        </div>
                        <div style={{ fontSize: 10, color: C.lt, marginBottom: 12, fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 6 }}><CA color={pw.color} s={14} />Click any card below to see full details, related officials, policies, and resources</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {filteredBraid.map((f: any, i: number) => (<FeedCard key={i} type={f.type} data={f.data} pwColor={pw.color} onClick={() => openPanel(f.type, f.data)} />))}
                        </div>
                        {pw.topics && (
                          <div style={{ marginTop: 20, padding: '14px 16px', background: `${pw.color}06`, borderRadius: 8, border: `1px solid ${pw.color}15` }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: pw.color, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8 }}>Explore Topics in {pw.name}</div>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{pw.topics.map(t => (<span key={t} style={{ fontSize: 11, padding: '4px 12px', borderRadius: 99, background: '#fff', border: `1px solid ${pw.color}25`, color: pw.color, fontWeight: 600, cursor: 'pointer' }}>{t}</span>))}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* PERSONA */}
                    {activePersona && (
                      <div style={{ animation: 'up .35s ease' }}>
                        <div style={{ padding: '8px 0 16px' }}>
                          <div style={{ fontFamily: "'Newsreader',serif", fontSize: 26, fontWeight: 600, color: activePersona.color }}>{activePersona.name}</div>
                          <div style={{ fontFamily: "'Newsreader',serif", fontStyle: 'italic', fontSize: 15, color: C.mid, marginTop: 4 }}>&quot;{activePersona.q}&quot;</div>
                        </div>
                        <div style={{ background: activePersona.color + '08', borderLeft: `3px solid ${activePersona.color}`, borderRadius: 4, padding: 16, marginBottom: 18 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}><CA color={activePersona.color} s={16} /><span style={{ fontSize: 10, fontWeight: 700, color: activePersona.color, textTransform: 'uppercase', letterSpacing: '.06em' }}>Your First Move</span></div>
                          <div style={{ fontSize: 13, color: C.txt, lineHeight: 1.6 }}>{activePersona.firstMove}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 10, color: C.lt, fontWeight: 600, alignSelf: 'center' }}>Your centers:</span>
                          {activePersona.centers.map((c: string) => { const cc = ctrColor(c); return <span key={c} style={{ fontSize: 11, padding: '4px 12px', borderRadius: 99, background: cc + '12', color: cc, fontWeight: 600, border: `1px solid ${cc}25` }}>{c}</span> })}
                        </div>
                        <SH title="Your Matched Pathways" extra={`${activePersona.match.length} pathways matched`} color={activePersona.color} />
                        {activePersona.match.map((pwIdx: number) => {
                          const mpw = PW[pwIdx]
                          return (
                            <div key={pwIdx} style={{ marginBottom: 16 }}>
                              <div onClick={() => pick(pwIdx)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: `${mpw.color}08`, borderRadius: 8, cursor: 'pointer', border: `1px solid ${mpw.color}18`, marginBottom: 8 }}>
                                <svg width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="11" r="9" fill="none" stroke={mpw.color} strokeWidth="2" opacity=".5" /></svg>
                                <div><div style={{ fontSize: 14, fontWeight: 700, color: mpw.color }}>{mpw.name}</div><div style={{ fontSize: 11, color: C.mid, fontStyle: 'italic' }}>{mpw.sub}</div></div>
                                <div style={{ marginLeft: 'auto', fontSize: 10, color: C.lt }}>{mpw.count} resources</div>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, paddingLeft: 8 }}>
                                {mpw.resources.slice(0, 2).map((r, ri) => (<FeedCard key={ri} type="resource" data={r} pwColor={mpw.color} onClick={() => openPanel('resource', r, pwIdx)} />))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* QA */}
                    {activeQA && (
                      <div style={{ animation: 'up .35s ease' }}>
                        <div style={{ padding: '8px 0 16px' }}>
                          <div style={{ fontFamily: "'Newsreader',serif", fontSize: 24, fontWeight: 600 }}>{activeQA.label}</div>
                          <div style={{ fontSize: 11, color: C.lt, marginTop: 4 }}>Searching: <em style={{ color: C.teal }}>{activeQA.search}</em></div>
                        </div>
                        {searchLoading && <div style={{ textAlign: 'center', padding: 20, color: C.lt, fontSize: 12 }}>Searching...</div>}
                        {activeQA.results ? (
                          <SearchResultsView results={activeQA.results} openPanel={openPanel} PW={PW} />
                        ) : !searchLoading && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {PW.flatMap((p, pi) => p.resources.slice(0, 1).map(r => ({ r, pi, pw: p }))).slice(0, 5).map(({ r, pi, pw: mpw }, i) => (<FeedCard key={i} type="resource" data={r} pwColor={mpw.color} onClick={() => openPanel('resource', r, pi)} />))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* SEARCH RESULTS */}
                    {searchResults && !activeQA && (
                      <div style={{ animation: 'up .35s ease' }}>
                        <div style={{ padding: '8px 0 16px' }}>
                          <div style={{ fontFamily: "'Newsreader',serif", fontSize: 24, fontWeight: 600 }}>Search Results</div>
                          <div style={{ fontSize: 11, color: C.lt, marginTop: 4 }}>Results for: <em style={{ color: C.teal }}>{searchVal}</em></div>
                        </div>
                        <SearchResultsView results={searchResults} openPanel={openPanel} PW={PW} />
                      </div>
                    )}

                    {/* TOPIC FILTER */}
                    {activeTopic && !searchResults && !activeQA && !open && !activePersona && (
                      <div style={{ animation: 'up .35s ease' }}>
                        <div style={{ padding: '8px 0 16px' }}>
                          <div style={{ fontFamily: "'Newsreader',serif", fontSize: 24, fontWeight: 600 }}>{activeTopic}</div>
                          <div style={{ fontSize: 11, color: C.lt, marginTop: 4 }}>Resources in this topic area</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {PW.filter(p => p.topics.includes(activeTopic)).flatMap((p, pi) =>
                            p.resources.slice(0, 4).map(r => ({ r, pi: p.id, pw: p }))
                          ).slice(0, 12).map(({ r, pi, pw: mpw }, i) => (
                            <FeedCard key={i} type="resource" data={r} pwColor={mpw.color} onClick={() => openPanel('resource', r, pi)} />
                          ))}
                          {PW.filter(p => p.topics.includes(activeTopic)).length === 0 && (
                            <div style={{ padding: 20, textAlign: 'center', color: C.lt, fontSize: 12 }}>No resources found for this topic.</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* RIGHT: circles sticky */}
                  <div className="right-col-sticky" style={{ flex: '0 0 320px', position: 'sticky', top: 80, maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
                    <TheCircles sel={sel} onSelect={pick} compact={!open} ready={ready} pathways={PW} bridgeData={BRIDGES} />
                    {open && bridges.length > 0 && (
                      <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
                        <span style={{ fontSize: 10, color: C.lt, width: '100%', textAlign: 'center', marginBottom: 2 }}>Connected to</span>
                        {bridges.map((b, i) => (
                          <button key={i} onClick={() => pick(b.idx)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: `${b.color}10`, color: b.color, border: `1px solid ${b.color}25`, borderRadius: 99, padding: '3px 10px 3px 6px', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
                            <svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="4" fill="none" stroke={b.color} strokeWidth="1.5" opacity=".5" /></svg>
                            {b.name}<span style={{ fontSize: 9, opacity: .5, marginLeft: 1 }}>{b.shared}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ textAlign: 'center', padding: '24px 20px', borderTop: `1px solid ${C.bdr}` }}>
            <div style={{ fontSize: 10, color: C.lt }}>The Community Exchange -- a product of The Change Engine</div>
            <div style={{ fontSize: 9, color: C.lt2, marginTop: 2 }}>{STATS.resources} resources, {STATS.officials} officials, {STATS.policies} policies, {STATS.focusAreas} focus areas -- live from database</div>
          </div>
        </main>
      </div>
    </div>
  )
}

// ── Search Results View ──
function SearchResultsView({ results, openPanel, PW }: { results: any; openPanel: (type: string, data: any, pwIdx?: number) => void; PW: CirclePathway[] }) {
  const hasContent = results.content?.length > 0
  const hasOfficials = results.officials?.length > 0
  const hasPolicies = results.policies?.length > 0
  const hasServices = results.services?.length > 0
  const hasSituations = results.situations?.length > 0
  const total = (results.content?.length || 0) + (results.officials?.length || 0) + (results.policies?.length || 0) + (results.services?.length || 0) + (results.situations?.length || 0)

  if (total === 0) return <div style={{ padding: 20, textAlign: 'center', color: C.lt, fontSize: 12 }}>No results found. Try a different search term.</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, color: C.lt }}>{total} results found</div>
      {hasContent && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.orange, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 6 }}>Resources ({results.content.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {results.content.slice(0, 10).map((c: any) => {
              const matchPw = PW.find(p => p.key === c.pathway_primary)
              return (
                <div key={c.id} onClick={() => openPanel('resource', { id: c.id, title: c.title_6th_grade, center: c.center, summary: c.summary_6th_grade, source_url: c.source_url })} className="ch" style={{ padding: '10px 14px', background: C.card, border: `1px solid ${C.bdr}`, borderRadius: 6, cursor: 'pointer', borderLeft: `3px solid ${matchPw?.color || C.orange}` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.charcoal, lineHeight: 1.3 }}>{c.title_6th_grade}</div>
                  {c.summary_6th_grade && <div style={{ fontSize: 10, color: C.mid, marginTop: 3, lineHeight: 1.5 }}>{c.summary_6th_grade.slice(0, 120)}{c.summary_6th_grade.length > 120 ? '...' : ''}</div>}
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    {c.center && <span style={{ fontSize: 8, padding: '1px 6px', borderRadius: 3, background: ctrColor(c.center) + '15', color: ctrColor(c.center), fontWeight: 600 }}>{c.center}</span>}
                    {matchPw && <span style={{ fontSize: 8, color: matchPw.color, fontWeight: 600 }}>{matchPw.name}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
      {hasOfficials && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.teal, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 6 }}>Officials ({results.officials.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {results.officials.slice(0, 8).map((o: any) => (
              <div key={o.official_id} onClick={() => openPanel('official', { id: o.official_id, name: o.official_name, role: o.title || '', level: o.level || '', phone: o.office_phone || '', website: o.website })} className="ch" style={{ padding: '10px 14px', background: C.card, border: `1px solid ${C.bdr}`, borderRadius: 6, cursor: 'pointer', borderLeft: `3px solid ${lvlColor(o.level)}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.charcoal }}>{o.official_name}</div>
                <div style={{ fontSize: 10, color: C.mid, marginTop: 2 }}>{o.title} · {o.level}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {hasPolicies && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#8B7D3C', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 6 }}>Policies ({results.policies.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {results.policies.slice(0, 6).map((p: any) => (
              <div key={p.policy_id} onClick={() => openPanel('policy', { id: p.policy_id, name: p.policy_name || p.bill_number || '', status: p.status || '', level: p.level || '', desc: p.summary_5th_grade || '' })} className="ch" style={{ padding: '10px 14px', background: C.card, border: `1px solid ${C.bdr}`, borderRadius: 6, cursor: 'pointer', borderLeft: `3px solid ${stColor(p.status)}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.charcoal }}>{p.policy_name || p.bill_number}</div>
                <div style={{ fontSize: 10, color: C.mid, marginTop: 2 }}>{p.status} · {p.level}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {hasServices && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#5B8A8A', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 6 }}>Services ({results.services.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {results.services.slice(0, 6).map((s: any, i: number) => (
              <div key={i} className="ch" style={{ padding: '10px 14px', background: C.card, border: `1px solid ${C.bdr}`, borderRadius: 6, borderLeft: '3px solid #5B8A8A' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.charcoal }}>{s.service_name}</div>
                {s.org_name && <div style={{ fontSize: 10, color: C.mid, marginTop: 2 }}>{s.org_name}</div>}
                {s.phone && <div style={{ fontSize: 10, color: C.teal, marginTop: 2 }}>{s.phone}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
      {hasSituations && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#7B6BA8', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 6 }}>I Need Help ({results.situations.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {results.situations.slice(0, 6).map((s: any) => (
              <a key={s.situation_id} href={`/help/${s.situation_slug}`} style={{ display: 'block', padding: '10px 14px', background: C.card, border: `1px solid ${C.bdr}`, borderRadius: 6, borderLeft: '3px solid #7B6BA8', textDecoration: 'none' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.charcoal }}>{s.situation_name}</div>
                {s.description_5th_grade && <div style={{ fontSize: 10, color: C.mid, marginTop: 2 }}>{s.description_5th_grade.slice(0, 100)}...</div>}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Shared Components ──
function SBtn({ children, active, onClick, dot, count }: { children: React.ReactNode; active?: boolean; onClick?: () => void; dot?: string; count?: number }) {
  return (
    <button onClick={onClick} style={{ fontSize: 11, fontWeight: active ? 700 : 600, display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 3, width: '100%', textAlign: 'left', border: 'none', background: active ? 'rgba(61,90,90,.07)' : 'transparent', color: active ? C.charcoal : C.mid, cursor: 'pointer', transition: 'all .12s' }}>
      {dot && <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot, flexShrink: 0 }} />}
      <span style={{ flex: 1, textAlign: 'left' }}>{children}</span>
      {count != null && <span style={{ fontSize: 9, color: C.lt }}>{count}</span>}
    </button>
  )
}

function SL({ children, click }: { children: React.ReactNode; click?: () => void }) {
  return <div onClick={click} style={{ fontSize: 8, fontWeight: 700, letterSpacing: '.14em', color: C.lt, textTransform: 'uppercase', padding: '5px 10px 2px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: click ? 'pointer' : 'default', userSelect: 'none' }}>{children}</div>
}

function Ch({ open }: { open: boolean }) {
  return <span style={{ fontSize: 8, transition: 'transform .15s', transform: open ? 'rotate(180deg)' : 'none', display: 'inline-block' }}>{'\u25BC'}</span>
}

function Dv() {
  return <div style={{ height: 1, background: C.bdr, margin: '6px 0' }} />
}
