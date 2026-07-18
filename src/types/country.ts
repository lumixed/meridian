export interface CountryData {
  countryCode: string
  name: string
  region: string
  capital?: string
  currency?: string
  flag?: string

  population_m: number
  gdp_billion: number
  gdpGrowth?: number
  gdpPerCapita?: number
  inflation?: number
  unemployment?: number
  lifeExpectancy?: number

  risk_score: number
  innovationScore?: number
  dataYear?: number
  source?: 'live' | 'mixed' | 'snapshot'

  cities?: Array<{
    cityId: string
    name: string
    lat: number
    lng: number
    pulse_intensity: number
    country: string
  }>
}
