import { db } from '../db/db'
import { addMonths, currentMonthKey } from '../lib/format'
import type {
  Account,
  DeliveryStatus,
  Order,
  PaymentMethod,
  ProductionCategory,
} from '../db/types'

const S = true

interface SeedCost {
  day: number
  category: ProductionCategory
  description: string
  amount: number
  paid: boolean
  method: PaymentMethod
  account: Account
}

interface SeedPayment {
  day: number
  amount: number
  type: 'advance' | 'installment' | 'final'
  method: PaymentMethod
  account: Account
}

interface SeedOrder {
  orderNo: string
  customer: string
  contact: string
  monthOffset: number
  orderDay: number
  kind: 'custom' | 'ready'
  dressType: string
  design: string
  size: string
  fabric: string
  price: number
  expectedDay: number
  actualDay: number
  status: DeliveryStatus
  payments: SeedPayment[]
  costs: SeedCost[]
}

const ORDERS: SeedOrder[] = [
  {
    orderNo: 'ORD-SAMPLE-8001',
    customer: 'Hanna T. (sample)',
    contact: '09xx-111-111',
    monthOffset: -2,
    orderDay: 4,
    kind: 'custom',
    dressType: 'Habesha Kemis',
    design: 'Tibeb trim',
    size: 'M',
    fabric: 'Fetil',
    price: 12000,
    expectedDay: 20,
    actualDay: 18,
    status: 'delivered',
    payments: [
      { day: 4, amount: 5000, type: 'advance', method: 'cash', account: 'cash' },
      { day: 18, amount: 7000, type: 'final', method: 'mobile', account: 'mobile' },
    ],
    costs: [
      { day: 5, category: 'material', description: 'Fabric', amount: 3500, paid: true, method: 'cash', account: 'cash' },
      { day: 15, category: 'tailor', description: 'Tailor fee', amount: 2000, paid: true, method: 'cash', account: 'cash' },
    ],
  },
  {
    orderNo: 'ORD-SAMPLE-8002',
    customer: 'Selam A. (sample)',
    contact: '09xx-222-222',
    monthOffset: -1,
    orderDay: 6,
    kind: 'custom',
    dressType: 'Habesha Kemis',
    design: 'Golden border',
    size: 'S',
    fabric: 'Doro Wat',
    price: 15000,
    expectedDay: 24,
    actualDay: 22,
    status: 'delivered',
    payments: [
      { day: 6, amount: 6000, type: 'advance', method: 'bank', account: 'bank' },
      { day: 22, amount: 9000, type: 'final', method: 'bank', account: 'bank' },
    ],
    costs: [
      { day: 8, category: 'material', description: 'Fabric', amount: 4200, paid: true, method: 'bank', account: 'bank' },
      { day: 18, category: 'tailor', description: 'Tailor fee', amount: 2500, paid: true, method: 'cash', account: 'cash' },
      { day: 19, category: 'accessory', description: 'Trim & accessories', amount: 800, paid: true, method: 'cash', account: 'cash' },
    ],
  },
  {
    orderNo: 'ORD-SAMPLE-8003',
    customer: 'Meron K. (sample)',
    contact: '09xx-333-333',
    monthOffset: -1,
    orderDay: 14,
    kind: 'ready',
    dressType: 'Ready-made Kemis',
    design: 'Plain',
    size: 'L',
    fabric: 'Cotton',
    price: 4500,
    expectedDay: 15,
    actualDay: 15,
    status: 'delivered',
    payments: [{ day: 14, amount: 4500, type: 'final', method: 'cash', account: 'cash' }],
    costs: [
      { day: 14, category: 'material', description: 'Fabric & trim', amount: 1800, paid: true, method: 'cash', account: 'cash' },
      { day: 14, category: 'tailor', description: 'Tailor fee', amount: 900, paid: true, method: 'cash', account: 'cash' },
    ],
  },
  {
    orderNo: 'ORD-SAMPLE-9001',
    customer: 'Hanna T. (sample)',
    contact: '09xx-111-111',
    monthOffset: 0,
    orderDay: 3,
    kind: 'custom',
    dressType: 'Habesha Kemis',
    design: 'Tibeb trim',
    size: 'M',
    fabric: 'Fetil',
    price: 12000,
    expectedDay: 20,
    actualDay: 18,
    status: 'delivered',
    payments: [
      { day: 3, amount: 5000, type: 'advance', method: 'cash', account: 'cash' },
      { day: 18, amount: 7000, type: 'final', method: 'mobile', account: 'mobile' },
    ],
    costs: [
      { day: 5, category: 'material', description: 'Fabric', amount: 3500, paid: true, method: 'cash', account: 'cash' },
      { day: 15, category: 'tailor', description: 'Tailor fee', amount: 2000, paid: true, method: 'cash', account: 'cash' },
    ],
  },
  {
    orderNo: 'ORD-SAMPLE-9002',
    customer: 'Selam A. (sample)',
    contact: '09xx-222-222',
    monthOffset: 0,
    orderDay: 10,
    kind: 'custom',
    dressType: 'Habesha Kemis',
    design: 'Golden border',
    size: 'S',
    fabric: 'Doro Wat',
    price: 15000,
    expectedDay: 28,
    actualDay: 0,
    status: 'in_production',
    payments: [{ day: 10, amount: 6000, type: 'advance', method: 'bank', account: 'bank' }],
    costs: [
      { day: 12, category: 'material', description: 'Fabric', amount: 4200, paid: true, method: 'bank', account: 'bank' },
      { day: 20, category: 'tailor', description: 'Tailor fee (not yet paid)', amount: 2500, paid: false, method: 'cash', account: 'cash' },
    ],
  },
  {
    orderNo: 'ORD-SAMPLE-9003',
    customer: 'Beza M. (sample)',
    contact: '09xx-444-444',
    monthOffset: 0,
    orderDay: 16,
    kind: 'ready',
    dressType: 'Ready-made Kemis',
    design: 'Embroidered',
    size: 'M',
    fabric: 'Cotton',
    price: 5500,
    expectedDay: 17,
    actualDay: 17,
    status: 'ready',
    payments: [{ day: 16, amount: 2000, type: 'advance', method: 'cash', account: 'cash' }],
    costs: [{ day: 16, category: 'material', description: 'Fabric & trim', amount: 2200, paid: true, method: 'cash', account: 'cash' }],
  },
]

