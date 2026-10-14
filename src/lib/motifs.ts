import type { MotifId, TibebStyle } from '../db/types'
import type { BandRect } from './dressShape'

interface MotifDef {
  id: MotifId
  en: string
  am: string
  styles: TibebStyle[]
  render: (w: number, h: number, c: string[]) => string
}

function pick(c: string[], i: number): string {
  if (!c.length) return '#111827'
  return c[((i % c.length) + c.length) % c.length]
}

export const MOTIFS: MotifDef[] = [
  {
    id: 'stripe',
    en: 'Tilet stripes',
    am: 'የጥለት መስመሮች',
    styles: ['tilet', 'tibeb', 'tilf'],
    render: () => '',
  },
  {
    id: 'zigzag',
    en: 'Zigzag',
    am: 'ዚግዛግ',
    styles: ['tilet', 'tibeb', 'tilf'],
    render: (w, h, c) =>
      `<path d="M0 ${h} L ${w / 2} ${h * 0.08} L ${w} ${h}" fill="none" stroke="${pick(c, 0)}" stroke-width="${h * 0.13}"/>` +
      `<path d="M0 ${h} L ${w / 2} ${h * 0.08} L ${w} ${h}" fill="none" stroke="${pick(c, 1)}" stroke-width="${h * 0.13}" transform="translate(0 ${h * 0.24})"/>`,
  },
  {
    id: 'diamond',
    en: 'Diamond chain',
    am: 'የአልማዝ ሰንሰለት',
    styles: ['tilet', 'tibeb', 'tilf'],
    render: (w, h, c) =>
      `<path d="M ${w / 2} 0 L ${w} ${h / 2} L ${w / 2} ${h} L 0 ${h / 2} Z" fill="${pick(c, 0)}"/>` +
      `<path d="M ${w / 2} ${h * 0.26} L ${w * 0.74} ${h / 2} L ${w / 2} ${h * 0.74} L ${w * 0.26} ${h / 2} Z" fill="${pick(c, 1)}"/>` +
      `<circle cx="${w / 2}" cy="${h / 2}" r="${Math.min(w, h) * 0.07}" fill="${pick(c, 2)}"/>`,
  },
  {
    id: 'chevron',
    en: 'Chevron',
    am: 'ቼቭሮን',
    styles: ['tilet', 'tibeb'],
    render: (w, h, c) =>
      [0, 0.3, 0.6].map((o, i) => `<path d="M0 ${h * 0.85 - o * h} L ${w / 2} ${h * 0.2 - o * h} L ${w} ${h * 0.85 - o * h}" fill="none" stroke="${pick(c, i)}" stroke-width="${h * 0.12}"/>`).join(''),
  },
  {
    id: 'cross',
    en: 'Ethiopian cross',
    am: 'የኢትዮጵያ መስቀል',
    styles: ['tibeb', 'tilf'],
    render: (w, h, c) =>
      `<path d="M ${w * 0.42} 0 H ${w * 0.58} V ${h * 0.42} H ${w} V ${h * 0.58} H ${w * 0.58} V ${h} H ${w * 0.42} V ${h * 0.58} H 0 V ${h * 0.42} H ${w * 0.42} Z" fill="${pick(c, 0)}"/>` +
      `<path d="M ${w * 0.46} ${h * 0.14} H ${w * 0.54} V ${h * 0.46} H ${w * 0.86} V ${h * 0.54} H ${w * 0.54} V ${h * 0.86} H ${w * 0.46} V ${h * 0.54} H 0 V ${h * 0.46} H ${w * 0.46} Z" fill="${pick(c, 1)}" opacity="0.85"/>`,
  },
  {
    id: 'meskel',
    en: 'Meskel star',
    am: 'የመስቀል ኮከብ',
    styles: ['tibeb', 'tilf'],
    render: (w, h, c) =>
      `<path d="M ${w / 2} 0 L ${w * 0.6} ${h * 0.4} L ${w} ${h * 0.4} L ${w * 0.68} ${h * 0.62} L ${w * 0.82} ${h} L ${w / 2} ${h * 0.78} L ${w * 0.18} ${h} L ${w * 0.32} ${h * 0.62} L 0 ${h * 0.4} L ${w * 0.4} ${h * 0.4} Z" fill="${pick(c, 0)}"/>` +
      `<circle cx="${w / 2}" cy="${h * 0.55}" r="${Math.min(w, h) * 0.14}" fill="${pick(c, 1)}"/>`,
  },
  {
    id: 'wave',
    en: 'Wave',
    am: 'ማዕበል',
    styles: ['tilet', 'tibeb', 'tilf'],
    render: (w, h, c) =>
      `<path d="M0 ${h * 0.4} Q ${w * 0.25} ${h * 0.1} ${w * 0.5} ${h * 0.4} T ${w} ${h * 0.4}" fill="none" stroke="${pick(c, 0)}" stroke-width="${h * 0.12}"/>` +
      `<path d="M0 ${h * 0.7} Q ${w * 0.25} ${h * 0.4} ${w * 0.5} ${h * 0.7} T ${w} ${h * 0.7}" fill="none" stroke="${pick(c, 1)}" stroke-width="${h * 0.12}"/>`,
  },
  {
    id: 'lattice',
    en: 'Lattice',
    am: 'ላቲስ',
    styles: ['tilf', 'tibeb'],
    render: (w, h, c) =>
      `<rect x="0" y="0" width="${w}" height="${h}" fill="none" stroke="${pick(c, 0)}" stroke-width="${h * 0.08}"/>` +
      `<path d="M0 0 L ${w} ${h} M ${w} 0 L 0 ${h}" stroke="${pick(c, 1)}" stroke-width="${h * 0.06}"/>`,
  },
  {
    id: 'dots',
    en: 'Dot line',
    am: 'የነጥብ መስመር',
    styles: ['tilet', 'tibeb', 'tilf'],
    render: (w, h, c) =>
      `<line x1="0" y1="${h / 2}" x2="${w}" y2="${h / 2}" stroke="${pick(c, 1)}" stroke-width="${h * 0.05}"/>` +
      `<circle cx="${w / 2}" cy="${h / 2}" r="${Math.min(w, h) * 0.26}" fill="${pick(c, 0)}"/>` +
      `<circle cx="${w / 2}" cy="${h / 2}" r="${Math.min(w, h) * 0.11}" fill="${pick(c, 2)}"/>`,
  },
  {
    id: 'leaf',
    en: 'Leaves',
    am: 'ቅጠሎች',
    styles: ['tibeb', 'tilf'],
    render: (w, h, c) =>
      `<path d="M ${w / 2} 0 C ${w * 0.95} ${h * 0.3}, ${w * 0.95} ${h * 0.7}, ${w / 2} ${h} C ${w * 0.05} ${h * 0.7}, ${w * 0.05} ${h * 0.3}, ${w / 2} 0 Z" fill="${pick(c, 0)}"/>` +
      `<line x1="${w / 2}" y1="${h * 0.12}" x2="${w / 2}" y2="${h * 0.88}" stroke="${pick(c, 1)}" stroke-width="${h * 0.06}"/>`,
  },
  {
    id: 'lalibela',
    en: 'Lalibela windows',
    am: 'የላሊበላ መስኮቶች',
    styles: ['tilf', 'tibeb'],
    render: (w, h, c) =>
      `<rect x="${w * 0.16}" y="${h * 0.1}" width="${w * 0.68}" height="${h * 0.8}" fill="${pick(c, 0)}"/>` +
      `<rect x="${w * 0.3}" y="${h * 0.26}" width="${w * 0.4}" height="${h * 0.48}" fill="${pick(c, 1)}"/>` +
      `<rect x="${w * 0.42}" y="${h * 0.38}" width="${w * 0.16}" height="${h * 0.24}" fill="${pick(c, 2)}"/>`,
  },
  {
    id: 'teltele',
    en: 'Chain loops',
    am: 'የሰንሰለት ቀለበቶች',
    styles: ['tilf', 'tilet'],
    render: (w, h, c) =>
      `<line x1="0" y1="${h / 2}" x2="${w}" y2="${h / 2}" stroke="${pick(c, 0)}" stroke-width="${h * 0.08}"/>` +
      `<circle cx="${w / 2}" cy="${h / 2}" r="${h * 0.34}" fill="none" stroke="${pick(c, 0)}" stroke-width="${h * 0.12}"/>` +
      `<circle cx="${w / 2}" cy="${h / 2}" r="${h * 0.12}" fill="${pick(c, 1)}"/>`,
  },
]

