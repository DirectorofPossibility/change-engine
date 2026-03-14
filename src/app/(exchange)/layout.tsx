/**
 * @fileoverview Root layout for the Field Guide — all public-facing routes.
 *
 * Wraps every page with:
 *  - LanguageProvider  (reads `lang` cookie)
 *  - NeighborhoodProvider (reads `zip` cookie for geo-personalization)
 *  - Schema.org JSON-LD
 *  - GuideNav + GuideFooter + MobileTabBar
 */

import { cookies } from 'next/headers'
import { LanguageProvider } from '@/lib/contexts/LanguageContext'
import { NeighborhoodProvider } from '@/lib/contexts/NeighborhoodContext'
import { GuideNav } from '@/components/guide/GuideNav'
import { GuideFooter } from '@/components/guide/GuideFooter'
import { MobileTabBar } from '@/components/guide/MobileTabBar'
import { getSiteConfig } from '@/lib/data/site-config'
import { SiteConfigProvider } from '@/lib/contexts/SiteConfigContext'

export default async function GuideLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const lang = cookieStore.get('lang')?.value
  const zip = cookieStore.get('zip')?.value
  const siteConfig = await getSiteConfig()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'Change Engine',
        url: 'https://www.changeengine.us',
        description: 'A field guide to Greater Houston\'s civic resources — 10,000+ free resources from 1,800+ organizations.',
      },
      {
        '@type': 'WebSite',
        name: 'Change Engine',
        url: 'https://www.changeengine.us',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://www.changeengine.us/search?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  }

  return (
    <LanguageProvider initialLang={lang}>
      <NeighborhoodProvider initialZip={zip}>
        <SiteConfigProvider config={siteConfig}>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />

          <div className="min-h-screen bg-white flex flex-col">
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#1b5e8a] focus:text-white focus:text-sm focus:rounded"
            >
              Skip to main content
            </a>

            <GuideNav />

            <main id="main-content" className="flex-1 pb-16 md:pb-0">
              {children}
            </main>

            <GuideFooter />
            <MobileTabBar />
          </div>
        </SiteConfigProvider>
      </NeighborhoodProvider>
    </LanguageProvider>
  )
}
