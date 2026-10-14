export type ID = number

export type PaymentMethod = 'cash' | 'bank' | 'mobile' | 'other'
export type Account = 'cash' | 'bank' | 'mobile'
export type DeliveryStatus = 'open' | 'in_production' | 'ready' | 'delivered' | 'cancelled'
export type OrderKind = 'custom' | 'ready'
export type PaymentType = 'advance' | 'installment' | 'final' | 'refund'
export type ProductionCategory =
  | 'material'
  | 'tailor'
  | 'designer'
  | 'accessory'
  | 'delivery'
  | 'packaging'
  | 'other'
export type OwnerTxnType = 'contribution' | 'withdrawal'
export type LegalForm = 'sole' | 'partnership' | 'other'
export type BusinessType = 'ready' | 'custom' | 'both'
export type TaxMode = 'profit' | 'turnover'

export interface BusinessProfile {
  id: ID
  name: string
  startDate: string
  legalForm: LegalForm | ''
  taxCategory: string
  vatRegistered: boolean | null
  monthlySalesEstimate: number | null
  monthlyOrdersEstimate: number | null
  businessType: BusinessType | ''
  mixesPersonalMoney: boolean | null
  hasDebts: boolean | null
  debtsDetail: string
  shopkeeperName: string
  shopkeeperPay: number | null
  updatedAt: string
}

export interface Order {
  id?: ID
  orderNo: string
  customerName: string
  customerContact: string
  orderDate: string
  kind: OrderKind
  dressType: string
  design: string
  size: string
  fabric: string
  specs: string
  sellingPrice: number
  expectedCompletion: string
  actualCompletion: string
  deliveryStatus: DeliveryStatus
  isSample?: boolean
  createdAt: string
}

export interface Payment {
  id?: ID
  orderId: ID
  orderNo: string
  date: string
  amount: number
  type: PaymentType
  method: PaymentMethod
  account: Account
  note: string
  isSample?: boolean
}

export interface ProductionCost {
  id?: ID
  orderId: ID
  orderNo: string
  date: string
  category: ProductionCategory
  description: string
  amount: number
  paid: boolean
  paidDate: string
  method: PaymentMethod
  account: Account
  supplierId: ID | null
  isSample?: boolean
}

export interface Expense {
  id?: ID
  date: string
  amount: number
  category: string
  description: string
  paid: boolean
  paidDate: string
  method: PaymentMethod
  account: Account
  supplierId: ID | null
  recurring: boolean
  isSample?: boolean
}

export interface Supplier {
  id?: ID
  name: string
  type: string
  phone: string
  note: string
  isSample?: boolean
}

export interface OwnerTransaction {
  id?: ID
  date: string
  type: OwnerTxnType
  amount: number
  account: Account
  note: string
  isSample?: boolean
}

export interface InventoryItem {
  id?: ID
  name: string
  unit: string
  qtyPurchased: number
  unitCost: number
  qtyUsed: number
  qtySold: number
  qtyWasted: number
  supplierId: ID | null
  date: string
  cost: number
  note: string
  isSample?: boolean
}

export interface Transfer {
  id?: ID
  date: string
  from: Account
  to: Account
  amount: number
  note: string
  isSample?: boolean
}

export interface TaxRecord {
  id?: ID
  taxType: string
  period: string
  estimated: number
  paid: number
  paidDate: string
  deadline: string
  note: string
  isSample?: boolean
}

export interface Settings {
  id: number
  currency: string
  openingCash: number
  openingBank: number
  openingMobile: number
  expenseCategories: string[]
  taxMode: TaxMode
  taxRate: number
  vatRate: number
  taxThresholdNote: string
}
