'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ARCHETYPES } from './FlowerIcons'
import { trackWayfinderEvent } from '@/lib/wayfinder-analytics'

interface ArchetypeSelectorProps {
  /** Compact mode for nav drawers (single column, smaller) */
  compact?: boolean
  /** Called after selection with the archetype id */
  onSelect?: (id: string) => void
}

function getCookie(name: string): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
  return match ? match[1] : ''
}

/**
 * Archetype selector — lets users pick their navigational lens.
 * Persists to cookie and triggers page reload so server components pick it up.
 */
export function ArchetypeSelector({ compact, onSelect }: ArchetypeSelectorProps) {
  const [selected, setSelected] = useState('')
  const router = useRouter()

  useEffect(function () {
    setSelected(getCookie('archetype'))
  }, [])

  // Map archetypes to their primary pathway pages
  const ARCHETYPE_ROUTES: Record<string, string> = {
    seeker: '/services',
    learner: '/library',
    builder: '/opportunities',
    watchdog: '/governance',
    partner: '/organizations',
    explorer: '/pathways',
  }

  function handleSelect(id: string) {
    const newValue = selected === id ? '' : id // toggle off if already selected
    document.cookie = 'archetype=' + newValue + ';path=/;max-age=31536000'
    setSelected(newValue)
    trackWayfinderEvent('archetype_select', { archetype: newValue || 'none' })
    if (onSelect) onSelect(newValue)
    // Navigate to the archetype's primary page when selecting (not deselecting)
    if (newValue && ARCHETYPE_ROUTES[newValue]) {
      router.push(ARCHETYPE_ROUTES[newValue])
    } else {
      // Refresh server components so archetype-driven ordering updates instantly
      router.refresh()
    }
  }

  if (compact) {
    return (
      <div className="space-y-0.5">
        {ARCHETYPES.map(function (a) {
          const isActive = selected === a.id
          return (
            <button
              key={a.id}
              onClick={function () { handleSelect(a.id) }}
              className="flex items-center gap-2.5 w-full text-left pl-5 py-1.5 text-[13px] font-medium transition-colors hover:text-brand-accent"
              style={{ color: isActive ? '#C75B2A' : '#0d1117' }}
            >
              <a.Icon size={16} color={isActive ? '#C75B2A' : '#9B9590'} />
              <span>{a.name}</span>
              {isActive && <span className="text-xs text-brand-accent ml-auto">Active</span>}
            </button>
          )
        })}
        {selected && (
          <button
            onClick={function () { handleSelect(selected) }}
            className="block pl-5 py-1 text-[11px] text-brand-muted hover:text-brand-accent transition-colors"
          >
            Clear selection
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {ARCHETYPES.map(function (a) {
        const isActive = selected === a.id
        return (
          <button
            key={a.id}
            onClick={function () { handleSelect(a.id) }}
            className="group text-left p-4 border-2 transition-all hover:-translate-y-0.5"
            style={{
              borderColor: isActive ? '#C75B2A' : '#E2DDD5',
              backgroundColor: isActive ? '#C75B2A08' : '#FFFFFF',
              
            }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <a.Icon size={20} color={isActive ? '#C75B2A' : '#9B9590'} />
              <span className="font-display font-bold text-sm text-brand-text">{a.name}</span>
            </div>
            <p className="text-[11px] text-brand-muted leading-relaxed">{a.desc}</p>
            {isActive && (
              <span className="inline-block mt-2 text-xs font-mono font-bold uppercase tracking-wider text-brand-accent">Active</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
