import Link from 'next/link'
import { BRAND } from '@/lib/constants'

export function Footer() {
  return (
    <footer className="bg-brand-text text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-3">{BRAND.name}</h3>
            <p className="text-sm text-gray-400">{BRAND.tagline}</p>
            <p className="text-sm text-gray-400 mt-2">Built in Houston, TX</p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3 text-gray-300">Explore</h4>
            <div className="space-y-2">
              <Link href="/pathways" className="block text-sm text-gray-400 hover:text-white">Pathways</Link>
              <Link href="/help" className="block text-sm text-gray-400 hover:text-white">I Need Help</Link>
              <Link href="/officials" className="block text-sm text-gray-400 hover:text-white">Officials</Link>
              <Link href="/services" className="block text-sm text-gray-400 hover:text-white">Services</Link>
              <Link href="/learn" className="block text-sm text-gray-400 hover:text-white">Learning Paths</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3 text-gray-300">About</h4>
            <p className="text-sm text-gray-400">
              A civic platform connecting Houston residents with resources, services, and civic participation opportunities.
            </p>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-xs text-gray-500">
          &copy; {new Date().getFullYear()} {BRAND.name}. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
