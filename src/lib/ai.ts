import Anthropic from '@anthropic-ai/sdk'

export const AI_MODEL = process.env.CLAUDE_MODEL ?? 'claude-opus-5'

export function aiEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

let client: Anthropic | null = null

export function getClient(): Anthropic {
  if (!client) client = new Anthropic()
  return client
}

interface GenerateOptions {
  maxTokens?: number
  effort?: 'low' | 'medium' | 'high'
}

export async function generateJSON<T>(
  prompt: string,
  schema: Record<string, unknown>,
  opts: GenerateOptions = {},
): Promise<T | null> {
  if (!aiEnabled()) return null

  const { maxTokens = 16000, effort = 'medium' } = opts

  try {
    const response = await getClient().messages.create({
      model: AI_MODEL,
      max_tokens: maxTokens,
      output_config: { effort, format: { type: 'json_schema', schema } },
      messages: [{ role: 'user', content: prompt }],
    })
    if (response.stop_reason === 'refusal') return null

    const text = response.content.find(b => b.type === 'text')?.text
    if (!text) return null

    return JSON.parse(text) as T
  } catch {
    return null
  }
}
