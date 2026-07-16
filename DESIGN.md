# Meridian Design System — "Intelligence Terminal"

The visual identity is a calm, precise economic-intelligence terminal. Bloomberg desk meets mission
control, not a glossy hackathon dashboard: dark navy space, hairline borders, monospaced data, a
single teal accent.

## Type

| Variable | Font | Used for |
|---|---|---|
| `--font-display` | Space Grotesk | Wordmark, country and city names, headings. Class `font-display` |
| `--font-mono` | IBM Plex Mono | Every metric, timestamp, micro-label, ticker and source line. Class `font-data` |
| `--font-inter` | Inter | Body prose — briefings, descriptions, news titles. The default |

Rule of thumb: if it is a number, a code, or an uppercase micro-label, it is mono.

## Colour tokens

Declared in `globals.css` under `:root`.

- `--background` `#04070c` — page
- `--accent` `#45e0c0` — the accent, used sparingly on values, active states, rules
- `--accent-deep` `#2ac7a8`
- `--accent2` `#8fb6ff` — secondary data series, e.g. the inflation sparkline
- `--pos` `#3ddc97`, `--warn` `#ffb020`, `--danger` `#ff5d5d`
- `--hairline` `rgba(255,255,255,0.08)` — every border

Semantics stay fixed: growth is `--pos`, caution is `--warn`, risk is `--danger`. The heatmap keeps
the same red → amber → green ordering.

## Shape

- Panels use `rounded-lg` (8px) at most; cards and buttons use `rounded` (4px). No pills except tiny toggles.
- Hairline 1px borders, no heavy glows. Depth comes from layered translucency (`.glass`), not shadows.

## Reusable classes

- `.glass` — panel backdrop, blur plus dark tint
- `.card` — stat or content card: faint fill, hairline border, 2px teal left edge
- `.card--flat` — the same without the teal edge, for neutral containers
- `.microlabel` — 9px mono uppercase, `0.18em` tracking, white/38
- `.section-head` — flex row that draws a hairline rule to the right of its content
- `.ticker-track` — infinite marquee, pauses on hover; content is duplicated twice inside
- `.blink` — 1s step cursor, used on the boot screen and streaming text

Keyframes: `md-ring` (globe selection pulse), `md-marquee` (ticker), `md-wave` (audio bars),
`md-blink` (cursor).

## Patterns

Micro-label:

```tsx
<p className="microlabel">GDP GROWTH</p>
```

Stat value:

```tsx
<p className="font-data text-lg font-semibold text-[#45E0C0]">+5.1%</p>
```

Section header:

```tsx
<SectionHead title="Trade Intelligence" />
```

Card:

```tsx
<div className="card p-3.5">
  <p className="microlabel mb-1.5">Population</p>
  <p className="font-data text-lg font-semibold text-white/85">286M</p>
  <p className="font-data text-[8px] text-white/20 mt-1">WORLD BANK 2025 · SP.POP.TOTL</p>
</div>
```

## Chrome

- **TopBar** — fixed, `h-12`, glass with a hairline bottom border, `z-40`. Wordmark and `◈` on the
  left, search in the centre, UTC clock, live dot and the demo trigger on the right.
- **Ticker** — fixed bottom, `h-8`, marquee of major-economy stats, `z-40`. Items fly to the country.
- **Sidebar** — right side, `top-12 bottom-8`, hairline left border. Full width below the `sm` breakpoint.
- **Layer rail** — left edge, vertical icon rail, scrolls on short viewports.
- Floating widgets sit above the ticker at `bottom-12`; the demo overlay sits below the top bar at `top-16`.

## Voice

Micro-copy is terse and instrument-like: "SIGNAL", "FEED", "10Y TREND", "COMPOSITE". No decorative
emoji in the chrome — country flags are fine, but use mono glyphs (`▲ ▼ ● ▍ ◈ ▸`) or inline SVG
instead of pictograms.
