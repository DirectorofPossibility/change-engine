'use client'

import { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'

interface ImageLightboxProps {
  src: string
  alt: string
  className?: string
}

export function ImageLightbox({ src, alt, className }: ImageLightboxProps) {
  const [open, setOpen] = useState(false)

  const close = useCallback(function () { setOpen(false) }, [])

  useEffect(function () {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    return function () { document.removeEventListener('keydown', onKey) }
  }, [open, close])

  return (
    <>
      <Image
        src={src}
        alt={alt}
        className={(className || '') + ' cursor-zoom-in'}
        onClick={function (e) { e.preventDefault(); e.stopPropagation(); setOpen(true) }}
       width={200} height={200} />
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={close}
        >
          <button
            onClick={close}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white text-xl flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            &times;
          </button>
          <Image
            src={src}
            alt={alt}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={function (e) { e.stopPropagation() }}
           width={200} height={200} />
        </div>
      )}
    </>
  )
}
