'use client'

import { useState, useEffect } from 'react'
import { Info } from 'lucide-react'

const TOGGLE_KEY = 'ce-tips-enabled'

export function TipsToggle() {
  const [enabled, setEnabled] = useState(true)

  useEffect(function () {
    setEnabled(localStorage.getItem(TOGGLE_KEY) !== 'false')
  }, [])

  function handleToggle() {
    const next = !enabled
    setEnabled(next)
    localStorage.setItem(TOGGLE_KEY, String(next))
    if (!next) {
      window.dispatchEvent(new CustomEvent('ce-tips-toggle', { detail: { enabled: false } }))
    } else {
      window.location.reload()
    }
  }

  return (
    <button
      onClick={handleToggle}
      className="flex items-center gap-1.5 text-[11px] font-mono text-brand-muted hover:text-brand-text transition-colors"
      title={enabled ? 'Turn off tips' : 'Turn on tips'}
    >
      <Info size={12} />
      <span>Tips {enabled ? 'on' : 'off'}</span>
    </button>
  )
}
