import Link from 'next/link'
import { BRAND, LANGUAGES } from '@/lib/constants'

const pathways = [
  { href: '/pathways/our-health', label: 'Our Health' },
  { href: '/pathways/our-voice', label: 'Our Voice' },
  { href: '/pathways/our-families', label: 'Our Families' },
  { href: '/pathways/our-neighborhood', label: 'Our Neighborhood' },
  { href: '/pathways/our-money', label: 'Our Money' },
  { href: '/pathways/our-planet', label: 'Our Planet' },
  { href: '/pathways/the-bigger-we', label: 'The Bigger We' },
]

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
    <footer className="bg-white border-t border-brand-border">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <h3 className="font-serif text-lg text-brand-text font-semibold">
              The Change Engine
            </h3>
            <p className="text-sm text-brand-muted mt-2 leading-relaxed">
              {BRAND.origin}
            </p>
            <p className="text-sm text-brand-muted mt-3 leading-relaxed">
              A civic platform connecting Houston residents with the resources,
              knowledge, and opportunities that strengthen communities.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h4 className="font-serif text-sm text-brand-text font-semibold uppercase tracking-wide">
              Explore
            </h4>
            <ul className="mt-3 space-y-2">
              {pathways.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-brand-muted hover:text-brand-accent transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Navigate */}
          <div>
            <h4 className="font-serif text-sm text-brand-text font-semibold uppercase tracking-wide">
              Navigate
            </h4>
            <ul className="mt-3 space-y-2">
              {navigate.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-brand-muted hover:text-brand-accent transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="font-serif text-sm text-brand-text font-semibold uppercase tracking-wide">
              Connect
            </h4>
            <ul className="mt-3 space-y-2">
              {connect.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-brand-muted hover:text-brand-accent transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-brand-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-brand-muted">
            &copy; 2026 The Change Engine
          </p>

          <div className="flex items-center gap-4">
            {legal.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-xs text-brand-muted hover:text-brand-accent transition-colors"
              >
                {label}
              </Link>
            ))}

            <span className="text-xs text-brand-border">|</span>

            <span className="text-xs text-brand-muted">
              {LANGUAGES.map((lang, i) => (
                <span key={lang.code}>
                  {i > 0 && <span className="mx-1">/</span>}
                  {lang.name}
                </span>
              ))}
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
