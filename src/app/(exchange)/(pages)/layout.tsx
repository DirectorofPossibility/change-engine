/**
 * @fileoverview Sub-page layout for all non-homepage routes in the exchange.
 *
 * Wraps detail/listing pages with the compact WayfinderNav header and
 * site Footer. The homepage (at the parent route group level) has its own
 * full wayfinder sidebar and does not use this layout.
 *
 * @route layout for /(exchange)/(pages)/*
 */

import { WayfinderNav } from '@/components/exchange/WayfinderNav'
import { Footer } from '@/components/exchange/Footer'

export default function PagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WayfinderNav />
      {children}
      <Footer />
    </>
  )
}
