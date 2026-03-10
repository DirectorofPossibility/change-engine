'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { CENTERS, BRAND, CENTER_COLORS } from '@/lib/constants'
import { useTranslation } from '@/lib/use-translation'

interface CenterDoorwaysProps {
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

export function CenterDoorways({ centerCounts }: CenterDoorwaysProps) {
  const { t } = useTranslation()

  return (
    <section className="py-12">
      <div className="text-center mb-8">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-brand-text mb-2">
          {t('home.choose_path')}
        </h2>
        <p className="text-sm text-brand-muted font-serif italic">
          {t('home.choose_subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-[1200px] mx-auto">
        {Object.entries(CENTERS).map(function ([name, center]) {
          const count = centerCounts[name] ?? 0
          const imgSrc = CENTER_IMAGES[name]
          const color = CENTER_COLORS[name] || BRAND.accent

          return (
            <Link
              key={name}
              href={'/centers/' + center.slug}
              className="group relative flex flex-col items-center text-center gap-5 p-8 min-h-[280px] rounded-3xl bg-white border border-brand-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              {/* Subtle gradient background on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `radial-gradient(circle at 50% 30%, ${color}08, transparent 70%)` }}
                aria-hidden="true"
              />

              {/* SVG illustration */}
              <div className="relative z-10 mt-2">
                {imgSrc && (
                  <Image
                    src={imgSrc}
                    alt={name}
                    width={140}
                    height={140}
                    className="transition-transform duration-300 group-hover:scale-110"
                  />
                )}
              </div>

              {/* Center name */}
              <h3 className="relative z-10 font-serif text-xl font-bold text-brand-text">
                {t(CENTER_I18N[name])}
              </h3>

              {/* Guiding question */}
              <p className="relative z-10 text-sm text-brand-muted italic font-serif">
                &ldquo;{center.question}&rdquo;
              </p>

              {/* Resource count badge */}
              {count > 0 && (
                <span className="absolute top-4 right-4 text-xs font-medium text-brand-muted/60 bg-brand-bg rounded-full px-2.5 py-0.5">
                  {count}
                </span>
              )}

              {/* Begin here reveal */}
              <div className="relative z-10 flex items-center gap-1.5 mt-auto opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                <span className="text-sm font-semibold" style={{ color: BRAND.accent }}>
                  {t('home.begin_here')}
                </span>
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
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
