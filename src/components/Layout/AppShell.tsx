'use client'

import { useState, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { AnimatePresence } from 'framer-motion'
import SidebarPanel from '@/components/Sidebar/SidebarPanel'
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
  const closeSidebar = useCallback(() => setSelectedEntity(null), [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSidebar()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [closeSidebar])

  return (
    <div className="relative w-screen h-screen bg-[#04070c] overflow-hidden">
      <GlobeContainer
        onEntitySelect={setSelectedEntity}
        onLoaded={handleLoaded}
        flyTo={flyTo}
        selectedEntity={selectedEntity}
      />

      <AnimatePresence>
        {isLoaded && selectedEntity && (
          <SidebarPanel key={selectedEntity.id} entity={selectedEntity} onClose={closeSidebar} />
        )}
      </AnimatePresence>
    </div>
  )
}
