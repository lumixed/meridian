import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const BASE = 'https://api.worldbank.org/v2/country/all/indicator'

const INDICATORS = {
  population_m: 'SP.POP.TOTL',
  gdp_billion: 'NY.GDP.MKTP.CD',
  gdpGrowth: 'NY.GDP.MKTP.KD.ZG',
  gdpPerCapita: 'NY.GDP.PCAP.CD',
  inflation: 'FP.CPI.TOTL.ZG',
  unemployment: 'SL.UEM.TOTL.ZS',
  lifeExpectancy: 'SP.DYN.LE00.IN',
}

const SCALE = {
  population_m: v => Math.round(v / 1e4) / 100,
  gdp_billion: v => Math.round(v / 1e7) / 100,
  gdpGrowth: v => Math.round(v * 10) / 10,
  gdpPerCapita: v => Math.round(v),
  inflation: v => Math.round(v * 10) / 10,
  unemployment: v => Math.round(v * 10) / 10,
  lifeExpectancy: v => Math.round(v * 10) / 10,
}

const MAX_ATTEMPTS = 4

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchBulk(indicator) {
  const url = `${BASE}/${indicator}?format=json&mrv=1&per_page=400`

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) await wait(1000 * attempt)

    const res = await fetch(url, { signal: AbortSignal.timeout(20000) }).catch(() => null)
    if (!res || !res.ok) {
      process.stdout.write(`  ${indicator} attempt ${attempt + 1} failed\n`)
      continue
    }

    const json = await res.json().catch(() => null)
    const rows = json?.[1]
    if (Array.isArray(rows) && rows.length > 0) return rows
  }

  throw new Error(`could not fetch ${indicator}`)
}

async function main() {
  const countries = {}
  const years = new Set()

  for (const [field, indicator] of Object.entries(INDICATORS)) {
    process.stdout.write(`fetching ${indicator}\n`)
    const rows = await fetchBulk(indicator)

    let kept = 0
    for (const row of rows) {
      const code = row?.country?.id
      const value = row?.value
      if (!code || code.length !== 2 || value === null || value === undefined) continue

      const n = Number(value)
      if (!Number.isFinite(n)) continue

      countries[code] ??= {}
      countries[code][field] = SCALE[field](n)
      if (row.date) years.add(Number(row.date))
      kept++
    }
    process.stdout.write(`  ${kept} values\n`)
  }

  const snapshot = {
    year: Math.max(...years),
    countries: Object.fromEntries(Object.entries(countries).sort(([a], [b]) => a.localeCompare(b))),
  }

  const out = fileURLToPath(new URL('../src/data/indicators-snapshot.json', import.meta.url))
  await writeFile(out, JSON.stringify(snapshot, null, 0) + '\n')

  process.stdout.write(`\nwrote ${Object.keys(snapshot.countries).length} countries for ${snapshot.year}\n`)
}

main().catch(err => {
  process.stderr.write(`${err.message}\n`)
  process.exit(1)
})
