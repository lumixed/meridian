'use client'

import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import Globe, { type GlobeMethods } from 'react-globe.gl'
import { ACESFilmicToneMapping } from 'three'
import { TRADE_ARCS, CITY_ARCS, type ArcDatum } from './arcs'
import { flagEmoji } from '@/lib/flag'
import type { CityDot } from '@/types/city'
import type { SelectedEntity } from '@/types/globe'
import type { LayerState } from '@/types/layers'

export interface GlobeCoreProps {
  onEntitySelect: (entity: SelectedEntity | null) => void
  onLoaded: () => void
  flyTo: { lat: number; lng: number; altitude?: number } | null
  selectedEntity: SelectedEntity | null
  layers: LayerState
}

interface GeoFeature {
  type: string
  properties: { ADMIN: string; NAME: string; ISO_A2: string; [key: string]: unknown }
  geometry: { type: string; coordinates: number[][][] | number[][][][] }
}

function featureName(f: GeoFeature) {
  return (f.properties.ADMIN || f.properties.NAME || f.properties.name || 'Unknown') as string
}

function featureISO2(f: GeoFeature) {
  const c = (f.properties.ISO_A2 || f.properties.iso_a2 || '') as string
  return c === '-99' ? '' : c
}

function getCentroid(geom: GeoFeature['geometry']): [number, number] {
  let ring: number[][] = []
  if (geom.type === 'Polygon') {
    ring = (geom.coordinates as number[][][])[0]
  } else if (geom.type === 'MultiPolygon') {
    let max = 0
    for (const p of geom.coordinates as number[][][][]) {
      if (p[0].length > max) { max = p[0].length; ring = p[0] }
    }
  }
  if (!ring.length) return [0, 0]
  return [
    ring.reduce((s, c) => s + c[1], 0) / ring.length,
    ring.reduce((s, c) => s + c[0], 0) / ring.length,
  ]
}

function heatColor(pct: number): string {
  if (pct >= 0.90) return 'rgba(0,255,140,0.99)'
  if (pct >= 0.75) return 'rgba(50,210,80,0.97)'
  if (pct >= 0.40) return 'rgba(255,195,0,0.97)'
  if (pct >= 0.25) return 'rgba(255,75,0,0.97)'
  return 'rgba(210,15,15,0.99)'
}

