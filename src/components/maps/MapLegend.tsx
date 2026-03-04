'use client'

import type { MarkerType } from './MapMarker'

const LEGEND_CONFIG: Record<MarkerType, { label: string; color: string; group: string }> = {
  service:      { label: 'Services',           color: '#3182ce', group: 'Community' },
  voting:       { label: 'Voting Locations',   color: '#e53e3e', group: 'Civic' },
  organization: { label: 'Organizations',      color: '#38a169', group: 'Community' },
  distribution: { label: 'Distribution Sites', color: '#d69e2e', group: 'Community' },
  opportunity:  { label: 'Opportunities',      color: '#805ad5', group: 'Community' },
  park:         { label: 'Parks',              color: '#38a169', group: 'Community' },
  police:       { label: 'Police',             color: '#3182ce', group: 'Emergency & Safety' },
  fire:         { label: 'Fire Stations',      color: '#e53e3e', group: 'Emergency & Safety' },
  school:       { label: 'Schools',            color: '#dd6b20', group: 'Community' },
  medical:      { label: 'Medical',            color: '#805ad5', group: 'Emergency & Safety' },
  library:      { label: 'Libraries',          color: '#d69e2e', group: 'Community' },
  official:     { label: 'Officials',          color: '#319795', group: 'Civic' },
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
