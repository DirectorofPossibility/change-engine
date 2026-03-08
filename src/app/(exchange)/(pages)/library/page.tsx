import type { Metadata } from 'next'
import { getPublishedDocuments } from '@/lib/data/library'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { FOLWatermark } from '@/components/exchange/FOLWatermark'
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
      <Breadcrumb items={[{ label: 'Library' }]} />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden" style={{ background: '#F8F9FC' }}>
        {/* Dot pattern */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: [
            'radial-gradient(circle, rgba(44,44,44,0.03) 1px, transparent 1px)',
            'radial-gradient(circle at 15% 80%, rgba(49,130,206,0.05) 0%, transparent 40%)',
            'radial-gradient(circle at 85% 20%, rgba(199,91,42,0.04) 0%, transparent 40%)',
          ].join(', '),
          backgroundSize: '20px 20px, 100% 100%, 100% 100%',
        }} />

        {/* FOL watermark */}
        <div className="absolute -top-16 -right-16 opacity-[0.06]">
          <FOLWatermark variant="seed" size="lg" color="#3182ce" />
        </div>

        <div className="relative z-10 max-w-[1200px] mx-auto px-8 py-14">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10 items-center">
            {/* Left: text */}
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-brand-muted-light mb-3">Research Library</p>
              <h1 className="font-serif text-[clamp(2.2rem,4.5vw,3.2rem)] leading-[1.1] text-brand-text mb-4">
                Knowledge is{' '}
                <span className="font-hand text-[1.15em] font-bold text-[#3182ce]">power.</span>
              </h1>
              <p className="text-lg leading-relaxed text-brand-muted max-w-lg mb-6">
                Curated reports, policy briefs, and community research from Houston&apos;s leading organizations. Every document summarized for quick understanding.
              </p>
              <div className="flex items-center gap-3 font-mono text-[11px] text-brand-muted-light">
                <span className="font-bold text-brand-text">{documents.length}</span> documents
                <span className="text-brand-border">/</span>
                <span className="font-bold text-brand-text">7</span> pathways
                <span className="text-brand-border">/</span>
                AI-assisted exploration
              </div>
            </div>

            {/* Right: reading room collage */}
            <div className="relative h-[320px] hidden lg:block">
              {/* Background FOL */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.05]">
                <FOLWatermark variant="vesica" size="lg" color="#3182ce" />
              </div>

              {/* Main image — person reading */}
              <div
                className="absolute w-[260px] h-[180px] rounded-[10px] border-[3px] border-white overflow-hidden z-[2]"
                style={{ top: 10, left: 20, transform: 'rotate(-2deg)', boxShadow: '0 8px 28px rgba(0,0,0,0.12)' }}
              >
                <Image
                  src={BUCKET + '/person-reading.jpg'}
                  alt="Person reading at a library"
                  className="w-full h-full object-cover"
                 width={800} height={400} />
              </div>

              {/* Second image — books/bookshelf */}
              <div
                className="absolute w-[180px] h-[130px] rounded-[10px] border-[3px] border-white overflow-hidden z-[1]"
                style={{ top: 150, left: -5, transform: 'rotate(3deg)', boxShadow: '0 8px 28px rgba(0,0,0,0.12)' }}
              >
                <Image
                  src={BUCKET + '/reading.jpg'}
                  alt="Books and reading materials"
                  className="w-full h-full object-cover"
                 width={800} height={400} />
              </div>

              {/* Third image — person studying */}
              <div
                className="absolute w-[220px] h-[160px] rounded-[10px] border-[3px] border-white overflow-hidden z-[3]"
                style={{ top: 140, right: 0, transform: 'rotate(-1deg)', boxShadow: '0 8px 28px rgba(0,0,0,0.12)' }}
              >
                <Image
                  src={BUCKET + '/person-reading2.jpg'}
                  alt="Studying and research"
                  className="w-full h-full object-cover"
                 width={800} height={400} />
              </div>

              {/* Tape decorations */}
              <div className="absolute w-[50px] h-[18px] rounded-sm z-[6]" style={{ top: 8, left: 100, transform: 'rotate(-4deg)', background: 'rgba(49,130,206,0.15)' }} />
              <div className="absolute w-[50px] h-[18px] rounded-sm z-[6]" style={{ bottom: 120, right: 70, transform: 'rotate(5deg)', background: 'rgba(49,130,206,0.12)' }} />

              {/* Floating stat */}
              <div
                className="absolute z-[5] bg-white border-2 border-brand-text rounded-[10px] px-3 py-2 font-mono text-[10px]"
                style={{ bottom: 15, left: 10, boxShadow: '3px 3px 0 #D5D0C8' }}
              >
                <span className="block text-[24px] font-black text-[#3182ce] leading-none">{documents.length}</span>
                documents
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
      <div className="max-w-[1200px] mx-auto px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 min-w-0">
            <LibraryClient documents={documents} />
          </div>

          <div className="hidden lg:block lg:w-[280px] flex-shrink-0">
            <div className="sticky top-24">
              <IndexWayfinder
                currentPage="library"
                color="#3182ce"
                related={[
                  { label: 'Bookshelf', href: '/bookshelf', color: '#805ad5' },
                  { label: 'News', href: '/news', color: '#319795' },
                  { label: 'Ask Chance', href: '/chat', color: '#3182ce' },
                  { label: 'Explore Topics', href: '/explore', color: '#d69e2e' },
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
