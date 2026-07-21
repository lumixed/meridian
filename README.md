# 🌍 Meridian — Global Economic Intelligence

Explore the world economy on a living, interactive 3D globe. Meridian pulls scattered economic
intelligence — World Bank indicators, live business news, trade data — into a single visual
surface, with AI briefings powered by Claude.

No database, no cloud credentials, one optional API key.

[![CI](https://github.com/lumixed/plateful/actions/workflows/ci.yml/badge.svg)](https://github.com/lumixed/plateful/actions/workflows/ci.yml)
![Stack](https://img.shields.io/badge/Next.js-16-000?style=flat-square)
![Stack](https://img.shields.io/badge/React-19-087ea4?style=flat-square)
![Stack](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square)
![Stack](https://img.shields.io/badge/Tailwind-4-06b6d4?style=flat-square)

## Features

- **Interactive 3D globe** — click any country for a full economic dashboard
- **Real World Bank data** — GDP, growth, inflation, unemployment, life expectancy, trade (free API, no key)
- **Live economic news** — Google News + BBC + Reuters + country-specific RSS feeds, scored by freshness × source quality
- **AI executive briefings** ("Brief Me") — grounded in the metrics on screen
- **AI investment reports** — a full-screen institutional research note with a printable PDF export
- **AI news anchor** — an on-air briefing read aloud through the Web Speech API
- **Country comparison** — side-by-side macro dashboards with an investment verdict
- **Intelligence layers** — GDP/capita heatmap, animated trade routes, city corridors, investment signal overlay, historical timeline (2015–2025)
- **City network** — 29 global economic hubs with derived pulse intensity, bundled locally
- **Demo mode** — an auto-cycling tour of major economies
- **Shareable deep links** — selection, comparison, active layers and timeline year all live in the URL
- **Command palette** — `⌘K` / `Ctrl K` to jump to any country or toggle any layer from the keyboard

## Stack

Next.js (App Router) · React · TypeScript · Tailwind CSS v4 · react-globe.gl / Three.js ·
Framer Motion · Anthropic Claude · Vitest

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Then open http://localhost:5320.

Everything except the AI surfaces works with zero configuration — World Bank data, news, the globe
and city intelligence are all free and keyless. Without an `ANTHROPIC_API_KEY` every AI surface
falls back to a deterministic briefing built from the same real data.

| Env var | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | No | Enables Claude-generated briefings, reports and the anchor script |
| `CLAUDE_MODEL` | No | Defaults to `claude-opus-5`; set `claude-haiku-4-5` for cheaper briefings |
| `NEXT_PUBLIC_SITE_URL` | No | Canonical origin used for Open Graph tags. Set this in production |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on port 5320 |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit suite |
| `npm run snapshot` | Refresh the bundled indicator snapshot from the World Bank |
| `npm run trim-geo` | Re-trim `countries.geojson` after replacing the source file |

## Architecture

```
src/
  app/api/          Route handlers: country, news, trade, history, heatmap, ticker,
                    search, cities, insight (streaming), anchor, report
  components/
    Globe/          react-globe.gl scene, WebGL guard, arc + corridor data
    Sidebar/        Country, city, comparison and report panels
    UI/             Top bar, ticker, layer rail, palette, anchor, timeline, demo
  lib/              worldbank.ts (indicators + snapshot fallback), country-meta.ts,
                    cities.ts, news-scoring.ts, scores.ts, rate-limit.ts, ai.ts
  data/             Static country list, seed city hubs, indicator snapshot, territory notes
  hooks/            useUrlState (deep links), useDialog (focus trap), useCountUp
scripts/            build-snapshot.mjs, trim-geojson.mjs
```

Notable decisions:

- **No database.** The 29-hub city store is a bundled JSON module resolved at import time.
- **One AI provider.** Claude with schema-enforced structured outputs, no prompt-prefill JSON hacks.
- **No external TTS.** The anchor speaks through the browser's Web Speech API.
- **Deterministic fallbacks everywhere.** Every AI surface renders real-data content with no key configured.
- **The World Bank API is treated as unreliable**, because it is. Requests retry, run through
  Next's data cache so they survive serverless cold starts, and fall back per-indicator to a
  bundled snapshot of 264 countries. The provenance badge in the sidebar says which source
  a given reading came from — `Verified`, `Partly cached`, or `Cached snapshot`.
- **AI routes are rate limited** per IP, so a public deployment cannot burn the API key.

### Reliability

Regenerate the snapshot whenever you want fresher offline data:

```bash
npm run snapshot
```

It makes seven bulk calls (one per indicator) rather than one per country, so it finishes in
seconds and is gentle on the upstream API.

### Accessibility

- Every interactive surface is reachable from the keyboard; `⌘K` opens the palette, which can
  drive navigation and layers without touching the globe
- Dialogs trap focus, close on `Escape`, and restore focus to their trigger
- Streaming AI text and the news feed are `aria-live` regions
- Informational text sits at or above 4.9:1 contrast on the page background (WCAG AA); only
  non-informational dividers fall below that

### Performance

First-load assets were cut from roughly 2.6 MB to 380 KB — textures re-encoded to WebP at half
resolution, and `countries.geojson` reduced to two-decimal precision with unused properties
stripped. The geometry itself is untouched: naive simplification reverses polygon winding, which
inverts every country fill on a sphere.

## Design

Meridian uses an "intelligence terminal" design language — see [DESIGN.md](DESIGN.md).

## Credits

Concept inspired by the MIT-licensed [PulseEarth](https://github.com/codedivaa/PulseEarth)
hackathon project, rebuilt from scratch on a leaner stack.

Globe textures from [three-globe](https://github.com/vasturiano/three-globe); country borders from
Natural Earth. Economic indicators from the World Bank Open Data API.

## License

MIT
