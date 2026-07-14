'use client'

import { motion } from 'framer-motion'

interface Props {
  year: number
  onChange: (year: number) => void
}

const MARKS = [2015, 2017, 2019, 2021, 2023, 2025]

export default function TimelineSlider({ year, onChange }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 glass border border-white/[0.08] rounded px-5 py-3 w-[360px] max-w-[92vw]"
    >
      <div className="flex items-baseline justify-between mb-2">
        <p className="microlabel">HISTORICAL TIMELINE</p>
        <span className="font-data text-[15px] font-semibold text-[#45E0C0] tabular-nums">{year}</span>
      </div>

      <input
        type="range"
        min={2015}
        max={2025}
        step={1}
        value={year}
        aria-label="Timeline year"
        onChange={e => onChange(parseInt(e.target.value, 10))}
        className="w-full cursor-pointer"
        style={{ accentColor: '#45E0C0' }}
      />

      <div className="flex justify-between mt-1.5">
        {MARKS.map(m => (
          <button
            key={m}
            onClick={() => onChange(m)}
            className={`font-data text-[9px] tabular-nums transition-colors ${
              m === year ? 'text-[#45E0C0]/80' : 'text-white/20 hover:text-white/45'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <p className="font-data text-[8px] uppercase tracking-[0.14em] text-white/20 mt-2 text-center">
        WORLD BANK SERIES · SELECT A COUNTRY TO RELOAD
      </p>
    </motion.div>
  )
}
