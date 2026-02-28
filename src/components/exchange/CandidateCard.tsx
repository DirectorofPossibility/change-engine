import Link from 'next/link'
import { Globe } from 'lucide-react'

interface CandidateCardProps {
  name: string
  party: string | null
  incumbent: string | null
  officeSought: string | null
  district: string | null
  bioSummary: string | null
  campaignWebsite: string | null
  policyPositions: string | null
  endorsements: string | null
}

export function CandidateCard({
  name, party, incumbent, officeSought, district,
  bioSummary, campaignWebsite, policyPositions, endorsements,
}: CandidateCardProps) {
  return (
    <div className="bg-white rounded-xl border border-brand-border p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-2">
        <h4 className="font-semibold text-brand-text">{name}</h4>
        {incumbent === 'Yes' && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-brand-accent/10 text-brand-accent font-medium">Incumbent</span>
        )}
      </div>
      <div className="flex items-center gap-2 text-xs text-brand-muted mb-2">
        {party && <span className="bg-brand-bg px-2 py-0.5 rounded-full">{party}</span>}
        {officeSought && <span>{officeSought}</span>}
        {district && <span>({district})</span>}
      </div>
      {bioSummary && <p className="text-sm text-brand-muted mb-2 line-clamp-3">{bioSummary}</p>}
      {policyPositions && <p className="text-xs text-brand-muted mb-2 line-clamp-2">Positions: {policyPositions}</p>}
      {endorsements && <p className="text-xs text-brand-muted mb-2 line-clamp-1">Endorsements: {endorsements}</p>}
      {campaignWebsite && (
        <Link href={campaignWebsite} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-brand-accent hover:underline">
          <Globe size={12} /> Campaign website
        </Link>
      )}
    </div>
  )
}
