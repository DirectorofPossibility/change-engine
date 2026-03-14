'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import {
  FileText, Briefcase, Scale, Users, Building2, Lightbulb,
  ChevronRight, Loader2,
} from 'lucide-react'

interface SDGGoal {
  sdg_id: string
  sdg_number: number
  sdg_name: string
  sdg_color: string
  counts: {
    content: number
    services: number
    policies: number
    officials: number
    organizations: number
    opportunities: number
  }
}

interface EntityResults {
  content: Array<{ id: string; title_6th_grade: string; summary_6th_grade: string | null; pathway_primary: string | null; image_url: string | null; published_at: string | null }>
  services: Array<{ service_id: string; service_name: string; description_5th_grade: string | null; phone: string | null; city: string | null }>
  policies: Array<{ policy_id: string; policy_name: string; summary_6th_grade: string | null; bill_number: string | null; status: string | null; level: string | null }>
  officials: Array<{ official_id: string; official_name: string; title: string | null; party: string | null; level: string | null }>
  organizations: Array<{ org_id: string; org_name: string; description_5th_grade: string | null; website: string | null }>
}

const ENTITY_SECTIONS: Array<{
  key: keyof EntityResults
  countKey: keyof SDGGoal['counts']
  label: string
  icon: typeof FileText
  linkPrefix: string
  nameKey: string
  descKey: string | null
  idKey: string
}> = [
  { key: 'content', countKey: 'content', label: 'News & Articles', icon: FileText, linkPrefix: '/content/', nameKey: 'title_6th_grade', descKey: 'summary_6th_grade', idKey: 'id' },
  { key: 'services', countKey: 'services', label: 'Services', icon: Briefcase, linkPrefix: '/services/', nameKey: 'service_name', descKey: 'description_5th_grade', idKey: 'service_id' },
  { key: 'policies', countKey: 'policies', label: 'Policies', icon: Scale, linkPrefix: '/policies/', nameKey: 'policy_name', descKey: 'summary_6th_grade', idKey: 'policy_id' },
  { key: 'officials', countKey: 'officials', label: 'Officials', icon: Users, linkPrefix: '/officials/', nameKey: 'official_name', descKey: null, idKey: 'official_id' },
  { key: 'organizations', countKey: 'organizations', label: 'Organizations', icon: Building2, linkPrefix: '/organizations/', nameKey: 'org_name', descKey: 'description_5th_grade', idKey: 'org_id' },
]

interface SDGExplorerProps {
  goals: SDGGoal[]
}

