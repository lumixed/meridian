import { NextResponse } from 'next/server'
import { flagEmoji } from '@/lib/flag'
import { COUNTRIES_LIST } from '@/data/countries-list'

export const revalidate = 43200

const TICKER_CODES = [
  'US', 'CN', 'JP', 'DE', 'IN', 'GB', 'FR', 'IT', 'BR', 'CA', 'KR',
  'AU', 'MX', 'ID', 'SA', 'TR', 'CH', 'NL', 'AR', 'ZA', 'SG', 'AE',
]

const WB_BASE = 'https://api.worldbank.org/v2/country/all/indicator'

async function fetchIndicator(indicator: string): Promise<Record<string, number>> {
  const res = await fetch(`${WB_BASE}/${indicator}?format=json&mrv=1&per_page=400`, {
    signal: AbortSignal.timeout(12000),
  })
  if (!res.ok) return {}

  const json = await res.json()
  const rows: { country?: { id?: string }; value?: number | null }[] = json?.[1] ?? []

  const map: Record<string, number> = {}
  for (const row of rows) {
    const iso2 = row.country?.id
    if (iso2 && row.value !== null && row.value !== undefined) map[iso2] = row.value
  }
  return map
}

export async function GET() {
  try {
    const [gdp, cpi] = await Promise.all([
      fetchIndicator('NY.GDP.MKTP.KD.ZG'),
      fetchIndicator('FP.CPI.TOTL.ZG'),
    ])

    const byCode = new Map(COUNTRIES_LIST.map(c => [c.code, c]))

    const items = TICKER_CODES.flatMap(code => {
      const c = byCode.get(code)
      if (!c) return []
      return [{
        code,
        name: c.name,
        flag: flagEmoji(code),
        lat: c.lat,
        lng: c.lng,
        gdpGrowth: gdp[code] ?? null,
        inflation: cpi[code] ?? null,
      }]
    })

    return NextResponse.json({ items })
  } catch (err) {
    console.error('[ticker route]', err)
    return NextResponse.json({ items: [] })
  }
}
