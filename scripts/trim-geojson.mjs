import { readFile, writeFile, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const KEEP = ['iso_a2', 'admin', 'name']
const PRECISION = 2

const round = n => Math.round(n * 10 ** PRECISION) / 10 ** PRECISION

function trimRing(ring) {
  const out = []
  for (const [lng, lat] of ring) {
    const point = [round(lng), round(lat)]
    const prev = out[out.length - 1]
    if (prev && prev[0] === point[0] && prev[1] === point[1]) continue
    out.push(point)
  }

  const first = out[0]
  const last = out[out.length - 1]
  if (first && last && (first[0] !== last[0] || first[1] !== last[1])) out.push([first[0], first[1]])

  return out.length >= 4 ? out : null
}

function trimGeometry(geometry) {
  if (geometry.type === 'Polygon') {
    const rings = geometry.coordinates.map(trimRing).filter(Boolean)
    return rings.length > 0 ? { type: 'Polygon', coordinates: rings } : null
  }

  if (geometry.type === 'MultiPolygon') {
    const polys = geometry.coordinates
      .map(poly => poly.map(trimRing).filter(Boolean))
      .filter(poly => poly.length > 0)
    return polys.length > 0 ? { type: 'MultiPolygon', coordinates: polys } : null
  }

  return geometry
}

async function main() {
  const path = fileURLToPath(new URL('../public/data/countries.geojson', import.meta.url))
  const before = (await stat(path)).size
  const source = JSON.parse(await readFile(path, 'utf8'))

  const features = []
  for (const feature of source.features) {
    const geometry = trimGeometry(feature.geometry)
    if (!geometry) continue

    const properties = {}
    for (const key of KEEP) {
      if (feature.properties[key] !== undefined) properties[key] = feature.properties[key]
    }

    features.push({ type: 'Feature', properties, geometry })
  }

  await writeFile(path, JSON.stringify({ type: 'FeatureCollection', features }))
  const after = (await stat(path)).size

  const saved = Math.round((1 - after / before) * 100)
  process.stdout.write(
    `${features.length} features · ${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB (-${saved}%)\n`,
  )
}

main().catch(err => {
  process.stderr.write(`${err.message}\n`)
  process.exit(1)
})
