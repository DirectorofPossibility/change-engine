'use client'

import { useTranslation } from '@/lib/use-translation'
import { FlowerOfLife } from '@/components/geo/sacred'

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
  color, stats, children,
}: IndexPageHeroProps) {
  const { t } = useTranslation()
  const displayTitle = titleKey ? t(titleKey) : (title ?? '')
  const displaySubtitle = subtitleKey ? t(subtitleKey) : subtitle

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ borderBottom: '2px solid #0d1117' }}
    >
      {/* Geo background element */}
      <div className="absolute top-4 right-4 opacity-[0.06] pointer-events-none">
        <FlowerOfLife color={color} size={200} />
      </div>

      <div className="relative z-10 max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="block w-6 h-px" style={{ background: color }} />
              <span
                className="font-mono text-xs uppercase tracking-[0.2em]"
                style={{ color: '#5c6474' }}
              >
                Change Engine
              </span>
            </div>

            <h1
              className="font-display leading-tight mb-2"
              style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, color: '#0d1117' }}
            >
              {displayTitle}
            </h1>
            {displaySubtitle && (
              <p
                className="font-body italic mt-2 max-w-2xl"
                style={{ fontSize: '1rem', color: '#5c6474', lineHeight: 1.6 }}
              >
                {displaySubtitle}
              </p>
            )}
            {intro && (
              <p
                className="font-body mt-3 max-w-3xl leading-relaxed"
                style={{ fontSize: '0.88rem', color: '#5c6474' }}
              >
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
          <div
            className="mt-6 pt-4 flex flex-wrap items-center gap-6"
            style={{ borderTop: '1.5px solid #dde1e8' }}
          >
            {stats.map(function (stat, i) {
              return (
                <div key={i}>
                  <span
                    className="font-display block leading-none mb-1"
                    style={{ fontSize: '1.6rem', fontWeight: 900, color }}
                  >
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </span>
                  <span
                    className="font-mono block uppercase tracking-[0.08em]"
                    style={{ fontSize: '0.6875rem', color: '#7a7265' }}
                  >
                    {stat.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
