'use client'

import { useState, useEffect } from 'react'

interface Props {
  onStartDemo: () => void
  demoActive: boolean
  onOpenPalette: () => void
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
    <span className="hidden sm:inline font-data text-[11px] text-white/60 whitespace-nowrap select-none">
      {now ?? '--:--:-- UTC'}
    </span>
  )
}

function shortcutLabel() {
  if (typeof navigator === 'undefined') return 'CTRL K'
  return /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent) ? '⌘K' : 'CTRL K'
}

function PaletteTrigger({ onOpen }: { onOpen: () => void }) {
  const [label, setLabel] = useState('⌘K')
  useEffect(() => setLabel(shortcutLabel()), [])

  return (
    <button
      onClick={onOpen}
      aria-label="Open command palette"
      aria-keyshortcuts="Meta+K Control+K"
      className="w-full max-w-[420px] h-8 flex items-center gap-2.5 px-2.5 bg-white/[0.04] border border-[var(--hairline)] rounded hover:border-[rgba(69,224,192,0.35)] transition-colors group"
    >
      <svg className="w-3 h-3 text-[#45E0C0]/50 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <span className="font-data text-[12px] text-white/40 group-hover:text-white/60 transition-colors truncate">
        Search countries, capitals, cities…
      </span>
      <kbd className="ml-auto font-data text-[9px] text-white/48 border border-white/15 rounded px-1.5 py-0.5 flex-shrink-0 hidden sm:block">
        {label}
      </kbd>
    </button>
  )
}

export default function TopBar({ onStartDemo, demoActive, onOpenPalette }: Props) {
  return (
    <header className="fixed top-0 left-0 w-full h-12 z-40 glass border-b border-[var(--hairline)] flex items-center gap-3 px-3 sm:gap-4 sm:px-5">
      <div className="flex items-center gap-2.5 flex-shrink-0 select-none">
        <span className="font-display font-bold text-[15px] tracking-[0.25em] text-white">MERIDIAN</span>
        <span className="text-[#45E0C0] text-[10px] leading-none">◈</span>
        <span className="microlabel hidden md:inline whitespace-nowrap">Global Economic Intelligence</span>
      </div>

      <div className="flex-1 flex justify-center min-w-0">
        <PaletteTrigger onOpen={onOpenPalette} />
      </div>

      <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
        <UtcClock />
        <div className="hidden sm:flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#45E0C0] animate-pulse flex-shrink-0" />
          <span className="microlabel whitespace-nowrap">World Bank · Live</span>
        </div>
        {!demoActive && (
          <button
            onClick={onStartDemo}
            className="font-data text-[10px] tracking-widest uppercase text-white/60 hover:text-white/85 border border-[var(--hairline)] hover:border-[rgba(69,224,192,0.22)] rounded px-2.5 py-1 transition-colors cursor-pointer select-none"
          >
            Demo
          </button>
        )}
      </div>
    </header>
  )
}
