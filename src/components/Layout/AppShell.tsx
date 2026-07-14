'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { AnimatePresence, motion } from 'framer-motion'
import SidebarPanel from '@/components/Sidebar/SidebarPanel'
import DemoMode from '@/components/UI/DemoMode'
import LayerControl from '@/components/UI/LayerControl'
import LoadingScreen from '@/components/UI/LoadingScreen'
import NewsAnchor from '@/components/UI/NewsAnchor'
import Ticker, { type TickerItem } from '@/components/UI/Ticker'
import TimelineSlider from '@/components/UI/TimelineSlider'
import TopBar from '@/components/UI/TopBar'
import type { SelectedEntity } from '@/types/globe'
import { DEFAULT_LAYERS, type LayerState } from '@/types/layers'

const GlobeContainer = dynamic(() => import('@/components/Globe/GlobeContainer'), {
  ssr: false,
  loading: () => <LoadingScreen />,
})

export default function AppShell() {
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; altitude?: number } | null>(null)
  const [layers, setLayers] = useState<LayerState>(DEFAULT_LAYERS)
  const [timelineYear, setTimelineYear] = useState(2025)
  const [demoActive, setDemoActive] = useState(false)

  const [compareEntity, setCompareEntity] = useState<SelectedEntity | null>(null)
  const [isComparing, setIsComparing] = useState(false)
  const isComparingRef = useRef(false)

  const handleLoaded = useCallback(() => setIsLoaded(true), [])

  const handleEntitySelect = useCallback((entity: SelectedEntity | null) => {
    if (isComparingRef.current && entity && entity.type !== 'city') {
      setCompareEntity(entity)
    } else {
      setSelectedEntity(entity)
      setCompareEntity(null)
    }
    setIsComparing(false)
    isComparingRef.current = false
  }, [])

  const handleSearchSelect = useCallback((lat: number, lng: number, entity: SelectedEntity) => {
    setFlyTo({ lat, lng, altitude: 1.8 })
    handleEntitySelect(entity)
  }, [handleEntitySelect])

  const handleTickerSelect = useCallback((item: TickerItem) => {
    handleSearchSelect(item.lat, item.lng, {
      id: item.code,
      type: 'country',
      name: item.name,
      countryCode: item.code,
      lat: item.lat,
      lng: item.lng,
    })
  }, [handleSearchSelect])

  const toggleLayer = useCallback((key: keyof LayerState) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const startCompare = useCallback(() => {
    setIsComparing(true)
    isComparingRef.current = true
    setCompareEntity(null)
  }, [])

  const closeCompare = useCallback(() => {
    setCompareEntity(null)
    setIsComparing(false)
    isComparingRef.current = false
  }, [])

  const closeSidebar = useCallback(() => {
    setSelectedEntity(null)
    closeCompare()
  }, [closeCompare])

  const startDemo = useCallback(() => {
    setDemoActive(true)
    setLayers(prev => ({ ...prev, tradeRoutes: true, news: true }))
  }, [])

  const handleDemoSelect = useCallback((entity: SelectedEntity, lat: number, lng: number, altitude: number) => {
    setFlyTo({ lat, lng, altitude })
    setSelectedEntity(entity)
    setCompareEntity(null)
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (isComparing || compareEntity) closeCompare()
      else if (selectedEntity) closeSidebar()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isComparing, compareEntity, selectedEntity, closeCompare, closeSidebar])

  return (
    <div className="relative w-screen h-screen bg-[#04070c] overflow-hidden">
      <AnimatePresence>
        {isComparing && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-40 glass border border-[rgba(69,224,192,0.22)] rounded px-4 py-1.5 flex items-center gap-2.5"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#45E0C0] animate-pulse flex-shrink-0" />
            <span className="microlabel !text-[#45E0C0]/75">Select a country to compare</span>
            <button
              onClick={closeCompare}
              className="text-white/30 hover:text-white/60 text-[12px] leading-none cursor-pointer"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <GlobeContainer
        onEntitySelect={handleEntitySelect}
        onLoaded={handleLoaded}
        flyTo={flyTo}
        selectedEntity={selectedEntity}
        layers={layers}
      />

      <AnimatePresence>
        {isLoaded && (
          <>
            <TopBar onSearchSelect={handleSearchSelect} onStartDemo={startDemo} demoActive={demoActive} />
            <Ticker onSelect={handleTickerSelect} />

            <LayerControl layers={layers} onToggle={toggleLayer} />

            <AnimatePresence>
              {layers.timeline && <TimelineSlider year={timelineYear} onChange={setTimelineYear} />}
            </AnimatePresence>

            <DemoMode
              isActive={demoActive}
              onSelectCountry={handleDemoSelect}
              onStop={() => setDemoActive(false)}
            />

            <NewsAnchor selectedEntity={selectedEntity} />

            {selectedEntity && (
              <SidebarPanel
                key={selectedEntity.id}
                entity={selectedEntity}
                compareEntity={compareEntity}
                onClose={closeSidebar}
                onCloseCompare={closeCompare}
                onStartCompare={startCompare}
                showNews={layers.news}
                timelineYear={layers.timeline ? timelineYear : undefined}
              />
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
