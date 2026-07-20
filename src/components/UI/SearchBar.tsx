'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { SelectedEntity } from '@/types/globe'

interface Result {
  id: string
  name: string
  subtitle: string
  lat: number
  lng: number
  type: 'city' | 'country' | 'capital'
  countryCode?: string
}

interface Props {
  onSelect: (lat: number, lng: number, entity: SelectedEntity) => void
}

const TYPE_TAGS: Record<string, string> = {
  country: 'CTRY',
  capital: 'CAP',
  city: 'CITY',
}

const TYPE_COLORS: Record<string, string> = {
  country: 'text-[#45E0C0]/70 border-[#45E0C0]/25',
  capital: 'text-[#FFB020]/70 border-[#FFB020]/25',
  city: 'text-white/50 border-white/15',
}

export default function SearchBar({ onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const d = await r.json()
        setResults(d.results || [])
      } finally {
        setLoading(false)
      }
    }, 280)
    return () => clearTimeout(t)
  }, [query])

  const pick = (r: Result) => {
    setQuery('')
    setResults([])
    setOpen(false)

    const entityType: SelectedEntity['type'] = r.type === 'capital' ? 'country' : r.type
    const entityId = r.type === 'capital' && r.countryCode ? r.countryCode : r.id

    onSelect(r.lat, r.lng, {
      id: entityId,
      type: entityType,
      name: r.name.replace(/^\S+\s/, ''),
      countryCode: r.countryCode,
      lat: r.lat,
      lng: r.lng,
    })
  }

  return (
    <div className="relative w-full max-w-[420px]">
      <div className="relative flex items-center">
        <svg className="absolute left-2.5 w-3 h-3 text-[#45E0C0]/40 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search countries, capitals, cities…"
          className="w-full h-8 bg-white/[0.04] border border-[var(--hairline)] rounded pl-8 pr-8 font-data text-[12px] text-white/75 placeholder-white/25 outline-none focus:border-[rgba(69,224,192,0.35)] transition-colors"
        />
        {loading && (
          <div className="absolute right-3 w-3 h-3 border border-[#45E0C0]/30 border-t-[#45E0C0]/70 rounded-full animate-spin" />
        )}
      </div>

      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.14 }}
            className="absolute top-full mt-1.5 w-full glass rounded overflow-hidden border border-[var(--hairline)]"
          >
            {results.map((r, i) => (
              <button
                key={`${r.type}-${r.id ?? i}`}
                onMouseDown={() => pick(r)}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#45E0C0]/[0.04] transition-colors border-b border-[var(--hairline)] last:border-0 text-left cursor-pointer"
              >
                <span className={`font-data text-[8px] tracking-[0.14em] px-1 py-0.5 rounded-[3px] border flex-shrink-0 ${TYPE_COLORS[r.type] ?? TYPE_COLORS.city}`}>
                  {TYPE_TAGS[r.type] ?? 'CITY'}
                </span>
                <div className="min-w-0">
                  <p className="text-[12.5px] text-white/80 truncate">{r.name}</p>
                  <p className="font-data text-[9px] uppercase tracking-[0.12em] text-white/48 truncate">{r.subtitle}</p>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
