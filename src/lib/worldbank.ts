import snapshot from '@/data/indicators-snapshot.json'

const REVALIDATE_SECONDS = 86400
const MAX_ATTEMPTS = 3
const BASE = 'https://api.worldbank.org/v2'

const yearCache = new Map<string, string>()
const inFlight = new Map<string, Promise<number | null>>()

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function requestIndicator(key: string, url: string): Promise<number | null> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) await wait(250 * attempt)

    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(8000),
        next: { revalidate: REVALIDATE_SECONDS },
      })
      if (!res.ok) continue

      const json = await res.json()
      const rows: { date?: string; value?: number | string | null }[] = json?.[1] ?? []

      for (const row of rows) {
        if (row.value === null || row.value === undefined) continue
        const v = parseFloat(String(row.value))
        if (!isNaN(v)) {
          if (row.date) yearCache.set(key, String(row.date))
          return v
        }
      }

      return null
    } catch {
      continue
    }
  }

  return null
}

async function fetchIndicator(countryCode: string, indicator: string, year?: number): Promise<number | null> {
  const key = `${countryCode}:${indicator}:${year ?? 'latest'}`

  const pending = inFlight.get(key)
  if (pending) return pending

  const url = year
    ? `${BASE}/country/${countryCode}/indicator/${indicator}?format=json&date=${year}&per_page=1`
    : `${BASE}/country/${countryCode}/indicator/${indicator}?format=json&mrv=5&per_page=5`

  const request = requestIndicator(key, url)
    .catch(() => null)
    .finally(() => inFlight.delete(key))

  inFlight.set(key, request)
  return request
}

const IND = {
  population: 'SP.POP.TOTL',
  gdp: 'NY.GDP.MKTP.CD',
  gdpGrowth: 'NY.GDP.MKTP.KD.ZG',
  gdpPerCapita: 'NY.GDP.PCAP.CD',
  inflation: 'FP.CPI.TOTL.ZG',
  unemployment: 'SL.UEM.TOTL.ZS',
  lifeExpectancy: 'SP.DYN.LE00.IN',
}

export type DataSource = 'live' | 'mixed' | 'snapshot'

export interface WorldBankData {
  population_m: number | null
  gdp_billion: number | null
  gdpGrowth: number | null
  gdpPerCapita: number | null
  inflation: number | null
  unemployment: number | null
  lifeExpectancy: number | null
  dataYear: number | null
  source: DataSource
}

type IndicatorField = Exclude<keyof WorldBankData, 'dataYear' | 'source'>

interface SnapshotFile {
  year: number
  countries: Record<string, Partial<Record<IndicatorField, number>>>
}

const SNAPSHOT = snapshot as SnapshotFile

export function snapshotYear(): number {
  return SNAPSHOT.year
}

export async function getWorldBankData(countryCode: string, year?: number): Promise<WorldBankData> {
  const code = countryCode.toUpperCase()

  const [pop, gdp, gdpG, gdpPC, inf, unemp, lifeExp] = await Promise.all([
    fetchIndicator(code, IND.population, year),
    fetchIndicator(code, IND.gdp, year),
    fetchIndicator(code, IND.gdpGrowth, year),
    fetchIndicator(code, IND.gdpPerCapita, year),
    fetchIndicator(code, IND.inflation, year),
    fetchIndicator(code, IND.unemployment, year),
    fetchIndicator(code, IND.lifeExpectancy, year),
  ])

  const live: Record<IndicatorField, number | null> = {
    population_m: pop !== null ? Math.round(pop / 1e4) / 100 : null,
    gdp_billion: gdp !== null ? Math.round(gdp / 1e7) / 100 : null,
    gdpGrowth: gdpG !== null ? Math.round(gdpG * 10) / 10 : null,
    gdpPerCapita: gdpPC !== null ? Math.round(gdpPC) : null,
    inflation: inf !== null ? Math.round(inf * 10) / 10 : null,
    unemployment: unemp !== null ? Math.round(unemp * 10) / 10 : null,
    lifeExpectancy: lifeExp !== null ? Math.round(lifeExp * 10) / 10 : null,
  }

  const rawYear = yearCache.get(`${code}:${IND.gdp}:${year ?? 'latest'}`)
  const liveYear = rawYear ? parseInt(rawYear, 10) : null

  const fields = Object.keys(live) as IndicatorField[]
  const liveCount = fields.filter(f => live[f] !== null).length

  if (liveCount === fields.length) {
    return { ...live, dataYear: liveYear, source: 'live' }
  }

  const fallback = year ? undefined : SNAPSHOT.countries[code]
  if (!fallback) {
    return { ...live, dataYear: liveYear, source: 'live' }
  }

  const merged = { ...live }
  let filled = 0
  for (const field of fields) {
    if (merged[field] !== null) continue
    const value = fallback[field]
    if (value === undefined) continue
    merged[field] = value
    filled++
  }

  if (filled === 0) {
    return { ...merged, dataYear: liveYear, source: 'live' }
  }

  return {
    ...merged,
    dataYear: liveYear ?? SNAPSHOT.year,
    source: liveCount === 0 ? 'snapshot' : 'mixed',
  }
}
