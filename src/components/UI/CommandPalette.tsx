'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDialog } from '@/hooks/useDialog'
import type { SelectedEntity } from '@/types/globe'
import type { LayerState } from '@/types/layers'

interface SearchResult {
  id: string
  name: string
  subtitle: string
  lat: number
  lng: number
  type: 'country' | 'capital' | 'city'
  countryCode?: string
}

interface Command {
  id: string
  label: string
  hint: string
  run: () => void
}

interface Props {
  open: boolean
  onClose: () => void
  onSelect: (lat: number, lng: number, entity: SelectedEntity) => void
  layers: LayerState
  onToggleLayer: (key: keyof LayerState) => void
  onStartDemo: () => void
}

const LAYER_LABELS: Record<keyof LayerState, string> = {
  heatmap: 'Economic Heatmap',
  tradeRoutes: 'Trade Routes',
  cityNetwork: 'City Network',
  investment: 'Investment Signal',
  news: 'Economic News',
  timeline: 'Historical Timeline',
}

const TYPE_TAGS: Record<SearchResult['type'], string> = {
  country: 'CTRY',
  capital: 'CAP',
  city: 'CITY',
}

export default function CommandPalette({ open, onClose, onSelect, layers, onToggleLayer, onStartDemo }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [active, setActive] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const dialogRef = useDialog<HTMLDivElement>(open, onClose)

  useEffect(() => {
    if (!open) return
    setQuery('')
    setResults([])
    setActive(0)
    const t = setTimeout(() => inputRef.current?.focus(), 30)
    return () => clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open || !query.trim()) {
      setResults([])
      return
    }
    const ctrl = new AbortController()
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: ctrl.signal })
        const d = await res.json()
        setResults(d.results ?? [])
        setActive(0)
      } catch {}
    }, 180)
    return () => {
      clearTimeout(t)
      ctrl.abort()
    }
  }, [query, open])

  const commands = useMemo<Command[]>(() => {
    const layerCommands = (Object.keys(LAYER_LABELS) as (keyof LayerState)[]).map(key => ({
      id: `layer:${key}`,
      label: `${layers[key] ? 'Hide' : 'Show'} ${LAYER_LABELS[key]}`,
      hint: 'Layer',
      run: () => onToggleLayer(key),
    }))

    return [...layerCommands, { id: 'demo', label: 'Start demo tour', hint: 'Action', run: onStartDemo }]
  }, [layers, onToggleLayer, onStartDemo])

  const visibleCommands = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter(c => c.label.toLowerCase().includes(q))
  }, [commands, query])

  const rowCount = results.length + visibleCommands.length

  const runRow = useCallback((index: number) => {
    if (index < results.length) {
      const r = results[index]
      const type: SelectedEntity['type'] = r.type === 'capital' ? 'country' : r.type
      const id = r.type === 'capital' && r.countryCode ? r.countryCode : r.id
      onSelect(r.lat, r.lng, {
        id,
        type,
        name: r.name.replace(/^\S+\s/, ''),
        countryCode: r.countryCode,
        lat: r.lat,
        lng: r.lng,
      })
    } else {
      visibleCommands[index - results.length]?.run()
    }
    onClose()
  }, [results, visibleCommands, onSelect, onClose])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActive(i => (rowCount === 0 ? 0 : (i + 1) % rowCount))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActive(i => (rowCount === 0 ? 0 : (i - 1 + rowCount) % rowCount))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (rowCount > 0) runRow(active)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, rowCount, active, runRow])

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [active])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4"
          style={{ background: 'rgba(2,5,9,0.72)' }}
          onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="w-full max-w-[560px] glass rounded-lg overflow-hidden border border-[rgba(69,224,192,0.18)]"
            style={{ boxShadow: '0 30px 90px rgba(0,0,0,0.7)' }}
          >
            <div className="flex items-center gap-2.5 px-4 h-12 border-b border-[var(--hairline)]">
              <span className="font-data text-[11px] text-[#45E0C0]/70">›</span>
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Jump to a country, or run a command…"
                aria-label="Search countries or run a command"
                className="flex-1 bg-transparent outline-none font-data text-[13px] text-white/85 placeholder-white/35"
              />
              <kbd className="font-data text-[9px] text-white/48 border border-white/15 rounded px-1.5 py-0.5">ESC</kbd>
            </div>

            <div ref={listRef} className="max-h-[46vh] overflow-y-auto py-1.5">
              {rowCount === 0 && (
                <p className="px-4 py-6 text-center text-[12px] text-white/48">No matches.</p>
              )}

              {results.map((r, i) => (
                <button
                  key={`${r.type}-${r.id}`}
                  data-active={active === i}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => runRow(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                    active === i ? 'bg-[rgba(69,224,192,0.08)]' : 'hover:bg-white/[0.03]'
                  }`}
                >
                  <span className="font-data text-[8px] tracking-[0.14em] px-1 py-0.5 rounded-[3px] border border-[#45E0C0]/25 text-[#45E0C0]/70 flex-shrink-0">
                    {TYPE_TAGS[r.type]}
                  </span>
                  <span className="text-[13px] text-white/85 truncate">{r.name}</span>
                  <span className="font-data text-[9px] uppercase tracking-[0.1em] text-white/48 truncate ml-auto">
                    {r.subtitle}
                  </span>
                </button>
              ))}

              {visibleCommands.map((c, i) => {
                const index = results.length + i
                return (
                  <button
                    key={c.id}
                    data-active={active === index}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => runRow(index)}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                      active === index ? 'bg-[rgba(69,224,192,0.08)]' : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    <span className="font-data text-[8px] tracking-[0.14em] px-1 py-0.5 rounded-[3px] border border-white/15 text-white/50 flex-shrink-0">
                      {c.hint.toUpperCase()}
                    </span>
                    <span className="text-[13px] text-white/80 truncate">{c.label}</span>
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-3 px-4 h-8 border-t border-[var(--hairline)]">
              <span className="microlabel">↑↓ navigate</span>
              <span className="microlabel">↵ select</span>
              <span className="microlabel ml-auto">⌘K</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
