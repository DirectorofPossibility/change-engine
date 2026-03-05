'use client'

import Link from 'next/link'
import { CENTER_COLORS, COMPASS_PROMPTS, CENTERS } from '@/lib/constants'
import { useTranslation } from '@/lib/use-translation'

interface CompassEntryProps {
  centerCounts: Record<string, number>
}

export function CompassEntry({ centerCounts }: CompassEntryProps) {
  const { t } = useTranslation()

  const centers = Object.entries(COMPASS_PROMPTS)

  return (
    <section className="py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {centers.map(([key, { i18nKey }]) => {
          const color = CENTER_COLORS[key] || '#8B7E74'
          const count = centerCounts[key] || 0
          const center = CENTERS[key]

          return (
            <Link
              key={key}
              href={'/pathways?center=' + (center?.slug || key.toLowerCase())}
              className="group relative bg-white rounded-xl border border-brand-border hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex"
            >
              {/* Left color bar */}
              <div
                className="w-1 group-hover:w-1.5 transition-all duration-200 flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <div className="flex-1 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-brand-text">{key}</h3>
                    <p className="text-sm font-serif italic text-brand-muted mt-1 leading-snug">
                      {t(i18nKey)}
                    </p>
                  </div>
                  {count > 0 && (
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-lg ml-3 flex-shrink-0"
                      style={{ backgroundColor: color + '14', color }}
                    >
                      {count} {t('compass.items')}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="text-center mt-4">
        <Link
          href="/pathways"
          className="text-xs font-semibold text-brand-muted hover:text-brand-accent transition-colors"
        >
          {t('compass.show_all')} &rarr;
        </Link>
      </div>
    </section>
  )
}
