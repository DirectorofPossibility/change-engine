'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Send, Mail, Download, X, Menu } from 'lucide-react'
import { FlowerOfLifeIcon } from '@/components/exchange/FlowerIcons'

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

const THING_COLORS = ['#38a169', '#3182ce', '#805ad5']

function GradientFOL({ className = '' }: { className?: string }) {
  const r = 18, cx = 100, cy = 100, outerR = r * 1.732
  return (
    <svg viewBox="49 49 102 102" fill="none" className={className} aria-hidden="true"
      style={{ animation: 'fol-spin 90s linear infinite' }}>
      <defs>
        <linearGradient id="fol-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C75B2A">
            <animate attributeName="stop-color" values="#C75B2A;#805ad5;#3182ce;#38a169;#d69e2e;#C75B2A" dur="12s" repeatCount="indefinite" />
          </stop>
          <stop offset="50%" stopColor="#805ad5">
            <animate attributeName="stop-color" values="#805ad5;#3182ce;#38a169;#d69e2e;#C75B2A;#805ad5" dur="12s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stopColor="#3182ce">
            <animate attributeName="stop-color" values="#3182ce;#38a169;#d69e2e;#C75B2A;#805ad5;#3182ce" dur="12s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r * 2.2} stroke="url(#fol-grad)" strokeWidth="1.2" opacity="0.3" />
      {[30, 90, 150, 210, 270, 330].map(function (deg, i) {
        const rad = (deg * Math.PI) / 180
        return <circle key={'o' + i} cx={cx + outerR * Math.cos(rad)} cy={cy + outerR * Math.sin(rad)} r={r} stroke="url(#fol-grad)" strokeWidth="1.5" opacity="0.5" />
      })}
      {[0, 60, 120, 180, 240, 300].map(function (deg, i) {
        const rad = (deg * Math.PI) / 180
        return <circle key={'i' + i} cx={cx + r * Math.cos(rad)} cy={cy + r * Math.sin(rad)} r={r} stroke="url(#fol-grad)" strokeWidth="2" opacity="0.85" />
      })}
      <circle cx={cx} cy={cy} r={r} stroke="url(#fol-grad)" strokeWidth="2.5" opacity="1" />
      <circle cx={cx} cy={cy} r="3" fill="url(#fol-grad)" opacity="0.6" />
    </svg>
  )
}

export default function SplashPage() {
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
  const [betaEmail, setBetaEmail] = useState('')
  const [betaName, setBetaName] = useState('')
  const [betaSent, setBetaSent] = useState(false)
  const [panel, setPanel] = useState<'goodthings' | 'beta'>('goodthings')
  const [showImagine, setShowImagine] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const lastSubmittedRef = useRef<GoodThingEntry | null>(null)

  useEffect(function () {
    fetch('/api/good-things')
      .then(function (r) { return r.json() })
      .then(function (d) { if (d.entries) setEntries(d.entries) })
      .catch(function () {})
  }, [])

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
    setPanel('goodthings')
    setFocusEntry(entry)
    setMobileMenuOpen(false)
  }, [])

  async function handleGoodThings(e: React.FormEvent) {
    e.preventDefault()
    if (!thing1.trim() || !thing2.trim() || !thing3.trim()) { setError('All three required.'); return }
    if (!/^\d{5}$/.test(zip)) { setError('Valid 5-digit ZIP required.'); return }
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
      setPanel('goodthings')
    } catch { setError('Network error.') } finally { setSubmitting(false) }
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

  function handleBeta(e: React.FormEvent) {
    e.preventDefault()
    const body = encodeURIComponent(`Name: ${betaName}\nEmail: ${betaEmail}\n\nI'd like to beta test Change Engine.`)
    window.location.href = `mailto:hello@thechangelab.net?subject=${encodeURIComponent('Beta Tester Request')}&body=${body}`
    setBetaSent(true)
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
      <div className="relative px-5 pt-5 pb-4">
        {/* FOL as background watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.08]">
          <GradientFOL className="w-[140%] max-w-none" />
        </div>
        {/* Foreground content */}
        <div className="relative z-10 flex items-start gap-3">
          <GradientFOL className="w-12 h-12 shrink-0 mt-0.5" />
          <div>
            <h1 className="font-serif text-xl font-bold text-brand-text leading-tight tracking-tight">Change<br />Engine</h1>
            <p className="text-brand-muted text-xs font-serif leading-snug mt-1">Connecting<br />Houston Neighbors</p>
          </div>
        </div>
        <div className="relative z-10 mt-3 flex items-center gap-2">
          <span className="h-px flex-1 bg-brand-accent/30" />
          <span className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-brand-accent">Coming Soon</span>
          <span className="h-px flex-1 bg-brand-accent/30" />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex-1 px-4 py-1 space-y-1.5">
        <button
          onClick={function () { setPanel('goodthings'); setMobileMenuOpen(false) }}
          className={'w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ' +
            (panel === 'goodthings'
              ? 'border-brand-accent bg-white text-brand-accent shadow-offset'
              : 'border-brand-border bg-white text-brand-text hover:border-brand-accent/40')}
        >
          Three Good Things
        </button>

        <button
          onClick={function () { setShowImagine(!showImagine) }}
          className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold border-2 border-brand-border bg-white text-brand-text hover:border-brand-accent/40 transition-all"
        >
          <span className="flex items-center justify-between">
            Can You Imagine&hellip;
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
              className={'transition-transform ' + (showImagine ? 'rotate-180' : '')}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
        </button>
        {showImagine && (
          <p className="text-xs text-brand-muted leading-relaxed px-4 pb-1">
            Knowing who represents you — and how to reach them. Finding every resource in your ZIP code — in one place. Understanding the policies passed in your name. Neighbors sharing what they know — everyone gets stronger.
          </p>
        )}

        <a
          href="https://thechangelab.substack.com"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold border-2 border-brand-border bg-white text-brand-text hover:border-brand-accent/40 transition-all"
        >
          Read Our Substack
        </a>

        <Link
          href="/login"
          className="block w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold border-2 border-brand-border bg-white text-brand-text hover:border-brand-accent/40 transition-all"
        >
          Beta Tester Login
        </Link>

        <button
          onClick={function () { setPanel('beta'); setMobileMenuOpen(false) }}
          className={'w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ' +
            (panel === 'beta'
              ? 'border-brand-accent bg-white text-brand-accent shadow-offset'
              : 'border-brand-border bg-white text-brand-text hover:border-brand-accent/40')}
        >
          Sign Up to Be a Beta Tester
        </button>
      </div>

      {/* Footer */}
      <div className="px-5 py-2 mt-auto">
        <p className="text-[10px] text-brand-muted-light font-mono text-center">
          A project of{' '}
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
        <div style={{ background: '#e53e3e' }} />
        <div style={{ background: '#dd6b20' }} />
        <div style={{ background: '#d69e2e' }} />
        <div style={{ background: '#38a169' }} />
        <div style={{ background: '#3182ce' }} />
        <div style={{ background: '#319795' }} />
        <div style={{ background: '#805ad5' }} />
      </div>

      {/* ── Mobile header ── */}
      <div className="md:hidden shrink-0 bg-brand-bg-alt border-b border-brand-border px-4 py-2.5 flex items-center justify-between relative z-30">
        <div className="flex items-center gap-2.5">
          <GradientFOL className="w-9 h-9" />
          <div>
            <span className="font-serif text-base font-bold text-brand-text leading-none block">Change Engine</span>
            <span className="text-[9px] font-mono text-brand-accent uppercase tracking-widest">Coming Soon</span>
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
              <span className="font-serif text-lg font-bold text-brand-text">Menu</span>
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
          <div className={'flex-1 min-h-0 relative ' + (panel !== 'goodthings' ? 'opacity-30' : '')}>
            <GoodThingsMap entries={entries} focusEntry={focusEntry} />
            {/* Program banner */}
            <div className="absolute top-0 left-0 right-0 z-[2] pointer-events-none">
              <div className="bg-white/95 backdrop-blur-sm border-b border-brand-border px-5 py-2.5 flex items-center justify-between animate-map-pulse">
                <div className="flex items-center gap-3">
                  <FlowerOfLifeIcon size={20} color="#38a169" />
                  <div>
                    <p className="font-serif text-base font-bold text-brand-text leading-tight">Three Good Things</p>
                    <p className="text-[10px] text-brand-muted font-mono uppercase tracking-wider">A Change Engine Program</p>
                  </div>
                </div>
                <p className="text-xs text-brand-muted font-mono">{entries.length} shared by neighbors</p>
              </div>
            </div>
          </div>

          {/* Beta overlay — floats over dimmed map */}
          {panel === 'beta' && (
            <div className="absolute inset-0 flex items-center justify-center p-8 z-[3]">
              <div className="w-full max-w-md">
                {betaSent ? (
                  <div className="bg-white rounded-xl border-2 border-[#38a169]/30 p-8 text-center shadow-xl">
                    <FlowerOfLifeIcon size={32} color="#38a169" className="mx-auto mb-3" />
                    <p className="font-serif text-xl font-bold text-brand-text mb-2">Request sent!</p>
                    <p className="text-sm text-brand-muted">Complete the email that just opened.</p>
                    <button onClick={function () { setPanel('goodthings') }}
                      className="mt-4 text-sm text-brand-accent font-semibold hover:underline">Back to map</button>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border-2 border-brand-border p-8 shadow-xl">
                    <div className="flex justify-end mb-2">
                      <button onClick={function () { setPanel('goodthings') }} className="text-brand-muted hover:text-brand-text transition-colors">
                        <X size={18} />
                      </button>
                    </div>
                    <FlowerOfLifeIcon size={32} color="#C75B2A" className="mx-auto mb-4" />
                    <h2 className="font-serif text-2xl font-bold text-brand-text text-center mb-2">Join the Beta</h2>
                    <p className="text-sm text-brand-muted text-center mb-6">Get early access to the full Change Engine Community Exchange.</p>
                    <form onSubmit={handleBeta} className="space-y-4">
                      <input type="text" required value={betaName} onChange={function (e) { setBetaName(e.target.value) }}
                        placeholder="Your name"
                        className="w-full px-4 py-3 border-2 border-brand-border rounded-xl text-sm bg-brand-bg focus:outline-none focus:border-brand-accent transition-colors" />
                      <input type="email" required value={betaEmail} onChange={function (e) { setBetaEmail(e.target.value) }}
                        placeholder="your@email.com"
                        className="w-full px-4 py-3 border-2 border-brand-border rounded-xl text-sm bg-brand-bg focus:outline-none focus:border-brand-accent transition-colors" />
                      <button type="submit"
                        className="w-full py-3 bg-brand-accent text-white rounded-xl font-semibold hover:bg-brand-accent-hover transition-colors">
                        Request Beta Access
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Ticker — bottom of content area ── */}
          {tickerItems.length > 0 && (
            <div className="shrink-0 bg-brand-bg-alt overflow-hidden border-t border-brand-border relative z-[4]">
              <div className="ticker-track flex items-center gap-12 py-3 whitespace-nowrap">
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
              <style jsx>{`
                .ticker-track { animation: ticker-scroll 60s linear infinite; width: max-content; }
                @keyframes ticker-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
                .ticker-track:hover { animation-duration: 180s; }
              `}</style>
            </div>
          )}

          {/* ── "Share the Good" tab on right edge — gentle bounce on load ── */}
          {!shareOpen && (
            <button
              onClick={function () { setShareOpen(true) }}
              className="absolute top-1/2 right-0 -translate-y-1/2 z-20 bg-brand-accent text-white font-semibold text-sm px-2 py-6 rounded-l-xl shadow-lg hover:bg-brand-accent-hover transition-colors animate-tab-nudge"
              style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
            >
              Share the Good
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
                  <p className="font-serif text-lg font-bold text-brand-text">Share the Good</p>
                  <button onClick={function () { setShareOpen(false) }} className="text-brand-muted hover:text-brand-text transition-colors">
                    <X size={18} />
                  </button>
                </div>

                {!submitted ? (
                  <form onSubmit={handleGoodThings} className="space-y-3">
                    <p className="text-xs text-brand-muted mb-1">What three good things happened today?</p>
                    {[
                      { n: 1, color: '#38a169', val: thing1, set: setThing1, ph: 'Made you smile...' },
                      { n: 2, color: '#3182ce', val: thing2, set: setThing2, ph: 'Positive change...' },
                      { n: 3, color: '#805ad5', val: thing3, set: setThing3, ph: 'Grateful for...' },
                    ].map(function (f) {
                      return (
                        <div key={f.n} className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full text-white flex items-center justify-center font-bold shrink-0 text-[11px]" style={{ backgroundColor: f.color }}>{f.n}</span>
                          <input type="text" value={f.val} onChange={function (e) { f.set(e.target.value) }}
                            placeholder={f.ph} maxLength={280}
                            className="flex-1 px-3 py-2 border border-brand-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand-accent transition-colors" />
                        </div>
                      )
                    })}
                    <div className="flex gap-2">
                      <input type="text" value={displayName} onChange={function (e) { setDisplayName(e.target.value) }}
                        placeholder="Name (optional)" maxLength={50}
                        className="flex-1 px-3 py-2 border border-brand-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand-accent transition-colors" />
                      <input type="text" value={zip} onChange={function (e) { setZip(e.target.value.replace(/\D/g, '').slice(0, 5)) }}
                        placeholder="ZIP" maxLength={5}
                        className="w-20 px-3 py-2 border border-brand-border rounded-lg text-sm bg-white focus:outline-none focus:border-brand-accent transition-colors" />
                    </div>
                    {error && <p className="text-red-600 text-xs">{error}</p>}
                    <button type="submit" disabled={submitting}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-accent text-white rounded-lg text-sm font-bold hover:bg-brand-accent-hover transition-colors disabled:opacity-50">
                      <Send size={14} />
                      {submitting ? 'Sharing...' : 'Share'}
                    </button>
                  </form>
                ) : (
                  <div className="text-center space-y-4">
                    <FlowerOfLifeIcon size={32} color="#38a169" className="mx-auto" />
                    <p className="font-serif text-lg font-bold text-brand-text">On the map!</p>
                    <p className="text-sm text-brand-muted">Your three good things are now part of the neighborhood.</p>

                    <div className="space-y-2 pt-2">
                      <button onClick={handleEmailCopy}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border-2 border-brand-border rounded-lg text-sm font-semibold text-brand-text hover:border-brand-accent/40 transition-all">
                        <Mail size={14} />
                        Email Yourself a Copy
                      </button>
                      <button onClick={handleDownload}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border-2 border-brand-border rounded-lg text-sm font-semibold text-brand-text hover:border-brand-accent/40 transition-all">
                        <Download size={14} />
                        Download
                      </button>
                    </div>

                    <button onClick={function () { setSubmitted(false); setThing1(''); setThing2(''); setThing3(''); setDisplayName(''); setZip(''); setFocusEntry(null) }}
                      className="text-sm text-brand-accent font-semibold hover:underline mt-2">Share more</button>
                  </div>
                )}
              </div>
            </div>
          </div>

        </main>
      </div>

      {/* Animations */}
      <style jsx global>{`
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
