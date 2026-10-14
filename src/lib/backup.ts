import { db, DEFAULT_SETTINGS } from '../db/db'

export interface BackupFile {
  app: string
  version: number
  exportedAt: string
  tables: Record<string, unknown[]>
}

export async function buildBackup(): Promise<BackupFile> {
  const [
    profile,
    orders,
    payments,
    productionCosts,
    expenses,
    suppliers,
    ownerTransactions,
    inventory,
    transfers,
    taxes,
    settings,
  ] = await Promise.all([
    db.profile.toArray(),
    db.orders.toArray(),
    db.payments.toArray(),
    db.productionCosts.toArray(),
    db.expenses.toArray(),
    db.suppliers.toArray(),
    db.ownerTransactions.toArray(),
    db.inventory.toArray(),
    db.transfers.toArray(),
    db.taxes.toArray(),
    db.settings.toArray(),
  ])
  return {
    app: 'yordyan-fms',
    version: 1,
    exportedAt: new Date().toISOString(),
    tables: {
      profile,
      orders,
      payments,
      productionCosts,
      expenses,
      suppliers,
      ownerTransactions,
      inventory,
      transfers,
      taxes,
      settings,
    },
  }
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function exportJSON() {
  const backup = await buildBackup()
  download(`yordyan-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(backup, null, 2), 'application/json')
}

export async function importJSON(file: File, mode: 'merge' | 'replace' = 'merge') {
  const text = await file.text()
  const parsed = JSON.parse(text) as BackupFile
  if (!parsed?.tables) throw new Error('Invalid backup file')
  const entries = Object.entries(parsed.tables) as [string, Record<string, unknown>[]][]
  if (mode === 'replace') await wipeAll(false)
  for (const [name, rows] of entries) {
    const table = (db as unknown as Record<string, { bulkPut: (r: unknown[]) => Promise<unknown> }>)[name]
    if (table && Array.isArray(rows) && rows.length) await table.bulkPut(rows)
  }
}

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return ''
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCSV(rows: Record<string, unknown>[], columns?: string[]): string {
  if (!rows.length) return ''
  const cols = columns ?? Object.keys(rows[0])
  const head = cols.join(',')
  const body = rows.map((r) => cols.map((c) => csvEscape(r[c])).join(',')).join('\n')
  return `${head}\n${body}`
}

export async function exportCSV() {
  const backup = await buildBackup()
  for (const [name, rows] of Object.entries(backup.tables)) {
    if (!rows.length) continue
    download(`yordyan-${name}.csv`, toCSV(rows as Record<string, unknown>[]), 'text/csv;charset=utf-8')
  }
}

export async function wipeAll(keepSettings = true) {
  await Promise.all([
    db.profile.clear(),
    db.orders.clear(),
    db.payments.clear(),
    db.productionCosts.clear(),
    db.expenses.clear(),
    db.suppliers.clear(),
    db.ownerTransactions.clear(),
    db.inventory.clear(),
    db.transfers.clear(),
    db.taxes.clear(),
  ])
  if (!keepSettings) {
    await db.settings.clear()
    await db.settings.put(structuredClone(DEFAULT_SETTINGS))
  }
}
