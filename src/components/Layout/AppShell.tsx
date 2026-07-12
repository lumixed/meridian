'use client'

import { useState, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { AnimatePresence, motion } from 'framer-motion'
import SidebarPanel from '@/components/Sidebar/SidebarPanel'
import LoadingScreen from '@/components/UI/LoadingScreen'
import SearchBar from '@/components/UI/SearchBar'
import type { SelectedEntity } from '@/types/globe'

const GlobeContainer = dynamic(() => import('@/components/Globe/GlobeContainer'), {
  ssr: false,
  loading: () => <LoadingScreen />,
})

export default function AppShell() {
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; altitude?: number } | null>(null)

  const handleLoaded = useCallback(() => setIsLoaded(true), [])
  const closeSidebar = useCallback(() => setSelectedEntity(null), [])

  const handleSearchSelect = useCallback((lat: number, lng: number, entity: SelectedEntity) => {
    setFlyTo({ lat, lng, altitude: 1.8 })
    setSelectedEntity(entity)
  }, [])

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
        {isLoaded && (
          <>
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute top-5 left-1/2 -translate-x-1/2 z-30 w-[420px] max-w-[88vw]"
            >
              <SearchBar onSelect={handleSearchSelect} />
            </motion.div>

            {selectedEntity && (
              <SidebarPanel key={selectedEntity.id} entity={selectedEntity} onClose={closeSidebar} />
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
