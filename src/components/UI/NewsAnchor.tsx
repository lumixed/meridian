'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { flagEmoji } from '@/lib/flag'
import type { AnchorBriefing } from '@/types/briefing'
import type { CountryData } from '@/types/country'
import type { SelectedEntity } from '@/types/globe'

function PresenterSVG({ isOnAir }: { isOnAir: boolean }) {
  return (
    <svg viewBox="0 0 88 116" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <radialGradient id="ps-bg" cx="50%" cy="25%" r="80%">
          <stop offset="0%" stopColor="#0f2b28" />
          <stop offset="100%" stopColor="#06120f" />
        </radialGradient>
        <radialGradient id="ps-face" cx="48%" cy="38%" r="65%">
          <stop offset="0%" stopColor="#f8cead" />
          <stop offset="65%" stopColor="#eaaa78" />
          <stop offset="100%" stopColor="#d4956a" />
        </radialGradient>
        <linearGradient id="ps-hair" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#331608" />
          <stop offset="100%" stopColor="#110600" />
        </linearGradient>
        <linearGradient id="ps-suit" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#155e52" />
          <stop offset="100%" stopColor="#0a2e28" />
        </linearGradient>
        <linearGradient id="ps-desk" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0c2e29" />
          <stop offset="100%" stopColor="#05120f" />
        </linearGradient>
        <radialGradient id="ps-light" cx="50%" cy="0%" r="70%">
          <stop offset="0%" stopColor="rgba(150,255,220,0.10)" />
          <stop offset="100%" stopColor="rgba(150,255,220,0)" />
        </radialGradient>
      </defs>

      <rect width="88" height="116" fill="url(#ps-bg)" />
      <rect width="88" height="116" fill="url(#ps-light)" />

      <path d="M0,90 L88,90 L88,116 L0,116 Z" fill="url(#ps-desk)" />
      <line x1="0" y1="90" x2="88" y2="90" stroke="rgba(69,224,192,0.18)" strokeWidth="0.5" />

      <path d="M8,85 Q24,68 44,64 Q64,68 80,85 L88,116 L0,116 Z" fill="url(#ps-suit)" />
      <path d="M37,70 L44,64 L51,70 L49,84 L39,84 Z" fill="rgba(255,255,255,0.07)" />
      <path d="M40,72 L44,64 L48,72 L47,82 L41,82 Z" fill="rgba(255,255,255,0.07)" />

      <rect x="37" y="54" width="14" height="13" rx="5" fill="url(#ps-face)" />
      <ellipse cx="44" cy="36" rx="21" ry="23" fill="url(#ps-face)" />

      <path d="M23,33 Q23,13 44,11 Q65,13 65,33 Q66,22 62,15 Q54,6 44,5 Q34,6 26,15 Q22,22 23,33 Z" fill="url(#ps-hair)" />
      <path d="M23,31 Q19,40 21,52 Q23,58 27,62 Q25,52 26,44 Q24,37 25,31 Z" fill="url(#ps-hair)" />
      <path d="M65,31 Q69,40 67,52 Q65,58 61,62 Q63,52 62,44 Q64,37 63,31 Z" fill="url(#ps-hair)" />

      <ellipse cx="24" cy="37" rx="2.8" ry="3.8" fill="#eaaa78" />
      <ellipse cx="64" cy="37" rx="2.8" ry="3.8" fill="#eaaa78" />
      <circle cx="23" cy="39" r="1.4" fill="#45E0C0" opacity="0.9" />
      <circle cx="65" cy="39" r="1.4" fill="#45E0C0" opacity="0.9" />

      <path d="M30,27 Q36,24 41,27" stroke="#331608" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d="M47,27 Q52,24 58,27" stroke="#331608" strokeWidth="1.4" fill="none" strokeLinecap="round" />

      <ellipse cx="36" cy="33" rx="5" ry="3.8" fill="white" />
      <ellipse cx="52" cy="33" rx="5" ry="3.8" fill="white" />
      <circle cx="37" cy="33.5" r="2.8" fill="#4a2810" />
      <circle cx="53" cy="33.5" r="2.8" fill="#4a2810" />
      <circle cx="37" cy="33.5" r="1.6" fill="#110604" />
      <circle cx="53" cy="33.5" r="1.6" fill="#110604" />
      <circle cx="38" cy="32" r="0.9" fill="white" opacity="0.95" />
      <circle cx="54" cy="32" r="0.9" fill="white" opacity="0.95" />
      <path d="M31,30 Q36,27 41,30" stroke="#220e06" strokeWidth="1.2" fill="none" />
      <path d="M47,30 Q52,27 57,30" stroke="#220e06" strokeWidth="1.2" fill="none" />

      <path d="M41,42 Q40,46 39,48 Q44,49 49,48 Q48,46 47,42 Z" fill="rgba(160,90,55,0.20)" />

      <path d="M37,51 Q40,48 44,51 Q48,48 51,51 Q48,55 44,54 Q40,55 37,51 Z" fill="#a84535" />
      <path d="M39,51 Q44,53 49,51" stroke="rgba(240,170,150,0.30)" strokeWidth="0.6" fill="none" />

      <ellipse cx="32" cy="42" rx="7" ry="4" fill="rgba(220,90,70,0.06)" />
      <ellipse cx="56" cy="42" rx="7" ry="4" fill="rgba(220,90,70,0.06)" />

      <rect x="49" y="72" width="3.5" height="6" rx="1.75" fill="#888" opacity="0.85" />

      <rect x="4" y="94" width="56" height="16" rx="3" fill="rgba(69,224,192,0.07)" stroke="rgba(69,224,192,0.18)" strokeWidth="0.5" />
      <text x="32" y="103.5" textAnchor="middle" fill="#45E0C0" fontSize="5" fontFamily="system-ui,-apple-system,sans-serif" fontWeight="700" letterSpacing="1.2">MERIDIAN</text>
      <text x="32" y="108" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="3.8" fontFamily="system-ui,-apple-system,sans-serif" letterSpacing="0.5">ECONOMIC INTELLIGENCE</text>

      <rect x="64" y="94" width="20" height="16" rx="3" fill="rgba(239,68,68,0.10)" stroke="rgba(239,68,68,0.28)" strokeWidth="0.5" />
      <circle cx="69" cy="100" r="2" fill="#ef4444">
        {isOnAir && <animate attributeName="opacity" values="1;0.2;1" dur="1.2s" repeatCount="indefinite" />}
      </circle>
      <text x="76" y="103.5" textAnchor="middle" fill="#ef4444" fontSize="4.5" fontFamily="system-ui,-apple-system,sans-serif" fontWeight="700">LIVE</text>
      <text x="74" y="108" textAnchor="middle" fill="rgba(255,255,255,0.30)" fontSize="3.5" fontFamily="system-ui,-apple-system,sans-serif">ON AIR</text>
    </svg>
  )
}

