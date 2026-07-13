import { NextResponse } from 'next/server'
import { AI_MODEL, generateJSON } from '@/lib/ai'
import { getCountrySectors } from '@/lib/sectors'
import type { InvestmentReport, Recommendation, ReportRequest, SectorOutlook } from '@/types/report'

export const dynamic = 'force-dynamic'
export const maxDuration = 55

type ReportBody = Omit<InvestmentReport, 'country' | 'generatedAt' | 'dataYear' | 'generatedBy'>

const RECOMMENDATIONS: Recommendation[] = ['STRONG BUY', 'BUY', 'HOLD', 'UNDERWEIGHT', 'AVOID']

function deriveRecommendation(r: ReportRequest): Recommendation {
  const risk = r.riskScore ?? 50
  const growth = r.gdpGrowth ?? 0
  const inflation = r.inflation ?? 5
  const innov = r.innovationScore ?? 40

  const growthPts = Math.min(Math.max(growth * 5, -15), 35)
  const riskPts = Math.max(0, 35 - risk * 0.35)
  const inflPts = inflation < 2.5 ? 18 : inflation < 5 ? 15 : inflation < 8 ? 10 : inflation < 15 ? 4 : 0
  const innovPts = Math.min(innov * 0.1, 10)
  const total = growthPts + riskPts + inflPts + innovPts

  if (total >= 72) return 'STRONG BUY'
  if (total >= 58) return 'BUY'
  if (total >= 40) return 'HOLD'
  if (total >= 22) return 'UNDERWEIGHT'
  return 'AVOID'
}

