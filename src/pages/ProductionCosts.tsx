import { useMemo, useState } from 'react'
import { db } from '../db/db'
import { useData } from '../db/DataContext'
import type { Account, PaymentMethod, ProductionCategory, ProductionCost } from '../db/types'
import { useI18n } from '../i18n/LanguageContext'
import { useOptions, labelOf } from '../lib/options'
import { DateField } from '../components/DateField'
import { Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader, SampleBadge, Select, Stat, Table, TD, TH } from '../components/ui'
import { currentMonthKey, formatDate, formatMoney, monthKey, monthLabel, num, todayISO } from '../lib/format'

interface Draft {
  id?: number
  orderId: string
  date: string
  category: ProductionCategory
  description: string
  amount: string
  paid: boolean
  paidDate: string
  method: PaymentMethod
  account: Account
  supplierId: string
  isSample?: boolean
}

function emptyDraft(orderId: string): Draft {
  return {
    orderId,
    date: todayISO(),
    category: 'material',
    description: '',
    amount: '',
    paid: false,
    paidDate: todayISO(),
    method: 'cash',
    account: 'cash',
    supplierId: '',
  }
}

export function ProductionCosts() {
  const { t, lang } = useI18n()
  const { orders, productionCosts, suppliers } = useData()
  const { method, account, productionCat } = useOptions()
  const [month, setMonth] = useState<string>('all')
  const [draft, setDraft] = useState<Draft | null>(null)

  const months = useMemo(() => {
    const set = new Set(productionCosts.map((c) => monthKey(c.date)))
    set.add(currentMonthKey())
    return [...set].sort().reverse()
  }, [productionCosts])

  const rows = useMemo(
    () =>
      productionCosts
        .filter((c) => (month === 'all' ? true : monthKey(c.date) === month))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [productionCosts, month],
  )

  const total = rows.reduce((s, c) => s + c.amount, 0)
  const unpaid = rows.filter((c) => !c.paid).reduce((s, c) => s + c.amount, 0)

  const orderOptions = useMemo(() => orders.slice().sort((a, b) => b.orderDate.localeCompare(a.orderDate)), [orders])

  async function save() {
    if (!draft) return
    const order = orders.find((o) => o.id === Number(draft.orderId))
    const payload: ProductionCost = {
      id: draft.id,
      orderId: Number(draft.orderId),
      orderNo: order?.orderNo ?? '',
      date: draft.date,
      category: draft.category,
      description: draft.description,
      amount: num(draft.amount),
      paid: draft.paid,
      paidDate: draft.paid ? draft.paidDate || draft.date : '',
      method: draft.method,
      account: draft.account,
      supplierId: draft.supplierId ? Number(draft.supplierId) : null,
      isSample: draft.isSample ?? false,
    }
    if (draft.id) await db.productionCosts.put(payload)
    else await db.productionCosts.add(payload)
    setDraft(null)
  }

  async function remove(id: number) {
    if (window.confirm(t('confirmDelete'))) await db.productionCosts.delete(id)
  }

  function edit(c: ProductionCost) {
    setDraft({
      id: c.id,
      orderId: String(c.orderId),
      date: c.date,
      category: c.category,
      description: c.description,
      amount: String(c.amount),
      paid: c.paid,
      paidDate: c.paidDate,
      method: c.method,
      account: c.account,
      supplierId: c.supplierId ? String(c.supplierId) : '',
      isSample: c.isSample,
    })
  }

  return (
    <div>
      <PageHeader
        title={t('pc_title')}
        actions={
          <Button variant="primary" disabled={orders.length === 0} onClick={() => setDraft(emptyDraft(String(orderOptions[0]?.id ?? '')))}>
            + {t('newRecord')}
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Stat label={t('dash_directCosts')} value={formatMoney(total)} tone="blue" />
        <Stat label={t('exp_unpaid')} value={formatMoney(unpaid)} tone="amber" />
        <Stat label={t('exp_expenseCount')} value={String(rows.length)} tone="slate" />
      </div>

      {orders.length === 0 && (
        <div className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
          {t('ord_title')} — {t('noData')}
        </div>
      )}

      <Card
        title={t('pc_title')}
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
                <TH>{t('category')}</TH>
                <TH>{t('description')}</TH>
                <TH>{t('pc_paid')}</TH>
                <TH right>{t('amount')}</TH>
                <TH></TH>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <TD className="whitespace-nowrap">{formatDate(c.date, lang)}</TD>
                  <TD className="font-mono text-xs">{c.orderNo} {c.isSample && <SampleBadge />}</TD>
                  <TD>{labelOf(productionCat, c.category)}</TD>
                  <TD className="text-slate-500">{c.description || '—'}</TD>
                  <TD>{c.paid ? <Badge tone="green">{t('exp_paid')}</Badge> : <Badge tone="amber">{t('exp_unpaid')}</Badge>}</TD>
                  <TD right className="font-medium">{formatMoney(c.amount)}</TD>
                  <TD right>
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => edit(c)}>
                        {t('edit')}
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-600" onClick={() => remove(c.id!)}>
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
            <Field label={t('pc_linkedTo')} required className="sm:col-span-2">
              <Select value={draft.orderId} onChange={(e) => setDraft({ ...draft, orderId: e.target.value })}>
                {orderOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNo} · {o.customerName}
                  </option>
                ))}
              </Select>
            </Field>
            <DateField label={t('date')} value={draft.date} onChange={(v) => setDraft({ ...draft, date: v })} required />
            <Field label={t('category')}>
              <Select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value as ProductionCategory })}>
                {productionCat.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('description')} className="sm:col-span-2">
              <Input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </Field>
            <Field label={t('amount')} required>
              <Input type="number" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} placeholder="0" />
            </Field>
            <Field label={t('exp_supplier')} hint={t('optional')}>
              <Select value={draft.supplierId} onChange={(e) => setDraft({ ...draft, supplierId: e.target.value })}>
                <option value="">{t('none')}</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('pc_paid')}>
              <Select value={draft.paid ? 'yes' : 'no'} onChange={(e) => setDraft({ ...draft, paid: e.target.value === 'yes' })}>
                <option value="yes">{t('exp_paid')}</option>
                <option value="no">{t('exp_unpaid')}</option>
              </Select>
            </Field>
            {draft.paid && (
              <>
                <DateField label={t('tax_paidDate')} value={draft.paidDate} onChange={(v) => setDraft({ ...draft, paidDate: v })} />
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
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
