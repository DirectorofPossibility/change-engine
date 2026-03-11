'use client'

import { useState } from 'react'
import Image from 'next/image'

interface ContentImageProps {
  src: string
  alt: string
  themeColor: string
}

export function ContentImage({ src, alt, themeColor }: ContentImageProps) {
  const [error, setError] = useState(false)

  if (error) {
    return (
      <div
        className="w-full h-56 flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${themeColor}20, ${themeColor}08)` }}
      >
        <svg className="w-16 h-16 opacity-20" viewBox="0 0 400 80" fill={themeColor}>
          <rect x="100" y="10" width="22" height="70"/>
          <rect x="130" y="15" width="20" height="65"/>
          <rect x="155" y="5" width="25" height="75"/>
          <rect x="185" y="0" width="28" height="80"/>
          <rect x="220" y="8" width="22" height="72"/>
          <rect x="250" y="18" width="20" height="62"/>
        </svg>
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      className="w-full h-56 object-cover"
      width={800}
      height={224}
      onError={() => setError(true)}
    />
  )
}