export function motifDef(id: MotifId | undefined): MotifDef {
  return MOTIFS.find((m) => m.id === id) ?? MOTIFS[0]
}

export function motifsForStyle(style: TibebStyle): MotifDef[] {
  return MOTIFS.filter((m) => m.styles.includes(style))
}

function stripeMarkup(band: BandRect, colors: string[], count: number): string {
  const parts: string[] = []
  if (band.vertical) {
    const sw = band.w / count
    for (let i = 0; i < count; i++) {
      parts.push(`<rect x="${band.x + i * sw}" y="${band.y}" width="${sw + 0.4}" height="${band.h}" fill="${pick(colors, i)}"/>`)
    }
  } else {
    const sh = band.h / count
    for (let i = 0; i < count; i++) {
      parts.push(`<rect x="${band.x}" y="${band.y + i * sh}" width="${band.w}" height="${sh + 0.4}" fill="${pick(colors, i)}"/>`)
    }
  }
  return parts.join('')
}

export interface BandPattern {
  motif?: MotifId
  repeat?: number
  mirror?: boolean
  stripeCount?: number
}

export function bandMarkup(band: BandRect, colors: string[], pattern: BandPattern): string {
  const motif = pattern.motif ?? 'stripe'
  if (motif === 'stripe') {
    return stripeMarkup(band, colors, Math.max(2, pattern.stripeCount ?? band.count))
  }
  const def = motifDef(motif)
  const parts: string[] = []
  if (band.vertical) {
    const rows = Math.max(1, pattern.repeat ?? Math.round(band.h / Math.max(1, band.w)))
    const ch = band.h / rows
    for (let j = 0; j < rows; j++) {
      const flip = pattern.mirror && j % 2 === 1
      const inner = def.render(band.w, ch, colors)
      const transform = flip
        ? `translate(${band.x} ${band.y + j * ch + ch}) scale(1 -1)`
        : `translate(${band.x} ${band.y + j * ch})`
      parts.push(`<g transform="${transform}">${inner}</g>`)
    }
  } else {
    const cols = Math.max(1, pattern.repeat ?? Math.round(band.w / Math.max(1, band.h)))
    const cw = band.w / cols
    for (let i = 0; i < cols; i++) {
      const flip = pattern.mirror && i % 2 === 1
      const inner = def.render(cw, band.h, colors)
      const transform = flip
        ? `translate(${band.x + i * cw + cw} ${band.y}) scale(-1 1)`
        : `translate(${band.x + i * cw} ${band.y})`
      parts.push(`<g transform="${transform}">${inner}</g>`)
    }
  }
  return parts.join('')
}
