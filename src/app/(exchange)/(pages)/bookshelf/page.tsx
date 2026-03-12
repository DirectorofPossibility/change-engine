import type { Metadata } from 'next'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { FOLWatermark } from '@/components/exchange/FOLWatermark'
import { getBookshelfItems } from '@/lib/data/library'
import { BookshelfClient } from './BookshelfClient'
import Image from 'next/image'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Bookshelf — Change Engine',
  description: 'Curated reading list for civic-minded Houstonians. Books on community, justice, environment, and building a better city.',
}

const BUCKET = 'https://xesojwzcnjqtpuossmuv.supabase.co/storage/v1/object/public/Images/editorial'

export default async function BookshelfPage() {
  const books = await getBookshelfItems()

  return (
    <div>
      <Breadcrumb items={[{ label: 'Library', href: '/library' }, { label: 'Bookshelf' }]} />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden" style={{ background: '#F8F9FC' }}>
        {/* Dot pattern */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: [
            'radial-gradient(circle, rgba(44,44,44,0.03) 1px, transparent 1px)',
            'radial-gradient(circle at 20% 70%, rgba(128,90,213,0.06) 0%, transparent 40%)',
            'radial-gradient(circle at 80% 30%, rgba(199,91,42,0.05) 0%, transparent 40%)',
          ].join(', '),
          backgroundSize: '20px 20px, 100% 100%, 100% 100%',
        }} />

        {/* FOL watermarks */}
        <div className="absolute -top-20 -right-20 opacity-[0.04]">
          <FOLWatermark variant="seed" size="lg" color="#1a3460" />
        </div>
        <div className="absolute bottom-10 -left-16 opacity-[0.03]">
          <FOLWatermark variant="vesica" size="md" color="#C75B2A" />
        </div>

        <div className="relative z-10 max-w-[1080px] mx-auto px-8 py-14">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 items-center">
            {/* Left: text */}
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-brand-muted-light mb-3">Community Bookshelf</p>
              <h1 className="font-display text-[clamp(2.2rem,4.5vw,3.2rem)] leading-[1.1] text-brand-text mb-4">
                Read. <span className="font-hand text-[1.15em] font-bold text-[#1a3460]">Reflect.</span> Act.
              </h1>
              <p className="text-lg leading-relaxed text-brand-muted max-w-lg mb-6">
                Books that shaped how we think about community, justice, and civic life. Each one chosen because it changes the conversation.
              </p>
              <div className="flex items-center gap-3 font-mono text-[11px] text-brand-muted-light">
                <span className="font-bold text-brand-text">{books.length}</span> books
                <span className="text-brand-border">/</span>
                <span className="font-bold text-brand-text">7</span> pathways
                <span className="text-brand-border">/</span>
                curated by community
              </div>
            </div>

            {/* Right: book stack collage */}
            <div className="relative h-[300px] hidden lg:block">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.05]">
                <FOLWatermark variant="vesica" size="lg" color="#1a3460" />
              </div>

              {/* Stacked book spines visual */}
              <div className="absolute top-6 left-8 w-[200px]" style={{ transform: 'rotate(-3deg)' }}>
                {[
                  { color: '#1a6b56', w: 200, h: 28 },
                  { color: '#1e4d7a', w: 190, h: 24 },
                  { color: '#4a2870', w: 210, h: 30 },
                  { color: '#7a2018', w: 195, h: 26 },
                  { color: '#6a4e10', w: 205, h: 28 },
                  { color: '#1a3460', w: 185, h: 24 },
                  { color: '#C75B2A', w: 200, h: 32 },
                ].map(function (book, i) {
                  return (
                    <div
                      key={i}
                      className="rounded-sm border border-white/30"
                      style={{
                        width: book.w,
                        height: book.h,
                        backgroundColor: book.color,
                        marginBottom: 2,
                        border: '1px solid #dde1e8',
                      }}
                    />
                  )
                })}
              </div>

              {/* Reading image */}
              <div
                className="absolute w-[220px] h-[160px] rounded-[10px] border-[3px] border-white overflow-hidden z-[2]"
                style={{ top: 80, right: 0, transform: 'rotate(2deg)', border: '1px solid #dde1e8' }}
              >
                <Image
                  src={BUCKET + '/reading.jpg'}
                  alt="Books and reading materials"
                  className="w-full h-full object-cover"
                 width={800} height={400} />
              </div>

              {/* Floating stat */}
              <div
                className="absolute z-[5] bg-white border-2 border-brand-text rounded-[10px] px-3 py-2 font-mono text-[10px]"
                style={{ bottom: 10, left: 10 }}
              >
                <span className="block text-[24px] font-black text-[#1a3460] leading-none">{books.length}</span>
                books
              </div>

              {/* Tape decorations */}
              <div className="absolute w-[50px] h-[18px] rounded-sm z-[6]" style={{ top: 4, left: 120, transform: 'rotate(-5deg)', background: 'rgba(128,90,213,0.15)' }} />
              <div className="absolute w-[40px] h-[16px] rounded-sm z-[6]" style={{ bottom: 80, right: 40, transform: 'rotate(3deg)', background: 'rgba(199,91,42,0.12)' }} />
            </div>
          </div>
        </div>

        {/* Spectrum bar */}
        <div className="spectrum-bar">
          <div style={{ background: '#1a6b56' }} />
          <div style={{ background: '#1e4d7a' }} />
          <div style={{ background: '#4a2870' }} />
          <div style={{ background: '#7a2018' }} />
          <div style={{ background: '#6a4e10' }} />
          <div style={{ background: '#1a5030' }} />
          <div style={{ background: '#1a3460' }} />
        </div>
      </section>

      {/* ── CONTENT ── */}
      <div className="max-w-[1080px] mx-auto px-8 py-10">
        <BookshelfClient books={books} />
      </div>
    </div>
  )
}
