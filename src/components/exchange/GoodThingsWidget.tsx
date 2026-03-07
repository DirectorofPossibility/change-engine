'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { FlowerOfLifeIcon } from './FlowerIcons'

interface GoodThingEntry {
  id: string
  thing_1: string
  thing_2: string
  thing_3: string
  city: string | null
  state: string | null
  zip_code: string
  display_name: string | null
  created_at: string
}

const THING_COLORS = ['#38a169', '#3182ce', '#805ad5']

/**
 * Three Good Things widget — branded, auto-cycling through random entries.
 * Quotes shown with colored dots (no numbers). "Share yours" is a button.
 */
export function GoodThingsWidget({ variant = 'card' }: { variant?: 'card' | 'inline' | 'banner' }) {
  const [entries, setEntries] = useState<GoodThingEntry[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [fade, setFade] = useState(true)

  useEffect(function () {
    fetch('/api/good-things')
      .then(function (r) { return r.json() })
      .then(function (d) {
        if (d.entries && d.entries.length > 0) {
          const shuffled = d.entries.slice(0, 50).sort(function () { return Math.random() - 0.5 })
          setEntries(shuffled)
        }
      })
      .catch(function () {})
  }, [])

  // Auto-cycle every 8 seconds
  useEffect(function () {
    if (entries.length <= 1) return
    const timer = setInterval(function () {
      setFade(false)
      setTimeout(function () {
        setCurrentIdx(function (prev) { return (prev + 1) % entries.length })
        setFade(true)
      }, 300)
    }, 8000)
    return function () { clearInterval(timer) }
  }, [entries.length])

  const entry = entries[currentIdx]
  if (!entry) return null

  const things = [entry.thing_1, entry.thing_2, entry.thing_3]
  const loc = [entry.city, entry.state].filter(Boolean).join(', ')
  const attribution = entry.display_name || loc || 'ZIP ' + entry.zip_code

  if (variant === 'banner') {
    const thing = things[Math.floor(Math.random() * 3)]
    return (
      <div className="bg-brand-bg-alt text-brand-text py-3 px-4 border-t border-brand-border">
        <div className="max-w-[1200px] mx-auto flex items-center gap-3 text-sm">
          <FlowerOfLifeIcon size={14} color="#d69e2e" />
          <span className="font-serif font-bold text-brand-text flex-shrink-0">Three Good Things</span>
          <span className={'text-brand-muted truncate transition-opacity duration-300 italic ' + (fade ? 'opacity-100' : 'opacity-0')}>&ldquo;{thing}&rdquo;</span>
          {attribution && <span className="text-brand-muted-light text-xs flex-shrink-0">&mdash; {attribution}</span>}
          <Link
            href="/goodthings"
            className="ml-auto flex-shrink-0 px-3 py-1 rounded-lg bg-brand-accent text-white text-[11px] font-bold hover:bg-brand-accent-hover transition-colors"
          >
            Share yours
          </Link>
        </div>
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <div className={'bg-brand-bg rounded-xl border-2 border-brand-border p-4 transition-all duration-300 ' + (fade ? 'opacity-100' : 'opacity-0')}>
        <div className="flex items-center gap-2 mb-3">
          <FlowerOfLifeIcon size={16} color="#d69e2e" />
          <span className="font-serif font-bold text-sm text-brand-text">Three Good Things</span>
        </div>
        {things.map(function (t, i) {
          return (
            <div key={i} className="flex items-start gap-2.5 mb-2 last:mb-0">
              <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: THING_COLORS[i] }} />
              <p className="text-[13px] text-brand-text leading-snug italic">&ldquo;{t}&rdquo;</p>
            </div>
          )
        })}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-brand-border/60">
          <div className="flex items-center gap-1 text-[11px] text-brand-muted">
            {entry.display_name && <span className="font-medium text-brand-text">{entry.display_name}</span>}
            {entry.display_name && loc && <span>&middot;</span>}
            {loc && <><MapPin size={10} /><span>{loc}</span></>}
            {!entry.display_name && !loc && <span>ZIP {entry.zip_code}</span>}
          </div>
          <Link
            href="/goodthings"
            className="px-3 py-1 rounded-lg bg-brand-accent text-white text-[11px] font-bold hover:bg-brand-accent-hover transition-colors"
          >
            Share yours
          </Link>
        </div>
      </div>
    )
  }

  // card variant (for sidebar / homepage)
  return (
    <div className={'bg-white rounded-xl border-2 border-brand-border p-4 relative overflow-hidden transition-opacity duration-300 ' + (fade ? 'opacity-100' : 'opacity-0')} style={{ boxShadow: '2px 2px 0 #D1D5E0' }}>
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#38a169] via-[#3182ce] to-[#805ad5]" />
      <div className="pl-3">
        <div className="flex items-center gap-2 mb-3">
          <FlowerOfLifeIcon size={16} color="#d69e2e" />
          <span className="font-serif font-bold text-sm text-brand-text">Three Good Things</span>
        </div>
        {things.map(function (t, i) {
          return (
            <div key={i} className="flex items-start gap-2.5 mb-2 last:mb-0">
              <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: THING_COLORS[i] }} />
              <p className="text-[13px] text-brand-text leading-snug italic">&ldquo;{t}&rdquo;</p>
            </div>
          )
        })}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-brand-border/60">
          <div className="flex items-center gap-1 text-[11px] text-brand-muted">
            {entry.display_name && <span className="font-medium text-brand-text">{entry.display_name}</span>}
            {entry.display_name && loc && <span>&middot;</span>}
            {loc ? <><MapPin size={10} /><span>{loc}</span></> : <span>ZIP {entry.zip_code}</span>}
          </div>
          <Link
            href="/goodthings"
            className="px-3 py-1 rounded-lg bg-brand-accent text-white text-[11px] font-bold hover:bg-brand-accent-hover transition-colors"
          >
            Share yours
          </Link>
        </div>
      </div>
    </div>
  )
}
