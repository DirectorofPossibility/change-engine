'use client'

import Link from 'next/link'
import { Mail, Phone, Globe, Linkedin } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

const LEVEL_COLORS: Record<string, string> = {
  Federal: '#3182ce',
  State: '#805ad5',
  County: '#d69e2e',
  City: '#38a169',
  'School District': '#dd6b20',
}

const DEFAULT_LEVEL_COLOR = '#8B7E74'

interface OfficialCardProps {
  id: string
  name: string
  title: string | null
  party: string | null
  level: string | null
  email: string | null
  phone: string | null
  website: string | null
  photoUrl?: string | null
  linkedinUrl?: string | null
  translatedTitle?: string
  onSelect?: () => void
}

export function OfficialCard({ id, name, title, party, level, email, phone, website, photoUrl, linkedinUrl, translatedTitle, onSelect }: OfficialCardProps) {
  const { t } = useTranslation()
  const displayTitle = translatedTitle || title
  const ringColor = (level && LEVEL_COLORS[level]) || DEFAULT_LEVEL_COLOR

  const NameWrapper = onSelect ? 'div' : Link
  const nameProps = onSelect
    ? { role: 'button' as const, tabIndex: 0, onClick: onSelect, onKeyDown: function (e: React.KeyboardEvent) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect() } }, className: 'block mb-3 cursor-pointer' }
    : { href: '/officials/' + id, className: 'block mb-3' }

  return (
    <div className="bg-white rounded-xl border border-brand-border p-5 hover:shadow-md transition-shadow">
      <NameWrapper {...nameProps as any}>
        <div className="flex items-start gap-4">
          <div
            className="w-16 h-16 rounded-full flex-shrink-0 p-[3px]"
            style={{ backgroundColor: ringColor }}
          >
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={name}
                className="w-full h-full rounded-full object-cover ring-2 ring-white"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-brand-bg flex items-center justify-center ring-2 ring-white">
                <span className="text-xl font-bold text-brand-muted">{name.charAt(0)}</span>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-brand-text hover:text-brand-accent transition-colors">{name}</h3>
            {displayTitle && <p className="text-sm text-brand-muted line-clamp-1">{displayTitle}</p>}
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-brand-muted">
              {party && <span>{party}</span>}
              {party && level && <span>&middot;</span>}
              {level && (
                <span className="uppercase tracking-wide font-semibold" style={{ color: ringColor }}>
                  {level}
                </span>
              )}
            </div>
          </div>
        </div>
      </NameWrapper>
      <div className="flex items-center gap-3 flex-wrap">
        {email && (
          <a href={'mailto:' + email} className="flex items-center gap-1 text-xs text-brand-accent hover:underline">
            <Mail size={14} /> {t('card.email')}
          </a>
        )}
        {phone && (
          <a href={'tel:' + phone} className="flex items-center gap-1 text-xs text-brand-accent hover:underline">
            <Phone size={14} /> {t('card.call')}
          </a>
        )}
        {website && (
          <a href={website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-brand-accent hover:underline">
            <Globe size={14} /> {t('card.website')}
          </a>
        )}
        {linkedinUrl && (
          <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-brand-accent hover:underline">
            <Linkedin size={14} /> LinkedIn
          </a>
        )}
      </div>
    </div>
  )
}
