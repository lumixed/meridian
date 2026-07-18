import { describe, it, expect, vi, afterEach } from 'vitest'
import { checkRateLimit, clientKey, limitAiRequest } from '@/lib/rate-limit'

let seed = 0

function uniqueKey(prefix: string) {
  seed++
  return `${prefix}-${seed}`
}

afterEach(() => {
  vi.useRealTimers()
})

describe('clientKey', () => {
  it('prefers the first hop of x-forwarded-for', () => {
    const req = new Request('https://x.test', {
      headers: { 'x-forwarded-for': '203.0.113.9, 70.41.3.18' },
    })
    expect(clientKey(req)).toBe('203.0.113.9')
  })

  it('falls back to x-real-ip, then to a local marker', () => {
    expect(clientKey(new Request('https://x.test', { headers: { 'x-real-ip': '198.51.100.4' } }))).toBe('198.51.100.4')
    expect(clientKey(new Request('https://x.test'))).toBe('local')
  })
})

describe('checkRateLimit', () => {
  it('allows requests up to the limit and blocks the next one', () => {
    const key = uniqueKey('burst')
    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit(key, 3, 60_000).allowed).toBe(true)
    }
    expect(checkRateLimit(key, 3, 60_000).allowed).toBe(false)
  })

  it('counts down the remaining allowance', () => {
    const key = uniqueKey('remaining')
    expect(checkRateLimit(key, 2, 60_000).remaining).toBe(1)
    expect(checkRateLimit(key, 2, 60_000).remaining).toBe(0)
    expect(checkRateLimit(key, 2, 60_000).remaining).toBe(0)
  })

  it('keeps separate budgets per key', () => {
    const a = uniqueKey('a')
    const b = uniqueKey('b')
    expect(checkRateLimit(a, 1, 60_000).allowed).toBe(true)
    expect(checkRateLimit(a, 1, 60_000).allowed).toBe(false)
    expect(checkRateLimit(b, 1, 60_000).allowed).toBe(true)
  })

  it('refills once the window has elapsed', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-07T00:00:00Z'))

    const key = uniqueKey('window')
    expect(checkRateLimit(key, 1, 60_000).allowed).toBe(true)
    expect(checkRateLimit(key, 1, 60_000).allowed).toBe(false)

    vi.setSystemTime(new Date('2026-08-07T00:01:01Z'))
    expect(checkRateLimit(key, 1, 60_000).allowed).toBe(true)
  })
})

describe('limitAiRequest', () => {
  it('returns null while under the limit', () => {
    const req = new Request('https://x.test', { headers: { 'x-real-ip': uniqueKey('ip') } })
    expect(limitAiRequest(req, 'report', 2)).toBeNull()
  })

  it('returns a 429 with a Retry-After header once exceeded', () => {
    const ip = uniqueKey('ip')
    const req = new Request('https://x.test', { headers: { 'x-real-ip': ip } })

    expect(limitAiRequest(req, 'report', 1)).toBeNull()
    const blocked = limitAiRequest(req, 'report', 1)

    expect(blocked?.status).toBe(429)
    expect(Number(blocked?.headers.get('Retry-After'))).toBeGreaterThan(0)
  })

  it('scopes budgets per route name', () => {
    const ip = uniqueKey('ip')
    const req = new Request('https://x.test', { headers: { 'x-real-ip': ip } })

    expect(limitAiRequest(req, 'report', 1)).toBeNull()
    expect(limitAiRequest(req, 'report', 1)).not.toBeNull()
    expect(limitAiRequest(req, 'anchor', 1)).toBeNull()
  })
})
