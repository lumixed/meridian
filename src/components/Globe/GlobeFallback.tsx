'use client'

interface Props {
  reason: 'unsupported' | 'crashed'
  onRetry?: () => void
}

const COPY = {
  unsupported: {
    title: 'This browser cannot render the globe',
    body: 'Meridian draws the globe with WebGL, which is unavailable or disabled here. Everything else still works — search for a country to open its dashboard.',
  },
  crashed: {
    title: 'The globe stopped rendering',
    body: 'Something went wrong inside the 3D scene. The economic dashboards are unaffected — search for a country, or reload to try the globe again.',
  },
} as const

export default function GlobeFallback({ reason, onRetry }: Props) {
  const { title, body } = COPY[reason]

  return (
    <div className="absolute inset-0 flex items-center justify-center px-6 bg-[#04070c]">
      <div className="max-w-[420px] card p-5">
        <div className="section-head mb-3">
          <span className="font-data text-[10px] text-[#FFB020]/70 leading-none">▍</span>
          <p className="microlabel">Renderer Offline</p>
        </div>
        <p className="font-display text-[16px] text-white/80 leading-snug">{title}</p>
        <p className="text-[12.5px] text-white/52 leading-relaxed mt-2">{body}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-4 font-data text-[10px] uppercase tracking-[0.16em] text-[#45E0C0]/70 hover:text-[#45E0C0] border border-[#45E0C0]/25 hover:border-[#45E0C0]/45 rounded px-3 py-1.5 transition-colors"
          >
            ↺ Retry
          </button>
        )}
      </div>
    </div>
  )
}
