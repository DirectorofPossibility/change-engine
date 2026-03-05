'use client'

import { useState } from 'react'
import { Languages, Target, FolderTree, Linkedin } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const TABS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'translations', label: 'Translations', icon: Languages },
  { id: 'fidelity', label: 'Fidelity', icon: Target },
  { id: 'taxonomy', label: 'Taxonomy', icon: FolderTree },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
]

interface UtilitiesClientProps {
  activeTab: string
  children: React.ReactNode
}

export function UtilitiesClient({ activeTab, children }: UtilitiesClientProps) {
  return (
    <div>
      {/* Tab Bar */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <a
              key={tab.id}
              href={`/dashboard/utilities?tab=${tab.id}`}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-brand-accent text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </a>
          )
        })}
      </div>

      {/* Tab Content */}
      {children}
    </div>
  )
}
