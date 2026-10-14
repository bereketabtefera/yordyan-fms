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

// ---- Design wing ----
export type GarmentType = 'kemis' | 'vest' | 'tshirt' | 'other'
export type Silhouette = 'fitted' | 'aline' | 'flare' | 'straight' | 'puff' | 'mermaid'
export type Neckline = 'round' | 'v' | 'square' | 'sweetheart' | 'boat' | 'high' | 'cross'
export type SleeveStyle = 'none' | 'short' | 'half' | 'long' | 'bell' | 'puff' | 'cap'
export type DressLength = 'short' | 'knee' | 'midi' | 'ankle' | 'floor'
export type TibebStyle = 'none' | 'tilet' | 'tibeb' | 'tilf'
export type TiletPlacement = 'zuria' | 'gemash' | 'full' | 'hem' | 'neckline' | 'sleeves'
export type SizeMode = 'standard' | 'custom'
export type MotifId =
  | 'stripe'
  | 'zigzag'
  | 'diamond'
  | 'chevron'
  | 'cross'
  | 'meskel'
  | 'wave'
  | 'lattice'
  | 'dots'
  | 'leaf'
  | 'lalibela'
  | 'teltele'

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
  designId?: ID | null
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

// ---- Design wing ----

export interface Design {
  id?: ID
  code: string
  name: string
  nameAm: string
  garmentType: GarmentType
  silhouette: Silhouette
  neckline: Neckline
  sleeve: SleeveStyle
  length: DressLength
  fabric: string
  tibebStyle: TibebStyle
  tiletPlacement: TiletPlacement
  baseColor: string
  tiletColors: string[]
  motif?: MotifId
  motifRepeat?: number
  mirrorMotif?: boolean
  bandWidth?: number
  stripeCount?: number
  tilkSvg?: string
  tilkViewBox?: string
  sketch?: string
  sketchColors?: string[]
  specs: string
  orderId: ID | null
  isSample?: boolean
  createdAt: string
}

export interface ColorPalette {
  id?: ID
  name: string
  primary: string
  secondary: string
  accents: string[]
  note: string
  isSample?: boolean
}

export type MeasurementKey =
  | 'bust'
  | 'underbust'
  | 'waist'
  | 'hip'
  | 'shoulder'
  | 'backLength'
  | 'frontLength'
  | 'chestWidth'
  | 'backWidth'
  | 'neck'
  | 'armholeDepth'
  | 'sleeveLength'
  | 'bicep'
  | 'skirtLength'
  | 'height'

export type Measurements = Partial<Record<MeasurementKey, number>>

export interface PatternSet {
  id?: ID
  designId: ID | null
  name: string
  garmentType: GarmentType
  sizeMode: SizeMode
  sizeLabel: string
  measurements: Measurements
  seamAllowance: number
  createdAt: string
  isSample?: boolean
}
