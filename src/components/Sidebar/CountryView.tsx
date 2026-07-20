'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import InsightStream from './InsightStream'
import InvestmentReport from './InvestmentReport'
import NewsPanel from './NewsPanel'
import Sparkline from '@/components/UI/Sparkline'
import { useCountUp } from '@/hooks/useCountUp'
import { TERRITORY_INFO } from '@/data/territories'
import type { HistoryPayload } from '@/app/api/history/[countryCode]/route'
import type { AnchorBriefing } from '@/types/briefing'
import type { CountryData } from '@/types/country'

interface Props {
  countryCode: string
  countryName: string
  showNews?: boolean
  timelineYear?: number
  onCompare?: () => void
}

const SOURCE_STYLES = {
  live: { color: '#3DDC97', label: 'Verified · World Bank' },
  mixed: { color: '#FFB020', label: 'Partly cached · World Bank' },
  snapshot: { color: '#FFB020', label: 'Cached snapshot' },
} as const

function SourceBadge({ source, year }: { source: NonNullable<CountryData['source']>; year?: number }) {
  const { color, label } = SOURCE_STYLES[source]
  const title = source === 'live'
    ? 'Every indicator came straight from the World Bank API.'
    : 'The World Bank API did not return every indicator, so the gaps are filled from a bundled snapshot.'

  return (
    <span
      title={title}
      className="font-data text-[8px] uppercase tracking-[0.12em] px-2 py-1 rounded flex items-center gap-1.5 ml-auto flex-shrink-0"
      style={{ background: `${color}0f`, border: `1px solid ${color}38`, color }}
    >
      {source === 'live' ? (
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
          <path d="M1.5 4L3 5.5L6.5 2" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
          <circle cx="4" cy="4" r="3" stroke={color} strokeWidth="1" />
          <path d="M4 2.2V4l1.2.9" stroke={color} strokeWidth="1" strokeLinecap="round" />
        </svg>
      )}
      {label}{year ? ` ${year}` : ''}
    </span>
  )
}

function SectionHead({ title, aside, className = 'mb-3' }: { title: string; aside?: string; className?: string }) {
  return (
    <div className={`section-head ${className}`}>
      <span className="font-data text-[10px] text-[#45E0C0]/60 leading-none">▍</span>
      <p className="microlabel">{title}</p>
      {aside && <span className="font-data text-[8px] text-white/48 tracking-wide">{aside}</span>}
    </div>
  )
}

function TrendCard({ countryCode }: { countryCode: string }) {
  const [hist, setHist] = useState<HistoryPayload | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setHist(null)
    fetch(`/api/history/${encodeURIComponent(countryCode)}`)
      .then(r => r.json())
      .then((d: HistoryPayload) => setHist(d))
      .catch(() => setHist(null))
      .finally(() => setLoading(false))
  }, [countryCode])

  if (loading) return (
    <div className="card card--flat p-3.5">
      <SectionHead title="10Y Trend" aside="2015–2025" />
      <div className="space-y-3">
        <div className="h-12 bg-white/[0.03] rounded animate-pulse" />
        <div className="h-12 bg-white/[0.03] rounded animate-pulse" />
      </div>
    </div>
  )

  if (!hist || hist.years.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
      className="card card--flat p-3.5"
    >
      <SectionHead title="10Y Trend" aside="WORLD BANK · 2015–2025" />
      <div className="space-y-4">
        <div>
          <p className="microlabel mb-1">GDP Growth</p>
          <Sparkline values={hist.gdpGrowth} years={hist.years} color="var(--accent)" zeroLine suffix="%" />
        </div>
        <div>
          <p className="microlabel mb-1">Inflation</p>
          <Sparkline values={hist.inflation} years={hist.years} color="var(--accent2)" suffix="%" />
        </div>
      </div>
    </motion.div>
  )
}

interface TradeData {
  exports_b: number | null
  imports_b: number | null
  balance_b: number | null
  trade_pct: number | null
  partners: string[]
}

