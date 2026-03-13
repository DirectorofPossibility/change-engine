'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/use-translation'

const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

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
          className="px-3 py-1.5 text-sm transition-colors"
          style={{
            fontFamily: MONO,
            fontSize: '0.7rem',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.05em',
            background: active === 'all' ? INK : 'transparent',
            color: active === 'all' ? '#fff' : MUTED,
            border: active === 'all' ? 'none' : '1px solid ' + RULE_COLOR,
          }}
        >
          All ({total})
        </button>
        {tabs.map(function (tab) {
          if (tab.count === 0) return null
          return (
            <button
              key={tab.key}
              onClick={function () { setActive(tab.key) }}
              className="px-3 py-1.5 text-sm transition-colors"
              style={{
                fontFamily: MONO,
                fontSize: '0.7rem',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.05em',
                background: active === tab.key ? INK : 'transparent',
                color: active === tab.key ? '#fff' : MUTED,
                border: active === tab.key ? 'none' : '1px solid ' + RULE_COLOR,
              }}
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
                <div className="flex items-baseline justify-between mb-1">
                  <h2 style={{ fontFamily: SERIF, fontSize: '1.3rem', color: INK }}>
                    {t(tab.labelKey)} ({tab.count})
                  </h2>
                </div>
              )}
              {active === 'all' && (
                <div style={{ height: 1, borderBottom: '1px dotted ' + RULE_COLOR, marginBottom: '1rem' }} />
              )}
              {children[tab.key]}
            </section>
          )
        })}
      </div>
    </div>
  )
}