const BAR_HEIGHTS = [2, 6, 4, 9, 5, 8, 3, 10, 5, 7, 3, 8, 5, 6, 2]

function Waveform({ active }: { active: boolean }) {
  return (
    <div className="flex items-center gap-[1.5px] h-4" aria-hidden="true">
      {BAR_HEIGHTS.map((h, i) => (
        <div
          key={i}
          className="w-[1.5px] rounded-full bg-[#45E0C0]"
          style={{
            height: active ? `${h * 1.6}px` : '2px',
            opacity: active ? 0.88 : 0.22,
            transition: 'height 0.15s ease, opacity 0.15s ease',
            animationName: active ? 'md-wave' : 'none',
            animationDuration: `${0.48 + (i % 4) * 0.1}s`,
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
            animationDirection: 'alternate',
            animationDelay: `${i * 0.045}s`,
          }}
        />
      ))}
    </div>
  )
}

function Dots() {
  return (
    <div className="flex gap-1">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="w-1 h-1 rounded-full bg-[#45E0C0]/50"
          style={{
            animationName: 'md-wave',
            animationDuration: '0.8s',
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
            animationDirection: 'alternate',
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  )
}

function getAnchorVoice(): Promise<SpeechSynthesisVoice | null> {
  return new Promise(resolve => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve(null)
      return
    }
    const pick = () => {
      const voices = window.speechSynthesis.getVoices()
      if (!voices.length) return null
      const preferred = ['Samantha', 'Victoria', 'Karen', 'Moira', 'Zira', 'Jenny', 'Aria', 'Sonia', 'Susan']
      for (const name of preferred) {
        const v = voices.find(v => v.name.includes(name) && v.lang.startsWith('en'))
        if (v) return v
      }
      return voices.find(v => v.lang.startsWith('en')) ?? voices[0] ?? null
    }
    const v = pick()
    if (v) {
      resolve(v)
      return
    }
    const handler = () => {
      resolve(pick())
      window.speechSynthesis.removeEventListener('voiceschanged', handler)
    }
    window.speechSynthesis.addEventListener('voiceschanged', handler)
    setTimeout(() => resolve(pick()), 1500)
  })
}

