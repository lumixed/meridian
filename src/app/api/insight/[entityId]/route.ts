import { AI_MODEL, aiEnabled, getClient } from '@/lib/ai'

export const dynamic = 'force-dynamic'
export const maxDuration = 55

const OFFLINE_NOTE =
  'AI intelligence is offline (no ANTHROPIC_API_KEY configured). All metric panels above are live World Bank data.'

function buildCountryPrompt(name: string, mode: string, dataBlock: string, headlineBlock: string): string {
  if (mode === 'anchor') {
    return `You are a broadcast TV economic anchor delivering a live 45-second briefing on ${name}. Use ONLY the verified data and headlines below. Speak in present tense. Open with the most significant current development. Include GDP trajectory, one key risk, and one opportunity. Close with a forward-looking outlook sentence. 90-130 words. No bullet points. Start immediately — no greeting.${headlineBlock}${dataBlock}`
  }
  if (mode === 'investment') {
    return `Investment strategist brief for ${name} — 90 words: top sector opportunity, key structural risk, one near-term catalyst. Be specific. Use numbers from data. No generic statements.${dataBlock}`
  }
  return `You are an economic intelligence analyst. Write a concise 110-word briefing for ${name} strictly based on the data below. Do NOT invent figures. Highlight growth trajectory, a key structural advantage, the top risk factor, and one investment theme. Terminal-desk voice. No bullet points. Start immediately with content — no title, no preamble.${dataBlock}`
}

export async function GET(req: Request, { params }: { params: Promise<{ entityId: string }> }) {
  const { entityId } = await params
  const id = decodeURIComponent(entityId)
  const url = new URL(req.url)
  const type = url.searchParams.get('type') || 'city'
  const mode = url.searchParams.get('mode') || 'brief'

  let prompt: string

  if (type === 'country') {
    const fields: [string, string][] = [
      ['Region', 'region'],
      ['Capital', 'capital'],
      ['Currency', 'currency'],
      ['Population', 'population'],
      ['GDP', 'gdp'],
      ['GDP Growth', 'gdpGrowth'],
      ['GDP per Capita', 'gdpPerCapita'],
      ['Inflation', 'inflation'],
      ['Unemployment', 'unemployment'],
      ['Life Expectancy', 'lifeExpectancy'],
      ['Risk Score', 'risk'],
    ]
    const units: Record<string, [string, string]> = {
      population: ['', 'M'],
      gdp: ['$', 'B'],
      gdpGrowth: ['', '%'],
      gdpPerCapita: ['$', ''],
      inflation: ['', '%'],
      unemployment: ['', '%'],
      lifeExpectancy: ['', ' years'],
      risk: ['', '/100'],
    }

    const dataLines: string[] = []
    for (const [label, key] of fields) {
      const v = url.searchParams.get(key)
      if (!v) continue
      const [prefix, suffix] = units[key] ?? ['', '']
      dataLines.push(`${label}: ${prefix}${v}${suffix}`)
    }

    const headlines: string[] = []
    for (let i = 0; i < 5; i++) {
      const h = url.searchParams.get(`h${i}`)
      if (h) headlines.push(h)
    }

    const dataBlock = dataLines.length > 0
      ? `\n\nVerified economic data (World Bank):\n${dataLines.join('\n')}`
      : ''
    const headlineBlock = headlines.length > 0
      ? `\n\nLatest news headlines:\n${headlines.map((h, i) => `${i + 1}. ${h}`).join('\n')}`
      : ''

    prompt = buildCountryPrompt(id, mode, dataBlock, headlineBlock)
  } else {
    const country = url.searchParams.get('country') || ''
    const cityName = id.replace(/^city#/, '').replace(/-/g, ' ')
    prompt = `Economic intelligence brief for ${cityName}${country ? `, ${country}` : ''} (city). In 110 words: economic role in the region, dominant industries, investment appeal, one overlooked strength, growth trajectory. Terminal-desk voice. No bullet points. Start directly with content — no title.`
  }

  if (!aiEnabled()) {
    return new Response(OFFLINE_NOTE, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  }

  const encoder = new TextEncoder()

  const body = new ReadableStream({
    async start(controller) {
      try {
        const stream = getClient().messages.stream({
          model: AI_MODEL,
          max_tokens: 8192,
          output_config: { effort: 'low' },
          messages: [{ role: 'user', content: prompt }],
        })

        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }
      } catch {
        controller.enqueue(encoder.encode(''))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
