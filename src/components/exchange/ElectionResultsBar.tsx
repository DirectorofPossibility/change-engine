'use client'

/**
 * Horizontal bar chart showing candidate vote percentages for a race,
 * grouped by office_sought. Party colors: R=#e53e3e, D=#3182ce.
 */

interface CandidateResult {
  candidate_id: string
  candidate_name: string
  party: string | null
  incumbent: string | null
  vote_pct: number | null
  vote_count: number | null
  advanced_to_runoff: string | null
}

interface ElectionResultsBarProps {
  office: string
  district?: string | null
  candidates: CandidateResult[]
}

const PARTY_COLORS: Record<string, string> = {
  Republican: '#e53e3e',
  Democratic: '#3182ce',
  Libertarian: '#d69e2e',
  Green: '#38a169',
  Independent: '#8B7E74',
}

export function ElectionResultsBar({ office, district, candidates }: ElectionResultsBarProps) {
  const sorted = [...candidates].sort(function (a, b) {
    return (b.vote_pct ?? 0) - (a.vote_pct ?? 0)
  })

  return (
    <div className="bg-white rounded-xl border border-brand-border p-5">
      <h4 className="font-semibold text-brand-text text-sm mb-1">{office}</h4>
      {district && (
        <p className="text-xs text-brand-muted mb-3">{district}</p>
      )}
      <div className="space-y-3">
        {sorted.map(function (c) {
          const color = PARTY_COLORS[c.party || ''] || '#8B7E74'
          const pct = c.vote_pct ?? 0
          return (
            <div key={c.candidate_id}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-brand-text">{c.candidate_name}</span>
                  {c.party && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full text-white font-medium"
                      style={{ backgroundColor: color }}
                    >
                      {c.party.charAt(0)}
                    </span>
                  )}
                  {c.incumbent === 'Yes' && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-brand-bg text-brand-muted">
                      Incumbent
                    </span>
                  )}
                  {c.advanced_to_runoff === 'Yes' && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                      Runoff
                    </span>
                  )}
                </div>
                <span className="text-sm font-semibold text-brand-text">{pct}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full transition-all duration-500"
                  style={{ width: pct + '%', backgroundColor: color }}
                />
              </div>
              {c.vote_count != null && (
                <p className="text-xs text-brand-muted mt-0.5">
                  {c.vote_count.toLocaleString()} votes
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
