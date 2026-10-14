import { useMemo, useState } from 'react'
import { db } from '../db/db'
import { useData } from '../db/DataContext'
import type { DeliveryStatus, Order, OrderKind } from '../db/types'
import { useI18n } from '../i18n/LanguageContext'
import { useOptions, labelOf } from '../lib/options'
import { orderTotals } from '../lib/calc'
import { DateField } from '../components/DateField'
import { Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader, SampleBadge, Select, Stat, Table, TD, Textarea, TH } from '../components/ui'
import { currentMonthKey, formatDate, formatMoney, monthKey, monthLabel, num, pct, todayISO } from '../lib/format'

interface Draft {
  id?: number
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
  sellingPrice: string
  expectedCompletion: string
  actualCompletion: string
  deliveryStatus: DeliveryStatus
  isSample?: boolean
}

function nextOrderNo(existing: Order[]): string {
  const year = new Date().getFullYear()
  const nums = existing
    .map((o) => o.orderNo.match(/(\d+)$/))
    .filter(Boolean)
    .map((m) => Number(m![1]))
  const next = (nums.length ? Math.max(...nums) : 0) + 1
  return `ORD-${year}-${String(next).padStart(4, '0')}`
}

function emptyDraft(orderNo: string): Draft {
  return {
    orderNo,
    customerName: '',
    customerContact: '',
    orderDate: todayISO(),
    kind: 'custom',
    dressType: 'Habesha Kemis',
    design: '',
    size: '',
    fabric: '',
    specs: '',
    sellingPrice: '',
    expectedCompletion: '',
    actualCompletion: '',
    deliveryStatus: 'open',
  }
}

