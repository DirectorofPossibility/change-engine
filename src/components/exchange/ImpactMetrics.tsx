'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { BookOpen, Building2, Users, ScrollText } from 'lucide-react'
import { BRAND } from '@/lib/constants'
import { useTranslation } from '@/lib/use-translation'

interface ImpactMetricsProps {
  stats: { resources: number; organizations: number; officials: number; policies: number }
}

function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const hasAnimated = useRef(false)

  useEffect(function () {
    if (!ref.current || hasAnimated.current) return

    const observer = new IntersectionObserver(
      function (entries) {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          const start = performance.now()
          const tick = function (now: number) {
            const elapsed = now - start
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setValue(Math.round(eased * target))
            if (progress < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.3 }
    )

    observer.observe(ref.current)
    return function () { observer.disconnect() }
  }, [target, duration])

  return { value, ref }
}

const METRICS = [
  { key: 'resources' as const, icon: BookOpen, labelKey: 'home.stats_resources', href: '/library' },
  { key: 'organizations' as const, icon: Building2, labelKey: 'home.stats_organizations', href: '/services' },
  { key: 'officials' as const, icon: Users, labelKey: 'home.stats_officials', href: '/officials' },
  { key: 'policies' as const, icon: ScrollText, labelKey: 'home.stats_policies', href: '/policies' },
] as const

export function ImpactMetrics({ stats }: ImpactMetricsProps) {
  const { t } = useTranslation()

  return (
    <section className="mb-14">
      <h2 className="font-display text-lg font-semibold text-center text-brand-muted mb-6">
        {t('home.community_glance')}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {METRICS.map(function (metric) {
          return <MetricCard key={metric.key} target={stats[metric.key]} icon={metric.icon} label={t(metric.labelKey)} href={metric.href} />
        })}
      </div>
    </section>
  )
}

function MetricCard({ target, icon: Icon, label, href }: { target: number; icon: typeof BookOpen; label: string; href: string }) {
  const { value, ref } = useCountUp(target)

  return (
    <div ref={ref}>
      <Link href={href} className="flex flex-col items-center gap-2 p-6 bg-white border border-brand-border hover:border-ink hover:-translate-y-0.5 transition-all duration-200 cursor-pointer h-full">
        <Icon size={24} style={{ color: BRAND.accent }} strokeWidth={1.5} />
        <span className="font-display text-5xl font-bold tracking-tight" style={{ color: BRAND.text }}>
          {value.toLocaleString()}
        </span>
        <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider">
          {label}
        </span>
      </Link>
    </div>
  )
}
