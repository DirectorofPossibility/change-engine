'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/i18n'

interface TabDef {
  key: string
  labelKey: string
  count: number
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
                <h2 className="text-xl font-bold text-brand-text mb-4">{t(tab.labelKey)} ({tab.count})</h2>
              )}
              {children[tab.key]}
            </section>
          )
        })}
      </div>
    </div>
  )
}
