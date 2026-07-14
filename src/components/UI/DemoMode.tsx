'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { SelectedEntity } from '@/types/globe'

interface Showcase {
  code: string
  name: string
  lat: number
  lng: number
  altitude: number
  headline: string
}

const SHOWCASE: Showcase[] = [
  { code: 'US', name: 'United States', lat: 38.9, lng: -77.0, altitude: 1.6,
    headline: "World's largest economy · ~$29T GDP" },
  { code: 'CN', name: 'China', lat: 39.9, lng: 116.4, altitude: 1.5,
    headline: '~$19T GDP · global manufacturing hub' },
  { code: 'IN', name: 'India', lat: 20.6, lng: 78.9, altitude: 1.7,
    headline: 'Fastest-growing major economy · 1.45B people' },
  { code: 'AE', name: 'UAE', lat: 23.4, lng: 53.8, altitude: 1.4,
    headline: 'Global trade hub · AAA-rated financial centre · Vision 2031' },
  { code: 'DE', name: 'Germany', lat: 51.2, lng: 10.4, altitude: 1.5,
    headline: "Europe's largest economy · industrial powerhouse · export leader" },
  { code: 'SG', name: 'Singapore', lat: 1.35, lng: 103.8, altitude: 1.2,
    headline: "Asia-Pacific's financial gateway · AAA sovereign rating · open economy" },
]

const DWELL_MS = 11_000
const ADVANCE_MS = 800

interface Props {
  onSelectCountry: (entity: SelectedEntity, lat: number, lng: number, altitude: number) => void
  isActive: boolean
  onStop: () => void
}

export default function DemoMode({ onSelectCountry, isActive, onStop }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [progress, setProgress] = useState(0)
  const [transitioning, setTransitioning] = useState(false)

  const onSelectRef = useRef(onSelectCountry)
  onSelectRef.current = onSelectCountry

  const indexRef = useRef(0)
  const startedAt = useRef(0)
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cycleTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const navigateTo = useCallback((idx: number) => {
    indexRef.current = idx
    setTransitioning(true)

    if (advanceTimer.current) clearTimeout(advanceTimer.current)
    advanceTimer.current = setTimeout(() => {
      const c = SHOWCASE[idx]
      onSelectRef.current(
        { id: c.code, type: 'country', name: c.name, countryCode: c.code, lat: c.lat, lng: c.lng },
        c.lat, c.lng, c.altitude,
      )
      setCurrentIdx(idx)
      setProgress(0)
      startedAt.current = Date.now()
      setTransitioning(false)
    }, ADVANCE_MS)
  }, [])

  useEffect(() => {
    if (!isActive) return

    navigateTo(0)

    progressTimer.current = setInterval(() => {
      const elapsed = Date.now() - startedAt.current
      setProgress(Math.min(100, (elapsed / DWELL_MS) * 100))
    }, 80)

    cycleTimer.current = setInterval(() => {
      navigateTo((indexRef.current + 1) % SHOWCASE.length)
    }, DWELL_MS)

    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current)
      if (cycleTimer.current) clearInterval(cycleTimer.current)
      if (progressTimer.current) clearInterval(progressTimer.current)
    }
  }, [isActive, navigateTo])

  if (!isActive) return null

  const current = SHOWCASE[currentIdx]

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className="fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-[480px] max-w-[94vw]"
    >
      <div className="glass rounded px-5 py-3 pointer-events-auto" style={{ border: '1px solid rgba(69,224,192,0.22)' }}>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className="relative w-1.5 h-1.5 rounded-full bg-[#45E0C0] flex-shrink-0">
              <span className="absolute inset-0 rounded-full bg-[#45E0C0] animate-ping opacity-60" />
            </span>
            <span className="font-data text-[9px] uppercase tracking-[0.22em] text-[#45E0C0]/60">DEMO SEQUENCE</span>
          </div>
          <button
            onClick={onStop}
            className="font-data text-[9px] uppercase tracking-[0.18em] text-white/30 hover:text-white/65 transition-colors"
          >
            STOP ×
          </button>
        </div>

        <AnimatePresence mode="wait">
          {!transitioning && (
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-baseline gap-3 mb-0.5">
                <h2 className="font-display text-[18px] font-semibold text-white leading-none">{current.name}</h2>
                <span className="font-data text-[10px] text-white/35">{current.code}</span>
              </div>
              <p className="text-[11px] text-white/45">{current.headline}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-3 h-[2px] bg-white/[0.06] overflow-hidden">
          <div className="h-full bg-[#45E0C0]" style={{ width: `${progress}%` }} />
        </div>

        <div className="flex items-center gap-1.5 mt-2.5 justify-center">
          {SHOWCASE.map((c, i) => (
            <button
              key={c.code}
              onClick={() => navigateTo(i)}
              aria-label={c.name}
              className="transition-all"
              style={{
                width: i === currentIdx ? 14 : 4,
                height: 4,
                background: i === currentIdx ? '#45E0C0' : 'rgba(69,224,192,0.25)',
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}
