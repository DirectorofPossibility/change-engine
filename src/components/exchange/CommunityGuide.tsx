'use client'

/**
 * @fileoverview Community Guide — the civic & social onramp.
 *
 * Designed for the average person: plain language, layered progressive
 * disclosure, three clear pillars (Find Help, Who's Responsible, Get Involved)
 * backed by 211, policy data, and accountability.
 *
 * Layers:
 *   1. Welcome + orientation (search, ZIP, stats)
 *   2. Find Help & Services (211 backbone, service categories, orgs)
 *   3. Who Represents You (officials by level, policies, elections)
 *   4. Get Involved (volunteering, events, learning, pathways)
 *   5. What's Happening (latest content, compact)
 *   6. Always Available (211 / 311 / 988)
 *   7. Explore Deeper (7 pathways, compass)
 */

import Link from 'next/link'
import Image from 'next/image'
import { HeroZipInput } from './HeroZipInput'
import { HeroSearchInput } from './HeroSearchInput'
import { FeaturedPromo } from './FeaturedPromo'
import { GoodThingsWidget } from './GoodThingsWidget'
import { THEMES } from '@/lib/constants'
import { useTranslation } from '@/lib/use-translation'
import {
  Phone, Heart, Shield, Users, Scale, BookOpen, Home,
  ArrowRight, ChevronRight, Briefcase, Stethoscope,
  GraduationCap, Megaphone, MapPin, Calendar,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────

interface CommunityGuideProps {
  stats: {
    resources: number
    services: number
    officials: number
    policies: number
    organizations: number
  }
  latestContent: Array<Record<string, unknown>>
}

// ── Component ────────────────────────────────────────────────────────────

export function CommunityGuide({ stats, latestContent }: CommunityGuideProps) {
  const { t } = useTranslation()

  const PATHWAY_LIST = Object.entries(THEMES).map(function ([id, theme]) {
    return { id, name: theme.name, color: theme.color, slug: theme.slug }
  })

  return (
    <div className="relative">

      {/* ═══════════════════════════════════════════════════════════════════
          LAYER 1 — WELCOME & ORIENTATION
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #FAF8F5 0%, #FFFFFF 100%)' }}>
        {/* Subtle texture */}
        <div className="absolute inset-0 pointer-events-none opacity-30" style={{
          backgroundImage: 'radial-gradient(circle, rgba(199,91,42,0.04) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />

        <div className="relative z-10 max-w-[780px] mx-auto px-6 py-16 lg:py-24 text-center">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-brand-accent mb-4">
            {t('guide.label')} &middot; {t('guide.houston')}
          </p>

          <h1 className="font-serif text-[clamp(2rem,5vw,3.2rem)] leading-[1.1] tracking-tight text-brand-text mb-5">
            {t('guide.title')}
          </h1>

          <p className="text-lg leading-relaxed text-brand-muted max-w-2xl mx-auto mb-10">
            {t('guide.subtitle')}
          </p>

          {/* Search + ZIP — centered, stacked */}
          <div className="max-w-md mx-auto space-y-3 mb-10">
            <HeroSearchInput />
            <HeroZipInput />
          </div>

          {/* Quiet stats */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-brand-muted">
            <span>
              <strong className="text-brand-text font-semibold">{stats.services.toLocaleString()}</strong>{' '}
              {t('guide.stat_services')}
            </span>
            <span className="hidden sm:inline text-brand-border">|</span>
            <span>
              <strong className="text-brand-text font-semibold">{stats.organizations.toLocaleString()}</strong>{' '}
              {t('guide.stat_organizations')}
            </span>
            <span className="hidden sm:inline text-brand-border">|</span>
            <span>
              <strong className="text-brand-text font-semibold">{stats.officials}</strong>{' '}
              {t('guide.stat_officials')}
            </span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          LAYER 2 — FIND HELP & SERVICES (211 backbone)
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="border-t border-brand-border">
        <div className="max-w-[1100px] mx-auto px-6 py-14 lg:py-16">
          <div className="flex flex-col lg:flex-row lg:gap-16">

            {/* Left — narrative + 211 callout */}
            <div className="lg:w-[38%] mb-10 lg:mb-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: '#C75B2A12' }}>
                  <Heart size={20} className="text-[#C75B2A]" />
                </div>
                <h2 className="font-serif text-2xl font-bold text-brand-text">{t('guide.help_title')}</h2>
              </div>

              <p className="text-[15px] text-brand-muted leading-relaxed mb-8">
                {t('guide.help_description')}
              </p>

              {/* 211 callout — the backbone */}
              <div className="rounded-xl p-5 border" style={{ background: '#C75B2A08', borderColor: '#C75B2A20' }}>
                <div className="flex items-center gap-3 mb-2">
                  <Phone size={18} className="text-[#C75B2A]" />
                  <span className="text-xl font-black text-brand-text">211</span>
                </div>
                <p className="text-sm text-brand-muted leading-relaxed mb-3">
                  {t('guide.211_description')}
                </p>
                <a
                  href="tel:211"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#C75B2A] hover:gap-2.5 transition-all"
                >
                  {t('guide.call_211')} <ArrowRight size={14} />
                </a>
              </div>
            </div>

            {/* Right — service categories + links */}
            <div className="lg:w-[62%]">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { key: 'cat_housing', href: '/services?q=housing', icon: Home, color: '#C75B2A' },
                  { key: 'cat_food', href: '/services?q=food', icon: Heart, color: '#e53e3e' },
                  { key: 'cat_health', href: '/services?q=health', icon: Stethoscope, color: '#38a169' },
                  { key: 'cat_jobs', href: '/services?q=employment', icon: Briefcase, color: '#3182ce' },
                  { key: 'cat_legal', href: '/services?q=legal', icon: Scale, color: '#805ad5' },
                  { key: 'cat_youth', href: '/services?q=youth+education', icon: GraduationCap, color: '#d69e2e' },
                ].map(function (cat) {
                  const Icon = cat.icon
                  return (
                    <Link
                      key={cat.key}
                      href={cat.href}
                      className="flex items-center gap-3 p-4 rounded-xl border border-brand-border bg-white hover:shadow-sm hover:border-brand-accent/20 transition-all group"
                    >
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: cat.color + '12' }}>
                        <Icon size={18} style={{ color: cat.color }} />
                      </div>
                      <span className="text-sm font-medium text-brand-text group-hover:text-brand-accent transition-colors">
                        {t('guide.' + cat.key)}
                      </span>
                    </Link>
                  )
                })}
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-6">
                <Link
                  href="/services"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#C75B2A] hover:gap-2.5 transition-all"
                >
                  {t('guide.browse_services')} <ArrowRight size={14} />
                </Link>
                <Link
                  href="/organizations"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-muted hover:text-brand-text transition-colors"
                >
                  {t('guide.browse_organizations')} <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          LAYER 3 — WHO REPRESENTS YOU (officials, policy, elections)
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="border-t border-brand-border bg-[#FAFAF8]">
        <div className="max-w-[1100px] mx-auto px-6 py-14 lg:py-16">
          <div className="flex flex-col lg:flex-row-reverse lg:gap-16">

            {/* Right — narrative */}
            <div className="lg:w-[38%] mb-10 lg:mb-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: '#805ad512' }}>
                  <Shield size={20} className="text-[#805ad5]" />
                </div>
                <h2 className="font-serif text-2xl font-bold text-brand-text">{t('guide.responsible_title')}</h2>
              </div>

              <p className="text-[15px] text-brand-muted leading-relaxed">
                {t('guide.responsible_description')}
              </p>
            </div>

            {/* Left — government levels */}
            <div className="lg:w-[62%]">
              <div className="space-y-3">
                {[
                  { key: 'city', color: '#38a169', count: null },
                  { key: 'county', color: '#3182ce', count: null },
                  { key: 'state', color: '#805ad5', count: null },
                  { key: 'federal', color: '#e53e3e', count: null },
                ].map(function (gov) {
                  return (
                    <Link
                      key={gov.key}
                      href={'/officials?level=' + gov.key}
                      className="flex items-center justify-between p-4 rounded-xl border border-brand-border bg-white hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-1.5 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: gov.color }} />
                        <div className="min-w-0">
                          <span className="block text-sm font-semibold text-brand-text">
                            {t('guide.level_' + gov.key)}
                          </span>
                          <span className="block text-xs text-brand-muted truncate">
                            {t('guide.level_' + gov.key + '_desc')}
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-brand-muted group-hover:text-[#805ad5] transition-colors flex-shrink-0 ml-3" />
                    </Link>
                  )
                })}
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-6">
                <Link
                  href="/officials"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#805ad5] hover:gap-2.5 transition-all"
                >
                  {t('guide.find_officials')} <ArrowRight size={14} />
                </Link>
                <Link
                  href="/policies"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-muted hover:text-brand-text transition-colors"
                >
                  {t('guide.active_policies')} ({stats.policies}) <ArrowRight size={14} />
                </Link>
                <Link
                  href="/elections"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-muted hover:text-brand-text transition-colors"
                >
                  {t('guide.elections_voting')} <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          LAYER 4 — GET INVOLVED
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="border-t border-brand-border">
        <div className="max-w-[1100px] mx-auto px-6 py-14 lg:py-16">
          <div className="flex flex-col lg:flex-row lg:gap-16">

            {/* Left — narrative */}
            <div className="lg:w-[38%] mb-10 lg:mb-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: '#38a16912' }}>
                  <Users size={20} className="text-[#38a169]" />
                </div>
                <h2 className="font-serif text-2xl font-bold text-brand-text">{t('guide.involved_title')}</h2>
              </div>

              <p className="text-[15px] text-brand-muted leading-relaxed">
                {t('guide.involved_description')}
              </p>
            </div>

            {/* Right — action cards */}
            <div className="lg:w-[62%]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { titleKey: 'guide.volunteer', descKey: 'guide.volunteer_desc', href: '/opportunities', icon: Heart, color: '#38a169' },
                  { titleKey: 'guide.attend', descKey: 'guide.attend_desc', href: '/news?type=event', icon: Calendar, color: '#3182ce' },
                  { titleKey: 'guide.learn_more', descKey: 'guide.learn_desc', href: '/library', icon: BookOpen, color: '#d69e2e' },
                  { titleKey: 'guide.explore_pathways', descKey: 'guide.explore_pathways_desc', href: '/pathways', icon: MapPin, color: '#805ad5' },
                ].map(function (item) {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="p-5 rounded-xl border border-brand-border bg-white hover:shadow-sm transition-all group"
                    >
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: item.color + '12' }}>
                        <Icon size={18} style={{ color: item.color }} />
                      </div>
                      <span className="block text-sm font-semibold text-brand-text group-hover:text-brand-accent transition-colors mb-1">
                        {t(item.titleKey)}
                      </span>
                      <span className="block text-xs text-brand-muted leading-relaxed">
                        {t(item.descKey)}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          LAYER 5 — WHAT'S HAPPENING (compact news)
         ═══════════════════════════════════════════════════════════════════ */}
      {latestContent.length > 0 && (
        <section className="border-t border-brand-border bg-[#FAFAF8]">
          <div className="max-w-[1100px] mx-auto px-6 py-14">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-serif text-2xl font-bold text-brand-text">
                {t('guide.whats_happening')}
              </h2>
              <Link
                href="/news"
                className="text-sm font-semibold text-brand-accent hover:underline"
              >
                {t('guide.all_news')} &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {latestContent.slice(0, 6).map(function (item: any) {
                return (
                  <Link
                    key={item.id}
                    href={'/content/' + item.id}
                    className="rounded-xl border border-brand-border bg-white overflow-hidden hover:shadow-sm transition-all group"
                  >
                    {/* Image or color bar */}
                    {item.hero_image_url ? (
                      <div className="relative h-32 overflow-hidden">
                        <Image
                          src={item.hero_image_url}
                          alt=""
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    ) : (
                      <div className="h-2 w-full" style={{ background: '#C75B2A' }} />
                    )}
                    <div className="p-4">
                      <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-brand-muted mb-2">
                        {item.center || 'News'}
                      </span>
                      <h3 className="text-sm font-semibold text-brand-text line-clamp-2 group-hover:text-brand-accent transition-colors mb-1">
                        {item.title_6th_grade}
                      </h3>
                      {item.summary_6th_grade && (
                        <p className="text-xs text-brand-muted line-clamp-2">{item.summary_6th_grade}</p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          FEATURED + GOOD THINGS
         ═══════════════════════════════════════════════════════════════════ */}
      <div className="border-t border-brand-border">
        <div className="max-w-[1100px] mx-auto px-6 py-8 space-y-4">
          <FeaturedPromo variant="banner" />
          <GoodThingsWidget variant="banner" />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          LAYER 6 — ALWAYS AVAILABLE (211 / 311 / 988)
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="border-t border-brand-border bg-[#FAFAF8]">
        <div className="max-w-[1100px] mx-auto px-6 py-12">
          <h2 className="font-serif text-xl font-bold text-brand-text text-center mb-8">
            {t('guide.always_available')}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { number: '211', labelKey: 'guide.line_211', descKey: 'guide.line_211_desc', color: '#C75B2A' },
              { number: '311', labelKey: 'guide.line_311', descKey: 'guide.line_311_desc', color: '#3182ce' },
              { number: '988', labelKey: 'guide.line_988', descKey: 'guide.line_988_desc', color: '#805ad5' },
            ].map(function (line) {
              return (
                <a
                  key={line.number}
                  href={'tel:' + line.number}
                  className="flex items-center gap-4 p-5 rounded-xl border border-brand-border bg-white hover:shadow-sm transition-all"
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: line.color + '10' }}
                  >
                    <span className="text-xl font-black" style={{ color: line.color }}>
                      {line.number}
                    </span>
                  </div>
                  <div>
                    <span className="block text-sm font-semibold text-brand-text">
                      {t(line.labelKey)}
                    </span>
                    <span className="block text-xs text-brand-muted">
                      {t(line.descKey)}
                    </span>
                  </div>
                </a>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          LAYER 7 — EXPLORE DEEPER (pathways + compass)
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="border-t border-brand-border">
        <div className="max-w-[1100px] mx-auto px-6 py-14 text-center">
          <h2 className="font-serif text-2xl font-bold text-brand-text mb-2">
            {t('guide.explore_deeper')}
          </h2>
          <p className="text-sm text-brand-muted mb-8">
            {t('guide.explore_deeper_desc')}
          </p>

          {/* Pathway pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {PATHWAY_LIST.map(function (pw) {
              return (
                <Link
                  key={pw.id}
                  href={'/pathways/' + pw.slug}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border bg-white hover:shadow-sm transition-all group"
                  style={{ borderColor: pw.color + '30' }}
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: pw.color }}
                  />
                  <span className="text-sm font-medium text-brand-text group-hover:text-brand-accent transition-colors">
                    {pw.name}
                  </span>
                </Link>
              )
            })}
          </div>

          <Link
            href="/compass"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-accent text-white font-semibold text-sm hover:shadow-md hover:bg-brand-accent/90 transition-all"
          >
            {t('guide.open_compass')} <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Quiet footer line */}
      <div className="border-t border-brand-border py-6 text-center">
        <p className="text-[11px] font-mono text-brand-muted tracking-wider">
          {t('guide.powered_by')}
        </p>
      </div>
    </div>
  )
}
