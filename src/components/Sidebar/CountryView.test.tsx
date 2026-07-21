import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CountryView from './CountryView'
import type { CountryData } from '@/types/country'

function country(overrides: Partial<CountryData> = {}): CountryData {
  return {
    countryCode: 'ID',
    name: 'Indonesia',
    region: 'East Asia & Pacific',
    capital: 'Jakarta',
    currency: 'IDR',
    population_m: 286,
    gdp_billion: 1430,
    gdpGrowth: 5.1,
    gdpPerCapita: 5060,
    inflation: 1.9,
    unemployment: 3.2,
    lifeExpectancy: 71.5,
    risk_score: 25,
    innovationScore: 58,
    dataYear: 2025,
    source: 'live',
    cities: [],
    ...overrides,
  }
}

function routeJson(url: string): unknown {
  if (url.startsWith('/api/country/')) return { success: true, country: country() }
  if (url.startsWith('/api/history/')) return { years: [], gdpGrowth: [], inflation: [] }
  if (url.startsWith('/api/trade/')) {
    return { exports_b: 330, imports_b: 240, balance_b: 90, trade_pct: 45, partners: ['China'] }
  }
  if (url.startsWith('/api/news/')) return { articles: [], unavailable: true, noRecent: true }
  return {}
}

function mockRoutes(override?: (url: string) => unknown) {
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    const body = override?.(url) ?? routeJson(url)
    return { ok: true, json: async () => body, body: null } as unknown as Response
  }))
}

beforeEach(() => {
  vi.unstubAllGlobals()
})

describe('CountryView', () => {
  it('shows a skeleton before the country resolves', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
    const { container } = render(<CountryView countryCode="ID" countryName="Indonesia" />)
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('renders headline macro figures once loaded', async () => {
    mockRoutes()
    render(<CountryView countryCode="ID" countryName="Indonesia" />)

    expect(await screen.findByText('Population')).toBeInTheDocument()
    expect(screen.getByText('GDP / Capita')).toBeInTheDocument()
    expect(screen.getByText('East Asia & Pacific')).toBeInTheDocument()
    expect(screen.getByText('Jakarta')).toBeInTheDocument()

    expect(await screen.findByText('286M', undefined, { timeout: 4000 })).toBeInTheDocument()
    expect(await screen.findByText('$5,060', undefined, { timeout: 4000 })).toBeInTheDocument()
  })

  it('labels a low risk score as a strong opportunity', async () => {
    mockRoutes()
    render(<CountryView countryCode="ID" countryName="Indonesia" />)
    expect(await screen.findByText('Strong Opportunity')).toBeInTheDocument()
  })

  it('labels a high risk score as a high risk market', async () => {
    mockRoutes(url =>
      url.startsWith('/api/country/')
        ? { success: true, country: country({ risk_score: 72 }) }
        : undefined,
    )
    render(<CountryView countryCode="ID" countryName="Indonesia" />)
    expect(await screen.findByText('High Risk Market')).toBeInTheDocument()
  })

  it('marks the reading as verified when every indicator is live', async () => {
    mockRoutes()
    render(<CountryView countryCode="ID" countryName="Indonesia" />)
    expect(await screen.findByText(/Verified · World Bank 2025/)).toBeInTheDocument()
  })

  it('marks the reading as cached when the snapshot filled gaps', async () => {
    mockRoutes(url =>
      url.startsWith('/api/country/')
        ? { success: true, country: country({ source: 'mixed' }) }
        : undefined,
    )
    render(<CountryView countryCode="ID" countryName="Indonesia" />)
    expect(await screen.findByText(/Partly cached · World Bank 2025/)).toBeInTheDocument()
  })

  it('explains a known territory instead of showing an empty dashboard', async () => {
    mockRoutes(url =>
      url.startsWith('/api/country/')
        ? {
            success: true,
            country: country({
              countryCode: 'AQ',
              population_m: 0,
              gdp_billion: 0,
              gdpGrowth: undefined,
              gdpPerCapita: undefined,
              inflation: undefined,
              unemployment: undefined,
              lifeExpectancy: undefined,
            }),
          }
        : undefined,
    )
    render(<CountryView countryCode="AQ" countryName="Antarctica" />)

    expect(await screen.findByText('Uninhabited Continent')).toBeInTheDocument()
    expect(screen.getByText(/No World Bank economic indicators/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument()
  })

  it('offers a retry when an unknown country returns nothing', async () => {
    let calls = 0
    mockRoutes(url => {
      if (!url.startsWith('/api/country/')) return undefined
      calls++
      return {
        success: true,
        country: country({
          population_m: 0,
          gdp_billion: 0,
          gdpGrowth: undefined,
          gdpPerCapita: undefined,
          inflation: undefined,
          unemployment: undefined,
          lifeExpectancy: undefined,
        }),
      }
    })

    render(<CountryView countryCode="ID" countryName="Indonesia" />)

    const retry = await screen.findByRole('button', { name: /retry/i })
    expect(calls).toBe(1)

    await userEvent.click(retry)
    await waitFor(() => expect(calls).toBe(2))
  })

  it('renders the news feed only when the news layer is on', async () => {
    mockRoutes()
    const { rerender } = render(<CountryView countryCode="ID" countryName="Indonesia" />)

    await screen.findByText('Population')
    expect(screen.queryByText(/Economic News/)).not.toBeInTheDocument()

    rerender(<CountryView countryCode="ID" countryName="Indonesia" showNews />)
    expect(await screen.findByText(/Economic News/)).toBeInTheDocument()
  })

  it('requests the historical year when the timeline is active', async () => {
    mockRoutes()
    render(<CountryView countryCode="ID" countryName="Indonesia" timelineYear={2019} />)

    await waitFor(() => {
      const calls = vi.mocked(fetch).mock.calls.map(c => String(c[0]))
      expect(calls.some(u => u.includes('/api/country/ID?year=2019'))).toBe(true)
    })
  })
})
