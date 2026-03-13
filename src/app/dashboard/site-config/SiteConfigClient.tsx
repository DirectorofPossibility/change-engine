'use client'

import { useState, useTransition } from 'react'
import { ToggleLeft, ToggleRight, Loader2 } from 'lucide-react'
import type { SiteConfigItem } from '@/lib/data/site-config'

const CATEGORY_LABELS: Record<string, string> = {
  navigation: 'Navigation & Layout',
  homepage: 'Homepage Sections',
  features: 'Features',
  pages: 'Pages',
}

const CATEGORY_ORDER = ['navigation', 'homepage', 'features', 'pages']

export function SiteConfigClient({ items }: { items: SiteConfigItem[] }) {
  const [config, setConfig] = useState(items)
  const [pending, setPending] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<{ key: string; enabled: boolean } | null>(null)

  async function toggle(key: string, currentEnabled: boolean) {
    setPending(key)
    const newEnabled = !currentEnabled

    try {
      const res = await fetch('/api/site-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, enabled: newEnabled }),
      })

      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Failed to update')
        return
      }

      startTransition(function () {
        setConfig(function (prev) {
          return prev.map(function (item) {
            return item.key === key ? { ...item, enabled: newEnabled, updated_at: new Date().toISOString() } : item
          })
        })
      })

      setToast({ key, enabled: newEnabled })
      setTimeout(function () { setToast(null) }, 2000)
    } finally {
      setPending(null)
    }
  }

  const grouped: Record<string, SiteConfigItem[]> = {}
  for (const item of config) {
    if (!grouped[item.category]) grouped[item.category] = []
    grouped[item.category].push(item)
  }

  return (
    <div className="space-y-8">
      {/* Status summary */}
      <div className="flex gap-4 text-sm">
        <span className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded">
          {config.filter(function (c) { return c.enabled }).length} enabled
        </span>
        <span className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded">
          {config.filter(function (c) { return !c.enabled }).length} disabled
        </span>
      </div>

      {CATEGORY_ORDER.map(function (cat) {
        const items = grouped[cat]
        if (!items || items.length === 0) return null

        return (
          <section key={cat}>
            <h2 className="text-lg font-semibold mb-3">{CATEGORY_LABELS[cat] || cat}</h2>
            <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
              {items.map(function (item) {
                const isLoading = pending === item.key
                return (
                  <div key={item.key} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{item.label}</span>
                        <code className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{item.key}</code>
                      </div>
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                      )}
                    </div>
                    <button
                      onClick={function () { toggle(item.key, item.enabled) }}
                      disabled={isLoading}
                      aria-label={item.enabled ? 'Disable ' + item.label : 'Enable ' + item.label}
                      className="flex-shrink-0 transition-colors"
                    >
                      {isLoading ? (
                        <Loader2 size={28} className="animate-spin text-gray-400" />
                      ) : item.enabled ? (
                        <ToggleRight size={28} className="text-green-600" />
                      ) : (
                        <ToggleLeft size={28} className="text-gray-300" />
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white text-sm px-4 py-2 rounded shadow-lg z-50">
          <strong>{config.find(function (c) { return c.key === toast.key })?.label}</strong> {toast.enabled ? 'enabled' : 'disabled'}
        </div>
      )}
    </div>
  )
}
