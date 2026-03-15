'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import type { GraphNode, GraphEdge } from '@/lib/data/dashboard'

const SUBTYPE_COLORS: Record<string, string> = {
  organization: '#C65D28',
  content: '#3D7A7A',
  policy: '#6366f1',
  foundation: '#059669',
  official: '#dc2626',
  opportunity: '#f59e0b',
  campaign: '#ec4899',
  service: '#0d9488',
  focus_area: '#8b5cf6',
  sdg: '#0ea5e9',
  pathway: '#D4654A',
  audience_segment: '#64748b',
  service_category: '#14b8a6',
}

const SUBTYPE_RADIUS: Record<string, number> = {
  pathway: 10,
  sdg: 9,
  focus_area: 4,
  audience_segment: 7,
  service_category: 7,
  organization: 7,
  content: 5,
  policy: 6,
  foundation: 7,
  official: 6,
  opportunity: 6,
  campaign: 6,
  service: 6,
}

/** BFS to find all nodes within `depth` hops of a root node */
function bfsLevels(root: string, adjacency: Map<string, Set<string>>, maxDepth: number): Map<string, number> {
  const visited = new Map<string, number>()
  visited.set(root, 0)
  const queue: string[] = [root]
  let head = 0
  while (head < queue.length) {
    const current = queue[head++]
    const level = visited.get(current)!
    if (level >= maxDepth) continue
    const neighbors = adjacency.get(current)
    if (!neighbors) continue
    const neighborArr = Array.from(neighbors)
    for (const n of neighborArr) {
      if (!visited.has(n)) {
        visited.set(n, level + 1)
        queue.push(n)
      }
    }
  }
  return visited
}

interface SimNode extends GraphNode {
  x: number
  y: number
  vx: number
  vy: number
  degree: number
}

