'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import InsightStream from './InsightStream'
import InvestmentReport from './InvestmentReport'
import NewsPanel from './NewsPanel'
import { useCountUp } from '@/hooks/useCountUp'
import type { AnchorBriefing } from '@/types/briefing'
import type { CountryData } from '@/types/country'

interface Props {
  countryCode: string
  countryName: string
  showNews?: boolean
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
        <span className="font-data text-[8px] uppercase tracking-[0.14em] text-white/20 ml-auto">Text Summary</span>
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
                  <span className="font-data text-[9px] uppercase tracking-[0.14em] text-white/35">Generating summary</span>
                </div>
              )}

              {error && (
                <p className="text-[11px] text-white/35 py-1">
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
                            <p key={i} className="text-[9.5px] text-white/38 leading-snug flex items-start gap-1">
                              <span className="text-[#FF5D5D]/45 flex-shrink-0">●</span>{r}
                            </p>
                          ))}
                        </div>
                      )}
                      {brief.opportunities.length > 0 && (
                        <div>
                          <p className="font-data text-[9px] uppercase tracking-[0.18em] text-[#3DDC97]/50 mb-1">Opportunities</p>
                          {brief.opportunities.map((o, i) => (
                            <p key={i} className="text-[9.5px] text-white/38 leading-snug flex items-start gap-1">
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
      {source && <p className="font-data text-[8px] text-white/20 mt-1.5 uppercase tracking-wide">{source}</p>}
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
      {source && <p className="font-data text-[8px] text-white/20 mt-1.5 uppercase tracking-wide">{source}</p>}
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

export default function CountryView({ countryCode, countryName, showNews = false }: Props) {
  const [data, setData] = useState<CountryData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setData(null)
    fetch(`/api/country/${encodeURIComponent(countryCode)}`)
      .then(r => r.json())
      .then(d => { if (d.success) setData(d.country) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [countryCode])

  if (loading) return (
    <div className="p-4 space-y-3">
      {[...Array(7)].map((_, i) => <div key={i} className="h-16 rounded bg-white/[0.03] animate-pulse" />)}
    </div>
  )

  const hasData = (data?.gdp_billion ?? 0) > 0 || (data?.population_m ?? 0) > 0
  if (!hasData) return (
    <div className="p-6 text-center">
      <p className="font-display text-[15px] text-white/55">{countryName}</p>
      <p className="text-[12px] text-white/30 mt-2 leading-relaxed">
        World Bank does not publish economic indicators for this territory.
      </p>
    </div>
  )

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
              {i > 0 && <span className="text-white/20">·</span>}
              <span className="truncate">{part}</span>
            </span>
          ))}
        </p>
        <span
          className="font-data text-[8px] uppercase tracking-[0.12em] px-2 py-1 rounded flex items-center gap-1.5 ml-auto flex-shrink-0"
          style={{ background: 'rgba(61,220,151,0.06)', border: '1px solid rgba(61,220,151,0.22)', color: '#3DDC97' }}
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1.5 4L3 5.5L6.5 2" stroke="#3DDC97" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Verified · World Bank{wbYear}
        </span>
      </motion.div>

      <InvestmentBadge risk={risk} />

      <BriefSection countryCode={countryCode} countryName={countryName} data={data} />

      <InvestmentReport
        countryCode={countryCode}
        countryName={countryName}
        countryData={data}
        flag={data?.flag ?? ''}
      />

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

      {data?.cities && data.cities.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22, duration: 0.2 }}
          className="card card--flat p-3.5"
        >
          <div className="section-head mb-3">
            <span className="font-data text-[10px] text-[#45E0C0]/60 leading-none">▍</span>
            <p className="microlabel">Economic Hubs</p>
          </div>
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
                  <span className="font-data text-[9px] text-white/25 w-6 text-right">
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
