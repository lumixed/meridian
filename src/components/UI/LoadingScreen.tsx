'use client'

const BOOT_LINES = [
  'LINKING WORLD BANK OPEN DATA',
  'LOADING NATURAL EARTH GEOMETRY',
  'CALIBRATING GLOBE RENDERER',
]

export default function LoadingScreen() {
  return (
    <div className="absolute inset-0 bg-[#04070c] flex items-center justify-center z-50">
      <style>{`
        @keyframes md-boot-line { to { opacity: 1; } }
        @keyframes md-boot-bar  { from { width: 0; } to { width: 100%; } }
      `}</style>

      <div className="w-[300px]">
        <div className="flex items-center gap-2.5 mb-5">
          <span className="text-[#45E0C0] text-sm leading-none" aria-hidden="true">◈</span>
          <h1 className="font-display text-xl tracking-[0.3em] text-white/90">MERIDIAN</h1>
        </div>

        <div className="h-[2px] bg-white/[0.06] overflow-hidden mb-5">
          <div
            className="h-full bg-[#45E0C0]"
            style={{ width: 0, animation: 'md-boot-bar 2.2s ease-out forwards' }}
          />
        </div>

        <div className="space-y-1.5">
          {BOOT_LINES.map((line, i) => (
            <p
              key={line}
              className="font-data text-[10px] text-white/45 opacity-0"
              style={{
                animation: 'md-boot-line 0.01s steps(1, end) forwards',
                animationDelay: `${0.35 + i * 0.5}s`,
              }}
            >
              <span className="text-[#45E0C0]/70">▸</span> {line}{' '}
              <span className="text-white/20">…</span>{' '}
              <span className="text-[#45E0C0]/80">OK</span>
            </p>
          ))}
          <p
            className="font-data text-[10px] text-white/60 opacity-0"
            style={{
              animation: 'md-boot-line 0.01s steps(1, end) forwards',
              animationDelay: '1.9s',
            }}
          >
            <span className="text-[#45E0C0]/70">▸</span> AWAITING TELEMETRY{' '}
            <span className="blink text-[#45E0C0]">▌</span>
          </p>
        </div>
      </div>
    </div>
  )
}
