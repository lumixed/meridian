import { describe, it, expect, vi, afterEach } from 'vitest'
import { ageLabel, combinedScore, freshnessScore, parseRss, sourceScore, stripHtml } from '@/lib/news-scoring'

const NOW = new Date('2026-03-01T12:00:00Z').getTime()

function hoursAgo(h: number) {
  return new Date(NOW - h * 3_600_000).toUTCString()
}

function freezeClock() {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
}

afterEach(() => {
  vi.useRealTimers()
})

describe('sourceScore', () => {
  it('ranks wire services above aggregators', () => {
    expect(sourceScore('Reuters')).toBeGreaterThan(sourceScore('Yahoo Finance'))
    expect(sourceScore('Bloomberg')).toBeGreaterThan(sourceScore('Business Insider'))
  })

  it('matches case-insensitively', () => {
    expect(sourceScore('reuters business')).toBe(sourceScore('REUTERS'))
  })

  it('falls back to a neutral score for unknown outlets', () => {
    expect(sourceScore('Some Local Blog')).toBe(55)
  })
})

describe('freshnessScore', () => {
  it('decays monotonically as an article ages', () => {
    freezeClock()
    const scores = [1, 12, 36, 60, 100, 400, 1000].map(h => freshnessScore(hoursAgo(h)))
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeLessThan(scores[i - 1])
    }
  })

  it('treats missing and unparseable dates as recent-ish', () => {
    expect(freshnessScore('')).toBe(65)
    expect(freshnessScore('not a date')).toBe(65)
  })

  it('tolerates future dates from clock skew', () => {
    freezeClock()
    expect(freshnessScore(hoursAgo(-5))).toBe(70)
  })
})

describe('combinedScore', () => {
  it('prefers a fresh mid-tier story over a stale wire story', () => {
    freezeClock()
    const fresh = {
      title: 'Fresh', source: 'Some Local Blog', url: 'https://a.test',
      pubDate: hoursAgo(2), summary: '', ageLabel: '',
    }
    const stale = {
      title: 'Stale', source: 'Reuters', url: 'https://b.test',
      pubDate: hoursAgo(500), summary: '', ageLabel: '',
    }
    expect(combinedScore(fresh)).toBeGreaterThan(combinedScore(stale))
  })
})

describe('stripHtml', () => {
  it('removes tags and collapses whitespace', () => {
    expect(stripHtml('<p>Hello   <b>world</b></p>')).toBe('Hello world')
  })

  it('strips a second time after decoding escaped markup', () => {
    expect(stripHtml('Rates &lt;a href="x"&gt;rise&lt;/a&gt; again')).toBe('Rates rise again')
  })

  it('decodes the common named entities', () => {
    expect(stripHtml('Tech &amp; Trade &quot;deal&quot; &#39;signed&#39;')).toBe(`Tech & Trade "deal" 'signed'`)
  })
})

describe('ageLabel', () => {
  it('describes minutes, hours and days', () => {
    freezeClock()
    expect(ageLabel(hoursAgo(0.5))).toBe('30m ago')
    expect(ageLabel(hoursAgo(5))).toBe('5h ago')
    expect(ageLabel(hoursAgo(24))).toBe('yesterday')
    expect(ageLabel(hoursAgo(72))).toBe('3d ago')
  })

  it('degrades gracefully without a date', () => {
    expect(ageLabel('')).toBe('recently')
    expect(ageLabel('garbage')).toBe('recently')
  })
})

describe('parseRss', () => {
  const xml = `<rss><channel>
    <item>
      <title>Central bank holds rates steady</title>
      <link>https://news.test/one</link>
      <pubDate>Sat, 28 Feb 2026 09:00:00 GMT</pubDate>
      <source url="https://reuters.com">Reuters</source>
      <description>&lt;p&gt;Policy makers left the benchmark unchanged.&lt;/p&gt;</description>
    </item>
    <item>
      <title><![CDATA[Exports climb 4% on strong demand]]></title>
      <link>https://news.test/two</link>
      <pubDate>Fri, 27 Feb 2026 18:30:00 GMT</pubDate>
      <description><![CDATA[Shipments rose across the quarter.]]></description>
    </item>
    <item>
      <title>Tiny</title>
      <link>https://news.test/three</link>
    </item>
  </channel></rss>`

  it('extracts well-formed items and skips short or link-less ones', () => {
    const items = parseRss(xml)
    expect(items).toHaveLength(2)
    expect(items[0].title).toBe('Central bank holds rates steady')
    expect(items[0].source).toBe('Reuters')
    expect(items[0].summary).toBe('Policy makers left the benchmark unchanged.')
  })

  it('reads CDATA titles and descriptions', () => {
    const items = parseRss(xml)
    expect(items[1].title).toBe('Exports climb 4% on strong demand')
    expect(items[1].summary).toBe('Shipments rose across the quarter.')
  })

  it('defaults the source when the feed omits one', () => {
    expect(parseRss(xml)[1].source).toBe('News')
  })

  it('honours the maxItems cap', () => {
    expect(parseRss(xml, 1)).toHaveLength(1)
  })

  it('returns an empty list for junk input', () => {
    expect(parseRss('<rss></rss>')).toEqual([])
    expect(parseRss('')).toEqual([])
  })
})
