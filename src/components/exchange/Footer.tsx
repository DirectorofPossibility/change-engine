import Link from 'next/link'
import { cookies } from 'next/headers'
import { BRAND, LANGUAGES, THEMES } from '@/lib/constants'
import { FlowerOfLifeIcon } from './FlowerIcons'
import { getUIStrings } from '@/lib/i18n'

const pathways = Object.values(THEMES).map(function (t) {
  return { href: '/pathways/' + t.slug, label: t.name, color: t.color }
})

export async function Footer() {
  const cookieStore = await cookies()
  const lang = cookieStore.get('lang')?.value || 'en'
  const t = getUIStrings(lang)

  const navigate = [
    { href: '/compass', label: t('footer.compass') },
    { href: '/services', label: t('nav.services') },
    { href: '/officials', label: t('nav.officials') },
    { href: '/policies', label: t('nav.policies') },
    { href: '/elections', label: t('nav.elections') },
    { href: '/library', label: t('nav.library') },
    { href: '/help', label: t('nav.help') },
    { href: '/search', label: t('nav.search_placeholder').split(' ')[0] },
  ]

  const connect = [
    { href: '/about', label: t('nav.about') },
    { href: '/me', label: t('footer.my_account') },
    { href: '/me/submit', label: t('footer.share_resource') },
    { href: '/login', label: t('footer.sign_in') },
  ]

  const legal = [
    { href: '/privacy', label: t('footer.privacy') },
    { href: '/terms', label: t('footer.terms') },
    { href: '/accessibility', label: t('footer.accessibility') },
  ]

  return (
    <footer className="bg-brand-bg-alt border-t border-brand-border">
      {/* Pathway spectrum bar */}
      <div className="flex h-1">
        {pathways.map(function (p) {
          return <div key={p.href} className="flex-1" style={{ backgroundColor: p.color }} />
        })}
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <FlowerOfLifeIcon size={28} color="#C75B2A" />
              <h3 className="font-serif text-lg text-brand-text font-semibold">
                {t('footer.community_exchange')}
              </h3>
            </div>
            <p className="text-sm text-brand-muted leading-relaxed">
              {t('footer.description')}
            </p>
            <p className="text-xs text-brand-muted-light mt-4 italic">
              {BRAND.origin}
            </p>
          </div>

          {/* Pathways */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-muted-light mb-4">
              {t('footer.pathways')}
            </h4>
            <ul className="space-y-2">
              {pathways.map(function (p) {
                return (
                  <li key={p.href} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-sm flex-shrink-0" style={{ backgroundColor: p.color }} />
                    <Link href={p.href} className="text-sm text-brand-muted hover:text-brand-accent transition-colors">
                      {p.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Navigate */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-muted-light mb-4">
              {t('footer.navigate')}
            </h4>
            <ul className="space-y-2">
              {navigate.map(function (link) {
                return (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-brand-muted hover:text-brand-accent transition-colors">
                      {link.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-muted-light mb-4">
              {t('footer.connect')}
            </h4>
            <ul className="space-y-2">
              {connect.map(function (link) {
                return (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-brand-muted hover:text-brand-accent transition-colors">
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
      <div className="border-t border-brand-border">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-brand-muted-light">
            &copy; {new Date().getFullYear()} The Change Lab
          </p>

          <div className="flex items-center gap-4">
            {legal.map(function (link) {
              return (
                <Link key={link.href} href={link.href} className="text-xs text-brand-muted-light hover:text-brand-accent transition-colors">
                  {link.label}
                </Link>
              )
            })}

            <span className="text-xs text-brand-border">|</span>

            <span className="text-xs text-brand-muted-light">
              {LANGUAGES.map(function (lang, i) {
                return (
                  <span key={lang.code}>
                    {i > 0 && <span className="mx-1 text-brand-border">/</span>}
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
