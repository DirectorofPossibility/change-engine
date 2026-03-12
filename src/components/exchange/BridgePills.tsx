'use client'

import Link from 'next/link'

interface Bridge {
  themeId: string
  name: string
  color: string
  slug: string
  count: number
}

interface BridgePillsProps {
  bridges: Bridge[]
  currentColor?: string
}

export function BridgePills({ bridges, currentColor }: BridgePillsProps) {
  if (bridges.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-brand-muted font-body italic">Connected to:</span>
      {bridges.map(function (b) {
        return (
          <Link
            key={b.themeId}
            href={'/pathways/' + b.slug}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            style={{
              backgroundColor: b.color + '14',
              color: b.color,
              border: `1.5px solid ${b.color}30`,
            }}
          >
            {b.name}
            <span className="opacity-60">({b.count})</span>
          </Link>
        )
      })}
    </div>
  )
}
