import { NextResponse } from 'next/server'
import { freshnessScore, combinedScore, parseRss, type NewsArticle } from '@/lib/news-scoring'

export const dynamic = 'force-dynamic'

const NAMES: Record<string, string> = {
  US: 'United States', IN: 'India', CN: 'China', GB: 'United Kingdom',
  DE: 'Germany', JP: 'Japan', FR: 'France', BR: 'Brazil', KR: 'South Korea',
  CA: 'Canada', AU: 'Australia', RU: 'Russia', MX: 'Mexico', ID: 'Indonesia',
  SA: 'Saudi Arabia', TR: 'Turkey', AR: 'Argentina', ZA: 'South Africa',
  NG: 'Nigeria', EG: 'Egypt', PK: 'Pakistan', AE: 'United Arab Emirates',
  SG: 'Singapore', TH: 'Thailand', MY: 'Malaysia', PH: 'Philippines',
  VN: 'Vietnam', IT: 'Italy', ES: 'Spain', NL: 'Netherlands',
  CH: 'Switzerland', SE: 'Sweden', NO: 'Norway', PL: 'Poland',
  UA: 'Ukraine', IR: 'Iran', IL: 'Israel', CL: 'Chile', CO: 'Colombia',
  PE: 'Peru', BD: 'Bangladesh', KZ: 'Kazakhstan', QA: 'Qatar',
  MA: 'Morocco', KE: 'Kenya', ET: 'Ethiopia', GH: 'Ghana',
  CZ: 'Czech Republic', HU: 'Hungary', RO: 'Romania', GR: 'Greece',
  PT: 'Portugal', BE: 'Belgium', AT: 'Austria', DK: 'Denmark',
  FI: 'Finland', NZ: 'New Zealand', IQ: 'Iraq', KW: 'Kuwait',
  OM: 'Oman', TZ: 'Tanzania', LK: 'Sri Lanka', MM: 'Myanmar', NP: 'Nepal',
  ZW: 'Zimbabwe', TN: 'Tunisia', SN: 'Senegal', CI: 'Ivory Coast',
}

const COUNTRY_QUERIES: Record<string, string> = {
  IN: 'India economy GDP RBI finance inflation',
  AE: 'UAE economy Dubai Abu Dhabi GDP trade finance',
  SG: 'Singapore economy MAS GDP trade finance',
  AU: 'Australia economy RBA GDP trade finance',
  MY: 'Malaysia economy Bank Negara GDP trade finance',
  GB: 'UK economy Bank of England GDP sterling finance',
  JP: 'Japan economy Bank of Japan GDP yen finance',
  KR: 'South Korea economy GDP Bank of Korea finance',
  DE: 'Germany economy Bundesbank GDP DAX finance',
  FR: 'France economy GDP ECB euro finance',
  CN: 'China economy PBOC GDP yuan finance',
  BR: 'Brazil economy GDP real finance inflation',
  SA: 'Saudi Arabia economy oil GDP Vision 2030 finance',
  NG: 'Nigeria economy naira GDP CBN finance',
  ZA: 'South Africa economy GDP rand SARB finance',
  KE: 'Kenya economy shilling GDP finance',
  GH: 'Ghana economy cedi GDP IMF finance',
  EG: 'Egypt economy pound GDP IMF finance',
  PK: 'Pakistan economy rupee GDP IMF finance',
  BD: 'Bangladesh economy taka GDP garments finance',
  TR: 'Turkey economy lira GDP inflation finance',
  ID: 'Indonesia economy rupiah GDP finance',
  TH: 'Thailand economy baht GDP finance',
  VN: 'Vietnam economy dong GDP manufacturing trade',
  PH: 'Philippines economy peso GDP BSP finance',
  MX: 'Mexico economy peso Banxico GDP finance',
  AR: 'Argentina economy peso GDP inflation IMF',
  CL: 'Chile economy peso copper GDP finance',
  CO: 'Colombia economy peso GDP finance',
  PE: 'Peru economy sol copper GDP finance',
  IL: 'Israel economy shekel GDP tech finance',
  QA: 'Qatar economy LNG GDP finance',
  KW: 'Kuwait economy dinar oil GDP finance',
  OM: 'Oman economy riyal oil GDP finance',
  RU: 'Russia economy ruble GDP sanctions finance',
  UA: 'Ukraine economy hryvnia GDP reconstruction',
  KZ: 'Kazakhstan economy tenge GDP finance',
  LK: 'Sri Lanka economy rupee GDP IMF',
  NL: 'Netherlands economy euro GDP finance trade',
  CH: 'Switzerland economy franc GDP finance',
  SE: 'Sweden economy krona GDP finance',
  NO: 'Norway economy krone oil GDP finance',
  DK: 'Denmark economy krone GDP finance',
  FI: 'Finland economy euro GDP finance',
  PL: 'Poland economy zloty GDP finance',
  IT: 'Italy economy euro GDP finance ECB',
  ES: 'Spain economy euro GDP finance ECB',
  GR: 'Greece economy euro GDP finance',
  PT: 'Portugal economy euro GDP finance',
  BE: 'Belgium economy euro GDP finance',
  AT: 'Austria economy euro GDP finance',
  NZ: 'New Zealand economy RBNZ GDP finance',
  IR: 'Iran economy rial GDP sanctions finance',
  IQ: 'Iraq economy dinar oil GDP finance',
  MA: 'Morocco economy dirham GDP finance',
  ET: 'Ethiopia economy birr GDP finance',
  TZ: 'Tanzania economy shilling GDP finance',
  TN: 'Tunisia economy dinar GDP finance',
  SN: 'Senegal economy CFA franc GDP finance',
  CI: 'Ivory Coast economy CFA franc GDP finance',
  MM: 'Myanmar economy kyat GDP finance',
  NP: 'Nepal economy rupee GDP finance',
  ZW: 'Zimbabwe economy dollar GDP finance',
  US: 'United States economy Federal Reserve GDP inflation finance',
  CA: 'Canada economy Bank of Canada GDP loonie finance',
  RO: 'Romania economy leu GDP finance',
  HU: 'Hungary economy forint GDP finance',
  CZ: 'Czech Republic economy koruna GDP finance',
}

