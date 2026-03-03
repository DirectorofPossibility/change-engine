/**
 * @fileoverview Personalized banner showing the user's detected neighborhood.
 *
 * Reads the user's ZIP, neighborhood name, council district, and district
 * officials from {@link NeighborhoodContext}. When data is available, renders
 * a top-of-page banner with the neighborhood name, ZIP code, council
 * district label, and a list of elected officials for that district.
 * Returns `null` while loading or if no neighborhood data is available.
 */
'use client'

import { useNeighborhood } from '@/lib/contexts/NeighborhoodContext'
import { useTranslation } from '@/lib/i18n'
import { MapPin, User } from 'lucide-react'

/**
 * Personalized banner displaying the user's detected neighborhood, council
 * district, and elected officials. Renders nothing when neighborhood data
 * is unavailable or still loading.
 */
export function NeighborhoodBanner() {
  const { zip, neighborhood, councilDistrict, districtOfficials, isLoading } = useNeighborhood()
  const { t } = useTranslation()

  if (!zip || isLoading) return null
  if (!neighborhood) return null

  return (
    <section className="bg-brand-accent/5 border-b border-brand-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-brand-accent" />
            <span className="font-semibold text-brand-text">{neighborhood.neighborhood_name}</span>
            <span className="text-sm text-brand-muted">({zip})</span>
          </div>
          {councilDistrict && (
            <span className="text-sm text-brand-muted">
              {t('neighborhood.council_district')} {councilDistrict}
            </span>
          )}
          {districtOfficials.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {districtOfficials.map(function (o) {
                return (
                  <span key={o.official_id} className="flex items-center gap-1 text-sm text-brand-text">
                    <User size={12} className="text-brand-muted" />
                    {o.official_name}
                    {o.title ? ' (' + o.title + ')' : ''}
                  </span>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
