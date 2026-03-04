'use client'

import { useState } from 'react'
import Link from 'next/link'
import { THEMES } from '@/lib/constants'
import { PERSONAS } from '@/lib/data/personas'
import type { Persona } from '@/lib/data/personas'

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
          return (
            <div key={persona.id}>
              <button
                onClick={function () { toggle(persona.id) }}
                className="w-full text-left bg-white rounded-xl border border-brand-border p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 relative overflow-hidden"
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

              {isOpen && (
                <div
                  className="mt-1 rounded-xl border p-4 space-y-3"
                  style={{ borderColor: persona.color + '30', backgroundColor: persona.color + '06' }}
                >
                  {/* First Move */}
                  <div>
                    <p className="text-xs font-bold mb-1" style={{ color: persona.color }}>Your First Move</p>
                    <p className="text-sm text-brand-text leading-relaxed">{persona.firstMove}</p>
                  </div>

                  {/* Matched Pathways */}
                  <div>
                    <p className="text-xs font-bold text-brand-muted mb-2">Explore these pathways:</p>
                    <div className="flex flex-wrap gap-2">
                      {persona.matchedPathways.map(function (themeId) {
                        const theme = THEMES[themeId as keyof typeof THEMES]
                        if (!theme) return null
                        return (
                          <Link
                            key={themeId}
                            href={'/pathways/' + theme.slug}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors hover:shadow-sm"
                            style={{
                              backgroundColor: theme.color + '14',
                              color: theme.color,
                              border: `1.5px solid ${theme.color}30`,
                            }}
                          >
                            {theme.name}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
