'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CENTER_COLORS, COMPASS_PROMPTS, CENTERS } from '@/lib/constants'
import { useTranslation } from '@/lib/use-translation'
import { ArrowRight, BookOpen } from 'lucide-react'
import Image from 'next/image'

interface CompassEntryProps {
  centerCounts: Record<string, number>
}

const FOL_PATTERNS: Record<string, string> = {
  Resource: '/images/fol/seed-of-life.svg',
  Learning: '/images/fol/vesica-piscis.svg',
  Action: '/images/fol/tripod-of-life.svg',
  Accountability: '/images/fol/metatrons-cube.svg',
}

const ADVENTURE_PROMPTS: Record<string, string> = {
  Resource: 'Your community has resources waiting for you. Services, benefits, and organizations ready when you are.',
  Learning: 'You want to understand. How does this work? What are your rights? Knowledge is the first step.',
  Action: 'You\'re ready to do something. Volunteer, organize, show up. Your energy can change things.',
  Accountability: 'You want answers. Who represents you? What policies affect your life? Follow the trail.',
}

const PAGE_NUMBERS: Record<string, string> = {
  Resource: 'Turn to page 12',
  Learning: 'Turn to page 27',
  Action: 'Turn to page 44',
  Accountability: 'Turn to page 61',
}

export function CompassEntry({ centerCounts }: CompassEntryProps) {
  const { t } = useTranslation()
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)
  const centers = Object.entries(COMPASS_PROMPTS)

  return (
    <section className="py-4">
      {/* Book header */}
      <div className="flex items-center gap-3 mb-5">
        <BookOpen size={20} className="text-brand-accent" />
        <div>
          <p className="text-xs font-mono font-bold uppercase tracking-widest text-brand-muted">Choose Your Adventure</p>
          <p className="text-sm text-brand-muted mt-0.5">Every choice leads somewhere meaningful. Where will you start?</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {centers.map(function ([key]) {
          const color = CENTER_COLORS[key] || '#8B7E74'
          const count = centerCounts[key] || 0
          const center = CENTERS[key]
          const isHovered = hoveredKey === key
          const folImage = FOL_PATTERNS[key] || '/images/fol/seed-of-life.svg'
          const prompt = ADVENTURE_PROMPTS[key] || ''
          const pageNum = PAGE_NUMBERS[key] || 'Turn to next page'

          return (
            <Link
              key={key}
              href={'/pathways?center=' + (center?.slug || key.toLowerCase())}
              className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-1"
              onMouseEnter={function () { setHoveredKey(key) }}
              onMouseLeave={function () { setHoveredKey(null) }}
              style={{
                background: 'linear-gradient(145deg, #F0ECE6 0%, ' + color + '10 100%)',
                border: '2px solid ' + (isHovered ? color : '#D1D5E0'),
                              }}
            >
              {/* FOL watermark */}
              <Image
                src={folImage}
                alt="" aria-hidden="true"
                className="absolute right-[-20px] top-[-20px] w-[140px] h-[140px] pointer-events-none transition-all duration-500"
                style={{
                  opacity: isHovered ? 0.12 : 0.06,
                  transform: isHovered ? 'rotate(15deg) scale(1.1)' : 'rotate(0deg)',
                }}
               width={200} height={200} />

              {/* Page corner fold */}
              <div className="absolute top-0 right-0 w-8 h-8 overflow-hidden">
                <div
                  className="absolute top-0 right-0 w-12 h-12 transform rotate-45 translate-x-3 -translate-y-3 transition-colors"
                  style={{ background: isHovered ? color + '40' : 'rgba(255,255,255,0.05)' }}
                />
              </div>

              <div className="relative z-10 p-5">
                {/* Chapter label */}
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-[9px] font-bold uppercase tracking-widest" style={{ color: color + '90' }}>
                    Chapter: {key}
                  </span>
                  {count > 0 && (
                    <span className="text-xs font-mono font-bold px-2 py-0.5" style={{ backgroundColor: color + '20', color: color }}>
                      {count} resources
                    </span>
                  )}
                </div>

                {/* Center name */}
                <h3
                  className="font-display text-xl font-bold mb-2 transition-colors"
                  style={{ color: isHovered ? color : '#0d1117' }}
                >
                  {key} Center
                </h3>

                {/* Adventure prompt */}
                <p className="text-[13px] leading-relaxed mb-4" style={{ color: '#5A6178' }}>
                  {prompt}
                </p>

                {/* Page turn CTA */}
                <div className="flex items-center justify-between">
                  <span
                    className="font-hand text-sm font-bold transition-colors"
                    style={{ color: isHovered ? color : '#5A6178' }}
                  >
                    {pageNum}
                  </span>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300"
                    style={{
                      backgroundColor: isHovered ? color : 'rgba(0,0,0,0.05)',
                    }}
                  >
                    <ArrowRight size={14} className="transition-colors" style={{ color: isHovered ? '#fff' : '#5A6178' }} />
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Book spine */}
      <div className="flex items-center justify-center gap-3 mt-6">
        <div className="h-px flex-1 max-w-[60px] bg-brand-border" />
        <Link
          href="/pathways"
          className="text-[11px] font-mono font-bold uppercase tracking-wider text-brand-muted hover:text-brand-accent transition-colors flex items-center gap-1.5"
        >
          <BookOpen size={12} />
          View the full guide
          <ArrowRight size={10} />
        </Link>
        <div className="h-px flex-1 max-w-[60px] bg-brand-border" />
      </div>
    </section>
  )
}
