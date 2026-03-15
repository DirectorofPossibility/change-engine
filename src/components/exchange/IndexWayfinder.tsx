'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight, Info, Users, Clock, MapPin, Globe, Heart } from 'lucide-react'
import { THEMES } from '@/lib/constants'
import { FlowerOfLife } from '@/components/geo/sacred'
import { useTranslation } from '@/lib/use-translation'

interface RelatedSection {
  label: string
  href: string
  count?: number
  color?: string
}

interface IndexWayfinderProps {
  currentPage: string
  related?: RelatedSection[]
  showPathways?: boolean
  color?: string
}

const PATHWAY_LIST = Object.entries(THEMES).map(function ([id, t]) {
  return { id, name: t.name, color: t.color, slug: t.slug }
})

const CROSS_LINKS = [
  { i18nKey: 'wayfinder.nav_services', href: '/services', color: '#1b5e8a' },
  { i18nKey: 'wayfinder.nav_organizations', href: '/organizations', color: '#1a6b56' },
  { i18nKey: 'wayfinder.nav_officials', href: '/officials', color: '#4a2870' },
  { i18nKey: 'wayfinder.nav_policies', href: '/policies', color: '#7a2018' },
  { i18nKey: 'wayfinder.nav_opportunities', href: '/opportunities', color: '#1a5030' },
  { i18nKey: 'wayfinder.nav_news', href: '/news', color: '#6a4e10' },
  { i18nKey: 'wayfinder.nav_library', href: '/library', color: '#1e4d7a' },
  { i18nKey: 'wayfinder.nav_neighborhoods', href: '/neighborhoods', color: '#1b5e8a' },
]

const FOR_LINKS = [
  { label: 'Community Connector', href: '/for/partner', color: '#1e4d7a' },
  { label: 'Civic Leader', href: '/for/watchdog', color: '#1b5e8a' },
  { label: 'Professional', href: '/for/explorer', color: '#E8723A' },
]

const TIME_LINKS = [
  { label: 'Quick Action', href: '/search?time=TIME_QUICK&label=Quick Action', color: '#059669' },
  { label: 'Short Task', href: '/search?time=TIME_SHORT&label=Short Task', color: '#059669' },
  { label: 'Medium Commitment', href: '/search?time=TIME_MEDIUM&label=Medium Commitment', color: '#d97706' },
  { label: 'Deep Engagement', href: '/search?time=TIME_LONG&label=Deep Engagement', color: '#7a2018' },
]

const WHERE_LINKS = [
  { label: 'My Neighborhood', href: '/neighborhoods', color: '#1a6b56' },
  { label: 'Houston', href: '/search?q=Houston', color: '#1b5e8a' },
  { label: 'Harris County', href: '/search?q=Harris%20County', color: '#4a2870' },
  { label: 'Texas', href: '/search?q=Texas', color: '#7a2018' },
  { label: 'National', href: '/search?q=National', color: '#6a4e10' },
]

const SDG_LINKS = [
  { number: 1, label: 'No Poverty', color: '#E5243B', id: 'SDG_01' },
  { number: 2, label: 'Zero Hunger', color: '#DDA63A', id: 'SDG_02' },
  { number: 3, label: 'Good Health', color: '#4C9F38', id: 'SDG_03' },
  { number: 4, label: 'Quality Education', color: '#C5192D', id: 'SDG_04' },
  { number: 10, label: 'Reduced Inequalities', color: '#DD1367', id: 'SDG_10' },
  { number: 11, label: 'Sustainable Cities', color: '#FD9D24', id: 'SDG_11' },
  { number: 13, label: 'Climate Action', color: '#3F7E44', id: 'SDG_13' },
  { number: 16, label: 'Peace & Justice', color: '#1a5276', id: 'SDG_16' },
  { number: 17, label: 'Partnerships', color: '#19486A', id: 'SDG_17' },
]

