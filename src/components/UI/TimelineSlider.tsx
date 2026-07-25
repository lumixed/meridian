'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

interface Props {
  year: number
  onChange: (year: number) => void
  heatmapActive: boolean
}

const YEAR_MIN = 2015
const YEAR_MAX = 2025
const MARKS = [2015, 2017, 2019, 2021, 2023, 2025]
const STEP_MS = 1100

export default function TimelineSlider({ year, onChange, heatmapActive }: Props) {
  const [playing, setPlaying] = useState(false)

  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange }, [onChange])

  const yearRef = useRef(year)
  useEffect(() => { yearRef.current = year }, [year])

  useEffect(() => {
    if (!playing) return
    const timer = setInterval(() => {
      const next = yearRef.current >= YEAR_MAX ? YEAR_MIN : yearRef.current + 1
      onChangeRef.current(next)
    }, STEP_MS)
    return () => clearInterval(timer)
  }, [playing])

  const pickYear = useCallback((next: number) => {
    setPlaying(false)
    onChangeRef.current(next)
  }, [])

  const caption = heatmapActive
    ? 'World Bank series · globe recolours by GDP per capita'
    : 'World Bank series · enable the heatmap to recolour the globe'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 glass border border-white/[0.08] rounded px-5 py-3 w-[380px] max-w-[92vw]"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setPlaying(p => !p)}
            aria-label={playing ? 'Pause timeline' : 'Play timeline'}
            className="w-6 h-6 rounded flex items-center justify-center border border-[#45E0C0]/25 hover:border-[#45E0C0]/50 bg-[rgba(69,224,192,0.08)] transition-colors flex-shrink-0"
          >
            {playing ? (
              <svg width="8" height="8" viewBox="0 0 8 8" fill="#45E0C0" aria-hidden="true">
                <rect x="0.5" y="0" width="2.5" height="8" rx="0.5" />
                <rect x="5" y="0" width="2.5" height="8" rx="0.5" />
              </svg>
            ) : (
              <svg width="8" height="8" viewBox="0 0 8 8" fill="#45E0C0" aria-hidden="true">
                <polygon points="1,0 8,4 1,8" />
              </svg>
            )}
          </button>
          <p className="microlabel">Historical Timeline</p>
        </div>
        <span className="font-data text-[15px] font-semibold text-[#45E0C0] tabular-nums">{year}</span>
      </div>

      <input
        type="range"
        min={YEAR_MIN}
        max={YEAR_MAX}
        step={1}
        value={year}
        aria-label="Timeline year"
        onChange={e => pickYear(parseInt(e.target.value, 10))}
        className="w-full cursor-pointer"
        style={{ accentColor: '#45E0C0' }}
      />

      <div className="flex justify-between mt-1.5">
        {MARKS.map(m => (
          <button
            key={m}
            onClick={() => pickYear(m)}
            className={`font-data text-[9px] tabular-nums transition-colors ${
              m === year ? 'text-[#45E0C0]/80' : 'text-white/50 hover:text-white/75'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <p className="font-data text-[8px] uppercase tracking-[0.14em] text-white/50 mt-2 text-center">
        {caption}
      </p>
    </motion.div>
  )
}