type Phase = 'idle' | 'fetching' | 'generating' | 'ready' | 'error'

interface AnchorState {
  phase: Phase
  briefing: AnchorBriefing | null
}

interface Props {
  selectedEntity: SelectedEntity | null
}

export default function NewsAnchor({ selectedEntity }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [state, setState] = useState<AnchorState>({ phase: 'idle', briefing: null })

  const abortRef = useRef<AbortController | null>(null)

  const stopPlayback = useCallback(() => {
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel()
    setIsPlaying(false)
  }, [])

  const speakText = useCallback(async (text: string) => {
    stopPlayback()
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    const voice = await getAnchorVoice()
    const utt = new SpeechSynthesisUtterance(text)
    if (voice) utt.voice = voice
    utt.rate = 0.93
    utt.pitch = 1.05
    utt.onend = () => setIsPlaying(false)
    utt.onerror = () => setIsPlaying(false)
    window.speechSynthesis.speak(utt)
    setIsPlaying(true)
  }, [stopPlayback])

  const triggerBriefing = useCallback(async () => {
    if (!selectedEntity || selectedEntity.type === 'city') return
    stopPlayback()
    abortRef.current?.abort()

    const ctrl = new AbortController()
    abortRef.current = ctrl

    setIsOpen(true)
    setState({ phase: 'fetching', briefing: null })

    const code = selectedEntity.countryCode ?? selectedEntity.id
    const name = selectedEntity.name

    let articles: string[] = []
    let metrics: Partial<CountryData> = {}

    try {
      const [nRes, mRes] = await Promise.allSettled([
        fetch(`/api/news/${encodeURIComponent(code)}`, { signal: ctrl.signal }),
        fetch(`/api/country/${encodeURIComponent(code)}`, { signal: ctrl.signal }),
      ])
      if (nRes.status === 'fulfilled' && nRes.value.ok) {
        const d = await nRes.value.json()
        articles = (d.articles ?? []).slice(0, 3).map((a: { title: string }) => a.title)
      }
      if (mRes.status === 'fulfilled' && mRes.value.ok) {
        const d = await mRes.value.json()
        metrics = d.country ?? d
      }
    } catch {}

    if (ctrl.signal.aborted) return
    setState(s => ({ ...s, phase: 'generating' }))

    try {
      const res = await fetch(`/api/anchor/${encodeURIComponent(code)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryName: name,
          articles,
          capital: metrics.capital ?? null,
          region: metrics.region ?? null,
          gdp: metrics.gdp_billion ?? null,
          gdpGrowth: metrics.gdpGrowth ?? null,
          population: metrics.population_m ?? null,
          inflation: metrics.inflation ?? null,
          unemployment: metrics.unemployment ?? null,
          gdpPerCapita: metrics.gdpPerCapita ?? null,
        }),
        signal: ctrl.signal,
      })

      if (!res.ok) throw new Error('anchor API error')
      const briefing: AnchorBriefing = await res.json()

      if (ctrl.signal.aborted) return
      setState({ phase: 'ready', briefing })

      if (briefing.script) speakText(briefing.script)
    } catch {
      if (ctrl.signal.aborted) return
      setState(s => ({
        phase: 'error',
        briefing: s.briefing ?? {
          headline: `Economic Update: ${name}`,
          script: `${name} economic briefing temporarily unavailable.`,
          keyTakeaways: [],
          investmentOutlook: '',
          risks: [],
          opportunities: [],
          sectors: [],
          generatedBy: 'none',
        },
      }))
    }
  }, [selectedEntity, stopPlayback, speakText])

  const entityId = selectedEntity?.id

  useEffect(() => {
    stopPlayback()
    setState({ phase: 'idle', briefing: null })
    setIsOpen(false)
  }, [entityId, stopPlayback])

  const togglePlay = useCallback(() => {
    const b = state.briefing
    if (!b) return
    if (isPlaying) stopPlayback()
    else if (b.script) speakText(b.script)
  }, [isPlaying, state.briefing, stopPlayback, speakText])

  if (!selectedEntity || selectedEntity.type === 'city') return null

  const { phase, briefing } = state
  const isLoading = phase === 'fetching' || phase === 'generating'
  const isReady = phase === 'ready' || phase === 'error'
  const flag = selectedEntity.countryCode ? flagEmoji(selectedEntity.countryCode) : ''

  const phaseLabel = phase === 'fetching'
    ? 'Fetching latest headlines…'
    : phase === 'generating'
    ? 'Generating briefing…'
    : ''

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="anchor-pill"
            initial={{ opacity: 0, y: 14, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.92 }}
            transition={{ duration: 0.22 }}
            onClick={triggerBriefing}
            className="fixed bottom-12 left-3 sm:left-6 z-40 max-w-[calc(100vw-1.5rem)] flex items-center gap-2.5 px-3.5 py-2 rounded cursor-pointer select-none"
            style={{
              background: 'linear-gradient(135deg,rgba(10,34,30,0.97) 0%,rgba(6,18,16,0.97) 100%)',
              border: '1px solid rgba(69,224,192,0.28)',
              boxShadow: '0 6px 28px rgba(0,0,0,0.60),0 0 18px rgba(69,224,192,0.07)',
            }}
          >
            <div className="relative w-6 h-6 rounded-full bg-[#45E0C0]/10 flex items-center justify-center flex-shrink-0">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <rect x="3.5" y="0.5" width="5" height="7" rx="2.5" fill="#45E0C0" />
                <path d="M1.5 6c0 2.485 2.015 4.5 4.5 4.5S10.5 8.485 10.5 6" stroke="#45E0C0" strokeWidth="1.1" fill="none" strokeLinecap="round" />
                <line x1="6" y1="10.5" x2="6" y2="12" stroke="#45E0C0" strokeWidth="1.1" strokeLinecap="round" />
                <line x1="4.5" y1="12" x2="7.5" y2="12" stroke="#45E0C0" strokeWidth="1.1" strokeLinecap="round" />
              </svg>
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-red-500">
                <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-70" />
              </span>
            </div>
            <div className="leading-none min-w-0">
              <div className="font-data text-[9px] text-[#45E0C0]/50 uppercase tracking-[0.18em]">AI ANCHOR · AUDIO</div>
              <div className="text-[12px] text-white/80 font-medium mt-0.5 truncate">{flag} {selectedEntity.name}</div>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="anchor-card"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed bottom-12 left-3 sm:left-6 z-40 w-[340px] max-w-[min(92vw,calc(100vw-1.5rem))] rounded-lg overflow-hidden max-h-[calc(100dvh-6rem)] overflow-y-auto"
            style={{
              background: 'linear-gradient(160deg,rgba(8,26,23,0.99) 0%,rgba(5,14,12,0.99) 100%)',
              border: '1px solid rgba(69,224,192,0.16)',
              boxShadow: '0 28px 80px rgba(0,0,0,0.85),0 0 0 1px rgba(69,224,192,0.06)',
            }}
          >
            <div className="flex items-center px-3.5 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2 flex-shrink-0">
                {isPlaying && <span className="block w-full h-full rounded-full bg-red-500 animate-ping opacity-70" />}
              </span>
              <span className="font-data text-[9px] text-white/35 uppercase tracking-[0.2em] flex-1">
                MERIDIAN · LIVE BRIEFING
              </span>
              <span className="text-[13px] mr-1.5">{flag}</span>
              <span className="text-[11px] text-white/55 font-medium mr-3 max-w-[90px] truncate">
                {selectedEntity.name}
              </span>
              <button
                onClick={() => { stopPlayback(); setIsOpen(false) }}
                className="w-5 h-5 rounded-full flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/10 transition-colors text-sm leading-none flex-shrink-0"
              >
                ×
              </button>
            </div>

            <div className="flex">
              <div className="w-[88px] flex-shrink-0">
                <PresenterSVG isOnAir={isPlaying} />
              </div>

              <div className="flex-1 flex flex-col justify-between p-3 min-w-0">
                {isLoading ? (
                  <div className="flex flex-col justify-center h-full py-2">
                    <div className="flex items-center gap-1.5 mb-3">
                      <Dots />
                      <span className="text-[10px] text-white/35 ml-1">{phaseLabel}</span>
                    </div>
                    <div className="h-[2px] rounded-full bg-white/[0.05] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#45E0C0]/45"
                        style={{ width: phase === 'fetching' ? '32%' : '72%', transition: 'width 1.5s ease' }}
                      />
                    </div>
                  </div>
                ) : isReady && briefing ? (
                  <div>
                    <p className="text-[9px] text-[#45E0C0]/45 uppercase tracking-wider mb-0.5">
                      {briefing.headline || `Economic Update: ${selectedEntity.name}`}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={togglePlay}
                        aria-label={isPlaying ? 'Pause briefing' : 'Play briefing'}
                        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all"
                        style={{
                          background: isPlaying ? 'rgba(69,224,192,0.18)' : 'rgba(69,224,192,0.10)',
                          border: '1px solid rgba(69,224,192,0.25)',
                        }}
                      >
                        {isPlaying ? (
                          <svg width="9" height="9" viewBox="0 0 9 9" fill="#45E0C0">
                            <rect x="0.5" y="0.5" width="3" height="8" rx="0.5" />
                            <rect x="5.5" y="0.5" width="3" height="8" rx="0.5" />
                          </svg>
                        ) : (
                          <svg width="9" height="9" viewBox="0 0 9 9" fill="#45E0C0">
                            <polygon points="1.5,0.5 8.5,4.5 1.5,8.5" />
                          </svg>
                        )}
                      </button>
                      <Waveform active={isPlaying} />
                      <button
                        onClick={triggerBriefing}
                        aria-label="Regenerate briefing"
                        className="ml-auto text-[9px] text-white/22 hover:text-white/45 transition-colors uppercase tracking-wide"
                      >
                        ↺
                      </button>
                    </div>

                    <p className="text-[8.5px] text-white/18 mt-1.5">
                      {briefing.generatedBy === 'deterministic'
                        ? 'Data-derived briefing'
                        : `Claude · ${briefing.generatedBy}`} · system voice
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            <AnimatePresence>
              {isReady && briefing?.script && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.25 }}
                  className="px-3.5 pb-3"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <p className="text-[9px] text-white/25 uppercase tracking-wider mt-2.5 mb-1">Transcript</p>
                  <p className="text-[11px] text-white/52 leading-relaxed line-clamp-3">{briefing.script}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isReady && briefing && (briefing.keyTakeaways.length > 0 || briefing.investmentOutlook) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
                  className="px-3.5 py-3 space-y-2.5"
                >
                  {briefing.keyTakeaways.length > 0 && (
                    <div>
                      <p className="text-[9px] text-white/25 uppercase tracking-wider mb-1.5">Key Takeaways</p>
                      <div className="space-y-1">
                        {briefing.keyTakeaways.map((t, i) => (
                          <div key={i} className="flex items-start gap-1.5">
                            <span className="text-[#45E0C0]/50 text-[9px] flex-shrink-0 mt-px">▸</span>
                            <p className="text-[10px] text-white/55 leading-snug">{t}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {briefing.investmentOutlook && (
                    <div
                      className="rounded px-3 py-2"
                      style={{ background: 'rgba(69,224,192,0.05)', border: '1px solid rgba(69,224,192,0.12)' }}
                    >
                      <p className="text-[9px] text-[#45E0C0]/40 uppercase tracking-wider mb-0.5">Investment Outlook</p>
                      <p className="text-[10px] text-[#45E0C0]/75 leading-snug">{briefing.investmentOutlook}</p>
                    </div>
                  )}

                  {(briefing.risks.length > 0 || briefing.opportunities.length > 0) && (
                    <div className="grid grid-cols-2 gap-2">
                      {briefing.risks.length > 0 && (
                        <div>
                          <p className="text-[9px] text-[#FF5D5D]/50 uppercase tracking-wider mb-1">Risks</p>
                          {briefing.risks.map((r, i) => (
                            <p key={i} className="text-[9.5px] text-white/40 leading-snug flex items-start gap-1">
                              <span className="text-[#FF5D5D]/50">●</span>{r}
                            </p>
                          ))}
                        </div>
                      )}
                      {briefing.opportunities.length > 0 && (
                        <div>
                          <p className="text-[9px] text-[#3DDC97]/50 uppercase tracking-wider mb-1">Opportunities</p>
                          {briefing.opportunities.map((o, i) => (
                            <p key={i} className="text-[9.5px] text-white/40 leading-snug flex items-start gap-1">
                              <span className="text-[#3DDC97]/50">●</span>{o}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {briefing.sectors.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {briefing.sectors.map((s, i) => (
                        <span
                          key={i}
                          className="text-[9px] px-2 py-0.5 rounded"
                          style={{
                            background: 'rgba(69,224,192,0.06)',
                            border: '1px solid rgba(69,224,192,0.15)',
                            color: 'rgba(69,224,192,0.60)',
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
