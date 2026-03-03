'use client'

import { APIProvider } from '@vis.gl/react-google-maps'

interface MapProviderProps {
  children: React.ReactNode
}

export function MapProvider({ children }: MapProviderProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  return (
    <APIProvider apiKey={apiKey}>
      {children}
    </APIProvider>
  )
}
