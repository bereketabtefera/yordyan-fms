import { useMemo, useState } from 'react'
import { db } from '../db/db'
import { useData } from '../db/DataContext'
import type { Account, Payment, PaymentMethod, PaymentType } from '../db/types'
import { useI18n } from '../i18n/LanguageContext'
import { useOptions, labelOf } from '../lib/options'
import { effectivePaymentAmount, orderTotals } from '../lib/calc'
import { DateField } from '../components/DateField'
import { Button, Card, EmptyState, Field, Input, Modal, PageHeader, SampleBadge, Select, Stat, Table, TD, Textarea, TH } from '../components/ui'
import { currentMonthKey, formatDate, formatMoney, monthKey, monthLabel, num, todayISO } from '../lib/format'

interface Draft {
  id?: number
  orderId: string
  date: string
  amount: string
  type: PaymentType
  method: PaymentMethod
  account: Account
  note: string
  isSample?: boolean
}

function emptyDraft(orderId: string): Draft {
  return {
    orderId,
    date: todayISO(),
    amount: '',
    type: 'advance',
    method: 'cash',
    account: 'cash',
    note: '',
  }
}

export function Payments() {
  const { t, lang } = useI18n()
  const { orders, payments, productionCosts } = useData()
  const { method, account, paymentType } = useOptions()
  const [month, setMonth] = useState<string>('all')
  const [draft, setDraft] = useState<Draft | null>(null)

  const months = useMemo(() => {
    const set = new Set(payments.map((p) => monthKey(p.date)))
    set.add(currentMonthKey())
    return [...set].sort().reverse()
  }, [payments])

  const rows = useMemo(() => {
    return payments
      .filter((p) => (month === 'all' ? true : monthKey(p.date) === month))
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [payments, month])

  const totalIn = rows.reduce((s, p) => s + effectivePaymentAmount(p), 0)

  const orderOptions = useMemo(
    () => orders.slice().sort((a, b) => b.orderDate.localeCompare(a.orderDate)),
    [orders],
  )

  async function save() {
    if (!draft) return
    const order = orders.find((o) => o.id === Number(draft.orderId))
    const payload: Payment = {
      id: draft.id,
      orderId: Number(draft.orderId),
      orderNo: order?.orderNo ?? '',
      date: draft.date,
      amount: num(draft.amount),
      type: draft.type,
      method: draft.method,
      account: draft.account,
      note: draft.note,
      isSample: draft.isSample ?? false,
    }
    if (draft.id) await db.payments.put(payload)
    else await db.payments.add(payload)
    setDraft(null)
  }

  async function remove(id: number) {
    if (window.confirm(t('confirmDelete'))) await db.payments.delete(id)
  }

  function edit(p: Payment) {
    setDraft({
      id: p.id,
      orderId: String(p.orderId),
      date: p.date,
      amount: String(p.amount),
      type: p.type,
      method: p.method,
      account: p.account,
      note: p.note,
      isSample: p.isSample,
    })
  }

  const selectedOrder = draft ? orders.find((o) => o.id === Number(draft.orderId)) : undefined
  const selectedTotals = selectedOrder ? orderTotals(selectedOrder, payments, productionCosts) : undefined

  return (
    <div>
      <PageHeader
        title={t('pmt_title')}
        subtitle={t('pmt_note')}
        actions={
          <Button variant="primary" disabled={orders.length === 0} onClick={() => setDraft(emptyDraft(String(orderOptions[0]?.id ?? '')))}>
            + {t('newRecord')}
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Stat label={t('dash_cashCollected')} value={formatMoney(totalIn)} tone="green" />
        <Stat label={t('exp_expenseCount')} value={String(rows.length)} tone="slate" />
        <Stat label={t('dash_outstanding')} value={formatMoney(orders.filter((o) => o.deliveryStatus !== 'cancelled').reduce((s, o) => s + Math.max(0, orderTotals(o, payments, productionCosts).balance), 0))} tone="amber" />
      </div>

      <Card
        title={t('pmt_title')}
        actions={
          <Select value={month} onChange={(e) => setMonth(e.target.value)} className="py-1.5 text-xs">
            <option value="all">{t('all')}</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {monthLabel(m, lang)}
              </option>
            ))}
          </Select>
        }
      >
        {rows.length === 0 ? (
          <EmptyState>{t('noData')}</EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <TH>{t('date')}</TH>
                <TH>{t('pmt_order')}</TH>
                <TH>{t('pmt_type')}</TH>
                <TH>{t('method')}</TH>
                <TH right>{t('amount')}</TH>
                <TH></TH>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const o = orders.find((x) => x.id === p.orderId)
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <TD className="whitespace-nowrap">{formatDate(p.date, lang)}</TD>
                    <TD>
                      <div className="font-mono text-xs">{p.orderNo} {p.isSample && <SampleBadge />}</div>
                      <div className="text-xs text-slate-400">{o?.customerName}</div>
                    </TD>
                    <TD>{labelOf(paymentType, p.type)}</TD>
                    <TD>{labelOf(method, p.method)}</TD>
                    <TD right className={p.type === 'refund' ? 'text-red-600' : 'font-medium text-emerald-700'}>
                      {formatMoney(p.amount)}
                    </TD>
                    <TD right>
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => edit(p)}>
                          {t('edit')}
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => remove(p.id!)}>
                          {t('delete')}
                        </Button>
                      </div>
                    </TD>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.id ? t('edit') : t('newRecord')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDraft(null)}>
              {t('cancel')}
            </Button>
            <Button variant="primary" onClick={save} disabled={!draft?.orderId || !draft?.amount}>
              {t('save')}
            </Button>
          </>
        }
      >
        {draft && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('pmt_order')} required className="sm:col-span-2">
              <Select value={draft.orderId} onChange={(e) => setDraft({ ...draft, orderId: e.target.value })}>
                {orderOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNo} · {o.customerName} · {formatMoney(o.sellingPrice)}
                  </option>
                ))}
              </Select>
            </Field>
            {selectedTotals && (
              <div className="sm:col-span-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-500">
                {t('ord_price')}: {formatMoney(selectedOrder?.sellingPrice ?? 0)} · {t('ord_paid')}: {formatMoney(selectedTotals.paid)} ·{' '}
                {t('ord_balance')}: <span className="font-medium text-amber-700">{formatMoney(selectedTotals.balance)}</span>
              </div>
            )}
            <DateField label={t('date')} value={draft.date} onChange={(v) => setDraft({ ...draft, date: v })} required />
            <Field label={t('amount')} required>
              <Input type="number" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} placeholder="0" />
            </Field>
            <Field label={t('pmt_type')}>
              <Select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as PaymentType })}>
                {paymentType.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('method')}>
              <Select value={draft.method} onChange={(e) => setDraft({ ...draft, method: e.target.value as PaymentMethod })}>
                {method.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('cb_account')}>
              <Select value={draft.account} onChange={(e) => setDraft({ ...draft, account: e.target.value as Account })}>
                {account.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('note')} className="sm:col-span-2">
              <Textarea value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
            </Field>
            <div className="sm:col-span-2 rounded-lg bg-brand-50 p-2 text-xs text-brand-800">{t('pmt_note')}</div>
          </div>
        )}
      </Modal>
    </div>
  )
}
