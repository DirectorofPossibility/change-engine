import Link from 'next/link'
import { Globe, Linkedin } from 'lucide-react'

interface CandidateCardProps {
  name: string
  party: string | null
  incumbent: string | null
  officeSought: string | null
  district: string | null
  bioSummary: string | null
  campaignWebsite: string | null
  linkedinUrl?: string | null
  policyPositions: string | null
  endorsements: string | null
}

export function CandidateCard({
  name, party, incumbent, officeSought, district,
  bioSummary, campaignWebsite, linkedinUrl, policyPositions, endorsements,
}: CandidateCardProps) {
  return (
    <div className="bg-white border border-rule p-4 hover:border-ink transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <h4 className="font-semibold text-ink">{name}</h4>
        {incumbent === 'Yes' && (
          <span className="text-xs uppercase tracking-wide font-semibold text-blue">Incumbent</span>
        )}
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted mb-2">
        {party && <span>{party}</span>}
        {party && officeSought && <span>&middot;</span>}
        {officeSought && <span>{officeSought}</span>}
        {district && <span>({district})</span>}
      </div>
      {bioSummary && <p className="text-sm text-muted mb-2 line-clamp-3">{bioSummary}</p>}
      {policyPositions && <p className="text-xs text-muted mb-2 line-clamp-2">Positions: {policyPositions}</p>}
      {endorsements && <p className="text-xs text-muted mb-2 line-clamp-1">Endorsements: {endorsements}</p>}
      <div className="flex items-center gap-3 flex-wrap">
        {campaignWebsite && (
          <Link href={campaignWebsite} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue hover:underline">
            <Globe size={12} /> Campaign website
          </Link>
        )}
        {linkedinUrl && (
          <Link href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue hover:underline">
            <Linkedin size={12} /> LinkedIn
          </Link>
        )}
      </div>
    </div>
  )
}
