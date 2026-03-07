'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Send, Sparkles, Mail, Download, ChevronDown, Globe } from 'lucide-react'
import { FlowerOfLifeIcon } from '@/components/exchange/FlowerIcons'
import { FOLWatermark } from '@/components/exchange/FOLWatermark'
import dynamic from 'next/dynamic'

const GoodThingsMap = dynamic(function () { return import('./GoodThingsMap').then(function (m) { return m.GoodThingsMap }) }, {
  ssr: false,
  loading: function () { return <div className="w-full h-[500px] bg-brand-bg animate-pulse" /> },
})

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
  created_at: string
}

const THING_COLORS = ['#38a169', '#3182ce', '#805ad5']

export function GoodThingsClient() {
  const [thing1, setThing1] = useState('')
  const [thing2, setThing2] = useState('')
  const [thing3, setThing3] = useState('')
  const [zip, setZip] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [lastEntry, setLastEntry] = useState<GoodThingEntry | null>(null)
  const [entries, setEntries] = useState<GoodThingEntry[]>([])
  const [error, setError] = useState('')
  const [showEmail, setShowEmail] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(function () {
    fetch('/api/good-things')
      .then(function (r) { return r.json() })
      .then(function (d) { if (d.entries) setEntries(d.entries) })
      .catch(function () {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!thing1.trim() || !thing2.trim() || !thing3.trim()) {
      setError('Please share all three good things.')
      return
    }
    if (!/^\d{5}$/.test(zip)) {
      setError('Please enter a valid 5-digit ZIP code.')
      return
    }
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/good-things', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thing_1: thing1, thing_2: thing2, thing_3: thing3,
          zip_code: zip, email: showEmail ? email : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong.'); setSubmitting(false); return }

      const newEntry = data.entry as GoodThingEntry
      setLastEntry(newEntry)
      setEntries(function (prev) { return [newEntry, ...prev] })
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function resetForm() {
    setThing1(''); setThing2(''); setThing3('')
    setZip(''); setEmail(''); setShowEmail(false)
    setSubmitted(false); setLastEntry(null)
    setTimeout(function () {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }

  const downloadPng = useCallback(function () {
    if (!lastEntry) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = 800; const h = 600
    canvas.width = w; canvas.height = h

    ctx.fillStyle = '#1A1A1A'
    ctx.fillRect(0, 0, w, h)

    // FOL watermark circles
    ctx.globalAlpha = 0.06; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5
    const cx = w - 120; const cy = 100; const r = 60
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3
      ctx.beginPath(); ctx.arc(cx + r * Math.cos(angle), cy + r * Math.sin(angle), r, 0, Math.PI * 2); ctx.stroke()
    }
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke()
    ctx.globalAlpha = 1

    const spectrum = ['#e53e3e', '#dd6b20', '#d69e2e', '#38a169', '#319795', '#3182ce', '#805ad5']
    const barW = w / spectrum.length
    spectrum.forEach(function (c, i) { ctx.fillStyle = c; ctx.fillRect(i * barW, 0, barW + 1, 4) })

    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 32px serif'
    ctx.fillText('Three Good Things', 48, 70)

    ctx.font = '16px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.5)'
    const loc = [lastEntry.city, lastEntry.state, lastEntry.zip_code].filter(Boolean).join(', ')
    ctx.fillText(loc || 'ZIP ' + lastEntry.zip_code, 48, 100)
    ctx.fillText(new Date(lastEntry.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), 48, 125)

    const things = [lastEntry.thing_1, lastEntry.thing_2, lastEntry.thing_3]
    let y = 180
    things.forEach(function (thing, i) {
      ctx.fillStyle = THING_COLORS[i]; ctx.beginPath(); ctx.arc(72, y + 2, 16, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center'
      ctx.fillText(String(i + 1), 72, y + 7); ctx.textAlign = 'left'
      ctx.font = '20px sans-serif'; ctx.fillStyle = '#ffffff'
      const maxW = w - 150; const words = thing.split(' ')
      let line = ''; let lineY = y
      words.forEach(function (word) {
        const test = line + (line ? ' ' : '') + word
        if (ctx.measureText(test).width > maxW && line) {
          ctx.fillText(line, 104, lineY + 7); line = word; lineY += 28
        } else { line = test }
      })
      if (line) ctx.fillText(line, 104, lineY + 7)
      y = lineY + 60
    })

    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '13px sans-serif'
    ctx.fillText('Community Exchange  |  changeengine.us/goodthings', 48, h - 30)
    spectrum.forEach(function (c, i) { ctx.fillStyle = c; ctx.fillRect(i * barW, h - 4, barW + 1, 4) })

    const link = document.createElement('a')
    link.download = 'three-good-things-' + lastEntry.zip_code + '.png'
    link.href = canvas.toDataURL('image/png'); link.click()
  }, [lastEntry])

  const totalEntries = entries.length
  const uniqueZips = new Set(entries.map(function (e) { return e.zip_code })).size

  // Build ticker items from all entries
  const tickerItems = entries.slice(0, 50).flatMap(function (entry) {
    const loc = [entry.city, entry.state].filter(Boolean).join(', ') || entry.zip_code
    return [entry.thing_1, entry.thing_2, entry.thing_3].map(function (thing, i) {
      return { text: thing, color: THING_COLORS[i], loc: loc }
    })
  })

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-brand-bg overflow-hidden">
        <div className="absolute right-[-80px] top-[-40px] opacity-[0.04]">
          <FOLWatermark variant="flower" size="lg" color="#C75B2A" />
        </div>
        <div className="h-1 bg-gradient-to-r from-[#e53e3e] via-[#38a169] to-[#805ad5]" />
        <div className="relative z-10 max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="inline-flex items-center gap-2 mb-5">
            <Sparkles size={18} className="text-[#d69e2e]" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-white/40">A Community Practice</span>
            <Sparkles size={18} className="text-[#d69e2e]" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold mb-4">Three Good Things</h1>
          <p className="text-lg text-white/60 max-w-xl mx-auto leading-relaxed">
            What&apos;s going well in your world? Share three good things and see positivity rippling across communities everywhere.
          </p>
          {totalEntries > 0 && (
            <div className="flex items-center justify-center gap-8 mt-7 text-sm">
              <div>
                <span className="block text-2xl font-serif font-bold text-white">{totalEntries}</span>
                <span className="text-white/40 text-xs">Entries</span>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <span className="block text-2xl font-serif font-bold text-white">{uniqueZips}</span>
                <span className="text-white/40 text-xs">Communities</span>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <span className="block text-2xl font-serif font-bold text-white">{totalEntries * 3}</span>
                <span className="text-white/40 text-xs">Reasons to Smile</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Map (at the top) ── */}
      <section>
        <div className="bg-white border-b-2 border-brand-border overflow-hidden">
          <GoodThingsMap entries={entries} focusEntry={lastEntry} />
        </div>
      </section>

      {/* ── Ticker ── */}
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

      <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {!submitted ? (
          /* ── Form ── */
          <section ref={formRef} className="mb-12">
            <div className="bg-white rounded-2xl border-2 border-brand-border p-6 sm:p-8 relative overflow-hidden" style={{ boxShadow: '4px 4px 0 #D1D5E0' }}>
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[#38a169] via-[#3182ce] to-[#805ad5]" />
              <div className="pl-4">
                <h2 className="font-serif text-2xl font-bold text-brand-text mb-1">Share Your Three Good Things</h2>
                <p className="text-sm text-brand-muted mb-6">
                  Take a moment to reflect. What are three good things happening in your life, your neighborhood, or your community right now?
                </p>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {[
                    { n: 1, color: '#38a169', val: thing1, set: setThing1, label: 'First good thing', ph: 'Something that made you smile today...' },
                    { n: 2, color: '#3182ce', val: thing2, set: setThing2, label: 'Second good thing', ph: 'A positive change you\'ve noticed...' },
                    { n: 3, color: '#805ad5', val: thing3, set: setThing3, label: 'Third good thing', ph: 'Something you\'re grateful for...' },
                  ].map(function (f) {
                    return (
                      <div key={f.n}>
                        <label className="flex items-center gap-2 text-sm font-semibold text-brand-text mb-2">
                          <span className="w-6 h-6 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{ backgroundColor: f.color }}>{f.n}</span>
                          {f.label}
                        </label>
                        <input
                          type="text" value={f.val}
                          onChange={function (e) { f.set(e.target.value) }}
                          placeholder={f.ph}
                          className="w-full px-4 py-3 border-2 border-brand-border rounded-xl text-sm bg-brand-bg focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                          style={{ '--tw-ring-color': f.color + '40' } as any}
                          maxLength={280}
                        />
                      </div>
                    )
                  })}

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-brand-text mb-2">
                      <MapPin size={16} className="text-brand-accent" /> Your ZIP Code
                    </label>
                    <input
                      type="text" value={zip}
                      onChange={function (e) { setZip(e.target.value.replace(/\D/g, '').slice(0, 5)) }}
                      placeholder="77001"
                      className="w-full max-w-[200px] px-4 py-3 border-2 border-brand-border rounded-xl text-sm bg-brand-bg focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-all"
                      maxLength={5}
                    />
                  </div>

                  <div>
                    <button type="button" onClick={function () { setShowEmail(!showEmail) }}
                      className="flex items-center gap-2 text-sm text-brand-muted hover:text-brand-text transition-colors">
                      <Mail size={14} />
                      <span>{showEmail ? 'Hide email field' : 'Want a copy? Add your email (optional)'}</span>
                    </button>
                    {showEmail && (
                      <input type="email" value={email}
                        onChange={function (e) { setEmail(e.target.value) }}
                        placeholder="your@email.com"
                        className="mt-2 w-full max-w-sm px-4 py-3 border-2 border-brand-border rounded-xl text-sm bg-brand-bg focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-all" />
                    )}
                  </div>

                  {error && <p className="text-red-600 text-sm">{error}</p>}

                  <button type="submit" disabled={submitting}
                    className="flex items-center gap-2 px-8 py-3 bg-brand-accent text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50">
                    <Send size={16} />
                    {submitting ? 'Sharing...' : 'Share Your Good Things'}
                  </button>
                </form>
              </div>
            </div>
          </section>
        ) : (
          /* ── Success ── */
          <section className="mb-12">
            <div className="bg-white rounded-2xl border-2 border-[#38a169]/30 p-6 sm:p-8 text-center relative overflow-hidden" style={{ boxShadow: '4px 4px 0 #D1D5E0' }}>
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#38a169]" />
              <Sparkles size={32} className="mx-auto mb-3 text-[#d69e2e]" />
              <h2 className="font-serif text-2xl font-bold text-brand-text mb-2">Your good things are on the map!</h2>
              <p className="text-sm text-brand-muted mb-6 max-w-md mx-auto">
                Thank you for sharing positivity with the community. Your entry is now part of the story.
              </p>

              {lastEntry && (
                <div className="bg-brand-bg rounded-xl p-5 mb-6 max-w-md mx-auto text-left">
                  {[lastEntry.thing_1, lastEntry.thing_2, lastEntry.thing_3].map(function (thing, i) {
                    return (
                      <div key={i} className="flex items-start gap-3 mb-3 last:mb-0">
                        <span className="w-6 h-6 rounded-full text-white text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: THING_COLORS[i] }}>{i + 1}</span>
                        <p className="text-sm text-brand-text">{thing}</p>
                      </div>
                    )
                  })}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-brand-border text-xs text-brand-muted">
                    <MapPin size={12} />
                    <span>{[lastEntry.city, lastEntry.state, lastEntry.zip_code].filter(Boolean).join(', ')}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center gap-3 flex-wrap">
                <button onClick={downloadPng}
                  className="flex items-center gap-2 px-5 py-2.5 bg-brand-accent text-white rounded-xl text-sm font-semibold hover:bg-brand-accent-hover transition-colors">
                  <Download size={16} /> Download as Image
                </button>
                <button onClick={resetForm}
                  className="flex items-center gap-2 px-5 py-2.5 border-2 border-brand-border rounded-xl text-sm font-semibold text-brand-text hover:bg-brand-bg transition-all">
                  Share More Good Things
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ── Recent entries ── */}
        {entries.length > 0 && (
          <section className="mb-12">
            <h2 className="font-serif text-xl font-bold text-brand-text mb-4">Recent Entries</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {entries.slice(0, 12).map(function (entry) {
                const timeAgo = getTimeAgo(entry.created_at)
                return (
                  <div key={entry.id}
                    className="bg-white rounded-xl border-2 border-brand-border p-4 relative overflow-hidden group hover:border-brand-text transition-all"
                    style={{ boxShadow: '2px 2px 0 #D1D5E0' }}>
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
                        <MapPin size={10} />
                        <span>{[entry.city, entry.state].filter(Boolean).join(', ') || 'ZIP ' + entry.zip_code}</span>
                        <span className="ml-auto">{timeAgo}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* About */}
        <section className="mb-12">
          <div className="bg-brand-bg rounded-2xl border-2 border-brand-border p-6 sm:p-8" style={{ boxShadow: '3px 3px 0 #D1D5E0' }}>
            <div className="flex items-start gap-4">
              <FlowerOfLifeIcon size={36} className="flex-shrink-0 mt-1" />
              <div>
                <h2 className="font-serif text-lg font-bold text-brand-text mb-2">Why Three Good Things?</h2>
                <p className="text-sm text-brand-muted leading-relaxed mb-3">
                  Research in positive psychology shows that regularly reflecting on good things — even small ones — increases well-being,
                  strengthens resilience, and builds a sense of community connection. When we share what&apos;s going well, we create a ripple
                  effect that inspires others.
                </p>
                <p className="text-sm text-brand-muted leading-relaxed">
                  This practice was inspired by Dr. Martin Seligman&apos;s research at the University of Pennsylvania. Studies show that
                  people who do this exercise regularly report feeling happier and less depressed — effects that can last for months.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <canvas ref={canvasRef} className="hidden" />
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
