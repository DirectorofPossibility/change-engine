'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Info } from 'lucide-react'

const TOGGLE_KEY = 'ce-tips-enabled'

/** Check if tips are globally enabled (default: true) */
function areTipsEnabled(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(TOGGLE_KEY) !== 'false'
}

interface InfoBubbleProps {
  id: string
  text: string
  /** Where the bubble appears relative to the icon */
  position?: 'top' | 'bottom' | 'left' | 'right'
  /** Horizontal alignment for top/bottom positions */
  align?: 'center' | 'start' | 'end'
  accent?: string
}

export function InfoBubble({ id, text, position = 'bottom', align = 'start', accent = '#C75B2A' }: InfoBubbleProps) {
  const [enabled, setEnabled] = useState(false)
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLSpanElement>(null)

  useEffect(function () {
    setEnabled(areTipsEnabled())
  }, [])

  // Listen for global toggle
  useEffect(function () {
    function handleToggle(e: Event) {
      const detail = (e as CustomEvent).detail
      if (detail && !detail.enabled) {
        setEnabled(false)
        setOpen(false)
      }
    }
    window.addEventListener('ce-tips-toggle', handleToggle)
    return function () { window.removeEventListener('ce-tips-toggle', handleToggle) }
  }, [])

  // Close on click outside
  useEffect(function () {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return function () { document.removeEventListener('mousedown', handleClick) }
  }, [open])

  // Close on Escape
  useEffect(function () {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return function () { document.removeEventListener('keydown', handleKey) }
  }, [open])

  if (!enabled) return null

  const alignClass = align === 'center'
    ? 'left-1/2 -translate-x-1/2'
    : align === 'end'
      ? 'right-0'
      : 'left-0'

  const caretAlignClass = align === 'center'
    ? 'left-1/2 -translate-x-1/2'
    : align === 'end'
      ? 'right-6'
      : 'left-6'

  const arrowMap: Record<string, string> = {
    top: 'bottom-full mb-2 ' + alignClass,
    bottom: 'top-full mt-2 ' + alignClass,
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
  }

  const caretMap: Record<string, string> = {
    top: 'top-full ' + caretAlignClass + ' -mt-1 border-l-transparent border-r-transparent border-b-transparent border-t-white',
    bottom: 'bottom-full ' + caretAlignClass + ' -mb-1 border-l-transparent border-r-transparent border-t-transparent border-b-white',
    left: 'left-full top-1/2 -translate-y-1/2 -ml-1 border-t-transparent border-b-transparent border-r-transparent border-l-white',
    right: 'right-full top-1/2 -translate-y-1/2 -mr-1 border-t-transparent border-b-transparent border-l-transparent border-r-white',
  }

  return (
    <span ref={wrapperRef} className="relative inline-flex items-center">
      <button
        onClick={function () { setOpen(!open) }}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-brand-border hover:border-brand-muted transition-colors"
        aria-label={'Tip: ' + id}
        aria-expanded={open}
      >
        <Info size={10} style={{ color: accent }} />
      </button>

      {open && (
        <div
          className={'absolute z-50 animate-fade-up ' + arrowMap[position]}
          style={{ maxWidth: 300, minWidth: 200 }}
        >
          <div className="bg-white rounded-xl shadow-lg border-2 border-brand-border p-3.5 relative">
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl" style={{ background: accent }} />
            <div className="flex gap-2.5 items-start pt-1">
              <Info size={14} className="flex-shrink-0 mt-0.5" style={{ color: accent }} />
              <p className="text-[13px] leading-relaxed text-brand-text flex-1">{text}</p>
              <button
                onClick={function () { setOpen(false) }}
                className="flex-shrink-0 p-0.5 rounded hover:bg-brand-bg-alt transition-colors"
                aria-label="Close tip"
              >
                <X size={14} className="text-brand-muted" />
              </button>
            </div>
          </div>
          <div className={'absolute w-0 h-0 border-[6px] ' + caretMap[position]} />
        </div>
      )}
    </span>
  )
}

/** Reset all dismissed tooltips — kept for API compatibility */
export function resetAllTips() {
  // No-op: tips are now click-to-open, no dismiss state needed
}

