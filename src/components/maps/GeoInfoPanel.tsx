'use client'

import Link from 'next/link'
import type { GeoFeatureProperties } from '@/lib/types/exchange'

interface GeoInfoPanelProps {
  properties: GeoFeatureProperties
  layerLabel: string
  layerColor: string
  detailPath: string | null
  idProperty: string
  onClose: () => void
}

function formatNumber(n: number | null | undefined): string {
  if (n == null) return '--'
  return n.toLocaleString()
}

export function GeoInfoPanel({
  properties,
  layerLabel,
  layerColor,
  detailPath,
  idProperty,
  onClose,
}: GeoInfoPanelProps) {
  // Derive a display name from common GeoJSON property patterns
  const name =
    (properties.SN_NAME as string) ||
    (properties.NAME as string) ||
    (properties.NAMELSAD as string) ||
    (properties.DISTRICT as string) ||
    (properties[idProperty] as string) ||
    'Unknown'

  const featureId = properties[idProperty] as string | undefined

  const population = properties.POPULATION as number | undefined
  const medianIncome = properties.MEDIAN_INCOME as number | undefined

  return (
    <div className="bg-white shadow-lg border border-brand-border p-4 mt-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-3 h-3 rounded-sm flex-shrink-0"
            style={{ backgroundColor: layerColor }}
          />
          <div className="min-w-0">
            <p className="text-xs text-brand-muted">{layerLabel}</p>
            <h3 className="font-semibold text-brand-text truncate">{name}</h3>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-brand-muted hover:text-brand-text flex-shrink-0"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {(population != null || medianIncome != null) && (
        <div className="flex gap-4 mt-3 text-xs text-brand-muted">
          {population != null && (
            <div>
              <span className="font-medium text-brand-text">{formatNumber(population)}</span>{' '}
              population
            </div>
          )}
          {medianIncome != null && (
            <div>
              <span className="font-medium text-brand-text">${formatNumber(medianIncome)}</span>{' '}
              median income
            </div>
          )}
        </div>
      )}

      {detailPath && featureId && (
        <Link
          href={detailPath + featureId}
          className="inline-block mt-3 text-xs text-brand-accent hover:underline"
        >
          View details &rarr;
        </Link>
      )}
    </div>
  )
}
