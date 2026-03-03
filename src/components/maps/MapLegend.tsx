'use client'

import type { MarkerType } from './MapMarker'

const LEGEND_CONFIG: Record<MarkerType, { label: string; color: string }> = {
  service:      { label: 'Services',           color: '#3182ce' },
  voting:       { label: 'Voting Locations',   color: '#e53e3e' },
  organization: { label: 'Organizations',      color: '#38a169' },
  distribution: { label: 'Distribution Sites', color: '#d69e2e' },
  opportunity:  { label: 'Opportunities',      color: '#805ad5' },
}

interface MapLegendProps {
  types: MarkerType[]
}

export function MapLegend({ types }: MapLegendProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 mt-3 px-1">
      {types.map(type => {
        const config = LEGEND_CONFIG[type]
        return (
          <div key={type} className="flex items-center gap-1.5 text-xs text-brand-muted">
            <span
              className="w-3 h-3 rounded-full inline-block"
              style={{ backgroundColor: config.color }}
            />
            <span>{config.label}</span>
          </div>
        )
      })}
    </div>
  )
}
