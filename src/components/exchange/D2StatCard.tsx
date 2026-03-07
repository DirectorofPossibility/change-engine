interface D2StatCardProps {
  value: string | number
  label: string
  source?: string
  color?: string
}

export function D2StatCard({ value, label, source, color = '#C75B2A' }: D2StatCardProps) {
  return (
    <div className="card-stat">
      <span className="block font-hand text-[52px] font-bold leading-none mb-1.5" style={{ color }}>
        {value}
      </span>
      <span className="block text-[15px] font-semibold text-brand-muted">
        {label}
      </span>
      {source && (
        <span className="block mt-1.5 meta-source">
          {source}
        </span>
      )}
    </div>
  )
}