export function SDGExplorer({ goals }: SDGExplorerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [entities, setEntities] = useState<EntityResults | null>(null)
  const [loading, setLoading] = useState(false)

  const selectedGoal = goals.find(function (g) { return g.sdg_id === selectedId })

  const handleSelect = useCallback(async function (sdgId: string) {
    if (sdgId === selectedId) {
      setSelectedId(null)
      setEntities(null)
      return
    }
    setSelectedId(sdgId)
    setEntities(null)
    setLoading(true)
    try {
      const res = await fetch('/api/sdgs/' + sdgId)
      if (res.ok) {
        const data = await res.json()
        setEntities(data)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [selectedId])

  return (
    <section className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      {/* Section header */}
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="font-display text-2xl font-bold text-ink">The 17 Goals</h2>
        <span className="font-mono text-xs text-muted">Click a goal to explore</span>
      </div>
      <div className="h-px border-b border-dotted border-rule mb-6" />

      {/* SDG Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {goals.map(function (goal) {
          const total = goal.counts.content + goal.counts.services + goal.counts.policies + goal.counts.officials + goal.counts.organizations + goal.counts.opportunities
          const isSelected = selectedId === goal.sdg_id
          return (
            <button
              key={goal.sdg_id}
              onClick={function () { handleSelect(goal.sdg_id) }}
              className={'text-left border transition-all group ' +
                (isSelected
                  ? 'border-ink shadow-md'
                  : 'border-rule hover:border-ink')}
            >
              <div className="flex items-stretch">
                {/* Color bar + number */}
                <div
                  className="w-14 flex-shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: goal.sdg_color }}
                >
                  <span className="text-white text-lg font-bold">{goal.sdg_number}</span>
                </div>

                {/* Content */}
                <div className="flex-1 p-3 min-w-0">
                  <h3 className="text-sm font-semibold text-ink leading-tight mb-1 truncate">
                    {goal.sdg_name}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-muted">
                    {goal.counts.content > 0 && (
                      <span className="flex items-center gap-1"><FileText size={11} />{goal.counts.content}</span>
                    )}
                    {goal.counts.services > 0 && (
                      <span className="flex items-center gap-1"><Briefcase size={11} />{goal.counts.services}</span>
                    )}
                    {goal.counts.policies > 0 && (
                      <span className="flex items-center gap-1"><Scale size={11} />{goal.counts.policies}</span>
                    )}
                    {goal.counts.officials > 0 && (
                      <span className="flex items-center gap-1"><Users size={11} />{goal.counts.officials}</span>
                    )}
                    {goal.counts.organizations > 0 && (
                      <span className="flex items-center gap-1"><Building2 size={11} />{goal.counts.organizations}</span>
                    )}
                    {goal.counts.opportunities > 0 && (
                      <span className="flex items-center gap-1"><Lightbulb size={11} />{goal.counts.opportunities}</span>
                    )}
                    {total === 0 && <span className="italic">No linked items yet</span>}
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex items-center pr-3">
                  <ChevronRight
                    size={16}
                    className={'text-muted transition-transform ' + (isSelected ? 'rotate-90' : 'group-hover:translate-x-0.5')}
                  />
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Expanded Detail Panel */}
      {selectedGoal && (
        <div className="border border-ink bg-white mb-8">
          {/* Header bar */}
          <div className="flex items-center gap-4 px-6 py-4" style={{ borderBottom: '3px solid ' + selectedGoal.sdg_color }}>
            <span
              className="w-12 h-12 flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
              style={{ backgroundColor: selectedGoal.sdg_color }}
            >
              {selectedGoal.sdg_number}
            </span>
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-xl font-bold text-ink">{selectedGoal.sdg_name}</h3>
              <p className="text-sm text-muted">SDG {selectedGoal.sdg_number} &middot; {getSDGDescription(selectedGoal.sdg_number)}</p>
            </div>
            <button
              onClick={function () { setSelectedId(null); setEntities(null) }}
              className="text-xs text-muted hover:text-ink"
            >
              Close
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-12 gap-2 text-sm text-muted">
              <Loader2 size={16} className="animate-spin" />
              Loading linked items...
            </div>
          )}

          {/* Entity sections */}
          {entities && (
            <div className="divide-y divide-rule">
              {ENTITY_SECTIONS.map(function (section) {
                const items = entities[section.key]
                const totalCount = selectedGoal.counts[section.countKey]
                if (totalCount === 0) return null
                const Icon = section.icon
                return (
                  <div key={section.key} className="px-6 py-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Icon size={16} style={{ color: selectedGoal.sdg_color }} />
                      <h4 className="text-sm font-semibold text-ink">{section.label}</h4>
                      <span className="text-xs text-muted">({totalCount})</span>
                    </div>
                    <div className="space-y-2">
                      {(items as any[]).map(function (item: any) {
                        const name = item[section.nameKey]
                        const desc = section.descKey ? item[section.descKey] : null
                        const id = item[section.idKey]
                        return (
                          <Link
                            key={id}
                            href={section.linkPrefix + id}
                            className="block group py-2 px-3 -mx-3 hover:bg-paper transition-colors"
                          >
                            <span className="text-sm font-medium text-ink group-hover:underline">{name}</span>
                            {desc && (
                              <p className="text-xs text-muted mt-0.5 line-clamp-2">{desc}</p>
                            )}
                            {section.key === 'officials' && item.title && (
                              <p className="text-xs text-muted mt-0.5">
                                {item.title}{item.party ? ' (' + item.party + ')' : ''}{item.level ? ' \u00b7 ' + item.level : ''}
                              </p>
                            )}
                          </Link>
                        )
                      })}
                    </div>
                    {totalCount > (items as any[]).length && (
                      <p className="text-xs text-muted mt-2 italic">
                        Showing {(items as any[]).length} of {totalCount} linked items
                      </p>
                    )}
                  </div>
                )
              })}

              {/* Opportunities count (no detail link) */}
              {selectedGoal.counts.opportunities > 0 && (
                <div className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    <Lightbulb size={16} style={{ color: selectedGoal.sdg_color }} />
                    <h4 className="text-sm font-semibold text-ink">Opportunities</h4>
                    <span className="text-xs text-muted">({selectedGoal.counts.opportunities})</span>
                  </div>
                  <p className="text-xs text-muted mt-2">
                    <Link href="/opportunities" className="hover:underline" style={{ color: selectedGoal.sdg_color }}>
                      Browse all opportunities &rarr;
                    </Link>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Cross-reference note */}
      <div className="bg-paper border border-rule p-5 text-sm text-muted">
        <p>
          SDG classifications are generated automatically using AI when content enters the Change Engine pipeline.
          Each item can map to multiple goals — a food bank, for example, may link to both <strong>SDG 1</strong> (No Poverty) and <strong>SDG 2</strong> (Zero Hunger).
          Explore the full taxonomy on the <Link href="/explore" className="underline hover:text-ink">Focus Areas</Link> page,
          or browse by <Link href="/pathways" className="underline hover:text-ink">pathway</Link>.
        </p>
      </div>
    </section>
  )
}

/** Short UN descriptions for each SDG */
function getSDGDescription(num: number): string {
  const descriptions: Record<number, string> = {
    1: 'End poverty in all its forms everywhere',
    2: 'End hunger, achieve food security and improved nutrition',
    3: 'Ensure healthy lives and promote well-being for all at all ages',
    4: 'Ensure inclusive and equitable quality education',
    5: 'Achieve gender equality and empower all women and girls',
    6: 'Ensure availability and sustainable management of water and sanitation',
    7: 'Ensure access to affordable, reliable, sustainable and modern energy',
    8: 'Promote sustained, inclusive and sustainable economic growth',
    9: 'Build resilient infrastructure, promote inclusive industrialization',
    10: 'Reduce inequality within and among countries',
    11: 'Make cities and human settlements inclusive, safe, resilient and sustainable',
    12: 'Ensure sustainable consumption and production patterns',
    13: 'Take urgent action to combat climate change and its impacts',
    14: 'Conserve and sustainably use the oceans, seas and marine resources',
    15: 'Protect, restore and promote sustainable use of terrestrial ecosystems',
    16: 'Promote peaceful and inclusive societies for sustainable development',
    17: 'Strengthen the means of implementation and revitalize global partnerships',
  }
  return descriptions[num] || ''
}
