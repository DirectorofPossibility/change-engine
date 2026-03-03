/**
 * @fileoverview Accessible slide-in panel with focus trap and Escape key dismissal.
 *
 * Renders a right-aligned overlay panel that slides in from the edge of the
 * viewport. Shares the same accessibility behavior as {@link Modal}: body
 * scroll locking, auto-focus on open, Tab/Shift+Tab focus trapping, Escape
 * key dismissal, and backdrop click to close. Uses `role="dialog"` and
 * `aria-modal="true"` for screen-reader support.
 */
'use client'

import { useEffect, useRef, useCallback } from 'react'

interface SlidePanelProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

/**
 * Accessible slide-in side panel with the same a11y features as Modal.
 *
 * @param props.open - Whether the panel is currently visible.
 * @param props.onClose - Callback invoked when the user dismisses the panel.
 * @param props.title - Optional heading displayed in the sticky header bar.
 * @param props.children - Panel body content.
 */
export function SlidePanel({ open, onClose, title, children }: SlidePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      panelRef.current?.focus()
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
      return
    }
    if (e.key === 'Tab') {
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (!focusable || focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }, [onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Panel'}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="relative w-full max-w-2xl bg-white shadow-xl overflow-y-auto outline-none"
      >
        <div className="sticky top-0 bg-white border-b border-brand-border px-6 py-4 flex items-center justify-between z-10">
          {title && <h2 className="text-lg font-semibold">{title}</h2>}
          <button onClick={onClose} aria-label="Close panel" className="text-brand-muted hover:text-brand-text text-xl">
            &times;
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
