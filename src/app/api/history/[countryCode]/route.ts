import { NextResponse } from 'next/server'

export const revalidate = 86400

const BASE = 'https://api.worldbank.org/v2'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

const YEAR_START = 2015
const YEAR_END = 2025
const YEARS = Array.from({ length: YEAR_END - YEAR_START + 1 }, (_, i) => YEAR_START + i)

export interface HistoryPayload {
  years: number[]
  gdpGrowth: (number | null)[]
  inflation: (number | null)[]
}

const EMPTY: HistoryPayload = { years: [], gdpGrowth: [], inflation: [] }

const historyCache = new Map<string, { data: HistoryPayload; ts: number }>()

async function fetchSeries(code: string, indicator: string): Promise<(number | null)[] | null> {
  try {
    const url = `${BASE}/country/${code}/indicator/${indicator}?format=json&date=${YEAR_START}:${YEAR_END}&per_page=20`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null

    const json = await res.json()
    const rows: { date?: string; value?: number | string | null }[] = json?.[1] ?? []
    if (!Array.isArray(rows) || rows.length === 0) return null

    const byYear = new Map<number, number>()
    for (const row of rows) {
      const y = parseInt(row?.date ?? '', 10)
      if (isNaN(y) || row?.value === null || row?.value === undefined) continue
      const v = parseFloat(String(row.value))
      if (!isNaN(v)) byYear.set(y, Math.round(v * 100) / 100)
    }
    if (byYear.size === 0) return null

    return YEARS.map(y => byYear.get(y) ?? null)
  } catch {
    return null
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ countryCode: string }> }) {
  const { countryCode } = await params
  const code = countryCode.toUpperCase()

  const hit = historyCache.get(code)
  if (hit && Date.now() - hit.ts < CACHE_TTL_MS) return NextResponse.json(hit.data)

  try {
    const [gdpGrowth, inflation] = await Promise.all([
      fetchSeries(code, 'NY.GDP.MKTP.KD.ZG'),
      fetchSeries(code, 'FP.CPI.TOTL.ZG'),
    ])

    if (gdpGrowth === null && inflation === null) return NextResponse.json(EMPTY)

    const payload: HistoryPayload = {
      years: YEARS,
      gdpGrowth: gdpGrowth ?? YEARS.map(() => null),
      inflation: inflation ?? YEARS.map(() => null),
    }
    historyCache.set(code, { data: payload, ts: Date.now() })
    return NextResponse.json(payload)
  } catch {
    return NextResponse.json(EMPTY)
  }
}
