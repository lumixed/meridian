import { flagEmoji } from '@/lib/flag'

const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const WB_BASE = 'https://api.worldbank.org/v2'

interface CacheEntry<T> {
  data: T
  ts: number
}

const cache = new Map<string, CacheEntry<unknown>>()

function fromCache<T>(key: string): T | undefined {
  const e = cache.get(key)
  if (!e) return undefined
  if (Date.now() - e.ts > CACHE_TTL_MS) {
    cache.delete(key)
    return undefined
  }
  return e.data as T
}

function setCache<T>(key: string, data: T) {
  cache.set(key, { data, ts: Date.now() })
}

const CURRENCY_MAP: Record<string, string> = {
  US:'USD',GB:'GBP',DE:'EUR',FR:'EUR',IT:'EUR',ES:'EUR',NL:'EUR',BE:'EUR',AT:'EUR',
  PT:'EUR',FI:'EUR',IE:'EUR',GR:'EUR',SK:'EUR',SI:'EUR',LV:'EUR',LT:'EUR',EE:'EUR',
  JP:'JPY',CN:'CNY',IN:'INR',BR:'BRL',CA:'CAD',AU:'AUD',CH:'CHF',SE:'SEK',NO:'NOK',
  DK:'DKK',NZ:'NZD',SG:'SGD',HK:'HKD',KR:'KRW',MX:'MXN',ZA:'ZAR',NG:'NGN',
  KE:'KES',EG:'EGP',GH:'GHS',TZ:'TZS',UG:'UGX',ET:'ETB',MA:'MAD',DZ:'DZD',
  TN:'TND',AO:'AOA',MZ:'MZN',ZM:'ZMW',ZW:'ZWL',SN:'XOF',CM:'XAF',CI:'XOF',
  SA:'SAR',AE:'AED',IL:'ILS',TR:'TRY',PK:'PKR',BD:'BDT',LK:'LKR',NP:'NPR',
  TH:'THB',VN:'VND',ID:'IDR',MY:'MYR',PH:'PHP',MM:'MMK',KH:'KHR',LA:'LAK',
  AR:'ARS',CL:'CLP',CO:'COP',PE:'PEN',VE:'VES',EC:'USD',BO:'BOB',PY:'PYG',
  UY:'UYU',GY:'GYD',SR:'SRD',RU:'RUB',UA:'UAH',PL:'PLN',CZ:'CZK',HU:'HUF',
  RO:'RON',BG:'BGN',RS:'RSD',HR:'EUR',BA:'BAM',MK:'MKD',AL:'ALL',MD:'MDL',
  BY:'BYN',AZ:'AZN',GE:'GEL',AM:'AMD',KZ:'KZT',UZ:'UZS',TM:'TMT',KG:'KGS',
  TJ:'TJS',IR:'IRR',IQ:'IQD',SY:'SYP',JO:'JOD',LB:'LBP',KW:'KWD',BH:'BHD',
  QA:'QAR',OM:'OMR',YE:'YER',AF:'AFN',MN:'MNT',KP:'KPW',TW:'TWD',
}

interface WbCountryRow {
  name?: string
  iso2Code?: string
  capitalCity?: string
  latitude?: string
  longitude?: string
  region?: { id?: string; value?: string }
  adminregion?: { value?: string }
}

export interface CountryMeta {
  name: string
  region: string
  subregion: string
  capital: string
  currency: string
  flag: string
  lat: number
  lng: number
}

export async function getCountryMeta(iso2: string): Promise<CountryMeta | null> {
  const code = iso2.toUpperCase()
  if (!code || code === '-99') return null

  const key = `meta:${code}`
  const cached = fromCache<CountryMeta | null>(key)
  if (cached !== undefined) return cached

  try {
    const res = await fetch(`${WB_BASE}/country/${code}?format=json`, {
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) {
      setCache(key, null)
      return null
    }

    const json = await res.json()
    const rows: WbCountryRow[] = json?.[1] ?? []
    const d = rows.find(r => r.iso2Code === code) ?? rows[0]
    if (!d) {
      setCache(key, null)
      return null
    }

    const result: CountryMeta = {
      name: d.name ?? code,
      region: d.region?.value ?? '',
      subregion: d.adminregion?.value ?? d.region?.value ?? '',
      capital: d.capitalCity ?? '',
      currency: CURRENCY_MAP[code] ?? '',
      flag: flagEmoji(code),
      lat: parseFloat(d.latitude ?? '') || 0,
      lng: parseFloat(d.longitude ?? '') || 0,
    }
    setCache(key, result)
    return result
  } catch {
    setCache(key, null)
    return null
  }
}

export interface CountrySummary {
  code: string
  name: string
  capital: string
  region: string
  lat: number
  lng: number
  flag: string
}

let listCache: CountrySummary[] | null = null
let listTs = 0

export async function getAllCountries(): Promise<CountrySummary[]> {
  if (listCache && Date.now() - listTs < CACHE_TTL_MS) return listCache

  try {
    const res = await fetch(`${WB_BASE}/country?format=json&per_page=300`, {
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return listCache ?? []

    const json = await res.json()
    const rows: WbCountryRow[] = json?.[1] ?? []

    listCache = rows
      .filter(r => r.iso2Code && r.iso2Code.length === 2 && r.capitalCity && r.region?.id)
      .map(r => ({
        code: r.iso2Code as string,
        name: r.name ?? '',
        capital: r.capitalCity ?? '',
        region: r.region?.value ?? '',
        lat: parseFloat(r.latitude ?? '') || 0,
        lng: parseFloat(r.longitude ?? '') || 0,
        flag: flagEmoji(r.iso2Code as string),
      }))

    listTs = Date.now()
    return listCache
  } catch {
    return listCache ?? []
  }
}
