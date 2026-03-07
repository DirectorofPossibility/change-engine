import Link from 'next/link'
import { FlowerOfLifeIcon, ARCHETYPES } from './FlowerIcons'

const PATHWAYS = [
  { name: 'Our Health', href: '/pathways/our-health', color: '#e53e3e' },
  { name: 'Our Families', href: '/pathways/our-families', color: '#dd6b20' },
  { name: 'Our Neighborhood', href: '/pathways/our-neighborhood', color: '#d69e2e' },
  { name: 'Our Voice', href: '/pathways/our-voice', color: '#38a169' },
  { name: 'Our Money', href: '/pathways/our-money', color: '#3182ce' },
  { name: 'Our Planet', href: '/pathways/our-planet', color: '#319795' },
  { name: 'The Bigger We', href: '/pathways/the-bigger-we', color: '#805ad5' },
]

const NAVIGATE = [
  { label: 'Compass', href: '/compass' },
  { label: 'Services', href: '/services' },
  { label: 'Officials', href: '/officials' },
  { label: 'Policies', href: '/policies' },
  { label: 'Elections', href: '/elections' },
  { label: 'Library', href: '/library' },
  { label: 'Search', href: '/search' },
]

const COMMUNITY = [
  { label: 'Neighborhoods', href: '/neighborhoods' },
  { label: 'Organizations', href: '/organizations' },
  { label: 'Opportunities', href: '/opportunities' },
  { label: 'Foundations', href: '/foundations' },
  { label: 'Events', href: '/calendar' },
  { label: 'Good Things', href: '/goodthings' },
]

const CONNECT = [
  { label: 'About', href: '/about' },
  { label: 'My Account', href: '/me' },
  { label: 'Share a Resource', href: '/me/submit' },
  { label: 'Contact', href: '/contact' },
  { label: 'Accessibility', href: '/accessibility' },
  { label: 'User Manual', href: '/manual' },
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

      <footer className="bg-brand-dark relative overflow-hidden text-white">
        {/* FOL watermark — large, centered, using the static SVG */}
        <img
          src="/images/fol/flower-white.svg"
          alt=""
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] pointer-events-none opacity-[0.03]"
        />
        {/* Second watermark — seed pattern, offset right */}
        <img
          src="/images/fol/seed-of-life.svg"
          alt=""
          aria-hidden="true"
          className="absolute -right-20 -bottom-20 w-[300px] h-[300px] pointer-events-none opacity-[0.02]"
          style={{ filter: 'brightness(10)' }}
        />

        <div className="relative z-10 max-w-[1200px] mx-auto px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5 mb-3">
                <FlowerOfLifeIcon size={32} color="#C75B2A" />
                <span className="font-serif text-base text-white">Community Exchange</span>
              </div>
              <p className="text-[13px] leading-relaxed text-white/60">
                Connecting Houston residents with the resources, services, and civic power that shape community life.
              </p>
              <p className="mt-3 text-[11px] italic text-white/25">
                Powered by The Change Lab
              </p>
            </div>

            {/* Pathways */}
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">Pathways</p>
              <div className="space-y-1">
                {PATHWAYS.map(function (pw) {
                  return (
                    <Link key={pw.href} href={pw.href} className="flex items-center gap-2 py-0.5 text-[13px] text-white/60 hover:text-white transition-colors">
                      <span className="w-[5px] h-[5px] rounded-sm flex-shrink-0" style={{ background: pw.color }} />
                      {pw.name}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Navigate */}
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">Navigate</p>
              <div className="space-y-1">
                {NAVIGATE.map(function (item) {
                  return (
                    <Link key={item.href} href={item.href} className="block py-0.5 text-[13px] text-white/60 hover:text-white transition-colors">
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Community */}
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">Community</p>
              <div className="space-y-1">
                {COMMUNITY.map(function (item) {
                  return (
                    <Link key={item.href} href={item.href} className="block py-0.5 text-[13px] text-white/60 hover:text-white transition-colors">
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Connect */}
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">Connect</p>
              <div className="space-y-1">
                {CONNECT.map(function (item) {
                  return (
                    <Link key={item.href} href={item.href} className="block py-0.5 text-[13px] text-white/60 hover:text-white transition-colors">
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Your Journey — now a column */}
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">Your Journey</p>
              <div className="space-y-1.5">
                {ARCHETYPES.map(function (a) {
                  return (
                    <Link key={a.id} href={'/for/' + a.id} className="flex items-center gap-2 group">
                      <a.Icon size={16} color="#C75B2A" />
                      <div>
                        <p className="text-[12px] text-white/60 group-hover:text-white transition-colors leading-tight">{a.name.replace('The ', '')}</p>
                        <p className="text-[9px] text-white/25 leading-tight">{a.desc}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Who This Is For + FOL accent */}
          <div className="mt-8 pt-6 border-t border-white/[0.06] flex items-start gap-6">
            <img
              src="/images/fol/genesis.svg"
              alt=""
              aria-hidden="true"
              className="w-12 h-12 flex-shrink-0 opacity-20"
              style={{ filter: 'brightness(10)' }}
            />
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1.5">Who This Is For</p>
              <p className="text-[13px] leading-relaxed text-white/50 max-w-3xl">
                Residents looking for services and support. Neighbors ready to get involved. Organizers building coalitions. Watchdogs tracking policy. Partners connecting communities. Everyone curious about Houston.
              </p>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-6 pt-4 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-4 text-[11px] text-white/25">
            <p>&copy; {new Date().getFullYear()} The Change Lab. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-white/60 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white/60 transition-colors">Terms</Link>
              <Link href="/accessibility" className="hover:text-white/60 transition-colors">Accessibility</Link>
              <span className="text-white/15">|</span>
              <span>English / Espa&ntilde;ol / Ti&#7871;ng Vi&#7879;t</span>
            </div>
          </div>

          {/* Crisis line */}
          <div className="mt-3 pt-3 border-t border-white/[0.05] flex justify-center gap-4 font-mono text-[11px] text-white/20">
            <span>Crisis: <strong className="text-white/40">988</strong></span>
            <span>City: <strong className="text-white/40">311</strong></span>
            <span>Social Services: <strong className="text-white/40">211</strong></span>
            <span>DV: <strong className="text-white/40">713-528-2121</strong></span>
          </div>
        </div>
      </footer>
    </>
  )
}
