'use client'

import Link from 'next/link'
import { BookOpen, HandHeart, Package, Scale, ArrowRight } from 'lucide-react'
import { CENTERS, BRAND } from '@/lib/constants'
import { useTranslation } from '@/lib/i18n'

interface CentersGridProps {
  centerCounts: Record<string, number>
}

const CENTER_ICONS: Record<string, typeof BookOpen> = {
  Learning: BookOpen,
  Action: HandHeart,
  Resource: Package,
  Accountability: Scale,
}

const CENTER_I18N: Record<string, string> = {
  Learning: 'center.learning',
  Action: 'center.action',
  Resource: 'center.resource',
  Accountability: 'center.accountability',
}

export function CentersGrid({ centerCounts }: CentersGridProps) {
  const { t } = useTranslation()

  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-0.5 rounded-full" style={{ backgroundColor: BRAND.accent }} />
        <h2 className="font-serif text-2xl font-bold tracking-tight">{t('home.four_centers')}</h2>
      </div>
      <p className="text-sm text-brand-muted font-serif italic mb-4 ml-[52px]">
        {t('home.centers_subtitle')}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.entries(CENTERS).map(function ([name, center]) {
          const Icon = CENTER_ICONS[name] || BookOpen
          const count = centerCounts[name] ?? 0

          return (
            <Link
              key={name}
              href={'/centers/' + center.slug}
              className="group flex items-start gap-4 p-5 rounded-2xl bg-white border border-brand-border hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              style={{ borderLeft: `3px solid ${BRAND.accent}` }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 transition-transform group-hover:scale-110"
                style={{ backgroundColor: BRAND.accent + '15' }}
              >
                <Icon size={20} style={{ color: BRAND.accent }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-lg font-bold text-brand-text">{t(CENTER_I18N[name])}</h3>
                  <ArrowRight
                    size={16}
                    className="text-brand-muted opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
                  />
                </div>
                <p className="text-sm text-brand-muted mt-0.5 italic font-serif">{center.question}</p>
                <span className="text-xs font-semibold mt-1.5 inline-block" style={{ color: BRAND.accent }}>
                  {count} {t('home.stats_resources').toLowerCase()}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
