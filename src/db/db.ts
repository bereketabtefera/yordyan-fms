import Dexie, { type Table } from 'dexie'
import type {
  BusinessProfile,
  ColorPalette,
  Design,
  Expense,
  InventoryItem,
  Order,
  OwnerTransaction,
  Payment,
  PatternSet,
  ProductionCost,
  Settings,
  Supplier,
  TaxRecord,
  Transfer,
} from './types'

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Shop rent',
  'Shopkeeper salary',
  'Electricity',
  'Water',
  'Internet & telephone',
  'Transport & delivery',
  'Packaging & supplies',
  'Cleaning & maintenance',
  'Marketing & photography',
  'Bank & transaction fees',
  'Business admin, license & accounting',
  'Equipment & tools',
  'Daily small expenses',
  'Other',
]

export const DEFAULT_SETTINGS: Settings = {
  id: 1,
  currency: 'ETB',
  openingCash: 0,
  openingBank: 0,
  openingMobile: 0,
  expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
  taxMode: 'profit',
  taxRate: 0,
  vatRate: 15,
  taxThresholdNote: '',
}

class FMSDatabase extends Dexie {
  profile!: Table<BusinessProfile, number>
  orders!: Table<Order, number>
  payments!: Table<Payment, number>
  productionCosts!: Table<ProductionCost, number>
  expenses!: Table<Expense, number>
  suppliers!: Table<Supplier, number>
  ownerTransactions!: Table<OwnerTransaction, number>
  inventory!: Table<InventoryItem, number>
  transfers!: Table<Transfer, number>
  taxes!: Table<TaxRecord, number>
  settings!: Table<Settings, number>
  designs!: Table<Design, number>
  colorPalettes!: Table<ColorPalette, number>
  patternSets!: Table<PatternSet, number>

  constructor() {
    super('yordyan-fms')
    this.version(1).stores({
      profile: 'id',
      orders: '++id, orderNo, orderDate, deliveryStatus, isSample',
      payments: '++id, orderId, orderNo, date, isSample',
      productionCosts: '++id, orderId, orderNo, date, category, paid, isSample',
      expenses: '++id, date, category, paid, isSample',
      suppliers: '++id, name, isSample',
      ownerTransactions: '++id, date, type, isSample',
      inventory: '++id, name, date, isSample',
      transfers: '++id, date, isSample',
      taxes: '++id, taxType, period, isSample',
      settings: 'id',
    })
    this.version(2).stores({
      designs: '++id, code, garmentType, orderId, isSample',
      colorPalettes: '++id, name, isSample',
      patternSets: '++id, designId, garmentType, isSample',
    })
  }
}

export const db = new FMSDatabase()

export async function ensureSettings() {
  const existing = await db.settings.get(1)
  if (!existing) {
    await db.settings.put(DEFAULT_SETTINGS)
    return DEFAULT_SETTINGS
  }
  return existing
}
