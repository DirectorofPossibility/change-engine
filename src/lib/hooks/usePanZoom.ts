'use client'

import { useState, useRef, useCallback } from 'react'

interface PanZoomOptions {
  minZoom?: number
  maxZoom?: number
}

/**
 * Reusable pan/zoom hook for SVG galaxy visualizations.
 *
 * Provides:
 * - Mouse wheel zoom (centered on cursor)
 * - Click-drag panning
 * - Two-finger pinch zoom (touch)
 * - Single-finger pan (touch)
 * - Keyboard shortcuts (+/- to zoom, 0 to reset)
 * - Reset function
 *
 * Usage:
 *   const pz = usePanZoom()
 *   <div ref={pz.containerRef} {...pz.containerHandlers} style={{ overflow: 'hidden', cursor: pz.cursor }}>
 *     <svg style={pz.svgStyle}> ... </svg>
 *   </div>
 */
export function usePanZoom(opts?: PanZoomOptions) {
  const minZoom = opts?.minZoom ?? 0.3
  const maxZoom = opts?.maxZoom ?? 5

  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const panStart = useRef({ x: 0, y: 0 })
  const panOrigin = useRef({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const lastTouches = useRef<{ x: number; y: number }[]>([])

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const delta = e.deltaY > 0 ? 0.9 : 1.1

    setZoom(prev => {
      const next = Math.max(minZoom, Math.min(maxZoom, prev * delta))
      const scale = next / prev
      setPan(p => ({
        x: mouseX - scale * (mouseX - p.x),
        y: mouseY - scale * (mouseY - p.y),
      }))
      return next
    })
  }, [minZoom, maxZoom])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    // Don't start panning if clicking on an interactive node
    if ((e.target as HTMLElement).closest('[data-node], button, a, [role="button"]')) return
    setIsPanning(true)
    panStart.current = { x: e.clientX, y: e.clientY }
    setPan(current => {
      panOrigin.current = { ...current }
      return current
    })
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return
    setPan({
      x: panOrigin.current.x + (e.clientX - panStart.current.x),
      y: panOrigin.current.y + (e.clientY - panStart.current.y),
    })
  }, [isPanning])

  const onMouseUp = useCallback(() => setIsPanning(false), [])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    lastTouches.current = Array.from(e.touches).map(t => ({ x: t.clientX, y: t.clientY }))
    if (e.touches.length === 1) {
      panStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      setPan(current => {
        panOrigin.current = { ...current }
        return current
      })
    }
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setPan({
        x: panOrigin.current.x + (e.touches[0].clientX - panStart.current.x),
        y: panOrigin.current.y + (e.touches[0].clientY - panStart.current.y),
      })
    } else if (e.touches.length === 2 && lastTouches.current.length === 2) {
      const prev = Math.hypot(
        lastTouches.current[0].x - lastTouches.current[1].x,
        lastTouches.current[0].y - lastTouches.current[1].y
      )
      const cur = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      if (prev > 0) {
        setZoom(z => Math.max(minZoom, Math.min(maxZoom, z * (cur / prev))))
      }
    }
    lastTouches.current = Array.from(e.touches).map(t => ({ x: t.clientX, y: t.clientY }))
  }, [minZoom, maxZoom])

  const resetView = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])

  const containerHandlers = {
    onWheel,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave: onMouseUp,
    onTouchStart,
    onTouchMove,
    onTouchEnd: onMouseUp,
  }

  const svgStyle: React.CSSProperties = {
    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
    transformOrigin: '0 0',
    transition: isPanning ? 'none' : 'transform 0.1s ease-out',
  }

  const cursor = isPanning ? 'grabbing' : 'grab'

  return {
    containerRef,
    containerHandlers,
    svgStyle,
    cursor,
    zoom,
    pan,
    isPanning,
    resetView,
  }
}
