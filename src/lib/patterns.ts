import type { TKey } from '../i18n/strings'

export type Pt = { x: number; y: number }

export interface PatternPiece {
  key: TKey
  cut: number
  width: number
  height: number
  outline: Pt[]
  stitch: Pt[]
  grain: { x: number; y1: number; y2: number }
  label: Pt
  notches: Pt[]
}

export interface Measurements {
  bust?: number
  underbust?: number
  waist?: number
  hip?: number
  shoulder?: number
  backLength?: number
  frontLength?: number
  chestWidth?: number
  backWidth?: number
  neck?: number
  armholeDepth?: number
  sleeveLength?: number
  bicep?: number
  skirtLength?: number
  height?: number
}

export const MEASUREMENT_FIELDS = [
  'bust',
  'waist',
  'hip',
  'shoulder',
  'backLength',
  'frontLength',
  'chestWidth',
  'backWidth',
  'neck',
  'armholeDepth',
  'sleeveLength',
  'bicep',
  'skirtLength',
] as const

function round(p: Pt): Pt {
  return { x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 }
}

function offsetPolygon(points: Pt[], d: number): Pt[] {
  if (d <= 0 || points.length < 2) return points.map(round)
  const out: Pt[] = []
  const n = points.length
  for (let i = 0; i < n; i++) {
    const cur = points[i]
    const prev = points[(i - 1 + n) % n]
    const next = points[(i + 1) % n]
    const e1x = cur.x - prev.x
    const e1y = cur.y - prev.y
    const e2x = next.x - cur.x
    const e2y = next.y - cur.y
    const l1 = Math.hypot(e1x, e1y) || 1
    const l2 = Math.hypot(e2x, e2y) || 1
    const n1x = e1y / l1
    const n1y = -e1x / l1
    const n2x = e2y / l2
    const n2y = -e2x / l2
    let nx = n1x + n2x
    let ny = n1y + n2y
    const len = Math.hypot(nx, ny) || 1
    nx /= len
    ny /= len
    out.push({ x: cur.x + nx * d, y: cur.y + ny * d })
  }
  return out.map(round)
}

function bounds(points: Pt[]): { width: number; height: number } {
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  return { width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) }
}

function normalise(points: Pt[]): Pt[] {
  const minX = Math.min(...points.map((p) => p.x))
  const minY = Math.min(...points.map((p) => p.y))
  return points.map((p) => ({ x: p.x - minX, y: p.y - minY }))
}

function makePiece(
  key: TKey,
  cut: number,
  stitchPoints: Pt[],
  seamAllowance: number,
  grainX: number,
): PatternPiece {
  const stitch = normalise(stitchPoints)
  const outline = offsetPolygon(stitch, seamAllowance)
  const b = bounds(outline)
  return {
    key,
    cut,
    width: Math.round(b.width * 10) / 10,
    height: Math.round(b.height * 10) / 10,
    outline,
    stitch,
    grain: { x: grainX, y1: 3, y2: Math.max(6, b.height - 3) },
    label: { x: b.width / 2, y: b.height / 2 },
    notches: [
      { x: grainX, y: 0 },
      { x: grainX, y: b.height },
    ],
  }
}

function val(m: Measurements, key: keyof Measurements, fallback: number): number {
  const v = m[key]
  return typeof v === 'number' && v > 0 ? v : fallback
}

function bodicePanel(m: Measurements, fold: 'cf' | 'cb'): Pt[] {
  const bust = val(m, 'bust', 88)
  const neck = val(m, 'neck', 36)
  const shoulder = val(m, 'shoulder', 12)
  const backLength = val(m, 'backLength', 40)
  const armholeDepth = val(m, 'armholeDepth', 21)
  const width = bust / 4 + 1.5
  const nw = neck / 6 + 0.5
  const neckDepth = fold === 'cf' ? 6.5 : 1.5
  const shoulderDrop = 2.5
  const armholeCurve: Pt[] = [{ x: width - 1.4, y: armholeDepth * 0.5 }]
  return [
    { x: 0, y: neckDepth },
    ...(fold === 'cf' ? [{ x: nw * 0.45, y: neckDepth * 0.4 }] : [{ x: nw * 0.5, y: 0.6 }]),
    { x: nw, y: 0 },
    { x: nw + shoulder, y: shoulderDrop },
    ...armholeCurve,
    { x: width, y: armholeDepth },
    { x: width, y: backLength },
    { x: 0, y: backLength },
  ]
}

function skirtPanel(m: Measurements, silhouette: string, fold: 'cf' | 'cb'): Pt[] {
  const waist = val(m, 'waist', 70)
  const hip = val(m, 'hip', 94)
  const length = val(m, 'skirtLength', 100)
  const topW = waist / 4 + 1.5
  const hipW = hip / 4 + 1.5
  const flare =
    silhouette === 'flare' || silhouette === 'mermaid' ? 22 : silhouette === 'aline' ? 12 : silhouette === 'puff' ? 16 : 2
  const bottomW = Math.max(topW, hipW) + flare
  const side = fold === 'cf' ? 1 : 0
  return [
    { x: 0, y: 0 },
    { x: topW, y: 0 },
    { x: hipW + side, y: Math.min(20, length * 0.22) },
    { x: bottomW, y: length },
    { x: 0, y: length },
  ]
}

