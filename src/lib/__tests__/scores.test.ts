import { describe, it, expect } from 'vitest'
import { computeRiskScore, computeInnovation } from '@/lib/scores'

describe('computeRiskScore', () => {
  it('returns the baseline of 30 when all inputs are null', () => {
    expect(computeRiskScore(null, null, null, null)).toBe(30)
  })

  it('is always an integer clamped to 0..100', () => {
    const inflations = [null, -5, 0, 3, 8, 15, 50]
    const unemployments = [null, 2, 8, 15, 30]
    const growths = [null, -10, -1, 2, 4, 8]
    const gdpPcs = [null, 500, 3000, 10000, 20000, 60000]

    for (const inf of inflations) {
      for (const un of unemployments) {
        for (const g of growths) {
          for (const pc of gdpPcs) {
            const s = computeRiskScore(inf, un, g, pc)
            expect(s).toBeGreaterThanOrEqual(0)
            expect(s).toBeLessThanOrEqual(100)
            expect(Number.isInteger(s)).toBe(true)
          }
        }
      }
    }
  })

  it('clamps extreme distress to exactly 100', () => {
    expect(computeRiskScore(25, 25, -5, 500)).toBe(100)
  })

  it('raises the score as inflation climbs', () => {
    const base = computeRiskScore(2, null, null, null)
    expect(computeRiskScore(12, null, null, null)).toBeGreaterThan(base)
    expect(computeRiskScore(25, null, null, null)).toBeGreaterThan(computeRiskScore(12, null, null, null))
  })

  it('treats deflation as riskier than mild inflation', () => {
    expect(computeRiskScore(-1, null, null, null)).toBeGreaterThan(computeRiskScore(2, null, null, null))
  })

  it('raises the score as unemployment climbs', () => {
    const base = computeRiskScore(null, 3, null, null)
    expect(computeRiskScore(null, 12, null, null)).toBeGreaterThan(base)
    expect(computeRiskScore(null, 25, null, null)).toBeGreaterThan(computeRiskScore(null, 12, null, null))
  })

  it('rewards strong growth and penalises contraction', () => {
    const base = computeRiskScore(null, null, 1, null)
    expect(computeRiskScore(null, null, 6, null)).toBeLessThan(base)
    expect(computeRiskScore(null, null, -4, null)).toBeGreaterThan(base)
  })

  it('rewards wealth and penalises poverty', () => {
    const base = computeRiskScore(null, null, null, 10000)
    expect(computeRiskScore(null, null, null, 60000)).toBeLessThan(base)
    expect(computeRiskScore(null, null, null, 500)).toBeGreaterThan(base)
  })
})

describe('computeInnovation', () => {
  it('stays within 10..98 across the input space', () => {
    const gdpPcs = [null, 500, 5000, 15000, 30000, 80000]
    const lifeExps = [null, 50, 68, 75, 85]
    const risks = [0, 30, 60, 100]

    for (const pc of gdpPcs) {
      for (const le of lifeExps) {
        for (const r of risks) {
          const s = computeInnovation(pc, le, r)
          expect(s).toBeGreaterThanOrEqual(10)
          expect(s).toBeLessThanOrEqual(98)
          expect(Number.isInteger(s)).toBe(true)
        }
      }
    }
  })

  it('caps rich, long-lived, low-risk countries at 98', () => {
    expect(computeInnovation(60000, 85, 0)).toBe(98)
  })

  it('scores rich long-lived countries far above poor ones', () => {
    const rich = computeInnovation(55000, 83, 20)
    const poor = computeInnovation(800, 55, 80)
    expect(rich).toBeGreaterThan(poor)
    expect(rich).toBeGreaterThanOrEqual(90)
    expect(poor).toBeLessThanOrEqual(50)
  })

  it('gives a higher score to lower risk, all else equal', () => {
    expect(computeInnovation(20000, 75, 10)).toBeGreaterThan(computeInnovation(20000, 75, 90))
  })

  it('falls back to the baseline plus the risk bonus when data is missing', () => {
    expect(computeInnovation(null, null, 100)).toBe(40)
    expect(computeInnovation(null, null, 0)).toBe(55)
  })
})
