import type { ReactNode } from 'react'

interface StatsCardProps {
  label: string
  value: number | string
  icon?: ReactNode
  className?: string
}

export function StatsCard({ label, value, icon, className = '' }: StatsCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-brand-border p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-brand-muted">{label}</p>
          <p className="text-3xl font-bold mt-1">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        </div>
        {icon && <span className="text-3xl text-brand-muted">{icon}</span>}
      </div>
    </div>
  )
}
