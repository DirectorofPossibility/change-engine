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

const URGENCY_COLORS: Record<string, { bg: string; border: string; text: string; gradientFrom: string; gradientTo: string }> = {
  Critical: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', gradientFrom: '#e53e3e', gradientTo: '#c53030' },
  High:     { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700', gradientFrom: '#dd6b20', gradientTo: '#c05621' },
  Medium:   { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700', gradientFrom: '#d69e2e', gradientTo: '#b7791f' },
  Low:      { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700', gradientFrom: '#38a169', gradientTo: '#2f855a' },
}

interface LifeSituationCardProps {
  name: string
  slug: string | null
  description: string | null
  urgency: string | null
  iconName: string | null
  translatedName?: string
  translatedDescription?: string
  onSelect?: () => void
}

export function LifeSituationCard({ name, slug, description, urgency, iconName, translatedName, translatedDescription, onSelect }: LifeSituationCardProps) {
  const colors = URGENCY_COLORS[urgency || 'Low'] || URGENCY_COLORS.Low
  const Icon = (iconName && ICON_MAP[iconName]) || CircleHelp

  const Wrapper = onSelect ? 'div' : Link
  const wrapperProps = onSelect
    ? { role: 'button' as const, tabIndex: 0, onClick: onSelect, onKeyDown: function (e: React.KeyboardEvent) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect() } }, className: `block rounded-xl border overflow-hidden hover:shadow-md transition-shadow cursor-pointer ${colors.bg} ${colors.border}` }
    : { href: '/help/' + (slug || ''), className: `block rounded-xl border overflow-hidden hover:shadow-md transition-shadow ${colors.bg} ${colors.border}` }

  return (
    <Wrapper {...wrapperProps as any}>
      <div
        className="h-16 w-full relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${colors.gradientFrom}, ${colors.gradientTo})` }}
      >
        <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 400 60" preserveAspectRatio="none">
          <circle cx="50" cy="30" r="20" fill="white"/>
          <circle cx="120" cy="15" r="12" fill="white"/>
          <circle cx="200" cy="40" r="18" fill="white"/>
          <circle cx="300" cy="20" r="15" fill="white"/>
          <circle cx="370" cy="35" r="10" fill="white"/>
        </svg>
      </div>
      <div className="p-5">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: colors.gradientFrom }}
          >
            <Icon size={18} className="text-white" />
          </div>
          <h3 className={`font-semibold ${colors.text}`}>{translatedName || name}</h3>
        </div>
        {(translatedDescription || description) && (
          <p className="text-sm text-brand-muted line-clamp-2">{translatedDescription || description}</p>
        )}
        {urgency && (
          <span className={`inline-flex items-center gap-1.5 mt-3 text-xs font-medium ${colors.text}`}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.gradientFrom }} />
            {urgency}
          </span>
        )}
      </div>
    </Wrapper>
  )
}