interface Props {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export function ForceGraph({ nodes, edges }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const simNodesRef = useRef<SimNode[]>([])
  const edgesRef = useRef<GraphEdge[]>(edges)
  const animRef = useRef<number>(0)
  const [selectedNode, setSelectedNode] = useState<SimNode | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [depth, setDepth] = useState(2)

  // Camera state
  const camRef = useRef({ x: 0, y: 0, zoom: 1 })
  const dragRef = useRef<{ dragging: boolean; lastX: number; lastY: number }>({ dragging: false, lastX: 0, lastY: 0 })

  // Build adjacency for highlighting
  const adjacencyRef = useRef<Map<string, Set<string>>>(new Map())

  useEffect(() => {
    // Compute degree for each node
    const degreeMap = new Map<string, number>()
    const adjacency = new Map<string, Set<string>>()
    for (const e of edges) {
      degreeMap.set(e.source, (degreeMap.get(e.source) ?? 0) + 1)
      degreeMap.set(e.target, (degreeMap.get(e.target) ?? 0) + 1)
      if (!adjacency.has(e.source)) adjacency.set(e.source, new Set())
      if (!adjacency.has(e.target)) adjacency.set(e.target, new Set())
      adjacency.get(e.source)!.add(e.target)
      adjacency.get(e.target)!.add(e.source)
    }
    adjacencyRef.current = adjacency

    // Filter out orphan focus_areas (too many) — keep only those with edges
    const connectedIds = new Set<string>()
    for (const e of edges) {
      connectedIds.add(e.source)
      connectedIds.add(e.target)
    }

    const filteredNodes = nodes.filter(n => {
      if (n.subtype === 'focus_area' && !connectedIds.has(n.id)) return false
      return true
    })

    // Initialize positions in a radial layout grouped by subtype
    const subtypeGroups = new Map<string, GraphNode[]>()
    for (const n of filteredNodes) {
      const group = subtypeGroups.get(n.subtype) || []
      group.push(n)
      subtypeGroups.set(n.subtype, group)
    }

    const simNodes: SimNode[] = []
    let groupIdx = 0
    const totalGroups = subtypeGroups.size
    for (const [, group] of Array.from(subtypeGroups)) {
      const angle = (groupIdx / totalGroups) * Math.PI * 2
      const cx = Math.cos(angle) * 300
      const cy = Math.sin(angle) * 300
      for (let i = 0; i < group.length; i++) {
        const spread = Math.sqrt(group.length) * 20
        simNodes.push({
          ...group[i],
          x: cx + (Math.random() - 0.5) * spread,
          y: cy + (Math.random() - 0.5) * spread,
          vx: 0,
          vy: 0,
          degree: degreeMap.get(group[i].id) ?? 0,
        })
      }
      groupIdx++
    }

    simNodesRef.current = simNodes
    edgesRef.current = edges

    // Build node index for edge lookups
    const nodeIndex = new Map<string, number>()
    simNodes.forEach((n, i) => nodeIndex.set(n.id, i))

    // Simple force simulation
    let iteration = 0
    const maxIterations = 300

    function simulate() {
      const nodes = simNodesRef.current
      const alpha = Math.max(0.001, 1 - iteration / maxIterations)

      // Repulsion (Barnes-Hut approximation: just use all pairs for small graphs, limit for large)
      const repulseStrength = 800 * alpha
      const len = nodes.length
      for (let i = 0; i < len; i++) {
        for (let j = i + 1; j < len; j++) {
          const dx = nodes[j].x - nodes[i].x
          const dy = nodes[j].y - nodes[i].y
          const dist2 = dx * dx + dy * dy + 1
          const force = repulseStrength / dist2
          const fx = dx * force
          const fy = dy * force
          nodes[i].vx -= fx
          nodes[i].vy -= fy
          nodes[j].vx += fx
          nodes[j].vy += fy
        }
      }

      // Attraction along edges
      const attractStrength = 0.05 * alpha
      for (const e of edgesRef.current) {
        const si = nodeIndex.get(e.source)
        const ti = nodeIndex.get(e.target)
        if (si === undefined || ti === undefined) continue
        const dx = nodes[ti].x - nodes[si].x
        const dy = nodes[ti].y - nodes[si].y
        const fx = dx * attractStrength
        const fy = dy * attractStrength
        nodes[si].vx += fx
        nodes[si].vy += fy
        nodes[ti].vx -= fx
        nodes[ti].vy -= fy
      }

      // Center gravity
      const gravityStrength = 0.02
      for (const n of nodes) {
        n.vx -= n.x * gravityStrength
        n.vy -= n.y * gravityStrength
      }

      // Apply velocity with damping
      const damping = 0.6
      for (const n of nodes) {
        n.vx *= damping
        n.vy *= damping
        n.x += n.vx
        n.y += n.vy
      }

      iteration++
    }

    function draw() {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)

      const w = rect.width
      const h = rect.height
      const cam = camRef.current

      ctx.clearRect(0, 0, w, h)
      ctx.save()
      ctx.translate(w / 2 + cam.x, h / 2 + cam.y)
      ctx.scale(cam.zoom, cam.zoom)

      const nodes = simNodesRef.current
      const nodeMap = new Map<string, SimNode>()
      for (const n of nodes) nodeMap.set(n.id, n)

      // Multi-level BFS from selected node
      const reachable = selectedNode ? bfsLevels(selectedNode.id, adjacencyRef.current, depth) : null

      // Draw edges
      ctx.lineWidth = 0.3
      for (const e of edgesRef.current) {
        const s = nodeMap.get(e.source)
        const t = nodeMap.get(e.target)
        if (!s || !t) continue

        if (reachable) {
          const sLevel = reachable.get(s.id)
          const tLevel = reachable.get(t.id)
          if (sLevel !== undefined && tLevel !== undefined) {
            // Edge is within the reachable subgraph
            const maxLevel = Math.max(sLevel, tLevel)
            const opacity = Math.max(0.2, 0.7 - maxLevel * 0.15)
            ctx.strokeStyle = `rgba(199, 91, 42, ${opacity})`
            ctx.lineWidth = Math.max(0.5, 2 - maxLevel * 0.4)
          } else {
            ctx.strokeStyle = 'rgba(0,0,0,0.02)'
            ctx.lineWidth = 0.15
          }
        } else {
          ctx.strokeStyle = 'rgba(0,0,0,0.12)'
          ctx.lineWidth = 0.4
        }

        ctx.beginPath()
        ctx.moveTo(s.x, s.y)
        ctx.lineTo(t.x, t.y)
        ctx.stroke()
      }

      // Draw nodes
      const searchLower = search.toLowerCase()
      for (const n of nodes) {
        if (filter !== 'all' && n.subtype !== filter) continue

        const r = SUBTYPE_RADIUS[n.subtype] ?? 5
        const color = SUBTYPE_COLORS[n.subtype] ?? '#999'

        let alpha = 1
        if (reachable) {
          const level = reachable.get(n.id)
          if (level !== undefined) {
            alpha = Math.max(0.3, 1 - level * 0.15)
          } else {
            alpha = 0.06
          }
        }
        if (searchLower && !n.label.toLowerCase().includes(searchLower)) {
          alpha *= 0.1
        }

        ctx.globalAlpha = alpha
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(n.x, n.y, r + Math.min(n.degree * 0.3, 6), 0, Math.PI * 2)
        ctx.fill()

        // Label for large/selected nodes
        if (cam.zoom > 1.5 || n.id === selectedNode?.id || (n.degree > 10 && cam.zoom > 0.8)) {
          ctx.fillStyle = '#2D2D2D'
          ctx.font = `${Math.max(8, 10 / cam.zoom)}px sans-serif`
          ctx.textAlign = 'center'
          ctx.fillText(n.label.slice(0, 30), n.x, n.y - r - 4)
        }
        ctx.globalAlpha = 1
      }

      ctx.restore()

      if (iteration < maxIterations) {
        simulate()
      }
      animRef.current = requestAnimationFrame(draw)
    }

    // Run initial simulation steps
    for (let i = 0; i < 50; i++) simulate()

    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [nodes, edges, selectedNode, filter, search, depth])

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    dragRef.current = { dragging: true, lastX: e.clientX, lastY: e.clientY }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current.dragging) return
    const dx = e.clientX - dragRef.current.lastX
    const dy = e.clientY - dragRef.current.lastY
    camRef.current.x += dx
    camRef.current.y += dy
    dragRef.current.lastX = e.clientX
    dragRef.current.lastY = e.clientY
  }, [])

  const handleMouseUp = useCallback(() => {
    dragRef.current.dragging = false
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    camRef.current.zoom = Math.max(0.1, Math.min(10, camRef.current.zoom * delta))
  }, [])

  const handleClick = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const cam = camRef.current
    const mx = (e.clientX - rect.left - rect.width / 2 - cam.x) / cam.zoom
    const my = (e.clientY - rect.top - rect.height / 2 - cam.y) / cam.zoom

    let closest: SimNode | null = null
    let closestDist = Infinity
    for (const n of simNodesRef.current) {
      const r = (SUBTYPE_RADIUS[n.subtype] ?? 5) + Math.min(n.degree * 0.3, 6)
      const dx = n.x - mx
      const dy = n.y - my
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < r + 5 && dist < closestDist) {
        closest = n
        closestDist = dist
      }
    }
    setSelectedNode(closest)
  }, [])

  // Unique subtypes for filter
  const subtypes = Array.from(new Set(nodes.map(n => n.subtype))).sort()

  return (
    <div className="relative w-full h-full">
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
        <input
          type="text"
          placeholder="Search nodes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white shadow-sm w-48"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white shadow-sm"
        >
          <option value="all">All types</option>
          {subtypes.map(st => (
            <option key={st} value={st}>{st.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <div className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg shadow-sm">
          <span className="text-gray-500 text-xs font-medium">Depth:</span>
          {[1, 2, 3, 4].map(d => (
            <button
              key={d}
              onClick={() => setDepth(d)}
              className={'w-6 h-6 rounded text-xs font-bold transition-colors ' + (depth === d ? 'bg-[#C75B2A] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}
            >
              {d}
            </button>
          ))}
        </div>
        <button
          onClick={() => { camRef.current = { x: 0, y: 0, zoom: 1 }; setSelectedNode(null); setSearch(''); setDepth(2) }}
          className="px-3 py-1.5 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          Reset
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/90 backdrop-blur rounded-lg p-3 shadow-sm text-xs">
        <div className="grid grid-cols-3 gap-x-4 gap-y-1">
          {Object.entries(SUBTYPE_COLORS).map(([key, color]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-gray-600">{key.replace(/_/g, ' ')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Node detail panel */}
      {selectedNode && (
        <div className="absolute top-4 right-4 z-10 bg-white rounded-xl shadow-lg border border-gray-200 p-4 w-72">
          <div className="flex items-center justify-between mb-2">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: SUBTYPE_COLORS[selectedNode.subtype] }}
            />
            <span className="text-xs text-gray-500 uppercase tracking-wide">{selectedNode.subtype.replace(/_/g, ' ')}</span>
            <button onClick={() => setSelectedNode(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
          </div>
          <h3 className="font-semibold text-gray-900 text-sm">{selectedNode.label}</h3>
          <p className="text-xs text-gray-500 mt-1">Type: {selectedNode.type} &middot; {selectedNode.subtype.replace(/_/g, ' ')}</p>
          <p className="text-xs text-gray-500">Direct connections: {selectedNode.degree}</p>
          {(() => {
            const levels = bfsLevels(selectedNode.id, adjacencyRef.current, depth)
            const nodeMap = new Map(simNodesRef.current.map(n => [n.id, n]))
            const grouped: Map<number, SimNode[]> = new Map()
            for (const [id, lvl] of Array.from(levels.entries())) {
              if (lvl === 0) continue
              const node = nodeMap.get(id)
              if (!node) continue
              if (!grouped.has(lvl)) grouped.set(lvl, [])
              grouped.get(lvl)!.push(node)
            }
            const totalReachable = Array.from(levels.values()).filter(v => v > 0).length
            return (
              <>
                <p className="text-xs font-medium mt-1" style={{ color: '#C75B2A' }}>
                  {totalReachable} reachable within {depth} levels
                </p>
                <div className="mt-3 border-t border-gray-200 pt-2 max-h-60 overflow-y-auto space-y-3">
                  {Array.from(grouped.entries()).sort((a, b) => a[0] - b[0]).map(([lvl, nodeList]) => (
                    <div key={lvl}>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                        Level {lvl} ({nodeList.length})
                      </p>
                      <div className="space-y-0.5">
                        {nodeList.slice(0, 15).map(n => (
                          <button
                            key={n.id}
                            onClick={() => setSelectedNode(n)}
                            className="block text-left text-xs text-gray-500 hover:text-gray-900 w-full truncate"
                          >
                            <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: SUBTYPE_COLORS[n.subtype] }} />
                            {n.label}
                          </button>
                        ))}
                        {nodeList.length > 15 && (
                          <span className="text-[10px] text-gray-400 pl-3">+{nodeList.length - 15} more</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )
          })()}
        </div>
      )}

      <div ref={containerRef} className="w-full h-full">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onClick={handleClick}
        />
      </div>
    </div>
  )
}