export function Orders() {
  const { t, lang } = useI18n()
  const { orders, payments, productionCosts } = useData()
  const { delivery } = useOptions()
  const [month, setMonth] = useState<string>('all')
  const [status, setStatus] = useState<string>('all')
  const [draft, setDraft] = useState<Draft | null>(null)

  const months = useMemo(() => {
    const set = new Set(orders.map((o) => monthKey(o.orderDate)))
    set.add(currentMonthKey())
    return [...set].sort().reverse()
  }, [orders])

  const rows = useMemo(() => {
    return orders
      .filter((o) => (month === 'all' ? true : monthKey(o.orderDate) === month))
      .filter((o) => (status === 'all' ? true : o.deliveryStatus === status))
      .sort((a, b) => b.orderDate.localeCompare(a.orderDate))
      .map((o) => ({ order: o, totals: orderTotals(o, payments, productionCosts) }))
  }, [orders, payments, productionCosts, month, status])

  const totals = rows.reduce(
    (acc, r) => {
      if (r.order.deliveryStatus !== 'cancelled') {
        acc.sales += r.order.sellingPrice
        acc.balance += Math.max(0, r.totals.balance)
        acc.profit += r.totals.profit ?? 0
      }
      return acc
    },
    { sales: 0, balance: 0, profit: 0 },
  )

  async function save() {
    if (!draft) return
    const payload: Order = {
      id: draft.id,
      orderNo: draft.orderNo.trim(),
      customerName: draft.customerName.trim(),
      customerContact: draft.customerContact,
      orderDate: draft.orderDate,
      kind: draft.kind,
      dressType: draft.dressType,
      design: draft.design,
      size: draft.size,
      fabric: draft.fabric,
      specs: draft.specs,
      sellingPrice: num(draft.sellingPrice),
      expectedCompletion: draft.expectedCompletion,
      actualCompletion: draft.actualCompletion,
      deliveryStatus: draft.deliveryStatus,
      isSample: draft.isSample ?? false,
      createdAt: new Date().toISOString(),
    }
    if (draft.id) await db.orders.put(payload)
    else await db.orders.add(payload)
    setDraft(null)
  }

  async function remove(id: number) {
    if (!window.confirm(t('confirmDelete'))) return
    const linked = await db.payments.where('orderId').equals(id).count()
    const linkedCosts = await db.productionCosts.where('orderId').equals(id).count()
    if (linked + linkedCosts > 0) {
      if (!window.confirm('This order has linked payments/production costs that will also be deleted. Continue?')) return
      await db.payments.where('orderId').equals(id).delete()
      await db.productionCosts.where('orderId').equals(id).delete()
    }
    await db.orders.delete(id)
  }

  function edit(o: Order) {
    setDraft({
      id: o.id,
      orderNo: o.orderNo,
      customerName: o.customerName,
      customerContact: o.customerContact,
      orderDate: o.orderDate,
      kind: o.kind,
      dressType: o.dressType,
      design: o.design,
      size: o.size,
      fabric: o.fabric,
      specs: o.specs,
      sellingPrice: String(o.sellingPrice),
      expectedCompletion: o.expectedCompletion,
      actualCompletion: o.actualCompletion,
      deliveryStatus: o.deliveryStatus,
      isSample: o.isSample,
    })
  }

  const statusBadge = (s: Order['deliveryStatus']) => {
    const tone = s === 'delivered' ? 'green' : s === 'ready' ? 'blue' : s === 'cancelled' ? 'red' : 'amber'
    return <Badge tone={tone as 'green' | 'blue' | 'red' | 'amber'}>{labelOf(delivery, s)}</Badge>
  }

  return (
    <div>
      <PageHeader
        title={t('ord_title')}
        actions={
          <Button variant="primary" onClick={() => setDraft(emptyDraft(nextOrderNo(orders)))}>
            + {t('newRecord')}
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Stat label={t('dash_totalSales')} value={formatMoney(totals.sales)} tone="green" />
        <Stat label={t('dash_outstanding')} value={formatMoney(totals.balance)} tone="amber" />
        <Stat label={t('ord_profit')} value={formatMoney(totals.profit)} tone="blue" />
      </div>

      <Card
        title={t('ord_title')}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={month} onChange={(e) => setMonth(e.target.value)} className="py-1.5 text-xs">
              <option value="all">{t('all')}</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {monthLabel(m, lang)}
                </option>
              ))}
            </Select>
            <Select value={status} onChange={(e) => setStatus(e.target.value)} className="py-1.5 text-xs">
              <option value="all">{t('all')}</option>
              {delivery.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </Select>
          </div>
        }
      >
        {rows.length === 0 ? (
          <EmptyState>{t('noData')}</EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <TH>{t('ord_orderNo')}</TH>
                <TH>{t('ord_customer')}</TH>
                <TH>{t('ord_orderDate')}</TH>
                <TH right>{t('ord_price')}</TH>
                <TH right>{t('ord_paid')}</TH>
                <TH right>{t('ord_balance')}</TH>
                <TH>{t('ord_delivery')}</TH>
                <TH></TH>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ order: o, totals: tt }) => (
                <tr key={o.id} className="hover:bg-slate-50">
                  <TD className="whitespace-nowrap font-mono text-xs">
                    {o.orderNo} {o.isSample && <SampleBadge />}
                  </TD>
                  <TD>
                    <div className="text-slate-800">{o.customerName || '—'}</div>
                    <div className="text-xs text-slate-400">{o.customerContact}</div>
                  </TD>
                  <TD className="whitespace-nowrap">{formatDate(o.orderDate, lang)}</TD>
                  <TD right>{formatMoney(o.sellingPrice)}</TD>
                  <TD right className="text-emerald-700">{formatMoney(tt.paid)}</TD>
                  <TD right className={tt.balance > 0 ? 'font-medium text-amber-700' : 'text-slate-400'}>
                    {formatMoney(tt.balance)}
                  </TD>
                  <TD>{statusBadge(o.deliveryStatus)}</TD>
                  <TD right>
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => edit(o)}>
                        {t('edit')}
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-600" onClick={() => remove(o.id!)}>
                        {t('delete')}
                      </Button>
                    </div>
                  </TD>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal
        open={!!draft}
        onClose={() => setDraft(null)}
        wide
        title={draft?.id ? `${t('edit')} · ${draft.orderNo}` : t('newRecord')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDraft(null)}>
              {t('cancel')}
            </Button>
            <Button variant="primary" onClick={save} disabled={!draft?.orderNo || !draft?.customerName}>
              {t('save')}
            </Button>
          </>
        }
      >
        {draft && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('ord_orderNo')} required>
              <Input value={draft.orderNo} onChange={(e) => setDraft({ ...draft, orderNo: e.target.value })} />
            </Field>
            <Field label={t('ord_customer')} required>
              <Input value={draft.customerName} onChange={(e) => setDraft({ ...draft, customerName: e.target.value })} />
            </Field>
            <Field label={t('ord_contact')}>
              <Input value={draft.customerContact} onChange={(e) => setDraft({ ...draft, customerContact: e.target.value })} />
            </Field>
            <DateField label={t('ord_orderDate')} value={draft.orderDate} onChange={(v) => setDraft({ ...draft, orderDate: v })} required />
            <Field label={t('ord_dressType')}>
              <Input value={draft.dressType} onChange={(e) => setDraft({ ...draft, dressType: e.target.value })} />
            </Field>
            <Field label={t('ord_size')}>
              <Input value={draft.size} onChange={(e) => setDraft({ ...draft, size: e.target.value })} />
            </Field>
            <Field label={t('ord_fabric')}>
              <Input value={draft.fabric} onChange={(e) => setDraft({ ...draft, fabric: e.target.value })} />
            </Field>
            <Field label={t('ord_price')} required>
              <Input type="number" value={draft.sellingPrice} onChange={(e) => setDraft({ ...draft, sellingPrice: e.target.value })} placeholder="0" />
            </Field>
            <Field label={t('ord_expected')}>
              <Input type="date" value={draft.expectedCompletion} onChange={(e) => setDraft({ ...draft, expectedCompletion: e.target.value })} />
            </Field>
            <Field label={t('ord_actual')}>
              <Input type="date" value={draft.actualCompletion} onChange={(e) => setDraft({ ...draft, actualCompletion: e.target.value })} />
            </Field>
            <Field label={t('ord_delivery')}>
              <Select value={draft.deliveryStatus} onChange={(e) => setDraft({ ...draft, deliveryStatus: e.target.value as DeliveryStatus })}>
                {delivery.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('ord_type_ready') + ' / ' + t('ord_type_custom')}>
              <Select value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as OrderKind })}>
                <option value="custom">{t('ord_type_custom')}</option>
                <option value="ready">{t('ord_type_ready')}</option>
              </Select>
            </Field>
            <Field label={t('ord_specs')} className="sm:col-span-2">
              <Textarea value={draft.specs} onChange={(e) => setDraft({ ...draft, specs: e.target.value })} />
            </Field>
            {draft.id && (
              <p className="sm:col-span-2 text-xs text-slate-400">
                {t('ord_directCost')}: {formatMoney(orderTotals({ ...(draft as unknown as Order), id: draft.id }, payments, productionCosts).directCost)} ·{' '}
                {t('ord_margin')}: {pct(orderTotals({ ...(draft as unknown as Order), id: draft.id, sellingPrice: num(draft.sellingPrice) }, payments, productionCosts).margin)}
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
