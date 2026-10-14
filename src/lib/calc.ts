import type {
  Account,
  Expense,
  Order,
  OwnerTransaction,
  Payment,
  ProductionCost,
  Settings,
  Transfer,
} from '../db/types'
import { monthKey } from './format'

export interface DataSet {
  orders: Order[]
  payments: Payment[]
  productionCosts: ProductionCost[]
  expenses: Expense[]
  ownerTransactions: OwnerTransaction[]
  transfers: Transfer[]
  settings: Settings
}

export type PaymentStatus = 'unpaid' | 'partial' | 'paid'

export interface OrderTotals {
  paid: number
  balance: number
  directCost: number
  profit: number | null
  margin: number | null
  paymentStatus: PaymentStatus
}

export function effectivePaymentAmount(p: Payment): number {
  return p.type === 'refund' ? -Math.abs(p.amount) : p.amount
}

export function orderTotals(
  order: Order,
  payments: Payment[],
  costs: ProductionCost[],
): OrderTotals {
  const paid = payments
    .filter((p) => p.orderId === order.id)
    .reduce((s, p) => s + effectivePaymentAmount(p), 0)
  const directCost = costs
    .filter((c) => c.orderId === order.id)
    .reduce((s, c) => s + c.amount, 0)
  const sellingPrice = order.sellingPrice
  const balance = sellingPrice - paid
  const profit = sellingPrice > 0 || directCost > 0 ? sellingPrice - directCost : null
  const margin = sellingPrice > 0 && profit !== null ? (profit / sellingPrice) * 100 : null
  let paymentStatus: PaymentStatus = 'unpaid'
  if (paid > 0.005) paymentStatus = balance <= 0.005 ? 'paid' : 'partial'
  if (order.deliveryStatus === 'cancelled') paymentStatus = paid > 0.005 ? 'partial' : 'unpaid'
  return { paid, balance, directCost, profit, margin, paymentStatus }
}

function inRange(date: string, from: string, to: string): boolean {
  return date >= from && date <= to
}

export interface PeriodSummary {
  from: string
  to: string
  salesBooked: number
  directCosts: number
  grossProfit: number
  opex: number
  netBeforeTax: number
  estTax: number
  estAfterTax: number
  collected: number
  contributions: number
  withdrawals: number
  ordersReceived: number
  ordersDelivered: number
  ordersInProduction: number
}

export function summarizePeriod(data: DataSet, from: string, to: string): PeriodSummary {
  const { orders, payments, productionCosts, expenses, ownerTransactions, settings } = data

  const activeOrders = orders.filter((o) => o.deliveryStatus !== 'cancelled')
  const salesBooked = activeOrders
    .filter((o) => inRange(o.orderDate, from, to))
    .reduce((s, o) => s + o.sellingPrice, 0)
  const ordersReceived = activeOrders.filter((o) => inRange(o.orderDate, from, to)).length

  const directCosts = productionCosts
    .filter((c) => inRange(c.date, from, to))
    .reduce((s, c) => s + c.amount, 0)

  const opex = expenses.filter((e) => inRange(e.date, from, to)).reduce((s, e) => s + e.amount, 0)

  const collected = payments
    .filter((p) => inRange(p.date, from, to))
    .reduce((s, p) => s + effectivePaymentAmount(p), 0)

  const contributions = ownerTransactions
    .filter((o) => o.type === 'contribution' && inRange(o.date, from, to))
    .reduce((s, o) => s + o.amount, 0)
  const withdrawals = ownerTransactions
    .filter((o) => o.type === 'withdrawal' && inRange(o.date, from, to))
    .reduce((s, o) => s + o.amount, 0)

  const ordersDelivered = orders.filter(
    (o) =>
      o.deliveryStatus === 'delivered' &&
      (inRange(o.actualCompletion, from, to) || inRange(o.orderDate, from, to)),
  ).length
  const ordersInProduction = orders.filter(
    (o) => o.deliveryStatus === 'in_production' || o.deliveryStatus === 'open',
  ).length

  const grossProfit = salesBooked - directCosts
  const netBeforeTax = grossProfit - opex
  const estTax =
    settings.taxMode === 'profit' ? Math.max(0, netBeforeTax) * (settings.taxRate / 100) : salesBooked * (settings.taxRate / 100)
  const estAfterTax = netBeforeTax - estTax

  return {
    from,
    to,
    salesBooked,
    directCosts,
    grossProfit,
    opex,
    netBeforeTax,
    estTax,
    estAfterTax,
    collected,
    contributions,
    withdrawals,
    ordersReceived,
    ordersDelivered,
    ordersInProduction,
  }
}

export function monthRange(key: string): { from: string; to: string } {
  const [y, m] = key.split('-').map(Number)
  const lastDay = new Date(y, m, 0).getDate()
  return { from: `${key}-01`, to: `${key}-${String(lastDay).padStart(2, '0')}` }
}

export function summarizeMonth(data: DataSet, key: string): PeriodSummary {
  const { from, to } = monthRange(key)
  return summarizePeriod(data, from, to)
}

