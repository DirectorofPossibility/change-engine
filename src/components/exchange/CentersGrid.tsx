'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { CENTERS, BRAND } from '@/lib/constants'
import { useTranslation } from '@/lib/use-translation'

interface CentersGridProps {
  centerCounts: Record<string, number>
}

const CENTER_IMAGES: Record<string, string> = {
  Learning: '/images/centers/learning.svg',
  Action: '/images/centers/action.svg',
  Resource: '/images/centers/resource.svg',
  Accountability: '/images/centers/accountability.svg',
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
        <h2 className="font-display text-2xl font-bold tracking-tight">{t('home.four_centers')}</h2>
      </div>
      <p className="text-sm text-brand-muted font-body italic mb-4 ml-[52px]">
        {t('home.centers_subtitle')}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(CENTERS).map(function ([name, center]) {
          const count = centerCounts[name] ?? 0
          const imgSrc = CENTER_IMAGES[name]

          return (
            <Link
              key={name}
              href={'/centers/' + center.slug}
              className="group flex flex-col items-center text-center gap-4 p-7 bg-white border border-brand-border hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              {imgSrc && (
                <Image
                  src={imgSrc}
                  alt={name}
                  width={80}
                  height={80}
                  className="transition-transform group-hover:scale-110"
                />
              )}
              <h3 className="font-display text-xl font-bold text-brand-text">{t(CENTER_I18N[name])}</h3>
              <p className="text-sm text-brand-muted italic font-body">{center.question}</p>
              <div className="flex items-center gap-1.5 mt-auto">
                <span className="text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: BRAND.accent }}>
                  {count} {t('home.stats_resources').toLowerCase()}
                </span>
                <ArrowRight
                  size={14}
                  className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
                  style={{ color: BRAND.accent }}
                />
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
