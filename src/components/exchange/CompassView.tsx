'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { THEMES, CENTER_COLORS } from '@/lib/constants'
import { ContentShelf, type ShelfItem } from './ContentShelf'
import { useTranslation } from '@/lib/i18n'
import type { CompassPreviewData } from '@/lib/types/exchange'

const CENTER_ICONS: Record<string, string> = {
  Learning: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  Action: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z',
  Resource: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z',
  Accountability: 'M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z',
}

const CENTER_QUESTIONS: Record<string, string> = {
  Learning: 'How can I understand?',
  Action: 'How can I help?',
  Resource: "What's available to me?",
  Accountability: 'Who makes decisions?',
}

interface CompassViewProps {
  pathwayCounts: Record<string, number>
  bridges: Array<[string, string, number]>
  preview: CompassPreviewData
}

const themeEntries = Object.entries(THEMES) as [string, (typeof THEMES)[keyof typeof THEMES]][]

export function CompassView({ pathwayCounts, bridges, preview }: CompassViewProps) {
  const [activePathway, setActivePathway] = useState<string | null>(null)
  const { t } = useTranslation()

  // Total items across all pathways for sizing
  const maxCount = useMemo(() => {
    return Math.max(1, ...Object.values(pathwayCounts))
  }, [pathwayCounts])

  // Radial positions for 7 items in a circle (desktop)
  const positions = useMemo(() => {
    const cx = 250, cy = 250, r = 180
    return themeEntries.map((_, i) => {
      const angle = (i / 7) * 2 * Math.PI - Math.PI / 2
      return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
    })
  }, [])

  // Build bridge lines between pathways
  const bridgeLines = useMemo(() => {
    const themeIndex: Record<string, number> = {}
    themeEntries.forEach(([id], i) => { themeIndex[id] = i })
    const maxBridge = Math.max(1, ...bridges.map(b => b[2]))
    return bridges.map(([a, b, count]) => {
      const ia = themeIndex[a], ib = themeIndex[b]
      if (ia === undefined || ib === undefined) return null
      return {
        x1: positions[ia].x, y1: positions[ia].y,
        x2: positions[ib].x, y2: positions[ib].y,
        opacity: 0.1 + 0.4 * (count / maxBridge),
      }
    }).filter(Boolean) as Array<{ x1: number; y1: number; x2: number; y2: number; opacity: number }>
  }, [bridges, positions])

  // Build shelf items for active pathway
  const activeContent = useMemo(() => {
    if (!activePathway || !preview[activePathway]) return null
    const centers = preview[activePathway]
    return Object.entries(centers).map(([center, items]) => ({
      center,
      items: items.map((item): ShelfItem => ({
        type: 'content' as const,
        id: item.id,
        title: item.title || 'Untitled',
        summary: item.summary,
        pathway: item.pathway,
        center: item.center,
        imageUrl: item.image_url,
        href: '/content/' + item.id,
      })),
    }))
  }, [activePathway, preview])

  const activeTheme = activePathway ? THEMES[activePathway as keyof typeof THEMES] : null

  return (
    <section className="py-8">
      {/* Desktop: radial visualization */}
      <div className="hidden md:block">
        <div className="relative mx-auto" style={{ width: 500, height: 500 }}>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 500 500">
            {/* Bridge lines */}
            {bridgeLines.map((line, i) => (
              <line
                key={i}
                x1={line.x1} y1={line.y1}
                x2={line.x2} y2={line.y2}
                stroke="#E8E3DB"
                strokeWidth={1.5}
                opacity={line.opacity}
              />
            ))}
          </svg>

          {/* Pathway nodes */}
          {themeEntries.map(([id, theme], i) => {
            const pos = positions[i]
            const count = pathwayCounts[id] || 0
            const isActive = activePathway === id
            const size = 36 + 28 * (count / maxCount)

            return (
              <button
                key={id}
                onClick={() => setActivePathway(isActive ? null : id)}
                className="absolute flex flex-col items-center transition-all duration-300"
                style={{
                  left: pos.x,
                  top: pos.y,
                  transform: 'translate(-50%, -50%)',
                  opacity: activePathway && !isActive ? 0.4 : 1,
                  zIndex: isActive ? 10 : 1,
                }}
              >
                <div
                  className="rounded-full flex items-center justify-center transition-all duration-300 shadow-sm"
                  style={{
                    width: isActive ? size + 8 : size,
                    height: isActive ? size + 8 : size,
                    backgroundColor: isActive ? theme.color : theme.color + '20',
                    border: isActive ? '3px solid ' + theme.color : '2px solid ' + theme.color + '40',
                  }}
                >
                  <span className={'text-xs font-bold ' + (isActive ? 'text-white' : '')} style={isActive ? {} : { color: theme.color }}>
                    {count}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-brand-text mt-1.5 whitespace-nowrap max-w-[90px] text-center leading-tight">
                  {theme.name}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Mobile: vertical pathway list */}
      <div className="md:hidden space-y-2">
        {themeEntries.map(([id, theme]) => {
          const count = pathwayCounts[id] || 0
          const isActive = activePathway === id

          return (
            <div key={id}>
              <button
                onClick={() => setActivePathway(isActive ? null : id)}
                className={'group flex items-center w-full bg-white rounded-xl border transition-all duration-200 overflow-hidden ' +
                  (isActive ? 'border-brand-border shadow-md' : 'border-brand-border hover:shadow-sm')}
              >
                <div
                  className="w-1 self-stretch flex-shrink-0 transition-all duration-200"
                  style={{ backgroundColor: theme.color, width: isActive ? '6px' : '4px' }}
                />
                <div className="flex-1 flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: theme.color + '20' }}
                    >
                      <span className="text-xs font-bold" style={{ color: theme.color }}>{count}</span>
                    </div>
                    <span className="text-sm font-semibold text-brand-text">{theme.name}</span>
                  </div>
                  <svg
                    className={'w-4 h-4 text-brand-muted transition-transform duration-200 ' + (isActive ? 'rotate-180' : '')}
                    fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </button>
            </div>
          )
        })}
      </div>

      {/* Expanded content shelves for active pathway */}
      {activePathway && activeTheme && (
        <div className="mt-6 transition-all duration-300">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: activeTheme.color }} />
            <h3 className="font-serif text-lg font-bold text-brand-text">{activeTheme.name}</h3>
          </div>
          <p className="text-sm text-brand-muted mb-4 font-serif italic">{activeTheme.description}</p>

          {activeContent && activeContent.length > 0 ? (
            <div className="space-y-2">
              {activeContent.map(({ center, items }) => (
                <ContentShelf
                  key={center}
                  title={center}
                  question={CENTER_QUESTIONS[center]}
                  iconPath={CENTER_ICONS[center]}
                  color={CENTER_COLORS[center] || activeTheme.color}
                  items={items}
                  hideIfEmpty
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-brand-muted italic py-4">
              Content for this pathway is being curated. Check back soon.
            </p>
          )}

          <div className="mt-4">
            <Link
              href={'/pathways/' + activeTheme.slug}
              className="text-xs font-semibold hover:underline transition-colors"
              style={{ color: activeTheme.color }}
            >
              Explore {activeTheme.name} &rarr;
            </Link>
          </div>
        </div>
      )}
    </section>
  )
}
