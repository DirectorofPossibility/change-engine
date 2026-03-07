import Link from 'next/link'
import { FlowerOfLifeIcon } from './FlowerIcons'
import { TipsToggle } from './TipsToggle'

const DISCOVER = [
  { label: 'Civic Compass', href: '/compass' },
  { label: 'Pathways', href: '/pathways' },
  { label: 'Guide', href: '/news' },
  { label: 'Live Dashboard', href: '/dashboard-live' },
  { label: 'Three Good Things', href: '/goodthings' },
  { label: 'Polling Places', href: '/polling-places' },
]

const LEARN = [
  { label: 'Knowledge Graph', href: '/knowledge-graph' },
  { label: 'Library', href: '/library' },
  { label: 'Foundations', href: '/foundations' },
]

const ACT = [
  { label: 'Call Your Senators', href: '/call-your-senators' },
  { label: 'Volunteer', href: '/opportunities' },
  { label: 'Partner With Us', href: '/about' },
]

const ABOUT = [
  { label: 'About The Change Lab', href: '/about' },
  { label: 'Our Approach', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Accessibility', href: '/accessibility' },
  { label: 'Privacy Policy', href: '/privacy' },
]

export function D2Footer() {
  return (
    <>
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

      <footer className="bg-brand-bg-alt relative overflow-hidden border-t border-brand-border">
        {/* FOL watermark */}
        <img
          src="/images/fol/flower-full.svg"
          alt=""
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] pointer-events-none opacity-[0.04]"
        />

        <div className="relative z-10 max-w-[1200px] mx-auto px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-8">
            {/* Brand */}
            <div className="md:col-span-2 relative">
              {/* Big FOL watermark behind brand section */}
              <img
                src="/images/fol/flower-full.svg"
                alt="" aria-hidden="true"
                className="absolute -top-[30px] -left-[40px] w-[280px] h-[280px] pointer-events-none opacity-[0.06]"
              />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <FlowerOfLifeIcon size={44} color="#C75B2A" />
                  <div>
                    <span className="block font-serif text-xl font-bold text-brand-text leading-tight">Community Exchange</span>
                    <span className="block font-mono text-[9px] font-bold uppercase tracking-widest text-brand-muted-light">Powered by The Change Lab</span>
                  </div>
                </div>
                <p className="font-serif italic text-[15px] text-brand-muted mb-2">
                  Community life, organized.
                </p>
                <p className="text-[13px] leading-relaxed text-brand-muted">
                  Community Exchange is a community discovery platform built by The Change Lab in Houston. We connect residents to the officials, services, organizations, and opportunities that already exist — in their language, at their level, in their neighborhood.
                </p>
              </div>
            </div>

            {/* Discover */}
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-brand-muted-light mb-3">Discover</p>
              <div className="space-y-1">
                {DISCOVER.map(function (item) {
                  return (
                    <Link key={item.href} href={item.href} className="block py-0.5 text-[13px] text-brand-muted hover:text-brand-accent transition-colors">
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Learn */}
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-brand-muted-light mb-3">Learn</p>
              <div className="space-y-1">
                {LEARN.map(function (item) {
                  return (
                    <Link key={item.href} href={item.href} className="block py-0.5 text-[13px] text-brand-muted hover:text-brand-accent transition-colors">
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Act */}
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-brand-muted-light mb-3">Act</p>
              <div className="space-y-1">
                {ACT.map(function (item) {
                  return (
                    <Link key={item.href} href={item.href} className="block py-0.5 text-[13px] text-brand-muted hover:text-brand-accent transition-colors">
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* About */}
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-brand-muted-light mb-3">About</p>
              <div className="space-y-1">
                {ABOUT.map(function (item) {
                  return (
                    <Link key={item.href} href={item.href} className="block py-0.5 text-[13px] text-brand-muted hover:text-brand-accent transition-colors">
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Mission line */}
          <div className="mt-8 pt-6 border-t border-brand-border">
            <p className="text-[13px] italic text-brand-muted text-center max-w-2xl mx-auto">
              We didn&apos;t build anything new. We just made what already exists findable.
            </p>
          </div>

          {/* Bottom bar */}
          <div className="mt-4 pt-4 border-t border-brand-border flex flex-wrap items-center justify-between gap-4 text-[11px] text-brand-muted-light">
            <p>&copy; {new Date().getFullYear()} The Change Lab. Fiscally sponsored by Impact Hub Houston, a 501(c)(3).</p>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-brand-accent transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-brand-accent transition-colors">Terms</Link>
              <Link href="/accessibility" className="hover:text-brand-accent transition-colors">Accessibility</Link>
              <span className="text-brand-border">|</span>
              <TipsToggle />
              <span className="text-brand-border">|</span>
              <span>English &middot; Espa&ntilde;ol &middot; Ti&#7871;ng Vi&#7879;t</span>
            </div>
          </div>

          {/* Closing */}
          <p className="mt-3 text-center text-[10px] text-brand-muted-light">
            Built in Houston. For Houston.
          </p>

          {/* Crisis line */}
          <div className="mt-3 pt-3 border-t border-brand-border/50 flex justify-center gap-4 font-mono text-[11px] text-brand-muted-light">
            <span>Crisis: <strong className="text-brand-text">988</strong></span>
            <span>City: <strong className="text-brand-text">311</strong></span>
            <span>Social Services: <strong className="text-brand-text">211</strong></span>
            <span>DV: <strong className="text-brand-text">713-528-2121</strong></span>
          </div>
        </div>
      </footer>
    </>
  )
}
