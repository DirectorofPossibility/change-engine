'use client'

import { useState, useEffect } from 'react'
import { X, Info } from 'lucide-react'

const STORAGE_KEY = 'ce-dismissed-tips'

function getDismissed(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch { return [] }
}

function dismiss(id: string) {
  const list = getDismissed()
  if (!list.includes(id)) {
    list.push(id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  }
}

interface InfoBubbleProps {
  id: string
  text: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  accent?: string
}

export function InfoBubble({ id, text, position = 'bottom', accent = '#C75B2A' }: InfoBubbleProps) {
  const [visible, setVisible] = useState(false)

  useEffect(function () {
    const timer = setTimeout(function () {
      if (!getDismissed().includes(id)) {
        setVisible(true)
      }
    }, 300)
    return function () { clearTimeout(timer) }
  }, [id])

  if (!visible) return null

  function handleDismiss() {
    setVisible(false)
    dismiss(id)
  }

  const arrowMap: Record<string, string> = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
  }

  const caretMap: Record<string, string> = {
    top: 'top-full left-1/2 -translate-x-1/2 -mt-1 border-l-transparent border-r-transparent border-b-transparent border-t-white',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 -mb-1 border-l-transparent border-r-transparent border-t-transparent border-b-white',
    left: 'left-full top-1/2 -translate-y-1/2 -ml-1 border-t-transparent border-b-transparent border-r-transparent border-l-white',
    right: 'right-full top-1/2 -translate-y-1/2 -mr-1 border-t-transparent border-b-transparent border-l-transparent border-r-white',
  }

  return (
    <div
      className={'absolute z-50 animate-fade-up ' + arrowMap[position]}
      style={{ maxWidth: 300, minWidth: 200 }}
    >
      <div className="bg-white rounded-xl shadow-lg border border-brand-border p-3.5 relative">
        {/* Accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl" style={{ background: accent }} />

        <div className="flex gap-2.5 items-start pt-1">
          <Info size={14} className="flex-shrink-0 mt-0.5" style={{ color: accent }} />
          <p className="text-[13px] leading-relaxed text-brand-text flex-1">{text}</p>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-0.5 rounded hover:bg-brand-bg-alt transition-colors"
            aria-label="Dismiss tip"
          >
            <X size={14} className="text-brand-muted" />
          </button>
        </div>
      </div>
      {/* Caret */}
      <div className={'absolute w-0 h-0 border-[6px] ' + caretMap[position]} />
    </div>
  )
}

/** Reset all dismissed tooltips — useful for testing */
export function resetAllTips() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY)
  }
}
