'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  FileText, BookOpen, PenTool, CalendarDays, Zap, Compass,
  BarChart3, Workflow, Wrench, BookMarked, Plus, GripVertical,
  ToggleLeft, ToggleRight, Pencil, Trash2, Save, X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  FileText, BookOpen, PenTool, CalendarDays, Zap, Compass,
  BarChart3, Workflow, Wrench, BookMarked,
}

interface ToolGuideItem {
  id: string
  title: string
  description: string
  url: string
  icon: string
  category: 'tool' | 'guide'
  levels: string[]
  sort_order: number
  active: boolean
}

interface ToolsGuidesClientProps {
  items: ToolGuideItem[]
  role: string
}

export function ToolsGuidesClient({ items, role }: ToolsGuidesClientProps) {
  const isAdmin = role === 'admin'
  const [activeCategory, setActiveCategory] = useState<'all' | 'tool' | 'guide'>('all')

  // Filter items by role for non-admins
  const visibleItems = isAdmin
    ? items
    : items.filter(item =>
        item.active && item.levels.includes(role === 'partner' ? 'partner' : 'neighbor')
      )

  const filtered = activeCategory === 'all'
    ? visibleItems
    : visibleItems.filter(item => item.category === activeCategory)

  const tools = visibleItems.filter(i => i.category === 'tool')
  const guides = visibleItems.filter(i => i.category === 'guide')

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isAdmin ? 'Manage Tools & Guides' : 'Tools & Guides'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isAdmin
            ? 'Configure which tools and guides are available to neighbors and partners.'
            : role === 'partner'
              ? 'Tools and resources to help your organization contribute to the community.'
              : 'Tools and resources to help you explore and contribute to the community.'
          }
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-1 bg-brand-bg rounded-lg p-1">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeCategory === 'all' ? 'bg-white text-brand-text shadow-sm' : 'text-brand-muted hover:text-brand-text'
            }`}
          >
            All ({visibleItems.length})
          </button>
          <button
            onClick={() => setActiveCategory('tool')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeCategory === 'tool' ? 'bg-white text-brand-text shadow-sm' : 'text-brand-muted hover:text-brand-text'
            }`}
          >
            <Wrench size={12} />
            Tools ({tools.length})
          </button>
          <button
            onClick={() => setActiveCategory('guide')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeCategory === 'guide' ? 'bg-white text-brand-text shadow-sm' : 'text-brand-muted hover:text-brand-text'
            }`}
          >
            <BookMarked size={12} />
            Guides ({guides.length})
          </button>
        </div>
      </div>

      {/* Admin View: Table */}
      {isAdmin ? (
        <AdminTable items={filtered} />
      ) : (
        /* User View: Card Grid */
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const Icon = ICON_MAP[item.icon] || FileText
            return (
              <Link
                key={item.id}
                href={item.url}
                className="group rounded-xl border border-gray-200 bg-white p-5 hover:border-brand-accent/30 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                    item.category === 'tool'
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-amber-50 text-amber-600'
                  }`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm group-hover:text-brand-accent transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide ${
                        item.category === 'tool'
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-amber-50 text-amber-600'
                      }`}>
                        {item.category}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <BookMarked size={40} className="mx-auto mb-3 opacity-30" />
          <p>No {activeCategory === 'all' ? 'items' : activeCategory + 's'} available.</p>
        </div>
      )}
    </div>
  )
}

/* ── Admin Table ── */
function AdminTable({ items }: { items: ToolGuideItem[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Title</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Type</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Levels</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">URL</th>
            <th className="text-center px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Active</th>
            <th className="text-center px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Order</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const Icon = ICON_MAP[item.icon] || FileText
            return (
              <tr key={item.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Icon size={14} className="text-gray-400" />
                    <span className="font-medium text-gray-900">{item.title}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    item.category === 'tool'
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-amber-50 text-amber-600'
                  }`}>
                    {item.category}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {item.levels.includes('neighbor') && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-50 text-teal-700">
                        Neighbor
                      </span>
                    )}
                    {item.levels.includes('partner') && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-50 text-orange-700">
                        Partner
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs font-mono">{item.url}</td>
                <td className="px-4 py-3 text-center">
                  {item.active ? (
                    <ToggleRight size={20} className="mx-auto text-green-500" />
                  ) : (
                    <ToggleLeft size={20} className="mx-auto text-gray-300" />
                  )}
                </td>
                <td className="px-4 py-3 text-center text-gray-400">{item.sort_order}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-400">
          To manage these items, create the <code className="bg-gray-200 px-1 rounded">tool_guide_items</code> table in Supabase.
          Until then, defaults are shown above. Admins can toggle items on/off and assign them to neighbor or partner levels.
        </p>
      </div>
    </div>
  )
}
