'use client'

import type { LayerState } from '@/types/layers'

const HEAT_TIERS = [
  { color: 'rgb(0,255,140)', label: 'TOP 10%' },
  { color: 'rgb(50,210,80)', label: 'TOP 25%' },
  { color: 'rgb(255,195,0)', label: 'MID 35%' },
  { color: 'rgb(255,75,0)', label: 'LOW 25%' },
  { color: 'rgb(210,15,15)', label: 'BOTTOM 10%' },
]

const INVEST_TIERS = [
  { color: '#3DDC97', label: '≥P75 FAVORABLE' },
  { color: '#FFB020', label: 'MID' },
  { color: '#FF5D5D', label: 'CAUTION' },
]

function TierRows({ tiers }: { tiers: { color: string; label: string }[] }) {
  return (
    <div className="space-y-1">
      {tiers.map(t => (
        <div key={t.label} className="flex items-center gap-2">
          <span className="w-[10px] h-[10px] shrink-0" style={{ background: t.color }} />
          <span className="font-data text-[9px] text-white/50 tracking-[0.06em]">{t.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function Legend({ layers, offsetRight = 0 }: { layers: LayerState; offsetRight?: number }) {
  if (!layers.heatmap && !layers.investment) return null

  return (
    <div
      style={{ right: offsetRight + 12 }}
      className="hidden sm:block fixed bottom-12 z-30 glass border border-white/[0.08] rounded p-3 w-[172px] space-y-3 transition-[right] duration-300"
    >
      {layers.heatmap && (
        <div>
          <p className="microlabel mb-1.5">GDP/CAPITA PERCENTILE</p>
          <TierRows tiers={HEAT_TIERS} />
        </div>
      )}
      {layers.investment && (
        <div>
          <p className="microlabel mb-1.5">INVESTMENT SIGNAL</p>
          <TierRows tiers={INVEST_TIERS} />
        </div>
      )}
    </div>
  )
}
