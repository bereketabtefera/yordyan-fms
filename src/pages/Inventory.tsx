import { useMemo, useState } from 'react'
import { db } from '../db/db'
import { useData } from '../db/DataContext'
import type { InventoryItem } from '../db/types'
import { useI18n } from '../i18n/LanguageContext'
import { DateField } from '../components/DateField'
import { Button, Card, EmptyState, Field, Input, Modal, PageHeader, SampleBadge, Select, Stat, Table, TD, Textarea, TH } from '../components/ui'
import { formatMoney, num, todayISO } from '../lib/format'

interface Draft {
  id?: number
  name: string
  unit: string
  qtyPurchased: string
  unitCost: string
  qtyUsed: string
  qtySold: string
  qtyWasted: string
  supplierId: string
  date: string
  note: string
  isSample?: boolean
}

function emptyDraft(): Draft {
  return {
    name: '',
    unit: 'metre',
    qtyPurchased: '',
    unitCost: '',
    qtyUsed: '',
    qtySold: '',
    qtyWasted: '',
    supplierId: '',
    date: todayISO(),
    note: '',
  }
}

function remaining(it: Pick<InventoryItem, 'qtyPurchased' | 'qtyUsed' | 'qtySold' | 'qtyWasted'>) {
  return it.qtyPurchased - it.qtyUsed - it.qtySold - it.qtyWasted
}

export function Inventory() {
  const { t } = useI18n()
  const { inventory, suppliers } = useData()
  const [draft, setDraft] = useState<Draft | null>(null)

  const totalValue = useMemo(
    () => inventory.reduce((s, it) => s + Math.max(0, remaining(it)) * it.unitCost, 0),
    [inventory],
  )

  async function save() {
    if (!draft || !draft.name) return
    const qp = num(draft.qtyPurchased)
    const uc = num(draft.unitCost)
    const payload: InventoryItem = {
      id: draft.id,
      name: draft.name,
      unit: draft.unit,
      qtyPurchased: qp,
      unitCost: uc,
      qtyUsed: num(draft.qtyUsed),
      qtySold: num(draft.qtySold),
      qtyWasted: num(draft.qtyWasted),
      supplierId: draft.supplierId ? Number(draft.supplierId) : null,
      date: draft.date,
      cost: qp * uc,
      note: draft.note,
      isSample: draft.isSample ?? false,
    }
    if (draft.id) await db.inventory.put(payload)
    else await db.inventory.add(payload)
    setDraft(null)
  }

  function edit(it: InventoryItem) {
    setDraft({
      id: it.id,
      name: it.name,
      unit: it.unit,
      qtyPurchased: String(it.qtyPurchased),
      unitCost: String(it.unitCost),
      qtyUsed: String(it.qtyUsed),
      qtySold: String(it.qtySold),
      qtyWasted: String(it.qtyWasted),
      supplierId: it.supplierId ? String(it.supplierId) : '',
      date: it.date,
      note: it.note,
      isSample: it.isSample,
    })
  }

  return (
    <div>
      <PageHeader
        title={t('inv_title')}
        actions={
          <Button variant="primary" onClick={() => setDraft(emptyDraft())}>
            + {t('newRecord')}
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Stat label={t('inv_title')} value={String(inventory.length)} tone="blue" />
        <Stat label={t('inv_remaining') + ' ' + t('inv_cost')} value={formatMoney(totalValue)} tone="green" />
      </div>

      <Card title={t('inv_title')} subtitle={t('inv_remaining')}>
        {inventory.length === 0 ? (
          <EmptyState>{t('noData')}</EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <TH>{t('inv_item')}</TH>
                <TH right>{t('inv_qtyPurchased')}</TH>
                <TH right>{t('inv_cost')}</TH>
                <TH right>{t('inv_qtyUsed')}</TH>
                <TH right>{t('inv_qtySold')}</TH>
                <TH right>{t('inv_wasted')}</TH>
                <TH right>{t('inv_remaining')}</TH>
                <TH></TH>
              </tr>
            </thead>
            <tbody>
              {inventory.map((it) => (
                <tr key={it.id} className="hover:bg-slate-50">
                  <TD>
                    {it.name} {it.isSample && <SampleBadge />}
                    <div className="text-xs text-slate-400">{it.unit}</div>
                  </TD>
                  <TD right>{it.qtyPurchased}</TD>
                  <TD right>{formatMoney(it.cost)}</TD>
                  <TD right>{it.qtyUsed}</TD>
                  <TD right>{it.qtySold}</TD>
                  <TD right>{it.qtyWasted}</TD>
                  <TD right className="font-medium">{remaining(it)}</TD>
                  <TD right>
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => edit(it)}>
                        {t('edit')}
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-600" onClick={() => db.inventory.delete(it.id!)}>
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
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label={t('inv_item')} required className="sm:col-span-2">
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </Field>
            <Field label={t('inv_unit')}>
              <Input value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value })} />
            </Field>
            <Field label={t('inv_qtyPurchased')}>
              <Input type="number" value={draft.qtyPurchased} onChange={(e) => setDraft({ ...draft, qtyPurchased: e.target.value })} />
            </Field>
            <Field label={t('inv_cost') + ' / ' + t('inv_unit')}>
              <Input type="number" value={draft.unitCost} onChange={(e) => setDraft({ ...draft, unitCost: e.target.value })} />
            </Field>
            <Field label={t('inv_qtyUsed')}>
              <Input type="number" value={draft.qtyUsed} onChange={(e) => setDraft({ ...draft, qtyUsed: e.target.value })} />
            </Field>
            <Field label={t('inv_qtySold')}>
              <Input type="number" value={draft.qtySold} onChange={(e) => setDraft({ ...draft, qtySold: e.target.value })} />
            </Field>
            <Field label={t('inv_wasted')}>
              <Input type="number" value={draft.qtyWasted} onChange={(e) => setDraft({ ...draft, qtyWasted: e.target.value })} />
            </Field>
            <Field label={t('inv_supplier')}>
              <Select value={draft.supplierId} onChange={(e) => setDraft({ ...draft, supplierId: e.target.value })}>
                <option value="">{t('none')}</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            <DateField label={t('date')} value={draft.date} onChange={(v) => setDraft({ ...draft, date: v })} />
            <Field label={t('note')} className="sm:col-span-3">
              <Textarea value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
            </Field>
          </div>
        )}
      </Modal>
    </div>
  )
}
