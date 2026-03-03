/**
 * @fileoverview Sub-page layout for all non-homepage routes in the exchange.
 *
 * Wraps detail/listing pages with the persistent NavigationSidebar (same design
 * as the homepage WayfinderSidebar) and site Footer. The sidebar is always
 * present and collapsible on desktop, with a hamburger slide-in on mobile.
 *
 * @route layout for /(exchange)/(pages)/*
 */

import { NavigationSidebar } from '@/components/exchange/NavigationSidebar'
import { Footer } from '@/components/exchange/Footer'

export default function PagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <NavigationSidebar>
      {children}
      <Footer />
    </NavigationSidebar>
  )
}
