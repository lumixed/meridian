import { NextResponse } from 'next/server'
import { getAllCityDots } from '@/lib/cities'
import { flagEmoji } from '@/lib/flag'
import { COUNTRIES_LIST } from '@/data/countries-list'

export const dynamic = 'force-dynamic'

interface SearchResult {
  id: string
  name: string
  subtitle: string
  lat: number
  lng: number
  type: 'country' | 'capital' | 'city'
  countryCode?: string
}

const TYPE_ORDER = { country: 0, capital: 1, city: 2 }

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get('q')?.toLowerCase().trim() || ''
  if (q.length < 2) return NextResponse.json({ results: [] })

  const results: SearchResult[] = []
  const seenIds = new Set<string>()

  const push = (r: SearchResult) => {
    if (!r.id || seenIds.has(r.id)) return
    seenIds.add(r.id)
    results.push(r)
  }

  for (const c of COUNTRIES_LIST) {
    if (!c.name.toLowerCase().includes(q)) continue
    const flag = flagEmoji(c.code)
    push({
      id: c.code,
      name: `${flag} ${c.name}`.trim(),
      subtitle: c.region,
      lat: c.lat,
      lng: c.lng,
      type: 'country',
      countryCode: c.code,
    })
  }

  for (const c of COUNTRIES_LIST) {
    if (!c.capital || !c.capital.toLowerCase().includes(q)) continue
    const flag = flagEmoji(c.code)
    push({
      id: `cap:${c.code}`,
      name: `${flag} ${c.capital}`.trim(),
      subtitle: `Capital · ${c.name}`,
      lat: c.lat,
      lng: c.lng,
      type: 'capital',
      countryCode: c.code,
    })
  }

  for (const c of getAllCityDots()) {
    if (!c.name.toLowerCase().includes(q) && !c.country.toLowerCase().includes(q)) continue
    push({
      id: c.cityId,
      name: c.name,
      subtitle: c.country,
      lat: c.lat,
      lng: c.lng,
      type: 'city',
    })
  }

  const clean = (s: string) => s.toLowerCase().replace(/^[^\w]+/, '')
  results.sort((a, b) => {
    const aExact = clean(a.name).startsWith(q) ? 0 : 1
    const bExact = clean(b.name).startsWith(q) ? 0 : 1
    if (aExact !== bExact) return aExact - bExact
    return TYPE_ORDER[a.type] - TYPE_ORDER[b.type]
  })

  return NextResponse.json({ results: results.slice(0, 10) })
}
