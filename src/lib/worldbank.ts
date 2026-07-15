const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const BASE = 'https://api.worldbank.org/v2'

interface CacheEntry {
  data: number | null
  ts: number
}

const indicatorCache = new Map<string, CacheEntry>()
const yearCache = new Map<string, string>()
const inFlight = new Map<string, Promise<number | null>>()

function getCached(key: string): number | null | undefined {
  const e = indicatorCache.get(key)
  if (!e) return undefined
  if (Date.now() - e.ts > CACHE_TTL_MS) {
    indicatorCache.delete(key)
    yearCache.delete(key)
    return undefined
  }
  return e.data
}

function setCached(key: string, val: number | null) {
  indicatorCache.set(key, { data: val, ts: Date.now() })
}

async function requestIndicator(key: string, url: string): Promise<number | null> {
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) return null

  const json = await res.json()
  const rows: { date?: string; value?: number | string | null }[] = json?.[1] ?? []

  for (const row of rows) {
    if (row.value === null || row.value === undefined) continue
    const v = parseFloat(String(row.value))
    if (!isNaN(v)) {
      if (row.date) yearCache.set(key, String(row.date))
      setCached(key, v)
      return v
    }
  }

  setCached(key, null)
  return null
}

async function fetchIndicator(countryCode: string, indicator: string, year?: number): Promise<number | null> {
  const key = `${countryCode}:${indicator}:${year ?? 'latest'}`

  const hit = getCached(key)
  if (hit !== undefined) return hit

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

export interface WorldBankData {
  population_m: number | null
  gdp_billion: number | null
  gdpGrowth: number | null
  gdpPerCapita: number | null
  inflation: number | null
  unemployment: number | null
  lifeExpectancy: number | null
  dataYear: number | null
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

  const rawYear = yearCache.get(`${code}:${IND.gdp}:${year ?? 'latest'}`)

  return {
    population_m: pop !== null ? Math.round(pop / 1e4) / 100 : null,
    gdp_billion: gdp !== null ? Math.round(gdp / 1e7) / 100 : null,
    gdpGrowth: gdpG !== null ? Math.round(gdpG * 10) / 10 : null,
    gdpPerCapita: gdpPC !== null ? Math.round(gdpPC) : null,
    inflation: inf !== null ? Math.round(inf * 10) / 10 : null,
    unemployment: unemp !== null ? Math.round(unemp * 10) / 10 : null,
    lifeExpectancy: lifeExp !== null ? Math.round(lifeExp * 10) / 10 : null,
    dataYear: rawYear ? parseInt(rawYear, 10) : null,
  }
}