interface RecurringExpense {
  day: number
  amount: number
  category: string
  description: string
  method: PaymentMethod
  account: Account
  paid?: boolean
}

const MONTHLY_EXPENSES: RecurringExpense[] = [
  { day: 1, amount: 28000, category: 'Shop rent', description: 'Monthly shop rent', method: 'bank', account: 'bank' },
  { day: 1, amount: 5000, category: 'Shopkeeper salary', description: 'Rehima salary', method: 'cash', account: 'cash' },
  { day: 6, amount: 2000, category: 'Electricity', description: 'Electric bill', method: 'cash', account: 'cash' },
  { day: 7, amount: 900, category: 'Internet & telephone', description: 'Internet & phone', method: 'mobile', account: 'mobile' },
  { day: 12, amount: 1200, category: 'Transport & delivery', description: 'Deliveries', method: 'cash', account: 'cash' },
]

export async function seedSample() {
  const base = currentMonthKey()
  const day = (offset: number, d: number) => `${addMonths(base, offset)}-${String(d).padStart(2, '0')}`

  const supplierId = await db.suppliers.add({
    name: 'Meron Fabrics (example)',
    type: 'fabric supplier',
    phone: '09xx-000-000',
    note: 'Illustrative sample supplier',
    isSample: S,
  })
  const tailorId = await db.suppliers.add({
    name: 'Ato Tesfaye — tailor (example)',
    type: 'tailor',
    phone: '09xx-555-555',
    note: 'Illustrative sample tailor',
    isSample: S,
  })

  for (const o of ORDERS) {
    const order: Omit<Order, 'id'> = {
      orderNo: o.orderNo,
      customerName: o.customer,
      customerContact: o.contact,
      orderDate: day(o.monthOffset, o.orderDay),
      kind: o.kind,
      dressType: o.dressType,
      design: o.design,
      size: o.size,
      fabric: o.fabric,
      specs: 'Illustrative example order (sample data)',
      sellingPrice: o.price,
      expectedCompletion: day(o.monthOffset, o.expectedDay),
      actualCompletion: o.actualDay ? day(o.monthOffset, o.actualDay) : '',
      deliveryStatus: o.status,
      isSample: S,
      createdAt: new Date().toISOString(),
    }
    const orderId = (await db.orders.add(order as Order)) as number

    for (const p of o.payments) {
      await db.payments.add({
        orderId,
        orderNo: o.orderNo,
        date: day(o.monthOffset, p.day),
        amount: p.amount,
        type: p.type,
        method: p.method,
        account: p.account,
        note: `Sample ${p.type} payment`,
        isSample: S,
      })
    }

    for (const c of o.costs) {
      await db.productionCosts.add({
        orderId,
        orderNo: o.orderNo,
        date: day(o.monthOffset, c.day),
        category: c.category,
        description: c.description,
        amount: c.amount,
        paid: c.paid,
        paidDate: c.paid ? day(o.monthOffset, c.day) : '',
        method: c.method,
        account: c.account,
        supplierId: c.category === 'material' ? supplierId : c.category === 'tailor' ? tailorId : null,
        isSample: S,
      })
    }
  }

  for (const offset of [-2, -1, 0]) {
    for (const e of MONTHLY_EXPENSES) {
      await db.expenses.add({
        date: day(offset, e.day),
        amount: e.amount,
        category: e.category,
        description: `${e.description} (sample)`,
        paid: e.paid ?? true,
        paidDate: (e.paid ?? true) ? day(offset, e.day) : '',
        method: e.method,
        account: e.account,
        supplierId: null,
        recurring: true,
        isSample: S,
      })
    }
  }

  await db.expenses.bulkAdd([
    {
      date: day(0, 9),
      amount: 800,
      category: 'Marketing & photography',
      description: 'Photo shoot (sample)',
      paid: true,
      paidDate: day(0, 9),
      method: 'mobile',
      account: 'mobile',
      supplierId: null,
      recurring: false,
      isSample: S,
    },
    {
      date: day(0, 22),
      amount: 1500,
      category: 'Packaging & supplies',
      description: 'Bags & boxes (sample)',
      paid: true,
      paidDate: day(0, 22),
      method: 'cash',
      account: 'cash',
      supplierId: null,
      recurring: false,
      isSample: S,
    },
    {
      date: day(0, 25),
      amount: 3500,
      category: 'Equipment & tools',
      description: 'New scissors & tools (sample, unpaid)',
      paid: false,
      paidDate: '',
      method: 'cash',
      account: 'cash',
      supplierId: null,
      recurring: false,
      isSample: S,
    },
  ])

  await db.ownerTransactions.bulkAdd([
    { date: day(-2, 1), type: 'contribution', amount: 50000, account: 'bank', note: 'Starting capital (sample)', isSample: S },
    { date: day(0, 20), type: 'withdrawal', amount: 4000, account: 'cash', note: 'Personal use (sample)', isSample: S },
  ])

  await db.transfers.add({
    date: day(0, 11),
    from: 'bank',
    to: 'cash',
    amount: 5000,
    note: 'Cash withdrawal for the shop (sample)',
    isSample: S,
  })

  await db.colorPalettes.bulkAdd([
    {
      name: 'Classic red tilet (sample)',
      primary: '#f7f5ef',
      secondary: '#b91c1c',
      accents: ['#d4a017', '#111827'],
      note: 'Illustrative palette',
      isSample: S,
    },
    {
      name: 'Yellow & black tibeb (sample)',
      primary: '#f7f5ef',
      secondary: '#eab308',
      accents: ['#111827', '#b91c1c'],
      note: 'Illustrative palette',
      isSample: S,
    },
  ])

  await db.designs.bulkAdd([
    {
      code: 'DSN-SAMPLE-9001',
      name: 'Zuria Tibeb Kemis (sample)',
      nameAm: 'ዙሪያ ጥበብ ቀሚስ (ናሙና)',
      garmentType: 'kemis',
      silhouette: 'aline',
      neckline: 'v',
      sleeve: 'half',
      length: 'ankle',
      fabric: 'Shema (handwoven cotton)',
      tibebStyle: 'tibeb',
      tiletPlacement: 'zuria',
      baseColor: '#f7f5ef',
      tiletColors: ['#b91c1c', '#d4a017', '#15803d'],
      specs: 'Illustrative design example.',
      orderId: null,
      isSample: S,
      createdAt: new Date().toISOString(),
    },
    {
      code: 'DSN-SAMPLE-9002',
      name: "Men's Kaba vest (sample)",
      nameAm: 'የወንድ ካባ ቬስት (ናሙና)',
      garmentType: 'vest',
      silhouette: 'straight',
      neckline: 'v',
      sleeve: 'none',
      length: 'short',
      fabric: 'Cotton',
      tibebStyle: 'tilet',
      tiletPlacement: 'neckline',
      baseColor: '#f1f0ea',
      tiletColors: ['#111827', '#d4a017'],
      specs: 'Illustrative design example.',
      orderId: null,
      isSample: S,
      createdAt: new Date().toISOString(),
    },
  ])

  await db.patternSets.add({
    name: 'Kemis — size M (sample)',
    designId: null,
    garmentType: 'kemis',
    sizeMode: 'standard',
    sizeLabel: 'M',
    measurements: { bust: 88, waist: 70, hip: 94, shoulder: 12, backLength: 40, frontLength: 42, chestWidth: 16, backWidth: 17, neck: 36, armholeDepth: 21, sleeveLength: 58, bicep: 28, skirtLength: 100 },
    seamAllowance: 1.5,
    createdAt: new Date().toISOString(),
    isSample: S,
  })
}

export async function clearSample() {
  await db.orders.filter((r) => !!r.isSample).delete()
  await db.payments.filter((r) => !!r.isSample).delete()
  await db.productionCosts.filter((r) => !!r.isSample).delete()
  await db.expenses.filter((r) => !!r.isSample).delete()
  await db.suppliers.filter((r) => !!r.isSample).delete()
  await db.ownerTransactions.filter((r) => !!r.isSample).delete()
  await db.inventory.filter((r) => !!r.isSample).delete()
  await db.taxes.filter((r) => !!r.isSample).delete()
  await db.designs.filter((r) => !!r.isSample).delete()
  await db.colorPalettes.filter((r) => !!r.isSample).delete()
  await db.patternSets.filter((r) => !!r.isSample).delete()
}
