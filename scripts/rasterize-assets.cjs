#!/usr/bin/env node
/**
 * Renders Figma SVGs that use SVG filters (inner shadows) to 3x PNGs.
 *
 * Why: Safari draws SVG filter effects at low resolution, so filtered artwork
 * (logo, wordmarks, feature icons, avatar) looks pixelated on Retina screens,
 * even when the SVG is inlined. Chromium renders the filters correctly, so we
 * pre-render the exact Figma SVGs here. The artwork is not modified.
 *
 * Usage: npm run assets:rasterize
 * Needs Playwright with Chromium available (require('playwright')).
 */
const fs = require('node:fs')
const path = require('node:path')
const { chromium } = require('playwright')

const SRC = path.join(__dirname, '..', 'src', 'assets', 'figma')
const OUT = path.join(__dirname, '..', 'src', 'assets', 'raster')
const SCALE = 3

// Filtered SVGs to rasterise. swirl-profile-* are deliberately blurred
// backgrounds, so low-res filter rendering is invisible there; they stay SVG.
const FILES = [
  'logo.svg',
  'wordmark-gather-light.svg',
  'wordmark-gather-dark.svg',
  'hero-gather-base.svg',
  'hero-gather-light.svg',
  'hero-gather-dark.svg',
  'feature-group-person.svg',
  'feature-group-pencil.svg',
  'feature-pin.svg',
  'feature-pin-x-light.svg',
  'feature-pin-x-dark.svg',
  'avatar-person-light.svg',
  'avatar-person-dark.svg',
  'avatar-edit-badge-light.svg',
  'avatar-edit-badge-dark.svg',
]

function svgSize(svg) {
  const w = parseFloat(/<svg[^>]*\swidth="([\d.]+)"/.exec(svg)[1])
  const h = parseFloat(/<svg[^>]*\sheight="([\d.]+)"/.exec(svg)[1])
  return { w, h }
}

;(async () => {
  fs.mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch()
  const page = await browser.newPage({ deviceScaleFactor: SCALE })
  for (const file of FILES) {
    const svg = fs.readFileSync(path.join(SRC, file), 'utf8')
    const { w, h } = svgSize(svg)
    const W = Math.ceil(w)
    const H = Math.ceil(h)
    await page.setViewportSize({ width: W, height: H })
    const dataUrl = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64')
    await page.setContent(
      `<html><body style="margin:0;background:transparent">` +
        `<img src="${dataUrl}" style="display:block;width:${w}px;height:${h}px"></body></html>`,
    )
    await page.waitForFunction(() => document.images[0].complete)
    const out = path.join(OUT, file.replace(/\.svg$/, '@3x.png'))
    await page.screenshot({ path: out, omitBackground: true, clip: { x: 0, y: 0, width: W, height: H } })
    console.log(`${file} → ${path.relative(process.cwd(), out)} (${W * SCALE}×${H * SCALE})`)
  }
  await browser.close()
})()
