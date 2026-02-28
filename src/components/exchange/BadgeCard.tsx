import { Award } from 'lucide-react'

interface BadgeCardProps {
  name: string
  description: string | null
  points: number | null
  color: string | null
  iconName: string | null
}

export function BadgeCard({ name, description, points, color }: BadgeCardProps) {
  return (
    <div className="bg-white rounded-xl border border-brand-border p-5 flex items-start gap-4">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: (color || '#C75B2A') + '20' }}
      >
        <Award size={24} style={{ color: color || '#C75B2A' }} />
      </div>
      <div>
        <h4 className="font-semibold text-brand-text">{name}</h4>
        {description && <p className="text-sm text-brand-muted mt-1">{description}</p>}
        {points != null && (
          <p className="text-xs text-brand-accent font-medium mt-1">{points} points</p>
        )}
      </div>
    </div>
  )
}
