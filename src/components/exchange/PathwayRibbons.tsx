'use client'

import Link from 'next/link'
import { THEMES } from '@/lib/constants'
import { useTranslation } from '@/lib/use-translation'

interface PathwayRibbonsProps {
  pathwayCounts: Record<string, number>
}

export function PathwayRibbons({ pathwayCounts }: PathwayRibbonsProps) {
  const { t } = useTranslation()

  return (
    <section className="py-12">
      {/* Spectrum bar */}
      <div className="flex h-1 max-w-md mx-auto rounded-full overflow-hidden mb-8">
        {Object.values(THEMES).map(function (theme, i) {
          return (
            <div
              key={i}
              className="flex-1 transition-all duration-300 hover:flex-[3]"
              style={{ backgroundColor: theme.color }}
              title={theme.name}
            />
          )
        })}
      </div>

      <div className="text-center mb-6">
        <h2 className="font-display text-2xl font-bold tracking-tight text-brand-text mb-1">
          {t('home.seven_pathways')}
        </h2>
        <p className="text-sm text-brand-muted font-body italic">
          {t('home.pathways_subtitle')}
        </p>
      </div>

      {/* Mobile: horizontal scroll with snap. Desktop: grid */}
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 sm:grid sm:grid-cols-3 lg:grid-cols-4 sm:overflow-visible sm:pb-0">
        {Object.entries(THEMES).map(function ([id, theme]) {
          const count = pathwayCounts[id] ?? 0
          return (
            <Link
              key={id}
              href={'/pathways/' + theme.slug}
              className="group flex-shrink-0 w-[240px] sm:w-auto snap-start bg-white border border-brand-border overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              {/* Color accent bar */}
              <div className="h-1.5" style={{ backgroundColor: theme.color }} />

              <div className="p-4">
                <h3 className="font-display font-bold text-brand-text text-[15px] mb-1">
                  {theme.name}
                </h3>
                <p className="text-xs text-brand-muted leading-relaxed line-clamp-2">
                  {theme.description.split('.')[0]}.
                </p>

                {/* Count on hover */}
                <div className="mt-3 flex items-center justify-between">
                  <span
                    className="text-xs font-medium opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    style={{ color: theme.color }}
                  >
                    {count} {t('home.stats_resources').toLowerCase()}
                  </span>
                  <span
                    className="text-xs font-semibold opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    style={{ color: theme.color }}
                  >
                    {t('home.see_all')} →
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
