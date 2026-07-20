'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import InsightStream from './InsightStream'
import type { CityMetrics } from '@/types/city'

export default function CityView({ cityId }: { cityId: string }) {
  const [city, setCity] = useState<CityMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setCity(null)
    fetch(`/api/city/${encodeURIComponent(cityId)}`)
      .then(r => r.json())
      .then(d => { if (d.success) setCity(d.city) })
      .finally(() => setLoading(false))
  }, [cityId])

  if (loading) return (
    <div className="p-4 space-y-3">
      {[...Array(6)].map((_, i) => <div key={i} className="h-16 rounded bg-white/[0.03] animate-pulse" />)}
    </div>
  )

  if (!city) return <p className="p-6 text-center text-white/48 text-sm">City intelligence unavailable.</p>

  const riskColor = city.risk_score < 30 ? '#3DDC97' : city.risk_score < 60 ? '#45E0C0' : '#FFB020'
  const pulse = Math.round(city.pulse_intensity * 100)

  const startupScore = Math.min(100, Math.round(
    (city.startup_count / 50) * 40 + (city.gdp_billion / 300) * 30 + city.pulse_intensity * 30
  ))
  const econScore = Math.min(100, Math.round(
    city.pulse_intensity * 35 + (city.gdp_billion / 500) * 35 + (100 - city.risk_score) * 0.3
  ))
  const growthSignal = city.pulse_intensity > 0.7 ? 'High Growth' : city.pulse_intensity > 0.45 ? 'Moderate Growth' : 'Stable'
  const growthColor = city.pulse_intensity > 0.7 ? '#3DDC97' : city.pulse_intensity > 0.45 ? '#45E0C0' : '#94a3b8'

  return (
    <div className="p-4 space-y-3">
      <motion.div
        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
        className="card p-3.5"
      >
        <div className="flex items-center justify-between mb-2">
          <p className="microlabel">Economic Pulse</p>
          <span
            className="font-data text-[9px] uppercase tracking-[0.12em] font-semibold px-2 py-0.5 rounded border"
            style={{ color: growthColor, borderColor: `${growthColor}30`, background: `${growthColor}10` }}
          >
            {growthSignal}
          </span>
        </div>
        <p className="font-data text-3xl font-semibold text-[#45E0C0] leading-none">
          {pulse}
          <span className="font-data text-[11px] text-white/48 font-normal ml-1.5">/ 100</span>
        </p>
        <div className="h-[3px] bg-white/[0.07] overflow-hidden mt-3">
          <motion.div
            initial={{ width: 0 }} animate={{ width: `${pulse}%` }}
            transition={{ delay: 0.15, duration: 0.6, ease: 'easeOut' }}
            className="h-full bg-[#45E0C0]"
          />
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-2.5">
        {[
          { label: 'GDP (Est.)', value: `~$${city.gdp_billion}B`, color: '#45E0C0' },
          { label: 'Population (Est.)', value: `~${city.population_m}M`, color: '#45E0C0' },
          { label: 'Startups (Est.)', value: `~${city.startup_count.toLocaleString()}`, color: '#FFB020' },
          { label: 'Trade Volume (Est.)', value: `~$${city.trade_volume_b}B`, color: '#2AC7A8' },
        ].map(({ label, value, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 + i * 0.03, duration: 0.2 }}
            className="card p-3.5"
          >
            <p className="microlabel mb-1.5">{label}</p>
            <p className="font-data text-lg font-semibold leading-none" style={{ color }}>{value}</p>
          </motion.div>
        ))}
      </div>

      {[
        { label: 'Startup Ecosystem', value: startupScore, color: '#FFB020', invert: false },
        { label: 'Economic Score', value: econScore, color: '#2AC7A8', invert: false },
        { label: 'Geopolitical Risk', value: city.risk_score, color: riskColor, invert: true },
      ].map(({ label, value, color, invert }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 + i * 0.04, duration: 0.2 }}
          className="card card--flat p-3.5"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="microlabel">{label}</p>
            <span className="font-data text-[12px] font-semibold" style={{ color }}>
              {value}/100 {invert && value < 30 && '✓'}
            </span>
          </div>
          <div className="h-[3px] bg-white/[0.07] overflow-hidden">
            <motion.div
              initial={{ width: 0 }} animate={{ width: `${value}%` }}
              transition={{ delay: 0.22 + i * 0.05, duration: 0.5, ease: 'easeOut' }}
              className="h-full"
              style={{ background: color }}
            />
          </div>
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26, duration: 0.2 }}
        className="card card--flat p-3.5"
      >
        <div className="section-head mb-3">
          <span className="font-data text-[10px] text-[#45E0C0]/60 leading-none">▍</span>
          <p className="microlabel">City Intelligence</p>
          <span className="font-data text-[8px] text-white/48 tracking-wide">DERIVED FROM ESTIMATES</span>
        </div>
        <div className="space-y-2 text-[12px] text-white/55">
          <div className="flex items-center justify-between">
            <span>GDP per capita (est.)</span>
            <span className="font-data text-[12px] font-medium text-[#45E0C0]">
              ~${city.population_m > 0 ? Math.round(city.gdp_billion * 1000 / city.population_m / 1000) : '—'}K
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Startup density (est.)</span>
            <span className="font-data text-[12px] font-medium text-[#FFB020]">
              ~{city.population_m > 0 ? Math.round(city.startup_count / city.population_m) : '—'} / 1M pop.
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Trade per capita (est.)</span>
            <span className="font-data text-[12px] font-medium text-[#2AC7A8]">
              ~${city.population_m > 0 ? Math.round(city.trade_volume_b * 1000 / city.population_m / 1000) : '—'}K
            </span>
          </div>
        </div>
        <p className="text-[8.5px] text-white/48 mt-3 leading-relaxed">
          City-level metrics are estimates for contextual reference. For verified national data, view the country dashboard.
        </p>
      </motion.div>

      <InsightStream entityId={cityId} entityType="city" cityCountry={city.country} />
    </div>
  )
}
