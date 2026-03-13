'use client'

import Link from 'next/link'
import { Mail, Phone, Globe, Linkedin } from 'lucide-react'
import { useTranslation } from '@/lib/use-translation'
import { LEVEL_COLORS, DEFAULT_LEVEL_COLOR } from '@/lib/constants'
import Image from 'next/image'

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
    <div className="bg-white border border-rule overflow-hidden hover:border-ink transition-colors group">
      {/* Level color bar */}
      <div className="h-1 transition-all group-hover:h-1.5" style={{ backgroundColor: levelColor }} />

      <div className="flex items-start gap-4 p-4">
        {/* Photo — larger, more prominent */}
        <div className="flex-shrink-0">
          {photoUrl ? (
            <Image
              src={photoUrl.replace(/^http:\/\//, 'https://')}
              alt={name}
              className="w-[72px] h-[72px] object-cover object-top object-top"
              width={72}
              height={72}
            />
          ) : (
            <div className="w-[72px] h-[72px] flex items-center justify-center" style={{ backgroundColor: levelColor + '10' }}>
              <span className="text-2xl font-display font-bold" style={{ color: levelColor }}>{name.charAt(0)}</span>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-body text-[0.95rem] leading-snug font-semibold text-ink group-hover:underline">{name}</h3>
          {displayTitle && <p className="font-body text-[0.8rem] leading-relaxed text-muted line-clamp-2 mt-0.5">{displayTitle}</p>}
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            {level && (
              <span className="inline-flex items-center gap-1 font-bold uppercase tracking-wide" style={{ color: levelColor }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: levelColor }} />
                {level}
              </span>
            )}
            {party && level && <span className="text-muted">&middot;</span>}
            {party && <span className="text-muted">{party}</span>}
          </div>
        </div>
      </div>

      {/* Contact actions */}
      <div className="flex items-center gap-3 flex-wrap px-4 pb-3 pt-0">
        {email && (
          <a href={'mailto:' + email} className="flex items-center gap-1 text-xs text-blue hover:underline" onClick={function (e) { e.stopPropagation() }}>
            <Mail size={13} /> {t('card.email')}
          </a>
        )}
        {phone && (
          <a href={'tel:' + phone} className="flex items-center gap-1 text-xs text-blue hover:underline" onClick={function (e) { e.stopPropagation() }}>
            <Phone size={13} /> {t('card.call')}
          </a>
        )}
        {website && (
          <a href={website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue hover:underline" onClick={function (e) { e.stopPropagation() }}>
            <Globe size={13} /> {t('card.website')}
          </a>
        )}
        {linkedinUrl && (
          <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue hover:underline" onClick={function (e) { e.stopPropagation() }}>
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
