import Link from 'next/link'
import { BRAND, LANGUAGES, THEMES } from '@/lib/constants'
import { FlowerOfLifeIcon } from './FlowerIcons'

const pathways = Object.values(THEMES).map(function (t) {
  return { href: '/pathways/' + t.slug, label: t.name, color: t.color }
})

const navigate = [
  { href: '/compass', label: 'Compass' },
  { href: '/services', label: 'Services' },
  { href: '/officials', label: 'Officials' },
  { href: '/policies', label: 'Policies' },
  { href: '/elections', label: 'Elections' },
  { href: '/library', label: 'Library' },
  { href: '/help', label: 'Available Resources' },
  { href: '/search', label: 'Search' },
]

const connect = [
  { href: '/about', label: 'About' },
  { href: '/me', label: 'My Account' },
  { href: '/me/submit', label: 'Share a Resource' },
  { href: '/login', label: 'Sign In' },
]

const legal = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: '/accessibility', label: 'Accessibility' },
]

export function Footer() {
  return (
    <footer className="bg-brand-dark text-white/70">
      {/* Pathway spectrum bar */}
      <div className="flex h-1">
        {pathways.map(function (p) {
          return <div key={p.href} className="flex-1" style={{ backgroundColor: p.color }} />
        })}
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <FlowerOfLifeIcon size={28} color="#E8723A" />
              <h3 className="font-serif text-lg text-white font-semibold">
                Community Exchange
              </h3>
            </div>
            <p className="text-sm text-white/50 leading-relaxed">
              A civic platform connecting Houston residents with the resources,
              knowledge, and opportunities that strengthen communities.
            </p>
            <p className="text-xs text-white/50 mt-4 italic">
              {BRAND.origin}
            </p>
          </div>

          {/* Pathways */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-4">
              Pathways
            </h4>
            <ul className="space-y-2">
              {pathways.map(function (p) {
                return (
                  <li key={p.href} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-sm flex-shrink-0" style={{ backgroundColor: p.color }} />
                    <Link href={p.href} className="text-sm text-white/50 hover:text-white transition-colors">
                      {p.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Navigate */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-4">
              Navigate
            </h4>
            <ul className="space-y-2">
              {navigate.map(function (link) {
                return (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-white/50 hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-4">
              Connect
            </h4>
            <ul className="space-y-2">
              {connect.map(function (link) {
                return (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-white/50 hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/50">
            &copy; 2026 The Change Lab
          </p>

          <div className="flex items-center gap-4">
            {legal.map(function (link) {
              return (
                <Link key={link.href} href={link.href} className="text-xs text-white/50 hover:text-white/70 transition-colors">
                  {link.label}
                </Link>
              )
            })}

            <span className="text-xs text-white/20">|</span>

            <span className="text-xs text-white/50">
              {LANGUAGES.map(function (lang, i) {
                return (
                  <span key={lang.code}>
                    {i > 0 && <span className="mx-1 text-white/30">/</span>}
                    {lang.name}
                  </span>
                )
              })}
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
