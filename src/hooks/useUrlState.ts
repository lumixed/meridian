'use client'

import { useEffect, useRef } from 'react'
import { COUNTRIES_LIST } from '@/data/countries-list'
import type { SelectedEntity } from '@/types/globe'
import { DEFAULT_LAYERS, type LayerState } from '@/types/layers'

const LAYER_KEYS = Object.keys(DEFAULT_LAYERS) as (keyof LayerState)[]

const YEAR_MIN = 2015
const YEAR_MAX = 2025
const YEAR_DEFAULT = 2025

export interface RestoredUrlState {
  selection: SelectedEntity | null
  compare: SelectedEntity | null
  layers: LayerState | null
  year: number | null
}

function countryEntityFromCode(raw: string | null): SelectedEntity | null {
  if (!raw) return null
  const code = raw.trim().toUpperCase()
  if (code.length !== 2) return null

  const country = COUNTRIES_LIST.find(c => c.code === code)
  if (!country) return null

  return {
    id: country.code,
    type: 'country',
    name: country.name,
    countryCode: country.code,
    lat: country.lat,
    lng: country.lng,
  }
}

export function parseUrlState(search: string): RestoredUrlState {
  const params = new URLSearchParams(search)

  const selection = countryEntityFromCode(params.get('c'))
  const compare = selection ? countryEntityFromCode(params.get('vs')) : null

  let layers: LayerState | null = null
  const layersParam = params.get('layers')
  if (layersParam) {
    const next = { ...DEFAULT_LAYERS }
    let any = false
    for (const part of layersParam.split(',')) {
      const key = part.trim() as keyof LayerState
      if (LAYER_KEYS.includes(key)) {
        next[key] = true
        any = true
      }
    }
    if (any) layers = next
  }

  let year: number | null = null
  const yearParam = params.get('year')
  if (yearParam) {
    const parsed = parseInt(yearParam, 10)
    if (Number.isFinite(parsed)) year = Math.min(YEAR_MAX, Math.max(YEAR_MIN, parsed))
  }

  return { selection, compare, layers, year }
}

export function buildUrlQuery(state: {
  selection: SelectedEntity | null
  compare: SelectedEntity | null
  layers: LayerState
  year: number
}): string {
  const parts: string[] = []

  const isLinkable = (e: SelectedEntity | null) =>
    Boolean(e && e.type !== 'city' && e.countryCode && e.countryCode.length === 2)

  if (isLinkable(state.selection)) {
    parts.push(`c=${state.selection!.countryCode!.toUpperCase()}`)
    if (isLinkable(state.compare)) parts.push(`vs=${state.compare!.countryCode!.toUpperCase()}`)
  }

  const active = LAYER_KEYS.filter(k => state.layers[k])
  if (active.length > 0) parts.push(`layers=${active.join(',')}`)

  if (state.layers.timeline && state.year !== YEAR_DEFAULT) parts.push(`year=${state.year}`)

  return parts.length > 0 ? `?${parts.join('&')}` : ''
}

interface UrlStateOptions {
  isLoaded: boolean
  demoActive: boolean
  selectedEntity: SelectedEntity | null
  compareEntity: SelectedEntity | null
  layers: LayerState
  timelineYear: number
  onRestore: (restored: RestoredUrlState) => void
  onFlyTo: (target: { lat: number; lng: number; altitude?: number }) => void
}

export function useUrlState(opts: UrlStateOptions) {
  const { isLoaded, demoActive, selectedEntity, compareEntity, layers, timelineYear, onRestore, onFlyTo } = opts

  const onRestoreRef = useRef(onRestore)
  const onFlyToRef = useRef(onFlyTo)
  useEffect(() => { onRestoreRef.current = onRestore }, [onRestore])
  useEffect(() => { onFlyToRef.current = onFlyTo }, [onFlyTo])

  const pendingFlyToRef = useRef<SelectedEntity | null>(null)
  const didRestoreRef = useRef(false)

  useEffect(() => {
    if (didRestoreRef.current) return
    didRestoreRef.current = true

    const restored = parseUrlState(window.location.search)
    if (restored.selection || restored.compare || restored.layers || restored.year !== null) {
      onRestoreRef.current(restored)
    }
    pendingFlyToRef.current = restored.selection
  }, [])

  useEffect(() => {
    if (!isLoaded || !pendingFlyToRef.current) return
    const { lat, lng } = pendingFlyToRef.current
    pendingFlyToRef.current = null
    onFlyToRef.current({ lat, lng, altitude: 1.8 })
  }, [isLoaded])

  const didInitWriteRef = useRef(false)

  useEffect(() => {
    if (!didInitWriteRef.current) {
      didInitWriteRef.current = true
      return
    }
    if (demoActive) return

    const query = buildUrlQuery({
      selection: selectedEntity,
      compare: compareEntity,
      layers,
      year: timelineYear,
    })
    if (window.location.search === query) return

    window.history.replaceState(null, '', window.location.pathname + query + window.location.hash)
  }, [selectedEntity, compareEntity, layers, timelineYear, demoActive])
}
