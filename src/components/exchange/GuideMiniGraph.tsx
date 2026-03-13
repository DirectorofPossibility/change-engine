'use client'

import { useRouter } from 'next/navigation'
import { usePanZoom } from '@/lib/hooks/usePanZoom'

interface GuideMiniGraphProps {
  guideTitle: string
  focusAreas: Array<{ focus_id: string; focus_area_name: string; theme_id: string | null }>
  relatedOrgs: Array<{ org_id: string; org_name: string }>
  relatedServices: number
  relatedContent: number
}

const THEME_COLORS: Record<string, string> = {
  THEME_01: '#1a6b56',
  THEME_02: '#1e4d7a',
  THEME_03: '#4a2870',
  THEME_04: '#7a2018',
  THEME_05: '#6a4e10',
  THEME_06: '#1a5030',
  THEME_07: '#1b5e8a',
}

function themeColor(themeId: string | null): string {
  return (themeId && THEME_COLORS[themeId]) || '#718096'
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + '\u2026' : text
}

export function GuideMiniGraph({ guideTitle, focusAreas, relatedOrgs, relatedServices, relatedContent }: GuideMiniGraphProps) {
  const router = useRouter()
  const pz = usePanZoom({ minZoom: 0.5, maxZoom: 4 })
  const cx = 150
  const cy = 150
  const r1 = 70
  const r2 = 120

  const faSlice = focusAreas.slice(0, 8)
  const orgSlice = relatedOrgs.slice(0, 6)

  const faPoints = faSlice.map((fa, i) => {
    const angle = (2 * Math.PI * i) / Math.max(faSlice.length, 1) - Math.PI / 2
    return { ...fa, x: cx + r1 * Math.cos(angle), y: cy + r1 * Math.sin(angle) }
  })

  const outerItems = [
    ...orgSlice.map(o => ({ type: 'org' as const, id: o.org_id, label: o.org_name })),
    ...(relatedServices > 0 ? [{ type: 'badge' as const, id: 'svc', label: relatedServices + ' services' }] : []),
    ...(relatedContent > 0 ? [{ type: 'badge' as const, id: 'cnt', label: relatedContent + ' articles' }] : []),
  ]
  const outerPoints = outerItems.map((item, i) => {
    const angle = (2 * Math.PI * i) / Math.max(outerItems.length, 1) - Math.PI / 2
    return { ...item, x: cx + r2 * Math.cos(angle), y: cy + r2 * Math.sin(angle) }
  })

  return (
    <div
      ref={pz.containerRef}
      {...pz.containerHandlers}
      className="w-full relative"
      style={{ overflow: 'hidden', cursor: pz.cursor, touchAction: 'none' }}
    >
    {pz.zoom !== 1 && (
      <button onClick={pz.resetView} style={{
        position: 'absolute', bottom: 4, right: 4, zIndex: 10,
        padding: '3px 8px', borderRadius: 6, fontSize: 9, fontWeight: 600,
        background: '#fff', border: '1px solid #e2e8f0', color: '#718096',
        cursor: 'pointer',
      }}>Reset</button>
    )}
    <svg viewBox="0 0 300 300" className="w-full" role="img" aria-label={'Knowledge graph for ' + guideTitle} style={pz.svgStyle}>
      {/* Lines: center to focus areas */}
      {faPoints.map(fa => (
        <line key={'lc-' + fa.focus_id} x1={cx} y1={cy} x2={fa.x} y2={fa.y} stroke="#e2e8f0" strokeWidth={1} />
      ))}
      {/* Lines: focus areas to nearest outer items */}
      {faPoints.map((fa, fi) => {
        const nearestOuter = outerPoints[fi % outerPoints.length]
        return nearestOuter ? (
          <line key={'lo-' + fa.focus_id} x1={fa.x} y1={fa.y} x2={nearestOuter.x} y2={nearestOuter.y} stroke="#e2e8f0" strokeWidth={0.5} />
        ) : null
      })}

      {/* Outer ring items */}
      {outerPoints.map(item => (
        <g key={item.id}
          className={item.type === 'org' ? 'cursor-pointer' : ''}
          onClick={item.type === 'org' ? () => router.push('/organizations/' + item.id) : undefined}
        >
          <circle cx={item.x} cy={item.y} r={item.type === 'badge' ? 14 : 6}
            fill={item.type === 'badge' ? '#E8723A' : '#a0aec0'} opacity={0.8} />
          {item.type === 'badge' && (
            <text x={item.x} y={item.y + 1} textAnchor="middle" dominantBaseline="middle"
              fontSize={6} fill="white" fontWeight={600}>{item.label}</text>
          )}
          {item.type === 'org' && (
            <text x={item.x} y={item.y + 14} textAnchor="middle" fontSize={6} fill="#718096">
              {truncate(item.label, 16)}
            </text>
          )}
        </g>
      ))}

      {/* Focus area nodes */}
      {faPoints.map(fa => (
        <g key={fa.focus_id} className="cursor-pointer" onClick={() => router.push('/explore/focus/' + fa.focus_id)}>
          <circle cx={fa.x} cy={fa.y} r={10} fill={themeColor(fa.theme_id)} opacity={0.85} />
          <text x={fa.x} y={fa.y + 18} textAnchor="middle" fontSize={6.5} fill="#4a5568" fontWeight={500}>
            {truncate(fa.focus_area_name, 18)}
          </text>
        </g>
      ))}

      {/* Center node */}
      <circle cx={cx} cy={cy} r={24} fill="#E8723A" />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
        fontSize={7} fill="white" fontWeight={600}>
        {truncate(guideTitle, 20)}
      </text>
    </svg>
    </div>
  )
}
