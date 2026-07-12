'use client'

import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import Globe from 'react-globe.gl'
import type { SelectedEntity } from '@/types/globe'

export interface GlobeCoreProps {
  onEntitySelect: (entity: SelectedEntity | null) => void
  onLoaded: () => void
  flyTo: { lat: number; lng: number; altitude?: number } | null
  selectedEntity: SelectedEntity | null
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

function flagOf(code: string) {
  if (!code || code.length !== 2 || code === '-99') return '🌍'
  try { return String.fromCodePoint(...code.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0))) }
  catch { return '🌍' }
}

export default function GlobeCore({ onEntitySelect, onLoaded, flyTo, selectedEntity }: GlobeCoreProps) {
  const globeRef = useRef<any>(null)
  const onEntitySelectRef = useRef(onEntitySelect)
  const onLoadedRef = useRef(onLoaded)
  useEffect(() => { onEntitySelectRef.current = onEntitySelect }, [onEntitySelect])
  useEffect(() => { onLoadedRef.current = onLoaded }, [onLoaded])

  const [countries, setCountries] = useState<{ features: GeoFeature[] }>({ features: [] })
  const [hoveredCountry, setHoveredCountry] = useState<GeoFeature | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<GeoFeature | null>(null)
  const [dims, setDims] = useState({ w: 800, h: 600 })
  const setupDone = useRef(false)

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
        if (renderer) {
          renderer.toneMapping = 4
          renderer.toneMappingExposure = 3.5
          renderer.shadowMap.enabled = true
        }
        const scene = globeRef.current.scene()
        if (scene) {
          scene.traverse((obj: any) => {
            if (obj.isAmbientLight) { obj.intensity = 5.0; obj.color.setHex(0xfff5e0) }
            if (obj.isDirectionalLight) { obj.intensity = 3.2; obj.color.setHex(0xffe090) }
          })
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

  const polyCapColor = useCallback((f: object) => {
    if (f === selectedCountry) return 'rgba(8,132,108,0.97)'
    if (f === hoveredCountry) return 'rgba(69,224,192,0.22)'
    return 'rgba(255,255,255,0.04)'
  }, [selectedCountry, hoveredCountry])

  const polySideColor = useCallback((f: object) => {
    if (f === selectedCountry) return 'rgba(8,132,108,0.85)'
    if (f === hoveredCountry) return 'rgba(42,199,168,0.30)'
    return 'rgba(0,0,0,0)'
  }, [selectedCountry, hoveredCountry])

  const polyStroke = useCallback((f: object) => {
    if (f === selectedCountry) return '#45E0C0'
    if (f === hoveredCountry) return 'rgba(69,224,192,0.75)'
    return 'rgba(255,255,255,0.14)'
  }, [selectedCountry, hoveredCountry])

  const polyAlt = useCallback((f: object) => {
    if (f === selectedCountry) return 0.18
    if (f === hoveredCountry) return 0.05
    return 0.01
  }, [selectedCountry, hoveredCountry])

  const polyLabel = useCallback((f: object) => {
    const feat = f as GeoFeature
    const iso2 = featureISO2(feat)
    const name = featureName(feat)
    return `<div style="pointer-events:none;background:rgba(5,10,15,0.95);border:1px solid rgba(69,224,192,0.25);border-radius:4px;padding:5px 10px;color:rgba(255,255,255,0.90);font-size:11px;font-family:'IBM Plex Mono',monospace;letter-spacing:0.04em;display:flex;align-items:center;gap:6px;white-space:nowrap"><span style="font-size:14px">${flagOf(iso2)}</span><span style="text-transform:uppercase">${name}</span></div>`
  }, [])

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
