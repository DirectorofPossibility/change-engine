'use client'

/**
 * Horizontal bar showing election turnout percentage with a
 * plain-language label: "X of every 100 registered voters participated."
 */

interface TurnoutGaugeProps {
  turnoutPct: number
  electionName?: string
}

export function TurnoutGauge({ turnoutPct, electionName }: TurnoutGaugeProps) {
  const rounded = Math.round(turnoutPct)

  return (
    <div className="bg-white border border-brand-border p-5">
      {electionName && (
        <p className="text-sm text-brand-muted mb-1">{electionName}</p>
      )}
      <div className="flex items-end justify-between mb-2">
        <h4 className="font-semibold text-brand-text text-sm">Voter Turnout</h4>
        <span className="text-2xl font-bold text-brand-accent">{parseFloat(turnoutPct.toFixed(1))}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-3 mb-2">
        <div
          className="h-3 rounded-full bg-brand-accent transition-all duration-700"
          style={{ width: turnoutPct + '%' }}
        />
      </div>
      <p className="text-sm text-brand-muted">
        About <strong className="text-brand-text">{rounded} of every 100</strong> registered voters participated.
      </p>
    </div>
  )
}
