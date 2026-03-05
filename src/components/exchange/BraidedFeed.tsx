'use client'

import { useState, useMemo } from 'react'
import { FeedCard } from './FeedCard'
import type { FeedItem } from './FeedCard'
import { BookOpen, Zap, Package, Scale, LayoutGrid, List } from 'lucide-react'
import { useTranslation } from '@/lib/use-translation'

export type { FeedItem } from './FeedCard'

const CENTER_FILTERS = [
  { key: null, label: 'feed.all', icon: null },
  { key: 'Learning', label: 'feed.learning', icon: BookOpen },
  { key: 'Action', label: 'feed.action', icon: Zap },
  { key: 'Resource', label: 'feed.resource', icon: Package },
  { key: 'Accountability', label: 'feed.accountability', icon: Scale },
] as const

interface BraidedFeedProps {
  resources: FeedItem[]
  officials: FeedItem[]
  policies: FeedItem[]
  activeCenter?: string | null
  pathwayColor?: string
  onSelectCenter?: (center: string | null) => void
  onItemClick?: (item: FeedItem) => void
}

function countForCenter(
  resources: FeedItem[],
  officials: FeedItem[],
  policies: FeedItem[],
  center: string | null,
): number {
  if (center === null) return resources.length + officials.length + policies.length
  if (center === 'Accountability') return officials.length + policies.length
  return resources.filter((r) => r.center === center).length
}

function braidItems(
  officials: FeedItem[],
  resources: FeedItem[],
  policies: FeedItem[],
): FeedItem[] {
  const result: FeedItem[] = []
  result.push(...officials)
  let rIdx = 0
  let pIdx = 0
  while (rIdx < resources.length || pIdx < policies.length) {
    const batch = Math.min(2, resources.length - rIdx)
    for (let i = 0; i < batch; i++) result.push(resources[rIdx++])
    if (pIdx < policies.length) result.push(policies[pIdx++])
  }
  return result
}

export function BraidedFeed({
  resources,
  officials,
  policies,
  activeCenter: externalCenter,
  pathwayColor,
  onSelectCenter,
  onItemClick,
}: BraidedFeedProps) {
  const { t } = useTranslation()
  const [internalCenter, setInternalCenter] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const activeCenter = externalCenter !== undefined ? externalCenter : internalCenter

  const coloredResources = useMemo(
    () => resources.map((r) => ({ ...r, pathwayColor: r.pathwayColor || pathwayColor })),
    [resources, pathwayColor],
  )

  const filteredResources = useMemo(() => {
    if (activeCenter === null || activeCenter === undefined) return coloredResources
    if (activeCenter === 'Accountability') return []
    return coloredResources.filter((r) => r.center === activeCenter)
  }, [coloredResources, activeCenter])

  const filteredOfficials = useMemo(() => {
    if (activeCenter === null || activeCenter === undefined) return officials
    if (activeCenter === 'Accountability') return officials
    return []
  }, [officials, activeCenter])

  const filteredPolicies = useMemo(() => {
    if (activeCenter === null || activeCenter === undefined) return policies
    if (activeCenter === 'Accountability') return policies
    return []
  }, [policies, activeCenter])

  const feed = useMemo(
    () => braidItems(filteredOfficials, filteredResources, filteredPolicies),
    [filteredOfficials, filteredResources, filteredPolicies],
  )

  return (
    <div className="w-full">
      {/* Filter bar + view toggle */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex flex-wrap gap-1 border-b border-brand-border">
          {CENTER_FILTERS.map(({ key, label, icon: Icon }) => {
            const count = countForCenter(coloredResources, officials, policies, key)
            const isActive = activeCenter === key
            return (
              <button
                key={label}
                type="button"
                onClick={() => onSelectCenter ? onSelectCenter(key) : setInternalCenter(key)}
                className={`
                  inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold
                  transition-all duration-150 border-b-2 -mb-px
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent
                  ${isActive
                    ? 'border-brand-accent text-brand-text'
                    : 'border-transparent text-brand-muted hover:text-brand-text hover:border-brand-muted/30'
                  }
                `}
              >
                {Icon && <Icon size={13} />}
                {t(label)}
                <span className="text-brand-muted ml-0.5">({count})</span>
              </button>
            )
          })}
        </div>
        {/* View toggle */}
        <div className="hidden sm:flex items-center gap-1 ml-3">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-brand-accent text-white' : 'text-brand-muted hover:text-brand-text'}`}
            aria-label="Grid view"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-brand-accent text-white' : 'text-brand-muted hover:text-brand-text'}`}
            aria-label="List view"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Feed */}
      {feed.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-bg flex items-center justify-center">
            <Package size={24} className="text-brand-muted" />
          </div>
          <p className="text-brand-muted font-medium">{t('feed.no_items')}</p>
          <p className="text-sm text-brand-muted/60 mt-1">{t('feed.try_different')}</p>
        </div>
      ) : (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'
            : 'flex flex-col gap-3'
        }>
          {feed.map((item) => (
            <FeedCard
              key={`${item.type}-${item.id}`}
              item={item}
              onClick={() => onItemClick?.(item)}
              variant={viewMode}
            />
          ))}
        </div>
      )}
    </div>
  )
}
