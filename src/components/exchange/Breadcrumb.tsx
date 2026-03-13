import Link from 'next/link'
import { cookies } from 'next/headers'
import { ChevronRight, Home } from 'lucide-react'
import { getUIStrings } from '@/lib/i18n'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  /** Use 'dark' when breadcrumb is on a dark background */
  variant?: 'light' | 'dark'
}

/** Map common English breadcrumb labels to i18n keys for auto-translation */
const BREADCRUMB_KEYS: Record<string, string> = {
  'Services': 'nav.services',
  'Local Resources': 'nav.services',
  'Officials': 'nav.officials',
  'Policies': 'nav.policies',
  'Elections': 'nav.elections',
  'Organizations': 'organizations.title',
  'Opportunities': 'opportunities.title',
  'News': 'nav.news',
  'Library': 'nav.library',
  'Neighborhoods': 'neighborhoods.title',
  'Search': 'nav.search',
  'Calendar': 'nav.calendar',
  'Learning Paths': 'nav.learning_paths',
  'About': 'footer.about',
  'Explore': 'nav.explore',
  'Available Resources': 'nav.help',
  'Events': 'events.title',
  'Foundations': 'foundations.title',
  'Districts': 'districts.title',
  'FAQ': 'faq.title',
  'Contact': 'contact.title',
  'Privacy Policy': 'footer.privacy',
  'Pathways': 'nav.pathways',
  'Topics': 'pathways.title',
}

export async function Breadcrumb({ items, variant = 'light' }: BreadcrumbProps) {
  const cookieStore = await cookies()
  const designV1 = cookieStore.get('design')?.value === 'v1'
  const lang = cookieStore.get('lang')?.value || 'en'
  const t = getUIStrings(lang)

  /** Translate a breadcrumb label if a known i18n key exists, otherwise return as-is */
  function translateLabel(label: string): string {
    const key = BREADCRUMB_KEYS[label]
    if (key) {
      const translated = t(key)
      // getUIStrings returns the key itself when no translation is found; fall back to original label
      if (translated !== key) return translated
    }
    return label
  }

  if (designV1) {
    const isDark = variant === 'dark'
    const baseColor = isDark ? 'text-white/40' : 'text-muted'
    const activeColor = isDark ? 'text-white/70' : 'text-ink'
    const chevronColor = isDark ? 'text-white/20' : 'text-muted/50'
    const hoverColor = isDark ? 'hover:text-white/60' : 'hover:text-ink'

    return (
      <nav aria-label="Breadcrumb" className={`flex items-center gap-1.5 text-sm ${baseColor} py-3 overflow-x-auto`}>
        <Link href="/" className={`flex items-center gap-1 ${hoverColor} transition-colors flex-shrink-0`}>
          <Home size={14} />
          <span className="sr-only">{t('nav.home')}</span>
        </Link>
        {items.map(function (item, i) {
          const isLast = i === items.length - 1
          return (
            <span key={i} className="flex items-center gap-1.5 min-w-0">
              <ChevronRight size={12} className={`${chevronColor} flex-shrink-0`} />
              {isLast || !item.href ? (
                <span className={`font-medium ${activeColor} truncate`}>{translateLabel(item.label)}</span>
              ) : (
                <Link href={item.href} className={`${hoverColor} transition-colors truncate`}>
                  {translateLabel(item.label)}
                </Link>
              )}
            </span>
          )
        })}
      </nav>
    )
  }

  // D2 design (default)
  return (
    <nav
      aria-label="Breadcrumb"
      className="max-w-[1080px] mx-auto px-8 py-3"
    >
      <ol className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-faint">
        <li>
          <Link href="/" className="hover:text-blue transition-colors">
            {t('nav.home')}
          </Link>
        </li>
        {items.map(function (item, i) {
          const isLast = i === items.length - 1
          return (
            <li key={i} className="flex items-center gap-1.5">
              <span className="text-rule" aria-hidden="true">/</span>
              {isLast || !item.href ? (
                <span className="text-muted">{translateLabel(item.label)}</span>
              ) : (
                <Link href={item.href} className="hover:text-blue transition-colors">
                  {translateLabel(item.label)}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
