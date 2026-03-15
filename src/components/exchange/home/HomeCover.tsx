import Image from 'next/image'
import { HeroSearchInput } from '../HeroSearchInput'

interface HomeCoverProps {
  stats: { resources: number; organizations: number; officials: number }
}

export function HomeCover({ stats }: HomeCoverProps) {
  return (
    <section
      className="relative flex flex-col items-center justify-center text-center px-6 bg-paper"
      style={{ minHeight: '90vh' }}
    >
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
        <Image
          src="/images/fol/flower-full.svg"
          alt=""
          width={640}
          height={640}
          className="opacity-[0.05] max-w-[80vw] h-auto"
        />
      </div>

      <div className="relative z-10 max-w-[640px] mx-auto">
        <p className="font-mono text-xs tracking-[0.18em] text-muted uppercase mb-12">
          The Community Exchange
        </p>

        <h1 className="font-display text-[clamp(42px,8vw,72px)] font-normal leading-none mb-5">
          Houston
        </h1>

        <p className="font-body text-[clamp(18px,2.5vw,24px)] italic text-blue mb-6">
          A culture guide to civic life
        </p>

        <p className="font-body text-[clamp(15px,1.8vw,18px)] leading-relaxed text-muted mb-4 max-w-[480px] mx-auto">
          Find services, know your officials, and get involved in your Houston community — all in one place.
        </p>

        <div className="w-10 h-px bg-blue mx-auto mb-8" />

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
          <a href="/help" className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider bg-blue text-white px-5 py-2.5 hover:opacity-90 transition-opacity">
            Explore Resources
          </a>
          <a href="/compass" className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider border-2 border-ink text-ink px-5 py-2.5 hover:bg-ink hover:text-white transition-colors">
            New Here? Start Here
          </a>
        </div>

        <div className="max-w-[360px] mx-auto mb-6">
          <HeroSearchInput />
        </div>

        <p className="font-mono text-xs text-muted tracking-wider">
          {stats.resources.toLocaleString()} resources &middot; {stats.organizations.toLocaleString()} orgs &middot; {stats.officials.toLocaleString()} officials
        </p>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-xs text-muted tracking-wider">
        <a href="#today" className="hover:text-blue transition-colors">&darr;</a>
      </div>
    </section>
  )
}
