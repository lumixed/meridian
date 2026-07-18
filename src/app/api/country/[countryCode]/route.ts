import { NextResponse } from 'next/server'
import { getCitiesByCountryCode } from '@/lib/cities'
import { getWorldBankData, type WorldBankData } from '@/lib/worldbank'
import { getCountryMeta } from '@/lib/country-meta'
import { computeInnovation, computeRiskScore } from '@/lib/scores'
import type { CountryData } from '@/types/country'

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

    const wbData: WorldBankData = wb.status === 'fulfilled' ? wb.value : {
      population_m: null, gdp_billion: null, gdpGrowth: null, gdpPerCapita: null,
      inflation: null, unemployment: null, lifeExpectancy: null, dataYear: null,
      source: 'live',
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
      source: wbData.source,
      cities: getCitiesByCountryCode(code),
    }

    return NextResponse.json({ success: true, country })
  } catch (err) {
    console.error('[country route] fatal error for', code, err)
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
