'use client'

/**
 * Warm-background card showing a community impact summary in plain language.
 * Used on election pages to explain "What this means for your community."
 */

import { Heart } from 'lucide-react'

interface CommunityImpactCardProps {
  summary: string
  heading?: string
}

export function CommunityImpactCard({ summary, heading }: CommunityImpactCardProps) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-2">
        <Heart size={16} className="text-brand-accent" />
        <h4 className="font-semibold text-brand-text text-sm">
          {heading || 'What this means for your community'}
        </h4>
      </div>
      <p className="text-sm text-brand-text leading-relaxed">{summary}</p>
    </div>
  )
}
