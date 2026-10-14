import type { GarmentType, Silhouette, TibebStyle } from '../db/types'
import { PALETTE_PRESETS, contrastRatio, hexToRgb, luminance } from './design'

export interface SketchImage {
  dataUrl: string
  width: number
  height: number
}

export type ProposalOrigin = 'sketch' | 'harmony' | 'classic'

export interface TiletProposal {
  origin: ProposalOrigin
  label: string
  base: string
  colors: string[]
  style: TibebStyle
}

export interface PatternProposal {
  garment: GarmentType
  silhouette: Silhouette
  sleeve: string
  pieceCount: number
}

export interface SketchAnalysis {
  colors: string[]
  baseColor: string
  tiletProposals: TiletProposal[]
  pattern: PatternProposal
}

const MAX_SIDE = 900

export function loadImageFile(file: File): Promise<SketchImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Not a valid image'))
      img.onload = () => {
        const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height))
        const w = Math.max(1, Math.round(img.width * scale))
        const h = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve({ dataUrl: String(reader.result), width: img.width, height: img.height })
          return
        }
        ctx.drawImage(img, 0, 0, w, h)
        resolve({ dataUrl: canvas.toDataURL('image/jpeg', 0.86), width: w, height: h })
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

function toHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

interface Bucket {
  r: number
  g: number
  b: number
  count: number
}

function dominantColors(img: HTMLImageElement | HTMLCanvasElement, max: number): string[] {
  const canvas = document.createElement('canvas')
  const size = 110
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return []
  ctx.drawImage(img, 0, 0, size, size)
  const { data } = ctx.getImageData(0, 0, size, size)
  const buckets = new Map<number, Bucket>()
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]
    if (a < 200) continue
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    // quantise to 4 bits per channel
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4)
    const existing = buckets.get(key)
    if (existing) {
      existing.count += 1
      existing.r += r
      existing.g += g
      existing.b += b
    } else {
      buckets.set(key, { r, g, b, count: 1 })
    }
  }
  const list = [...buckets.values()]
    .map((bk) => ({
      hex: toHex(bk.r / bk.count, bk.g / bk.count, bk.b / bk.count),
      count: bk.count,
      lum: luminance(toHex(bk.r / bk.count, bk.g / bk.count, bk.b / bk.count)),
    }))
    .sort((a, b) => b.count - a.count)

  // drop near-duplicates (very close luminance+distance)
  const picked: typeof list = []
  for (const item of list) {
    const rgb = hexToRgb(item.hex)
    const near = picked.some((p) => {
      const q = hexToRgb(p.hex)
      return Math.abs(rgb.r - q.r) + Math.abs(rgb.g - q.g) + Math.abs(rgb.b - q.b) < 40
    })
    if (!near) picked.push(item)
    if (picked.length >= max) break
  }
  return picked.map((p) => p.hex)
}

function analyzeImageColors(img: HTMLImageElement): { colors: string[]; baseColor: string } {
  const colors = dominantColors(img, 8)
  if (!colors.length) return { colors: ['#f7f5ef'], baseColor: '#f7f5ef' }
  const sortedByLight = [...colors].sort((a, b) => luminance(b) - luminance(a))
  const light = sortedByLight[0]
  const baseColor = luminance(light) > 0.42 ? light : colors[0]
  return { colors, baseColor }
}

function saturationOf(hex: string): number {
  const { r, g, b } = hexToRgb(hex)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  if (max === 0) return 0
  return (max - min) / max
}

function shiftHue(hex: string, deg: number): string {
  const { r: r255, g: g255, b: b255 } = hexToRgb(hex)
  const r = r255 / 255
  const g = g255 / 255
  const b = b255 / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }
  h = (h + deg / 360 + 1) % 1
  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t
    if (tt < 0) tt += 1
    if (tt > 1) tt -= 1
    if (tt < 1 / 6) return p + (q - p) * 6 * tt
    if (tt < 1 / 2) return q
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return toHex(hue2rgb(p, q, h + 1 / 3) * 255, hue2rgb(p, q, h) * 255, hue2rgb(p, q, h - 1 / 3) * 255)
}

