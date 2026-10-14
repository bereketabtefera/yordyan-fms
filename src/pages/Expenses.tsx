import { useMemo, useState } from 'react'
import { db } from '../db/db'
import { useData } from '../db/DataContext'
import type { Expense, PaymentMethod, Account } from '../db/types'
import { useI18n } from '../i18n/LanguageContext'
import { useOptions } from '../lib/options'
import { DateField } from '../components/DateField'
import { Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader, SampleBadge, Select, Stat, Table, TD, Textarea, TH } from '../components/ui'
import { formatDate, formatMoney, currentMonthKey, monthKey, monthLabel, num, todayISO } from '../lib/format'

interface Draft {
  id?: number
  date: string
  amount: string
  category: string
  description: string
  paid: boolean
  paidDate: string
  method: PaymentMethod
  account: Account
  supplierId: string
  recurring: boolean
  isSample?: boolean
}

function emptyDraft(category: string): Draft {
  return {
    date: todayISO(),
    amount: '',
    category,
    description: '',
    paid: true,
    paidDate: todayISO(),
    method: 'cash',
    account: 'cash',
    supplierId: '',
    recurring: false,
  }
}

export function Expenses() {
  const { t, lang } = useI18n()
  const { expenses, suppliers, settings, includeSample } = useData()
  const { method, account } = useOptions()
  const [month, setMonth] = useState<string>('all')
  const [draft, setDraft] = useState<Draft | null>(null)
  const [search, setSearch] = useState('')

  const months = useMemo(() => {
    const set = new Set(expenses.map((e) => monthKey(e.date)))
    set.add(currentMonthKey())
    return [...set].sort().reverse()
  }, [expenses])

  const filtered = useMemo(() => {
    return expenses
      .filter((e) => (month === 'all' ? true : monthKey(e.date) === month))
      .filter((e) =>
        search
          ? (e.category + ' ' + e.description).toLowerCase().includes(search.toLowerCase())
          : true,
      )
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [expenses, month, search])

  const total = filtered.reduce((s, e) => s + e.amount, 0)
  const unpaid = filtered.filter((e) => !e.paid).reduce((s, e) => s + e.amount, 0)

  const byCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of filtered) map.set(e.category, (map.get(e.category) ?? 0) + e.amount)
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [filtered])

  const recurringTemplates = ['Shop rent', 'Shopkeeper salary', 'Electricity', 'Internet & telephone']

  async function save() {
    if (!draft) return
    const payload: Expense = {
      id: draft.id,
      date: draft.date,
      amount: num(draft.amount),
      category: draft.category,
      description: draft.description,
      paid: draft.paid,
      paidDate: draft.paid ? draft.paidDate || draft.date : '',
      method: draft.method,
      account: draft.account,
      supplierId: draft.supplierId ? Number(draft.supplierId) : null,
      recurring: draft.recurring,
      isSample: draft.isSample ?? false,
    }
    if (draft.id) await db.expenses.put(payload)
    else await db.expenses.add(payload)
    setDraft(null)
  }

  async function remove(id: number) {
    if (window.confirm(t('confirmDelete'))) await db.expenses.delete(id)
  }

  function edit(e: Expense) {
    setDraft({
      id: e.id,
      date: e.date,
      amount: String(e.amount),
      category: e.category,
      description: e.description,
      paid: e.paid,
      paidDate: e.paidDate,
      method: e.method,
      account: e.account,
      supplierId: e.supplierId ? String(e.supplierId) : '',
      recurring: e.recurring,
      isSample: e.isSample,
    })
  }

  return (
    <div>
      <PageHeader
        title={t('exp_title')}
        subtitle={t('exp_subtitle')}
        actions={
          <Button variant="primary" onClick={() => setDraft(emptyDraft(settings.expenseCategories[0] ?? 'Other'))}>
            + {t('exp_addExpense')}
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Stat label={`${t('total')} (${month === 'all' ? t('all') : monthLabel(month, lang)})`} value={formatMoney(total)} tone="green" />
        <Stat label={t('exp_unpaid')} value={formatMoney(unpaid)} tone="amber" />
        <Stat label={t('exp_expenseCount')} value={String(filtered.length)} tone="slate" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <Card
          title={t('exp_title')}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Input
                placeholder={t('search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-36 py-1.5 text-xs"
              />
              <Select value={month} onChange={(e) => setMonth(e.target.value)} className="py-1.5 text-xs">
                <option value="all">{t('all')}</option>
                {months.map((m) => (
                  <option key={m} value={m}>
                    {monthLabel(m, lang)}
                  </option>
                ))}
              </Select>
            </div>
          }
        >
          {filtered.length === 0 ? (
            <EmptyState>{t('noData')}</EmptyState>
          ) : (
            <Table>
              <thead>
                <tr>
                  <TH>{t('date')}</TH>
                  <TH>{t('category')}</TH>
                  <TH>{t('description')}</TH>
                  <TH>{t('exp_payment')}</TH>
                  <TH right>{t('amount')}</TH>
                  <TH></TH>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <TD className="whitespace-nowrap">{formatDate(e.date, lang)}</TD>
                    <TD>
                      {e.category} {e.isSample && <SampleBadge />}
                    </TD>
                    <TD className="text-slate-500">{e.description || '—'}</TD>
                    <TD>
                      {e.paid ? <Badge tone="green">{t('exp_paid')}</Badge> : <Badge tone="amber">{t('exp_unpaid')}</Badge>}
                    </TD>
                    <TD right className="font-medium">
                      {formatMoney(e.amount)}
                    </TD>
                    <TD right>
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => edit(e)}>
                          {t('edit')}
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => remove(e.id!)}>
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

        <div className="space-y-4">
          <Card title={t('exp_byCategory')}>
            {byCategory.length === 0 ? (
              <p className="text-sm text-slate-400">—</p>
            ) : (
              <ul className="space-y-2">
                {byCategory.map(([cat, amt]) => (
                  <li key={cat}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">{cat}</span>
                      <span className="font-medium text-slate-800">{formatMoney(amt)}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-brand-500" style={{ width: `${total ? (amt / total) * 100 : 0}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title={t('exp_quickRecurring')} subtitle={t('exp_useTemplate')}>
            <div className="flex flex-wrap gap-2">
              {recurringTemplates.map((c) => (
                <Button key={c} size="sm" onClick={() => setDraft({ ...emptyDraft(c), recurring: true })}>
                  {c}
                </Button>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.id ? t('edit') : t('exp_addExpense')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDraft(null)}>
              {t('cancel')}
            </Button>
            <Button variant="primary" onClick={save}>
              {t('save')}
            </Button>
          </>
        }
      >
        {draft && (
          <div className="grid gap-3 sm:grid-cols-2">
            <DateField label={t('date')} value={draft.date} onChange={(v) => setDraft({ ...draft, date: v })} required />
            <Field label={t('amount')} required>
              <Input
                type="number"
                value={draft.amount}
                onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
                placeholder="0"
              />
            </Field>
            <Field label={t('category')} required>
              <Select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
                {settings.expenseCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                {!settings.expenseCategories.includes(draft.category) && (
                  <option value={draft.category}>{draft.category}</option>
                )}
              </Select>
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
            <Field label={t('description')} className="sm:col-span-2">
              <Textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </Field>
            <Field label={t('exp_payment')}>
              <Select
                value={draft.paid ? 'yes' : 'no'}
                onChange={(e) => setDraft({ ...draft, paid: e.target.value === 'yes' })}
              >
                <option value="yes">{t('exp_paid')}</option>
                <option value="no">{t('exp_unpaid')}</option>
              </Select>
            </Field>
            {draft.paid && (
              <DateField label={t('tax_paidDate')} value={draft.paidDate} onChange={(v) => setDraft({ ...draft, paidDate: v })} />
            )}
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
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={draft.recurring}
                onChange={(e) => setDraft({ ...draft, recurring: e.target.checked })}
                className="h-4 w-4 accent-brand-600"
              />
              {t('exp_recurring')}
            </label>
            {includeSample && draft.isSample && <Badge tone="gold">{t('sample')}</Badge>}
          </div>
        )}
      </Modal>
    </div>
  )
}
