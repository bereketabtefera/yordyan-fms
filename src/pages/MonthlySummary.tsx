import { useMemo, useState } from 'react'
import { useData } from '../db/DataContext'
import { useI18n } from '../i18n/LanguageContext'
import { expensesByCategory, summarizeMonth } from '../lib/calc'
import { Button, Card, PageHeader, Select, TD, TH, Table } from '../components/ui'
import { addMonths, currentMonthKey, formatMoney, monthLabel } from '../lib/format'

export function MonthlySummary() {
  const { t, lang } = useI18n()
  const { data } = useData()
  const [key, setKey] = useState(currentMonthKey())

  const months = useMemo(() => {
    const set = new Set<string>([currentMonthKey()])
    for (const o of data.orders) set.add(o.orderDate.slice(0, 7))
    for (const e of data.expenses) set.add(e.date.slice(0, 7))
    return [...set].filter(Boolean).sort().reverse()
  }, [data])

  const cur = summarizeMonth(data, key)
  const prev = summarizeMonth(data, addMonths(key, -1))
  const cat = expensesByCategory(data, `${key}-01`, `${key}-31`)

  const line = (label: string, a: number, b: number, strong = false) => (
    <tr className={strong ? 'bg-slate-50 font-semibold' : ''}>
      <TD>{label}</TD>
      <TD right>{formatMoney(a)}</TD>
      <TD right className="text-slate-400">{formatMoney(b)}</TD>
      <TD right className={a - b >= 0 ? 'text-emerald-700' : 'text-red-600'}>{formatMoney(a - b)}</TD>
    </tr>
  )

  return (
    <div>
      <PageHeader
        title={t('ms_title')}
        actions={
          <>
            <Select value={key} onChange={(e) => setKey(e.target.value)} className="text-xs">
              {months.map((m) => (
                <option key={m} value={m}>
                  {monthLabel(m, lang)}
                </option>
              ))}
            </Select>
            <Button onClick={() => window.print()} className="no-print">
              {t('print')}
            </Button>
          </>
        }
      />

      <Card title={`${monthLabel(key, lang)}`} subtitle={`${t('dash_lastMonth')}: ${monthLabel(addMonths(key, -1), lang)}`}>
        <Table stack={false}>
          <thead>
            <tr>
              <TH></TH>
              <TH right>{t('dash_thisMonth')}</TH>
              <TH right>{t('dash_lastMonth')}</TH>
              <TH right>{t('dash_vsLast')}</TH>
            </tr>
          </thead>
          <tbody>
            {line(t('ms_sales'), cur.salesBooked, prev.salesBooked)}
            {line(t('ms_direct'), -cur.directCosts, -prev.directCosts)}
            {line(t('ms_gross'), cur.grossProfit, prev.grossProfit, true)}
            {line(t('ms_opex'), -cur.opex, -prev.opex)}
            {line(t('ms_net'), cur.netBeforeTax, prev.netBeforeTax, true)}
            {line(t('ms_estTax'), -cur.estTax, -prev.estTax)}
            {line(t('ms_afterTax'), cur.estAfterTax, prev.estAfterTax, true)}
            {line(t('ms_collected'), cur.collected, prev.collected)}
            {line(t('ms_contrib'), cur.contributions, prev.contributions)}
            {line(t('ms_withdraw'), -cur.withdrawals, -prev.withdrawals)}
          </tbody>
        </Table>
        <p className="mt-3 text-xs text-slate-400">
          {t('est_label')}: {t('set_taxMode')} = {data.settings.taxMode === 'profit' ? t('set_taxMode_profit') : t('set_taxMode_turnover')},{' '}
          {data.settings.taxRate}%. {t('set_title')} → {t('set_taxRate')}.
        </p>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title={t('dash_expenseBreakdown')}>
          {cat.length === 0 ? (
            <p className="text-sm text-slate-400">—</p>
          ) : (
            <Table>
              <thead>
                <tr>
                  <TH>{t('category')}</TH>
                  <TH right>{t('amount')}</TH>
                </tr>
              </thead>
              <tbody>
                {cat.map((c) => (
                  <tr key={c.category}>
                    <TD>{c.category}</TD>
                    <TD right>{formatMoney(c.amount)}</TD>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <Card title={t('dash_title')} subtitle={t('ms_title')}>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between">
              <span className="text-slate-500">{t('dash_ordersReceived')}</span>
              <span className="font-medium">{cur.ordersReceived}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-slate-500">{t('dash_ordersCompleted')}</span>
              <span className="font-medium">{cur.ordersDelivered}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-slate-500">{t('dash_ordersInProduction')}</span>
              <span className="font-medium">{cur.ordersInProduction}</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
