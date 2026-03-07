'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/use-translation'
import { CENTER_COLORS } from '@/lib/constants'

interface TabDef {
  key: string
  labelKey: string
  count: number
  center?: string
}

export function SearchTabs({ tabs, children }: { tabs: TabDef[]; children: Record<string, React.ReactNode> }) {
  const { t } = useTranslation()
  const [active, setActive] = useState('all')
  const total = tabs.reduce(function (sum, tab) { return sum + tab.count }, 0)

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={function () { setActive('all') }}
          className={'px-3 py-1.5 text-sm rounded-lg transition-colors ' + (active === 'all' ? 'bg-brand-accent text-white' : 'bg-white border border-brand-border text-brand-text hover:bg-brand-bg')}
        >
          All ({total})
        </button>
        {tabs.map(function (tab) {
          if (tab.count === 0) return null
          return (
            <button
              key={tab.key}
              onClick={function () { setActive(tab.key) }}
              className={'px-3 py-1.5 text-sm rounded-lg transition-colors ' + (active === tab.key ? 'bg-brand-accent text-white' : 'bg-white border border-brand-border text-brand-text hover:bg-brand-bg')}
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 flex-shrink-0" style={{ backgroundColor: CENTER_COLORS[tab.center || ''] || '#6B6560' }} />
              {t(tab.labelKey)} ({tab.count})
            </button>
          )
        })}
      </div>
      <div className="space-y-10">
        {tabs.map(function (tab) {
          if (tab.count === 0) return null
          if (active !== 'all' && active !== tab.key) return null
          return (
            <section key={tab.key}>
              {active === 'all' && (
                <h2 className="text-xl font-bold text-brand-text mb-4 flex items-center gap-2">
                  {tab.center && (
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ color: CENTER_COLORS[tab.center] || '#6B6560', backgroundColor: (CENTER_COLORS[tab.center] || '#6B6560') + '15' }}>
                      {tab.center}
                    </span>
                  )}
                  {t(tab.labelKey)} ({tab.count})
                </h2>
              )}
              {children[tab.key]}
            </section>
          )
        })}
      </div>
    </div>
  )
}
