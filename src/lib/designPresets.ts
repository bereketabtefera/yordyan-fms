import type { Design, MotifId, TibebStyle } from '../db/types'

export interface DesignPreset {
  id: string
  name: string
  nameAm: string
  design: Omit<Design, 'id' | 'createdAt'>
}

function preset(
  id: string,
  name: string,
  nameAm: string,
  style: TibebStyle,
  base: string,
  colors: string[],
  motif: MotifId,
  extra: Partial<Omit<Design, 'id' | 'createdAt'>> = {},
): DesignPreset {
  return {
    id,
    name,
    nameAm,
    design: {
      code: '',
      name,
      nameAm,
      garmentType: 'kemis',
      silhouette: 'aline',
      neckline: 'v',
      sleeve: 'half',
      length: 'ankle',
      fabric: 'Shema (handwoven cotton)',
      tibebStyle: style,
      tiletPlacement: 'zuria',
      baseColor: base,
      tiletColors: colors,
      motif,
      motifRepeat: 8,
      bandWidth: 14,
      stripeCount: 5,
      specs: '',
      orderId: null,
      isSample: false,
      ...extra,
    },
  }
}

export const DESIGN_PRESETS: DesignPreset[] = [
  preset('gondar', 'Gondar Maroon', 'የጎንደር ጥበብ', 'tibeb', '#faf6f1', ['#7f1d1d', '#c08a1e', '#166534'], 'cross', {
    silhouette: 'flare',
    neckline: 'sweetheart',
    tiletPlacement: 'zuria',
    fabric: 'Gondar handwoven (Tibeb)',
  }),
  preset('classic-tilet', 'Classic Red Tilet', 'ባህላዊ ቀይ ጥለት', 'tilet', '#f7f5ef', ['#b91c1c', '#d4a017', '#111827'], 'stripe', {
    silhouette: 'aline',
    neckline: 'round',
    tiletPlacement: 'zuria',
    stripeCount: 6,
  }),
  preset('gold-tilet', 'Tilet Gold', 'ጥለት ወርቅ', 'tilet', '#fffdf5', ['#c08a1e', '#b91c1c', '#111827'], 'diamond', {
    silhouette: 'flare',
    neckline: 'v',
    sleeve: 'bell',
    length: 'floor',
    tiletPlacement: 'full',
  }),
  preset('yellow-tibeb', 'Sun & Ink Tibeb', 'ጥበብ ፀሐይና ቀለም', 'tibeb', '#f7f5ef', ['#eab308', '#111827', '#b91c1c'], 'chevron', {
    silhouette: 'aline',
    neckline: 'boat',
    tiletPlacement: 'gemash',
    fabric: 'Shema with yellow tibeb',
  }),
  preset('royal-blue', 'Royal Blue & Silver', 'ሮያል ሰማያዊና ብር', 'tibeb', '#f4f6fb', ['#1e40af', '#94a3b8', '#d4a017'], 'lattice', {
    silhouette: 'straight',
    neckline: 'square',
    sleeve: 'long',
    length: 'midi',
    tiletPlacement: 'hem',
  }),
  preset('meskel-tilf', 'Meskel Star Tilf', 'የመስቀል ኮከብ ጥልፍ', 'tilf', '#fffdf5', ['#c08a1e', '#7f1d1d', '#15803d'], 'meskel', {
    silhouette: 'flare',
    neckline: 'sweetheart',
    sleeve: 'bell',
    length: 'floor',
    tiletPlacement: 'full',
    motifRepeat: 6,
    fabric: 'Tilf tibeb (Gondar)',
  }),
  preset('lalibela-tilf', 'Lalibela Windows', 'የላሊበላ መስኮቶች', 'tilf', '#f8f7f2', ['#7f1d1d', '#c08a1e', '#111827'], 'lalibela', {
    silhouette: 'mermaid',
    neckline: 'high',
    sleeve: 'long',
    length: 'floor',
    tiletPlacement: 'zuria',
    motifRepeat: 5,
    fabric: 'Tilf tibeb with Lalibela motif',
  }),
  preset('emerald', 'Emerald & Gold', 'አረንጓዴና ወርቅ', 'tibeb', '#f8f7f2', ['#15803d', '#d4a017', '#b91c1c'], 'leaf', {
    silhouette: 'aline',
    neckline: 'v',
    sleeve: 'half',
    length: 'ankle',
    tiletPlacement: 'zuria',
  }),
  preset('zemede', 'Zemedè Blue', 'ዘመዴ ሰማያዊ', 'tilet', '#eef4ff', ['#1d4ed8', '#f59e0b', '#0f172a'], 'dots', {
    silhouette: 'puff',
    neckline: 'round',
    sleeve: 'puff',
    length: 'knee',
    tiletPlacement: 'gemash',
  }),
  preset('queen', 'Queen of Sheba', 'የንግስት ሳባ', 'tilf', '#fffaf0', ['#7c2d12', '#c08a1e', '#1e3a8a'], 'teltele', {
    silhouette: 'mermaid',
    neckline: 'sweetheart',
    sleeve: 'cap',
    length: 'floor',
    tiletPlacement: 'full',
    motifRepeat: 10,
    fabric: 'Tilf tibeb with chain loops',
  }),
  preset('shewa', 'Shewa Green Tilet', 'የሸዋ አረንጓዴ ጥለት', 'tilet', '#f4faf4', ['#166534', '#eab308', '#7f1d1d'], 'zigzag', {
    silhouette: 'aline',
    neckline: 'boat',
    length: 'ankle',
    tiletPlacement: 'zuria',
    stripeCount: 5,
  }),
  preset('addis-modern', 'Addis Modern', 'የአዲስ ዘመናዊ', 'tibeb', '#f5f6f8', ['#0f766e', '#f97316', '#1e293b'], 'wave', {
    silhouette: 'straight',
    neckline: 'high',
    sleeve: 'short',
    length: 'midi',
    tiletPlacement: 'neckline',
    fabric: 'Modern cotton with tibeb trim',
  }),
]

export function applyPreset(p: DesignPreset, code: string): Design {
  return {
    ...p.design,
    id: undefined,
    code,
    name: p.design.name,
    nameAm: p.design.nameAm,
    createdAt: new Date().toISOString(),
  }
}
