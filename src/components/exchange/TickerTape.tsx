'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { FlowerOfLifeIcon } from './FlowerIcons'

interface TickerItem {
  text: string
  attribution?: string
  color: string
  href?: string
}

interface TickerTapeProps {
  election?: {
    election_name: string
    election_date: string
    find_polling_url: string | null
  } | null
}

const COLORS = ['#38a169', '#3182ce', '#805ad5', '#C75B2A', '#d69e2e', '#e53e3e', '#319795']

/**
 * Continuously scrolling ticker tape that pulls random Good Things entries.
 * CSS-animated marquee — no JS animation frames needed.
 * Optionally shows a pinned election countdown item.
 */
export function TickerTape({ election }: TickerTapeProps) {
  const [items, setItems] = useState<TickerItem[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(function () {
    fetch('/api/good-things')
      .then(function (r) { return r.json() })
      .then(function (d) {
        if (!d.entries || d.entries.length === 0) return
        const shuffled = d.entries
          .sort(function () { return Math.random() - 0.5 })
          .slice(0, 30)
        const ticker: TickerItem[] = []
        shuffled.forEach(function (entry: any, idx: number) {
          const things = [entry.thing_1, entry.thing_2, entry.thing_3].filter(Boolean)
          const loc = [entry.city, entry.state].filter(Boolean).join(', ')
          const attr = entry.display_name || loc || 'ZIP ' + entry.zip_code
          things.forEach(function (t: string) {
            ticker.push({
              text: t,
              attribution: attr,
              color: COLORS[(idx + ticker.length) % COLORS.length],
            })
          })
        })
        setItems(ticker.sort(function () { return Math.random() - 0.5 }))
      })
      .catch(function () {})
  }, [])

  // Build election ticker item
  const electionItem: TickerItem | null = election ? (function () {
    const d = new Date(election.election_date)
    const now = new Date()
    const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (diff < 0) return null
    const dateStr = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    const daysLabel = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : diff + ' days away'
    return {
      text: election.election_name + ' — ' + dateStr + ' (' + daysLabel + ')',
      attribution: election.find_polling_url ? 'Find your polling place' : undefined,
      color: '#e53e3e',
      href: '/elections',
    }
  })() : null

  if (items.length === 0 && !electionItem) return null

  // Duplicate items for seamless loop
  const doubled = [...items, ...items]

  return (
    <div className="bg-brand-bg-alt border-y border-brand-border overflow-hidden relative">
      <div className="flex items-center">
        {/* Fixed label */}
        <div className="flex-shrink-0 bg-brand-bg-alt z-10 flex items-center gap-2 px-4 py-2.5 border-r border-brand-border">
          <FlowerOfLifeIcon size={14} color="#d69e2e" />
          <Link href="/goodthings" className="font-serif font-bold text-xs text-brand-text hover:text-brand-accent transition-colors whitespace-nowrap">
            Three Good Things
          </Link>
        </div>

        {/* Election pinned item */}
        {electionItem && (
          <Link
            href={electionItem.href || '/elections'}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 border-r border-brand-border hover:bg-brand-border/30 transition-colors"
          >
            <span className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse" style={{ backgroundColor: '#e53e3e' }} />
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-brand-accent whitespace-nowrap">
              {electionItem.text}
            </span>
          </Link>
        )}

        {/* Scrolling ticker */}
        {doubled.length > 0 && (
          <div className="overflow-hidden flex-1" ref={containerRef}>
            <div className="ticker-scroll flex items-center gap-6 whitespace-nowrap py-2.5 pr-6">
              {doubled.map(function (item, i) {
                return (
                  <span key={i} className="inline-flex items-center gap-2 text-[13px]">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-brand-text italic">&ldquo;{item.text}&rdquo;</span>
                    {item.attribution && (
                      <span className="text-brand-muted-light text-[11px]">&mdash; {item.attribution}</span>
                    )}
                  </span>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
