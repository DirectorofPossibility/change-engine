import { Phone, MapPin, Globe } from 'lucide-react'

interface ServiceCardProps {
  name: string
  orgName?: string
  description: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  website: string | null
  translatedName?: string
  translatedDescription?: string
}

export function ServiceCard({ name, orgName, description, phone, address, city, state, zipCode, website, translatedName, translatedDescription }: ServiceCardProps) {
  const fullAddress = [address, city, state, zipCode].filter(Boolean).join(', ')
  const displayName = translatedName || name
  const displayDesc = translatedDescription || description

  return (
    <div className="bg-white rounded-xl border border-brand-border p-5">
      <h3 className="font-semibold text-brand-text mb-1">{displayName}</h3>
      {orgName && <p className="text-xs text-brand-muted mb-2">{orgName}</p>}
      {displayDesc && <p className="text-sm text-brand-muted mb-3 line-clamp-2">{displayDesc}</p>}
      <div className="space-y-1.5">
        {phone && (
          <a href={`tel:${phone}`} className="flex items-center gap-2 text-xs text-brand-accent hover:underline">
            <Phone size={14} /> {phone}
          </a>
        )}
        {fullAddress && (
          <p className="flex items-center gap-2 text-xs text-brand-muted">
            <MapPin size={14} className="shrink-0" /> {fullAddress}
          </p>
        )}
        {website && (
          <a href={website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-brand-accent hover:underline">
            <Globe size={14} /> Website
          </a>
        )}
      </div>
    </div>
  )
}