function buildDeterministicReport(r: ReportRequest): ReportBody {
  const gdpStr = r.gdp ? `$${(r.gdp / 1000).toFixed(2)}T` : null
  const growthStr = r.gdpGrowth != null ? `${r.gdpGrowth > 0 ? '+' : ''}${r.gdpGrowth.toFixed(1)}%` : null
  const inflStr = r.inflation != null ? `${r.inflation.toFixed(1)}%` : null
  const unemplStr = r.unemployment != null ? `${r.unemployment.toFixed(1)}%` : null
  const perCapStr = r.gdpPerCapita ? `$${r.gdpPerCapita.toLocaleString('en-US')}` : null

  const growth = r.gdpGrowth ?? 0
  const risk = r.riskScore ?? 50
  const innov = r.innovationScore ?? 40
  const inflation = r.inflation ?? 5
  const [sec1, sec2, sec3] = getCountrySectors(r.countryCode, r.region)
  const rec = deriveRecommendation(r)

  const summaryParts: string[] = []
  if (gdpStr && growthStr) {
    const pace = growth > 5
      ? "placing it among the world's fastest-growing major economies"
      : growth > 2
      ? 'tracking above the global 2.5% average'
      : growth > 0
      ? 'in moderate expansion territory'
      : 'in a contraction or stagnation phase'
    summaryParts.push(`${r.countryName} maintains a ${gdpStr} economy expanding at ${growthStr} YoY — ${pace}.`)
  } else if (gdpStr) {
    summaryParts.push(`${r.countryName} operates a ${gdpStr} economy with a macro profile that warrants close investor monitoring.`)
  } else {
    summaryParts.push(`${r.countryName} presents a macro profile shaped by regional dynamics and structural factors.`)
  }

  if (inflStr) {
    const read = inflation > 10
      ? 'is a dominant policy challenge — central bank credibility and real yield compression are key investor risks'
      : inflation > 6
      ? 'remains elevated, creating real-income pressure and monetary policy uncertainty'
      : inflation < 2.5
      ? 'is well-anchored, supporting real returns and bond market stability'
      : 'sits within a manageable range, supporting monetary policy flexibility'
    summaryParts.push(`CPI inflation of ${inflStr} ${read}.`)
  }

  if (perCapStr) {
    const stance = rec === 'STRONG BUY' || rec === 'BUY'
      ? 'the risk-adjusted opportunity set favors selective overweight positioning'
      : rec === 'HOLD'
      ? 'a balanced, benchmark-weight allocation is appropriate'
      : 'elevated macro risks argue for caution and underweight positioning'
    summaryParts.push(`At ${perCapStr} per capita, ${stance}.`)
  }

  const strengths: string[] = []
  if (growthStr && growth > 1) {
    const framing = growth > 5
      ? `as one of the world's highest-growth major economies, outpacing the ~2.5% global average by ${(growth - 2.5).toFixed(1)} percentage points`
      : growth > 2.5
      ? 'above the global 2.5% trend, signaling structural economic momentum'
      : 'in positive expansion territory, delivering real income gains'
    strengths.push(`GDP growth of ${growthStr} YoY positions ${r.countryName} ${framing}.`)
  }
  if (perCapStr && r.gdpPerCapita && r.gdpPerCapita > 8000) {
    strengths.push(`Per-capita income of ${perCapStr} supports a ${r.gdpPerCapita > 30000 ? 'high-income consumer economy with sophisticated demand patterns' : 'growing middle class, expanding domestic consumption and retail opportunity'}.`)
  }
  if (r.tradeOpenness && r.tradeOpenness > 40) {
    strengths.push(`Trade openness of ${r.tradeOpenness}% of GDP reflects deep global integration — ${r.tradeOpenness > 100 ? 'a hallmark of entrepôt economies with structural current-account strength' : 'supporting export competitiveness and FDI attraction'}.`)
  }
  if (r.innovationScore && r.innovationScore > 48) {
    strengths.push(`Innovation index of ${r.innovationScore}/100 indicates a competitive knowledge economy, driving productivity growth and high-value-added sector development.`)
  }
  if (r.tradeBalance && r.tradeBalance > 0) {
    strengths.push(`Positive trade balance of +$${r.tradeBalance.toFixed(0)}B underlines export competitiveness and provides a structural buffer against external funding vulnerabilities.`)
  }
  if (r.population && r.population > 60) {
    strengths.push(`A population of ${r.population.toFixed(0)}M provides a large domestic labor force and consumer market — a structural advantage for long-term growth compounding.`)
  }
  if (r.exports && r.exports > 100) {
    strengths.push(`Export base of $${r.exports.toFixed(0)}B demonstrates significant production capacity and integration into global value chains.`)
  }

  const strengthFallbacks = [
    `${sec1} serves as a structural backbone of ${r.countryName}'s economy, providing resilience through commodity and trade cycles.`,
    `Regional positioning in ${r.region ?? 'the global economy'} confers strategic trade, diplomatic, and financial-flow advantages.`,
    'Institutional market frameworks and regulatory infrastructure support continued FDI inflows and capital market development.',
    'Demographic and urbanization trends provide a multi-decade structural tailwind for domestic consumption and services growth.',
    'Natural resource endowments and geographic positioning underpin long-term export revenue and economic diversification potential.',
  ]
  for (const fb of strengthFallbacks) {
    if (strengths.length >= 4) break
    strengths.push(fb)
  }

  const risks: string[] = []
  if (inflation > 7 && inflStr) {
    risks.push(`Inflation at ${inflStr} exceeds most central banks' 2–4% policy target, compressing real household purchasing power and complicating monetary policy normalization.`)
  }
  if (risk > 55) {
    risks.push(`Composite risk score of ${risk}/100 reflects meaningful exposure to geopolitical, governance, or credit-cycle risks that institutional investors must price into discount rates.`)
  }
  if (r.unemployment && r.unemployment > 8 && unemplStr) {
    risks.push(`Unemployment at ${unemplStr} points to structural labor-market inefficiencies, fiscal drag from social spending, and constrained household income growth.`)
  }
  if (growth < 1 && growthStr) {
    risks.push(`GDP growth of ${growthStr} sits below the global 2.5% trend — raising questions about structural reform momentum and medium-term earnings growth prospects.`)
  }
  if (r.tradeBalance && r.tradeBalance < -20) {
    risks.push(`Trade deficit of $${Math.abs(r.tradeBalance).toFixed(0)}B creates persistent current-account vulnerability and dependency on external capital inflows.`)
  }

  const riskFallbacks = [
    'Global monetary tightening and elevated real rates present material refinancing risk for sovereign and corporate borrowers.',
    'Currency volatility and commodity price cycles create earnings uncertainty across export-dependent sectors.',
    'Geopolitical tensions and supply-chain realignment may constrain FDI and trade growth in the medium term.',
    'Fiscal consolidation pressures may limit public investment capacity, acting as a structural headwind on growth.',
  ]
  for (const fb of riskFallbacks) {
    if (risks.length >= 3) break
    risks.push(fb)
  }

  let tradeAnalysis: string
  if (r.exports && r.imports) {
    const bal = r.tradeBalance ?? r.exports - r.imports
    tradeAnalysis = `${r.countryName} recorded exports of $${r.exports.toFixed(0)}B against imports of $${r.imports.toFixed(0)}B — a trade balance of ${bal >= 0 ? '+' : ''}$${bal.toFixed(0)}B.`
    if (r.tradePartners?.length) {
      tradeAnalysis += ` Key partners — ${r.tradePartners.slice(0, 4).join(', ')} — anchor the country's external revenue base and define its geopolitical-economic alignment.`
    }
    if (r.tradeOpenness) {
      const read = r.tradeOpenness > 80
        ? 'is extremely high, making the economy highly sensitive to global demand conditions'
        : r.tradeOpenness > 40
        ? 'reflects meaningful global integration with structural export diversification upside'
        : 'indicates a domestically-oriented economy with room to deepen trade relationships'
      tradeAnalysis += ` At ${r.tradeOpenness}% of GDP, trade openness ${read}.`
    }
  } else if (r.tradePartners?.length) {
    tradeAnalysis = `${r.countryName}'s trade architecture is anchored by relationships with ${r.tradePartners.slice(0, 5).join(', ')}, shaping its external account dynamics, FX exposure, and vulnerability to partner-country cycles.`
  } else {
    tradeAnalysis = `${r.countryName}'s external sector reflects its position within ${r.region ?? 'the global economy'} — balancing commodity exports, services flows, and strategic trade partnerships that define long-term current-account sustainability.`
  }

  const opportunities: string[] = []
  if (innov > 55 && growthStr) {
    opportunities.push(`${sec1}: Innovation index of ${innov}/100 combined with ${growthStr} GDP expansion creates compelling opportunities in high-value-added, knowledge-intensive subsectors.`)
  } else if (growth > 4 && growthStr) {
    opportunities.push(`${sec1}: ${growthStr} economic expansion is driving above-trend sectoral revenue growth, rewarding early and growth-stage positioning.`)
  } else {
    opportunities.push(`${sec1}: Structural demand and policy support create selective alpha opportunities for patient, long-horizon capital.`)
  }

  if (perCapStr && r.gdpPerCapita && r.gdpPerCapita < 15000) {
    opportunities.push(`${sec2}: At ${perCapStr} per capita, ${r.countryName} remains in the economic convergence phase — creating a rare window for infrastructure, productivity catch-up, and consumer market entry.`)
  } else if (r.tradeOpenness && r.tradeOpenness > 60) {
    opportunities.push(`${sec2}: High trade openness creates platform advantages — companies using ${r.countryName} as a regional hub can access significantly larger addressable markets.`)
  } else {
    opportunities.push(`${sec2}: Policy tailwinds and sectoral reforms are opening new opportunities for strategic capital allocation.`)
  }

  opportunities.push(`${sec3}: Regional integration momentum and ${r.countryName}'s trade network position enhance revenue diversification and risk-adjusted return profiles for cross-border investors.`)

  const secSignals: [string, SectorOutlook['signal']][] = [
    [sec1, (growth > 2 && innov > 45) || growth > 5 ? 'positive' : 'neutral'],
    [sec2, inflation < 7 && risk < 60 ? 'positive' : inflation > 10 || risk > 70 ? 'negative' : 'neutral'],
    [sec3, risk < 55 ? 'neutral' : 'negative'],
  ]

  const keySectors: SectorOutlook[] = secSignals.map(([name, signal]) => ({
    name,
    outlook: signal === 'positive'
      ? 'Positive macro tailwinds and structural demand support above-trend sector performance.'
      : signal === 'neutral'
      ? 'Mixed macro signals warrant selective positioning; monitor policy and external conditions closely.'
      : 'Elevated headwinds — macro volatility and risk discount apply; caution advised pending stabilization.',
    signal,
  }))

  let growthOutlook: string
  if (growthStr) {
    const inflClause = inflStr
      ? `managing ${inflStr} inflation and its impact on monetary policy`
      : 'navigating global macro headwinds'
    const forward = growth > 5
      ? 'the growth engine appears well-fueled — barring a sharp external shock, above-trend expansion should persist, driven by domestic investment and export demand'
      : growth > 2.5
      ? 'moderate but steady expansion is the base case, contingent on policy continuity and stable external demand from key trading partners'
      : growth > 0
      ? 'recovery remains modest and dependent on structural reform execution, fiscal credibility, and sustained FDI inflows'
      : 'renewed contraction risk warrants defensive positioning — monitor IMF program compliance and central bank policy for turning-point signals'
    growthOutlook = `${r.countryName}'s near-term path hinges on sustaining ${growthStr} GDP momentum while ${inflClause}. Over the next 12–18 months, ${forward}.`
  } else {
    growthOutlook = `${r.countryName}'s growth outlook is shaped by structural reform progress, commodity cycle positioning, and external demand from key trading partners over the next 12–18 months.`
  }

  const closing = rec === 'STRONG BUY'
    ? 'The convergence of strong growth, controlled inflation, and manageable risk creates a high-conviction risk-adjusted entry point for long-horizon allocations.'
    : rec === 'BUY'
    ? 'Despite pockets of macro uncertainty, the growth trajectory and sector opportunity set justify overweight exposure for mandates with 2–4 year time horizons.'
    : rec === 'HOLD'
    ? 'Balanced risk-reward argues for maintaining current exposure at or near benchmark weight while monitoring policy evolution and external sector developments.'
    : rec === 'UNDERWEIGHT'
    ? 'Elevated macro risks and uncertain growth visibility recommend reducing exposure below benchmark until a clearer stabilization signal emerges.'
    : 'Severe macro imbalances or elevated political risk warrant avoiding new positions until a definitive stabilization catalyst is confirmed.'

  const rationale = `Our ${rec} rating reflects a composite macro assessment: risk score of ${risk}/100, GDP growth of ${growthStr ?? 'limited data'}, and inflation of ${inflStr ?? 'limited data'}. ${closing}`

  const dataFields = [r.gdp, r.gdpGrowth, r.inflation, r.unemployment, r.gdpPerCapita, r.riskScore, r.innovationScore, r.exports, r.imports]
  const filledCount = dataFields.filter(f => f != null).length

  return {
    executiveSummary: summaryParts.join(' '),
    economicStrengths: strengths.slice(0, 4),
    economicRisks: risks.slice(0, 3),
    tradeAnalysis,
    investmentOpportunities: opportunities.slice(0, 3),
    keySectors: keySectors.slice(0, 3),
    growthOutlook,
    overallRecommendation: rec,
    recommendationRationale: rationale,
    confidenceScore: Math.max(4, Math.round(3 + (filledCount / dataFields.length) * 6)),
  }
}

