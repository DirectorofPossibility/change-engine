import Link from 'next/link'
import {
  AlertTriangle, Heart, Home, Briefcase, GraduationCap, Users, Shield,
  DollarSign, Scale, Baby, Stethoscope, Car, BookOpen, HandHelping,
  Building, Leaf, Vote, Megaphone, Landmark, CircleHelp,
} from 'lucide-react'
import type { ComponentType } from 'react'

const ICON_MAP: Record<string, ComponentType<{ size?: number; className?: string }>> = {
  'alert-triangle': AlertTriangle,
  'heart': Heart,
  'home': Home,
  'briefcase': Briefcase,
  'graduation-cap': GraduationCap,
  'users': Users,
  'shield': Shield,
  'dollar-sign': DollarSign,
  'scale': Scale,
  'baby': Baby,
  'stethoscope': Stethoscope,
  'car': Car,
  'book-open': BookOpen,
  'hand-helping': HandHelping,
  'building': Building,
  'leaf': Leaf,
  'vote': Vote,
  'megaphone': Megaphone,
  'landmark': Landmark,
  'circle-help': CircleHelp,
}

const URGENCY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  Critical: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700' },
  High:     { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700' },
  Medium:   { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700' },
  Low:      { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700' },
}

interface LifeSituationCardProps {
  name: string
  slug: string | null
  description: string | null
  urgency: string | null
  iconName: string | null
}

export function LifeSituationCard({ name, slug, description, urgency, iconName }: LifeSituationCardProps) {
  const colors = URGENCY_COLORS[urgency || 'Low'] || URGENCY_COLORS.Low
  const Icon = (iconName && ICON_MAP[iconName]) || CircleHelp

  return (
    <Link
      href={`/help/${slug || ''}`}
      className={`block rounded-xl border p-5 hover:shadow-md transition-shadow ${colors.bg} ${colors.border}`}
    >
      <div className="flex items-center gap-3 mb-2">
        <Icon size={20} className={colors.text} />
        <h3 className={`font-semibold ${colors.text}`}>{name}</h3>
      </div>
      {description && (
        <p className="text-sm text-brand-muted line-clamp-2">{description}</p>
      )}
      {urgency && (
        <span className={`inline-block mt-3 text-xs font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
          {urgency}
        </span>
      )}
    </Link>
  )
}