function deepens(hex: string, targetContrast: number, against: string): string {
  if (contrastRatio(hex, against) >= targetContrast) return hex
  let out = hex
  for (let i = 0; i < 8; i++) {
    const { r, g, b } = hexToRgb(out)
    out = toHex(r * 0.85, g * 0.85, b * 0.85)
    if (contrastRatio(out, against) >= targetContrast) break
  }
  return out
}

function buildTiletProposals(colors: string[], baseColor: string): TiletProposal[] {
  const proposals: TiletProposal[] = []

  // 1. Colors taken straight from the sketch (saturated, contrast-checked)
  const fromSketch = colors
    .filter((c) => c !== baseColor && saturationOf(c) > 0.18 && contrastRatio(c, baseColor) >= 2.2)
    .map((c) => deepens(c, 3, baseColor))
    .slice(0, 3)
  if (fromSketch.length) {
    proposals.push({
      origin: 'sketch',
      label: 'sketch_origin_sketch',
      base: baseColor,
      colors: fromSketch,
      style: 'tibeb',
    })
  }

  // 2. Hue harmonies around the sketch colors
  const seeds = colors.filter((c) => saturationOf(c) > 0.15).slice(0, 2)
  const offsets = [
    { deg: 0, style: 'tilet' as TibebStyle },
    { deg: 150, style: 'tibeb' as TibebStyle },
    { deg: 210, style: 'tilf' as TibebStyle },
  ]
  for (const seed of seeds) {
    for (const off of offsets) {
      if (proposals.length >= 4) break
      const main = deepens(shiftHue(seed, off.deg), 3, baseColor)
      const accent = deepens(shiftHue(seed, off.deg + 40), 2.6, baseColor)
      const accent2 = deepens(shiftHue(seed, off.deg - 50), 2.6, baseColor)
      proposals.push({
        origin: 'harmony',
        label: 'sketch_origin_harmony',
        base: baseColor,
        colors: [main, accent, accent2],
        style: off.style,
      })
    }
  }

  // 3. Classic tibeb palettes that read well on the detected base
  for (const p of PALETTE_PRESETS) {
    if (proposals.length >= 6) break
    if (contrastRatio(p.secondary, baseColor) < 3) continue
    proposals.push({
      origin: 'classic',
      label: p.name,
      base: baseColor,
      colors: [p.secondary, ...p.accents.slice(0, 2)],
      style: 'tibeb',
    })
  }

  return proposals.slice(0, 6)
}

function inferPattern(img: HTMLImageElement): PatternProposal {
  // Heuristic: tall, colourful sketches read as a long dress (kemis);
  // wide/neutral sketches read as short garments.
  const aspect = img.height / Math.max(1, img.width)
  const colors = dominantColors(img, 6)
  const colorful = colors.some((c) => saturationOf(c) > 0.45)
  if (aspect < 0.95) {
    return { garment: 'tshirt', silhouette: 'straight', sleeve: 'short', pieceCount: 3 }
  }
  if (colorful && aspect > 1.35) {
    return {
      garment: 'kemis',
      silhouette: aspect > 1.55 ? 'flare' : 'aline',
      sleeve: 'half',
      pieceCount: 5,
    }
  }
  return { garment: 'kemis', silhouette: 'aline', sleeve: 'half', pieceCount: 5 }
}

export function analyzeSketch(img: HTMLImageElement): SketchAnalysis {
  const { colors, baseColor } = analyzeImageColors(img)
  return {
    colors,
    baseColor,
    tiletProposals: buildTiletProposals(colors, baseColor),
    pattern: inferPattern(img),
  }
}

export function analyzeSketchDataUrl(dataUrl: string): Promise<SketchAnalysis> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(analyzeSketch(img))
    img.onerror = () => reject(new Error('Could not analyze sketch'))
    img.src = dataUrl
  })
}
