'use client'

import { useState, useEffect, useCallback, useRef, useId } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Send, Mail, Download, X, Menu, Info, BookOpen, LogIn, UserPlus, Building2, Handshake, Heart, ExternalLink } from 'lucide-react'
import { FlowerOfLifeIcon } from '@/components/exchange/FlowerIcons'
import { GradientFOL } from '@/components/exchange/GradientFOL'
import { useTranslation } from '@/lib/use-translation'
import { LanguageSwitcher } from '@/components/exchange/LanguageSwitcher'

const GoodThingsMap = dynamic(
  function () { return import('../(exchange)/(pages)/goodthings/GoodThingsMap').then(function (m) { return m.GoodThingsMap }) },
  { ssr: false, loading: function () { return <div className="w-full h-full bg-brand-bg-alt animate-pulse" /> } }
)

interface GoodThingEntry {
  id: string
  thing_1: string
  thing_2: string
  thing_3: string
  zip_code: string
  city: string | null
  state: string | null
  latitude: number | null
  longitude: number | null
  display_name: string | null
  created_at: string
}

const THING_COLORS = ['#7a2018', '#6a4e10', '#1a3460']

// GradientFOL is now imported from @/components/exchange/GradientFOL

export default function SplashPage() {
  const { t } = useTranslation()
  const [entries, setEntries] = useState<GoodThingEntry[]>([])
  const [focusEntry, setFocusEntry] = useState<GoodThingEntry | null>(null)
  const [thing1, setThing1] = useState('')
  const [thing2, setThing2] = useState('')
  const [thing3, setThing3] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [zip, setZip] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [showImagine, setShowImagine] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const lastSubmittedRef = useRef<GoodThingEntry | null>(null)
  const firstInputRef = useRef<HTMLInputElement>(null)

  useEffect(function () {
    fetch('/api/good-things')
      .then(function (r) { return r.json() })
      .then(function (d) { if (d.entries) setEntries(d.entries) })
      .catch(function () {})
  }, [])

  // Autofocus first input when share drawer opens
  useEffect(function () {
    if (shareOpen && firstInputRef.current) {
      setTimeout(function () { firstInputRef.current?.focus() }, 350)
    }
  }, [shareOpen])

  // Escape key closes drawers
  useEffect(function () {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (shareOpen) setShareOpen(false)
        if (mobileMenuOpen) setMobileMenuOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return function () { window.removeEventListener('keydown', handleKeyDown) }
  }, [shareOpen, mobileMenuOpen])

  const handleTickerClick = useCallback(function (entry: GoodThingEntry) {
    setFocusEntry(entry)
    setMobileMenuOpen(false)
  }, [])

  async function handleGoodThings(e: React.FormEvent) {
    e.preventDefault()
    if (!thing1.trim() || !thing2.trim() || !thing3.trim()) { setError(t('splash.all_three_required')); return }
    if (!/^\d{5}$/.test(zip)) { setError(t('splash.valid_zip')); return }
    setError(''); setSubmitting(true)
    try {
      const res = await fetch('/api/good-things', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thing_1: thing1, thing_2: thing2, thing_3: thing3, display_name: displayName.trim() || null, zip_code: zip }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong.'); return }
      const entry = data.entry as GoodThingEntry
      lastSubmittedRef.current = entry
      setFocusEntry(entry)
      setEntries(function (prev) { return [entry, ...prev] })
      setSubmitted(true)
    } catch { setError(t('splash.network_error')) } finally { setSubmitting(false) }
  }

  function handleEmailCopy() {
    const e = lastSubmittedRef.current
    if (!e) return
    const subject = encodeURIComponent('My Three Good Things')
    const body = encodeURIComponent(
      'My Three Good Things\n\n' +
      '1. ' + e.thing_1 + '\n' +
      '2. ' + e.thing_2 + '\n' +
      '3. ' + e.thing_3 + '\n\n' +
      (e.display_name ? 'Shared by ' + e.display_name + '\n' : '') +
      'Shared on Change Engine — changeengine.us'
    )
    window.open('mailto:?subject=' + subject + '&body=' + body, '_self')
  }

  function handleDownload() {
    const e = lastSubmittedRef.current
    if (!e) return
    const date = new Date(e.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    const text =
      'My Three Good Things\n' +
      date + '\n\n' +
      '1. ' + e.thing_1 + '\n' +
      '2. ' + e.thing_2 + '\n' +
      '3. ' + e.thing_3 + '\n\n' +
      (e.display_name ? 'Shared by ' + e.display_name + '\n' : '') +
      '\nShared on Change Engine — changeengine.us'
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'three-good-things.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const tickerItems = entries.slice(0, 40).flatMap(function (entry) {
    const who = entry.display_name || [entry.city, entry.state].filter(Boolean).join(', ') || entry.zip_code
    return [entry.thing_1, entry.thing_2, entry.thing_3].map(function (thing, i) {
      return { text: thing, color: THING_COLORS[i], loc: who, entry: entry }
    })
  })

  /* Sidebar content — shared between desktop aside and mobile drawer */
  const sidebarContent = (
    <>
      {/* Brand identity block */}
      <div className="relative overflow-hidden">
        {/* FOL background watermark — fills sidebar width, bleeds off edges */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.06]" style={{ width: '100%', aspectRatio: '1' }}>
          <GradientFOL className="w-full h-full" />
        </div>

        {/* Large FOL — full column width */}
        <div className="relative z-10 px-4 pt-3">
          <GradientFOL className="w-full" />
        </div>

        {/* Title underneath */}
        <div className="relative z-10 px-4 pb-3 text-center">
          <h1 className="font-serif text-2xl font-bold text-brand-text leading-none">{t('splash.title')}</h1>
          <p className="text-xs text-brand-muted font-serif mt-1">{t('splash.subtitle')}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="h-px flex-1 bg-brand-accent/30" />
            <span className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-brand-accent">Beta</span>
            <span className="h-px flex-1 bg-brand-accent/30" />
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex-1 px-4 py-1 space-y-1.5">
        <button
          onClick={function () { setShareOpen(true); setMobileMenuOpen(false) }}
          className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold border-2 border-brand-border bg-white text-brand-text hover:border-brand-accent/40 transition-all flex items-center gap-2.5"
        >
          <FlowerOfLifeIcon size={16} color="#7a2018" />
          {t('splash.three_good_things')}
        </button>

        <button
          onClick={function () { setShowImagine(!showImagine) }}
          className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold border border-brand-border bg-white text-brand-text hover:border-brand-accent/40 transition-all"
        >
          <span className="flex items-center gap-2.5">
            <Info size={16} className="text-brand-muted shrink-0" />
            <span className="flex-1">Beta</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
              className={'transition-transform shrink-0 ' + (showImagine ? 'rotate-180' : '')}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
        </button>
        {showImagine && (
          <div className="px-3 py-2 space-y-3">
            <p className="text-xs font-serif text-brand-text italic leading-relaxed">
              {t('splash.coming_soon_vision')}
            </p>
            <p className="text-xs text-brand-muted leading-relaxed">
              {t('splash.coming_soon_desc')}
            </p>
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-accent mt-2">{t('splash.what_to_expect')}</p>
            <ul className="space-y-2 text-xs text-brand-text leading-relaxed">
              {[t('splash.expect_1'), t('splash.expect_2'), t('splash.expect_3'), t('splash.expect_4')].map(function (text, i) {
                return (
                  <li key={i} className="flex gap-2">
                    <FlowerOfLifeIcon size={12} color="#C75B2A" className="shrink-0 mt-0.5" />
                    <span>{text}</span>
                  </li>
                )
              })}
            </ul>
            <p className="text-xs text-brand-muted italic">
              {t('splash.expect_closing')}
            </p>
          </div>
        )}

        <a
          href="https://thechangelab.substack.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold border border-brand-border bg-white text-brand-text hover:border-brand-accent/40 transition-all"
        >
          <BookOpen size={16} className="text-brand-muted shrink-0" />
          {t('splash.read_substack')}
          <ExternalLink size={12} className="text-brand-muted ml-auto shrink-0" />
        </a>

        <div className="h-px bg-brand-border my-1" />

        <Link
          href="/login"
          className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold border border-brand-border bg-white text-brand-text hover:border-brand-accent/40 transition-all"
        >
          <LogIn size={16} className="text-brand-muted shrink-0" />
          {t('splash.beta_login')}
        </Link>

        <Link
          href="/signup"
          className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold border-2 border-brand-border bg-white text-brand-text hover:border-brand-accent/40 transition-all"
        >
          <UserPlus size={16} className="text-brand-muted shrink-0" />
          {t('splash.beta_signup')}
        </Link>

        <div className="h-px bg-brand-border my-1" />

        <a
          href="https://www.thechangelab.net/about2"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold border border-brand-border bg-white text-brand-text hover:border-brand-accent/40 transition-all"
        >
          <Building2 size={16} className="text-brand-muted shrink-0" />
          {t('splash.learn_about')}
          <ExternalLink size={12} className="text-brand-muted ml-auto shrink-0" />
        </a>

        <a
          href="mailto:david@thechangelab.net?subject=Explore%20Partnership"
          className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold border border-brand-border bg-white text-brand-text hover:border-brand-accent/40 transition-all"
        >
          <Handshake size={16} className="text-brand-muted shrink-0" />
          {t('splash.explore_partnership')}
        </a>

        <a
          href="https://app.betterunite.com/thechangelab#bnte_p_bwThbDPG"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold border-2 border-brand-accent bg-brand-accent/5 text-brand-accent hover:bg-brand-accent/10 transition-all"
        >
          <Heart size={16} className="shrink-0" />
          {t('splash.support_work')}
        </a>
      </div>

      {/* Language switcher + Footer */}
      <div className="px-5 py-2 mt-auto space-y-2">
        <div className="flex justify-center">
          <LanguageSwitcher />
        </div>
        <p className="text-[10px] text-brand-muted-light font-mono text-center">
          {t('splash.project_of')}{' '}
          <a href="https://www.thechangelab.net/about2" target="_blank" rel="noopener noreferrer" className="hover:text-brand-accent transition-colors underline">
            The Change Lab
          </a>
        </p>
      </div>
    </>
  )

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-brand-bg relative">

      {/* ── Spectrum bar ── */}
      <div className="spectrum-bar relative z-10 shrink-0">
        <div style={{ background: '#1a6b56' }} />
        <div style={{ background: '#1e4d7a' }} />
        <div style={{ background: '#4a2870' }} />
        <div style={{ background: '#7a2018' }} />
        <div style={{ background: '#6a4e10' }} />
        <div style={{ background: '#1a5030' }} />
        <div style={{ background: '#1a3460' }} />
      </div>

      {/* ── Mobile header ── */}
      <div className="md:hidden shrink-0 bg-brand-bg-alt border-b border-brand-border px-4 py-2.5 flex items-center justify-between relative z-30 overflow-hidden">
        {/* Mobile watermark FOL */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.05]" style={{ width: '200%', aspectRatio: '1' }}>
          <GradientFOL className="w-full h-full" />
        </div>
        <div className="relative z-10 flex items-center gap-2.5">
          <GradientFOL className="w-9 h-9" />
          <div>
            <span className="font-serif text-base font-bold text-brand-text leading-none block">{t('splash.title')}</span>
            <span className="text-[9px] font-mono text-brand-accent uppercase tracking-widest">Beta</span>
          </div>
        </div>
        <button onClick={function () { setMobileMenuOpen(!mobileMenuOpen) }} className="text-brand-text p-1">
          <Menu size={22} />
        </button>
      </div>

      {/* ── Mobile menu overlay ── */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-30 md:hidden" onClick={function () { setMobileMenuOpen(false) }} />
          <div className="fixed top-0 left-0 w-80 max-w-[85vw] h-full bg-brand-bg-alt z-40 shadow-xl overflow-y-auto flex flex-col md:hidden animate-slide-in">
            <div className="flex items-center justify-between p-4 border-b border-brand-border">
              <span className="font-serif text-lg font-bold text-brand-text">{t('splash.menu')}</span>
              <button onClick={function () { setMobileMenuOpen(false) }} className="text-brand-muted hover:text-brand-text">
                <X size={18} />
              </button>
            </div>
            {sidebarContent}
          </div>
        </>
      )}

      {/* ── Main layout ── */}
      <div className="flex-1 flex min-h-0 relative z-10">

        {/* ── LEFT COLUMN — desktop only ── */}
        <aside className="hidden md:flex w-72 lg:w-80 shrink-0 bg-brand-bg-alt border-r border-brand-border flex-col overflow-y-auto">
          {sidebarContent}
        </aside>

        {/* ── CONTENT AREA ── */}
        <main className="flex-1 flex flex-col min-h-0 min-w-0 relative">

          {/* Map — always visible as background when beta panel is open */}
          <div className="flex-1 min-h-0 relative">
            <GoodThingsMap entries={entries} focusEntry={focusEntry} />
            {/* Program banner */}
            <div className="absolute top-0 left-0 right-0 z-[2]">
              <div className="bg-white/95 backdrop-blur-sm border-b border-brand-border px-5 py-3.5 flex items-center justify-between animate-map-pulse">
                <div className="flex items-center gap-3">
                  <FlowerOfLifeIcon size={26} color="#7a2018" />
                  <div>
                    <p className="font-serif text-lg font-bold text-brand-text leading-tight">{t('splash.three_good_things')}</p>
                    <p className="text-[11px] text-brand-muted font-mono uppercase tracking-wider">{t('splash.program_label')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-xs text-brand-muted font-mono">{entries.length} {t('splash.shared_by_neighbors')}</p>
                  <div className="relative">
                    <button
                      onClick={function () { setShowInfo(!showInfo) }}
                      className="text-brand-muted hover:text-brand-accent transition-colors pointer-events-auto"
                      aria-label="Info"
                    >
                      <Info size={18} />
                    </button>
                    {showInfo && (
                      <>
                        <div className="fixed inset-0 z-[5]" onClick={function () { setShowInfo(false) }} />
                        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl border border-brand-border shadow-lg p-4 z-[6] pointer-events-auto">
                          <p className="text-sm text-brand-text leading-relaxed">{t('splash.info_text')}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Ticker — bottom of content area ── */}
          {tickerItems.length > 0 && (
            <div className="shrink-0 bg-brand-bg-alt overflow-hidden border-t border-brand-border relative z-[4]">
              <div className="splash-ticker flex items-center gap-12 py-3 whitespace-nowrap">
                {tickerItems.concat(tickerItems).map(function (item, i) {
                  return (
                    <button
                      key={i}
                      onClick={function () { handleTickerClick(item.entry) }}
                      className="inline-flex items-center gap-2 text-base font-bold text-brand-text flex-shrink-0 hover:text-brand-accent transition-colors cursor-pointer"
                    >
                      <FlowerOfLifeIcon size={14} color={item.color} className="flex-shrink-0" />
                      <span>{item.text}</span>
                      <span className="text-brand-muted font-normal text-sm">{item.loc}</span>
                    </button>
                  )
                })}
              </div>
              <style dangerouslySetInnerHTML={{ __html:
                '.splash-ticker { animation: splash-ticker-scroll 60s linear infinite; width: max-content; }' +
                '@keyframes splash-ticker-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }' +
                '.splash-ticker:hover { animation-duration: 180s; }'
              }} />
            </div>
          )}

          {/* ── "Share the Good" tab on right edge — gentle bounce on load ── */}
          {!shareOpen && (
            <button
              onClick={function () { setShareOpen(true) }}
              className="absolute top-1/2 right-0 -translate-y-1/2 z-20 bg-brand-accent text-white font-semibold text-sm px-2 py-6 rounded-l-xl shadow-lg hover:bg-brand-accent-hover transition-colors animate-tab-nudge"
              style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
            >
              {t('splash.share_the_good')}
            </button>
          )}

          {/* ── Share drawer backdrop ── */}
          {shareOpen && (
            <div className="absolute inset-0 bg-black/20 z-[19]" onClick={function () { setShareOpen(false) }} />
          )}

          {/* ── Slide-out share drawer ── */}
          <div className={'absolute top-0 right-0 h-full z-20 transition-transform duration-300 ease-in-out ' + (shareOpen ? 'translate-x-0' : 'translate-x-full')}>
            <div className="h-full w-80 bg-brand-bg-alt border-l border-brand-border shadow-xl overflow-y-auto">
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="font-serif text-lg font-bold text-brand-text">{t('splash.share_the_good')}</p>
                  <button onClick={function () { setShareOpen(false) }} className="text-brand-muted hover:text-brand-text transition-colors">
                    <X size={18} />
                  </button>
                </div>

                {!submitted ? (
                  <form onSubmit={handleGoodThings} className="space-y-3">
                    <p className="text-xs text-brand-muted mb-1">{t('splash.share_prompt')}</p>
                    {[
                      { n: 1, color: '#7a2018', val: thing1, set: setThing1, ph: t('splash.placeholder_1') },
                      { n: 2, color: '#6a4e10', val: thing2, set: setThing2, ph: t('splash.placeholder_2') },
                      { n: 3, color: '#1a3460', val: thing3, set: setThing3, ph: t('splash.placeholder_3') },
                    ].map(function (f) {
                      return (
                        <div key={f.n} className="flex items-center gap-2">
                          <FlowerOfLifeIcon size={20} color={f.color} className="shrink-0" />
                          <input ref={f.n === 1 ? firstInputRef : undefined} type="text" value={f.val} onChange={function (e) { f.set(e.target.value) }}
                            placeholder={f.ph} maxLength={280}
                            className="flex-1 px-3 py-2 border border-brand-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand-accent transition-colors" />
                        </div>
                      )
                    })}
                    <div className="flex gap-2">
                      <input type="text" value={displayName} onChange={function (e) { setDisplayName(e.target.value) }}
                        placeholder={t('splash.name_optional')} maxLength={50}
                        className="flex-1 px-3 py-2 border border-brand-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand-accent transition-colors" />
                      <input type="text" value={zip} onChange={function (e) { setZip(e.target.value.replace(/\D/g, '').slice(0, 5)) }}
                        placeholder="ZIP" maxLength={5}
                        className="w-20 px-3 py-2 border border-brand-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand-accent transition-colors" />
                    </div>
                    {error && <p className="text-red-600 text-xs">{error}</p>}
                    <button type="submit" disabled={submitting}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-accent text-white rounded-lg text-sm font-bold hover:bg-brand-accent-hover transition-colors disabled:opacity-50">
                      <Send size={14} />
                      {submitting ? t('splash.sharing') : t('splash.share_button')}
                    </button>
                  </form>
                ) : (
                  <div className="text-center space-y-4">
                    <FlowerOfLifeIcon size={32} color="#7a2018" className="mx-auto" />
                    <p className="font-serif text-lg font-bold text-brand-text">{t('splash.on_the_map')}</p>
                    <p className="text-sm text-brand-muted">{t('splash.on_the_map_desc')}</p>

                    <div className="space-y-2 pt-2">
                      <button onClick={handleEmailCopy}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-brand-border rounded-lg text-sm font-semibold text-brand-text hover:border-brand-accent/40 transition-all">
                        <Mail size={14} />
                        {t('splash.email_copy')}
                      </button>
                      <button onClick={handleDownload}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-brand-border rounded-lg text-sm font-semibold text-brand-text hover:border-brand-accent/40 transition-all">
                        <Download size={14} />
                        {t('splash.download')}
                      </button>
                    </div>

                    <button onClick={function () { setSubmitted(false); setThing1(''); setThing2(''); setThing3(''); setDisplayName(''); setZip(''); setFocusEntry(null) }}
                      className="text-sm text-brand-accent font-semibold hover:underline mt-2">{t('splash.share_more')}</button>
                  </div>
                )}
              </div>
            </div>
          </div>

        </main>
      </div>

      {/* Animations */}
      <style jsx global>{`
        .leaflet-top.leaflet-right {
          top: 70px !important;
        }
        @keyframes map-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.9; }
        }
        .animate-map-pulse { animation: map-pulse 3s ease-in-out infinite; }

        @keyframes tab-nudge {
          0%, 100% { transform: translateY(-50%) translateX(0); }
          15% { transform: translateY(-50%) translateX(-6px); }
          30% { transform: translateY(-50%) translateX(0); }
          45% { transform: translateY(-50%) translateX(-4px); }
          60% { transform: translateY(-50%) translateX(0); }
        }
        .animate-tab-nudge { animation: tab-nudge 3s ease-in-out 1s 1; }

        @keyframes slide-in {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in { animation: slide-in 0.25s ease-out; }
      `}</style>
    </div>
  )
}