const SDOH_LINKS = [
  { code: 'HC', label: 'Healthcare Access', color: '#4C9F38' },
  { code: 'NB', label: 'Neighborhood & Built Environment', color: '#FD9D24' },
  { code: 'SC', label: 'Social & Community Context', color: '#1b5e8a' },
  { code: 'ED', label: 'Education Access', color: '#C5192D' },
  { code: 'EA', label: 'Economic Stability', color: '#DD1367' },
]

function Tooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false)
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onMouseEnter={function () { setShow(true) }}
        onMouseLeave={function () { setShow(false) }}
        onClick={function () { setShow(!show) }}
        className="ml-1 text-[#8a929e] hover:text-[#0d1117] transition-colors"
        aria-label="More info"
      >
        <Info size={12} />
      </button>
      {show && (
        <span className="absolute left-6 top-0 z-50 w-56 p-2.5 text-xs leading-relaxed bg-white border border-[#dde1e8] shadow-lg rounded-md" style={{ color: '#0d1117' }}>
          {text}
        </span>
      )}
    </span>
  )
}

export function IndexWayfinder({
  currentPage,
  related,
  showPathways = true,
  color = '#1b5e8a',
}: IndexWayfinderProps) {
  const { t } = useTranslation()
  const [pathwaysOpen, setPathwaysOpen] = useState(true)
  const [exploreOpen, setExploreOpen] = useState(true)
  const [forOpen, setForOpen] = useState(false)
  const [timeOpen, setTimeOpen] = useState(false)
  const [whereOpen, setWhereOpen] = useState(false)
  const [sdgOpen, setSdgOpen] = useState(false)
  const [sdohOpen, setSdohOpen] = useState(false)

  return (
    <aside style={{ border: '1.5px solid #dde1e8' }}>
      {/* Header */}
      <div className="relative p-4 overflow-hidden" style={{ borderBottom: '1px solid #dde1e8' }}>
        <div className="absolute right-2 top-2 opacity-[0.06] pointer-events-none">
          <FlowerOfLife color={color} size={60} />
        </div>
        <h3 className="font-display text-base font-bold" style={{ color: '#0d1117' }}>{t('wayfinder.explore_more')}</h3>
        <p className="font-mono text-xs uppercase tracking-[0.08em] mt-1" style={{ color: '#8a929e' }}>{t('wayfinder.discover_connected')}</p>
      </div>

      {/* Explore — other sections */}
      <div style={{ borderBottom: '1px solid #dde1e8' }}>
        <button
          onClick={function () { setExploreOpen(!exploreOpen) }}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-paper transition-colors"
        >
          <span className="font-mono text-xs uppercase tracking-[0.08em]" style={{ color: '#8a929e' }}>{t('wayfinder.discover')}</span>
          {exploreOpen ? <ChevronDown size={14} style={{ color: '#8a929e' }} /> : <ChevronRight size={14} style={{ color: '#8a929e' }} />}
        </button>
        {exploreOpen && (
          <div className="px-4 pb-3 space-y-0.5">
            {CROSS_LINKS.filter(function (link) { return link.href !== '/' + currentPage }).map(function (link) {
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2.5 px-2 py-1.5 font-body text-[0.82rem] transition-colors hover:text-blue"
                  style={{ color: '#0d1117' }}
                >
                  <span className="w-1.5 h-1.5 flex-shrink-0" style={{ background: link.color }} />
                  {t(link.i18nKey)}
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* For — audience/persona */}
      <div style={{ borderBottom: '1px solid #dde1e8' }}>
        <button
          onClick={function () { setForOpen(!forOpen) }}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-paper transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Users size={13} style={{ color: '#8a929e' }} />
            <span className="font-mono text-xs uppercase tracking-[0.08em]" style={{ color: '#8a929e' }}>For</span>
          </span>
          {forOpen ? <ChevronDown size={14} style={{ color: '#8a929e' }} /> : <ChevronRight size={14} style={{ color: '#8a929e' }} />}
        </button>
        {forOpen && (
          <div className="px-4 pb-3 space-y-0.5">
            {FOR_LINKS.map(function (link) {
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2.5 px-2 py-1.5 font-body text-[0.82rem] transition-colors hover:text-blue"
                  style={{ color: '#0d1117' }}
                >
                  <span className="w-1.5 h-1.5 flex-shrink-0" style={{ background: link.color }} />
                  {link.label}
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Time — commitment level */}
      <div style={{ borderBottom: '1px solid #dde1e8' }}>
        <button
          onClick={function () { setTimeOpen(!timeOpen) }}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-paper transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Clock size={13} style={{ color: '#8a929e' }} />
            <span className="font-mono text-xs uppercase tracking-[0.08em]" style={{ color: '#8a929e' }}>Time</span>
          </span>
          {timeOpen ? <ChevronDown size={14} style={{ color: '#8a929e' }} /> : <ChevronRight size={14} style={{ color: '#8a929e' }} />}
        </button>
        {timeOpen && (
          <div className="px-4 pb-3 space-y-0.5">
            {TIME_LINKS.map(function (link) {
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className="flex items-center gap-2.5 px-2 py-1.5 font-body text-[0.82rem] transition-colors hover:text-blue"
                  style={{ color: '#0d1117' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: link.color }} />
                  {link.label}
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Where — geographic scope */}
      <div style={{ borderBottom: '1px solid #dde1e8' }}>
        <button
          onClick={function () { setWhereOpen(!whereOpen) }}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-paper transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <MapPin size={13} style={{ color: '#8a929e' }} />
            <span className="font-mono text-xs uppercase tracking-[0.08em]" style={{ color: '#8a929e' }}>Where</span>
          </span>
          {whereOpen ? <ChevronDown size={14} style={{ color: '#8a929e' }} /> : <ChevronRight size={14} style={{ color: '#8a929e' }} />}
        </button>
        {whereOpen && (
          <div className="px-4 pb-3 space-y-0.5">
            {WHERE_LINKS.map(function (link) {
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className="flex items-center gap-2.5 px-2 py-1.5 font-body text-[0.82rem] transition-colors hover:text-blue"
                  style={{ color: '#0d1117' }}
                >
                  <span className="w-1.5 h-1.5 flex-shrink-0" style={{ background: link.color }} />
                  {link.label}
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Pathways */}
      {showPathways && (
        <div style={{ borderBottom: '1px solid #dde1e8' }}>
          <button
            onClick={function () { setPathwaysOpen(!pathwaysOpen) }}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-paper transition-colors"
          >
            <span className="font-mono text-xs uppercase tracking-[0.08em]" style={{ color: '#8a929e' }}>{t('wayfinder.topics')}</span>
            {pathwaysOpen ? <ChevronDown size={14} style={{ color: '#8a929e' }} /> : <ChevronRight size={14} style={{ color: '#8a929e' }} />}
          </button>
          {pathwaysOpen && (
            <div className="px-4 pb-3 space-y-0.5">
              {PATHWAY_LIST.map(function (pw) {
                return (
                  <Link
                    key={pw.id}
                    href={'/pathways/' + pw.slug}
                    className="flex items-center gap-2.5 px-2 py-1.5 font-body text-[0.82rem] transition-colors hover:text-blue"
                    style={{ color: '#0d1117' }}
                  >
                    <FlowerOfLife color={pw.color} size={16} className="flex-shrink-0" />
                    {pw.name}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* UN SDGs */}
      <div style={{ borderBottom: '1px solid #dde1e8' }}>
        <button
          onClick={function () { setSdgOpen(!sdgOpen) }}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-paper transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Globe size={13} style={{ color: '#8a929e' }} />
            <span className="font-mono text-xs uppercase tracking-[0.08em]" style={{ color: '#8a929e' }}>UN SDGs</span>
            <Tooltip text="The UN Sustainable Development Goals are 17 global objectives adopted by all UN member states in 2015. They provide a shared blueprint for peace and prosperity through 2030 — from ending poverty to climate action. We map local resources to these goals so you can see how Houston connects to the global agenda." />
          </span>
          {sdgOpen ? <ChevronDown size={14} style={{ color: '#8a929e' }} /> : <ChevronRight size={14} style={{ color: '#8a929e' }} />}
        </button>
        {sdgOpen && (
          <div className="px-4 pb-3 space-y-0.5">
            {SDG_LINKS.map(function (sdg) {
              return (
                <Link
                  key={sdg.id}
                  href={'/search?sdg=' + encodeURIComponent(sdg.id) + '&label=' + encodeURIComponent(sdg.label)}
                  className="flex items-center gap-2.5 px-2 py-1.5 font-body text-[0.82rem] transition-colors hover:text-blue"
                  style={{ color: '#0d1117' }}
                >
                  <span
                    className="w-5 h-5 rounded-sm flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                    style={{ background: sdg.color }}
                  >
                    {sdg.number}
                  </span>
                  {sdg.label}
                </Link>
              )
            })}
            <Link
              href="/sdgs"
              className="flex items-center gap-2.5 px-2 py-1.5 font-body text-[0.82rem] font-semibold transition-colors hover:text-blue"
              style={{ color: '#1b5e8a' }}
            >
              View all 17 goals →
            </Link>
          </div>
        )}
      </div>

      {/* SDOH */}
      <div style={{ borderBottom: '1px solid #dde1e8' }}>
        <button
          onClick={function () { setSdohOpen(!sdohOpen) }}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-paper transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Heart size={13} style={{ color: '#8a929e' }} />
            <span className="font-mono text-xs uppercase tracking-[0.08em]" style={{ color: '#8a929e' }}>SDOH</span>
            <Tooltip text="Social Determinants of Health (SDOH) are the conditions where people are born, live, learn, work, and age. They include factors like housing, education, food access, and community safety. These conditions shape up to 80% of health outcomes — more than clinical care alone." />
          </span>
          {sdohOpen ? <ChevronDown size={14} style={{ color: '#8a929e' }} /> : <ChevronRight size={14} style={{ color: '#8a929e' }} />}
        </button>
        {sdohOpen && (
          <div className="px-4 pb-3 space-y-0.5">
            {SDOH_LINKS.map(function (sdoh) {
              return (
                <Link
                  key={sdoh.code}
                  href={'/search?sdoh=' + encodeURIComponent(sdoh.code) + '&label=' + encodeURIComponent(sdoh.label)}
                  className="flex items-center gap-2.5 px-2 py-1.5 font-body text-[0.82rem] transition-colors hover:text-blue"
                  style={{ color: '#0d1117' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: sdoh.color }} />
                  {sdoh.label}
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Related items */}
      {related && related.length > 0 && (
        <div className="p-4 space-y-1.5">
          <p className="font-mono text-xs uppercase tracking-[0.08em] mb-2" style={{ color: '#8a929e' }}>{t('wayfinder.related')}</p>
          {related.map(function (item) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between px-2 py-1.5 font-body text-[0.82rem] transition-colors hover:text-blue"
                style={{ color: '#0d1117' }}
              >
                <span className="flex items-center gap-2">
                  {item.color && <span className="w-1.5 h-1.5 flex-shrink-0" style={{ background: item.color }} />}
                  {item.label}
                </span>
                {item.count !== undefined && (
                  <span className="font-mono text-xs" style={{ color: '#8a929e' }}>{item.count}</span>
                )}
              </Link>
            )
          })}
        </div>
      )}

      {/* Support line */}
      <div className="px-4 py-3" style={{ borderTop: '1px solid #dde1e8', background: '#f4f5f7' }}>
        <p className="font-mono text-xs" style={{ color: '#8a929e' }}>
          {t('wayfinder.need_help')} <strong style={{ color: '#0d1117' }}>211</strong> / <strong style={{ color: '#0d1117' }}>311</strong> / <strong style={{ color: '#0d1117' }}>988</strong>
        </p>
      </div>
    </aside>
  )
}
