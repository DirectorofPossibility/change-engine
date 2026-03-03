/**
 * @fileoverview Site-wide footer with translated navigation links and about text.
 *
 * Converted to a client component to support reactive language switching via
 * {@link useTranslation}.
 */
'use client'

import Link from 'next/link'
import { BRAND } from '@/lib/constants'
import { useTranslation } from '@/lib/i18n'

export function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="bg-brand-text text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <p className="font-bold text-lg mb-2">{BRAND.name}</p>
            <p className="text-sm text-gray-400">{BRAND.tagline}</p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3 text-gray-300">{t('footer.explore')}</h4>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/pathways" className="text-sm text-gray-400 hover:text-white">{t('footer.pathways')}</Link>
              <Link href="/help" className="text-sm text-gray-400 hover:text-white">{t('footer.help')}</Link>
              <Link href="/officials" className="text-sm text-gray-400 hover:text-white">{t('footer.officials')}</Link>
              <Link href="/services" className="text-sm text-gray-400 hover:text-white">{t('footer.services')}</Link>
              <Link href="/elections" className="text-sm text-gray-400 hover:text-white">{t('footer.elections')}</Link>
              <Link href="/explore" className="text-sm text-gray-400 hover:text-white">{t('footer.explore_link')}</Link>
              <Link href="/polling-places" className="text-sm text-gray-400 hover:text-white">{t('footer.polling_places')}</Link>
              <Link href="/policies" className="text-sm text-gray-400 hover:text-white">{t('footer.policies')}</Link>
              <Link href="/search" className="text-sm text-gray-400 hover:text-white">{t('footer.search')}</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3 text-gray-300">{t('footer.about')}</h4>
            <p className="text-sm text-gray-400 mb-3">
              {t('footer.tagline')}
            </p>
            <div className="space-y-1">
              <Link href="/accessibility" className="block text-sm text-gray-400 hover:text-white">{t('footer.accessibility')}</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-6 text-center">
          <p className="text-sm text-gray-400 mb-1">{t('footer.built_in')}</p>
          <p className="text-xs text-gray-500">&copy; {new Date().getFullYear()} {BRAND.name}</p>
        </div>
      </div>
    </footer>
  )
}