function TradePanel({ countryCode }: { countryCode: string }) {
  const [data, setData] = useState<TradeData | null>(null)

  useEffect(() => {
    setData(null)
    fetch(`/api/trade/${encodeURIComponent(countryCode)}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
  }, [countryCode])

  if (!data) return <div className="card card--flat p-3.5 animate-pulse h-28" />

  const balanceColor = !data.balance_b ? '#45E0C0' : data.balance_b >= 0 ? '#3DDC97' : '#FF5D5D'

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
      className="card card--flat p-3.5"
    >
      <SectionHead title="Trade Intelligence" />

      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: 'Exports', v: data.exports_b, prefix: '$', color: undefined as string | undefined },
          { label: 'Imports', v: data.imports_b, prefix: '$', color: undefined as string | undefined },
          {
            label: 'Balance',
            v: data.balance_b,
            prefix: data.balance_b != null && data.balance_b >= 0 ? '+$' : '$',
            color: balanceColor,
          },
        ].map(({ label, v, prefix, color }) => (
          <div key={label} className="text-center">
            <p className="microlabel">{label}</p>
            <p className="font-data text-[13px] font-semibold mt-0.5" style={{ color: color ?? '#45E0C0' }}>
              {v != null ? `${prefix}${Math.abs(v)}B` : '—'}
            </p>
          </div>
        ))}
      </div>

      {data.trade_pct != null && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="microlabel">Trade Openness</span>
            <span className="font-data text-[11px] font-semibold text-[#2AC7A8]">{data.trade_pct}% OF GDP</span>
          </div>
          <div className="h-[2px] bg-white/[0.07] overflow-hidden">
            <div className="h-full bg-[#2AC7A8]" style={{ width: `${Math.min(100, data.trade_pct)}%` }} />
          </div>
        </div>
      )}

      {data.partners.length > 0 && (
        <div>
          <p className="microlabel mb-2">Top Trade Partners</p>
          <div className="flex flex-wrap gap-1.5">
            {data.partners.slice(0, 7).map((p, i) => (
              <span
                key={p}
                className="font-data text-[9px] uppercase tracking-[0.08em] px-2 py-0.5 rounded border"
                style={{
                  borderColor: `rgba(42,199,168,${0.35 - i * 0.04})`,
                  color: `rgba(69,224,192,${0.8 - i * 0.08})`,
                  background: `rgba(42,199,168,${0.04 - i * 0.004})`,
                }}
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-white/[0.05]">
        <p className="text-[9px] text-white/50 leading-relaxed">
          <span className="font-data text-[#2AC7A8]/50">▸</span> Enable{' '}
          <span className="text-[#2AC7A8]/50">Trade Routes</span> in the layer panel to visualise bilateral flows on the
          globe. Routes are weighted by trade volume — thicker arcs indicate higher dependency.
        </p>
      </div>
    </motion.div>
  )
}

function BriefSection({ countryCode, countryName, data }: {
  countryCode: string
  countryName: string
  data: CountryData | null
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [brief, setBrief] = useState<AnchorBriefing | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    setOpen(false)
    setBrief(null)
    setError(false)
  }, [countryCode])

  const handleBrief = useCallback(async () => {
    if (open) {
      setOpen(false)
      return
    }
    setOpen(true)
    if (brief) return

    setLoading(true)
    setError(false)
    try {
      const res = await fetch(`/api/anchor/${encodeURIComponent(countryCode)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryName,
          articles: [],
          capital: data?.capital ?? null,
          region: data?.region ?? null,
          gdp: data?.gdp_billion ?? null,
          gdpGrowth: data?.gdpGrowth ?? null,
          population: data?.population_m ?? null,
          inflation: data?.inflation ?? null,
          unemployment: data?.unemployment ?? null,
          gdpPerCapita: data?.gdpPerCapita ?? null,
        }),
      })
      if (!res.ok) throw new Error('brief API error')
      setBrief(await res.json())
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [countryCode, countryName, data, open, brief])

  return (
    <div>
      <motion.button
        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.2 }}
        onClick={handleBrief}
        className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded border border-[#45E0C0]/22 bg-transparent hover:bg-[rgba(69,224,192,0.06)] transition-colors group"
      >
        <span className="font-data text-[10px] text-[#45E0C0]/60 leading-none">{open ? '▾' : '▸'}</span>
        <span className="font-data text-[10px] uppercase tracking-[0.18em] text-[#45E0C0]/70 group-hover:text-[#45E0C0] transition-colors">
          Brief Me
        </span>
        <span className="font-data text-[8px] uppercase tracking-[0.14em] text-white/48 ml-auto">Text Summary</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 rounded p-4 space-y-3 border border-[#45E0C0]/10" style={{ background: 'rgba(8,14,24,0.97)' }}>
              {loading && (
                <div className="flex items-center gap-2 py-2">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className="w-1 h-1 rounded-full bg-[#45E0C0]/50"
                        style={{
                          animationName: 'md-wave',
                          animationDuration: '0.8s',
                          animationTimingFunction: 'ease-in-out',
                          animationIterationCount: 'infinite',
                          animationDirection: 'alternate',
                          animationDelay: `${i * 0.2}s`,
                        }}
                      />
                    ))}
                  </div>
                  <span className="font-data text-[9px] uppercase tracking-[0.14em] text-white/52">Generating summary</span>
                </div>
              )}

              {error && (
                <p className="text-[11px] text-white/52 py-1">
                  Summary unavailable. Try the AI Anchor for a full audio briefing.
                </p>
              )}

              {brief && !loading && (
                <>
                  <p className="font-data text-[10px] text-[#45E0C0]/70 uppercase tracking-[0.12em] leading-snug">
                    {brief.headline}
                  </p>

                  <p className="text-[11.5px] text-white/65 leading-relaxed">{brief.script}</p>

                  {brief.keyTakeaways.length > 0 && (
                    <div>
                      <p className="microlabel mb-1.5">Key Takeaways</p>
                      <div className="space-y-1">
                        {brief.keyTakeaways.map((t, i) => (
                          <div key={i} className="flex items-start gap-1.5">
                            <span className="font-data text-[#45E0C0]/45 text-[9px] flex-shrink-0 mt-0.5">▸</span>
                            <p className="text-[10.5px] text-white/55 leading-snug">{t}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {brief.investmentOutlook && (
                    <div
                      className="rounded px-3 py-2"
                      style={{ background: 'rgba(69,224,192,0.05)', border: '1px solid rgba(69,224,192,0.12)' }}
                    >
                      <p className="microlabel mb-0.5">Investment Outlook</p>
                      <p className="text-[10.5px] text-[#45E0C0]/72 leading-snug">{brief.investmentOutlook}</p>
                    </div>
                  )}

                  {(brief.risks.length > 0 || brief.opportunities.length > 0) && (
                    <div className="grid grid-cols-2 gap-2">
                      {brief.risks.length > 0 && (
                        <div>
                          <p className="font-data text-[9px] uppercase tracking-[0.18em] text-[#FF5D5D]/50 mb-1">Risks</p>
                          {brief.risks.map((r, i) => (
                            <p key={i} className="text-[9.5px] text-white/55 leading-snug flex items-start gap-1">
                              <span className="text-[#FF5D5D]/45 flex-shrink-0">●</span>{r}
                            </p>
                          ))}
                        </div>
                      )}
                      {brief.opportunities.length > 0 && (
                        <div>
                          <p className="font-data text-[9px] uppercase tracking-[0.18em] text-[#3DDC97]/50 mb-1">Opportunities</p>
                          {brief.opportunities.map((o, i) => (
                            <p key={i} className="text-[9.5px] text-white/55 leading-snug flex items-start gap-1">
                              <span className="text-[#3DDC97]/45 flex-shrink-0">●</span>{o}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function StatCard({ label, value, suffix = '', prefix = '', color = '#45E0C0', delay = 0, decimals = 0, source }: {
  label: string
  value: number
  suffix?: string
  prefix?: string
  color?: string
  delay?: number
  decimals?: number
  source?: string
}) {
  const animated = useCountUp(Math.round(value * Math.pow(10, decimals)), 1000, delay)
  const display = decimals > 0
    ? (animated / Math.pow(10, decimals)).toFixed(decimals)
    : animated.toLocaleString()

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay / 1000 + 0.05, duration: 0.2 }}
      className="card p-3.5 hover:bg-white/[0.035] transition-colors"
    >
      <p className="microlabel mb-1.5">{label}</p>
      <p className="font-data text-lg font-semibold leading-none" style={{ color }}>{prefix}{display}{suffix}</p>
      {source && <p className="font-data text-[8px] text-white/48 mt-1.5 uppercase tracking-wide">{source}</p>}
    </motion.div>
  )
}

function BarCard({ label, value, max = 100, unit = '', delay = 0, color = '#2AC7A8', source }: {
  label: string
  value: number
  max?: number
  unit?: string
  delay?: number
  color?: string
  source?: string
}) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay / 1000 + 0.05, duration: 0.2 }}
      className="card card--flat p-3.5"
    >
      <div className="flex items-center justify-between mb-2">
        <p className="microlabel">{label}</p>
        <span className="font-data text-[12px] font-semibold" style={{ color }}>{value}{unit}</span>
      </div>
      <div className="h-[3px] bg-white/[0.07] overflow-hidden">
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ delay: delay / 1000 + 0.25, duration: 0.6, ease: 'easeOut' }}
          className="h-full"
          style={{ background: color }}
        />
      </div>
      {source && <p className="font-data text-[8px] text-white/48 mt-1.5 uppercase tracking-wide">{source}</p>}
    </motion.div>
  )
}

function Dash({ label }: { label: string }) {
  return (
    <div className="card card--flat p-3.5">
      <p className="microlabel mb-1.5">{label}</p>
      <p className="font-data text-lg font-semibold text-white/15 leading-none">—</p>
    </div>
  )
}

function InvestmentBadge({ risk }: { risk: number }) {
  const s = risk < 30
    ? { label: 'Strong Opportunity', color: '#3DDC97' }
    : risk < 60
    ? { label: 'Moderate Risk', color: '#45E0C0' }
    : { label: 'High Risk Market', color: '#FFB020' }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.2 }}
      className="card px-3.5 py-3 flex items-center gap-3"
      style={{ borderLeftColor: s.color }}
    >
      <span className="text-[10px] leading-none" style={{ color: s.color }}>●</span>
      <div className="flex-1">
        <p className="microlabel">Investment Signal</p>
        <p className="font-data text-[12px] font-semibold mt-0.5" style={{ color: s.color }}>{s.label}</p>
      </div>
      <span className="font-data text-[11px] font-semibold" style={{ color: s.color }}>{risk}/100</span>
    </motion.div>
  )
}

function DataUnavailable({ name, countryCode, onRetry }: {
  name: string
  countryCode: string
  onRetry: () => void
}) {
  const info = TERRITORY_INFO[countryCode.toUpperCase()]

  return (
    <div className="p-4 space-y-3">
      <div className="card card--flat p-3.5">
        <p className="font-display text-[15px] font-semibold text-white/60">{name}</p>
        {info && <p className="font-data text-[10px] uppercase tracking-[0.12em] text-[#45E0C0]/50 mt-1">{info.type}</p>}
      </div>

      {info && (
        <div className="card card--flat p-3.5 space-y-2.5">
          <SectionHead title="Geographic Information" />
          <div className="space-y-2 text-[12px] text-white/50">
            <p className="font-data text-[11px] text-white/55">{info.geo}</p>
            <p className="text-white/50 leading-relaxed">{info.note}</p>
            {info.stations && <p className="font-data text-[10px] text-white/50">{info.stations}</p>}
          </div>
        </div>
      )}

      <div className="card p-3.5" style={{ borderLeftColor: 'rgba(255,176,32,0.45)' }}>
        <p className="microlabel mb-2" style={{ color: 'rgba(255,176,32,0.55)' }}>Data Coverage Status</p>
        <p className="text-[12px] text-white/52 leading-relaxed">
          {info?.coverage ?? 'No indicators came back for this selection. That usually means the World Bank does not publish data for this territory, but it can also happen when the upstream feed is briefly unavailable.'}
        </p>
        {!info && (
          <button
            onClick={onRetry}
            className="mt-3 font-data text-[10px] uppercase tracking-[0.14em] text-[#45E0C0]/60 hover:text-[#45E0C0] transition-colors"
          >
            ↺ Retry
          </button>
        )}
      </div>
    </div>
  )
}

export default function CountryView({ countryCode, countryName, showNews = false, timelineYear, onCompare }: Props) {
  const [data, setData] = useState<CountryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    setLoading(true)
    setData(null)
    const base = `/api/country/${encodeURIComponent(countryCode)}`
    fetch(timelineYear ? `${base}?year=${timelineYear}` : base)
      .then(r => r.json())
      .then(d => { if (d.success) setData(d.country) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [countryCode, timelineYear, attempt])

  if (loading) return (
    <div className="p-4 space-y-3">
      {[...Array(7)].map((_, i) => <div key={i} className="h-16 rounded bg-white/[0.03] animate-pulse" />)}
    </div>
  )

  const indicators: (number | null | undefined)[] = [
    data?.gdp_billion || null,
    data?.population_m || null,
    data?.gdpPerCapita,
    data?.gdpGrowth,
    data?.inflation,
    data?.unemployment,
    data?.lifeExpectancy,
  ]
  const hasData = indicators.some(v => v != null)

  if (!hasData) {
    return (
      <DataUnavailable
        name={countryName}
        countryCode={countryCode}
        onRetry={() => setAttempt(n => n + 1)}
      />
    )
  }

  const pop = data?.population_m ?? 0
  const gdp = data?.gdp_billion ?? 0
  const risk = data?.risk_score ?? 50
  const riskColor = risk < 30 ? '#3DDC97' : risk < 60 ? '#45E0C0' : '#FFB020'
  const innovation = data?.innovationScore ?? 0
  const wbYear = data?.dataYear ? ` ${data.dataYear}` : ''
  const wbSrc = (indicator: string) => `World Bank${wbYear} · ${indicator}`
  const metaParts = [data?.region, data?.capital, data?.currency].filter(Boolean) as string[]

  return (
    <div className="p-4 space-y-3">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
        className="flex items-center gap-2 flex-wrap"
      >
        <p className="microlabel flex items-center gap-1.5 min-w-0">
          {metaParts.map((part, i) => (
            <span key={i} className="flex items-center gap-1.5 min-w-0">
              {i > 0 && <span className="text-white/48">·</span>}
              <span className="truncate">{part}</span>
            </span>
          ))}
          {timelineYear && (
            <span className="flex items-center gap-1.5">
              <span className="text-white/48">·</span>
              <span className="text-[#45E0C0]/60">{timelineYear}</span>
            </span>
          )}
        </p>
        <SourceBadge source={data?.source ?? 'live'} year={data?.dataYear} />
      </motion.div>

      <InvestmentBadge risk={risk} />

      <BriefSection countryCode={countryCode} countryName={countryName} data={data} />

      <InvestmentReport
        countryCode={countryCode}
        countryName={countryName}
        countryData={data}
        flag={data?.flag ?? ''}
      />

      {onCompare && (
        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15, duration: 0.2 }}
          onClick={onCompare}
          className="w-full flex items-center gap-2 px-3.5 py-2 rounded border border-white/[0.08] hover:border-[#45E0C0]/22 hover:bg-[rgba(69,224,192,0.06)] transition-colors group"
        >
          <span className="font-data text-[10px] text-white/48 group-hover:text-[#45E0C0]/60 leading-none transition-colors">▸</span>
          <span className="font-data text-[10px] uppercase tracking-[0.18em] text-white/52 group-hover:text-white/60 transition-colors">
            Compare with another country
          </span>
        </motion.button>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        {pop > 0
          ? <StatCard label="Population" value={pop} suffix="M" delay={0} color="#E8ECF2" source={wbSrc('SP.POP.TOTL')} />
          : <Dash label="Population" />}
        {gdp > 0
          ? <StatCard label="GDP" value={parseFloat((gdp / 1000).toFixed(2))} prefix="$" suffix="T" decimals={2} color="#45E0C0" delay={80} source={wbSrc('NY.GDP.MKTP.CD')} />
          : <Dash label="GDP" />}
        {data?.gdpPerCapita != null
          ? <StatCard label="GDP / Capita" value={data.gdpPerCapita} prefix="$" delay={160} color="#2AC7A8" source={wbSrc('NY.GDP.PCAP.CD')} />
          : <Dash label="GDP / Capita" />}
        {data?.gdpGrowth != null
          ? <StatCard label="GDP Growth" value={data.gdpGrowth} suffix="%" decimals={1} delay={240}
              color={data.gdpGrowth >= 0 ? '#3DDC97' : '#FF5D5D'} source={wbSrc('NY.GDP.MKTP.KD.ZG')} />
          : <Dash label="GDP Growth" />}
        {data?.inflation != null
          ? <StatCard label="Inflation (CPI)" value={data.inflation} suffix="%" decimals={1} delay={320}
              color={data.inflation > 8 ? '#FFB020' : data.inflation > 4 ? '#45E0C0' : '#3DDC97'} source={wbSrc('FP.CPI.TOTL.ZG')} />
          : <Dash label="Inflation" />}
        {data?.unemployment != null
          ? <StatCard label="Unemployment" value={data.unemployment} suffix="%" decimals={1} delay={400}
              color={data.unemployment > 10 ? '#FFB020' : data.unemployment > 6 ? '#45E0C0' : '#3DDC97'} source={wbSrc('SL.UEM.TOTL.ZS')} />
          : <Dash label="Unemployment" />}
      </div>

      <TrendCard countryCode={countryCode} />

      <AnimatePresence>
        {showNews && (
          <motion.div
            key="news"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <NewsPanel countryCode={countryCode} />
          </motion.div>
        )}
      </AnimatePresence>

      {data?.lifeExpectancy != null && (
        <BarCard label="Life Expectancy" value={data.lifeExpectancy} max={90} unit=" YRS" delay={450} color="#8FB6FF" source={wbSrc('SP.DYN.LE00.IN')} />
      )}

      <BarCard label="Risk Score" value={risk} max={100} unit="/100" delay={500} color={riskColor}
        source="Meridian composite · inflation + unemployment + GDP growth" />
      {innovation > 0 && (
        <BarCard label="Innovation Index" value={innovation} max={100} unit="/100" delay={550} color="#2AC7A8"
          source="Meridian composite · GDP per capita + life expectancy" />
      )}

      <TradePanel countryCode={countryCode} />

      {data?.cities && data.cities.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22, duration: 0.2 }}
          className="card card--flat p-3.5"
        >
          <SectionHead title="Economic Hubs" />
          <div className="space-y-2.5">
            {data.cities.slice(0, 6).map((city, i) => (
              <motion.div
                key={city.cityId}
                initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.24 + i * 0.04, duration: 0.18 }}
                className="flex items-center gap-3"
              >
                <span className="text-[12px] text-white/65 flex-1">{city.name}</span>
                <div className="flex items-center gap-1.5">
                  <div
                    className="h-[2px]"
                    style={{
                      width: `${Math.round(city.pulse_intensity * 64)}px`,
                      background: `rgba(69,224,192,${0.2 + city.pulse_intensity * 0.8})`,
                    }}
                  />
                  <span className="font-data text-[9px] text-white/50 w-6 text-right">
                    {Math.round(city.pulse_intensity * 100)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      <InsightStream entityId={`${countryCode}:${countryName}`} entityType="country" countryData={data} />
    </div>
  )
}
