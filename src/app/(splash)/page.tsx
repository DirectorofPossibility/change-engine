'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { MapPin, Send } from 'lucide-react'
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

function GradientFOL({ size, className = '' }: { size?: number; className?: string }) {
  const r = 18, cx = 100, cy = 100, outerR = r * 1.732
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" className={className} aria-hidden="true"
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
  const [lastEntry, setLastEntry] = useState<GoodThingEntry | null>(null)
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

  useEffect(function () {
    fetch('/api/good-things')
      .then(function (r) { return r.json() })
      .then(function (d) { if (d.entries) setEntries(d.entries) })
      .catch(function () {})
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
      setLastEntry(data.entry as GoodThingEntry)
      setEntries(function (prev) { return [data.entry, ...prev] })
      setSubmitted(true)
    } catch { setError('Network error.') } finally { setSubmitting(false) }
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
      return { text: thing, color: THING_COLORS[i], loc: who }
    })
  })

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-brand-bg relative">

      {/* ── Giant FOL background ── */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.04]" aria-hidden="true"
        style={{ width: '66vw', height: '66vw' }}>
        <GradientFOL className="w-full h-full" />
      </div>

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

      {/* ── Main layout ── */}
      <div className="flex-1 flex min-h-0 relative z-10">

        {/* ── LEFT COLUMN ── */}
        <aside className="w-64 lg:w-72 shrink-0 bg-brand-bg-alt border-r border-brand-border flex flex-col overflow-y-auto">

          {/* Logo + FOL */}
          <div className="px-5 pt-4 pb-3 text-center">
            <div className="flex justify-center mb-2">
              <GradientFOL size={120} />
            </div>
            <h1 className="font-serif text-2xl font-bold text-brand-text leading-tight">
              Change<br />Engine
            </h1>
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-accent mt-2">Coming Soon</p>
            <p className="text-sm text-brand-muted mt-1 font-serif">
              Connecting Houston Neighbors
            </p>
          </div>

          <div className="h-px bg-brand-border mx-4" />

          {/* Can you imagine — collapsible */}
          <details className="px-5 py-3 group">
            <summary className="flex items-center justify-between cursor-pointer list-none text-[10px] font-mono font-bold uppercase tracking-widest text-brand-accent">
              Can you imagine&hellip;
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                className="transition-transform group-open:rotate-180">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </summary>
            <p className="text-xs text-brand-muted leading-relaxed mt-2">
              Knowing who represents you — and how to reach them. Finding every resource in your ZIP code — in one place. Understanding the policies passed in your name. Neighbors sharing what they know — everyone gets stronger.
            </p>
          </details>

          <div className="h-px bg-brand-border mx-4" />

          {/* Buttons */}
          <div className="flex-1 px-4 py-3 space-y-2">
            <button
              onClick={function () { setPanel('goodthings') }}
              className={'w-full text-left px-4 py-3 rounded-xl text-sm font-semibold border-2 transition-all ' +
                (panel === 'goodthings'
                  ? 'border-brand-accent bg-brand-accent/5 text-brand-accent'
                  : 'border-brand-border bg-white text-brand-text hover:border-brand-accent/40')}
            >
              Three Good Things
            </button>

            <button
              onClick={function () { setPanel('beta') }}
              className={'w-full text-left px-4 py-3 rounded-xl text-sm font-semibold border-2 transition-all ' +
                (panel === 'beta'
                  ? 'border-brand-accent bg-brand-accent/5 text-brand-accent'
                  : 'border-brand-border bg-white text-brand-text hover:border-brand-accent/40')}
            >
              Sign Up to Be a Beta Tester
            </button>

            <Link
              href="/login"
              className="block w-full text-left px-4 py-3 rounded-xl text-sm font-semibold border-2 border-brand-border bg-white text-brand-text hover:border-brand-accent/40 transition-all"
            >
              Beta Tester Login
            </Link>

            <a
              href="https://thechangelab.substack.com"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-left px-4 py-3 rounded-xl text-sm font-semibold border-2 border-brand-border bg-white text-brand-text hover:border-brand-accent/40 transition-all"
            >
              Read Our Substack
            </a>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-brand-border">
            <p className="text-[10px] text-brand-muted-light font-mono">
              A project of The Change Lab
            </p>
          </div>
        </aside>

        {/* ── CONTENT AREA ── */}
        <main className="flex-1 flex flex-col min-h-0 min-w-0">

          {panel === 'goodthings' && (
            <>
              {/* Map */}
              <div className="flex-1 min-h-0 relative">
                <GoodThingsMap entries={entries} focusEntry={lastEntry} />

                {/* Form overlay */}
                <div className="absolute bottom-4 right-4 z-[20] w-80 lg:w-96">
                  {!submitted ? (
                    <div className="bg-white rounded-xl border-2 border-brand-border p-4 shadow-drop">
                      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-gradient-to-b from-[#38a169] via-[#3182ce] to-[#805ad5]" />
                      <p className="font-serif text-sm font-bold text-brand-text mb-3 pl-2">Share your three good things</p>
                      <form onSubmit={handleGoodThings} className="pl-2 space-y-2.5">
                        {[
                          { n: 1, color: '#38a169', val: thing1, set: setThing1, ph: 'Something that made you smile...' },
                          { n: 2, color: '#3182ce', val: thing2, set: setThing2, ph: 'A positive change you noticed...' },
                          { n: 3, color: '#805ad5', val: thing3, set: setThing3, ph: 'Something you\'re grateful for...' },
                        ].map(function (f) {
                          return (
                            <div key={f.n} className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full text-white flex items-center justify-center font-bold shrink-0" style={{ backgroundColor: f.color, fontSize: '10px' }}>{f.n}</span>
                              <input type="text" value={f.val} onChange={function (e) { f.set(e.target.value) }}
                                placeholder={f.ph} maxLength={280}
                                className="flex-1 px-3 py-2 border border-brand-border rounded-lg text-xs bg-brand-bg focus:outline-none focus:border-brand-accent transition-colors" />
                            </div>
                          )
                        })}
                        <div className="flex gap-2">
                          <input type="text" value={displayName} onChange={function (e) { setDisplayName(e.target.value) }}
                            placeholder="Name (optional)" maxLength={50}
                            className="flex-1 px-3 py-2 border border-brand-border rounded-lg text-xs bg-brand-bg focus:outline-none focus:border-brand-accent transition-colors" />
                          <input type="text" value={zip} onChange={function (e) { setZip(e.target.value.replace(/\D/g, '').slice(0, 5)) }}
                            placeholder="ZIP" maxLength={5}
                            className="w-20 px-3 py-2 border border-brand-border rounded-lg text-xs bg-brand-bg focus:outline-none focus:border-brand-accent transition-colors" />
                        </div>
                        {error && <p className="text-red-600 text-[11px]">{error}</p>}
                        <button type="submit" disabled={submitting}
                          className="w-full flex items-center justify-center gap-1.5 py-2 bg-brand-accent text-white rounded-lg text-xs font-bold hover:bg-brand-accent-hover transition-colors disabled:opacity-50">
                          <Send size={12} />
                          {submitting ? 'Sharing...' : 'Share'}
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border-2 border-[#38a169]/30 p-4 shadow-drop text-center">
                      <FlowerOfLifeIcon size={24} color="#38a169" className="mx-auto mb-2" />
                      <p className="font-serif text-sm font-bold text-brand-text mb-1">On the map!</p>
                      <p className="text-[11px] text-brand-muted mb-3">Your good things are live.</p>
                      <button onClick={function () { setSubmitted(false); setThing1(''); setThing2(''); setThing3(''); setDisplayName(''); setZip(''); setLastEntry(null) }}
                        className="text-xs text-brand-accent font-semibold hover:underline">Share more</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Ticker */}
              {tickerItems.length > 0 && (
                <div className="shrink-0 bg-brand-bg-alt overflow-hidden border-t border-brand-border">
                  <div className="ticker-track flex items-center gap-8 py-2 whitespace-nowrap">
                    {tickerItems.concat(tickerItems).map(function (item, i) {
                      return (
                        <span key={i} className="inline-flex items-center gap-2 text-xs text-brand-muted flex-shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                          <span>{item.text}</span>
                          <span className="text-brand-muted-light text-[10px]">{item.loc}</span>
                        </span>
                      )
                    })}
                  </div>
                  <style jsx>{`
                    .ticker-track { animation: ticker-scroll 60s linear infinite; width: max-content; }
                    @keyframes ticker-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
                    .ticker-track:hover { animation-play-state: paused; }
                  `}</style>
                </div>
              )}
            </>
          )}

          {panel === 'beta' && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="w-full max-w-md">
                {betaSent ? (
                  <div className="bg-white rounded-xl border-2 border-[#38a169]/30 p-8 text-center shadow-offset">
                    <FlowerOfLifeIcon size={32} color="#38a169" className="mx-auto mb-3" />
                    <p className="font-serif text-xl font-bold text-brand-text mb-2">Request sent!</p>
                    <p className="text-sm text-brand-muted">Complete the email that just opened.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border-2 border-brand-border p-8 shadow-offset-lg">
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

        </main>
      </div>
    </div>
  )
}
