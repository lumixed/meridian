import { NextResponse } from 'next/server'
import { getSovereignCodes } from '@/lib/country-meta'

export const revalidate = 86400

const GDP_PER_CAPITA =
  'https://api.worldbank.org/v2/country/all/indicator/NY.GDP.PCAP.CD?format=json&mrv=1&per_page=400'

export async function GET() {
  try {
    const [validCodes, gdpRes] = await Promise.all([
      getSovereignCodes(),
      fetch(GDP_PER_CAPITA, { signal: AbortSignal.timeout(12000) }),
    ])

    if (!gdpRes.ok) return NextResponse.json({ scores: {} })

    const json = await gdpRes.json()
    const rows: { country?: { id?: string }; value?: number | null }[] = json?.[1] ?? []

    const raw: Record<string, number> = {}
    for (const row of rows) {
      const iso2 = row.country?.id
      if (iso2 && validCodes.has(iso2) && row.value !== null && row.value !== undefined) {
        raw[iso2] = row.value
      }
    }

    if (Object.keys(raw).length === 0) return NextResponse.json({ scores: {} })

    const logVals = Object.values(raw).map(v => Math.log(v + 1))
    const minLog = Math.min(...logVals)
    const maxLog = Math.max(...logVals)
    const range = maxLog - minLog || 1

    const scores: Record<string, number> = {}
    for (const [iso2, val] of Object.entries(raw)) {
      scores[iso2] = Math.round(((Math.log(val + 1) - minLog) / range) * 1000) / 1000
    }

    return NextResponse.json({ scores })
  } catch (err) {
    console.error('[heatmap route]', err)
    return NextResponse.json({ scores: {} })
  }
}
