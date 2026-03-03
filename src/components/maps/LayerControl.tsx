'use client'

import { useState } from 'react'

export interface LayerOption {
  id: string
  label: string
  color: string
  visible: boolean
}

interface LayerControlProps {
  layers: LayerOption[]
  onToggle: (layerId: string) => void
}

export function LayerControl({ layers, onToggle }: LayerControlProps) {
  const [collapsed, setCollapsed] = useState(false)

  if (layers.length === 0) return null

  return (
    <div className="absolute top-3 right-3 z-10">
      <div className="bg-white rounded-lg shadow-lg border border-brand-border overflow-hidden">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-brand-text hover:bg-gray-50"
        >
          <span>Map Layers</span>
          <svg
            className={`w-3.5 h-3.5 ml-2 transition-transform ${collapsed ? '' : 'rotate-180'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {!collapsed && (
          <div className="border-t border-brand-border px-3 py-2 space-y-1.5 max-h-64 overflow-y-auto">
            {layers.map(layer => (
              <label
                key={layer.id}
                className="flex items-center gap-2 cursor-pointer text-xs text-brand-text hover:text-brand-accent"
              >
                <input
                  type="checkbox"
                  checked={layer.visible}
                  onChange={() => onToggle(layer.id)}
                  className="rounded border-gray-300 text-brand-accent focus:ring-brand-accent"
                />
                <span
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: layer.color }}
                />
                <span>{layer.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
