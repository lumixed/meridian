import { describe, it, expect } from 'vitest'
import { buildCityId, computePulseIntensity, getAllCityDots, getCityById, type RawCity } from '@/lib/cities'
import rawCities from '@/data/seed-cities.json'

function makeCity(overrides: Partial<RawCity> = {}): RawCity {
  return {
    name: 'Testville',
    country: 'Testland',
    countryCode: 'TL',
    lat: 0,
    lng: 0,
    gdp_billion: 500,
    population_m: 5,
    startup_count: 1000,
    trade_volume_b: 100,
    risk_score: 40,
    ...overrides,
  }
}

describe('buildCityId', () => {
  it('slugs simple names with a city# prefix', () => {
    expect(buildCityId('New York')).toBe('city#new-york')
  })

  it('collapses whitespace and drops punctuation', () => {
    expect(buildCityId('Rio  de   Janeiro')).toBe('city#rio-de-janeiro')
    expect(buildCityId("Xi'an")).toBe('city#xian')
  })

  it('produces ids that match the bundled hub data', () => {
    for (const city of rawCities as RawCity[]) {
      expect(buildCityId(city.name)).toMatch(/^city#[a-z0-9-]*$/)
    }
  })
})

describe('computePulseIntensity', () => {
  it('stays in the 0..1 range for every bundled hub', () => {
    for (const city of rawCities as RawCity[]) {
      const p = computePulseIntensity(city)
      expect(p).toBeGreaterThanOrEqual(0)
      expect(p).toBeLessThanOrEqual(1)
    }
  })

  it('rewards a bigger economy', () => {
    const small = computePulseIntensity(makeCity({ gdp_billion: 50 }))
    const large = computePulseIntensity(makeCity({ gdp_billion: 1800 }))
    expect(large).toBeGreaterThan(small)
  })

  it('penalises higher risk', () => {
    const safe = computePulseIntensity(makeCity({ risk_score: 5 }))
    const risky = computePulseIntensity(makeCity({ risk_score: 90 }))
    expect(safe).toBeGreaterThan(risky)
  })

  it('caps each component so extreme inputs cannot exceed 1', () => {
    const extreme = computePulseIntensity(makeCity({
      gdp_billion: 99_999,
      startup_count: 500_000,
      trade_volume_b: 50_000,
      risk_score: 0,
    }))
    expect(extreme).toBe(1)
  })

  it('rounds to three decimal places', () => {
    const p = computePulseIntensity(makeCity())
    expect(p).toBe(Number(p.toFixed(3)))
  })
})

describe('city store', () => {
  it('exposes one dot per bundled hub with a unique id', () => {
    const dots = getAllCityDots()
    expect(dots).toHaveLength((rawCities as RawCity[]).length)
    expect(new Set(dots.map(d => d.cityId)).size).toBe(dots.length)
  })

  it('looks a hub up by id and returns null for unknown ids', () => {
    expect(getCityById('city#tokyo')?.name).toBe('Tokyo')
    expect(getCityById('city#atlantis')).toBeNull()
  })
})
