import Link from 'next/link'
import { Heart } from 'lucide-react'
import { FlowerOfLifeIcon } from '@/components/exchange/FlowerIcons'
import { THEMES } from '@/lib/constants'

const THEME_LIST = Object.values(THEMES)

export function Design2Footer() {
  return (
    <footer>
      {/* Pathway spectrum */}
      <div className="flex h-1">
        {THEME_LIST.map(function (t) {
          return <div key={t.slug} className="flex-1" style={{ background: t.color }} />
        })}
      </div>

      <div className="py-12 px-8" style={{ background: '#1A1A1A' }}>
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <FlowerOfLifeIcon size={28} color="#C75B2A" />
              <span className="font-serif text-[15px] text-white font-semibold">Community Exchange</span>
            </div>
            <p className="text-[14px] font-medium leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
              A civic platform connecting Houston residents with resources, knowledge, and opportunities.
            </p>
            <p className="text-[12px] italic font-medium mt-3" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Built in Houston, Made for Everyone.
            </p>
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Pathways</div>
            {THEME_LIST.map(function (t) {
              return (
                <Link key={t.slug} href={'/design2/pathways/' + t.slug} className="flex items-center gap-2 py-1 text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: t.color }} />
                  {t.name}
                </Link>
              )
            })}
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Navigate</div>
            {[
              { href: '/design2/news', label: 'News' },
              { href: '/design2/events', label: 'Events' },
              { href: '/design2/library', label: 'Library' },
              { href: '/design2/officials', label: 'Officials' },
              { href: '/design2/services', label: 'Services' },
              { href: '/design2/organizations', label: 'Organizations' },
              { href: '/design2/search', label: 'Search' },
            ].map(function (item) {
              return (
                <Link key={item.href} href={item.href} className="block py-1 text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {item.label}
                </Link>
              )
            })}
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Always Available</div>
            <div className="text-[13px] font-medium leading-loose" style={{ color: 'rgba(255,255,255,0.7)' }}>
              <div>Crisis line: <strong className="text-white">988</strong></div>
              <div>City services: <strong className="text-white">311</strong></div>
              <div>Social services: <strong className="text-white">211</strong></div>
            </div>
            <a
              href="https://app.betterunite.com/thechangelab#bnte_p_bwThbDPG"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg text-[12px] font-semibold"
              style={{ color: '#C75B2A' }}
            >
              <Heart size={14} className="fill-current" />
              Support Our Work
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
