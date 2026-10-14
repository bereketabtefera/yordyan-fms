import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, DEFAULT_SETTINGS, ensureSettings } from './db'
import type {
  BusinessProfile,
  Expense,
  InventoryItem,
  Order,
  OwnerTransaction,
  Payment,
  ProductionCost,
  Settings,
  Supplier,
  TaxRecord,
  Transfer,
} from './types'
import type { DataSet } from '../lib/calc'

const SAMPLE_KEY = 'yordyan.includeSample'

interface Ctx {
  ready: boolean
  includeSample: boolean
  setIncludeSample: (b: boolean) => void
  settings: Settings
  profile: BusinessProfile | undefined
  data: DataSet
  orders: Order[]
  payments: Payment[]
  productionCosts: ProductionCost[]
  expenses: Expense[]
  suppliers: Supplier[]
  inventory: InventoryItem[]
  ownerTransactions: OwnerTransaction[]
  transfers: Transfer[]
  taxes: TaxRecord[]
}

const DataContext = createContext<Ctx | null>(null)

function visible<T extends { isSample?: boolean }>(rows: T[], includeSample: boolean): T[] {
  return includeSample ? rows : rows.filter((r) => !r.isSample)
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [includeSample, setIncludeSampleState] = useState<boolean>(
    () => localStorage.getItem(SAMPLE_KEY) === 'true',
  )

  useEffect(() => {
    ensureSettings()
  }, [])

  const settings = useLiveQuery(() => db.settings.get(1), [], undefined)
  const profile = useLiveQuery(() => db.profile.get(1), [], undefined)
  const allOrders = useLiveQuery(() => db.orders.toArray(), [], undefined)
  const allPayments = useLiveQuery(() => db.payments.toArray(), [], undefined)
  const allCosts = useLiveQuery(() => db.productionCosts.toArray(), [], undefined)
  const allExpenses = useLiveQuery(() => db.expenses.toArray(), [], undefined)
  const allSuppliers = useLiveQuery(() => db.suppliers.toArray(), [], undefined)
  const allInventory = useLiveQuery(() => db.inventory.toArray(), [], undefined)
  const allOwner = useLiveQuery(() => db.ownerTransactions.toArray(), [], undefined)
  const allTransfers = useLiveQuery(() => db.transfers.toArray(), [], undefined)
  const allTaxes = useLiveQuery(() => db.taxes.toArray(), [], undefined)

  const setIncludeSample = (b: boolean) => {
    localStorage.setItem(SAMPLE_KEY, String(b))
    setIncludeSampleState(b)
  }

  const ready =
    settings !== undefined &&
    allOrders !== undefined &&
    allPayments !== undefined &&
    allCosts !== undefined &&
    allExpenses !== undefined

  const value = useMemo<Ctx>(() => {
    const effSettings = settings ?? DEFAULT_SETTINGS
    const orders = visible(allOrders ?? [], includeSample)
    const payments = visible(allPayments ?? [], includeSample)
    const productionCosts = visible(allCosts ?? [], includeSample)
    const expenses = visible(allExpenses ?? [], includeSample)
    const ownerTransactions = visible(allOwner ?? [], includeSample)
    const transfers = visible(allTransfers ?? [], includeSample)

    return {
      ready,
      includeSample,
      setIncludeSample,
      settings: effSettings,
      profile,
      orders,
      payments,
      productionCosts,
      expenses,
      suppliers: visible(allSuppliers ?? [], includeSample),
      inventory: visible(allInventory ?? [], includeSample),
      ownerTransactions,
      transfers,
      taxes: visible(allTaxes ?? [], includeSample),
      data: { orders, payments, productionCosts, expenses, ownerTransactions, transfers, settings: effSettings },
    }
  }, [
    ready,
    includeSample,
    settings,
    profile,
    allOrders,
    allPayments,
    allCosts,
    allExpenses,
    allSuppliers,
    allInventory,
    allOwner,
    allTransfers,
    allTaxes,
  ])

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used inside DataProvider')
  return ctx
}