const EXTRA_FEEDS: Record<string, string[]> = {
  IN: [
    'https://economictimes.indiatimes.com/rssfeedstopstories.cms',
    'https://www.business-standard.com/rss/latest.rss',
  ],
  AE: [
    'https://www.arabianbusiness.com/rss',
    'https://gulfnews.com/rss/business',
  ],
  SG: [
    'https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml&category=10416',
  ],
  AU: [
    'https://www.abc.net.au/news/feed/51892/rss.xml',
  ],
  JP: [
    'https://www.japantimes.co.jp/feed/business/',
  ],
  KR: [
    'https://businesskorea.co.kr/rss/allArticles.xml',
  ],
  SA: [
    'https://www.arabnews.com/taxonomy/term/5/feed',
  ],
  NG: [
    'https://businessday.ng/feed/',
  ],
  ZA: [
    'https://businesstech.co.za/news/feed/',
  ],
  KE: [
    'https://businessdailyafrica.com/rss/bd',
  ],
  GH: [
    'https://www.ghanaweb.com/GhanaHomePage/business/rss/business.rss',
  ],
  TR: [
    'https://www.hurriyetdailynews.com/rss/rss_business.xml',
  ],
  ID: [
    'https://www.thejakartapost.com/news/rss/business.xml',
  ],
  TH: [
    'https://www.bangkokpost.com/rss/data/business.xml',
  ],
  LK: [
    'https://economynext.com/feed/',
  ],
  PK: [
    'https://www.dawn.com/feeds/business',
  ],
  BD: [
    'https://thefinancialexpress.com.bd/feed',
  ],
  IL: [
    'https://en.globes.co.il/en/rss.aspx',
  ],
}

const CHROME_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'

async function tryFetch(url: string, timeoutMs = 8000): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
      cache: 'no-store',
      headers: {
        'User-Agent': CHROME_UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    })
    if (!res.ok) return null
    const text = await res.text()
    return text.includes('<item>') ? text : null
  } catch { return null }
}

async function fetchGoogleNews(query: string, withinDays = 3): Promise<NewsArticle[]> {
  const q = encodeURIComponent(`${query} when:${withinDays}d`)
  const xml = await tryFetch(`https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`)
  return xml ? parseRss(xml) : []
}

