'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { flagEmoji } from '@/lib/country-meta'
import type { CountryData } from '@/types/country'

interface Props {
  codeA: string
  nameA: string
  codeB: string
  nameB: string
}

function useCountry(code: string) {
  const [data, setData] = useState<CountryData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!code) {
      setLoading(false)
      return
    }
    setLoading(true)
    setData(null)
    fetch(`/api/country/${encodeURIComponent(code)}`)
      .then(r => r.json())
      .then(d => { if (d.success) setData(d.country) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [code])

  return { data, loading }
}

interface MetricRowProps {
  label: string
  a: number | null | undefined
  b: number | null | undefined
  suffix?: string
  prefix?: string
  decimals?: number
  higherIsBetter?: boolean
}

function MetricRow({ label, a, b, suffix = '', prefix = '', decimals = 0, higherIsBetter = true }: MetricRowProps) {
  const fmt = (v: number | null | undefined) => {
    if (v == null) return '—'
    const n = decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString()
    return `${prefix}${n}${suffix}`
  }

  const aNum = a ?? null
  const bNum = b ?? null
  const diff = aNum != null && bNum != null ? aNum - bNum : null
  const aWins = diff != null ? (higherIsBetter ? diff > 0 : diff < 0) : null
  const bWins = diff != null ? (higherIsBetter ? diff < 0 : diff > 0) : null

  const maxVal = Math.max(Math.abs(aNum ?? 0), Math.abs(bNum ?? 0), 0.001)
  const aPct = aNum != null ? Math.min(100, (Math.abs(aNum) / maxVal) * 100) : 0
  const bPct = bNum != null ? Math.min(100, (Math.abs(bNum) / maxVal) * 100) : 0

  return (
    <div className="py-2.5 border-b border-white/[0.05] last:border-0">
      <p className="microlabel text-center mb-2">{label}</p>
      <div className="flex items-center gap-0">
        <div className="flex-1 flex items-center justify-end gap-2 pr-2">
          <span
            className="font-data text-[12px] font-semibold"
            style={{ color: aWins ? '#45E0C0' : 'rgba(255,255,255,0.55)' }}
          >
            {fmt(aNum)}
          </span>
          <div className="w-16 h-[3px] bg-white/[0.07] overflow-hidden" style={{ direction: 'rtl' }}>
            <div
              className="h-full transition-all duration-700"
              style={{ width: `${aPct}%`, background: aWins ? '#45E0C0' : 'rgba(255,255,255,0.22)' }}
            />
          </div>
        </div>

        <div className="w-px h-6 bg-white/[0.08] flex-shrink-0" />

        <div className="flex-1 flex items-center gap-2 pl-2">
          <div className="w-16 h-[3px] bg-white/[0.07] overflow-hidden">
            <div
              className="h-full transition-all duration-700"
              style={{ width: `${bPct}%`, background: bWins ? '#2AC7A8' : 'rgba(255,255,255,0.22)' }}
            />
          </div>
          <span
            className="font-data text-[12px] font-semibold"
            style={{ color: bWins ? '#2AC7A8' : 'rgba(255,255,255,0.55)' }}
          >
            {fmt(bNum)}
          </span>
        </div>
      </div>
    </div>
  )
}

function investScore(d: CountryData): number {
  return (d.innovationScore ?? 50) - (d.risk_score ?? 50) + (d.gdpGrowth ?? 0) * 2
}

