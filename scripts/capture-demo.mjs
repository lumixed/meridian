import puppeteer from 'puppeteer-core'
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'

const run = promisify(execFile)
const sleep = ms => new Promise(r => setTimeout(r, ms))

const BASE = process.env.CAPTURE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`
const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const OUT = 'docs'
const FPS = 10
const WIDTH = Number(process.env.CAPTURE_WIDTH ?? 900)

const LAUNCH = {
  executablePath: CHROME,
  headless: 'shell',
  args: ['--enable-unsafe-swiftshader', '--hide-scrollbars'],
  defaultViewport: { width: 1280, height: 720, deviceScaleFactor: 2 },
}

async function settle(page, ms = 9000) {
  await sleep(ms)
}

async function recordTour(browser, dir) {
  const page = await browser.newPage()
  let frame = 0

  const shot = async (label, count = 1, gap = 0) => {
    for (let i = 0; i < count; i++) {
      await page.screenshot({ path: join(dir, `${String(frame).padStart(3, '0')}-${label}.png`) })
      frame++
      if (gap) await sleep(gap)
    }
  }

  await page.goto(BASE, { waitUntil: 'networkidle2' })
  await settle(page)
  await shot('globe', 12, 260)

  await page.click('[aria-label="Open command palette"]')
  await sleep(500)
  for (const ch of 'brazil') {
    await page.type('[role="dialog"] input', ch, { delay: 90 })
    await shot('palette', 1, 60)
  }
  await sleep(700)
  await shot('results', 6, 180)

  await page.keyboard.press('Enter')
  await sleep(2600)
  await shot('country', 14, 260)

  await page.click('[aria-label="Economic Heatmap"]')
  await sleep(2800)
  await shot('heatmap', 12, 260)

  await page.click('[aria-label="Trade Routes"]')
  await sleep(2200)
  await shot('trade', 12, 240)

  await page.click('[aria-label="Trade Routes"]')
  await page.click('[aria-label="Close panel"]')
  await page.click('[aria-label="Historical Timeline"]')
  await sleep(1200)
  await page.evaluate(() => {
    const el = document.querySelector('input[type=range]')
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
    setter.call(el, '2015')
    el.dispatchEvent(new Event('change', { bubbles: true }))
  })
  await sleep(30000)

  for (let year = 2015; year <= 2025; year++) {
    await page.evaluate(y => {
      const el = document.querySelector('input[type=range]')
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
      setter.call(el, String(y))
      el.dispatchEvent(new Event('change', { bubbles: true }))
    }, year)
    await sleep(700)
    await shot('timeline', 2, 120)
  }

  await page.close()
  return frame
}

async function encodeGif(dir, workDir) {
  const palette = join(workDir, 'palette.png')
  const glob = join(dir, '*.png')

  await run('ffmpeg', [
    '-y', '-framerate', String(FPS), '-pattern_type', 'glob', '-i', glob,
    '-vf', `scale=${WIDTH}:-1:flags=lanczos,palettegen=max_colors=160:stats_mode=diff`,
    palette, '-loglevel', 'error',
  ])

  await run('ffmpeg', [
    '-y', '-framerate', String(FPS), '-pattern_type', 'glob', '-i', glob, '-i', palette,
    '-lavfi', `scale=${WIDTH}:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle`,
    '-loop', '0', join(OUT, 'demo.gif'), '-loglevel', 'error',
  ])
}

async function stills(browser) {
  const still = async (url, path, prep) => {
    const page = await browser.newPage()
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await settle(page)
    if (prep) await prep(page)
    await page.screenshot({ path: join(OUT, path) })
    await page.close()
  }

  await still(`${BASE}/?c=IN&vs=CN`, 'shot-compare.png')
  await still(`${BASE}/?c=DE&layers=heatmap,investment`, 'shot-heatmap.png')

  await still(`${BASE}/?c=SG`, 'shot-report.png', async page => {
    await page.waitForFunction(
      () => [...document.querySelectorAll('button')].some(b => b.textContent.includes('Generate Investment Report')),
      { timeout: 90000, polling: 500 },
    )
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')]
        .find(b => b.textContent.includes('Generate Investment Report'))
      btn?.click()
    })
    await page.waitForFunction(
      () => document.querySelector('[role="dialog"]')?.textContent?.includes('Executive Summary'),
      { timeout: 90000, polling: 500 },
    )
    await sleep(2000)
  })

  const mobile = await browser.newPage()
  await mobile.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true })
  await mobile.goto(`${BASE}/?c=ID&layers=news`, { waitUntil: 'domcontentloaded' })
  await settle(mobile, 11000)
  await mobile.screenshot({ path: join(OUT, 'shot-mobile.png') })
  await mobile.close()
}

async function main() {
  const workDir = await mkdtemp(join(tmpdir(), 'meridian-capture-'))
  const dir = join(workDir, 'frames')
  await mkdir(dir, { recursive: true })
  await mkdir(OUT, { recursive: true })

  const browser = await puppeteer.launch(LAUNCH)

  try {
    const frames = await recordTour(browser, dir)
    process.stdout.write(`captured ${frames} frames\n`)

    await encodeGif(dir, workDir)
    process.stdout.write(`wrote ${OUT}/demo.gif\n`)

    await stills(browser)
    process.stdout.write('wrote stills\n')
  } finally {
    await browser.close()
    await rm(workDir, { recursive: true, force: true })
  }
}

main().catch(err => {
  process.stderr.write(`${err.message}\n`)
  process.exit(1)
})
