/**
 * @fileoverview Life situation resource card with circular icon and image strip.
 *
 * Displays a life situation as a card with a gradient placeholder image strip
 * at the top, a filled circular icon area, the situation name, description,
 * and urgency badge. Links to the situation detail page at `/help/[slug]`.
 *
 * Supports translated name/description overrides for non-English languages.
 */
import Link from 'next/link'
import {
  AlertTriangle, Heart, Home, Briefcase, GraduationCap, Users, Shield,
  DollarSign, Scale, Baby, Stethoscope, Car, BookOpen, HandHelping,
  Building, Leaf, Vote, Megaphone, Landmark, CircleHelp,
} from 'lucide-react'
import type { ComponentType } from 'react'

/** Map of icon names to Lucide React components. */
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

/** Urgency level color configurations for background, border, text, and gradient. */
const URGENCY_COLORS: Record<string, { bg: string; border: string; text: string; gradientFrom: string; gradientTo: string }> = {
  Critical: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', gradientFrom: '#e53e3e', gradientTo: '#c53030' },
  High:     { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700', gradientFrom: '#dd6b20', gradientTo: '#c05621' },
  Medium:   { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700', gradientFrom: '#d69e2e', gradientTo: '#b7791f' },
  Low:      { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700', gradientFrom: '#38a169', gradientTo: '#2f855a' },
}

interface LifeSituationCardProps {
  /** Situation display name (English). */
  name: string
  /** URL slug for the detail page route. */
  slug: string | null
  /** Simplified description of the situation. */
  description: string | null
  /** Urgency level determining card color (Critical, High, Medium, Low). */
  urgency: string | null
  /** Lucide icon name for the situation. */
  iconName: string | null
  /** Optional translated name override for non-English display. */
  translatedName?: string
  /** Optional translated description override for non-English display. */
  translatedDescription?: string
  onSelect?: () => void
}

/**
 * Life situation card with gradient image strip, circular icon, and urgency badge.
 *
 * The top of the card features a narrow gradient strip using the urgency color,
 * with a subtle pattern overlay. The icon is displayed in a filled circle at
 * the left of the card header.
 *
 * @param props - {@link LifeSituationCardProps}
 */
export function LifeSituationCard({ name, slug, description, urgency, iconName, translatedName, translatedDescription, onSelect }: LifeSituationCardProps) {
  const colors = URGENCY_COLORS[urgency || 'Low'] || URGENCY_COLORS.Low
  const Icon = (iconName && ICON_MAP[iconName]) || CircleHelp

  const Wrapper = onSelect ? 'div' : Link
  const wrapperProps = onSelect
    ? { role: 'button' as const, tabIndex: 0, onClick: onSelect, onKeyDown: function (e: React.KeyboardEvent) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect() } }, className: `block rounded-xl border overflow-hidden hover:shadow-md transition-shadow cursor-pointer ${colors.bg} ${colors.border}` }
    : { href: '/help/' + (slug || ''), className: `block rounded-xl border overflow-hidden hover:shadow-md transition-shadow ${colors.bg} ${colors.border}` }

  return (
    <Wrapper {...wrapperProps as any}>
      {/* TODO: Replace with real Houston photography */}
      {/* Gradient image strip at top */}
      <div
        className="h-16 w-full relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${colors.gradientFrom}, ${colors.gradientTo})` }}
      >
        {/* Subtle circle pattern overlay */}
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
          {/* Circular icon area */}
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
          <span className={`inline-block mt-3 text-xs font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
            {urgency}
          </span>
        )}
      </div>
    </Wrapper>
  )
}
