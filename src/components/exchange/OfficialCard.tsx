import { Mail, Phone, Globe } from 'lucide-react'

interface OfficialCardProps {
  name: string
  title: string | null
  party: string | null
  level: string | null
  email: string | null
  phone: string | null
  website: string | null
}

export function OfficialCard({ name, title, party, level, email, phone, website }: OfficialCardProps) {
  return (
    <div className="bg-white rounded-xl border border-brand-border p-5">
      <div className="mb-3">
        <h3 className="font-semibold text-brand-text">{name}</h3>
        {title && <p className="text-sm text-brand-muted">{title}</p>}
        <div className="flex items-center gap-2 mt-1">
          {party && (
            <span className="text-xs bg-brand-bg px-2 py-0.5 rounded-full text-brand-muted">{party}</span>
          )}
          {level && (
            <span className="text-xs bg-brand-bg px-2 py-0.5 rounded-full text-brand-muted">{level}</span>
          )}
        </div>
      </div>
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
