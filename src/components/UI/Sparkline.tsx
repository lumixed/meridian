'use client'

interface Props {
  values: (number | null)[]
  years: number[]
  color: string
  height?: number
  zeroLine?: boolean
  suffix?: string
}

export default function Sparkline({ values, years, color, height = 36, zeroLine = false, suffix = '%' }: Props) {
  const n = values.length
  const present = values.filter((v): v is number => v !== null)

  if (n === 0 || present.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height: height + 14 }}>
        <p className="microlabel">No Series Data</p>
      </div>
    )
  }

  let min = Math.min(...present)
  let max = Math.max(...present)
  if (min === max) {
    min -= 1
    max += 1
  }
  const pad = (max - min) * 0.08
  min -= pad
  max += pad

  const H = height
  const toY = (v: number) => H - ((v - min) / (max - min)) * H
  const toX = (i: number) => (n === 1 ? 50 : (i / (n - 1)) * 100)

  const points: { x: number; y: number }[] = []
  for (let i = 0; i < n; i++) {
    const v = values[i]
    if (v !== null) points.push({ x: toX(i), y: toY(v) })
  }

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(' ')
  const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(2)},${H} L${points[0].x.toFixed(2)},${H} Z`

  const zeroY = min < 0 && max > 0 ? toY(0) : null

  const latest = present[present.length - 1]
  const latestLabel = `${latest > 0 ? '+' : ''}${latest.toFixed(1)}${suffix}`

  return (
    <div>
      <svg
        viewBox={`0 0 100 ${H}`}
        preserveAspectRatio="none"
        className="block w-full"
        style={{ height: H }}
        aria-hidden="true"
      >
        <path d={areaPath} fill={color} opacity={0.1} />
        {zeroLine && zeroY !== null && (
          <line
            x1={0} y1={zeroY} x2={100} y2={zeroY}
            stroke="rgba(255,255,255,0.18)"
            strokeWidth={0.5}
            strokeDasharray="2 2"
            vectorEffect="non-scaling-stroke"
          />
        )}
        <polyline
          points={points.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')}
          fill="none"
          stroke={color}
          strokeWidth={1.2}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="flex items-center justify-between mt-1">
        <span className="font-data text-[8px] text-white/50">{years[0] ?? ''}</span>
        <span className="font-data text-[8px] font-semibold" style={{ color }}>{latestLabel}</span>
        <span className="font-data text-[8px] text-white/50">{years[years.length - 1] ?? ''}</span>
      </div>
    </div>
  )
}
