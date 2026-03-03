'use client'

import Image from 'next/image'
import { useTranslation } from '@/lib/i18n'

const HEIGHT_MAP = {
  sm: 'min-h-[160px] sm:min-h-[200px]',
  md: 'min-h-[200px] sm:min-h-[280px]',
  lg: 'min-h-[280px] sm:min-h-[380px]',
} as const

interface PageHeroProps {
  title?: string
  titleKey?: string
  subtitle?: string
  subtitleKey?: string
  /** Editorial intro paragraph below the subtitle */
  intro?: string
  introKey?: string
  /** Height preset. Defaults to 'md'. */
  height?: 'sm' | 'md' | 'lg'
  /** Visual variant */
  variant?: 'image' | 'gradient' | 'editorial'
  /** For image variant: background image path */
  backgroundImage?: string
  /** For gradient variant: primary theme color */
  gradientColor?: string
  /** Show decorative circle mesh on gradient heroes */
  showCircleMesh?: boolean
}

/** Decorative SVG circles for gradient heroes — echoes the circle knowledge graph */
function CircleMeshDecoration({ color }: { color: string }) {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 800 300"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <circle cx="680" cy="150" r="120" fill={color} opacity="0.06" />
      <circle cx="620" cy="80" r="80" fill={color} opacity="0.05" />
      <circle cx="740" cy="220" r="60" fill={color} opacity="0.04" />
      <circle cx="560" cy="200" r="50" fill={color} opacity="0.03" />
      <circle cx="700" cy="60" r="40" fill={color} opacity="0.05" />
      <circle cx="500" cy="120" r="90" fill={color} opacity="0.03" />
      {/* Connecting lines */}
      <line x1="680" y1="150" x2="620" y2="80" stroke={color} strokeWidth="1" opacity="0.06" strokeDasharray="4 4" />
      <line x1="680" y1="150" x2="740" y2="220" stroke={color} strokeWidth="1" opacity="0.06" strokeDasharray="4 4" />
      <line x1="620" y1="80" x2="500" y2="120" stroke={color} strokeWidth="1" opacity="0.05" strokeDasharray="4 4" />
    </svg>
  )
}

export function PageHero({
  title, titleKey, subtitle, subtitleKey,
  intro, introKey,
  height = 'md',
  variant,
  backgroundImage,
  gradientColor,
  showCircleMesh,
}: PageHeroProps) {
  const { t } = useTranslation()
  const displayTitle = titleKey ? t(titleKey) : (title ?? '')
  const displaySubtitle = subtitleKey ? t(subtitleKey) : subtitle
  const displayIntro = introKey ? t(introKey) : intro

  // Auto-detect variant
  const resolvedVariant = variant ?? (backgroundImage ? 'image' : gradientColor ? 'gradient' : 'editorial')

  if (resolvedVariant === 'image') {
    return (
      <section className={`relative ${HEIGHT_MAP[height]} w-full overflow-hidden flex items-end`}>
        <Image src={backgroundImage!} alt="" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/70" />
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white drop-shadow-lg">
            {displayTitle}
          </h1>
          {displaySubtitle && (
            <p className="text-base sm:text-lg text-gray-200 mt-2 max-w-2xl drop-shadow">{displaySubtitle}</p>
          )}
          {displayIntro && (
            <p className="text-sm sm:text-base text-gray-300 mt-3 max-w-3xl leading-relaxed">{displayIntro}</p>
          )}
        </div>
      </section>
    )
  }

  if (resolvedVariant === 'gradient') {
    const gc = gradientColor || '#C75B2A'
    return (
      <section className={`relative ${HEIGHT_MAP[height]} w-full overflow-hidden`}>
        {/* Gradient background */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${gc}12 0%, ${gc}06 40%, transparent 70%)`,
          }}
        />
        {/* Decorative circles */}
        {showCircleMesh && <CircleMeshDecoration color={gc} />}
        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, ${gc}, transparent 60%)` }} />

        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center py-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: gc }} />
            <div className="h-px flex-1 max-w-[60px]" style={{ backgroundColor: gc, opacity: 0.3 }} />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-brand-text leading-tight">
            {displayTitle}
          </h1>
          {displaySubtitle && (
            <p className="text-base sm:text-lg text-brand-muted mt-2 max-w-2xl font-serif italic">{displaySubtitle}</p>
          )}
          {displayIntro && (
            <p className="text-sm sm:text-base text-brand-muted mt-4 max-w-3xl leading-relaxed">{displayIntro}</p>
          )}
        </div>
      </section>
    )
  }

  // Editorial variant — warm typographic hero
  return (
    <section className="relative w-full overflow-hidden border-b border-brand-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Decorative rule */}
        <div className="w-12 h-0.5 bg-brand-accent mb-5" />
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-brand-text leading-tight">
          {displayTitle}
        </h1>
        {displaySubtitle && (
          <p className="text-lg text-brand-muted mt-2 font-serif italic">{displaySubtitle}</p>
        )}
        {displayIntro && (
          <p className="text-base text-brand-muted mt-4 max-w-3xl leading-relaxed">{displayIntro}</p>
        )}
      </div>
    </section>
  )
}
