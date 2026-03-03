import Link from 'next/link'
import { Mail, Phone, Globe } from 'lucide-react'

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
  translatedTitle?: string
}

export function OfficialCard({ id, name, title, party, level, email, phone, website, photoUrl, translatedTitle }: OfficialCardProps) {
  const displayTitle = translatedTitle || title

  return (
    <div className="bg-white rounded-xl border border-brand-border p-5 hover:shadow-md transition-shadow">
      <Link href={`/officials/${id}`} className="block mb-3">
        <div className="flex items-start gap-3">
          {photoUrl ? (
            <img src={photoUrl} alt={name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-brand-bg flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-brand-muted">{name.charAt(0)}</span>
            </div>
          )}
          <div>
            <h3 className="font-semibold text-brand-text hover:text-brand-accent transition-colors">{name}</h3>
            {displayTitle && <p className="text-sm text-brand-muted">{displayTitle}</p>}
            <div className="flex items-center gap-2 mt-1">
              {party && (
                <span className="text-xs bg-brand-bg px-2 py-0.5 rounded-lg text-brand-muted">{party}</span>
              )}
              {level && (
                <span className="text-xs bg-brand-bg px-2 py-0.5 rounded-lg text-brand-muted">{level}</span>
              )}
            </div>
          </div>
        </div>
      </Link>
      <div className="flex items-center gap-3 flex-wrap">
        {email && (
          <a href={`mailto:${email}`} className="flex items-center gap-1 text-xs text-brand-accent hover:underline">
            <Mail size={14} /> Email
          </a>
        )}
        {phone && (
          <a href={`tel:${phone}`} className="flex items-center gap-1 text-xs text-brand-accent hover:underline">
            <Phone size={14} /> Call
          </a>
        )}
        {website && (
          <a href={website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-brand-accent hover:underline">
            <Globe size={14} /> Website
          </a>
        )}
      </div>
    </div>
  )
}
