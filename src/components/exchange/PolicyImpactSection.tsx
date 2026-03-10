'use client'

import { TranslatedTooltip } from '@/components/exchange/TranslatedTooltip'
import { TOOLTIPS } from '@/lib/tooltips'

interface PolicyImpactSectionProps {
  impactStatement: string
}

export function PolicyImpactSection({ impactStatement }: PolicyImpactSectionProps) {
  return (
    <section className="mb-8">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <h2 className="relative text-xl font-serif font-bold text-brand-text mb-3">
          How This Affects Your Life
          <TranslatedTooltip tip={TOOLTIPS.for_against} position="top" />
        </h2>
        <p className="text-brand-text leading-relaxed">{impactStatement}</p>
      </div>
    </section>
  )
}
