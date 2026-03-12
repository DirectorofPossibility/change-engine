'use client'

import type { MarkerType } from './MapMarker'

const LEGEND_CONFIG: Record<MarkerType, { label: string; color: string; group: string }> = {
  service:      { label: 'Services',           color: '#1b5e8a', group: 'Community' },
  voting:       { label: 'Voting Locations',   color: '#7a2018', group: 'Civic' },
  organization: { label: 'Organizations',      color: '#1a6b56', group: 'Community' },
  distribution: { label: 'Distribution Sites', color: '#4a2870', group: 'Community' },
  opportunity:  { label: 'Opportunities',      color: '#4a2870', group: 'Community' },
  park:         { label: 'Parks',              color: '#1a6b56', group: 'Community' },
  police:       { label: 'Police',             color: '#1b5e8a', group: 'Emergency & Safety' },
  fire:         { label: 'Fire Stations',      color: '#7a2018', group: 'Emergency & Safety' },
  school:       { label: 'Schools',            color: '#1e4d7a', group: 'Community' },
  medical:      { label: 'Medical',            color: '#4a2870', group: 'Emergency & Safety' },
  library:      { label: 'Libraries',          color: '#1e4d7a', group: 'Community' },
  official:     { label: 'Officials',          color: '#1a5030', group: 'Civic' },
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
          <div key={type} className="flex items-center gap-1.5 text-xs" style={{ color: '#5c6474' }}>
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
