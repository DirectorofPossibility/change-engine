'use client'

import Link from 'next/link'
import { Calendar, MapPin, Users } from 'lucide-react'
import { useTranslation } from '@/lib/use-translation'

interface OpportunityCardProps {
  name: string
  description: string | null
  startDate: string | null
  endDate: string | null
  address: string | null
  city: string | null
  isVirtual: string | null
  registrationUrl: string | null
  spotsAvailable: number | null
  translatedName?: string
  translatedDescription?: string
  onSelect?: () => void
}

export function OpportunityCard({
  name, description, startDate, endDate, address, city,
  isVirtual, registrationUrl, spotsAvailable,
  translatedName, translatedDescription, onSelect,
}: OpportunityCardProps) {
  const { t } = useTranslation()
  const location = isVirtual === 'Yes' ? t('card.virtual') : [address, city].filter(Boolean).join(', ')
  const displayName = translatedName || name
  const displayDesc = translatedDescription || description

  return (
    <div
      className="bg-white border border-rule p-4 hover:border-ink transition-colors"
      {...(onSelect ? { role: 'button', tabIndex: 0, onClick: onSelect, onKeyDown: function (e: React.KeyboardEvent<HTMLDivElement>) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect() } }, style: { cursor: 'pointer' } } : {})}
    >
      <h4 className="font-semibold text-ink text-sm mb-2 line-clamp-2">{displayName}</h4>
      {displayDesc && (
        <p className="text-xs text-muted mb-3 line-clamp-2">{displayDesc.length > 150 ? displayDesc.slice(0, 150) + '...' : displayDesc}</p>
      )}
      <div className="space-y-1.5 text-xs text-muted">
        {startDate && (
          <div className="flex items-center gap-1.5">
            <Calendar size={12} />
            <span>
              {new Date(startDate).toLocaleDateString()}
              {endDate ? ' - ' + new Date(endDate).toLocaleDateString() : ''}
            </span>
          </div>
        )}
        {location && (
          <div className="flex items-center gap-1.5">
            <MapPin size={12} />
            {isVirtual !== 'Yes' && address ? (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue hover:underline line-clamp-1"
                onClick={function (e) { e.stopPropagation() }}
              >
                {location}
              </a>
            ) : (
              <span className="line-clamp-1">{location}</span>
            )}
          </div>
        )}
        {spotsAvailable != null && (
          <div className="flex items-center gap-1.5">
            <Users size={12} />
            <span>{spotsAvailable} {t('card.spots_available')}</span>
          </div>
        )}
      </div>
      {registrationUrl && (
        <Link
          href={registrationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 text-xs text-blue hover:underline"
          onClick={function (e) { e.stopPropagation() }}
        >
          {t('card.register')} &rarr;
        </Link>
      )}
    </div>
  )
}
