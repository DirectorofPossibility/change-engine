/**
 * @fileoverview Service listing card for 211-type community resources.
 *
 * Renders a compact card for a single service or organization, showing the
 * service name, optional organization name, description, and contact
 * details (phone, address, website). Supports linking to detail page and
 * organization profile. Supports pre-translated overrides for multilingual display.
 */
'use client'

import Link from 'next/link'
import { Phone, MapPin, Globe } from 'lucide-react'
import { useTranslation } from '@/lib/use-translation'

interface ServiceCardProps {
  /** Service unique ID for linking to detail page. */
  serviceId?: string
  name: string
  /** Parent organization name shown below the title. */
  orgName?: string
  /** Parent organization ID for linking to org profile. */
  orgId?: string
  description?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
  website?: string | null
  translatedName?: string
  translatedDescription?: string
  onSelect?: () => void
}

/**
 * Service listing card with optional linking to detail page and org profile.
 *
 * @param props - {@link ServiceCardProps}
 */
export function ServiceCard({ serviceId, name, orgName, orgId, description, phone, address, city, state, zipCode, website, translatedName, translatedDescription, onSelect }: ServiceCardProps) {
  const { t } = useTranslation()
  const fullAddress = [address, city, state, zipCode].filter(Boolean).join(', ')
  const displayName = translatedName || name
  const displayDesc = translatedDescription || description

  const card = (
    <div className="bg-white border border-brand-border p-5 hover:border-ink transition-shadow h-full">
      <h3 className="font-semibold text-brand-text mb-1 line-clamp-2">{displayName}</h3>
      {orgName && orgId ? (
        <Link href={'/organizations/' + orgId} className="text-xs text-brand-accent hover:underline mb-2 block" onClick={function (e) { e.stopPropagation() }}>
          {orgName}
        </Link>
      ) : orgName ? (
        <p className="text-xs text-brand-muted mb-2">{orgName}</p>
      ) : null}
      {displayDesc && <p className="text-sm text-brand-muted mb-3 line-clamp-2">{displayDesc}</p>}
      <div className="space-y-1.5">
        {phone && (
          <a href={`tel:${phone}`} className="flex items-center gap-2 text-xs text-brand-accent hover:underline" onClick={function (e) { e.stopPropagation() }}>
            <Phone size={14} /> {phone}
          </a>
        )}
        {fullAddress && (
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-brand-accent hover:underline"
            onClick={function (e) { e.stopPropagation() }}
          >
            <MapPin size={14} className="shrink-0" /> {fullAddress}
          </a>
        )}
        {website && (
          <a href={website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-brand-accent hover:underline" onClick={function (e) { e.stopPropagation() }}>
            <Globe size={14} /> {t('card.website')}
          </a>
        )}
      </div>
    </div>
  )

  if (onSelect) {
    return <div role="button" tabIndex={0} onClick={onSelect} onKeyDown={function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect() } }} className="cursor-pointer">{card}</div>
  }
  if (serviceId) {
    return <Link href={'/services/' + serviceId} className="block">{card}</Link>
  }
  return card
}