function sleevePanel(m: Measurements, style: string): Pt[] {
  const bicep = val(m, 'bicep', 28)
  const armholeDepth = val(m, 'armholeDepth', 21)
  const lenFull = val(m, 'sleeveLength', 58)
  let length = lenFull
  if (style === 'short') length = lenFull * 0.33
  else if (style === 'half') length = lenFull * 0.55
  else if (style === 'cap') length = lenFull * 0.18
  const capH = style === 'puff' ? armholeDepth * 0.62 : armholeDepth * 0.5
  const topW = bicep / 2 + 3
  const cuffW = style === 'bell' ? topW + 8 : style === 'puff' ? topW + 2 : topW - 1
  return [
    { x: topW * 0.25, y: capH * 0.3 },
    { x: topW * 0.75, y: capH * 0.3 },
    { x: topW, y: capH },
    { x: topW * 0.85, y: capH + (length - capH) * 0.7 },
    { x: cuffW, y: length },
    { x: Math.max(1, topW - cuffW), y: length },
    { x: topW * 0.15, y: capH + (length - capH) * 0.7 },
    { x: 0, y: capH },
  ]
}

function teePanel(m: Measurements, fold: 'cf' | 'cb'): Pt[] {
  const bust = val(m, 'bust', 98)
  const neck = val(m, 'neck', 38)
  const shoulder = val(m, 'shoulder', 15)
  const frontLength = val(m, 'frontLength', 46)
  const armholeDepth = val(m, 'armholeDepth', 24)
  const width = bust / 4 + 4
  const nw = neck / 6 + 0.5
  const neckDepth = fold === 'cf' ? 8 : 2.5
  return [
    { x: 0, y: neckDepth },
    { x: nw * 0.5, y: neckDepth * 0.35 },
    { x: nw, y: 0 },
    { x: nw + shoulder, y: 1.5 },
    { x: width, y: armholeDepth },
    { x: width, y: frontLength },
    { x: 0, y: frontLength },
  ]
}

export function draftPieces(
  garment: 'kemis' | 'vest' | 'tshirt' | 'other',
  m: Measurements,
  seamAllowance: number,
  silhouette = 'aline',
  sleeve = 'half',
): PatternPiece[] {
  const sa = Math.max(0, seamAllowance)
  if (garment === 'tshirt') {
    return [
      makePiece('piece_teeFront', 1, teePanel(m, 'cf'), sa, 8),
      makePiece('piece_teeBack', 1, teePanel(m, 'cb'), sa, 8),
      makePiece('piece_teeSleeve', 2, sleevePanel(m, 'short'), sa, 6),
    ]
  }
  if (garment === 'vest') {
    const placket: Pt[] = [
      { x: 0, y: 0 },
      { x: 8, y: 0 },
      { x: 8, y: val(m, 'frontLength', 46) * 0.6 },
      { x: 5, y: val(m, 'frontLength', 46) * 0.66 },
      { x: 0, y: val(m, 'frontLength', 46) * 0.6 },
    ]
    return [
      makePiece('piece_vestFront', 1, bodicePanel(m, 'cf'), sa, 8),
      makePiece('piece_vestBack', 1, bodicePanel(m, 'cb'), sa, 8),
      makePiece('piece_placket', 2, placket, sa, 4),
    ]
  }
  const pieces: PatternPiece[] = [
    makePiece('piece_bodiceFront', 1, bodicePanel(m, 'cf'), sa, 8),
    makePiece('piece_bodiceBack', 1, bodicePanel(m, 'cb'), sa, 8),
    makePiece('piece_skirtFront', 1, skirtPanel(m, silhouette, 'cf'), sa, 12),
    makePiece('piece_skirtBack', 1, skirtPanel(m, silhouette, 'cb'), sa, 12),
  ]
  if (sleeve !== 'none') pieces.push(makePiece('piece_sleeve', 2, sleevePanel(m, sleeve), sa, 6))
  return pieces
}

export interface StandardSize {
  label: string
  measurements: Measurements
}

export function standardSizes(garment: 'kemis' | 'vest' | 'tshirt' | 'other'): StandardSize[] {
  const base = [
    { label: 'XS', m: { bust: 80, waist: 62, hip: 86, shoulder: 11, backLength: 38, frontLength: 40, neck: 34, armholeDepth: 19, sleeveLength: 54, bicep: 24, skirtLength: 90 } },
    { label: 'S', m: { bust: 84, waist: 66, hip: 90, shoulder: 11.5, backLength: 39, frontLength: 41, neck: 35, armholeDepth: 20, sleeveLength: 56, bicep: 26, skirtLength: 95 } },
    { label: 'M', m: { bust: 88, waist: 70, hip: 94, shoulder: 12, backLength: 40, frontLength: 42, neck: 36, armholeDepth: 21, sleeveLength: 58, bicep: 28, skirtLength: 100 } },
    { label: 'L', m: { bust: 94, waist: 76, hip: 100, shoulder: 12.5, backLength: 41, frontLength: 43, neck: 37, armholeDepth: 22, sleeveLength: 60, bicep: 30, skirtLength: 105 } },
    { label: 'XL', m: { bust: 100, waist: 82, hip: 106, shoulder: 13, backLength: 42, frontLength: 44, neck: 38, armholeDepth: 23, sleeveLength: 62, bicep: 32, skirtLength: 110 } },
    { label: 'XXL', m: { bust: 108, waist: 90, hip: 114, shoulder: 13.5, backLength: 43, frontLength: 45, neck: 39, armholeDepth: 24, sleeveLength: 64, bicep: 34, skirtLength: 115 } },
  ]
  if (garment === 'tshirt' || garment === 'vest') {
    return base.map((b) => ({
      label: b.label,
      measurements: { ...b.m, chestWidth: 16, backWidth: 17 },
    }))
  }
  return base.map((b) => ({ label: b.label, measurements: { ...b.m, chestWidth: 16, backWidth: 17 } }))
}

export function resolveMeasurements(
  sizes: StandardSize[],
  label: string,
  custom: Measurements,
): Measurements {
  const found = sizes.find((s) => s.label === label)
  return { ...(found?.measurements || {}), ...custom }
}
