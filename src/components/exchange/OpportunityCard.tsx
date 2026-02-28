import Link from 'next/link'
import { Calendar, MapPin, Users } from 'lucide-react'

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
}

export function OpportunityCard({
  name, description, startDate, endDate, address, city,
  isVirtual, registrationUrl, spotsAvailable,
}: OpportunityCardProps) {
  var location = isVirtual === 'Yes' ? 'Virtual' : [address, city].filter(Boolean).join(', ')

  return (
    <div className="bg-white rounded-xl border border-brand-border p-4 hover:shadow-md transition-shadow">
      <h4 className="font-semibold text-brand-text text-sm mb-2 line-clamp-2">{name}</h4>
      {description && (
        <p className="text-xs text-brand-muted mb-3 line-clamp-2">{description}</p>
      )}
      <div className="space-y-1.5 text-xs text-brand-muted">
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
            <span className="line-clamp-1">{location}</span>
          </div>
        )}
        {spotsAvailable != null && (
          <div className="flex items-center gap-1.5">
            <Users size={12} />
            <span>{spotsAvailable} spots available</span>
          </div>
        )}
      </div>
      {registrationUrl && (
        <Link
          href={registrationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 text-xs text-brand-accent hover:underline"
        >
          Register &rarr;
        </Link>
      )}
    </div>
  )
}