const REPORT_SCHEMA = {
  type: 'object',
  properties: {
    executiveSummary: { type: 'string', description: '2-3 sentences citing real numbers' },
    economicStrengths: { type: 'array', items: { type: 'string' }, description: '4 metric-specific strengths' },
    economicRisks: { type: 'array', items: { type: 'string' }, description: '3 quantified risks' },
    tradeAnalysis: { type: 'string', description: '1 paragraph on trade position with actual figures' },
    investmentOpportunities: { type: 'array', items: { type: 'string' }, description: '3 sector-specific opportunities' },
    keySectors: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          outlook: { type: 'string', description: 'one-sentence outlook' },
          signal: { type: 'string', enum: ['positive', 'neutral', 'negative'] },
        },
        required: ['name', 'outlook', 'signal'],
        additionalProperties: false,
      },
    },
    growthOutlook: { type: 'string', description: '2 sentences on 12-18 month forward view' },
    overallRecommendation: { type: 'string', enum: RECOMMENDATIONS },
    recommendationRationale: { type: 'string', description: '2 sentences citing risk score and growth' },
    confidenceScore: { type: 'integer', description: '1-10 confidence in this analysis' },
  },
  required: [
    'executiveSummary', 'economicStrengths', 'economicRisks', 'tradeAnalysis',
    'investmentOpportunities', 'keySectors', 'growthOutlook',
    'overallRecommendation', 'recommendationRationale', 'confidenceScore',
  ],
  additionalProperties: false,
}

