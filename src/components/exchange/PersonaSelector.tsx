'use client'

import { useState } from 'react'
import Link from 'next/link'
import { THEMES } from '@/lib/constants'
import { PERSONAS } from '@/lib/data/personas'

export function PersonaSelector() {
  const [expanded, setExpanded] = useState<string | null>(null)

  function toggle(id: string) {
    setExpanded(expanded === id ? null : id)
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {PERSONAS.map(function (persona) {
          const isOpen = expanded === persona.id
          const firstThemeId = persona.matchedPathways[0]
          const firstTheme = firstThemeId ? THEMES[firstThemeId as keyof typeof THEMES] : null
          return (
            <div key={persona.id}>
              <button
                onClick={function () { toggle(persona.id) }}
                className="w-full text-left bg-white rounded-xl border-2 border-brand-border p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 relative overflow-hidden"
                style={{
                  borderColor: isOpen ? persona.color + '60' : undefined,
                }}
              >
                <div
                  className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-200"
                  style={{ backgroundColor: persona.color, width: isOpen ? 3 : 2 }}
                />
                <div className="pl-2">
                  <p className="text-sm font-bold text-brand-text">{persona.name}</p>
                  <p className="text-xs text-brand-muted italic mt-0.5 leading-snug">&ldquo;{persona.question}&rdquo;</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {persona.centers.map(function (c) {
                      return (
                        <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-brand-bg text-brand-muted">{c}</span>
                      )
                    })}
                  </div>
                </div>
              </button>

              {/* Expandable detail — smooth max-height transition */}
              <div
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{
                  maxHeight: isOpen ? '400px' : '0',
                  opacity: isOpen ? 1 : 0,
                }}
              >
                <div
                  className="mt-1 rounded-xl border p-4 space-y-3"
                  style={{ borderColor: persona.color + '30', backgroundColor: persona.color + '06' }}
                >
                  {/* First Move */}
                  <div>
                    <p className="text-xs font-bold mb-1" style={{ color: persona.color }}>Your First Move</p>
                    <p className="text-sm text-brand-text leading-relaxed">{persona.firstMove}</p>
                  </div>

                  {/* CTA Button */}
                  {firstTheme && (
                    <Link
                      href={'/pathways/' + firstTheme.slug}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:shadow-md hover:-translate-y-0.5"
                      style={{ backgroundColor: persona.color }}
                    >
                      Start your journey &rarr;
                    </Link>
                  )}

                  {/* Matched Pathways — compact cards instead of pills */}
                  <div>
                    <p className="text-xs font-bold text-brand-muted mb-2">Explore these pathways:</p>
                    <div className="space-y-1.5">
                      {persona.matchedPathways.map(function (themeId) {
                        const theme = THEMES[themeId as keyof typeof THEMES]
                        if (!theme) return null
                        return (
                          <Link
                            key={themeId}
                            href={'/pathways/' + theme.slug}
                            className="flex items-center gap-2.5 px-3 py-2 bg-white rounded-lg border-2 border-brand-border text-xs font-medium text-brand-text transition-all hover:shadow-sm hover:-translate-y-0.5"
                          >
                            <div className="w-1 h-6 rounded-full flex-shrink-0" style={{ backgroundColor: theme.color }} />
                            {theme.name}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
