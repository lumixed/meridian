import { NextResponse } from 'next/server'
import { getSovereignCodes } from '@/lib/country-meta'

export const revalidate = 86400
export const maxDuration = 60

const BASE = 'https://api.worldbank.org/v2/country/all/indicator/NY.GDP.PCAP.CD'

const YEAR_MIN = 2015
const YEAR_MAX = 2025

export interface HeatmapPayload {
  scores: Record<string, number>
  year: number | null
}

const EMPTY: HeatmapPayload = { scores: {}, year: null }

function parseYear(raw: string | null): number | null {
  if (!raw) return null
  const n = parseInt(raw, 10)
  if (!Number.isFinite(n)) return null
  return Math.min(YEAR_MAX, Math.max(YEAR_MIN, n))
}

export async function GET(req: Request) {
  const year = parseYear(new URL(req.url).searchParams.get('year'))
  const window = year ? `date=${year}` : 'mrv=1'
  const url = `${BASE}?format=json&${window}&per_page=400`

  try {
    const [validCodes, res] = await Promise.all([
      getSovereignCodes(),
      fetch(url, {
        signal: AbortSignal.timeout(30000),
        next: { revalidate },
      }),
    ])

    if (!res.ok) return NextResponse.json(EMPTY)

    const json = await res.json()
    const rows: { country?: { id?: string }; date?: string; value?: number | null }[] = json?.[1] ?? []

    const raw: Record<string, number> = {}
    let observed: number | null = null

    for (const row of rows) {
      const iso2 = row.country?.id
      if (!iso2 || !validCodes.has(iso2)) continue
      if (row.value === null || row.value === undefined) continue

      raw[iso2] = row.value
      if (observed === null && row.date) {
        const parsed = parseInt(row.date, 10)
        if (Number.isFinite(parsed)) observed = parsed
      }
    }

    if (Object.keys(raw).length === 0) return NextResponse.json(EMPTY)

    const logVals = Object.values(raw).map(v => Math.log(v + 1))
    const minLog = Math.min(...logVals)
    const maxLog = Math.max(...logVals)
    const range = maxLog - minLog || 1

    const scores: Record<string, number> = {}
    for (const [iso2, val] of Object.entries(raw)) {
      scores[iso2] = Math.round(((Math.log(val + 1) - minLog) / range) * 1000) / 1000
    }

    return NextResponse.json({ scores, year: year ?? observed })
  } catch (err) {
    console.error('[heatmap route]', err)
    return NextResponse.json(EMPTY)
  }
}
