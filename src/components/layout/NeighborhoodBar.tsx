'use client'

import { useState } from 'react'
import { useNeighborhood } from '@/lib/contexts/NeighborhoodContext'
import { useTranslation } from '@/lib/use-translation'
import { ConcentricRings } from '@/components/geo/sacred'
import { X } from 'lucide-react'

export function NeighborhoodBar() {
  const { zip, neighborhood, lookupZip, clearZip } = useNeighborhood()
  const neighborhoodName = neighborhood?.neighborhood_name || null
  const { t } = useTranslation()
  const [modalOpen, setModalOpen] = useState(false)
  const [inputZip, setInputZip] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (inputZip.length !== 5) {
      setError(t('neighborhood.invalid_zip') || 'Enter a 5-digit ZIP code')
      return
    }
    lookupZip(inputZip)
    setModalOpen(false)
    setInputZip('')
    setError('')
  }

  return (
    <>
      <div
        className="w-full"
        style={{ background: '#f4f5f7', borderBottom: '1px solid #dde1e8' }}
      >
        <div className="max-w-[1080px] mx-auto px-6 py-2 flex items-center gap-3">
          <ConcentricRings size={14} color="#1b5e8a" opacity={0.5} />
          {zip ? (
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.08em]" style={{ color: '#5c6474' }}>
              <span>{t('neighborhood.near_you') || 'Near you'}:</span>
              <strong style={{ color: '#0d1117' }}>{neighborhoodName || zip}</strong>
              <span style={{ color: '#dde1e8' }}>&middot;</span>
              <button
                onClick={function () { setModalOpen(true) }}
                className="hover:underline transition-colors"
                style={{ color: '#1b5e8a' }}
              >
                {t('neighborhood.change') || 'Change'}
              </button>
            </div>
          ) : (
            <button
              onClick={function () { setModalOpen(true) }}
              className="font-mono text-xs uppercase tracking-[0.08em] hover:underline transition-colors"
              style={{ color: '#1b5e8a' }}
            >
              {t('neighborhood.prompt') || "What's happening near you?"} &middot; {t('neighborhood.set_zip') || 'Set your neighborhood'} &rarr;
            </button>
          )}
        </div>
      </div>

      {/* ZIP Modal */}
      {modalOpen && (
        <>
          <div
            className="fixed inset-0 z-[300]"
            style={{ background: 'rgba(13,17,23,0.7)' }}
            onClick={function () { setModalOpen(false) }}
          />
          <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[301] w-[380px] max-w-[90vw] bg-white"
            style={{ border: '2px solid #0d1117' }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #dde1e8' }}>
              <h2 className="font-display text-[1.4rem] font-bold" style={{ color: '#0d1117' }}>
                {t('neighborhood.set_zip') || 'Set your neighborhood'}
              </h2>
              <button
                onClick={function () { setModalOpen(false) }}
                className="p-1 transition-colors hover:text-ink"
                style={{ color: '#8a929e' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <p className="font-body text-[0.88rem]" style={{ color: '#5c6474' }}>
                {t('neighborhood.enter_zip') || 'Enter your ZIP code to see what\u2019s happening near you.'}
              </p>
              <input
                type="text"
                value={inputZip}
                onChange={function (e) { setInputZip(e.target.value.replace(/\D/g, '').slice(0, 5)); setError('') }}
                placeholder="77004"
                className="w-full px-4 py-3 font-mono text-[0.82rem]"
                style={{ border: '2px solid #0d1117' }}
                maxLength={5}
                autoFocus
              />
              {error && (
                <p className="font-mono text-xs" style={{ color: '#b03a2a' }}>{error}</p>
              )}
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={inputZip.length !== 5}
                  className="flex-1 px-4 py-3 font-mono text-xs uppercase tracking-[0.08em] transition-colors disabled:opacity-50"
                  style={{ background: '#0d1117', color: '#ffffff' }}
                >
                  {t('neighborhood.set_zip') || 'Set neighborhood'}
                </button>
                {zip && (
                  <button
                    type="button"
                    onClick={function () { clearZip(); setModalOpen(false) }}
                    className="px-4 py-3 font-mono text-xs uppercase tracking-[0.08em]"
                    style={{ color: '#5c6474', border: '1px solid #dde1e8' }}
                  >
                    {t('ui.clear') || 'Clear'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </>
      )}
    </>
  )
}
