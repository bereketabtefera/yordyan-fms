import { Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useData } from '../db/DataContext'
import { useI18n } from '../i18n/LanguageContext'
import {
  accountBalances,
  expensesByCategory,
  monthlyTrend,
  orderTotals,
  outstandingBalances,
  summarizeMonth,
} from '../lib/calc'
import { Card, Badge, EmptyState, PageHeader, SampleBadge, Stat, TD, TH, Table } from '../components/ui'
import { addMonths, currentMonthKey, formatDate, formatMoney, lastNMonths, monthLabel, pct } from '../lib/format'

const PIE_COLORS = ['#0f9068', '#1cb381', '#43cd9a', '#e0a92e', '#f2c14e', '#0ea5e9', '#6366f1', '#f43f5e', '#64748b']

export function Dashboard() {
  const { t, lang } = useI18n()
  const { data, orders, payments, productionCosts, settings } = useData()

  const key = currentMonthKey()
  const cur = summarizeMonth(data, key)
  const prev = summarizeMonth(data, addMonths(key, -1))
  const balances = accountBalances(data)
  const owed = outstandingBalances(data)

  const trend = monthlyTrend(data, lastNMonths(6))
  const cat = expensesByCategory(data, `${key}-01`, `${key}-31`).slice(0, 8)
  const recent = orders.slice().sort((a, b) => b.orderDate.localeCompare(a.orderDate)).slice(0, 6)

  const delta = (a: number, b: number) => {
    if (b === 0) return null
    return ((a - b) / Math.abs(b)) * 100
  }

  const deltaText = (a: number, b: number) => {
    const d = delta(a, b)
    if (d === null) return '—'
    return `${d >= 0 ? '+' : ''}${pct(d)}`
  }

  const hasData = orders.length + payments.length + productionCosts.length + data.expenses.length > 0

  return (
    <div>
      <PageHeader title={t('dash_title')} subtitle={`${t('dash_thisMonth')}: ${monthLabel(key, lang)}`} />

      {!hasData && (
        <div className="mb-4 rounded-lg border border-brand-200 bg-brand-50 p-3 text-sm text-brand-800">{t('dash_noData')}</div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={t('dash_totalSales')} value={formatMoney(cur.salesBooked)} sub={`${t('dash_vsLast')}: ${deltaText(cur.salesBooked, prev.salesBooked)}`} tone="green" />
        <Stat label={t('dash_cashCollected')} value={formatMoney(cur.collected)} sub={`${t('dash_vsLast')}: ${deltaText(cur.collected, prev.collected)}`} tone="blue" />
        <Stat label={t('dash_outstanding')} value={formatMoney(owed)} tone="amber" />
        <Stat label={t('dash_estProfit')} value={formatMoney(cur.netBeforeTax)} sub={`${t('dash_vsLast')}: ${deltaText(cur.netBeforeTax, prev.netBeforeTax)}`} tone={cur.netBeforeTax >= 0 ? 'green' : 'red'} />
        <Stat label={t('dash_directCosts')} value={formatMoney(cur.directCosts)} tone="slate" />
        <Stat label={t('dash_operating')} value={formatMoney(cur.opex)} tone="slate" />
        <Stat label={t('dash_cashBank')} value={formatMoney(balances.total)} sub={`${t('cb_acc_cash')} ${formatMoney(balances.cash)}`} tone="gold" />
        <Stat label={t('dash_taxProvision')} value={formatMoney(cur.estTax)} sub={settings.taxRate ? `${settings.taxRate}%` : t('est_label')} tone="red" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title={t('dash_monthlyTrend')} className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                <XAxis dataKey="month" tickFormatter={(m: string) => monthLabel(m, 'en').split(' ')[0].slice(0, 3)} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} width={70} tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))} />
                <Tooltip formatter={(v) => formatMoney(Number(v))} />
                <Legend formatter={(v) => (v === 'sales' ? t('dash_totalSales') : t('dash_operating'))} />
                <Bar dataKey="sales" fill="#0f9068" radius={[3, 3, 0, 0]} />
                <Bar dataKey="costs" fill="#e0a92e" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title={t('dash_expenseBreakdown')}>
          {cat.length === 0 ? (
            <EmptyState>—</EmptyState>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={cat} dataKey="amount" nameKey="category" innerRadius={38} outerRadius={80} paddingAngle={2}>
                    {cat.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatMoney(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <Card title={t('dash_recentOrders')} className="mt-4">
        {recent.length === 0 ? (
          <EmptyState>{t('noData')}</EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <TH>{t('ord_orderNo')}</TH>
                <TH>{t('ord_customer')}</TH>
                <TH>{t('ord_orderDate')}</TH>
                <TH right>{t('ord_price')}</TH>
                <TH right>{t('ord_balance')}</TH>
                <TH>{t('ord_paymentStatus')}</TH>
              </tr>
            </thead>
            <tbody>
              {recent.map((o) => {
                const tt = orderTotals(o, payments, productionCosts)
                return (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <TD className="font-mono text-xs">
                      {o.orderNo} {o.isSample && <SampleBadge />}
                    </TD>
                    <TD>{o.customerName}</TD>
                    <TD className="whitespace-nowrap">{formatDate(o.orderDate, lang)}</TD>
                    <TD right>{formatMoney(o.sellingPrice)}</TD>
                    <TD right className={tt.balance > 0 ? 'text-amber-700' : 'text-slate-400'}>{formatMoney(tt.balance)}</TD>
                    <TD>
                      {tt.paymentStatus === 'paid' ? (
                        <Badge tone="green">{t('pay_paid')}</Badge>
                      ) : tt.paymentStatus === 'partial' ? (
                        <Badge tone="amber">{t('pay_partial')}</Badge>
                      ) : (
                        <Badge tone="red">{t('pay_unpaid')}</Badge>
                      )}
                    </TD>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  )
}
