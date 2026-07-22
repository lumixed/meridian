'use client'

import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import Legend from './Legend'
import type { LayerState } from '@/types/layers'

interface Props {
  layers: LayerState
  onToggle: (layer: keyof LayerState) => void
  legendOffset?: number
}

const LAYERS: { key: keyof LayerState; label: string; desc: string }[] = [
  { key: 'heatmap', label: 'Economic Heatmap', desc: 'GDP per capita gradient' },
  { key: 'tradeRoutes', label: 'Trade Routes', desc: 'Major bilateral flows' },
  { key: 'cityNetwork', label: 'City Network', desc: 'Economic hub connections' },
  { key: 'investment', label: 'Investment Signal', desc: 'Risk-opportunity overlay' },
  { key: 'news', label: 'Economic News', desc: 'Live headlines in the sidebar' },
  { key: 'timeline', label: 'Historical Timeline', desc: 'Year slider 2015–2025' },
]

const ICONS: Record<keyof LayerState, ReactNode> = {
  heatmap: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.1" aria-hidden="true">
      <rect x="1.5" y="1.5" width="11" height="11" />
      <line x1="5.17" y1="1.5" x2="5.17" y2="12.5" />
      <line x1="8.83" y1="1.5" x2="8.83" y2="12.5" />
      <line x1="1.5" y1="5.17" x2="12.5" y2="5.17" />
      <line x1="1.5" y1="8.83" x2="12.5" y2="8.83" />
    </svg>
  ),
  tradeRoutes: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 4.5h10" />
      <path d="M9.5 2 12 4.5 9.5 7" />
      <path d="M12 9.5H2" />
      <path d="M4.5 7 2 9.5 4.5 12" />
    </svg>
  ),
  cityNetwork: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 1.8 12.2 7 7 12.2 1.8 7Z" />
      <circle cx="7" cy="7" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  ),
  investment: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
      <circle cx="7" cy="7" r="5.2" />
      <circle cx="7" cy="7" r="1.8" fill="currentColor" stroke="none" />
    </svg>
  ),
  news: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" aria-hidden="true">
      <line x1="2" y1="4" x2="12" y2="4" />
      <line x1="2" y1="7" x2="12" y2="7" />
      <line x1="2" y1="10" x2="12" y2="10" />
    </svg>
  ),
  timeline: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="7" cy="7" r="5.2" />
      <path d="M7 4v3.2l2.3 1.4" />
    </svg>
  ),
}

export default function LayerControl({ layers, onToggle, legendOffset = 0 }: Props) {
  const activeCount = (Object.keys(layers) as (keyof LayerState)[]).filter(k => layers[k]).length

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.3 }}
        className="fixed left-2 sm:left-3 top-1/2 -translate-y-1/2 z-30 glass border border-white/[0.08] rounded flex flex-col items-center py-2 max-lg:max-h-[calc(100dvh-6.5rem)] max-lg:overflow-y-auto"
      >
        <span className="microlabel mb-1.5">LYR</span>

        <div className="flex flex-col gap-1">
          {LAYERS.map(({ key, label, desc }) => {
            const active = layers[key]
            return (
              <button
                key={key}
                onClick={() => onToggle(key)}
                aria-label={label}
                aria-pressed={active}
                className={`group relative w-7 h-7 sm:w-[34px] sm:h-[34px] flex items-center justify-center transition-colors ${
                  active ? 'text-[#45E0C0] bg-[rgba(69,224,192,0.08)]' : 'text-white/52 hover:text-white/70'
                }`}
              >
                {active && <span className="absolute left-0 top-1 bottom-1 w-[2px] bg-[#45E0C0]" aria-hidden="true" />}
                {ICONS[key]}

                <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2.5 hidden group-hover:block glass border border-white/[0.08] rounded px-2.5 py-1.5 whitespace-nowrap text-left z-10">
                  <span className="microlabel block">{label}</span>
                  <span className="block text-[10px] text-white/50 mt-0.5">{desc}</span>
                </span>
              </button>
            )
          })}
        </div>

        <span className="font-data text-[9px] text-[#45E0C0] tabular-nums mt-1.5">{activeCount}</span>
      </motion.div>

      <Legend layers={layers} offsetRight={legendOffset} />
    </>
  )
}
