import { useMemo, useState } from 'react'
import { db } from '../db/db'
import { useData } from '../db/DataContext'
import type { Account, OwnerTxnType } from '../db/types'
import { useI18n } from '../i18n/LanguageContext'
import { useOptions } from '../lib/options'
import { accountBalances, cashRows } from '../lib/calc'
import { DateField } from '../components/DateField'
import { Button, Card, EmptyState, Field, Input, PageHeader, Select, Stat, Table, TD, TH } from '../components/ui'
import { formatDate, formatMoney, num, todayISO } from '../lib/format'

export function Cashbook() {
  const { t, lang } = useI18n()
  const { data, ownerTransactions, transfers, settings } = useData()
  const { account } = useOptions()

  const balances = accountBalances(data)
  const rowsAll = useMemo(() => cashRows(data), [data])

  const [accFilter, setAccFilter] = useState<'all' | Account>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const rows = useMemo(
    () =>
      rowsAll
        .filter((r) => (accFilter === 'all' ? true : r.account === accFilter))
        .filter((r) => (from ? r.date >= from : true))
        .filter((r) => (to ? r.date <= to : true)),
    [rowsAll, accFilter, from, to],
  )

  const rowsWithBalance = useMemo(() => {
    if (accFilter === 'all') return rows.map((r) => ({ ...r, balance: null as number | null }))
    let bal =
      accFilter === 'cash' ? settings.openingCash : accFilter === 'bank' ? settings.openingBank : settings.openingMobile
    return rows.map((r) => {
      bal += r.inflow - r.outflow
      return { ...r, balance: bal }
    })
  }, [rows, accFilter, settings.openingCash, settings.openingBank, settings.openingMobile])

  const totalIn = rows.reduce((s, r) => s + r.inflow, 0)
  const totalOut = rows.reduce((s, r) => s + r.outflow, 0)

  const [oTxn, setOTxn] = useState({
    date: todayISO(),
    type: 'contribution' as OwnerTxnType,
    amount: '',
    account: 'cash' as Account,
    note: '',
  })
  async function addOwner() {
    if (!oTxn.amount) return
    await db.ownerTransactions.add({ ...oTxn, amount: num(oTxn.amount), isSample: false })
    setOTxn({ ...oTxn, amount: '', note: '' })
  }

  const [tr, setTr] = useState({ date: todayISO(), from: 'cash' as Account, to: 'bank' as Account, amount: '', note: '' })
  async function addTransfer() {
    if (!tr.amount || tr.from === tr.to) return
    await db.transfers.add({ ...tr, amount: num(tr.amount), isSample: false })
    setTr({ ...tr, amount: '', note: '' })
  }

  return (
    <div>
      <PageHeader title={t('cb_title')} subtitle={t('cb_generated')} />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={t('cb_acc_cash')} value={formatMoney(balances.cash)} tone="green" />
        <Stat label={t('cb_acc_bank')} value={formatMoney(balances.bank)} tone="blue" />
        <Stat label={t('cb_acc_mobile')} value={formatMoney(balances.mobile)} tone="gold" />
        <Stat label={t('total')} value={formatMoney(balances.total)} tone="slate" />
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <Card title={t('own_title')}>
          <div className="grid gap-2 sm:grid-cols-2">
            <DateField label={t('date')} value={oTxn.date} onChange={(v) => setOTxn({ ...oTxn, date: v })} />
            <Field label={t('pmt_type')}>
              <Select value={oTxn.type} onChange={(e) => setOTxn({ ...oTxn, type: e.target.value as OwnerTxnType })}>
                <option value="contribution">{t('own_contrib')}</option>
                <option value="withdrawal">{t('own_withdraw')}</option>
              </Select>
            </Field>
            <Field label={t('amount')}>
              <Input type="number" value={oTxn.amount} onChange={(e) => setOTxn({ ...oTxn, amount: e.target.value })} />
            </Field>
            <Field label={t('cb_account')}>
              <Select value={oTxn.account} onChange={(e) => setOTxn({ ...oTxn, account: e.target.value as Account })}>
                {account.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('note')} className="sm:col-span-2">
              <Input value={oTxn.note} onChange={(e) => setOTxn({ ...oTxn, note: e.target.value })} />
            </Field>
            <Button variant="primary" onClick={addOwner}>
              {t('add')}
            </Button>
          </div>

          <ul className="mt-3 space-y-1">
            {ownerTransactions
              .slice()
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((o) => (
                <li key={o.id} className="flex items-center justify-between border-b border-slate-100 py-1.5 text-sm">
                  <span className="text-slate-500">
                    {formatDate(o.date, lang)} · {o.type === 'contribution' ? t('own_contrib') : t('own_withdraw')}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className={o.type === 'contribution' ? 'text-emerald-700' : 'text-red-600'}>
                      {o.type === 'contribution' ? '+' : '−'}
                      {formatMoney(o.amount)}
                    </span>
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => db.ownerTransactions.delete(o.id!)}>
                      {t('delete')}
                    </Button>
                  </span>
                </li>
              ))}
            {ownerTransactions.length === 0 && <li className="py-2 text-xs text-slate-400">{t('noData')}</li>}
          </ul>
        </Card>

        <Card title={t('cb_transfer')} subtitle={t('cb_transfers')}>
          <div className="grid gap-2 sm:grid-cols-2">
            <DateField label={t('date')} value={tr.date} onChange={(v) => setTr({ ...tr, date: v })} />
            <Field label={t('amount')}>
              <Input type="number" value={tr.amount} onChange={(e) => setTr({ ...tr, amount: e.target.value })} />
            </Field>
            <Field label={t('from')}>
              <Select value={tr.from} onChange={(e) => setTr({ ...tr, from: e.target.value as Account })}>
                {account.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('to')}>
              <Select value={tr.to} onChange={(e) => setTr({ ...tr, to: e.target.value as Account })}>
                {account.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Button variant="primary" onClick={addTransfer} disabled={tr.from === tr.to}>
              {t('add')}
            </Button>
          </div>

          <ul className="mt-3 space-y-1">
            {transfers
              .slice()
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((x) => (
                <li key={x.id} className="flex items-center justify-between border-b border-slate-100 py-1.5 text-sm">
                  <span className="text-slate-500">
                    {formatDate(x.date, lang)} · {x.from} → {x.to}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-slate-700">{formatMoney(x.amount)}</span>
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => db.transfers.delete(x.id!)}>
                      {t('delete')}
                    </Button>
                  </span>
                </li>
              ))}
            {transfers.length === 0 && <li className="py-2 text-xs text-slate-400">{t('noData')}</li>}
          </ul>
        </Card>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Stat label={t('cb_in')} value={formatMoney(totalIn)} tone="green" />
        <Stat label={t('cb_out')} value={formatMoney(totalOut)} tone="red" />
        <Stat label={t('cb_closing')} value={formatMoney(totalIn - totalOut)} tone="slate" />
      </div>

      <Card
        title={t('cb_title')}
        actions={
          <div className="flex flex-wrap items-end gap-2">
            <Select value={accFilter} onChange={(e) => setAccFilter(e.target.value as 'all' | Account)} className="py-1.5 text-xs">
              <option value="all">{t('all')}</option>
              {account.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </Select>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs" />
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs" />
          </div>
        }
      >
        {rowsWithBalance.length === 0 ? (
          <EmptyState>{t('noData')}</EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <TH>{t('date')}</TH>
                <TH>{t('description')}</TH>
                <TH>{t('cb_account')}</TH>
                <TH right>{t('cb_in')}</TH>
                <TH right>{t('cb_out')}</TH>
                {accFilter !== 'all' && <TH right>{t('cb_closing')}</TH>}
              </tr>
            </thead>
            <tbody>
              {rowsWithBalance.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <TD className="whitespace-nowrap">{formatDate(r.date, lang)}</TD>
                  <TD className="text-slate-600">{r.description}</TD>
                  <TD>{labelAcc(r.account, account)}</TD>
                  <TD right className="text-emerald-700">{r.inflow ? formatMoney(r.inflow) : ''}</TD>
                  <TD right className="text-red-600">{r.outflow ? formatMoney(r.outflow) : ''}</TD>
                  {accFilter !== 'all' && <TD right className="font-medium">{formatMoney(r.balance ?? 0)}</TD>}
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  )
}

function labelAcc(value: Account, opts: { value: Account; label: string }[]) {
  return opts.find((o) => o.value === value)?.label ?? value
}
