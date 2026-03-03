/**
 * @fileoverview Official card component with enlarged circular photo and color ring.
 *
 * Displays an elected official with a large circular photo (or initial avatar),
 * surrounded by a subtle ring in the official's government level color. Shows
 * the official's name, title, party, level, and contact links.
 *
 * Links to the official detail page at `/officials/[id]`.
 */
'use client'

import Link from 'next/link'
import { Mail, Phone, Globe } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

/** Color assignments for each government level, used for the circular ring. */
const LEVEL_COLORS: Record<string, string> = {
  Federal: '#3182ce',
  State: '#805ad5',
  County: '#d69e2e',
  City: '#38a169',
  'School District': '#dd6b20',
}

/** Default ring color when the level is unknown. */
const DEFAULT_LEVEL_COLOR = '#8B7E74'

interface OfficialCardProps {
  /** Unique ID used to build the official detail route. */
  id: string
  /** Official's full name. */
  name: string
  /** Official's position title (e.g., 'U.S. Senator'). */
  title: string | null
  /** Political party affiliation. */
  party: string | null
  /** Government level (Federal, State, County, City). */
  level: string | null
  /** Contact email address. */
  email: string | null
  /** Contact phone number. */
  phone: string | null
  /** Official's website URL. */
  website: string | null
  /** URL to the official's photo. */
  photoUrl?: string | null
  /** Optional translated title for non-English display. */
  translatedTitle?: string
  onSelect?: () => void
}

/**
 * Official card with enlarged circular photo/avatar and government-level color ring.
 *
 * The photo or initial avatar is displayed at 64x64px with a 3px ring in the
 * government level's assigned color. Contact links (email, phone, website) are
 * shown below the official's details.
 *
 * @param props - {@link OfficialCardProps}
 */
export function OfficialCard({ id, name, title, party, level, email, phone, website, photoUrl, translatedTitle, onSelect }: OfficialCardProps) {
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
          {/* Enlarged circular photo with level-colored ring */}
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
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {party && (
                <span className="text-xs bg-brand-bg px-2 py-0.5 rounded-full text-brand-muted">{party}</span>
              )}
              {level && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                  style={{ backgroundColor: ringColor }}
                >
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
      </div>
    </div>
  )
}
