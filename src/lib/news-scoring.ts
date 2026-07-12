export interface NewsArticle {
  title: string
  source: string
  url: string
  pubDate: string
  summary: string
  ageLabel: string
}

export const SOURCE_QUALITY: [RegExp, number][] = [
  [/reuters/i, 100],
  [/bloomberg/i, 100],
  [/financial times|ft\.com/i, 98],
  [/wall street journal|wsj/i, 95],
  [/associated press|ap news/i, 95],
  [/economist/i, 92],
  [/cnbc/i, 88],
  [/bbc/i, 85],
  [/new york times|nytimes/i, 85],
  [/guardian/i, 82],
  [/economic times/i, 85],
  [/business standard/i, 82],
  [/mint|livemint/i, 80],
  [/arabian business/i, 82],
  [/gulf news/i, 80],
  [/channel newsasia|cna/i, 80],
  [/straits times/i, 80],
  [/japan times/i, 82],
  [/businessday/i, 78],
  [/hurriyet daily|daily sabah/i, 75],
  [/jakarta post/i, 76],
  [/bangkok post/i, 76],
  [/globe and mail/i, 82],
  [/afr|australian financial/i, 85],
  [/arab news/i, 78],
  [/dawn\.com/i, 78],
  [/economy next/i, 75],
  [/marketwatch/i, 78],
  [/yahoo finance/i, 72],
  [/fortune/i, 75],
  [/business insider/i, 72],
]

export function sourceScore(source: string): number {
  for (const [re, score] of SOURCE_QUALITY) {
    if (re.test(source)) return score
  }
  return 55
}

export function freshnessScore(pubDateStr: string): number {
  if (!pubDateStr) return 65
  try {
    const d = new Date(pubDateStr)
    if (isNaN(d.getTime())) return 65
    const ageH = (Date.now() - d.getTime()) / 3_600_000
    if (ageH < 0)   return 70
    if (ageH < 6)   return 100
    if (ageH < 24)  return 88
    if (ageH < 48)  return 72
    if (ageH < 72)  return 58
    if (ageH < 168) return 30
    if (ageH < 720) return 10
    return 2
  } catch { return 65 }
}

export function combinedScore(a: NewsArticle): number {
  return freshnessScore(a.pubDate) * 2.2 + sourceScore(a.source)
}

export function stripHtml(s: string): string {
  return s
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s{2,}/g, ' ').trim()
}

export function ageLabel(pubDateStr: string): string {
  if (!pubDateStr) return 'recently'
  try {
    const d = new Date(pubDateStr)
    if (isNaN(d.getTime())) return 'recently'
    const ms = Date.now() - d.getTime()
    if (ms < 0) return 'just now'
    const h = ms / 3_600_000
    if (h < 1) return `${Math.round(ms / 60000)}m ago`
    if (h < 24) return `${Math.round(h)}h ago`
    const days = Math.round(h / 24)
    return days === 1 ? 'yesterday' : `${days}d ago`
  } catch { return 'recently' }
}

export function parseRss(xml: string, maxItems = 10): NewsArticle[] {
  const out: NewsArticle[] = []
  const items = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? []
  for (const item of items.slice(0, maxItems)) {
    try {
      const title = stripHtml(
        item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1] ??
        item.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? ''
      )
      const url =
        item.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() ??
        item.match(/<feedburner:origLink>([\s\S]*?)<\/feedburner:origLink>/)?.[1]?.trim() ?? ''
      const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() ?? ''
      const source = stripHtml(
        item.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] ?? 'News'
      )
      const raw = stripHtml(
        item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] ??
        item.match(/<description>([\s\S]*?)<\/description>/)?.[1] ?? ''
      )
      const summary = raw.replace(/^\s*[\d.\-•]+\s*/, '').slice(0, 200)
      if (title.length > 8 && url) {
        out.push({ title, source, url, pubDate, summary, ageLabel: ageLabel(pubDate) })
      }
    } catch {}
  }
  return out
}
