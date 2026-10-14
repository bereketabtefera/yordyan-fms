import { toEthiopian as etToEth, toGregorian as etToGreg } from 'ethiopian-date'
import type { Lang } from '../i18n/strings'

export const ETHIOPIAN_MONTHS = {
  en: [
    'Meskerem',
    'Tikimt',
    'Hidar',
    'Tahsas',
    'Tir',
    'Yekatit',
    'Megabit',
    'Miazia',
    'Ginbot',
    'Sene',
    'Hamle',
    'Nehase',
    'Pagume',
  ],
  am: [
    'መስከረም',
    'ጥቅምት',
    'ኅዳር',
    'ታኅሣሥ',
    'ጥር',
    'የካቲት',
    'መጋቢት',
    'ሚያዝያ',
    'ግንቦት',
    'ሰኔ',
    'ሐምሌ',
    'ነሐሴ',
    'ጳጉሜ',
  ],
}

export interface EthiopianDate {
  year: number
  month: number
  day: number
}

function partsFromISO(iso: string): [number, number, number] | null {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return null
  return [y, m, d]
}

export function toEthiopian(iso: string): EthiopianDate | null {
  const parts = partsFromISO(iso)
  if (!parts) return null
  const [year, month, day] = etToEth(parts)
  return { year, month, day }
}

export function fromEthiopian(e: EthiopianDate): string {
  const [gy, gm, gd] = etToGreg([e.year, e.month, e.day])
  return `${String(gy).padStart(4, '0')}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`
}

export function formatEthiopian(iso: string, lang: Lang): string {
  const e = toEthiopian(iso)
  if (!e) return ''
  const month = ETHIOPIAN_MONTHS[lang][e.month - 1] ?? ''
  return `${e.day} ${month} ${e.year}${lang === 'am' ? ' ዓ.ም' : ' E.C.'}`
}
