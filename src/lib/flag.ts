const OFFSET = 0x1f1e6 - 65

export function flagEmoji(iso2: string | undefined | null, fallback = '🌍'): string {
  if (!iso2 || iso2.length !== 2 || iso2 === '-99') return fallback
  try {
    return String.fromCodePoint(...iso2.toUpperCase().split('').map(c => OFFSET + c.charCodeAt(0)))
  } catch {
    return fallback
  }
}
