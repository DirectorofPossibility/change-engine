'use client'

import { useState, useEffect } from 'react'
import { getSpiralCounts, getSpiralCycles, type SpiralTier } from '@/lib/spiral'

const TIERS: { key: SpiralTier; label: string; color: string; question: string }[] = [
  { key: 'understand', label: 'Understand', color: '#d69e2e', question: 'What is happening?' },
  { key: 'involved', label: 'Get Involved', color: '#38a169', question: 'How can I help?' },
  { key: 'deeper', label: 'Go Deeper', color: '#3182ce', question: 'Who decides?' },
]

interface SpiralProgressProps {
  variant?: 'compact' | 'full'
}

export function SpiralProgress({ variant = 'compact' }: SpiralProgressProps) {
  const [counts, setCounts] = useState({ understand: 0, involved: 0, deeper: 0 })
  const [cycles, setCycles] = useState(0)

  useEffect(function () {
    function refresh() {
      setCounts(getSpiralCounts())
      setCycles(getSpiralCycles())
    }
    refresh()
    window.addEventListener('ce-spiral-update', refresh)
    return function () { window.removeEventListener('ce-spiral-update', refresh) }
  }, [])

  const total = counts.understand + counts.involved + counts.deeper
  if (total === 0) return null

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        {TIERS.map(function (tier) {
          const count = counts[tier.key]
          const active = count > 0
          return (
            <div key={tier.key} className="flex items-center gap-1" title={tier.label + ': ' + count + ' actions'}>
              <div
                className="w-2.5 h-2.5 rounded-full transition-all"
                style={{
                  backgroundColor: active ? tier.color : '#E2DDD5',
                  boxShadow: active ? '0 0 6px ' + tier.color + '40' : 'none',
                }}
              />
              {count > 0 && (
                <span className="text-[10px] font-mono font-bold" style={{ color: tier.color }}>
                  {count}
                </span>
              )}
            </div>
          )
        })}
        {cycles > 0 && (
          <span className="text-[10px] font-mono font-bold text-brand-accent ml-1" title={cycles + ' full spiral cycles'}>
            {cycles}x
          </span>
        )}
      </div>
    )
  }

  // Full variant — used on dashboard/profile pages
  const maxCount = Math.max(counts.understand, counts.involved, counts.deeper, 1)

  return (
    <div className="border border-brand-border rounded-xl p-5 bg-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-base font-bold text-brand-text">Your Spiral</h3>
        {cycles > 0 && (
          <span className="font-mono text-[11px] font-bold text-brand-accent">
            {cycles} {cycles === 1 ? 'cycle' : 'cycles'} complete
          </span>
        )}
      </div>

      <div className="space-y-3">
        {TIERS.map(function (tier) {
          const count = counts[tier.key]
          const pct = Math.round((count / maxCount) * 100)
          return (
            <div key={tier.key}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tier.color }} />
                  <span className="text-sm font-semibold text-brand-text">{tier.label}</span>
                </div>
                <span className="text-xs text-brand-muted">{count} actions</span>
              </div>
              <div className="h-2 bg-brand-bg rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: pct + '%', backgroundColor: tier.color }}
                />
              </div>
              <p className="text-[11px] text-brand-muted mt-0.5">{tier.question}</p>
            </div>
          )
        })}
      </div>

      <p className="text-[11px] text-brand-muted-light mt-4 text-center italic">
        The spiral isn&apos;t linear. You cycle through all three levels as you go deeper.
      </p>
    </div>
  )
}
