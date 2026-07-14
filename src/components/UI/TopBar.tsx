'use client'

import { useState, useEffect } from 'react'
import SearchBar from '@/components/UI/SearchBar'
import type { SelectedEntity } from '@/types/globe'

interface Props {
  onSearchSelect: (lat: number, lng: number, entity: SelectedEntity) => void
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function utcNow() {
  const d = new Date()
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`
}

function UtcClock() {
  const [now, setNow] = useState<string | null>(null)

  useEffect(() => {
    setNow(utcNow())
    const t = setInterval(() => setNow(utcNow()), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <span className="hidden sm:inline font-data text-[11px] text-white/50 whitespace-nowrap select-none">
      {now ?? '--:--:-- UTC'}
    </span>
  )
}

export default function TopBar({ onSearchSelect }: Props) {
  return (
    <header className="fixed top-0 left-0 w-full h-12 z-40 glass border-b border-[var(--hairline)] flex items-center gap-3 px-3 sm:gap-4 sm:px-5">
      <div className="flex items-center gap-2.5 flex-shrink-0 select-none">
        <span className="font-display font-bold text-[15px] tracking-[0.25em] text-white">MERIDIAN</span>
        <span className="text-[#45E0C0] text-[10px] leading-none">◈</span>
        <span className="microlabel hidden md:inline whitespace-nowrap">Global Economic Intelligence</span>
      </div>

      <div className="flex-1 flex justify-center min-w-0">
        <SearchBar onSelect={onSearchSelect} />
      </div>

      <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
        <UtcClock />
        <div className="hidden sm:flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#45E0C0] animate-pulse flex-shrink-0" />
          <span className="microlabel whitespace-nowrap">World Bank · Live</span>
        </div>
      </div>
    </header>
  )
}
