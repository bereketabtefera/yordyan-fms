import { useI18n } from '../i18n/LanguageContext'
import type { TKey } from '../i18n/strings'
import type {
  Account,
  DeliveryStatus,
  PaymentMethod,
  PaymentType,
  ProductionCategory,
} from '../db/types'

export interface Opt<T extends string> {
  value: T
  label: string
}

function toOpts<T extends string>(t: (k: TKey) => string, pairs: [T, TKey][]): Opt<T>[] {
  return pairs.map(([value, key]) => ({ value, label: t(key) }))
}

export function useOptions() {
  const { t } = useI18n()
  const method = toOpts<PaymentMethod>(t, [
    ['cash', 'pmt_method_cash'],
    ['bank', 'pmt_method_bank'],
    ['mobile', 'pmt_method_mobile'],
    ['other', 'pmt_method_other'],
  ])
  const account = toOpts<Account>(t, [
    ['cash', 'cb_acc_cash'],
    ['bank', 'cb_acc_bank'],
    ['mobile', 'cb_acc_mobile'],
  ])
  const delivery = toOpts<DeliveryStatus>(t, [
    ['open', 'ord_open'],
    ['in_production', 'ord_inProduction'],
    ['ready', 'ord_ready'],
    ['delivered', 'ord_delivered'],
    ['cancelled', 'ord_cancelled'],
  ])
  const paymentType = toOpts<PaymentType>(t, [
    ['advance', 'pmt_advance'],
    ['installment', 'pmt_installment'],
    ['final', 'pmt_final'],
    ['refund', 'pmt_refund'],
  ])
  const productionCat = toOpts<ProductionCategory>(t, [
    ['material', 'pc_cat_material'],
    ['tailor', 'pc_cat_tailor'],
    ['designer', 'pc_cat_designer'],
    ['accessory', 'pc_cat_accessory'],
    ['delivery', 'pc_cat_delivery'],
    ['packaging', 'pc_cat_packaging'],
    ['other', 'pc_cat_other'],
  ])
  return { method, account, delivery, paymentType, productionCat }
}

export function labelOf<T extends string>(opts: Opt<T>[], value: T): string {
  return opts.find((o) => o.value === value)?.label ?? value
}
