export type Recommendation = 'STRONG BUY' | 'BUY' | 'HOLD' | 'UNDERWEIGHT' | 'AVOID'

export interface SectorOutlook {
  name: string
  outlook: string
  signal: 'positive' | 'neutral' | 'negative'
}

export interface InvestmentReport {
  country: string
  generatedAt: string
  dataYear: string
  executiveSummary: string
  economicStrengths: string[]
  economicRisks: string[]
  tradeAnalysis: string
  investmentOpportunities: string[]
  keySectors: SectorOutlook[]
  growthOutlook: string
  overallRecommendation: Recommendation
  recommendationRationale: string
  confidenceScore: number
  generatedBy: string
}

export interface ReportRequest {
  countryName: string
  countryCode: string
  articles: string[]
  capital?: string | null
  region?: string | null
  gdp?: number | null
  gdpGrowth?: number | null
  population?: number | null
  inflation?: number | null
  unemployment?: number | null
  gdpPerCapita?: number | null
  riskScore?: number | null
  innovationScore?: number | null
  tradePartners?: string[]
  exports?: number | null
  imports?: number | null
  tradeBalance?: number | null
  tradeOpenness?: number | null
}
