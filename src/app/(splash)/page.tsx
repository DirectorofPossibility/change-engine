'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { MapPin, Send, Mail, ArrowRight } from 'lucide-react'
import { FlowerOfLifeIcon } from '@/components/exchange/FlowerIcons'

const GoodThingsMap = dynamic(
  function () { return import('../(exchange)/(pages)/goodthings/GoodThingsMap').then(function (m) { return m.GoodThingsMap }) },
  { ssr: false, loading: function () { return <div className="w-full h-full bg-brand-bg animate-pulse" /> } }
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

const WAYFINDER_CARDS = [
  {
    label: 'Find Services',
    desc: 'Every benefit, program, and resource in your ZIP code — one search away.',
    color: '#C75B2A',
    icon: '🔍',
  },
  {
    label: 'Know Your Reps',
    desc: 'See who represents you at every level of government — and how to reach them.',
    color: '#3182ce',
    icon: '🏛',
  },
  {
    label: 'Track Policy',
    desc: 'Understand the policies being passed in your name — written so anyone can follow.',
    color: '#805ad5',
    icon: '📋',
  },
  {
    label: 'Connect Locally',
    desc: 'A neighborhood network where neighbors share what they know — and everyone gets stronger.',
    color: '#38a169',
    icon: '🤝',
  },
]

export default function SplashPage() {
  const [entries, setEntries] = useState<GoodThingEntry[]>([])
  const [lastEntry, setLastEntry] = useState<GoodThingEntry | null>(null)

  // Form state
  const [thing1, setThing1] = useState('')
  const [thing2, setThing2] = useState('')
  const [thing3, setThing3] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [zip, setZip] = useState('')
  const [email, setEmail] = useState('')
  const [showEmail, setShowEmail] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const formRef = useRef<HTMLDivElement>(null)

  // Beta form state
  const [betaEmail, setBetaEmail] = useState('')
  const [betaName, setBetaName] = useState('')
  const [betaSent, setBetaSent] = useState(false)

  useEffect(function () {
    fetch('/api/good-things')
      .then(function (r) { return r.json() })
      .then(function (d) { if (d.entries) setEntries(d.entries) })
      .catch(function () {})
  }, [])

  async function handleGoodThings(e: React.FormEvent) {
    e.preventDefault()
    if (!thing1.trim() || !thing2.trim() || !thing3.trim()) { setError('Please share all three good things.'); return }
    if (!/^\d{5}$/.test(zip)) { setError('Please enter a valid 5-digit ZIP code.'); return }
    setError(''); setSubmitting(true)
    try {
      const res = await fetch('/api/good-things', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thing_1: thing1, thing_2: thing2, thing_3: thing3, display_name: displayName.trim() || null, zip_code: zip, email: showEmail ? email : null }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong.'); setSubmitting(false); return }
      const newEntry = data.entry as GoodThingEntry
      setLastEntry(newEntry)
      setEntries(function (prev) { return [newEntry, ...prev] })
      setSubmitted(true)
    } catch { setError('Network error. Please try again.') } finally { setSubmitting(false) }
  }

  function resetForm() {
    setThing1(''); setThing2(''); setThing3(''); setDisplayName(''); setZip(''); setEmail(''); setShowEmail(false)
    setSubmitted(false); setLastEntry(null)
    setTimeout(function () { formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }, 100)
  }

  function handleBeta(e: React.FormEvent) {
    e.preventDefault()
    const body = encodeURIComponent(`Name: ${betaName}\nEmail: ${betaEmail}\n\nI'd like to be a beta tester for the Change Engine Community Exchange.`)
    window.location.href = `mailto:hello@thechangelab.net?subject=${encodeURIComponent('Beta Tester Request')}&body=${body}`
    setBetaSent(true)
  }

  // Ticker items
  const tickerItems = entries.slice(0, 50).flatMap(function (entry) {
    const loc = [entry.city, entry.state].filter(Boolean).join(', ') || entry.zip_code
    const who = entry.display_name || loc
    return [entry.thing_1, entry.thing_2, entry.thing_3].map(function (thing, i) {
      return { text: thing, color: THING_COLORS[i], loc: who }
    })
  })

  const totalEntries = entries.length
  const uniqueZips = new Set(entries.map(function (e) { return e.zip_code })).size

  return (
    <div className="min-h-screen bg-brand-bg relative">

      {/* ── FOL background pattern ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 -left-32 opacity-[0.035] animate-fol-spin" style={{ animationDuration: '120s' }}>
          <FlowerOfLifeIcon size={500} color="#C75B2A" />
        </div>
        <div className="absolute top-[10%] -right-20 opacity-[0.03] animate-fol-spin" style={{ animationDuration: '150s' }}>
          <FlowerOfLifeIcon size={380} color="#805ad5" />
        </div>
        <div className="absolute top-[55%] -left-16 opacity-[0.025] animate-fol-spin" style={{ animationDuration: '140s' }}>
          <FlowerOfLifeIcon size={300} color="#3182ce" />
        </div>
        <div className="absolute -bottom-40 right-[10%] opacity-[0.03] animate-fol-spin" style={{ animationDuration: '160s', animationDirection: 'reverse' }}>
          <FlowerOfLifeIcon size={400} color="#C75B2A" />
        </div>
      </div>

      {/* ── Top nav ── */}
      <header className="sticky top-0 z-50 bg-brand-bg/90 backdrop-blur-sm border-b border-brand-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FlowerOfLifeIcon size={28} color="#C75B2A" />
            <span className="font-serif text-brand-text text-lg font-bold">Change Engine</span>
          </div>
          <nav className="flex items-center gap-3 sm:gap-5">
            <a
              href="https://thechangelab.substack.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-brand-muted hover:text-brand-accent transition-colors"
            >
              Substack
            </a>
            <Link
              href="/login"
              className="px-5 py-2 bg-brand-accent text-white text-sm font-semibold rounded-lg hover:bg-brand-accent-hover transition-colors"
            >
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero — compact, not full-screen ── */}
      <section className="relative z-10 text-center px-6 pt-12 sm:pt-16 pb-10">
        <div className="relative inline-block mb-8">
          <div style={{ animation: 'fol-spin 90s linear infinite, fol-color-cycle 20s linear infinite' }}>
            <FlowerOfLifeIcon size={220} className="sm:hidden" />
            <FlowerOfLifeIcon size={300} className="hidden sm:block lg:hidden" />
            <FlowerOfLifeIcon size={360} className="hidden lg:block" />
          </div>
          <div className="absolute inset-0 rounded-full bg-brand-accent/[0.05] blur-3xl scale-150" />
        </div>

        <h1 className="text-display sm:text-[4.5rem] lg:text-[5.5rem] font-serif text-brand-text leading-[0.95] tracking-tight">
          Change Engine
        </h1>
        <p className="mt-4 text-xl sm:text-2xl font-serif text-brand-muted">
          Connecting Houston neighbors.
        </p>
        <div className="mt-6 inline-block px-8 py-2.5 rounded-full border-2 border-brand-accent text-brand-accent font-mono text-xs font-bold uppercase tracking-[0.25em]">
          Coming Soon
        </div>
        <p className="mt-6 text-sm text-brand-muted max-w-md mx-auto leading-relaxed">
          A civic platform where you can find services, know your representatives, track policies, and connect with your neighborhood — all in one place.
        </p>
      </section>

      {/* ── Spectrum divider ── */}
      <div className="spectrum-bar relative z-10">
        <div style={{ background: '#e53e3e' }} />
        <div style={{ background: '#dd6b20' }} />
        <div style={{ background: '#d69e2e' }} />
        <div style={{ background: '#38a169' }} />
        <div style={{ background: '#3182ce' }} />
        <div style={{ background: '#319795' }} />
        <div style={{ background: '#805ad5' }} />
      </div>

      {/* ── LIVE MAP — the centerpiece ── */}
      <section className="relative z-10">
        <div className="bg-brand-dark text-white px-4 sm:px-6 py-4">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FlowerOfLifeIcon size={16} color="#C75B2A" />
                <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-white/60">Live from the Community</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold">Three Good Things</h2>
              <p className="text-white/50 text-sm mt-1">Real stories from Houston neighbors — updated daily.</p>
            </div>
            {totalEntries > 0 && (
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <span className="block text-xl font-serif font-bold">{totalEntries}</span>
                  <span className="text-white/40 text-[10px] uppercase tracking-wider">Entries</span>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <span className="block text-xl font-serif font-bold">{uniqueZips}</span>
                  <span className="text-white/40 text-[10px] uppercase tracking-wider">Communities</span>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <span className="block text-xl font-serif font-bold">{totalEntries * 3}</span>
                  <span className="text-white/40 text-[10px] uppercase tracking-wider">Reasons to Smile</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="h-[400px] sm:h-[500px] lg:h-[560px] bg-white border-b-2 border-brand-border">
          <GoodThingsMap entries={entries} focusEntry={lastEntry} />
        </div>

        {/* Ticker */}
        {tickerItems.length > 0 && (
          <div className="bg-brand-bg-alt overflow-hidden border-b border-brand-border">
            <div className="ticker-track flex items-center gap-8 py-3 whitespace-nowrap">
              {tickerItems.concat(tickerItems).map(function (item, i) {
                return (
                  <span key={i} className="inline-flex items-center gap-2 text-sm text-brand-muted flex-shrink-0">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span>{item.text}</span>
                    <span className="text-brand-muted-light text-[10px]">{item.loc}</span>
                  </span>
                )
              })}
            </div>
            <style jsx>{`
              .ticker-track {
                animation: ticker-scroll 60s linear infinite;
                width: max-content;
              }
              @keyframes ticker-scroll {
                from { transform: translateX(0); }
                to { transform: translateX(-50%); }
              }
              .ticker-track:hover {
                animation-play-state: paused;
              }
            `}</style>
          </div>
        )}
      </section>

      {/* ── SHARE YOUR GOOD THINGS ── */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        {!submitted ? (
          <div ref={formRef} className="grid lg:grid-cols-5 gap-10 lg:gap-14 items-start">
            {/* Copy */}
            <div className="lg:col-span-2">
              <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-brand-accent mb-3">Join the practice</p>
              <h2 className="font-serif text-headline text-brand-text mb-3">Share your three good things.</h2>
              <p className="text-brand-muted leading-relaxed">
                What&apos;s going right in your life, your neighborhood, or your city? Take a moment — your answer becomes part of the story.
              </p>
            </div>

            {/* Form */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl border-2 border-brand-border p-6 sm:p-8 relative overflow-hidden shadow-offset-lg">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[#38a169] via-[#3182ce] to-[#805ad5]" />
                <form onSubmit={handleGoodThings} className="pl-4 space-y-5">
                  {[
                    { n: 1, color: '#38a169', val: thing1, set: setThing1, ph: 'Something that made you smile today...' },
                    { n: 2, color: '#3182ce', val: thing2, set: setThing2, ph: 'A positive change you\'ve noticed...' },
                    { n: 3, color: '#805ad5', val: thing3, set: setThing3, ph: 'Something you\'re grateful for...' },
                  ].map(function (f) {
                    return (
                      <div key={f.n}>
                        <label className="flex items-center gap-2 text-sm font-semibold text-brand-text mb-1.5">
                          <span className="w-6 h-6 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{ backgroundColor: f.color }}>{f.n}</span>
                          Good thing #{f.n}
                        </label>
                        <input type="text" value={f.val} onChange={function (e) { f.set(e.target.value) }}
                          placeholder={f.ph} maxLength={280}
                          className="w-full px-4 py-3 border-2 border-brand-border rounded-xl text-sm bg-brand-bg focus:outline-none focus:border-brand-accent transition-colors" />
                      </div>
                    )
                  })}

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-brand-text mb-1.5 block">Name <span className="text-brand-muted font-normal">(optional)</span></label>
                      <input type="text" value={displayName} onChange={function (e) { setDisplayName(e.target.value) }}
                        placeholder="First name, Last initial" maxLength={50}
                        className="w-full px-4 py-3 border-2 border-brand-border rounded-xl text-sm bg-brand-bg focus:outline-none focus:border-brand-accent transition-colors" />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-semibold text-brand-text mb-1.5">
                        <MapPin size={14} className="text-brand-accent" /> ZIP Code
                      </label>
                      <input type="text" value={zip} onChange={function (e) { setZip(e.target.value.replace(/\D/g, '').slice(0, 5)) }}
                        placeholder="77001" maxLength={5}
                        className="w-full px-4 py-3 border-2 border-brand-border rounded-xl text-sm bg-brand-bg focus:outline-none focus:border-brand-accent transition-colors" />
                    </div>
                  </div>

                  <button type="button" onClick={function () { setShowEmail(!showEmail) }}
                    className="flex items-center gap-2 text-sm text-brand-muted hover:text-brand-text transition-colors">
                    <Mail size={14} />
                    <span>{showEmail ? 'Hide email field' : 'Want a copy? Add your email (optional)'}</span>
                  </button>
                  {showEmail && (
                    <input type="email" value={email} onChange={function (e) { setEmail(e.target.value) }}
                      placeholder="your@email.com"
                      className="w-full max-w-sm px-4 py-3 border-2 border-brand-border rounded-xl text-sm bg-brand-bg focus:outline-none focus:border-brand-accent transition-colors" />
                  )}

                  {error && <p className="text-red-600 text-sm">{error}</p>}

                  <button type="submit" disabled={submitting}
                    className="flex items-center gap-2 px-8 py-3 bg-brand-accent text-white rounded-xl text-sm font-bold hover:bg-brand-accent-hover transition-colors disabled:opacity-50">
                    <Send size={16} />
                    {submitting ? 'Sharing...' : 'Share Your Good Things'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : (
          /* Success */
          <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-2xl border-2 border-[#38a169]/30 p-6 sm:p-8 text-center shadow-offset-lg relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#38a169]" />
              <FlowerOfLifeIcon size={32} color="#38a169" className="mx-auto mb-3" />
              <h2 className="font-serif text-2xl font-bold text-brand-text mb-2">Your good things are on the map!</h2>
              <p className="text-sm text-brand-muted mb-6">Thank you for sharing positivity with the community.</p>
              {lastEntry && (
                <div className="bg-brand-bg rounded-xl p-5 mb-6 text-left">
                  {[lastEntry.thing_1, lastEntry.thing_2, lastEntry.thing_3].map(function (thing, i) {
                    return (
                      <div key={i} className="flex items-start gap-3 mb-3 last:mb-0">
                        <span className="w-6 h-6 rounded-full text-white text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: THING_COLORS[i] }}>{i + 1}</span>
                        <p className="text-sm text-brand-text">{thing}</p>
                      </div>
                    )
                  })}
                </div>
              )}
              <button onClick={resetForm}
                className="px-6 py-2.5 border-2 border-brand-border rounded-xl text-sm font-semibold text-brand-text hover:bg-brand-bg transition-all">
                Share More Good Things
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── RECENT ENTRIES ── */}
      {entries.length > 0 && (
        <section className="relative z-10 bg-brand-bg-alt px-4 sm:px-6 py-14 sm:py-20">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-serif text-xl font-bold text-brand-text mb-6">Recent Good Things</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {entries.slice(0, 9).map(function (entry) {
                const loc = [entry.city, entry.state].filter(Boolean).join(', ') || 'ZIP ' + entry.zip_code
                return (
                  <div key={entry.id}
                    className="bg-white rounded-xl border-2 border-brand-border p-4 relative overflow-hidden group hover:border-brand-text transition-all"
                    style={{ boxShadow: '2px 2px 0 #D5D0C8' }}>
                    <div className="absolute left-0 top-0 bottom-0 w-1 group-hover:w-1.5 bg-gradient-to-b from-[#38a169] via-[#3182ce] to-[#805ad5] transition-all" />
                    <div className="pl-3">
                      {[entry.thing_1, entry.thing_2, entry.thing_3].map(function (thing, i) {
                        return (
                          <div key={i} className="flex items-start gap-2 mb-2 last:mb-0">
                            <span className="w-4 h-4 rounded-full text-white flex items-center justify-center flex-shrink-0 mt-0.5"
                              style={{ backgroundColor: THING_COLORS[i], fontSize: '9px', fontWeight: 700 }}>{i + 1}</span>
                            <p className="text-sm text-brand-text leading-snug">{thing}</p>
                          </div>
                        )
                      })}
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-brand-border/60 text-[11px] text-brand-muted">
                        {entry.display_name && <><span className="font-medium text-brand-text">{entry.display_name}</span><span>&middot;</span></>}
                        <MapPin size={10} /><span>{loc}</span>
                        <span className="ml-auto">{getTimeAgo(entry.created_at)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── WHAT WE'RE BUILDING — wayfinder cards ── */}
      <section className="relative z-10 px-4 sm:px-6 py-14 sm:py-20">
        <div className="max-w-5xl mx-auto">
          <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-brand-accent mb-3">What&apos;s coming</p>
          <h2 className="font-serif text-headline text-brand-text mb-3">A civic platform for Houston.</h2>
          <p className="text-brand-muted max-w-lg mb-10">
            Three Good Things is just the beginning. Here&apos;s what we&apos;re building inside the Change Engine Community Exchange.
          </p>

          <div className="grid sm:grid-cols-2 gap-5">
            {WAYFINDER_CARDS.map(function (card) {
              return (
                <div key={card.label}
                  className="bg-white rounded-xl border-2 border-brand-border p-6 relative overflow-hidden group hover:border-brand-text transition-all"
                  style={{ boxShadow: '3px 3px 0 #D5D0C8' }}>
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: card.color }} />
                  <div className="flex items-start gap-4">
                    <span className="text-2xl">{card.icon}</span>
                    <div>
                      <h3 className="font-serif text-lg font-bold text-brand-text mb-1">{card.label}</h3>
                      <p className="text-sm text-brand-muted leading-relaxed">{card.desc}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-brand-muted-light">
                    <span>Coming soon</span>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/exchange"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-accent text-white rounded-xl font-semibold text-sm hover:bg-brand-accent-hover transition-colors"
            >
              Preview the Community Exchange
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Spectrum divider ── */}
      <div className="spectrum-bar relative z-10">
        <div style={{ background: '#805ad5' }} />
        <div style={{ background: '#319795' }} />
        <div style={{ background: '#3182ce' }} />
        <div style={{ background: '#38a169' }} />
        <div style={{ background: '#d69e2e' }} />
        <div style={{ background: '#dd6b20' }} />
        <div style={{ background: '#e53e3e' }} />
      </div>

      {/* ── BETA SIGNUP + SIGN IN ── */}
      <section className="relative z-10 bg-brand-dark text-white px-4 sm:px-6 py-14 sm:py-20">
        <div className="max-w-4xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Beta signup */}
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-brand-accent mb-3">Get early access</p>
            <h2 className="font-serif text-3xl font-bold mb-3">Join the beta.</h2>
            <p className="text-white/60 leading-relaxed mb-6">
              We&apos;re building Change Engine with and for the Houston community. Sign up to get early access, give feedback, and help shape what this becomes.
            </p>
            {betaSent ? (
              <div className="bg-white/10 rounded-xl p-6 text-center border border-white/10">
                <p className="text-brand-accent font-semibold mb-1">Request sent!</p>
                <p className="text-sm text-white/50">Complete the email that just opened.</p>
              </div>
            ) : (
              <form onSubmit={handleBeta} className="space-y-4">
                <input type="text" required value={betaName} onChange={function (e) { setBetaName(e.target.value) }}
                  placeholder="Your name"
                  className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-accent transition-colors" />
                <input type="email" required value={betaEmail} onChange={function (e) { setBetaEmail(e.target.value) }}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-accent transition-colors" />
                <button type="submit"
                  className="w-full py-3 bg-brand-accent text-white rounded-xl font-semibold hover:bg-brand-accent-hover transition-colors">
                  Request Beta Access
                </button>
              </form>
            )}
          </div>

          {/* Already a tester? */}
          <div className="flex flex-col justify-center">
            <div className="bg-white/5 rounded-2xl border border-white/10 p-8 text-center">
              <FlowerOfLifeIcon size={48} color="#C75B2A" className="mx-auto mb-4" />
              <h3 className="font-serif text-xl font-bold mb-2">Already a beta tester?</h3>
              <p className="text-white/50 text-sm mb-6">Sign in to explore the full Community Exchange.</p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-8 py-3 bg-white text-brand-text rounded-xl font-semibold text-sm hover:bg-white/90 transition-colors"
              >
                Sign In
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 bg-brand-dark border-t border-white/5 py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <FlowerOfLifeIcon size={24} color="#C75B2A" />
            <span className="font-serif text-white/60 text-sm">Change Engine</span>
          </div>
          <nav className="flex items-center gap-5 text-sm">
            <a href="https://thechangelab.substack.com" target="_blank" rel="noopener noreferrer"
              className="text-white/40 hover:text-brand-accent transition-colors">Substack</a>
            <Link href="/exchange" className="text-white/40 hover:text-brand-accent transition-colors">Exchange</Link>
            <Link href="/login" className="text-white/40 hover:text-brand-accent transition-colors">Sign In</Link>
          </nav>
        </div>
        <p className="text-center text-white/20 text-xs font-mono mt-6">A project of The Change Lab &middot; Houston, Texas</p>
      </footer>
    </div>
  )
}

function getTimeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return minutes + 'm ago'
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return hours + 'h ago'
  const days = Math.floor(hours / 24)
  if (days < 30) return days + 'd ago'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
