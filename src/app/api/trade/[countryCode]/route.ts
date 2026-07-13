import { NextResponse } from 'next/server'
import { TRADE_PARTNERS } from '@/lib/trade-partners'

export const revalidate = 43200

const BASE = 'https://api.worldbank.org/v2'

async function fetchWB(code: string, indicator: string): Promise<number | null> {
  try {
    const r = await fetch(
      `${BASE}/country/${code}/indicator/${indicator}?format=json&mrv=1&per_page=1`,
      { signal: AbortSignal.timeout(7000) },
    )
    if (!r.ok) return null
    const j = await r.json()
    const val = j?.[1]?.[0]?.value
    return val !== null && val !== undefined ? parseFloat(val) : null
  } catch {
    return null
  }
}

const toBillions = (v: number | null) => (v !== null ? Math.round((v / 1e9) * 10) / 10 : null)

export async function GET(_req: Request, { params }: { params: Promise<{ countryCode: string }> }) {
  const { countryCode } = await params
  const code = countryCode.toUpperCase()

  const [exports, imports, tradePct] = await Promise.all([
    fetchWB(code, 'NE.EXP.GNFS.CD'),
    fetchWB(code, 'NE.IMP.GNFS.CD'),
    fetchWB(code, 'NE.TRD.GNFS.ZS'),
  ])

  const balance = exports !== null && imports !== null ? exports - imports : null

  return NextResponse.json({
    exports_b: toBillions(exports),
    imports_b: toBillions(imports),
    balance_b: toBillions(balance),
    trade_pct: tradePct !== null ? Math.round(tradePct * 10) / 10 : null,
    partners: TRADE_PARTNERS[code] ?? [],
  })
}
