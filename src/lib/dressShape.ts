import type { DressLength, Neckline, Silhouette, SleeveStyle, TiletPlacement } from '../db/types'

export interface DressSpec {
  silhouette: Silhouette
  neckline: Neckline
  sleeve: SleeveStyle
  length: DressLength
  tiletPlacement: TiletPlacement
  hasTibeb: boolean
}

export interface BandRect {
  x: number
  y: number
  w: number
  h: number
  count: number
  vertical: boolean
}

export function neckPath(neckline: Neckline): string {
  switch (neckline) {
    case 'v':
      return 'M 88 38 L 100 68 L 112 38 Z'
    case 'square':
      return 'M 88 38 L 88 56 L 112 56 L 112 38 Z'
    case 'sweetheart':
      return 'M 88 38 C 92 52 96 47 100 58 C 104 47 108 52 112 38 Z'
    case 'boat':
      return 'M 86 38 C 94 47 106 47 114 38 Z'
    case 'high':
      return 'M 92 38 C 96 45 104 45 108 38 Z'
    case 'cross':
      return 'M 88 38 L 100 60 L 112 38 L 104 38 L 100 48 L 96 38 Z'
    default:
      return 'M 88 38 C 90 56 110 56 112 38 Z'
  }
}

export function sleeveLengthOf(style: SleeveStyle): number {
  switch (style) {
    case 'none':
      return 0
    case 'cap':
      return 12
    case 'puff':
      return 22
    case 'short':
      return 34
    case 'half':
      return 58
    case 'bell':
      return 78
    case 'long':
      return 108
    default:
      return 34
  }
}

export function hemY(length: DressLength, topOnly: boolean): number {
  if (topOnly) return 176
  switch (length) {
    case 'short':
      return 196
    case 'knee':
      return 232
    case 'midi':
      return 262
    case 'ankle':
      return 292
    case 'floor':
      return 302
    default:
      return 280
  }
}

export function hemHalf(silhouette: Silhouette): number {
  switch (silhouette) {
    case 'flare':
      return 58
    case 'aline':
      return 44
    case 'mermaid':
      return 50
    case 'puff':
      return 38
    case 'fitted':
      return 27
    default:
      return 31
  }
}

export const SHOULDER_HALF = 28
export const WAIST_HALF = 22
export const HIP_HALF = 30

export function dressOutline(spec: Pick<DressSpec, 'silhouette' | 'length'>, topOnly: boolean): string {
  const sh = SHOULDER_HALF
  const hh = hemHalf(spec.silhouette)
  const hy = hemY(spec.length, topOnly)
  return [
    `M ${100 - sh} 38`,
    `C ${100 - sh - 6} 62, ${100 - WAIST_HALF - 4} 86, ${100 - WAIST_HALF} 120`,
    `L ${100 - HIP_HALF} 160`,
    `L ${100 - hh} ${hy}`,
    `L ${100 + hh} ${hy}`,
    `L ${100 + HIP_HALF} 160`,
    `L ${100 + WAIST_HALF} 120`,
    `C ${100 + WAIST_HALF + 4} 86, ${100 + sh + 6} 62, ${100 + sh} 38`,
    'Z',
  ].join(' ')
}

export function sleeveOut(style: SleeveStyle): number {
  return style === 'bell' ? 52 : style === 'puff' ? 66 : 40
}

export function sleevePaths(spec: DressSpec): { left: string; right: string; cuffY: number; cuffOut: number } | null {
  if (spec.sleeve === 'none') return null
  const sl = sleeveLengthOf(spec.sleeve)
  const cuffY = 66 + sl
  const cuffOut = sleeveOut(spec.sleeve)
  return {
    cuffY,
    cuffOut,
    left: `M 80 46 C 66 52, 60 60, ${cuffOut} ${cuffY} L ${cuffOut + 16} ${cuffY - 6} L 88 ${72} Z`,
    right: `M 120 46 C 134 52, 140 60, ${200 - cuffOut} ${cuffY} L ${200 - cuffOut - 16} ${cuffY - 6} L 112 ${72} Z`,
  }
}

export function tibebBands(spec: DressSpec, topOnly: boolean, bandWidth = 14): BandRect[] {
  if (!spec.hasTibeb) return []
  const hy = hemY(spec.length, topOnly)
  const sleeves = sleevePaths(spec)
  const bands: BandRect[] = []
  const place = spec.tiletPlacement
  if (place === 'hem' || place === 'full' || place === 'zuria' || place === 'gemash') {
    const bandH = place === 'gemash' ? (hy - 160) * 0.5 : bandWidth
    const bandY = place === 'gemash' ? 160 : hy - bandWidth - 8
    bands.push({ x: 40, y: bandY, w: 120, h: bandH, count: 5, vertical: false })
  }
  if (place === 'neckline' || place === 'full' || place === 'zuria') {
    bands.push({ x: 40, y: 44, w: 120, h: Math.min(8, bandWidth * 0.5), count: 5, vertical: false })
  }
  if ((place === 'sleeves' || place === 'full') && sleeves) {
    const { cuffY, cuffOut } = sleeves
    bands.push({ x: cuffOut, y: cuffY - 12, w: 16, h: 8, count: 5, vertical: false })
    bands.push({ x: 200 - cuffOut - 16, y: cuffY - 12, w: 16, h: 8, count: 5, vertical: false })
  }
  if (place === 'zuria' || place === 'full') {
    bands.push({ x: 94, y: 60, w: 12, h: hy - 60, count: 3, vertical: true })
  }
  return bands
}

export function bandStripes(band: BandRect, colors: string[]): { x: number; y: number; w: number; h: number; fill: string }[] {
  const out: { x: number; y: number; w: number; h: number; fill: string }[] = []
  if (!colors.length) return out
  if (band.vertical) {
    const sw = band.w / band.count
    for (let i = 0; i < band.count; i++) {
      out.push({ x: band.x + i * sw, y: band.y, w: sw + 0.5, h: band.h, fill: colors[i % colors.length] })
    }
    return out
  }
  const sh = band.h / band.count
  for (let i = 0; i < band.count; i++) {
    out.push({ x: band.x, y: band.y + i * sh, w: band.w, h: sh + 0.5, fill: colors[i % colors.length] })
  }
  return out
}
