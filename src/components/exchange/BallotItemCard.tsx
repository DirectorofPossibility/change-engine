'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface BallotItemCardProps {
  name: string
  itemType: string | null
  description: string | null
  forArgument: string | null
  againstArgument: string | null
  fiscalImpact: string | null
  passed: string | null
  voteForPct: number | null
}

export function BallotItemCard({
  name, itemType, description, forArgument, againstArgument,
  fiscalImpact, passed, voteForPct,
}: BallotItemCardProps) {
  const [showFor, setShowFor] = useState(false)
  const [showAgainst, setShowAgainst] = useState(false)

  return (
    <div className="bg-white rounded-xl border border-brand-border p-4">
      <div className="flex items-center gap-2 mb-2">
        {itemType && (
          <span className="text-xs uppercase tracking-wide font-semibold text-brand-muted">{itemType}</span>
        )}
        {passed != null && (
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${passed === 'Yes' ? 'text-green-700' : 'text-red-700'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${passed === 'Yes' ? 'bg-green-500' : 'bg-red-500'}`} />
            {passed === 'Yes' ? 'Passed' : 'Failed'}
          </span>
        )}
      </div>
      <h4 className="font-semibold text-brand-text mb-2">{name}</h4>
      {description && <p className="text-sm text-brand-muted mb-3">{description}</p>}

      {voteForPct != null && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-brand-muted mb-1">
            <span>For: {parseFloat(voteForPct.toFixed(1))}%</span>
            <span>Against: {parseFloat((100 - voteForPct).toFixed(1))}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ width: voteForPct + '%' }} />
          </div>
        </div>
      )}

      {forArgument && (
        <div className="mb-2">
          <button onClick={function () { setShowFor(!showFor) }} className="flex items-center gap-1 text-xs text-brand-accent font-medium">
            {showFor ? <ChevronUp size={14} /> : <ChevronDown size={14} />} For
          </button>
          {showFor && <p className="text-xs text-brand-muted mt-1 pl-4">{forArgument}</p>}
        </div>
      )}
      {againstArgument && (
        <div className="mb-2">
          <button onClick={function () { setShowAgainst(!showAgainst) }} className="flex items-center gap-1 text-xs text-red-600 font-medium">
            {showAgainst ? <ChevronUp size={14} /> : <ChevronDown size={14} />} Against
          </button>
          {showAgainst && <p className="text-xs text-brand-muted mt-1 pl-4">{againstArgument}</p>}
        </div>
      )}
      {fiscalImpact && <p className="text-xs text-brand-muted mt-2">Fiscal impact: {fiscalImpact}</p>}
    </div>
  )
}
