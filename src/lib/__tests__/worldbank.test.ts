import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getWorldBankData, snapshotYear } from '@/lib/worldbank'
import snapshot from '@/data/indicators-snapshot.json'

function indicatorOf(url: string): string {
  const match = url.match(/indicator\/([A-Z0-9.]+)\?/)
  return match ? match[1] : ''
}

function ok(date: string, value: number) {
  return {
    ok: true,
    json: async () => [{ page: 1 }, [{ date, value }]],
  } as Response
}

const failing = { ok: false, status: 502, json: async () => null } as Response

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('getWorldBankData', () => {
  it('reports a live source when every indicator resolves', async () => {
    vi.mocked(fetch).mockImplementation(async input => {
      const ind = indicatorOf(String(input))
      return ind === 'SP.POP.TOTL' ? ok('2025', 1_000_000) : ok('2025', 42)
    })

    const data = await getWorldBankData('AA')

    expect(data.source).toBe('live')
    expect(data.population_m).toBe(1)
    expect(data.dataYear).toBe(2025)
  })

  it('falls back entirely to the snapshot when the API is down', async () => {
    vi.mocked(fetch).mockResolvedValue(failing)

    const data = await getWorldBankData('BR')
    const expected = snapshot.countries.BR

    expect(data.source).toBe('snapshot')
    expect(data.gdp_billion).toBe(expected.gdp_billion)
    expect(data.population_m).toBe(expected.population_m)
    expect(data.dataYear).toBe(snapshotYear())
  })

  it('mixes live values with the snapshot when only some indicators fail', async () => {
    vi.mocked(fetch).mockImplementation(async input => {
      const ind = indicatorOf(String(input))
      if (ind === 'NY.GDP.MKTP.KD.ZG') return ok('2025', 9.9)
      return failing
    })

    const data = await getWorldBankData('KE')

    expect(data.source).toBe('mixed')
    expect(data.gdpGrowth).toBe(9.9)
    expect(data.population_m).toBe(snapshot.countries.KE.population_m)
  })

  it('never substitutes the snapshot for a historical year query', async () => {
    vi.mocked(fetch).mockResolvedValue(failing)

    const data = await getWorldBankData('BR', 2018)

    expect(data.source).toBe('live')
    expect(data.gdp_billion).toBeNull()
    expect(data.population_m).toBeNull()
  })

  it('retries a failing request before giving up', async () => {
    const calls = new Map<string, number>()
    vi.mocked(fetch).mockImplementation(async input => {
      const ind = indicatorOf(String(input))
      const n = (calls.get(ind) ?? 0) + 1
      calls.set(ind, n)
      return n < 2 ? failing : ok('2025', 5)
    })

    const data = await getWorldBankData('ZZ')

    expect(data.source).toBe('live')
    expect(data.gdpGrowth).toBe(5)
    expect(calls.get('NY.GDP.MKTP.KD.ZG')).toBe(2)
  })
})
