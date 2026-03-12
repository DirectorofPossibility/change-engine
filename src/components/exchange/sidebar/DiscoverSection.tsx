'use client'

import Link from 'next/link'
import { ChevronDown, ChevronRight, Phone, Users, Scale, MapPin, Landmark } from 'lucide-react'
import { BRAND } from '@/lib/constants'
import { useTranslation } from '@/lib/use-translation'

const DISCOVER_LINKS = [
  { label: 'discover.local_resources', icon: Phone, href: '/services' },
  { label: 'discover.officials', icon: Users, href: '/officials' },
  { label: 'discover.policy', icon: Scale, href: '/policies' },
  { label: 'discover.neighborhoods', icon: MapPin, href: '/super-neighborhoods' },
  { label: 'discover.foundations', icon: Landmark, href: '/foundations' },
]

interface DiscoverSectionProps {
  discoverOpen: boolean
  onToggle: () => void
  onLinkClick: () => void
}

export function DiscoverSection({ discoverOpen, onToggle, onLinkClick }: DiscoverSectionProps) {
  const { t } = useTranslation()

  return (
    <div className="px-5">
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 w-full text-[10px] font-bold tracking-[0.14em] uppercase text-brand-muted mb-2 hover:text-brand-text transition-colors font-display"
      >
        {discoverOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        {t('sidebar.your_guide')}
      </button>
      {discoverOpen && (
        <div className="space-y-0.5">
          {DISCOVER_LINKS.map(function (item) {
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onLinkClick}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-brand-muted font-medium hover:text-brand-text hover:bg-brand-accent/[0.04] transition-colors"
              >
                <item.icon size={15} style={{ color: BRAND.accent }} />
                {t(item.label)}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
