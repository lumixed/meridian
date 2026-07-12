import rawCities from '@/data/seed-cities.json'
import type { CityMetrics, CityDot } from '@/types/city'

export interface RawCity {
  name: string
  country: string
  countryCode: string
  lat: number
  lng: number
  gdp_billion: number
  population_m: number
  startup_count: number
  trade_volume_b: number
  risk_score: number
}

export function computePulseIntensity(city: RawCity): number {
  const gdpNorm = Math.min(city.gdp_billion / 2000, 1)
  const startupNorm = Math.min(city.startup_count / 10000, 1)
  const tradeNorm = Math.min(city.trade_volume_b / 900, 1)
  const riskPenalty = 1 - city.risk_score / 100

  return parseFloat(
    (gdpNorm * 0.35 + startupNorm * 0.3 + tradeNorm * 0.25 + riskPenalty * 0.1).toFixed(3)
  )
}

export function buildCityId(name: string): string {
  return `city#${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
}

const CITIES: CityMetrics[] = (rawCities as RawCity[]).map(c => ({
  ...c,
  cityId: buildCityId(c.name),
  pulse_intensity: computePulseIntensity(c),
}))

export function getAllCityDots(): CityDot[] {
  return CITIES.map(c => ({
    cityId: c.cityId,
    name: c.name,
    country: c.country,
    countryCode: c.countryCode,
    lat: c.lat,
    lng: c.lng,
    pulse_intensity: c.pulse_intensity,
  }))
}

export function getCityById(cityId: string): CityMetrics | null {
  return CITIES.find(c => c.cityId === cityId) ?? null
}

export function getCitiesByCountryCode(countryCode: string): CityDot[] {
  return getAllCityDots().filter(c => c.countryCode === countryCode)
}
