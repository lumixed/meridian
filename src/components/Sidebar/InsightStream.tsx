'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { CountryData } from '@/types/country'

interface Props {
  entityId: string
  entityType: 'city' | 'country'
  countryData?: CountryData | null
  cityCountry?: string
}

export default function InsightStream({ entityId, entityType, countryData, cityCountry }: Props) {
  const [text, setText] = useState('')
  const [streaming, setStreaming] = useState(true)

  useEffect(() => {
    setText('')
    setStreaming(true)

    const ctrl = new AbortController()
    const p = new URLSearchParams({ type: entityType })

    if (entityType === 'country' && countryData) {
      const d = countryData
      if (d.region) p.set('region', d.region)
      if (d.capital) p.set('capital', d.capital)
      if (d.currency) p.set('currency', d.currency)
      if (d.population_m) p.set('population', String(d.population_m))
      if (d.gdp_billion) p.set('gdp', String(d.gdp_billion))
      if (d.gdpGrowth != null) p.set('gdpGrowth', String(d.gdpGrowth))
      if (d.gdpPerCapita != null) p.set('gdpPerCapita', String(d.gdpPerCapita))
      if (d.inflation != null) p.set('inflation', String(d.inflation))
      if (d.unemployment != null) p.set('unemployment', String(d.unemployment))
      if (d.lifeExpectancy != null) p.set('lifeExpectancy', String(d.lifeExpectancy))
      if (d.risk_score != null) p.set('risk', String(d.risk_score))
    }

    if (entityType === 'city' && cityCountry) {
      p.set('country', cityCountry)
    }

    const timer = setTimeout(() => ctrl.abort(), 20000)

    fetch(`/api/insight/${encodeURIComponent(entityId)}?${p.toString()}`, { signal: ctrl.signal })
      .then(async res => {
        if (!res.ok || !res.body) return
        const reader = res.body.getReader()
        const dec = new TextDecoder()
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          setText(prev => prev + dec.decode(value))
        }
      })
      .catch(() => {})
      .finally(() => {
        clearTimeout(timer)
        setStreaming(false)
      })

    return () => ctrl.abort()
  }, [entityId, entityType, countryData, cityCountry])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.15, duration: 0.2 }}
      className="mt-1 card card--flat p-3.5"
    >
      <div className="section-head mb-3">
        <span className="font-data text-[10px] text-[#45E0C0]/60 leading-none">▍</span>
        <p className="microlabel">AI Intelligence</p>
        {streaming && (
          <span className="font-data text-[8px] uppercase tracking-[0.14em] text-white/50">Analyzing</span>
        )}
      </div>
      <p
        className="text-[12.5px] text-white/65 leading-relaxed"
        aria-live="polite"
        aria-busy={streaming}
      >
        {text || <span className="text-white/48">Analyzing economic signals...</span>}
        {streaming && text && <span className="blink font-data text-[#45E0C0]/70 ml-0.5">▌</span>}
      </p>
    </motion.div>
  )
}