export default function ComparePanel({ codeA, nameA, codeB, nameB }: Props) {
  const A = useCountry(codeA)
  const B = useCountry(codeB)

  const flagA = flagEmoji(codeA)
  const flagB = flagEmoji(codeB)
  const loading = A.loading || B.loading

  const verdict = A.data && B.data
    ? { aWins: investScore(A.data) >= investScore(B.data), edge: Math.round(Math.abs(investScore(A.data) - investScore(B.data))) }
    : null

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center px-4 py-3 border-b border-white/[0.08] flex-shrink-0 bg-[rgba(4,9,14,0.60)]">
        <div className="flex-1 flex items-center justify-end gap-2 pr-3 min-w-0">
          <span className="font-display text-[12px] font-semibold text-[#45E0C0]/80 truncate">{nameA}</span>
          <span className="text-lg flex-shrink-0">{flagA}</span>
        </div>
        <div className="w-px h-5 bg-white/[0.08] flex-shrink-0" />
        <div className="flex-1 flex items-center gap-2 pl-3 min-w-0">
          <span className="text-lg flex-shrink-0">{flagB}</span>
          <span className="font-display text-[12px] font-semibold text-[#2AC7A8]/80 truncate">{nameB}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-1">
        {loading ? (
          <div className="space-y-3 pt-4">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="h-10 bg-white/[0.03] rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
            <MetricRow
              label="GDP"
              a={A.data?.gdp_billion ? A.data.gdp_billion / 1000 : null}
              b={B.data?.gdp_billion ? B.data.gdp_billion / 1000 : null}
              prefix="$" suffix="T" decimals={2}
            />
            <MetricRow label="Population" a={A.data?.population_m} b={B.data?.population_m} suffix="M" />
            <MetricRow label="GDP per Capita" a={A.data?.gdpPerCapita} b={B.data?.gdpPerCapita} prefix="$" />
            <MetricRow label="GDP Growth" a={A.data?.gdpGrowth} b={B.data?.gdpGrowth} suffix="%" decimals={1} />
            <MetricRow label="Inflation" a={A.data?.inflation} b={B.data?.inflation} suffix="%" decimals={1} higherIsBetter={false} />
            <MetricRow label="Unemployment" a={A.data?.unemployment} b={B.data?.unemployment} suffix="%" decimals={1} higherIsBetter={false} />
            <MetricRow label="Life Expectancy" a={A.data?.lifeExpectancy} b={B.data?.lifeExpectancy} suffix=" yrs" decimals={1} />
            <MetricRow label="Risk Score (lower = better)" a={A.data?.risk_score} b={B.data?.risk_score} suffix="/100" higherIsBetter={false} />
            <MetricRow label="Innovation Index" a={A.data?.innovationScore} b={B.data?.innovationScore} suffix="/100" />

            {verdict && (
              <motion.div
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.2 }}
                className="mt-4 mb-3 card p-3.5"
                style={{ borderLeftColor: verdict.aWins ? 'rgba(69,224,192,0.45)' : 'rgba(42,199,168,0.45)' }}
              >
                <p className="microlabel mb-2">Verdict</p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{verdict.aWins ? flagA : flagB}</span>
                  <div className="min-w-0">
                    <p
                      className="font-display text-[13px] font-semibold"
                      style={{ color: verdict.aWins ? '#45E0C0' : '#2AC7A8' }}
                    >
                      {verdict.aWins ? nameA : nameB}
                    </p>
                    <p className="text-[11px] text-white/45 mt-0.5">
                      Stronger composite signals — growth, risk, and innovation.
                    </p>
                  </div>
                  <span
                    className="ml-auto font-data text-[11px] font-semibold px-2.5 py-1 rounded flex-shrink-0"
                    style={{
                      color: verdict.aWins ? '#45E0C0' : '#2AC7A8',
                      background: verdict.aWins ? 'rgba(69,224,192,0.08)' : 'rgba(42,199,168,0.08)',
                      border: `1px solid ${verdict.aWins ? 'rgba(69,224,192,0.22)' : 'rgba(42,199,168,0.22)'}`,
                    }}
                  >
                    +{verdict.edge} PT EDGE
                  </span>
                </div>
              </motion.div>
            )}

            {(!A.data || !B.data) && (
              <p className="text-center text-[12px] text-white/28 py-6">
                Data unavailable for one or both countries.
              </p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