export function outstandingBalances(data: DataSet): number {
  return data.orders
    .filter((o) => o.deliveryStatus !== 'cancelled')
    .reduce((s, o) => s + Math.max(0, orderTotals(o, data.payments, data.productionCosts).balance), 0)
}

export function expensesByCategory(data: DataSet, from?: string, to?: string): { category: string; amount: number }[] {
  const map = new Map<string, number>()
  for (const e of data.expenses) {
    if (from && to && !inRange(e.date, from, to)) continue
    map.set(e.category, (map.get(e.category) ?? 0) + e.amount)
  }
  return [...map.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
}

export interface PayableRow {
  source: 'production' | 'expense'
  id: number
  date: string
  label: string
  category: string
  amount: number
  supplierId: number | null
}

export function payables(data: DataSet): PayableRow[] {
  const rows: PayableRow[] = []
  for (const c of data.productionCosts) {
    if (!c.paid) {
      rows.push({
        source: 'production',
        id: c.id!,
        date: c.date,
        label: c.orderNo ? `Order ${c.orderNo}` : c.description,
        category: c.category,
        amount: c.amount,
        supplierId: c.supplierId,
      })
    }
  }
  for (const e of data.expenses) {
    if (!e.paid) {
      rows.push({
        source: 'expense',
        id: e.id!,
        date: e.date,
        label: e.description || e.category,
        category: e.category,
        amount: e.amount,
        supplierId: e.supplierId,
      })
    }
  }
  return rows.sort((a, b) => a.date.localeCompare(b.date))
}

export interface CashRow {
  id: string
  date: string
  description: string
  account: Account
  inflow: number
  outflow: number
  kind: string
}

export function cashRows(data: DataSet): CashRow[] {
  const rows: CashRow[] = []
  for (const p of data.payments) {
    const amt = effectivePaymentAmount(p)
    rows.push({
      id: `p-${p.id}`,
      date: p.date,
      description: `Customer payment${p.orderNo ? ` · Order ${p.orderNo}` : ''} (${p.type})`,
      account: p.account,
      inflow: amt >= 0 ? amt : 0,
      outflow: amt < 0 ? -amt : 0,
      kind: 'payment',
    })
  }
  for (const c of data.productionCosts) {
    if (c.paid) {
      rows.push({
        id: `c-${c.id}`,
        date: c.paidDate || c.date,
        description: `Production · ${c.category}${c.orderNo ? ` · Order ${c.orderNo}` : ''}`,
        account: c.account,
        inflow: 0,
        outflow: c.amount,
        kind: 'production',
      })
    }
  }
  for (const e of data.expenses) {
    if (e.paid) {
      rows.push({
        id: `e-${e.id}`,
        date: e.paidDate || e.date,
        description: `Expense · ${e.category}${e.description ? ` · ${e.description}` : ''}`,
        account: e.account,
        inflow: 0,
        outflow: e.amount,
        kind: 'expense',
      })
    }
  }
  for (const o of data.ownerTransactions) {
    rows.push({
      id: `o-${o.id}`,
      date: o.date,
      description: o.type === 'contribution' ? 'Owner contribution' : 'Owner withdrawal',
      account: o.account,
      inflow: o.type === 'contribution' ? o.amount : 0,
      outflow: o.type === 'withdrawal' ? o.amount : 0,
      kind: 'owner',
    })
  }
  for (const t of data.transfers) {
    rows.push({
      id: `t-out-${t.id}`,
      date: t.date,
      description: `Transfer to ${t.to}`,
      account: t.from,
      inflow: 0,
      outflow: t.amount,
      kind: 'transfer',
    })
    rows.push({
      id: `t-in-${t.id}`,
      date: t.date,
      description: `Transfer from ${t.from}`,
      account: t.to,
      inflow: t.amount,
      outflow: 0,
      kind: 'transfer',
    })
  }
  return rows.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
}

export function accountBalances(data: DataSet): Record<Account | 'total', number> {
  const { settings } = data
  const opening: Record<Account, number> = {
    cash: settings.openingCash,
    bank: settings.openingBank,
    mobile: settings.openingMobile,
  }
  const bal: Record<Account, number> = { ...opening }
  for (const r of cashRows(data)) {
    bal[r.account] += r.inflow - r.outflow
  }
  return { ...bal, total: bal.cash + bal.bank + bal.mobile }
}

export function monthlyTrend(data: DataSet, keys: string[]) {
  return keys.map((k) => {
    const s = summarizeMonth(data, k)
    return {
      month: k,
      sales: s.salesBooked,
      costs: s.directCosts + s.opex,
      collected: s.collected,
      profit: s.netBeforeTax,
    }
  })
}

export function ordersByMonth(data: DataSet, key: string): Order[] {
  return data.orders
    .filter((o) => monthKey(o.orderDate) === key)
    .sort((a, b) => b.orderDate.localeCompare(a.orderDate))
}
