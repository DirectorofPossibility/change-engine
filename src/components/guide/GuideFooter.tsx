/**
 * @fileoverview Field Guide footer — minimal, informational.
 */

import Link from 'next/link'
import { THEMES } from '@/lib/constants'

const PATHWAY_LIST = Object.values(THEMES).map((t) => ({
  name: t.name,
  slug: t.slug,
  color: t.color,
}))

export function GuideFooter() {
  return (
    <footer className="bg-[#0d1117] text-[#8a929e]">
      {/* Houston skyline placeholder — replace with houston/skyline.svg */}
      <div className="h-px bg-[#1b5e8a]" />

      <div className="max-w-[1200px] mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <p className="text-white font-semibold text-sm mb-3">Change Engine</p>
            <p className="text-xs leading-relaxed">
              A field guide to Greater Houston&apos;s civic resources.
              Free forever. Zero ads. Updated daily.
            </p>
            <p className="text-xs mt-3">
              Available in:{' '}
              <span className="text-white">English</span> &middot;{' '}
              <span className="text-white">Espa&ntilde;ol</span> &middot;{' '}
              <span className="text-white">Ti&#7871;ng Vi&#7879;t</span>
            </p>
          </div>

          {/* Pathways */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[#5c6474] mb-3">Pathways</p>
            <div className="flex flex-col gap-1.5">
              {PATHWAY_LIST.map((p) => (
                <Link
                  key={p.slug}
                  href={`/${p.slug}`}
                  className="flex items-center gap-2 text-xs hover:text-white transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-sm" style={{ background: p.color }} />
                  {p.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Directories */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[#5c6474] mb-3">Directories</p>
            <div className="flex flex-col gap-1.5">
              <Link href="/orgs" className="text-xs hover:text-white transition-colors">Organizations</Link>
              <Link href="/services" className="text-xs hover:text-white transition-colors">Services</Link>
              <Link href="/officials" className="text-xs hover:text-white transition-colors">Officials</Link>
              <Link href="/policies" className="text-xs hover:text-white transition-colors">Policies</Link>
              <Link href="/opportunities" className="text-xs hover:text-white transition-colors">Opportunities</Link>
              <Link href="/elections" className="text-xs hover:text-white transition-colors">Elections</Link>
              <Link href="/neighborhoods" className="text-xs hover:text-white transition-colors">Neighborhoods</Link>
            </div>
          </div>

          {/* Info */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[#5c6474] mb-3">Info</p>
            <div className="flex flex-col gap-1.5">
              <Link href="/start" className="text-xs hover:text-white transition-colors">Find what you need</Link>
              <Link href="/map" className="text-xs hover:text-white transition-colors">Map</Link>
              <Link href="/news" className="text-xs hover:text-white transition-colors">What&apos;s new</Link>
              <Link href="/calendar" className="text-xs hover:text-white transition-colors">Civic calendar</Link>
              <Link href="/about" className="text-xs hover:text-white transition-colors">About</Link>
              <Link href="/contact" className="text-xs hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-[#1a1f2e] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px]">
            A project of The Change Lab &middot; Houston, TX
          </p>
          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/accessibility" className="hover:text-white transition-colors">Accessibility</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
