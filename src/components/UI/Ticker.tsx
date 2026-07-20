'use client'

import { useEffect, useState } from 'react'

export interface TickerItem {
  code: string
  name: string
  flag: string
  lat: number
  lng: number
  gdpGrowth: number | null
  inflation: number | null
}

interface Props {
  onSelect: (item: TickerItem) => void
}

function TickerEntry({ item, onSelect }: { item: TickerItem; onSelect: (item: TickerItem) => void }) {
  const g = item.gdpGrowth
  const up = g !== null && g >= 0

  return (
    <button
      onClick={() => onSelect(item)}
      className="flex items-center gap-1.5 pl-3 h-8 whitespace-nowrap cursor-pointer hover:bg-white/[0.03] transition-colors"
      title={item.name}
    >
      <span className="text-[11px] leading-none">{item.flag}</span>
      <span className="font-data text-[10px] text-white/60">{item.code}</span>
      {g !== null ? (
        <span className="font-data text-[10px]" style={{ color: up ? 'var(--pos)' : 'var(--danger)' }}>
          {up ? '+' : ''}{g.toFixed(1)}% {up ? '▲' : '▼'}
        </span>
      ) : (
        <span className="font-data text-[10px] text-white/50">—</span>
      )}
      <span className="text-white/15 text-[9px]">·</span>
      <span className="font-data text-[10px] text-white/52">
        CPI {item.inflation !== null ? `${item.inflation.toFixed(1)}%` : '—'}
      </span>
      <span className="text-white/10 text-[10px] pl-3 select-none">│</span>
    </button>
  )
}

export default function Ticker({ onSelect }: Props) {
  const [items, setItems] = useState<TickerItem[]>([])

  useEffect(() => {
    let cancelled = false
    fetch('/api/ticker')
      .then(r => r.json())
      .then(d => { if (!cancelled) setItems(d.items || []) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  return (
    <div className="fixed bottom-0 left-0 w-full h-8 z-40 glass border-t border-[var(--hairline)] flex items-stretch">
      <div className="flex items-center gap-1.5 px-3.5 border-r border-[var(--hairline)] flex-shrink-0 select-none">
        <span className="text-[#45E0C0] text-[10px] leading-none">◈</span>
        <span className="microlabel whitespace-nowrap">Live Macro</span>
      </div>

      {items.length === 0 ? (
        <div className="flex items-center px-4 gap-1">
          <span className="microlabel">Connecting to World Bank feed</span>
          <span className="font-data text-[10px] text-[#45E0C0]/70 blink">▍</span>
        </div>
      ) : (
        <div className="relative flex-1 overflow-hidden">
          <div className="ticker-track items-center h-8">
            {items.map(item => <TickerEntry key={`a-${item.code}`} item={item} onSelect={onSelect} />)}
            {items.map(item => <TickerEntry key={`b-${item.code}`} item={item} onSelect={onSelect} />)}
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-[#04070c] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-[#04070c] to-transparent" />
        </div>
      )}
    </div>
  )
}
