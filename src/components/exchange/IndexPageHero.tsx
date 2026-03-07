'use client'

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
  color: string
  stats?: StatItem[]
  pattern?: 'flower' | 'seed' | 'vesica' | 'tripod' | 'metatron' | 'borromean'
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
    <section className="relative w-full overflow-hidden bg-brand-bg">
      {/* FOL watermark */}
      <img
        src="/images/fol/flower-full.svg"
        alt=""
        aria-hidden="true"
        className="absolute right-[-80px] top-1/2 -translate-y-1/2 w-[420px] h-[420px] pointer-events-none opacity-[0.04]"
      />
      <div className="absolute left-[-30px] bottom-[-20px] opacity-[0.04]">
        <FOLWatermark variant={pattern} size="md" color={color} />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
              <div className="h-px flex-1 max-w-[80px]" style={{ backgroundColor: color, opacity: 0.5 }} />
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-display font-serif font-bold leading-tight text-brand-text">
              {displayTitle}
            </h1>
            {displaySubtitle && (
              <p className="text-base sm:text-lg text-brand-muted mt-2 max-w-2xl font-serif italic">
                {displaySubtitle}
              </p>
            )}
            {intro && (
              <p className="text-sm sm:text-base text-brand-muted-light mt-3 max-w-3xl leading-relaxed">
                {intro}
              </p>
            )}
          </div>

          {children && (
            <div className="lg:flex-shrink-0 lg:w-[340px]">
              {children}
            </div>
          )}
        </div>

        {stats && stats.length > 0 && (
          <div className="mt-8 pt-5 border-t border-brand-border flex flex-wrap items-center gap-6 sm:gap-10">
            {stats.map(function (stat, i) {
              return (
                <div key={i} className="text-center">
                  <p className="text-2xl sm:text-3xl font-serif font-bold" style={{ color }}>{stat.value}</p>
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-muted mt-0.5">{stat.label}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="h-1" style={{ background: `linear-gradient(90deg, ${color}, transparent 60%)` }} />
    </section>
  )
}
