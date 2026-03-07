'use client'

/**
 * IndexPageHero — Immersive hero for listing/index pages.
 *
 * Social psychology principles:
 * - Social proof: stats bar shows community scale ("247 organizations")
 * - Anchoring: featured color + icon gives immediate visual identity
 * - Belonging: warm language + community framing
 * - Reduced cognitive load: immediate action (search/ZIP) embedded in hero
 *
 * Replaces the generic PageHero on all index pages with a rich,
 * contextual, visually distinct hero per page type.
 */

import { FOLWatermark } from './FOLWatermark'
import { useTranslation } from '@/lib/use-translation'

interface StatItem {
  value: string | number
  label: string
}

interface IndexPageHeroProps {
  titleKey?: string
  title?: string
  subtitleKey?: string
  subtitle?: string
  intro?: string
  /** Primary accent color for this page */
  color: string
  /** Stats to show in the social proof strip */
  stats?: StatItem[]
  /** FOL geometry variant for background */
  pattern?: 'flower' | 'seed' | 'vesica' | 'tripod' | 'metatron' | 'borromean'
  /** Inline action area (search, ZIP input, etc.) */
  children?: React.ReactNode
}

export function IndexPageHero({
  titleKey, title, subtitleKey, subtitle, intro,
  color, stats, pattern = 'flower', children,
}: IndexPageHeroProps) {
  const { t } = useTranslation()
  const displayTitle = titleKey ? t(titleKey) : (title ?? '')
  const displaySubtitle = subtitleKey ? t(subtitleKey) : subtitle

  return (
    <section className="relative w-full overflow-hidden bg-brand-dark text-white">
      {/* FOL watermark — large static SVG, right side */}
      <img
        src="/images/fol/flower-white.svg"
        alt=""
        aria-hidden="true"
        className="absolute right-[-80px] top-1/2 -translate-y-1/2 w-[420px] h-[420px] pointer-events-none opacity-[0.04]"
      />
      {/* Secondary pattern — smaller, left */}
      <div className="absolute left-[-30px] bottom-[-20px] opacity-[0.04]">
        <FOLWatermark variant={pattern} size="md" color="#ffffff" />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          {/* Left — text */}
          <div className="flex-1 min-w-0">
            {/* Color accent bar */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
              <div className="h-px flex-1 max-w-[80px]" style={{ backgroundColor: color, opacity: 0.5 }} />
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-display font-serif font-bold leading-tight">
              {displayTitle}
            </h1>
            {displaySubtitle && (
              <p className="text-base sm:text-lg text-white/70 mt-2 max-w-2xl font-serif italic">
                {displaySubtitle}
              </p>
            )}
            {intro && (
              <p className="text-sm sm:text-base text-white/55 mt-3 max-w-3xl leading-relaxed">
                {intro}
              </p>
            )}
          </div>

          {/* Right — inline action (search, ZIP, etc.) */}
          {children && (
            <div className="lg:flex-shrink-0 lg:w-[340px]">
              {children}
            </div>
          )}
        </div>

        {/* Stats bar — social proof */}
        {stats && stats.length > 0 && (
          <div className="mt-8 pt-5 border-t border-white/[0.08] flex flex-wrap items-center gap-6 sm:gap-10">
            {stats.map(function (stat, i) {
              return (
                <div key={i} className="text-center">
                  <p className="text-2xl sm:text-3xl font-serif font-bold" style={{ color }}>{stat.value}</p>
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-white/35 mt-0.5">{stat.label}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Bottom color bar */}
      <div className="h-1" style={{ background: `linear-gradient(90deg, ${color}, transparent 60%)` }} />
    </section>
  )
}
