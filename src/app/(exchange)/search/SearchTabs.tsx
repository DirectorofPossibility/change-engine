'use client'

import { useState } from 'react'

interface TabDef {
  key: string
  label: string
  count: number
}

export function SearchTabs({ tabs, children }: { tabs: TabDef[]; children: Record<string, React.ReactNode> }) {
  var [active, setActive] = useState('all')
  var total = tabs.reduce(function (sum, t) { return sum + t.count }, 0)

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
              {tab.label} ({tab.count})
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
                <h2 className="text-xl font-bold text-brand-text mb-4">{tab.label} ({tab.count})</h2>
              )}
              {children[tab.key]}
            </section>
          )
        })}
      </div>
    </div>
  )
}
