import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Meridian — Global Economic Intelligence'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#04070c',
          padding: '72px 80px',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: 760,
            height: 760,
            borderRadius: '50%',
            right: -230,
            top: -80,
            background: 'radial-gradient(circle at 35% 30%, #0d3b39 0%, #071a1c 45%, #04070c 72%)',
            border: '1px solid rgba(69,224,192,0.22)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 760,
            height: 760,
            borderRadius: '50%',
            right: -230,
            top: -80,
            boxShadow: '0 0 120px 30px rgba(69,224,192,0.12)',
            display: 'flex',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <div style={{ fontSize: 30, letterSpacing: 12, color: '#ffffff', fontWeight: 700, display: 'flex' }}>
            MERIDIAN
          </div>
          <div
            style={{
              width: 15,
              height: 15,
              background: '#45E0C0',
              transform: 'rotate(45deg)',
              display: 'flex',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 660 }}>
          <div style={{ fontSize: 62, color: '#ffffff', lineHeight: 1.08, letterSpacing: -1, display: 'flex' }}>
            The world economy on a living globe.
          </div>
          <div style={{ fontSize: 25, color: 'rgba(255,255,255,0.5)', lineHeight: 1.45, display: 'flex' }}>
            Real World Bank indicators, live market news and AI briefings — one interactive surface.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
          {['WORLD BANK', 'LIVE NEWS', 'TRADE ROUTES', 'AI BRIEFINGS'].map(label => (
            <div
              key={label}
              style={{
                fontSize: 17,
                letterSpacing: 3,
                color: 'rgba(69,224,192,0.85)',
                border: '1px solid rgba(69,224,192,0.28)',
                borderRadius: 4,
                padding: '9px 16px',
                display: 'flex',
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  )
}
