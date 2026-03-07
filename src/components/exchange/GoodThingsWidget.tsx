'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Sparkles, MapPin, ArrowRight } from 'lucide-react'

interface GoodThingEntry {
  id: string
  thing_1: string
  thing_2: string
  thing_3: string
  city: string | null
  state: string | null
  zip_code: string
  created_at: string
}

const THING_COLORS = ['#38a169', '#3182ce', '#805ad5']

/**
 * Compact widget showing a random good thing from the database.
 * Use variant="card" for sidebar placement, variant="inline" for between sections.
 */
export function GoodThingsWidget({ variant = 'card' }: { variant?: 'card' | 'inline' | 'banner' }) {
  const [entry, setEntry] = useState<GoodThingEntry | null>(null)
  const [thingIndex, setThingIndex] = useState(0)

  useEffect(function () {
    fetch('/api/good-things')
      .then(function (r) { return r.json() })
      .then(function (d) {
        if (d.entries && d.entries.length > 0) {
          // Pick a random entry
          const idx = Math.floor(Math.random() * Math.min(d.entries.length, 20))
          setEntry(d.entries[idx])
          setThingIndex(Math.floor(Math.random() * 3))
        }
      })
      .catch(function () {})
  }, [])

  if (!entry) return null

  const things = [entry.thing_1, entry.thing_2, entry.thing_3]
  const thing = things[thingIndex]
  const color = THING_COLORS[thingIndex]
  const loc = [entry.city, entry.state].filter(Boolean).join(', ')

  if (variant === 'banner') {
    return (
      <Link href="/goodthings" className="block bg-brand-bg-alt text-brand-text py-3 px-4 hover:bg-brand-border/50 transition-colors border-t border-brand-border">
        <div className="max-w-[1200px] mx-auto flex items-center gap-3 text-sm">
          <Sparkles size={14} className="text-[#d69e2e] flex-shrink-0" />
          <span className="text-brand-muted flex-shrink-0">Good Thing:</span>
          <span className="text-brand-text truncate">&quot;{thing}&quot;</span>
          {loc && <span className="text-brand-muted-light text-xs flex-shrink-0">— {loc}</span>}
          <span className="ml-auto text-brand-muted text-xs flex-shrink-0 flex items-center gap-1">
            Share yours <ArrowRight size={10} />
          </span>
        </div>
      </Link>
    )
  }

  if (variant === 'inline') {
    return (
      <Link href="/goodthings" className="block group">
        <div className="bg-brand-bg rounded-xl border border-brand-border p-4 flex items-start gap-3 hover:border-brand-text transition-all">
          <span className="w-6 h-6 rounded-full text-white text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5"
            style={{ backgroundColor: color }}>{thingIndex + 1}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-brand-text leading-snug">&quot;{thing}&quot;</p>
            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-brand-muted">
              {loc && <><MapPin size={10} /><span>{loc}</span></>}
              <span className="ml-auto text-brand-accent group-hover:underline flex items-center gap-1">
                Share your good things <ArrowRight size={10} />
              </span>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  // card variant (for sidebar)
  return (
    <div className="bg-white rounded-xl border-2 border-brand-border p-4 relative overflow-hidden" style={{ boxShadow: '2px 2px 0 #D1D5E0' }}>
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#38a169] via-[#3182ce] to-[#805ad5]" />
      <div className="pl-3">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={14} className="text-[#d69e2e]" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-muted">Good Thing</span>
        </div>
        {things.map(function (t, i) {
          return (
            <div key={i} className="flex items-start gap-2 mb-2 last:mb-0">
              <span className="w-4 h-4 rounded-full text-white flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: THING_COLORS[i], fontSize: '9px', fontWeight: 700 }}>{i + 1}</span>
              <p className="text-[13px] text-brand-text leading-snug">{t}</p>
            </div>
          )
        })}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-brand-border/60">
          <div className="flex items-center gap-1 text-[11px] text-brand-muted">
            <MapPin size={10} />
            <span>{loc || 'ZIP ' + entry.zip_code}</span>
          </div>
          <Link href="/goodthings" className="text-[11px] text-brand-accent hover:underline flex items-center gap-1">
            Share yours <ArrowRight size={10} />
          </Link>
        </div>
      </div>
    </div>
  )
}
