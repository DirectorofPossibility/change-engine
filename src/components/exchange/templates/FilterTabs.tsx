/**
 * @fileoverview Filter tabs — "Most Recent" / "Most Popular" toggle.
 *
 * Inspired by Greater Good Magazine's topic page filter pattern.
 * Client component that toggles between sort modes without page reload.
 */

'use client'

import { useState, type ReactNode } from 'react'

interface Tab {
  key: string
  label: string
  content: ReactNode
}

interface FilterTabsProps {
  tabs: Tab[]
  defaultTab?: string
  accentColor?: string
}

export function FilterTabs({ tabs, defaultTab, accentColor = '#1b5e8a' }: FilterTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.key || '')

  return (
    <div>
      {/* Tab buttons */}
      <div className="flex items-center gap-0 border-b border-rule mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="relative px-4 py-3 text-sm font-semibold transition-colors"
            style={{
              color: activeTab === tab.key ? accentColor : '#5c6474',
            }}
          >
            {tab.label}
            {/* Active underline */}
            {activeTab === tab.key && (
              <span
                className="absolute bottom-0 left-0 right-0 h-[2px]"
                style={{ background: accentColor }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tabs.map((tab) => (
        <div key={tab.key} className={activeTab === tab.key ? '' : 'hidden'}>
          {tab.content}
        </div>
      ))}
    </div>
  )
}
