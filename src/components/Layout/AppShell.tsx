'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import LoadingScreen from '@/components/UI/LoadingScreen'
import type { SelectedEntity } from '@/types/globe'

const GlobeContainer = dynamic(() => import('@/components/Globe/GlobeContainer'), {
  ssr: false,
  loading: () => <LoadingScreen />,
})

export default function AppShell() {
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [flyTo] = useState<{ lat: number; lng: number; altitude?: number } | null>(null)

  const handleLoaded = useCallback(() => setIsLoaded(true), [])

  return (
    <div className="relative w-screen h-screen bg-[#04070c] overflow-hidden">
      <GlobeContainer
        onEntitySelect={setSelectedEntity}
        onLoaded={handleLoaded}
        flyTo={flyTo}
        selectedEntity={selectedEntity}
      />

      {isLoaded && selectedEntity && (
        <div className="absolute top-6 right-6 z-30 glass border border-white/[0.08] rounded px-4 py-3">
          <p className="font-display text-[15px] text-white/85">{selectedEntity.name}</p>
          <p className="font-data text-[10px] text-white/35 mt-1">{selectedEntity.countryCode ?? '—'}</p>
        </div>
      )}
    </div>
  )
}
