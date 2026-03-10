'use client'

import { useState, useRef, useEffect } from 'react'
import { Globe } from 'lucide-react'
import { useLanguage } from '@/lib/contexts/LanguageContext'
import { LANGUAGES } from '@/lib/constants'

/**
 * Compact "Translate this page" widget shown on every exchange page.
 * Renders as a small pill in the top-right content area.
 * When clicked, expands to show language options (EN / ES / VI).
 */
export function TranslateWidget() {
  const { language, setLanguage } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(function () {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return function () { document.removeEventListener('mousedown', handleClick) }
  }, [])

  const currentLabel = LANGUAGES.find(function (l) { return l.code === language })?.name || 'English'

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        onClick={function () { setOpen(!open) }}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-muted hover:text-brand-text bg-white/80 hover:bg-white border border-brand-border rounded-lg shadow-sm transition-colors"
        aria-label="Translate this page"
      >
        <Globe className="w-3.5 h-3.5" />
        <span>{currentLabel}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-brand-border rounded-lg shadow-lg overflow-hidden z-50 min-w-[140px]">
          {LANGUAGES.map(function (lang) {
            const isActive = language === lang.code
            return (
              <button
                key={lang.code}
                onClick={function () {
                  setLanguage(lang.code)
                  setOpen(false)
                }}
                className={
                  'w-full text-left px-3 py-2 text-sm transition-colors ' +
                  (isActive
                    ? 'bg-brand-accent/10 text-brand-accent font-semibold'
                    : 'text-brand-text hover:bg-brand-bg')
                }
              >
                <span className="font-medium">{lang.label}</span>
                <span className="ml-2 text-brand-muted">{lang.name}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
