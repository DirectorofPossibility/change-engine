'use client'

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
      <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
              <div className="h-px flex-1 max-w-[60px]" style={{ backgroundColor: color, opacity: 0.4 }} />
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold leading-tight text-brand-text">
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
          <div className="mt-4 pt-3 border-t border-brand-border flex flex-wrap items-center gap-5 sm:gap-8">
            {stats.map(function (stat, i) {
              return (
                <div key={i} className="text-center">
                  <p className="text-xl sm:text-2xl font-serif font-bold" style={{ color }}>{stat.value}</p>
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
