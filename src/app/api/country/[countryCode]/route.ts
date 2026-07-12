import { NextResponse } from 'next/server'
import { getWorldBankData } from '@/lib/worldbank'
import { getCountryMeta } from '@/lib/country-meta'
import type { CountryData } from '@/types/country'

function computeRiskScore(
  inflation: number | null,
  unemployment: number | null,
  gdpGrowth: number | null,
  gdpPerCapita: number | null,
): number {
  let score = 30
  if (inflation !== null) {
    if      (inflation > 20) score += 30
    else if (inflation > 10) score += 20
    else if (inflation > 5)  score += 10
    else if (inflation < 0)  score += 5
  }
  if (unemployment !== null) {
    if      (unemployment > 20) score += 20
    else if (unemployment > 10) score += 12
    else if (unemployment > 5)  score += 6
  }
  if (gdpGrowth !== null) {
    if      (gdpGrowth < -2) score += 15
    else if (gdpGrowth < 0)  score += 8
    else if (gdpGrowth > 5)  score -= 5
    else if (gdpGrowth > 3)  score -= 3
  }
  if (gdpPerCapita !== null) {
    if      (gdpPerCapita < 1000)  score += 15
    else if (gdpPerCapita < 5000)  score += 8
    else if (gdpPerCapita > 30000) score -= 8
    else if (gdpPerCapita > 15000) score -= 4
  }
  return Math.min(100, Math.max(0, Math.round(score)))
}

function computeInnovation(gdpPerCapita: number | null, lifeExpectancy: number | null, risk: number): number {
  let s = 40
  if (gdpPerCapita !== null) {
    if      (gdpPerCapita > 50000) s += 30
    else if (gdpPerCapita > 25000) s += 22
    else if (gdpPerCapita > 10000) s += 14
    else if (gdpPerCapita > 3000)  s += 6
  }
  if (lifeExpectancy !== null) {
    if      (lifeExpectancy > 80) s += 15
    else if (lifeExpectancy > 72) s += 8
    else if (lifeExpectancy > 65) s += 3
  }
  s += Math.round((100 - risk) * 0.15)
  return Math.min(98, Math.max(10, Math.round(s)))
}

export async function GET(req: Request, { params }: { params: Promise<{ countryCode: string }> }) {
  const { countryCode } = await params
  const raw = decodeURIComponent(countryCode).trim()
  const code = raw.length <= 3 ? raw.toUpperCase() : raw

  const yearStr = new URL(req.url).searchParams.get('year')
  const year = yearStr ? parseInt(yearStr, 10) : undefined

  try {
    const [wb, meta] = await Promise.allSettled([
      getWorldBankData(code, year),
      getCountryMeta(code),
    ])

    const wbData = wb.status === 'fulfilled' ? wb.value : {
      population_m: null, gdp_billion: null, gdpGrowth: null, gdpPerCapita: null,
      inflation: null, unemployment: null, lifeExpectancy: null, dataYear: null,
    }
    const metaData = meta.status === 'fulfilled' ? meta.value : null

    const risk = computeRiskScore(wbData.inflation, wbData.unemployment, wbData.gdpGrowth, wbData.gdpPerCapita)
    const innovation = computeInnovation(wbData.gdpPerCapita, wbData.lifeExpectancy, risk)

    const country: CountryData = {
      countryCode: code,
      name: metaData?.name ?? code,
      region: metaData?.subregion || metaData?.region || 'Unknown',
      capital: metaData?.capital ?? undefined,
      currency: metaData?.currency ?? undefined,
      flag: metaData?.flag ?? undefined,

      population_m: wbData.population_m ?? 0,
      gdp_billion: wbData.gdp_billion ?? 0,
      gdpGrowth: wbData.gdpGrowth ?? undefined,
      gdpPerCapita: wbData.gdpPerCapita ?? undefined,
      inflation: wbData.inflation ?? undefined,
      unemployment: wbData.unemployment ?? undefined,
      lifeExpectancy: wbData.lifeExpectancy ?? undefined,

      risk_score: risk,
      innovationScore: innovation,
      dataYear: wbData.dataYear ?? undefined,
    }

    return NextResponse.json({ success: true, country })
  } catch (err) {
    console.error('[country route] fatal error for', code, err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
