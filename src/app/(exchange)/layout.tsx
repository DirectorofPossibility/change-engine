/**
 * @fileoverview Root layout for all public-facing "(exchange)" routes.
 *
 * Wraps every public page with:
 *  - LanguageProvider  (reads `lang` cookie to set i18n context)
 *  - NeighborhoodProvider (reads `zip` cookie for geo-personalization)
 *  - Schema.org JSON-LD (Organization + WebSite with SearchAction)
 *  - TickerTape (election info ticker, when election is upcoming)
 *  - Skip-to-content accessibility link
 *
 * @datasource Cookies: `lang`, `zip`
 * @caching Dynamic (reads cookies per request)
 * @route layout for /(exchange)/*
 */

import { cookies } from 'next/headers'
import { LanguageProvider } from '@/lib/contexts/LanguageContext'
import { NeighborhoodProvider } from '@/lib/contexts/NeighborhoodContext'
import { ChanceChatWidget } from '@/components/exchange/ChanceChatWidget'
import { D2Nav } from '@/components/exchange/D2Nav'
import { D2Footer } from '@/components/exchange/D2Footer'
import { TranslateBar } from '@/components/exchange/TranslateBar'
import { OnboardingLoader } from '@/components/exchange/OnboardingLoader'
import { TickerTape } from '@/components/exchange/TickerTape'
import { getNextElection } from '@/lib/data/exchange'

export default async function ExchangeLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const lang = cookieStore.get('lang')?.value
  const zip = cookieStore.get('zip')?.value
  const nextElection = await getNextElection()

  // ── Schema.org JSON-LD ──
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'Community Exchange',
        url: 'https://www.changeengine.us',
        description: 'A civic platform connecting Houston residents with resources, services, and civic participation opportunities.',
      },
      {
        '@type': 'WebSite',
        name: 'Community Exchange',
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <div className="min-h-screen bg-brand-bg">
          <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-accent focus:text-white focus:rounded-lg focus:text-sm">
            Skip to main content
          </a>
          <D2Nav />
          <TranslateBar />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <TickerTape election={nextElection} />
          <D2Footer />
          <OnboardingLoader />
          <ChanceChatWidget />
        </div>

      </NeighborhoodProvider>
    </LanguageProvider>
  )
}