function buildReportPrompt(r: ReportRequest): string {
  const metrics: string[] = []
  if (r.region) metrics.push(`Region: ${r.region}`)
  if (r.capital) metrics.push(`Capital: ${r.capital}`)
  if (r.population) metrics.push(`Population: ${r.population.toFixed(1)}M`)
  if (r.gdp) metrics.push(`GDP: $${(r.gdp / 1000).toFixed(3)}T`)
  if (r.gdpGrowth != null) metrics.push(`GDP Growth: ${r.gdpGrowth > 0 ? '+' : ''}${r.gdpGrowth.toFixed(2)}% YoY`)
  if (r.gdpPerCapita) metrics.push(`GDP per Capita: $${r.gdpPerCapita.toLocaleString('en-US')}`)
  if (r.inflation != null) metrics.push(`CPI Inflation: ${r.inflation.toFixed(2)}%`)
  if (r.unemployment != null) metrics.push(`Unemployment Rate: ${r.unemployment.toFixed(2)}%`)
  if (r.riskScore != null) metrics.push(`Risk Score: ${r.riskScore}/100 (Meridian composite)`)
  if (r.innovationScore != null) metrics.push(`Innovation Index: ${r.innovationScore}/100`)
  if (r.exports != null) metrics.push(`Exports: $${r.exports}B`)
  if (r.imports != null) metrics.push(`Imports: $${r.imports}B`)
  if (r.tradeBalance != null) metrics.push(`Trade Balance: ${r.tradeBalance >= 0 ? '+' : ''}$${r.tradeBalance}B`)
  if (r.tradeOpenness != null) metrics.push(`Trade/GDP: ${r.tradeOpenness}%`)
  if (r.tradePartners?.length) metrics.push(`Top Partners: ${r.tradePartners.slice(0, 5).join(', ')}`)

  const headlines = r.articles.length > 0
    ? r.articles.slice(0, 5).map((h, i) => `${i + 1}. ${h}`).join('\n')
    : 'No current market headlines — base analysis on macro data only'

  return `You are a Managing Director at a Tier-1 investment bank writing an institutional research note on ${r.countryName}.

This report will be read by sovereign wealth funds, hedge funds, and institutional LPs. Every claim must be anchored to the verified data below. No filler. No generic language.

VERIFIED MACRO DATA (World Bank / IMF):
${metrics.join('\n') || 'Data limited'}

CURRENT MARKET INTELLIGENCE:
${headlines}

Produce: an executive summary (2-3 sentences citing real numbers), exactly 4 metric-specific economic strengths, exactly 3 quantified economic risks, a trade analysis paragraph with actual figures, exactly 3 sector-specific investment opportunities, exactly 3 key sectors each with a one-sentence outlook and a positive/neutral/negative signal, a 2-sentence 12-18 month growth outlook, an overall recommendation, a 2-sentence rationale citing the risk score and growth, and a 1-10 confidence score.`
}

