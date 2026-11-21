#!/usr/bin/env node
/**
 * Renders Figma SVGs that use SVG filters (inner shadows) to 3x PNGs.
 *
 * Why: Figma's inner-shadow export builds a hard (0/1) alpha mask from the
 * shape ("hardAlpha"), which throws away edge anti-aliasing, so the shapes
 * render with jagged edges in every browser (Safari also renders the filter
 * at low resolution on top of that).
 *
 * Fix: supersampling. Each SVG is rendered at 12x, then downscaled to 3x in
 * two high-quality halving steps (12x -> 6x -> 3x). The jagged steps become
 * sub-pixel and average into smooth edges. The artwork is not modified.
 *
 * Usage: npm run assets:rasterize
 * Needs Playwright with Chromium available (require('playwright')).
 */
const fs = require('node:fs')
const path = require('node:path')
const { chromium } = require('playwright')

const SRC = path.join(__dirname, '..', 'src', 'assets', 'figma')
const OUT = path.join(__dirname, '..', 'src', 'assets', 'raster')
const SCALE = 3 // output: 3x (sharp on Retina Macs and iPhones)
const SUPERSAMPLE = 4 // render at SCALE * SUPERSAMPLE = 12x, then downscale

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
  // 1) Render each SVG at 12x.
  const render = await browser.newPage({ deviceScaleFactor: SCALE * SUPERSAMPLE })
  // 2) Downscale in a normal 1x page with canvas, halving each step.
  const resize = await browser.newPage()

  for (const file of FILES) {
    const svg = fs.readFileSync(path.join(SRC, file), 'utf8')
    const { w, h } = svgSize(svg)
    const W = Math.ceil(w)
    const H = Math.ceil(h)
    await render.setViewportSize({ width: W, height: H })
    const dataUrl = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64')
    await render.setContent(
      `<html><body style="margin:0;background:transparent">` +
        `<img src="${dataUrl}" style="display:block;width:${w}px;height:${h}px"></body></html>`,
    )
    await render.waitForFunction(() => document.images[0].complete)
    const big = await render.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: W, height: H } })

    const pngBase64 = await resize.evaluate(
      async ({ src, outW, outH }) => {
        const img = new Image()
        img.src = src
        await img.decode()
        let canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        canvas.getContext('2d').drawImage(img, 0, 0)
        while (canvas.width / 2 >= outW) {
          const next = document.createElement('canvas')
          next.width = Math.round(canvas.width / 2)
          next.height = Math.round(canvas.height / 2)
          const ctx = next.getContext('2d')
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          ctx.drawImage(canvas, 0, 0, next.width, next.height)
          canvas = next
        }
        return canvas.toDataURL('image/png').split(',')[1]
      },
      { src: 'data:image/png;base64,' + big.toString('base64'), outW: W * SCALE, outH: H * SCALE },
    )

    const out = path.join(OUT, file.replace(/\.svg$/, '@3x.png'))
    fs.writeFileSync(out, Buffer.from(pngBase64, 'base64'))
    console.log(`${file} → ${path.relative(process.cwd(), out)} (${W * SCALE}×${H * SCALE})`)
  }
  await browser.close()
})()
