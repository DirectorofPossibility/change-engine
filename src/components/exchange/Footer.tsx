import Link from 'next/link'
import { BRAND } from '@/lib/constants'

export function Footer() {
  return (
    <footer className="bg-brand-text text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <p className="font-bold text-lg mb-2">{BRAND.name}</p>
            <p className="text-sm text-gray-400">{BRAND.tagline}</p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3 text-gray-300">Explore</h4>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/pathways" className="text-sm text-gray-400 hover:text-white">Pathways</Link>
              <Link href="/help" className="text-sm text-gray-400 hover:text-white">Available Resources</Link>
              <Link href="/officials" className="text-sm text-gray-400 hover:text-white">Officials</Link>
              <Link href="/services" className="text-sm text-gray-400 hover:text-white">Services</Link>
              <Link href="/elections" className="text-sm text-gray-400 hover:text-white">Elections</Link>
              <Link href="/explore" className="text-sm text-gray-400 hover:text-white">Explore</Link>
              <Link href="/polling-places" className="text-sm text-gray-400 hover:text-white">Polling Places</Link>
              <Link href="/policies" className="text-sm text-gray-400 hover:text-white">Policies</Link>
              <Link href="/search" className="text-sm text-gray-400 hover:text-white">Search</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3 text-gray-300">About</h4>
            <p className="text-sm text-gray-400 mb-3">
              A civic platform connecting Houston residents with resources, services, and civic participation opportunities.
            </p>
            <div className="space-y-1">
              <Link href="/accessibility" className="block text-sm text-gray-400 hover:text-white">Accessibility</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-6 text-center">
          <p className="text-sm text-gray-400 mb-1">Built with care in Houston, TX</p>
          <p className="text-xs text-gray-500">&copy; {new Date().getFullYear()} {BRAND.name}</p>
        </div>
      </div>
    </footer>
  )
}