export default function GlobeCore({ onEntitySelect, onLoaded, flyTo, selectedEntity, layers }: GlobeCoreProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined)
  const onEntitySelectRef = useRef(onEntitySelect)
  const onLoadedRef = useRef(onLoaded)
  useEffect(() => { onEntitySelectRef.current = onEntitySelect }, [onEntitySelect])
  useEffect(() => { onLoadedRef.current = onLoaded }, [onLoaded])

  const [countries, setCountries] = useState<{ features: GeoFeature[] }>({ features: [] })
  const [cities, setCities] = useState<CityDot[]>([])
  const [hoveredCountry, setHoveredCountry] = useState<GeoFeature | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<GeoFeature | null>(null)
  const [dims, setDims] = useState({ w: 800, h: 600 })
  const [heatmapScores, setHeatmapScores] = useState<Record<string, number>>({})
  const heatFetched = useRef(false)
  const setupDone = useRef(false)

  const { heatmap, tradeRoutes, cityNetwork, investment } = layers

  useEffect(() => {
    const upd = () => setDims({ w: window.innerWidth, h: window.innerHeight })
    upd()
    window.addEventListener('resize', upd)
    return () => window.removeEventListener('resize', upd)
  }, [])

  useEffect(() => {
    fetch('/data/countries.geojson').then(r => r.json()).then(setCountries)
  }, [])

  useEffect(() => {
    fetch('/api/cities')
      .then(r => r.json())
      .then(d => { if (d.success) setCities(d.cities) })
  }, [])

  useEffect(() => {
    if (!(heatmap || investment) || heatFetched.current) return
    heatFetched.current = true
    fetch('/api/heatmap')
      .then(r => r.json())
      .then(d => setHeatmapScores(d.scores ?? {}))
      .catch(() => {})
  }, [heatmap, investment])

  const percentileScores = useMemo(() => {
    const entries = Object.entries(heatmapScores)
    if (entries.length === 0) return {} as Record<string, number>

    const sorted = entries.map(([, v]) => v).sort((a, b) => a - b)
    const n = sorted.length
    const result: Record<string, number> = {}

    for (const [k, v] of entries) {
      let lo = 0
      let hi = n - 1
      let rank = 0
      while (lo <= hi) {
        const mid = (lo + hi) >> 1
        if (sorted[mid] <= v) { rank = mid; lo = mid + 1 } else hi = mid - 1
      }
      result[k] = n > 1 ? rank / (n - 1) : 0.5
    }
    return result
  }, [heatmapScores])

  const arcsData = useMemo<ArcDatum[]>(() => {
    const out: ArcDatum[] = []
    if (tradeRoutes) out.push(...TRADE_ARCS)
    if (cityNetwork) out.push(...CITY_ARCS)
    return out
  }, [tradeRoutes, cityNetwork])

  useEffect(() => {
    if (!countries.features.length) return
    if (!selectedEntity || selectedEntity.type === 'city') { setSelectedCountry(null); return }
    const code = selectedEntity.countryCode
    if (code) {
      const m = countries.features.find(f => featureISO2(f) === code)
      if (m) { setSelectedCountry(m); return }
    }
    const m = countries.features.find(f => featureName(f) === selectedEntity.name)
    if (m) setSelectedCountry(m)
  }, [selectedEntity, countries.features])

  const selectedCentroid = useMemo(() => {
    if (!selectedCountry) return null
    const [lat, lng] = getCentroid(selectedCountry.geometry)
    return { lat, lng }
  }, [selectedCountry])

  const markerData = useMemo(() => selectedCentroid ? [selectedCentroid] : [], [selectedCentroid])

  useEffect(() => {
    if (!countries.features.length || setupDone.current) return
    setupDone.current = true

    setTimeout(() => {
      if (!globeRef.current) return

      const ctrl = globeRef.current.controls()
      if (ctrl) {
        ctrl.autoRotate = true
        ctrl.autoRotateSpeed = 0.25
        ctrl.enableDamping = true
        ctrl.dampingFactor = 0.07
        ctrl.minDistance = 160
        ctrl.maxDistance = 750
      }
      globeRef.current.pointOfView({ altitude: 2.5 }, 0)

      try {
        const renderer = globeRef.current.renderer()
        renderer.toneMapping = ACESFilmicToneMapping
        renderer.toneMappingExposure = 3.5
        renderer.shadowMap.enabled = true

        for (const light of globeRef.current.lights()) {
          if (light.type === 'AmbientLight') {
            light.intensity = 5.0
            light.color.setHex(0xfff5e0)
          }
          if (light.type === 'DirectionalLight') {
            light.intensity = 3.2
            light.color.setHex(0xffe090)
          }
        }
      } catch (e) {
        console.warn('THREE setup skipped:', e)
      }

      onLoadedRef.current()
    }, 800)
  }, [countries.features.length])

  useEffect(() => {
    if (!setupDone.current) return
    const ctrl = globeRef.current?.controls()
    if (!ctrl) return
    const pause = () => { ctrl.autoRotate = false }
    const resume = () => { if (!selectedEntity) setTimeout(() => { ctrl.autoRotate = true }, 4000) }
    ctrl.addEventListener('start', pause)
    ctrl.addEventListener('end', resume)
    return () => {
      ctrl.removeEventListener('start', pause)
      ctrl.removeEventListener('end', resume)
    }
  }, [selectedEntity])

  useEffect(() => {
    if (!flyTo || !globeRef.current) return
    const ctrl = globeRef.current.controls()
    if (ctrl) ctrl.autoRotate = false
    globeRef.current.pointOfView({ lat: flyTo.lat, lng: flyTo.lng, altitude: flyTo.altitude ?? 1.8 }, 1800)
  }, [flyTo])

  const handleCountryClick = useCallback((feat: object) => {
    if (!feat || !globeRef.current) return
    const f = feat as GeoFeature
    const ctrl = globeRef.current.controls()
    if (ctrl) ctrl.autoRotate = false

    const [lat, lng] = getCentroid(f.geometry)
    globeRef.current.pointOfView({ lat, lng, altitude: 1.8 }, 1600)
    setSelectedCountry(f)

    const code = featureISO2(f)
    const name = featureName(f)
    onEntitySelectRef.current({
      id: code || name,
      type: 'country',
      name,
      countryCode: code || undefined,
      lat,
      lng,
    })
  }, [])

  const handleCityClick = useCallback((pt: object) => {
    if (!pt || !globeRef.current) return
    const c = pt as CityDot
    const ctrl = globeRef.current.controls()
    if (ctrl) ctrl.autoRotate = false
    globeRef.current.pointOfView({ lat: c.lat, lng: c.lng, altitude: 1.1 }, 1400)
    onEntitySelectRef.current({
      id: c.cityId,
      type: 'city',
      name: c.name,
      country: c.country,
      lat: c.lat,
      lng: c.lng,
    })
  }, [])

  const cityColor = useCallback((pt: object) => {
    const c = pt as CityDot
    if (selectedCountry && c.country === featureName(selectedCountry)) return '#45E0C0'
    const i = c.pulse_intensity
    return `rgba(${Math.round(60 + 40 * i)},${Math.round(224 * Math.min(1, 0.4 + i))},${Math.round(192 * Math.min(1, 0.4 + i))},${0.6 + i * 0.4})`
  }, [selectedCountry])

  const arcColor = useCallback((d: object) => {
    const a = d as ArcDatum
    if (a.arcType === 'city') return `rgba(178,140,255,${(0.85 + a.weight * 0.14).toFixed(2)})`
    return a.isGlow
      ? `rgba(52,226,196,${(0.1 + a.weight * 0.12).toFixed(3)})`
      : `rgba(72,238,208,${(0.72 + a.weight * 0.26).toFixed(2)})`
  }, [])

  const arcStroke = useCallback((d: object) => {
    const a = d as ArcDatum
    if (a.arcType === 'city') return 1.4 + a.weight * 0.8
    if (a.isGlow) return 12 + a.weight * 8
    return 1.0 + a.weight * 1.0
  }, [])

  const arcAlt = useCallback((d: object) => {
    const a = d as ArcDatum
    if (a.arcType === 'city') return 0.05 + a.weight * 0.08
    const dx = Math.abs(a.endLng - a.startLng)
    const dy = Math.abs(a.endLat - a.startLat)
    return 0.06 + Math.min(0.58, Math.sqrt(dx * dx + dy * dy) / 190)
  }, [])

  const polyCapColor = useCallback((f: object) => {
    const feat = f as GeoFeature
    if (feat === selectedCountry) return 'rgba(8,132,108,0.97)'
    if (feat === hoveredCountry) return 'rgba(69,224,192,0.22)'

    const iso2 = featureISO2(feat)
    const pct = iso2 ? percentileScores[iso2] : undefined

    if (investment && pct !== undefined) {
      if (pct >= 0.75) return 'rgba(34,197,94,0.42)'
      if (pct >= 0.40) return 'rgba(251,191,36,0.32)'
      return 'rgba(239,68,68,0.32)'
    }
    if (heatmap && pct !== undefined) return heatColor(pct)

    return 'rgba(255,255,255,0.04)'
  }, [selectedCountry, hoveredCountry, heatmap, investment, percentileScores])

  const polySideColor = useCallback((f: object) => {
    if (f === selectedCountry) return 'rgba(8,132,108,0.85)'
    if (f === hoveredCountry) return 'rgba(42,199,168,0.30)'
    return 'rgba(0,0,0,0)'
  }, [selectedCountry, hoveredCountry])

  const polyStroke = useCallback((f: object) => {
    if (f === selectedCountry) return '#45E0C0'
    if (f === hoveredCountry) return 'rgba(69,224,192,0.75)'
    if (heatmap || investment) return 'rgba(255,255,255,0.08)'
    return 'rgba(255,255,255,0.14)'
  }, [selectedCountry, hoveredCountry, heatmap, investment])

  const polyAlt = useCallback((f: object) => {
    const feat = f as GeoFeature
    if (feat === selectedCountry) return 0.18
    if (feat === hoveredCountry) return 0.05
    if (heatmap) {
      const iso2 = featureISO2(feat)
      const pct = iso2 ? (percentileScores[iso2] ?? 0) : 0
      return 0.002 + pct * 0.08
    }
    return 0.01
  }, [selectedCountry, hoveredCountry, heatmap, percentileScores])

  const polyLabel = useCallback((f: object) => {
    const feat = f as GeoFeature
    const iso2 = featureISO2(feat)
    const name = featureName(feat)
    const pct = iso2 ? percentileScores[iso2] : undefined
    const scoreStr = (heatmap || investment) && pct !== undefined
      ? `<span style="margin-left:6px;color:rgba(69,224,192,0.85);font-size:9px">TOP ${Math.round((1 - pct) * 100) + 1}%</span>`
      : ''
    return `<div style="pointer-events:none;background:rgba(5,10,15,0.95);border:1px solid rgba(69,224,192,0.25);border-radius:4px;padding:5px 10px;color:rgba(255,255,255,0.90);font-size:11px;font-family:'IBM Plex Mono',monospace;letter-spacing:0.04em;display:flex;align-items:center;gap:6px;white-space:nowrap"><span style="font-size:14px">${flagEmoji(iso2)}</span><span style="text-transform:uppercase">${name}</span>${scoreStr}</div>`
  }, [heatmap, investment, percentileScores])

  const makeMarkerEl = useCallback(() => {
    const el = document.createElement('div')
    el.style.cssText = 'position:relative;width:0;height:0;pointer-events:none;'
    const dot = document.createElement('div')
    dot.style.cssText = `
      position:absolute; left:0; top:0; width:10px; height:10px;
      transform:translate(-50%,-50%); border-radius:50%;
      background:rgba(69,224,192,0.6);
      box-shadow:0 0 6px rgba(69,224,192,0.5);
    `
    el.appendChild(dot)
    const ringSpecs: [number, string, string][] = [
      [90, 'rgba(69,224,192,0.55)', '0s'],
      [140, 'rgba(69,224,192,0.3)', '0.6s'],
    ]
    for (const [size, color, delay] of ringSpecs) {
      const ring = document.createElement('div')
      ring.style.cssText = `
        position:absolute; left:0; top:0; width:${size}px; height:${size}px;
        margin-left:${-size / 2}px; margin-top:${-size / 2}px;
        border:1px solid ${color}; border-radius:50%;
        animation:md-ring 2.2s ease-out infinite;
        animation-delay:${delay};
      `
      el.appendChild(ring)
    }
    return el
  }, [])

  return (
    <Globe
      ref={globeRef}
      width={dims.w}
      height={dims.h}

      globeImageUrl="/globe/earth-night.jpg"
      bumpImageUrl="/globe/earth-topology.png"
      backgroundImageUrl="/globe/night-sky.png"
      atmosphereColor="#2AC7A8"
      atmosphereAltitude={0.22}

      polygonsData={countries.features}
      polygonCapColor={polyCapColor}
      polygonSideColor={polySideColor}
      polygonStrokeColor={polyStroke}
      polygonAltitude={polyAlt}
      polygonLabel={polyLabel}
      onPolygonHover={(f) => setHoveredCountry(f as GeoFeature | null)}
      onPolygonClick={handleCountryClick}

      pointsData={cities}
      pointLat="lat"
      pointLng="lng"
      pointColor={cityColor}
      pointAltitude={(pt: object) => 0.015 + (pt as CityDot).pulse_intensity * 0.028}
      pointRadius={(pt: object) => 0.32 + (pt as CityDot).pulse_intensity * 0.65}
      pointLabel={(pt: object) =>
        `<span style="pointer-events:none;color:#45E0C0;font-size:10px;font-family:'IBM Plex Mono',monospace;letter-spacing:0.04em;padding:2px 8px;background:rgba(5,10,15,0.95);border-radius:4px;border:1px solid rgba(69,224,192,0.25)">${(pt as CityDot).name}</span>`
      }
      onPointClick={handleCityClick}

      ringsData={cities}
      ringLat="lat"
      ringLng="lng"
      ringColor={(pt: object) => `rgba(69,224,192,${0.06 + (pt as CityDot).pulse_intensity * 0.2})`}
      ringMaxRadius={(pt: object) => 2.8 + (pt as CityDot).pulse_intensity * 3.8}
      ringPropagationSpeed={1.4}
      ringRepeatPeriod={(pt: object) => 2200 - (pt as CityDot).pulse_intensity * 1100}

      arcsData={arcsData}
      arcStartLat="startLat"
      arcStartLng="startLng"
      arcEndLat="endLat"
      arcEndLng="endLng"
      arcColor={arcColor}
      arcAltitude={arcAlt}
      arcStroke={arcStroke}
      arcDashLength={(d: object) => (d as ArcDatum).arcType === 'city' ? 0.85 : 0.5}
      arcDashGap={(d: object) => (d as ArcDatum).arcType === 'city' ? 0.3 : 1.8}
      arcDashAnimateTime={(d: object) => (d as ArcDatum).arcType === 'city' ? 6000 : 2000}

      htmlElementsData={markerData}
      htmlLat="lat"
      htmlLng="lng"
      htmlAltitude={0.02}
      htmlElement={makeMarkerEl}
      htmlTransitionDuration={0}

      animateIn={true}
    />
  )
}
