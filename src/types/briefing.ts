export interface AnchorBriefing {
  headline: string
  script: string
  keyTakeaways: string[]
  investmentOutlook: string
  risks: string[]
  opportunities: string[]
  sectors: string[]
  generatedBy: string
}

export interface BriefingRequest {
  countryName: string
  articles: string[]
  capital?: string | null
  region?: string | null
  gdp?: number | null
  gdpGrowth?: number | null
  population?: number | null
  inflation?: number | null
  unemployment?: number | null
  gdpPerCapita?: number | null
}
