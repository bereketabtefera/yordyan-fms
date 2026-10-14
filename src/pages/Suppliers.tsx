import { useMemo, useState } from 'react'
import { db } from '../db/db'
import { useData } from '../db/DataContext'
import type { Supplier } from '../db/types'
import { useI18n } from '../i18n/LanguageContext'
import { useOptions, labelOf } from '../lib/options'
import { payables } from '../lib/calc'
import { Button, Card, EmptyState, Field, Input, Modal, PageHeader, SampleBadge, Stat, Table, TD, Textarea, TH } from '../components/ui'
import { formatDate, formatMoney, todayISO } from '../lib/format'

export function Suppliers() {
  const { t, lang } = useI18n()
  const { data, suppliers } = useData()
  const { productionCat } = useOptions()
  const [draft, setDraft] = useState<Partial<Supplier> | null>(null)

  const payableRows = useMemo(() => payables(data), [data])
  const totalOwed = payableRows.reduce((s, r) => s + r.amount, 0)
  const supplierName = (id: number | null) => suppliers.find((s) => s.id === id)?.name ?? '—'

  async function save() {
    if (!draft || !draft.name) return
    const payload: Supplier = {
      id: draft.id,
      name: draft.name,
      type: draft.type ?? '',
      phone: draft.phone ?? '',
      note: draft.note ?? '',
      isSample: draft.isSample ?? false,
    }
    if (draft.id) await db.suppliers.put(payload)
    else await db.suppliers.add(payload)
    setDraft(null)
  }

  async function markPaid(row: (typeof payableRows)[number]) {
    const today = todayISO()
    if (row.source === 'production') {
      await db.productionCosts.update(row.id, { paid: true, paidDate: today })
    } else {
      await db.expenses.update(row.id, { paid: true, paidDate: today })
    }
  }

  return (
    <div>
      <PageHeader
        title={t('sup_title')}
        actions={
          <Button variant="primary" onClick={() => setDraft({})}>
            + {t('newRecord')}
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Stat label={t('sup_owed')} value={formatMoney(totalOwed)} tone="amber" />
        <Stat label={t('exp_expenseCount')} value={String(payableRows.length)} tone="slate" />
        <Stat label={t('sup_title')} value={String(suppliers.length)} tone="blue" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card title={t('sup_owed')} subtitle={t('cb_transfers')}>
          {payableRows.length === 0 ? (
            <EmptyState>{t('noData')}</EmptyState>
          ) : (
            <Table>
              <thead>
                <tr>
                  <TH>{t('date')}</TH>
                  <TH>{t('exp_supplier')}</TH>
                  <TH>{t('description')}</TH>
                  <TH right>{t('amount')}</TH>
                  <TH></TH>
                </tr>
              </thead>
              <tbody>
                {payableRows.map((r) => (
                  <tr key={`${r.source}-${r.id}`} className="hover:bg-slate-50">
                    <TD className="whitespace-nowrap">{formatDate(r.date, lang)}</TD>
                    <TD>{supplierName(r.supplierId)}</TD>
                    <TD className="text-slate-500">
                      {r.label} · {r.source === 'production' ? labelOf(productionCat, r.category as never) : r.category}
                    </TD>
                    <TD right className="font-medium text-amber-700">{formatMoney(r.amount)}</TD>
                    <TD right>
                      <Button size="sm" onClick={() => markPaid(r)}>
                        {t('exp_paid')}
                      </Button>
                    </TD>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <Card title={t('sup_title')}>
          <ul className="space-y-1">
            {suppliers.map((s) => (
              <li key={s.id} className="flex items-center justify-between border-b border-slate-100 py-2 text-sm">
                <div>
                  <div className="text-slate-700">
                    {s.name} {s.isSample && <SampleBadge />}
                  </div>
                  <div className="text-xs text-slate-400">
                    {s.type} {s.phone && `· ${s.phone}`}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setDraft(s)}>
                    {t('edit')}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-600" onClick={() => db.suppliers.delete(s.id!)}>
                    {t('delete')}
                  </Button>
                </div>
              </li>
            ))}
            {suppliers.length === 0 && <li className="py-2 text-xs text-slate-400">{t('noData')}</li>}
          </ul>
        </Card>
      </div>

      <Modal
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.id ? t('edit') : t('newRecord')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDraft(null)}>
              {t('cancel')}
            </Button>
            <Button variant="primary" onClick={save} disabled={!draft?.name}>
              {t('save')}
            </Button>
          </>
        }
      >
        {draft && (
          <div className="grid gap-3">
            <Field label={t('name')} required>
              <Input value={draft.name ?? ''} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </Field>
            <Field label={t('category')}>
              <Input value={draft.type ?? ''} onChange={(e) => setDraft({ ...draft, type: e.target.value })} placeholder="tailor / supplier / designer" />
            </Field>
            <Field label={t('phone')}>
              <Input value={draft.phone ?? ''} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
            </Field>
            <Field label={t('note')}>
              <Textarea value={draft.note ?? ''} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
            </Field>
          </div>
        )}
      </Modal>
    </div>
  )
}
