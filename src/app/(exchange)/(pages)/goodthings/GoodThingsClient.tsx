'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Send, Mail, Download, ChevronDown, Globe } from 'lucide-react'
import { FlowerOfLifeIcon } from '@/components/exchange/FlowerIcons'
import { FOLWatermark } from '@/components/exchange/FOLWatermark'
import dynamic from 'next/dynamic'
import { logSpiralAction } from '@/lib/spiral'
import { useTranslation } from '@/lib/use-translation'

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
  display_name: string | null
  created_at: string
}

const THING_COLORS = ['#7a2018', '#6a4e10', '#1b5e8a']

export function GoodThingsClient() {
  const { t } = useTranslation()
  const [thing1, setThing1] = useState('')
  const [thing2, setThing2] = useState('')
  const [thing3, setThing3] = useState('')
  const [displayName, setDisplayName] = useState('')
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
      setError(t('gt.error_all_three'))
      return
    }
    if (!/^\d{5}$/.test(zip)) {
      setError(t('gt.error_zip'))
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
          display_name: displayName.trim() || null,
          zip_code: zip, email: showEmail ? email : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || t('gt.error_generic')); setSubmitting(false); return }

      const newEntry = data.entry as GoodThingEntry
      logSpiralAction('share_good_thing')
      setLastEntry(newEntry)
      setEntries(function (prev) { return [newEntry, ...prev] })
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setError(t('gt.error_network'))
    } finally {
      setSubmitting(false)
    }
  }

  function resetForm() {
    setThing1(''); setThing2(''); setThing3('')
    setDisplayName(''); setZip(''); setEmail(''); setShowEmail(false)
    setSubmitted(false); setLastEntry(null)
    setTimeout(function () {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }

  function drawFOL(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string, lineWidth: number) {
    ctx.strokeStyle = color; ctx.lineWidth = lineWidth
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke()
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3
      ctx.beginPath(); ctx.arc(cx + r * Math.cos(a), cy + r * Math.sin(a), r, 0, Math.PI * 2); ctx.stroke()
    }
  }

  function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number): number {
    const words = text.split(' ')
    let line = ''; let curY = y
    words.forEach(function (word) {
      const test = line + (line ? ' ' : '') + word
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, x, curY); line = word; curY += lineH
      } else { line = test }
    })
    if (line) ctx.fillText(line, x, curY)
    return curY
  }

  const downloadPng = useCallback(function () {
    if (!lastEntry) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Instagram-optimized square format
    const s = 1080
    canvas.width = s; canvas.height = s

    // ── Background gradient — warm cream to soft peach ──
    const bgGrad = ctx.createLinearGradient(0, 0, s, s)
    bgGrad.addColorStop(0, '#f4f5f7')
    bgGrad.addColorStop(0.5, '#FDF6F0')
    bgGrad.addColorStop(1, '#F8F0E8')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, s, s)

    // ── Subtle paper texture ──
    ctx.globalAlpha = 0.015
    for (let x = 0; x < s; x += 4) {
      for (let y = 0; y < s; y += 4) {
        const v = Math.random() * 100
        ctx.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')'
        ctx.fillRect(x, y, 4, 4)
      }
    }
    ctx.globalAlpha = 1

    // ── Large FOL watermark — centered background ──
    ctx.globalAlpha = 0.035
    drawFOL(ctx, s / 2, s / 2, 320, '#C75B2A', 1.5)
    // Outer ring
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 + Math.PI / 6
      drawFOL(ctx, s / 2 + 320 * 0.577 * Math.cos(a), s / 2 + 320 * 0.577 * Math.sin(a), 320 * 0.577, '#C75B2A', 1)
    }
    ctx.globalAlpha = 1

    // ── Spectrum bar — top ──
    const spectrum = ['#1a6b56', '#1e4d7a', '#4a2870', '#7a2018', '#1a5030', '#6a4e10', '#1b5e8a']
    const barW = s / spectrum.length
    spectrum.forEach(function (c, i) { ctx.fillStyle = c; ctx.fillRect(i * barW, 0, barW + 1, 8) })

    const pad = 80

    // ── Brand header ──
    ctx.fillStyle = '#C75B2A'; ctx.font = 'bold 13px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('CHANGE ENGINE', pad, 52)

    // Small FOL next to brand
    ctx.globalAlpha = 0.3
    drawFOL(ctx, pad - 20, 47, 8, '#C75B2A', 0.8)
    ctx.globalAlpha = 1

    // ── Title — large serif ──
    ctx.fillStyle = '#0d1117'; ctx.font = 'bold 52px serif'
    ctx.fillText('Three Good Things', pad, 120)

    // ── Accent underline ──
    const accentGrad = ctx.createLinearGradient(pad, 0, pad + 200, 0)
    accentGrad.addColorStop(0, '#C75B2A')
    accentGrad.addColorStop(1, '#C75B2A00')
    ctx.fillStyle = accentGrad
    ctx.fillRect(pad, 135, 200, 4)

    // ── Date + location ──
    const loc = [lastEntry.city, lastEntry.state].filter(Boolean).join(', ') || 'ZIP ' + lastEntry.zip_code
    const dateStr = new Date(lastEntry.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    ctx.font = '18px sans-serif'; ctx.fillStyle = '#9B9590'
    ctx.fillText(loc + '  \u00b7  ' + dateStr, pad, 172)

    // ── Display name ──
    if (lastEntry.display_name) {
      ctx.font = 'italic 18px sans-serif'; ctx.fillStyle = '#6B6560'
      ctx.fillText('Shared by ' + lastEntry.display_name, pad, 200)
    }

    // ── Three things — the main content ──
    const things = [lastEntry.thing_1, lastEntry.thing_2, lastEntry.thing_3]
    let y = lastEntry.display_name ? 260 : 240
    const contentW = s - pad * 2 - 80

    things.forEach(function (thing, i) {
      // Colored accent circle with number
      const circleX = pad + 24; const circleY = y + 4
      ctx.beginPath(); ctx.arc(circleX, circleY, 22, 0, Math.PI * 2)
      ctx.fillStyle = THING_COLORS[i]; ctx.fill()
      ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 18px serif'
      ctx.textAlign = 'center'
      ctx.fillText(String(i + 1), circleX, circleY + 6)
      ctx.textAlign = 'left'

      // Colored left bar
      ctx.fillStyle = THING_COLORS[i]
      ctx.globalAlpha = 0.15
      ctx.fillRect(pad + 56, y - 16, 3, 80)
      ctx.globalAlpha = 1

      // Text — larger, more readable
      ctx.font = '24px sans-serif'; ctx.fillStyle = '#2C2C2C'
      const endY = wrapText(ctx, thing, pad + 72, y + 10, contentW, 34)
      y = endY + 60
    })

    // ── Decorative corner FOLs ──
    ctx.globalAlpha = 0.06
    drawFOL(ctx, s - 60, 60, 30, '#1b5e8a', 1)
    drawFOL(ctx, 60, s - 60, 30, '#7a2018', 1)
    ctx.globalAlpha = 1

    // ── Bottom section — branded footer ──
    // Separator
    const sepGrad = ctx.createLinearGradient(pad, 0, s - pad, 0)
    sepGrad.addColorStop(0, '#E2DDD500')
    sepGrad.addColorStop(0.2, '#E2DDD5')
    sepGrad.addColorStop(0.8, '#E2DDD5')
    sepGrad.addColorStop(1, '#E2DDD500')
    ctx.fillStyle = sepGrad
    ctx.fillRect(pad, s - 120, s - pad * 2, 1)

    // "Made with thoughtfulness" + The Change Lab
    ctx.font = 'italic 16px sans-serif'; ctx.fillStyle = '#9B9590'
    ctx.textAlign = 'center'
    ctx.fillText('Made with thoughtfulness by The Change Lab', s / 2, s - 80)

    // URL
    ctx.font = 'bold 16px sans-serif'; ctx.fillStyle = '#C75B2A'
    ctx.fillText('changeengine.us/goodthings', s / 2, s - 52)
    ctx.textAlign = 'left'

    // ── Spectrum bar — bottom ──
    spectrum.forEach(function (c, i) { ctx.fillStyle = c; ctx.fillRect(i * barW, s - 8, barW + 1, 8) })

    const link = document.createElement('a')
    link.download = 'three-good-things-' + lastEntry.zip_code + '.png'
    link.href = canvas.toDataURL('image/png'); link.click()
  }, [lastEntry])

  const emailCopy = useCallback(function () {
    if (!lastEntry) return
    const subject = encodeURIComponent('My Three Good Things')
    const body = encodeURIComponent(
      'My Three Good Things\n\n' +
      '1. ' + lastEntry.thing_1 + '\n' +
      '2. ' + lastEntry.thing_2 + '\n' +
      '3. ' + lastEntry.thing_3 + '\n\n' +
      (lastEntry.display_name ? 'Shared by ' + lastEntry.display_name + '\n' : '') +
      ([lastEntry.city, lastEntry.state].filter(Boolean).join(', ') || 'ZIP ' + lastEntry.zip_code) + '\n' +
      new Date(lastEntry.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) + '\n\n' +
      'Shared on Change Engine — changeengine.us/goodthings'
    )
    window.open('mailto:?subject=' + subject + '&body=' + body, '_self')
  }, [lastEntry])

  const totalEntries = entries.length
  const uniqueZips = new Set(entries.map(function (e) { return e.zip_code })).size

  // Build ticker items from all entries
  const tickerItems = entries.slice(0, 50).flatMap(function (entry) {
    const loc = [entry.city, entry.state].filter(Boolean).join(', ') || entry.zip_code
    const who = entry.display_name || loc
    return [entry.thing_1, entry.thing_2, entry.thing_3].map(function (thing, i) {
      return { text: thing, color: THING_COLORS[i], loc: who }
    })
  })

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-brand-bg overflow-hidden">
        <div className="absolute right-[-80px] top-[-40px] opacity-[0.04]">
          <FOLWatermark variant="flower" size="lg" color="#C75B2A" />
        </div>
        <div className="h-1 bg-gradient-to-r from-[#1a6b56] via-[#7a2018] to-[#1b5e8a]" />
        <div className="relative z-10 max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <p className="text-base text-brand-muted mb-3 max-w-xl mx-auto">
            {t('gt.hero_sub')}
          </p>
          <h1 className="text-4xl sm:text-5xl font-display font-bold mb-4">{t('gt.hero_title')}</h1>
          <p className="text-lg text-brand-muted max-w-xl mx-auto leading-relaxed">
            {t('gt.hero_desc')}
          </p>
          {totalEntries > 0 && (
            <div className="flex items-center justify-center gap-8 mt-7 text-sm">
              <div>
                <span className="block text-2xl font-display font-bold text-white">{totalEntries}</span>
                <span className="text-white/40 text-xs">{t('gt.entries')}</span>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <span className="block text-2xl font-display font-bold text-white">{uniqueZips}</span>
                <span className="text-white/40 text-xs">{t('gt.communities')}</span>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <span className="block text-2xl font-display font-bold text-white">{totalEntries * 3}</span>
                <span className="text-white/40 text-xs">{t('gt.reasons_to_smile')}</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Map (at the top) ── */}
      <section>
        <div className="bg-white border-b border-brand-border overflow-hidden">
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
        {/* Intro */}
        <section className="mb-10">
          <div className="prose prose-sm max-w-none text-brand-muted leading-relaxed space-y-4">
            <p>{t('gt.intro_1')}</p>
            <p>{t('gt.intro_2')}</p>
            <p>{t('gt.intro_3')}</p>
          </div>
        </section>

        {!submitted ? (
          /* ── Form ── */
          <section ref={formRef} className="mb-12">
            <div className="bg-white border border-brand-border p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[#7a2018] via-[#6a4e10] to-[#1b5e8a]" />
              <div className="pl-4">
                <h2 className="font-display text-2xl font-bold text-brand-text mb-1">{t('gt.form_title')}</h2>
                <p className="text-sm text-brand-muted mb-6">
                  {t('gt.form_desc')}
                </p>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {[
                    { n: 1, color: '#7a2018', val: thing1, set: setThing1, label: t('gt.thing_1_label'), ph: t('gt.thing_1_ph') },
                    { n: 2, color: '#6a4e10', val: thing2, set: setThing2, label: t('gt.thing_2_label'), ph: t('gt.thing_2_ph') },
                    { n: 3, color: '#1b5e8a', val: thing3, set: setThing3, label: t('gt.thing_3_label'), ph: t('gt.thing_3_ph') },
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
                          className="w-full px-4 py-3 border border-brand-border text-sm bg-brand-bg focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                          style={{ '--tw-ring-color': f.color + '40' } as any}
                          maxLength={280}
                        />
                      </div>
                    )
                  })}

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-brand-text mb-2">
                      {t('gt.your_name')}
                    </label>
                    <input
                      type="text" value={displayName}
                      onChange={function (e) { setDisplayName(e.target.value) }}
                      placeholder={t('gt.name_ph')}
                      className="w-full max-w-sm px-4 py-3 border border-brand-border text-sm bg-brand-bg focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-all"
                      maxLength={50}
                    />
                    <p className="text-[11px] text-brand-muted mt-1">{t('gt.name_hint')}</p>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-brand-text mb-2">
                      <MapPin size={16} className="text-brand-accent" /> {t('gt.your_zip')}
                    </label>
                    <input
                      type="text" value={zip}
                      onChange={function (e) { setZip(e.target.value.replace(/\D/g, '').slice(0, 5)) }}
                      placeholder="77001"
                      className="w-full max-w-[200px] px-4 py-3 border border-brand-border text-sm bg-brand-bg focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-all"
                      maxLength={5}
                    />
                  </div>

                  <div>
                    <button type="button" onClick={function () { setShowEmail(!showEmail) }}
                      className="flex items-center gap-2 text-sm text-brand-muted hover:text-brand-text transition-colors">
                      <Mail size={14} />
                      <span>{showEmail ? t('gt.email_hide') : t('gt.email_show')}</span>
                    </button>
                    {showEmail && (
                      <input type="email" value={email}
                        onChange={function (e) { setEmail(e.target.value) }}
                        placeholder="your@email.com"
                        className="mt-2 w-full max-w-sm px-4 py-3 border border-brand-border text-sm bg-brand-bg focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-all" />
                    )}
                  </div>

                  {error && <p className="text-red-600 text-sm">{error}</p>}

                  <button type="submit" disabled={submitting}
                    className="flex items-center gap-2 px-8 py-3 bg-brand-accent text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50">
                    <Send size={16} />
                    {submitting ? t('gt.sharing') : t('gt.share_button')}
                  </button>
                </form>
              </div>
            </div>
          </section>
        ) : (
          /* ── Success ── */
          <section className="mb-12">
            <div className="bg-white border border-[#7a2018]/30 p-6 sm:p-8 text-center relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#7a2018]" />
              <FlowerOfLifeIcon size={32} color="#7a2018" className="mx-auto mb-3" />
              <h2 className="font-display text-2xl font-bold text-brand-text mb-2">{t('gt.success_title')}</h2>
              <p className="text-sm text-brand-muted mb-6 max-w-md mx-auto">
                {t('gt.success_desc')}
              </p>

              {lastEntry && (
                <div className="bg-brand-bg p-5 mb-6 max-w-md mx-auto text-left">
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
                  className="flex items-center gap-2 px-5 py-2.5 bg-brand-accent text-white text-sm font-semibold hover:bg-brand-accent-hover transition-colors">
                  <Download size={16} /> {t('gt.download_image')}
                </button>
                <button onClick={emailCopy}
                  className="flex items-center gap-2 px-5 py-2.5 border border-brand-border text-sm font-semibold text-brand-text hover:bg-brand-bg transition-all">
                  <Mail size={16} /> {t('gt.email_copy')}
                </button>
                <button onClick={resetForm}
                  className="flex items-center gap-2 px-5 py-2.5 border border-brand-border text-sm font-semibold text-brand-text hover:bg-brand-bg transition-all">
                  {t('gt.share_more')}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ── Recent entries ── */}
        {entries.length > 0 && (
          <section className="mb-12">
            <h2 className="font-display text-xl font-bold text-brand-text mb-4">{t('gt.recent_entries')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {entries.slice(0, 12).map(function (entry) {
                const timeAgo = getTimeAgo(entry.created_at, { just_now: t('gt.just_now'), minutes: t('gt.minutes_ago'), hours: t('gt.hours_ago'), days: t('gt.days_ago') })
                return (
                  <div key={entry.id}
                    className="bg-white border border-brand-border p-4 relative overflow-hidden group hover:border-brand-text transition-all"
                   >
                    <div className="absolute left-0 top-0 bottom-0 w-1 group-hover:w-1.5 bg-gradient-to-b from-[#7a2018] via-[#6a4e10] to-[#1b5e8a] transition-all" />
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
                        {entry.display_name && <span className="font-medium text-brand-text">{entry.display_name}</span>}
                        {entry.display_name && <span>&middot;</span>}
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
          <div className="bg-brand-bg border border-brand-border p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <FlowerOfLifeIcon size={36} className="flex-shrink-0 mt-1" />
              <div>
                <h2 className="font-display text-lg font-bold text-brand-text mb-2">{t('gt.why_title')}</h2>
                <p className="text-sm text-brand-muted leading-relaxed">
                  {t('gt.why_desc')}
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

function getTimeAgo(dateStr: string, labels: { just_now: string; minutes: string; hours: string; days: string }): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return labels.just_now
  if (minutes < 60) return minutes + labels.minutes
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return hours + labels.hours
  const days = Math.floor(hours / 24)
  if (days < 30) return days + labels.days
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
