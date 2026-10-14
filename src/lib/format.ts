import type { Lang } from '../i18n/strings'
import { formatEthiopian } from './ethiopianDate'

export function todayISO(): string {
  const d = new Date()
  return toISO(d)
}

export function toISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const MONTHS_SHORT_EN = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

export const MONTHS_LONG_EN = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export function formatDate(iso: string, lang: Lang = 'en'): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  const greg = `${d} ${MONTHS_SHORT_EN[m - 1]} ${y}`
  return lang === 'am' ? `${greg} (${formatEthiopian(iso, 'am')})` : greg
}

export function monthKey(iso: string): string {
  return iso ? iso.slice(0, 7) : ''
}

export function monthLabel(key: string, _lang: Lang = 'en'): string {
  if (!key) return ''
  const [y, m] = key.split('-').map(Number)
  const greg = `${MONTHS_LONG_EN[m - 1]} ${y}`
  return greg
}

export function currentMonthKey(): string {
  return todayISO().slice(0, 7)
}

export function addMonths(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function lastNMonths(n: number, endKey = currentMonthKey()): string[] {
  const out: string[] = []
  for (let i = n - 1; i >= 0; i--) out.push(addMonths(endKey, -i))
  return out
}

const nf = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

export function formatMoney(n: number): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '0 Br'
  return `${nf.format(round2(n))} Br`
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

export function num(v: unknown): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(/,/g, ''))
  return Number.isFinite(n) ? n : 0
}

export function pct(n: number | null): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—'
  return `${round2(n)}%`
}
