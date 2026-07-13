import { NextResponse } from 'next/server'
import { AI_MODEL, generateJSON } from '@/lib/ai'
import type { AnchorBriefing, BriefingRequest } from '@/types/briefing'

export const dynamic = 'force-dynamic'
export const maxDuration = 55

const BRIEFING_SCHEMA = {
  type: 'object',
  properties: {
    headline: { type: 'string', description: '12-18 word breaking opener with a real verifiable fact' },
    script: { type: 'string', description: '85-100 word live on-air broadcast script' },
    keyTakeaways: { type: 'array', items: { type: 'string' }, description: '3 number-backed bullets, each under 20 words' },
    investmentOutlook: { type: 'string', description: 'One specific forward-looking sentence' },
    risks: { type: 'array', items: { type: 'string' }, description: '2 quantified risks, under 15 words each' },
    opportunities: { type: 'array', items: { type: 'string' }, description: '2 specific opportunities, under 15 words each' },
    sectors: { type: 'array', items: { type: 'string' }, description: '3 sectors defining the economic story this quarter' },
  },
  required: ['headline', 'script', 'keyTakeaways', 'investmentOutlook', 'risks', 'opportunities', 'sectors'],
  additionalProperties: false,
}

function buildPrompt(b: BriefingRequest): string {
  const metricLines: string[] = []
  if (b.region) metricLines.push(`Region: ${b.region}`)
  if (b.capital) metricLines.push(`Capital: ${b.capital}`)
  if (b.population) metricLines.push(`Population: ${b.population.toFixed(1)}M`)
  if (b.gdp) metricLines.push(`GDP: $${(b.gdp / 1000).toFixed(3)}T (World Bank)`)
  if (b.gdpGrowth != null) metricLines.push(`GDP Growth: ${b.gdpGrowth > 0 ? '+' : ''}${b.gdpGrowth.toFixed(2)}% YoY (World Bank)`)
  if (b.inflation != null) metricLines.push(`CPI Inflation: ${b.inflation.toFixed(2)}% (World Bank)`)
  if (b.unemployment != null) metricLines.push(`Unemployment: ${b.unemployment.toFixed(2)}% (World Bank)`)
  if (b.gdpPerCapita) metricLines.push(`GDP per Capita: $${b.gdpPerCapita.toLocaleString('en-US')}`)

  const headlinesBlock = b.articles.length > 0
    ? b.articles.slice(0, 4).map((h, i) => `${i + 1}. ${h}`).join('\n')
    : 'No current market headlines available'

  const hookMetric = b.gdpGrowth != null
    ? `GDP expanding at ${b.gdpGrowth > 0 ? '+' : ''}${b.gdpGrowth.toFixed(1)}%`
    : b.inflation != null
    ? `inflation running at ${b.inflation.toFixed(1)}%`
    : b.gdp
    ? `a $${(b.gdp / 1000).toFixed(1)}T economy`
    : 'shifting economic conditions'

  const dateline = b.capital ?? b.countryName

  return `You are a senior TV economic correspondent. You are ON AIR filing a live report from ${dateline}.

Your mission: explain the single most important economic story in ${b.countryName} RIGHT NOW — what is happening, WHY it matters to investors, and what they should watch.

VERIFIED MACRO DATA (World Bank / IMF — you MUST cite these exact figures):
${metricLines.join('\n') || 'Data limited — use general context only'}

LIVE MARKET INTELLIGENCE:
${headlinesBlock}

KEY STORY HOOK: ${b.countryName} with ${hookMetric}.

BROADCAST STANDARDS — non-negotiable:
- script: 85–100 words. Present tense. Authoritative. Specific. ZERO generic filler.
- Cite at least 2 real numbers from the verified data. Explain their investor significance.
- Investor impact: who wins, who loses, what to watch next quarter.
- Never use vague words ("robust", "significant", "notable") without a number backing it.
- Open with: "From ${dateline} tonight:", "Markets are watching ${b.countryName}:", "Breaking from ${dateline}:", or "Economic Alert — ${b.countryName}:"
- keyTakeaways: 3 bullets. Each cites a real figure. Each under 20 words. Investor-focused.
- risks / opportunities: real and specific to ${b.countryName} — no generic language.`
}

function fallbackScript(b: BriefingRequest): string {
  const { countryName, gdpGrowth, inflation, gdp, population, gdpPerCapita } = b
  const lines = [`${countryName}'s economy commands attention from global markets.`]

  if (gdpGrowth != null) {
    const tone = gdpGrowth > 5
      ? 'expansion well above emerging-market benchmarks'
      : gdpGrowth > 2
      ? 'steady moderate momentum'
      : 'a cautious and fragile recovery'
    lines.push(`GDP growth of ${gdpGrowth > 0 ? '+' : ''}${gdpGrowth.toFixed(1)}% signals ${tone}.`)
  }

  if (inflation != null) {
    const tone = inflation > 7
      ? 'remains the dominant policy challenge for the central bank'
      : 'stays within a manageable range for now'
    lines.push(`Inflation at ${inflation.toFixed(1)}% ${tone}.`)
  }

  if (gdp) {
    const people = population ? ` and ${population.toFixed(0)} million citizens` : ''
    const income = gdpPerCapita ? ` and per-capita income at $${gdpPerCapita.toLocaleString('en-US')}` : ''
    lines.push(`With a $${(gdp / 1000).toFixed(1)}T economy${people}${income}, structural momentum and policy direction will define ${countryName}'s trajectory.`)
  } else {
    lines.push(`Structural momentum and global headwinds will define ${countryName}'s trajectory through the coming year.`)
  }

  return lines.join(' ')
}

function fallbackBriefing(b: BriefingRequest): AnchorBriefing {
  const takeaways: string[] = []
  if (b.gdpGrowth != null) takeaways.push(`GDP growth running at ${b.gdpGrowth > 0 ? '+' : ''}${b.gdpGrowth.toFixed(1)}% year over year`)
  if (b.inflation != null) takeaways.push(`CPI inflation at ${b.inflation.toFixed(1)}%${b.inflation > 7 ? ' — above target' : ''}`)
  if (b.gdpPerCapita) takeaways.push(`Per-capita income of $${b.gdpPerCapita.toLocaleString('en-US')}`)

  return {
    headline: `Economic Update: ${b.countryName}`,
    script: fallbackScript(b),
    keyTakeaways: takeaways,
    investmentOutlook: b.gdpGrowth != null && b.gdpGrowth > 2.5
      ? `Above-trend growth supports selective overweight positioning in ${b.countryName}.`
      : 'A benchmark-weight allocation is appropriate while macro signals stabilize.',
    risks: b.inflation != null && b.inflation > 7
      ? [`Inflation at ${b.inflation.toFixed(1)}% eroding real returns`]
      : [],
    opportunities: [],
    sectors: [],
    generatedBy: 'deterministic',
  }
}

export async function POST(req: Request) {
  let body: BriefingRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const ai = await generateJSON<Omit<AnchorBriefing, 'generatedBy'>>(
    buildPrompt(body),
    BRIEFING_SCHEMA,
    { effort: 'low' },
  )

  const briefing: AnchorBriefing = ai
    ? {
        ...ai,
        keyTakeaways: ai.keyTakeaways.slice(0, 3),
        risks: ai.risks.slice(0, 2),
        opportunities: ai.opportunities.slice(0, 2),
        sectors: ai.sectors.slice(0, 3),
        generatedBy: AI_MODEL,
      }
    : fallbackBriefing(body)

  return NextResponse.json(briefing)
}
