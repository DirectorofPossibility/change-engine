import type { Metadata } from 'next'
import Link from 'next/link'
import {
  HomeIcon, Megaphone, Eye, Handshake, ArrowRight, Sparkles,
} from 'lucide-react'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Choose Your Journey — Change Engine',
  description: 'Four ways into civic life in Houston. Whether you are a neighbor, advocate, researcher, or partner — there is a path built for you.',
}

const JOURNEYS = [
  {
    id: 'neighbor',
    name: 'The Neighbor',
    headline: 'Know what\u2019s happening around you.',
    description: 'Find services, stay informed, and access the resources available in your community.',
    color: '#4a2870',
    accentBg: '#f5f0ff',
    icon: HomeIcon,
    stats: ['Services', 'News', 'Resources', 'Maps'],
  },
  {
    id: 'advocate',
    name: 'The Advocate',
    headline: 'Hold power accountable.',
    description: 'Track policies, know your officials, and push for change on the issues you care about.',
    color: '#7a2018',
    accentBg: '#fef2f2',
    icon: Megaphone,
    stats: ['Policies', 'Officials', 'Elections', 'Governance'],
  },
  {
    id: 'researcher',
    name: 'The Researcher',
    headline: 'Understand the systems.',
    description: 'Access research reports, policy briefs, civic data, and the full picture of how Houston works.',
    color: '#1e4d7a',
    accentBg: '#eff6ff',
    icon: Eye,
    stats: ['Library', 'Analysis', 'Data', 'AI Chat'],
  },
  {
    id: 'partner',
    name: 'The Partner',
    headline: 'Connect with the ecosystem.',
    description: 'See the full landscape of organizations, find collaboration opportunities, and plug into the network.',
    color: '#1a6b56',
    accentBg: '#f0fdf4',
    icon: Handshake,
    stats: ['Organizations', 'Events', 'Pathways', 'Dashboard'],
  },
]

export default function JourneyIndexPage() {
  return (
    <div className="min-h-screen" style={{ background: '#FAF9F6' }}>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(170deg, #F0EDE6 0%, #E8E4DB 100%)' }}>
        {/* FOL watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
          <svg viewBox="0 0 400 400" className="w-[500px] h-[500px]" style={{ opacity: 0.04 }}>
            {Array.from({ length: 7 }, (_, i) => {
              const angle = (i * 60 - 90) * Math.PI / 180
              const cx = 200 + (i === 6 ? 0 : 60 * Math.cos(angle))
              const cy = 200 + (i === 6 ? 0 : 60 * Math.sin(angle))
              return <circle key={i} cx={cx} cy={cy} r={60} stroke="#6B6560" strokeWidth="2" fill="none" />
            })}
          </svg>
        </div>

        <div className="relative z-10 max-w-[900px] mx-auto px-6 py-14 sm:py-20 text-center">
          <nav className="text-[11px] tracking-wide mb-8" style={{ color: '#9B9590' }}>
            <Link href="/" className="hover:underline" style={{ color: '#6B6560' }}>Home</Link>
            <span className="mx-2">/</span>
            <span style={{ color: '#3A3A35' }}>Your Journey</span>
          </nav>

          <h1 className="font-serif text-[clamp(2rem,5vw,3.5rem)] leading-[1.08] mb-4" style={{ color: '#2D2D2A' }}>
            How do you want to engage?
          </h1>
          <p className="text-[17px] leading-relaxed max-w-xl mx-auto" style={{ color: '#6B6560' }}>
            Everyone enters civic life differently. Choose the journey that matches how you show up — we&rsquo;ll organize everything around your style.
          </p>
        </div>
      </section>

      {/* ── JOURNEY CARDS ── */}
      <div className="max-w-[900px] mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {JOURNEYS.map(function (j) {
            const Icon = j.icon
            return (
              <Link
                key={j.id}
                href={'/journey/' + j.id}
                className="bg-white border overflow-hidden transition-all hover:shadow-xl hover:translate-y-[-3px] group"
                style={{ borderColor: '#E2DDD5' }}
              >
                {/* Themed header with geometry */}
                <div className="relative h-[100px] overflow-hidden" style={{ background: `linear-gradient(135deg, ${j.color}, ${j.color}cc)` }}>
                  <svg viewBox="0 0 200 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" fill="none">
                    <g opacity="0.1">
                      {Array.from({ length: 7 }, (_, i) => {
                        const angle = (i * 60 - 90) * Math.PI / 180
                        const cx = 150 + (i === 6 ? 0 : 30 * Math.cos(angle))
                        const cy = 50 + (i === 6 ? 0 : 30 * Math.sin(angle))
                        return <circle key={i} cx={cx} cy={cy} r={30} stroke="white" strokeWidth="0.8" />
                      })}
                    </g>
                  </svg>
                  <div className="absolute left-5 bottom-4 flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-white/20">
                      <Icon size={22} color="white" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.15em] block" style={{ color: 'rgba(255,255,255,0.6)' }}>Journey</span>
                      <span className="text-[17px] font-bold text-white">{j.name}</span>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <h2 className="font-serif text-xl mb-2 group-hover:underline" style={{ color: '#2D2D2A' }}>{j.headline}</h2>
                  <p className="text-[13px] leading-relaxed mb-4" style={{ color: '#6B6560' }}>{j.description}</p>

                  <div className="flex items-center gap-2 flex-wrap">
                    {j.stats.map(function (s) {
                      return (
                        <span key={s} className="text-[10px] font-mono px-2 py-1" style={{ background: j.accentBg, color: j.color }}>
                          {s}
                        </span>
                      )
                    })}
                  </div>

                  <div className="flex items-center gap-1 mt-4 text-[13px] font-semibold" style={{ color: j.color }}>
                    Start this journey <ArrowRight size={14} />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Compass CTA */}
        <div className="mt-10 text-center">
          <p className="text-[13px] mb-4" style={{ color: '#6B6560' }}>Not sure which fits? The Compass builds a personalized guide based on your topics and location.</p>
          <Link href="/compass" className="inline-flex items-center gap-2 px-6 py-3 text-[14px] font-semibold text-white" style={{ background: '#2563eb' }}>
            <Sparkles size={16} /> Use the Compass <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}
