/**
 * @fileoverview Accessible modal dialog with focus trap and Escape key dismissal.
 *
 * Renders a centered overlay dialog with a semi-transparent backdrop. The
 * component manages body scroll locking, auto-focuses the dialog on open,
 * traps Tab/Shift+Tab focus within focusable descendants, and closes on
 * Escape key or backdrop click. Uses `role="dialog"` and `aria-modal="true"`
 * for screen-reader accessibility.
 */
'use client'

import { useEffect, useRef, useCallback } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

/**
 * Accessible modal dialog with focus trap, Escape key, and backdrop click dismissal.
 *
 * @param props.open - Whether the modal is currently visible.
 * @param props.onClose - Callback invoked when the user dismisses the modal.
 * @param props.title - Optional heading displayed in the sticky header bar.
 * @param props.children - Modal body content.
 */
export function Modal({ open, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      // Focus the dialog when it opens
      dialogRef.current?.focus()
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
    // Focus trap
    if (e.key === 'Tab') {
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Dialog'}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="relative bg-white shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto outline-none"
      >
        <div className="sticky top-0 bg-white border-b border-brand-border px-6 py-4 flex items-center justify-between">
          {title && <h2 className="text-lg font-semibold">{title}</h2>}
          <button onClick={onClose} aria-label="Close dialog" className="text-brand-muted hover:text-brand-text text-xl">
            &times;
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
