'use client'

import Link from 'next/link'
import { Mail, Phone, Globe, Linkedin } from 'lucide-react'
import { useTranslation } from '@/lib/use-translation'
import { LEVEL_COLORS, DEFAULT_LEVEL_COLOR } from '@/lib/constants'

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
  const levelColor = (level && LEVEL_COLORS[level]) || DEFAULT_LEVEL_COLOR

  const cardContent = (
    <div className="bg-white rounded-xl border-2 border-brand-border overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 group" style={{ boxShadow: '3px 3px 0 ' + levelColor + '20' }}>
      {/* Level color bar */}
      <div className="h-1 transition-all group-hover:h-1.5" style={{ backgroundColor: levelColor }} />

      <div className="flex items-start gap-4 p-4">
        {/* Photo — larger, more prominent */}
        <div className="flex-shrink-0">
          {photoUrl ? (
            <img
              src={photoUrl.replace(/^http:\/\//, 'https://')}
              alt={name}
              className="w-[72px] h-[72px] rounded-xl object-cover object-top border-2 border-brand-border group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-[72px] h-[72px] rounded-xl flex items-center justify-center border-2 border-brand-border" style={{ backgroundColor: levelColor + '10' }}>
              <span className="text-2xl font-serif font-bold" style={{ color: levelColor }}>{name.charAt(0)}</span>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-brand-text group-hover:text-brand-accent transition-colors leading-tight">{name}</h3>
          {displayTitle && <p className="text-sm text-brand-muted mt-0.5 leading-snug line-clamp-2">{displayTitle}</p>}
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            {level && (
              <span className="inline-flex items-center gap-1 font-bold uppercase tracking-wide" style={{ color: levelColor }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: levelColor }} />
                {level}
              </span>
            )}
            {party && level && <span className="text-brand-muted">&middot;</span>}
            {party && <span className="text-brand-muted">{party}</span>}
          </div>
        </div>
      </div>

      {/* Contact actions */}
      <div className="flex items-center gap-3 flex-wrap px-4 pb-3 pt-0">
        {email && (
          <a href={'mailto:' + email} className="flex items-center gap-1 text-xs text-brand-accent hover:underline" onClick={function (e) { e.stopPropagation() }}>
            <Mail size={13} /> {t('card.email')}
          </a>
        )}
        {phone && (
          <a href={'tel:' + phone} className="flex items-center gap-1 text-xs text-brand-accent hover:underline" onClick={function (e) { e.stopPropagation() }}>
            <Phone size={13} /> {t('card.call')}
          </a>
        )}
        {website && (
          <a href={website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-brand-accent hover:underline" onClick={function (e) { e.stopPropagation() }}>
            <Globe size={13} /> {t('card.website')}
          </a>
        )}
        {linkedinUrl && (
          <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-brand-accent hover:underline" onClick={function (e) { e.stopPropagation() }}>
            <Linkedin size={13} /> LinkedIn
          </a>
        )}
      </div>
    </div>
  )

  if (onSelect) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect() } }}
        className="cursor-pointer"
      >
        {cardContent}
      </div>
    )
  }

  return <Link href={'/officials/' + id}>{cardContent}</Link>
}
