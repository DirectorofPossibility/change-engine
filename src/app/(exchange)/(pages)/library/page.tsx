import type { Metadata } from 'next'
import { getPublishedDocuments } from '@/lib/data/library'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { GradientFOL } from '@/components/exchange/GradientFOL'
import { FOLDepthLayer, FOLStat } from '@/components/exchange/FOLElements'
import { IndexWayfinder } from '@/components/exchange/IndexWayfinder'
import { FeaturedPromo } from '@/components/exchange/FeaturedPromo'
import { LibraryClient } from './LibraryClient'
import Image from 'next/image'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Research Library — Community Exchange',
  description: 'Curated research, reports, and policy briefs from Houston organizations and community partners.',
}

const BUCKET = 'https://xesojwzcnjqtpuossmuv.supabase.co/storage/v1/object/public/Images/editorial'

export default async function LibraryPage() {
  const { documents } = await getPublishedDocuments(1, 100)

  return (
    <div>
      {/* ══════════════════════════════════════════════════════════════
          HERO — Full-width, editorial left / FOL wayfinder right
         ══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #F8F9FC 0%, #EDE8E0 50%, #F8F9FC 100%)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle, rgba(44,44,44,0.03) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }} />

        <FOLDepthLayer position="top-right" size={600} opacity={0.06} />
        <FOLDepthLayer position="bottom-left" size={400} opacity={0.04} />

        <div className="relative z-10 max-w-[1200px] mx-auto px-6 sm:px-8 py-12 lg:py-16">
          <div className="flex flex-col lg:flex-row lg:items-center lg:gap-16">
            {/* Left — editorial content */}
            <div className="flex-1 min-w-0 max-w-xl">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#3182ce] mb-3">Research Library</p>
              <h1 className="font-serif text-[clamp(2.2rem,4.5vw,3.2rem)] leading-[1.1] text-brand-text mb-4">
                Knowledge is{' '}
                <span className="relative inline-block">
                  <span className="text-[#3182ce]">power.</span>
                  <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 200 6" fill="none" preserveAspectRatio="none">
                    <path d="M0 5c50-4 150-4 200 0" stroke="#3182ce" strokeWidth="2" opacity="0.4" />
                  </svg>
                </span>
              </h1>
              <p className="text-lg leading-relaxed text-brand-muted max-w-lg mb-8">
                Curated reports, policy briefs, and community research from Houston&apos;s leading organizations. Every document summarized for quick understanding.
              </p>
              {/* Stats */}
              <div className="flex items-center gap-8">
                <FOLStat value={documents.length} label="documents" color="#3182ce" />
                <div className="w-px h-10 bg-brand-border" />
                <FOLStat value="7" label="pathways" color="#805ad5" />
                <div className="w-px h-10 bg-brand-border" />
                <FOLStat value="AI" label="assisted search" color="#38a169" />
              </div>
            </div>

            {/* Right — reading room collage + FOL */}
            <div className="hidden lg:block flex-1 min-w-0 max-w-[450px]">
              <div className="relative h-[340px]">
                {/* FOL wayfinder behind images */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] opacity-[0.08]">
                  <GradientFOL variant="full" spinDur={80} colorDur={12} />
                </div>

                {/* Main image */}
                <div
                  className="absolute w-[260px] h-[180px] rounded-xl border-[3px] border-white overflow-hidden z-[2]"
                  style={{ top: 10, left: 20, transform: 'rotate(-2deg)', boxShadow: '0 8px 28px rgba(0,0,0,0.12)' }}
                >
                  <Image src={BUCKET + '/person-reading.jpg'} alt="Person reading at a library" className="w-full h-full object-cover" width={800} height={400} />
                </div>

                {/* Second image */}
                <div
                  className="absolute w-[180px] h-[130px] rounded-xl border-[3px] border-white overflow-hidden z-[1]"
                  style={{ top: 150, left: -5, transform: 'rotate(3deg)', boxShadow: '0 8px 28px rgba(0,0,0,0.12)' }}
                >
                  <Image src={BUCKET + '/reading.jpg'} alt="Books and reading materials" className="w-full h-full object-cover" width={800} height={400} />
                </div>

                {/* Third image */}
                <div
                  className="absolute w-[220px] h-[160px] rounded-xl border-[3px] border-white overflow-hidden z-[3]"
                  style={{ top: 140, right: 0, transform: 'rotate(-1deg)', boxShadow: '0 8px 28px rgba(0,0,0,0.12)' }}
                >
                  <Image src={BUCKET + '/person-reading2.jpg'} alt="Studying and research" className="w-full h-full object-cover" width={800} height={400} />
                </div>

                {/* Floating stat badge */}
                <div
                  className="absolute z-[5] bg-white/90 border border-brand-border rounded-xl px-3 py-2 font-mono text-[10px]"
                  style={{ bottom: 15, left: 10, backdropFilter: 'blur(8px)' }}
                >
                  <span className="block text-2xl font-black text-[#3182ce] leading-none">{documents.length}</span>
                  documents
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Spectrum bar */}
        <div className="spectrum-bar">
          <div style={{ background: '#e53e3e' }} />
          <div style={{ background: '#dd6b20' }} />
          <div style={{ background: '#d69e2e' }} />
          <div style={{ background: '#38a169' }} />
          <div style={{ background: '#3182ce' }} />
          <div style={{ background: '#319795' }} />
          <div style={{ background: '#805ad5' }} />
        </div>
      </section>

      {/* ── CONTENT ── */}
      <div className="max-w-[1200px] mx-auto px-6 sm:px-8 py-6">
        <Breadcrumb items={[{ label: 'Library' }]} />

        <div className="flex flex-col lg:flex-row gap-8 mt-4">
          <div className="flex-1 min-w-0">
            <LibraryClient documents={documents} />
          </div>

          <div className="hidden lg:block lg:w-[280px] flex-shrink-0">
            <div className="sticky top-24">
              <IndexWayfinder
                currentPage="library"
                color="#3182ce"
                related={[
                  { label: 'News', href: '/news', color: '#319795' },
                  { label: 'Ask Chance', href: '/chat', color: '#3182ce' },
                  { label: 'Pathways', href: '/pathways', color: '#d69e2e' },
                ]}
              />
              <div className="mt-4"><FeaturedPromo variant="card" /></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
