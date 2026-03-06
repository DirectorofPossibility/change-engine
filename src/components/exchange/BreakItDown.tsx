'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'

interface BreakItDownProps {
  title: string
  summary?: string | null
  type: 'content' | 'policy'
  accentColor?: string
}

export function BreakItDown({ title, summary, type, accentColor = '#E8723A' }: BreakItDownProps) {
  const [breakdown, setBreakdown] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    if (breakdown) return // already loaded
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, summary: summary || '', type }),
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setBreakdown(data.breakdown)
    } catch {
      setError('Could not generate breakdown. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="my-6">
      {!breakdown && (
        <button
          onClick={handleClick}
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border-2 hover:shadow-md disabled:opacity-60"
          style={{
            borderColor: accentColor,
            color: accentColor,
            backgroundColor: accentColor + '08',
          }}
        >
          <Sparkles size={16} />
          {loading ? 'Breaking it down…' : 'Break it down for me'}
        </button>
      )}

      {error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}

      {breakdown && (
        <div
          className="mt-4 rounded-xl border-2 p-6 space-y-4"
          style={{ borderColor: accentColor + '30', backgroundColor: accentColor + '06' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} style={{ color: accentColor }} />
            <span className="text-sm font-bold" style={{ color: accentColor }}>Plain-Language Breakdown</span>
          </div>
          {breakdown.split(/\n(?=## )/).map(function (section, i) {
            const lines = section.trim().split('\n')
            const heading = lines[0]?.replace(/^## /, '')
            const body = lines.slice(1).join('\n').trim()
            return (
              <div key={i}>
                {heading && <h4 className="text-sm font-bold text-brand-text mb-1">{heading}</h4>}
                {body && <p className="text-sm text-brand-muted leading-relaxed">{body}</p>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