const COUNTRY_ALIASES: Record<string, string[]> = {
  'united arab emirates': ['uae', 'dubai', 'abu dhabi', 'emirati', 'adgm', 'difc'],
  'united states':        ['american', 'u.s.', 'us economy', 'federal reserve', 'wall street', 'nasdaq', 'new york fed'],
  'united kingdom':       ['uk', 'british', 'england', 'sterling', 'bank of england', 'ftse', 'london stock'],
  'south korea':          ['korea', 'korean'],
  'saudi arabia':         ['saudi', 'aramco', 'riyadh'],
  'new zealand':          ['kiwi', 'rbnz'],
  'hong kong':            ['hksar', 'hkex'],
  'ivory coast':          ["côte d'ivoire", 'cote divoire', 'ivorian'],
  'south africa':         ['south african', 'rand', 'sarb', 'johannesburg'],
  'czech republic':       ['czech', 'czechia', 'prague'],
  'sri lanka':            ['colombo', 'ceylon'],
  'new caledonia':        ['noumea'],
}

async function fetchRssFiltered(feedUrl: string, name: string): Promise<NewsArticle[]> {
  const xml = await tryFetch(feedUrl)
  if (!xml) return []
  const all = parseRss(xml, 20)
  const nl = name.toLowerCase()
  const aliases = COUNTRY_ALIASES[nl] ?? []
  return all.filter(a => {
    const title   = a.title.toLowerCase()
    const summary = a.summary.toLowerCase()
    return title.includes(nl)     || summary.includes(nl) ||
           aliases.some(alias => title.includes(alias) || summary.includes(alias))
  })
}

async function fetchExtraFeeds(code: string, name: string): Promise<NewsArticle[]> {
  const feeds = EXTRA_FEEDS[code] ?? []
  if (feeds.length === 0) return []
  const results = await Promise.allSettled(feeds.map(url => tryFetch(url, 6000)))
  const articles: NewsArticle[] = []
  const seen = new Set<string>()
  for (const r of results) {
    if (r.status !== 'fulfilled' || !r.value) continue
    for (const a of parseRss(r.value, 15)) {
      if (freshnessScore(a.pubDate) < 30) continue
      const key = a.title.toLowerCase().slice(0, 40)
      if (!seen.has(key)) { seen.add(key); articles.push(a) }
    }
  }
  return articles
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ countryCode: string }> }
) {
  const { countryCode } = await params
  const code = countryCode.toUpperCase()
  const name = NAMES[code] ?? decodeURIComponent(countryCode)
  const customQuery = COUNTRY_QUERIES[code] ?? `${name} economy GDP finance`

  try {
    const [googleArticles, googleGeneric, bbcArticles, reutersArticles, extraArticles] = await Promise.all([
      fetchGoogleNews(customQuery, 3),
      fetchGoogleNews(`${name} economy GDP finance`, 3),
      fetchRssFiltered('https://feeds.bbci.co.uk/news/business/rss.xml', name),
      fetchRssFiltered('https://feeds.reuters.com/reuters/businessNews', name),
      fetchExtraFeeds(code, name),
    ])

    const googleFresh = [...googleArticles, ...googleGeneric].filter(a => freshnessScore(a.pubDate) >= 30)
    const googleWidened = googleFresh.length === 0
      ? await Promise.all([
          fetchGoogleNews(customQuery, 7),
          fetchGoogleNews(`${name} economy GDP finance`, 7),
        ]).then(([a, b]) => [...a, ...b])
      : []

    const seen = new Set<string>()
    const merged: NewsArticle[] = []
    for (const a of [...extraArticles, ...googleArticles, ...googleGeneric, ...googleWidened, ...bbcArticles, ...reutersArticles]) {
      const key = a.title.toLowerCase().slice(0, 40)
      if (!seen.has(key)) { seen.add(key); merged.push(a) }
    }

    const sorted = merged.sort((a, b) => combinedScore(b) - combinedScore(a))

    const within72h = sorted.filter(a => freshnessScore(a.pubDate) >= 58)
    const within7d  = sorted.filter(a => freshnessScore(a.pubDate) >= 30)

    if (within7d.length === 0) {
      return NextResponse.json({
        articles: [], country: name,
        fetchedAt: new Date().toISOString(),
        unavailable: true, noRecent: true,
      })
    }

    const articles = (within72h.length >= 3 ? within72h : within7d).slice(0, 8)

    return NextResponse.json({
      articles, country: name,
      fetchedAt: new Date().toISOString(),
      unavailable: false,
      noRecent: false,
    })
  } catch (err) {
    console.error('[news route]', err)
    return NextResponse.json({ articles: [], unavailable: true })
  }
}
