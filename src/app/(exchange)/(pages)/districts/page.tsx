import type { Metadata } from 'next'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { MapPin } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Districts — Community Exchange',
  description: 'Every district. Every representative. Mapped. City council, county precinct, state house and senate, Congress — they all overlap where you live.',
}

export default function DistrictsPage() {
  return (
    <div>
      <Breadcrumb items={[{ label: 'Districts' }]} />

      {/* Hero */}
      <section className="max-w-[800px] mx-auto px-4 sm:px-8 pt-16 pb-12 text-center border-b-2 border-brand-border">
        <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-brand-muted-light mb-5">
          You live in more districts than you think.
        </p>
        <h1 className="font-serif text-[clamp(2.5rem,5vw,3.5rem)] leading-[1.1] text-brand-text mb-5">
          Every district. Every representative. Mapped.
        </h1>
        <p className="text-lg leading-relaxed text-brand-muted max-w-[560px] mx-auto mb-8">
          City council. County precinct. State house and senate. Congress. They all overlap where you live.
        </p>
        <p className="text-base leading-relaxed text-brand-muted max-w-[560px] mx-auto mb-10">
          Enter your address. See every political boundary that covers your block &mdash; and every person responsible for what happens inside it.
        </p>

        {/* Address input placeholder */}
        <div className="max-w-md mx-auto mb-8">
          <div className="flex items-center gap-2 border-2 border-brand-border rounded-lg px-4 py-3 bg-white">
            <MapPin size={18} className="text-brand-muted flex-shrink-0" />
            <input
              type="text"
              placeholder="Enter your address"
              disabled
              className="flex-1 text-sm text-brand-muted bg-transparent outline-none cursor-not-allowed"
            />
            <button
              disabled
              className="px-5 py-2 bg-brand-accent text-white text-sm font-semibold rounded-lg opacity-50 cursor-not-allowed"
            >
              Enter Your Address
            </button>
          </div>
        </div>

        {/* Coming Soon */}
        <div className="inline-flex items-center gap-2 bg-brand-bg border-2 border-brand-border rounded-lg px-5 py-3 text-sm text-brand-muted">
          <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
          Full district mapping launches with Geographic Phase 2.
        </div>
      </section>
    </div>
  )
}
