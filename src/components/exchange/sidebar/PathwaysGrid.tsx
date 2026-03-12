'use client'

import { Heart, Users, MapPin, Megaphone, Wallet, Leaf, Globe } from 'lucide-react'
import { THEMES } from '@/lib/constants'
import { useTranslation } from '@/lib/use-translation'

const PATHWAY_ICONS: Record<string, typeof Heart> = {
  THEME_01: Heart,
  THEME_02: Users,
  THEME_03: MapPin,
  THEME_04: Megaphone,
  THEME_05: Wallet,
  THEME_06: Leaf,
  THEME_07: Globe,
}

interface PathwaysGridProps {
  selectedPathway: string | null
  pathwayCounts: Record<string, number>
  onSelectPathway: (id: string | null) => void
  onClose: () => void
}

export function PathwaysGrid({ selectedPathway, pathwayCounts, onSelectPathway, onClose }: PathwaysGridProps) {
  const { t } = useTranslation()
  const themeEntries = Object.entries(THEMES) as [string, (typeof THEMES)[keyof typeof THEMES]][]

  return (
    <div className="px-5">
      <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-brand-muted mb-2 font-display">
        {t('sidebar.explore_houston')}
      </p>
      <div className="space-y-0.5">
        {themeEntries.map(function ([id, theme]) {
          const isActive = selectedPathway === id
          const count = pathwayCounts[id] ?? 0
          const Icon = PATHWAY_ICONS[id] || Globe
          return (
            <button
              key={id}
              onClick={function () { onSelectPathway(isActive ? null : id); onClose() }}
              className={'flex items-center gap-3 w-full px-3 py-2.5 text-sm transition-all duration-200 ' +
                (isActive
                  ? 'bg-white shadow-sm font-bold text-brand-text ring-1 ring-brand-border'
                  : 'text-brand-muted font-medium hover:text-brand-text hover:bg-white/60')}
            >
              <div
                className="w-8 h-8 flex items-center justify-center flex-shrink-0 transition-transform duration-200"
                style={{
                  backgroundColor: isActive ? theme.color + '20' : theme.color + '0C',
                  transform: isActive ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                <Icon size={16} style={{ color: theme.color }} />
              </div>
              <span className="flex-1 text-left truncate">{theme.name}</span>
              {count > 0 && (
                <span className="text-xs font-semibold tabular-nums text-brand-muted">
                  ({count})
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
