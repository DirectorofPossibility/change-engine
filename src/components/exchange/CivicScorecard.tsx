'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Circle, Award, Star } from 'lucide-react'
import { getCivicChecklist, type CivicChecklistItem } from '@/lib/spiral'

function getEncouragingMessage(completed: number): string {
  if (completed >= 7) return 'Full civic engagement achieved! You\'re leading the way!'
  if (completed >= 5) return 'You\'re a civic champion! Almost there!'
  if (completed >= 3) return 'You\'re making a difference in your community!'
  return 'Every step counts. Start your civic journey!'
}

function formatDate(iso?: string): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

function ProgressRing({ completed, total }: { completed: number; total: number }) {
  const size = 120
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = total > 0 ? completed / total : 0
  const offset = circumference - progress * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E1DB"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E8723A"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-[#1A1A1A]">{completed}</span>
        <span className="text-xs text-[#6C7380]">of {total}</span>
      </div>
    </div>
  )
}

export default function CivicScorecard() {
  const [checklist, setChecklist] = useState<CivicChecklistItem[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setChecklist(getCivicChecklist())
    setMounted(true)

    const handleUpdate = () => setChecklist(getCivicChecklist())
    window.addEventListener('ce-spiral-update', handleUpdate)
    return () => window.removeEventListener('ce-spiral-update', handleUpdate)
  }, [])

  if (!mounted) {
    return (
      <div className="rounded-2xl border border-[#E5E1DB] bg-white p-6 animate-pulse">
        <div className="h-6 w-48 rounded bg-[#E5E1DB]" />
        <div className="mt-4 h-32 rounded bg-[#E5E1DB]" />
      </div>
    )
  }

  const completed = checklist.filter(c => c.completed).length
  const total = checklist.length
  const allDone = completed === total

  return (
    <section className="rounded-2xl border border-[#E5E1DB] bg-white p-6 sm:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-6">
        <ProgressRing completed={completed} total={total} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {allDone ? (
              <Star className="h-5 w-5 text-[#E8723A] fill-[#E8723A]" />
            ) : (
              <Award className="h-5 w-5 text-[#E8723A]" />
            )}
            <h2 className="font-serif text-xl font-semibold text-[#1A1A1A]">
              Civic Scorecard
            </h2>
          </div>
          <p className="text-sm text-[#6C7380] leading-relaxed">
            {getEncouragingMessage(completed)}
          </p>
        </div>
      </div>

      {/* Checklist */}
      <ul className="space-y-1">
        {checklist.map((item) => (
          <li key={item.action}>
            {item.completed ? (
              <div className="flex items-start gap-3 rounded-xl px-3 py-2.5 bg-green-50/60">
                <CheckCircle2 className="h-5 w-5 text-[#2D8659] mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-[#1A1A1A]">
                    {item.label}
                  </span>
                  {item.completedAt && (
                    <span className="ml-2 text-xs text-[#6C7380]">
                      {formatDate(item.completedAt)}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <Link
                href={item.href}
                className="flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-[#FAFAF8] transition-colors group"
              >
                <Circle className="h-5 w-5 text-[#E5E1DB] group-hover:text-[#E8723A] mt-0.5 flex-shrink-0 transition-colors" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-[#6C7380] group-hover:text-[#1A1A1A] transition-colors">
                    {item.label}
                  </span>
                  <span className="ml-2 text-xs text-[#E8723A] opacity-0 group-hover:opacity-100 transition-opacity">
                    Get started &rarr;
                  </span>
                </div>
              </Link>
            )}
          </li>
        ))}
      </ul>

      {/* Progress bar (mobile-friendly alternative view) */}
      <div className="mt-6 pt-4 border-t border-[#E5E1DB]">
        <div className="flex items-center justify-between text-xs text-[#6C7380] mb-2">
          <span>{completed} of {total} actions completed</span>
          <span>{Math.round((completed / total) * 100)}%</span>
        </div>
        <div className="h-2 rounded-full bg-[#E5E1DB] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#E8723A] transition-all duration-700 ease-out"
            style={{ width: `${(completed / total) * 100}%` }}
          />
        </div>
      </div>
    </section>
  )
}