function mergeReport(p: ReportBody, r: ReportRequest): ReportBody {
  const det = buildDeterministicReport(r)
  return {
    executiveSummary: p.executiveSummary.length > 30 ? p.executiveSummary : det.executiveSummary,
    economicStrengths: p.economicStrengths.length >= 3 ? p.economicStrengths.slice(0, 4) : det.economicStrengths,
    economicRisks: p.economicRisks.length >= 2 ? p.economicRisks.slice(0, 3) : det.economicRisks,
    tradeAnalysis: p.tradeAnalysis.length > 20 ? p.tradeAnalysis : det.tradeAnalysis,
    investmentOpportunities: p.investmentOpportunities.length >= 2 ? p.investmentOpportunities.slice(0, 3) : det.investmentOpportunities,
    keySectors: p.keySectors.length >= 1 ? p.keySectors.slice(0, 3) : det.keySectors,
    growthOutlook: p.growthOutlook.length > 20 ? p.growthOutlook : det.growthOutlook,
    overallRecommendation: RECOMMENDATIONS.includes(p.overallRecommendation) ? p.overallRecommendation : det.overallRecommendation,
    recommendationRationale: p.recommendationRationale.length > 20 ? p.recommendationRationale : det.recommendationRationale,
    confidenceScore: Math.min(10, Math.max(1, Math.round(p.confidenceScore))) || det.confidenceScore,
  }
}

export async function POST(req: Request) {
  let body: ReportRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const ai = await generateJSON<ReportBody>(buildReportPrompt(body), REPORT_SCHEMA, { effort: 'high' })
  const parsed = ai ? mergeReport(ai, body) : buildDeterministicReport(body)

  const report: InvestmentReport = {
    country: body.countryName,
    generatedAt: new Date().toISOString(),
    dataYear: String(new Date().getFullYear() - 2),
    generatedBy: ai ? AI_MODEL : 'deterministic',
    ...parsed,
  }

  return NextResponse.json(report)
}
