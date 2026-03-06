'use client'

import { useState } from 'react'
import { useNeighborhood } from '@/lib/contexts/NeighborhoodContext'
import { useTranslation } from '@/lib/use-translation'
import { MapPin, X, Check, User } from 'lucide-react'

/**
 * Compact neighborhood indicator for the LeftNav sidebar.
 * Shows the user's resolved neighborhood + ZIP when available,
 * or a ZIP input prompt when not set.
 */
export function NeighborhoodWidget() {
  const { zip, neighborhood, councilDistrict, districtOfficials, lookupZip, clearZip, isLoading } = useNeighborhood()
  const [editing, setEditing] = useState(false)
  const [input, setInput] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (input.length === 5) {
      lookupZip(input)
      setEditing(false)
      setInput('')
    }
  }

  // ZIP is set — show resolved neighborhood
  if (zip && !editing) {
    return (
      <div className="px-3 py-3">
        <div className="bg-white/5 rounded-lg px-3 py-2.5 border border-white/10">
          <div className="flex items-center gap-2 mb-0.5">
            <MapPin size={12} className="text-brand-accent flex-shrink-0" />
            <span className="text-[11px] font-bold text-white/80 truncate">
              {isLoading ? 'Finding your area...' : (neighborhood?.neighborhood_name || 'Houston Area')}
            </span>
          </div>
          {councilDistrict && (
            <div className="text-[9px] text-white/30 ml-[20px] mb-1">District {councilDistrict}</div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/40 ml-[20px]">ZIP {zip}</span>
            <div className="flex gap-2">
              <button
                onClick={function () { setEditing(true); setInput(zip) }}
                className="text-[10px] text-white/30 hover:text-white/60 transition-colors"
              >
                Change
              </button>
              <button
                onClick={clearZip}
                className="text-[10px] text-white/30 hover:text-red-400 transition-colors"
              >
                <X size={10} />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // No ZIP or editing — show input
  return (
    <div className="px-3 py-3">
      <form onSubmit={handleSubmit} className="bg-white/5 rounded-lg px-3 py-2.5 border border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <MapPin size={12} className="text-white/40" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/30">Your Location</span>
        </div>
        <div className="flex gap-1.5">
          <input
            type="text"
            value={input}
            onChange={function (e) { setInput(e.target.value.replace(/\D/g, '').slice(0, 5)) }}
            placeholder="ZIP code"
            maxLength={5}
            className="flex-1 bg-white/10 border border-white/10 rounded px-2 py-1.5 text-[11px] text-white placeholder:text-white/30 focus:outline-none focus:border-brand-accent/50 w-0"
          />
          <button
            type="submit"
            disabled={input.length !== 5}
            className="px-2 py-1.5 bg-brand-accent/80 rounded text-[10px] font-bold text-white disabled:opacity-30 hover:bg-brand-accent transition-colors"
          >
            <Check size={12} />
          </button>
          {editing && (
            <button
              type="button"
              onClick={function () { setEditing(false); setInput('') }}
              className="px-1.5 py-1.5 text-white/30 hover:text-white/60"
            >
              <X size={12} />
            </button>
          )}
        </div>
        <p className="text-[9px] text-white/25 mt-1.5 leading-tight">
          Personalizes officials, services, and polling places
        </p>
      </form>
    </div>
  )
}

/**
 * Full-width neighborhood banner for page headers.
 * Shows the user's detected neighborhood, council district, and officials.
 */
export function NeighborhoodBanner() {
  const { zip, neighborhood, councilDistrict, districtOfficials, isLoading } = useNeighborhood()
  const { t } = useTranslation()

  if (!zip || isLoading) return null
  if (!neighborhood) return null

  return (
    <section className="bg-brand-accent/5 border-b border-brand-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-brand-accent" />
            <span className="font-semibold text-brand-text">{neighborhood.neighborhood_name}</span>
            <span className="text-sm text-brand-muted">({zip})</span>
          </div>
          {councilDistrict && (
            <span className="text-sm text-brand-muted">
              {t('neighborhood.council_district')} {councilDistrict}
            </span>
          )}
          {districtOfficials.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {districtOfficials.map(function (o) {
                return (
                  <span key={o.official_id} className="flex items-center gap-1 text-sm text-brand-text">
                    <User size={12} className="text-brand-muted" />
                    {o.official_name}
                    {o.title ? ' (' + o.title + ')' : ''}
                  </span>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
