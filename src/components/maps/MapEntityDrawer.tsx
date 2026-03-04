'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { X, Phone, MapPin, ExternalLink, Loader2 } from 'lucide-react'
import { THEMES } from '@/lib/constants'

interface DrawerEntity {
  id: string
  title: string
  type: string
  address?: string | null
  phone?: string | null
  link?: string | null
  primaryPathway?: string | null
  pathways?: string[]
}

interface FocusArea {
  id: string
  name: string
}

interface PathwayDetail {
  themeId: string
  isPrimary: boolean
}

interface MapEntityDrawerProps {
  entity: DrawerEntity
  onClose: () => void
  onPathwayClick?: (themeId: string) => void
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  organization: { label: 'Organization', color: '#38a169' },
  service: { label: 'Service', color: '#3182ce' },
  voting: { label: 'Voting Location', color: '#e53e3e' },
  official: { label: 'Official', color: '#805ad5' },
  park: { label: 'Park', color: '#38a169' },
  police: { label: 'Police', color: '#3182ce' },
  fire: { label: 'Fire Station', color: '#e53e3e' },
  school: { label: 'School', color: '#dd6b20' },
  medical: { label: 'Medical', color: '#805ad5' },
  library: { label: 'Library', color: '#d69e2e' },
}

export function MapEntityDrawer({ entity, onClose, onPathwayClick }: MapEntityDrawerProps) {
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>([])
  const [detailPathways, setDetailPathways] = useState<PathwayDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [visible, setVisible] = useState(false)

  // Animate in on mount
  useEffect(function () {
    requestAnimationFrame(function () { setVisible(true) })
  }, [])

  // Fetch detail data
  useEffect(function () {
    const entityType = entity.type === 'voting' ? null : entity.type
    if (!entityType) {
      setLoading(false)
      return
    }

    setLoading(true)
    fetch('/api/map-markers/detail?type=' + encodeURIComponent(entityType) + '&id=' + encodeURIComponent(entity.id))
      .then(function (res) { return res.ok ? res.json() : null })
      .then(function (data) {
        if (data) {
          setDetailPathways(data.pathways || [])
          setFocusAreas(data.focusAreas || [])
        }
      })
      .finally(function () { setLoading(false) })
  }, [entity.id, entity.type])

  const handleClose = useCallback(function () {
    setVisible(false)
    setTimeout(onClose, 300)
  }, [onClose])

  const typeInfo = TYPE_LABELS[entity.type] || { label: entity.type, color: '#8B7E74' }

  // Merge pathways: use detail response if available, else fall back to marker data
  const displayPathways = detailPathways.length > 0
    ? detailPathways.map(function (p) { return p.themeId })
    : (entity.pathways || [])

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[1000] transition-transform duration-300 ease-out"
      style={{ transform: visible ? 'translateY(0)' : 'translateY(100%)' }}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
        onClick={handleClose}
      />

      {/* Drawer panel */}
      <div className="relative bg-white rounded-t-2xl shadow-2xl max-h-[40vh] overflow-y-auto">
        {/* Drag handle */}
        <div className="sticky top-0 bg-white rounded-t-2xl pt-3 pb-2 px-6 flex justify-center z-10">
          <button
            onClick={handleClose}
            className="w-10 h-1 bg-brand-border rounded-full hover:bg-brand-muted transition-colors"
            aria-label="Close drawer"
          />
        </div>

        <div className="px-6 pb-6 space-y-4">
          {/* Header: name + type badge + close */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-serif text-lg font-bold text-brand-text truncate">
                {entity.title}
              </h3>
              <span
                className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold text-white"
                style={{ backgroundColor: typeInfo.color }}
              >
                {typeInfo.label}
              </span>
            </div>
            <button
              onClick={handleClose}
              className="flex-shrink-0 p-1.5 rounded-lg hover:bg-brand-border/50 transition-colors"
              aria-label="Close"
            >
              <X size={18} className="text-brand-muted" />
            </button>
          </div>

          {/* Contact row */}
          {(entity.address || entity.phone || entity.link) && (
            <div className="flex flex-wrap gap-3 text-xs text-brand-muted">
              {entity.address && (
                <span className="flex items-center gap-1">
                  <MapPin size={12} />
                  {entity.address}
                </span>
              )}
              {entity.phone && (
                <a href={'tel:' + entity.phone} className="flex items-center gap-1 text-brand-accent hover:underline">
                  <Phone size={12} />
                  {entity.phone}
                </a>
              )}
              {entity.link && entity.link.startsWith('http') && (
                <a href={entity.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-brand-accent hover:underline">
                  <ExternalLink size={12} />
                  Website
                </a>
              )}
            </div>
          )}

          {/* Pathway chips */}
          {displayPathways.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-2">Pathways</p>
              <div className="flex flex-wrap gap-2">
                {displayPathways.map(function (themeId) {
                  const theme = (THEMES as Record<string, { name: string; color: string }>)[themeId]
                  if (!theme) return null
                  return (
                    <button
                      key={themeId}
                      onClick={function () { if (onPathwayClick) onPathwayClick(themeId) }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all hover:shadow-sm hover:opacity-80"
                      style={{ backgroundColor: theme.color + '18', color: theme.color, border: '1px solid ' + theme.color + '30' }}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.color }} />
                      {theme.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Focus area pills */}
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-brand-muted">
              <Loader2 size={12} className="animate-spin" />
              Loading details...
            </div>
          ) : focusAreas.length > 0 ? (
            <div>
              <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-2">Focus Areas</p>
              <div className="flex flex-wrap gap-1.5">
                {focusAreas.map(function (fa) {
                  return (
                    <Link
                      key={fa.id}
                      href={'/explore/focus/' + fa.id}
                      className="px-2 py-0.5 rounded bg-brand-border/50 text-xs text-brand-text hover:bg-brand-border transition-colors"
                    >
                      {fa.name}
                    </Link>
                  )
                })}
              </div>
            </div>
          ) : null}

          {/* View full profile link */}
          {entity.link && (
            <div className="pt-1">
              <Link
                href={entity.link}
                className="inline-flex items-center gap-1 text-sm font-semibold text-brand-accent hover:underline"
              >
                View full profile &rarr;
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
