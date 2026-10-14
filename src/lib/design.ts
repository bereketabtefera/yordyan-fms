import type { TKey } from '../i18n/strings'
import type {
  Design,
  DressLength,
  GarmentType,
  MeasurementKey,
  Measurements,
  Neckline,
  Silhouette,
  SleeveStyle,
  TiletPlacement,
  TibebStyle,
} from '../db/types'

export interface Opt<T extends string> {
  value: T
  key: TKey
}

export const GARMENT_TYPES: Opt<GarmentType>[] = [
  { value: 'kemis', key: 'garment_kemis' },
  { value: 'vest', key: 'garment_vest' },
  { value: 'tshirt', key: 'garment_tshirt' },
  { value: 'other', key: 'garment_other' },
]

export const SILHOUETTES: Opt<Silhouette>[] = [
  { value: 'fitted', key: 'sil_fitted' },
  { value: 'aline', key: 'sil_aline' },
  { value: 'flare', key: 'sil_flare' },
  { value: 'straight', key: 'sil_straight' },
  { value: 'puff', key: 'sil_puff' },
  { value: 'mermaid', key: 'sil_mermaid' },
]

export const NECKLINES: Opt<Neckline>[] = [
  { value: 'round', key: 'neck_round' },
  { value: 'v', key: 'neck_v' },
  { value: 'square', key: 'neck_square' },
  { value: 'sweetheart', key: 'neck_sweetheart' },
  { value: 'boat', key: 'neck_boat' },
  { value: 'high', key: 'neck_high' },
  { value: 'cross', key: 'neck_cross' },
]

export const SLEEVES: Opt<SleeveStyle>[] = [
  { value: 'none', key: 'slv_none' },
  { value: 'short', key: 'slv_short' },
  { value: 'half', key: 'slv_half' },
  { value: 'long', key: 'slv_long' },
  { value: 'bell', key: 'slv_bell' },
  { value: 'puff', key: 'slv_puff' },
  { value: 'cap', key: 'slv_cap' },
]

export const LENGTHS: Opt<DressLength>[] = [
  { value: 'short', key: 'len_short' },
  { value: 'knee', key: 'len_knee' },
  { value: 'midi', key: 'len_midi' },
  { value: 'ankle', key: 'len_ankle' },
  { value: 'floor', key: 'len_floor' },
]

export const TIBEB_STYLES: Opt<TibebStyle>[] = [
  { value: 'none', key: 'tib_none' },
  { value: 'tilet', key: 'tib_tilet' },
  { value: 'tibeb', key: 'tib_tibeb' },
  { value: 'tilf', key: 'tib_tilf' },
]

export const TILET_PLACEMENTS: Opt<TiletPlacement>[] = [
  { value: 'zuria', key: 'place_zuria' },
  { value: 'gemash', key: 'place_gemash' },
  { value: 'full', key: 'place_full' },
  { value: 'hem', key: 'place_hem' },
  { value: 'neckline', key: 'place_neckline' },
  { value: 'sleeves', key: 'place_sleeves' },
]

export const MEASUREMENT_FIELDS: { key: MeasurementKey; labelKey: TKey }[] = [
  { key: 'bust', labelKey: 'meas_bust' },
  { key: 'underbust', labelKey: 'meas_underbust' },
  { key: 'waist', labelKey: 'meas_waist' },
  { key: 'hip', labelKey: 'meas_hip' },
  { key: 'shoulder', labelKey: 'meas_shoulder' },
  { key: 'backLength', labelKey: 'meas_backLength' },
  { key: 'frontLength', labelKey: 'meas_frontLength' },
  { key: 'chestWidth', labelKey: 'meas_chestWidth' },
  { key: 'backWidth', labelKey: 'meas_backWidth' },
  { key: 'neck', labelKey: 'meas_neck' },
  { key: 'armholeDepth', labelKey: 'meas_armholeDepth' },
  { key: 'sleeveLength', labelKey: 'meas_sleeveLength' },
  { key: 'bicep', labelKey: 'meas_bicep' },
  { key: 'skirtLength', labelKey: 'meas_skirtLength' },
]

export const DEFAULT_MEASUREMENTS: Measurements = {
  bust: 88,
  underbust: 76,
  waist: 70,
  hip: 96,
  shoulder: 12,
  backLength: 40,
  frontLength: 42,
  chestWidth: 16,
  backWidth: 17,
  neck: 36,
  armholeDepth: 21,
  sleeveLength: 58,
  bicep: 30,
  skirtLength: 100,
}

export function emptyDesign(code: string): Design {
  return {
    code,
    name: '',
    nameAm: '',
    garmentType: 'kemis',
    silhouette: 'aline',
    neckline: 'v',
    sleeve: 'half',
    length: 'ankle',
    fabric: 'Shema (handwoven cotton)',
    tibebStyle: 'tibeb',
    tiletPlacement: 'zuria',    baseColor: '#f7f5ef',
    tiletColors: ['#b91c1c', '#d4a017', '#15803d'],
    motif: 'stripe',
    motifRepeat: 8,
    mirrorMotif: false,
    bandWidth: 14,
    stripeCount: 5,
    specs: '',
    orderId: null,
    createdAt: new Date().toISOString(),
  }
}

// ---- Colour helpers ----

export interface RGB {
  r: number
  g: number
  b: number
}

export function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '').trim()
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.padEnd(6, '0').slice(0, 6)
  const n = parseInt(full, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function channel(c: number): number {
  const s = c / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  const lighter = Math.max(la, lb)
  const darker = Math.min(la, lb)
  return (lighter + 0.05) / (darker + 0.05)
}

export function readableText(hex: string): string {
  return luminance(hex) > 0.5 ? '#111827' : '#ffffff'
}

export interface PresetPalette {
  name: string
  primary: string
  secondary: string
  accents: string[]
}

export const PALETTE_PRESETS: PresetPalette[] = [
  { name: 'Classic red tilet', primary: '#f7f5ef', secondary: '#b91c1c', accents: ['#d4a017', '#111827'] },
  { name: 'Yellow & black tibeb', primary: '#f7f5ef', secondary: '#eab308', accents: ['#111827', '#b91c1c'] },
  { name: 'Green & gold', primary: '#f8f7f2', secondary: '#15803d', accents: ['#d4a017', '#b91c1c'] },
  { name: 'Royal blue & silver', primary: '#f4f6fb', secondary: '#1e40af', accents: ['#94a3b8', '#d4a017'] },
  { name: 'Gondar maroon', primary: '#faf6f1', secondary: '#7f1d1d', accents: ['#d4a017', '#166534'] },
  { name: 'Tilet gold', primary: '#fffdf5', secondary: '#c08a1e', accents: ['#b91c1c', '#111827'] },
]

export function codeOf(existing: Design[]): string {
  const year = new Date().getFullYear()
  const nums = existing
    .map((d) => d.code.match(/(\d+)$/))
    .filter(Boolean)
    .map((m) => Number(m![1]))
  const next = (nums.length ? Math.max(...nums) : 0) + 1
  return `DSN-${year}-${String(next).padStart(4, '0')}`
}
