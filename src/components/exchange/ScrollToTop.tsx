'use client'

import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'

export function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(function () {
    function onScroll() {
      setVisible(window.scrollY > 400)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return function () { window.removeEventListener('scroll', onScroll) }
  }, [])

  if (!visible) return null

  return (
    <button
      onClick={function () { window.scrollTo({ top: 0, behavior: 'smooth' }) }}
      aria-label="Back to top"
      className="fixed bottom-20 right-4 z-40 p-3 bg-ink text-white border-2 border-ink hover:bg-white hover:text-ink transition-colors"
    >
      <ArrowUp size={18} />
    </button>
  )
}
