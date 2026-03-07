'use client'

import Link from 'next/link'
import { useNeighborhood } from '@/lib/contexts/NeighborhoodContext'
import { MapPin, ChevronRight } from 'lucide-react'

/**
 * Personalized welcome card on the Compass page.
 * When the user has a ZIP set, shows their neighborhood name
 * and quick links to localized pages.
 */
export function CompassNeighborhoodWelcome() {
  const { zip, neighborhood, councilDistrict, districtOfficials, isLoading } = useNeighborhood()

  if (!zip || isLoading) return null

  return (
    <div className="bg-white rounded-xl border-2 border-brand-border p-5 mb-8">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-brand-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <MapPin size={16} className="text-brand-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-serif text-lg font-bold text-brand-text">
            {neighborhood ? neighborhood.neighborhood_name : 'Your Area'}
          </h2>
          <p className="text-sm text-brand-muted mt-0.5">
            Personalized for ZIP {zip}
            {councilDistrict ? ' — District ' + councilDistrict : ''}
          </p>

          {districtOfficials.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {districtOfficials.slice(0, 3).map(function (o) {
                return (
                  <Link
                    key={o.official_id}
                    href={'/officials/' + o.official_id}
                    className="text-xs bg-brand-bg border-2 border-brand-border rounded-lg px-2.5 py-1 text-brand-text hover:shadow-sm transition-shadow"
                  >
                    {o.official_name}
                    {o.title ? ' — ' + o.title : ''}
                  </Link>
                )
              })}
            </div>
          )}

          <div className="flex flex-wrap gap-4 mt-4 text-sm">
            <Link href="/officials" className="flex items-center gap-1 text-brand-accent hover:underline">
              Your representatives <ChevronRight size={14} />
            </Link>
            <Link href="/polling-places" className="flex items-center gap-1 text-brand-accent hover:underline">
              Polling places <ChevronRight size={14} />
            </Link>
            <Link href="/services" className="flex items-center gap-1 text-brand-accent hover:underline">
              Local services <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
