import { useMemo, useState } from 'react'
import { db } from '../db/db'
import { useData } from '../db/DataContext'
import type { TaxRecord } from '../db/types'
import { useI18n } from '../i18n/LanguageContext'
import { DateField } from '../components/DateField'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  SampleBadge,
  Select,
  Stat,
  Table,
  TD,
  Textarea,
  TH,
} from '../components/ui'
import { formatDate, formatMoney, lastNMonths, num, round2, todayISO } from '../lib/format'
import { summarizePeriod } from '../lib/calc'

const VAT_THRESHOLD = 2_000_000
const MAT_RATE = 0.025

const TAX_TYPES: { value: string; label: string }[] = [
  { value: 'Business income tax', label: 'Business income tax' },
  { value: 'VAT', label: 'VAT (15%)' },
  { value: 'Withholding tax', label: 'Withholding tax' },
  { value: 'Employment / payroll (PAYE)', label: 'Employment / payroll (PAYE)' },
  { value: 'Presumptive / TOT', label: 'Presumptive / TOT' },
  { value: 'Other', label: 'Other' },
]

function individualBusinessTax(profit: number): number {
  if (profit <= 0) return 0
  const bands: [number, number, number][] = [
    [0, 24000, 0],
    [24000, 48000, 0.15],
    [48000, 84000, 0.2],
    [84000, 120000, 0.25],
    [120000, 168000, 0.3],
    [168000, Infinity, 0.35],
  ]
  let tax = 0
  for (const [lo, hi, rate] of bands) {
    if (profit > lo) tax += (Math.min(profit, hi) - lo) * rate
  }
  return tax
}

interface Draft {
  id?: number
  taxType: string
  period: string
  estimated: string
  paid: string
  paidDate: string
  deadline: string
  note: string
  isSample?: boolean
}

function emptyDraft(): Draft {
  return {
    taxType: TAX_TYPES[0].value,
    period: String(new Date().getFullYear()),
    estimated: '',
    paid: '',
    paidDate: '',
    deadline: '',
    note: '',
  }
}

export function TaxTracker() {
  const { t, lang } = useI18n()
  const { taxes, data, includeSample } = useData()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [catOverride, setCatOverride] = useState<'auto' | 'A' | 'B'>('auto')
  const [catBRate, setCatBRate] = useState(2)
  const [sales, setSales] = useState<string | null>(null)
  const [costs, setCosts] = useState<string | null>(null)

  const annualFrom = `${lastNMonths(12)[0]}-01`
  const to = todayISO()
  const ann = useMemo(() => summarizePeriod(data, annualFrom, to), [data, annualFrom, to])
  const computedSales = ann.salesBooked
  const computedCosts = ann.directCosts + ann.opex

  const salesStr = sales ?? String(round2(computedSales))
  const costsStr = costs ?? String(round2(computedCosts))
  const annualSales = num(salesStr)
  const annualCosts = num(costsStr)
  const profit = Math.max(0, annualSales - annualCosts)

  const autoCategory = annualSales >= VAT_THRESHOLD ? 'A' : 'B'
  const category = catOverride === 'auto' ? autoCategory : catOverride

  const profitTax = individualBusinessTax(profit)
  const mat = annualSales * MAT_RATE
  const catATax = Math.max(profitTax, mat)
  const catBTax = annualSales * (catBRate / 100)
  const catBLow = annualSales * 0.02
  const catBHigh = annualSales * 0.09
  const indicative = category === 'B' ? catBTax : catATax
  const setAside = indicative / 12
  const vatRegistered = data.settings.vatRate > 0 && annualSales >= VAT_THRESHOLD

  const estTotal = taxes.reduce((s, r) => s + r.estimated, 0)
  const paidTotal = taxes.reduce((s, r) => s + r.paid, 0)
  const outstanding = taxes.reduce((s, r) => s + Math.max(0, r.estimated - r.paid), 0)

  const rows = useMemo(
    () => [...taxes].sort((a, b) => b.period.localeCompare(a.period) || (b.id ?? 0) - (a.id ?? 0)),
    [taxes],
  )

  async function save() {
    if (!draft) return
    const payload: TaxRecord = {
      id: draft.id,
      taxType: draft.taxType,
      period: draft.period,
      estimated: num(draft.estimated),
      paid: num(draft.paid),
      paidDate: draft.paidDate,
      deadline: draft.deadline,
      note: draft.note,
      isSample: draft.isSample ?? false,
    }
    if (draft.id) await db.taxes.put(payload)
    else await db.taxes.add(payload)
    setDraft(null)
  }

  async function remove(id: number) {
    if (window.confirm(t('confirmDelete'))) await db.taxes.delete(id)
  }

  function edit(r: TaxRecord) {
    setDraft({
      id: r.id,
      taxType: r.taxType,
      period: r.period,
      estimated: String(r.estimated),
      paid: String(r.paid),
      paidDate: r.paidDate,
      deadline: r.deadline,
      note: r.note,
      isSample: r.isSample,
    })
  }

  return (
    <div>
      <PageHeader
        title={t('tax_title')}
        subtitle={t('nav_tax')}
        actions={
          <Button variant="primary" onClick={() => setDraft(emptyDraft())}>
            + {t('tax_add')}
          </Button>
        }
      />

      <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <strong>⚠ </strong>
        {t('tax_confirmWarn')}
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={t('tax_estimate')} value={formatMoney(estTotal)} tone="blue" />
        <Stat label={t('tax_paid')} value={formatMoney(paidTotal)} tone="green" />
        <Stat label={t('ord_balance')} value={formatMoney(outstanding)} tone={outstanding > 0 ? 'red' : 'slate'} />
        <Stat label={t('tax_setAside')} value={formatMoney(setAside)} sub={`${t('tax_suggested')}: ${formatMoney(indicative)}`} tone="gold" />
      </div>

      <Card
        title={t('tax_estimator')}
        subtitle={t('tax_confirmWarn')}
        className="mb-4"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label={t('tax_annualSales')}>
            <Input type="number" value={salesStr} onChange={(e) => setSales(e.target.value)} />
          </Field>
          <Field label={t('tax_annualCosts')}>
            <Input type="number" value={costsStr} onChange={(e) => setCosts(e.target.value)} />
          </Field>
          <Field label={t('tax_category')}>
            <Select value={catOverride} onChange={(e) => setCatOverride(e.target.value as 'auto' | 'A' | 'B')}>
              <option value="auto">Auto ({autoCategory})</option>
              <option value="A">Category A</option>
              <option value="B">{t('tax_catB')}</option>
            </Select>
          </Field>
          <Field label={t('tax_taxableProfit')}>
            <Input value={formatMoney(profit)} readOnly className="bg-slate-50 text-slate-500" />
          </Field>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => { setSales(null); setCosts(null) }}>
            ↺ {t('tax_annualSales')}: {formatMoney(computedSales)}
          </Button>
          {category === 'B' && (
            <Field label={t('tax_category')} className="flex-row items-center gap-2">
              <Select value={String(catBRate)} onChange={(e) => setCatBRate(Number(e.target.value))} className="w-28 py-1.5 text-xs">
                {[2, 3, 4, 5, 6, 7, 8, 9].map((r) => (
                  <option key={r} value={r}>
                    {r}%
                  </option>
                ))}
              </Select>
            </Field>
          )}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Stat label={t('tax_suggested')} value={formatMoney(indicative)} tone="gold" />
          <Stat label={t('tax_setAside')} value={formatMoney(setAside)} tone="blue" />
          <Stat
            label="Category"
            value={category}
            sub={category === 'B' ? `${formatMoney(catBLow)} – ${formatMoney(catBHigh)}` : `MAT ${formatMoney(mat)}`}
            tone="slate"
          />
        </div>

        <div className="mt-4 space-y-2 text-xs text-slate-500">
          {category === 'B' ? (
            <p>
              Category B pays tax on <strong>gross sales</strong> (presumptive) at a rate of <strong>2%–9%</strong> depending on
              activity/sector. The rate used here ({catBRate}%) is only a placeholder — confirm your band.
            </p>
          ) : (
            <p>
              Category A: business income tax on profit by graduated bands = {formatMoney(profitTax)}; Minimum Alternate Tax
              (MAT) = 2.5% of turnover = {formatMoney(mat)}. Indicative liability = the higher of the two ={' '}
              {formatMoney(catATax)}.
            </p>
          )}
          {vatRegistered && (
            <p className="text-sky-700">
              Turnover is at/above {formatMoney(VAT_THRESHOLD)} — you may be required to register for <strong>VAT (15%)</strong>.
              VAT is collected from customers and remitted; it is not a business cost.
            </p>
          )}
        </div>
      </Card>

      <Card title={t('tax_title')}>
        {rows.length === 0 ? (
          <EmptyState>{t('noData')}</EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <TH>{t('tax_period')}</TH>
                <TH>{t('tax_type')}</TH>
                <TH>{t('tax_deadline')}</TH>
                <TH right>{t('tax_estimate')}</TH>
                <TH right>{t('tax_paid')}</TH>
                <TH right>{t('ord_balance')}</TH>
                <TH></TH>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const bal = Math.max(0, r.estimated - r.paid)
                return (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <TD className="whitespace-nowrap">{r.period}</TD>
                    <TD>
                      {r.taxType} {r.isSample && <SampleBadge />}
                    </TD>
                    <TD className="whitespace-nowrap text-slate-500">{r.deadline ? formatDate(r.deadline, lang) : '—'}</TD>
                    <TD right>{formatMoney(r.estimated)}</TD>
                    <TD right>
                      {formatMoney(r.paid)}
                      {r.paidDate && <span className="ml-1 text-xs text-slate-400">{formatDate(r.paidDate, lang)}</span>}
                    </TD>
                    <TD right>
                      {bal > 0 ? <Badge tone="red">{formatMoney(bal)}</Badge> : <Badge tone="green">✓</Badge>}
                    </TD>
                    <TD right>
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => edit(r)}>
                          {t('edit')}
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => remove(r.id!)}>
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

      <Card title={t('tax_research')} className="mt-4">
        <details open>
          <summary className="cursor-pointer text-sm font-medium text-slate-700">
            Ethiopian tax rules — research notes & sources
          </summary>
          <div className="mt-3 space-y-3 text-sm text-slate-600">
            <p className="text-xs text-amber-700">
              Researched {lang === 'am' ? '' : ''}from public sources (see links). Tax law changes; verify before relying on it.
            </p>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Law in force</h3>
              <p>
                The <strong>Income Tax (Amendment) Proclamation No. 1395/2017</strong> (enacted ~17 July 2025, gazetted 1
                September 2025) amends the Federal Income Tax Proclamation No. 979/2016. <strong>Effective from 2025</strong>; the
                old Category C is removed and the lump-sum turnover regime is replaced.
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Taxpayer categories</h3>
              <ul className="ml-4 list-disc space-y-1">
                <li>
                  <strong>Category A</strong> — bodies (companies) or non-bodies with annual turnover of{' '}
                  <strong>ETB 2,000,000 or more</strong>.
                </li>
                <li>
                  <strong>Category B</strong> — non-body persons with turnover <strong>under ETB 2,000,000</strong>; taxed
                  presumptively on gross sales.
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Business income tax — individuals (graduated)</h3>
              <Table className="max-w-md" stack={false}>
                <thead>
                  <tr>
                    <TH right>Taxable profit (ETB)</TH>
                    <TH right>Rate</TH>
                  </tr>
                </thead>
                <tbody>
                  <tr><TD right>0 – 24,000</TD><TD right>0%</TD></tr>
                  <tr><TD right>24,001 – 48,000</TD><TD right>15%</TD></tr>
                  <tr><TD right>48,001 – 84,000</TD><TD right>20%</TD></tr>
                  <tr><TD right>84,001 – 120,000</TD><TD right>25%</TD></tr>
                  <tr><TD right>120,001 – 168,000</TD><TD right>30%</TD></tr>
                  <tr><TD right>over 168,000</TD><TD right>35%</TD></tr>
                </tbody>
              </Table>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Category B (presumptive, gross sales)</h3>
              <p>
                A rate between <strong>2% and 9% of annual gross sales</strong>, depending on activity/band, replaces the old
                lump-sum TOT. Professionals and VAT-registered persons are excluded. Confirm your exact band.
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Minimum Alternate Tax (MAT)</h3>
              <p>
                If the tax payable is less than <strong>2.5% of turnover</strong>, MAT of 2.5% of turnover applies. MAT does{' '}
                <strong>not</strong> apply to Category B; excess MAT can be carried forward for up to 5 years.
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">VAT</h3>
              <p>
                Standard rate <strong>15%</strong>. Registration threshold around <strong>ETB 2,000,000</strong> (per Directive
                No. 1104/2025, September 2025; some older references cite ETB 1,000,000 — confirm).
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Withholding tax</h3>
              <p>
                <strong>3%</strong> on goods purchases over ETB 20,000 and on services over ETB 10,000 (replacing the earlier 2%
                rate).
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Employment income tax (PAYE)</h3>
              <p>
                Effective 7 July 2025 — employer withholds monthly: 0–2,000 = 0%; 2,001–4,000 = 15%; 4,001–7,000 = 20%;
                7,001–10,000 = 25%; 10,001–14,000 = 30%; over 14,000 = 35%. (Example: a 5,000 ETB salary ⇒ ~500 ETB/month.)
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tax year & filing deadlines</h3>
              <p>
                Tax year ≈ <strong>8 July – 7 July</strong>. Indicative filing windows: Category A within 4 months, Category B
                within 2 months of year-end; monthly VAT/withholding by the 30th of the following month. <strong>Deadlines are
                unconfirmed — verify.</strong>
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sources</h3>
              <ul className="ml-4 list-disc space-y-1 text-xs">
                <li>
                  <a className="text-brand-600 underline" href="https://justice.gov.et/am/sector/taxation-revenue/" target="_blank" rel="noreferrer">
                    Federal Ministry of Justice — taxation &amp; revenue
                  </a>
                </li>
                <li>
                  <a className="text-brand-600 underline" href="https://www.mofed.gov.et/mof-directive/tax-directive/" target="_blank" rel="noreferrer">
                    Ministry of Finance — tax directives
                  </a>
                </li>
                <li>
                  <a className="text-brand-600 underline" href="https://mor.gov.et/" target="_blank" rel="noreferrer">
                    Ministry of Revenues
                  </a>
                </li>
                <li>
                  <a className="text-brand-600 underline" href="https://taxnews.ey.com/news/2025-2542-ethiopia-issues-a-new-income-tax-proclamation" target="_blank" rel="noreferrer">
                    EY — Ethiopia issues a new income tax proclamation
                  </a>
                </li>
                <li>
                  <a className="text-brand-600 underline" href="https://taxsummaries.pwc.com/ethiopia/individual/significant-developments" target="_blank" rel="noreferrer">
                    PwC — Ethiopia individual significant developments
                  </a>
                </li>
                <li>
                  <a className="text-brand-600 underline" href="https://www.imf.org/-/media/files/publications/selected-issues-papers/2025/english/sipea2025108a.pdf" target="_blank" rel="noreferrer">
                    IMF Selected Issues Paper 2025/108
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </details>
      </Card>

      <Modal
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.id ? t('edit') : t('tax_add')}
        wide
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
            <Field label={t('tax_type')} required>
              <Select value={draft.taxType} onChange={(e) => setDraft({ ...draft, taxType: e.target.value })}>
                {TAX_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
                {!TAX_TYPES.some((o) => o.value === draft.taxType) && <option value={draft.taxType}>{draft.taxType}</option>}
              </Select>
            </Field>
            <Field label={t('tax_period')} required>
              <Input value={draft.period} onChange={(e) => setDraft({ ...draft, period: e.target.value })} placeholder="2025" />
            </Field>
            <Field label={t('tax_estimate')}>
              <Input type="number" value={draft.estimated} onChange={(e) => setDraft({ ...draft, estimated: e.target.value })} />
            </Field>
            <Field label={t('tax_paid')}>
              <Input type="number" value={draft.paid} onChange={(e) => setDraft({ ...draft, paid: e.target.value })} />
            </Field>
            <DateField label={t('tax_paidDate')} value={draft.paidDate} onChange={(v) => setDraft({ ...draft, paidDate: v })} />
            <DateField label={t('tax_deadline')} value={draft.deadline} onChange={(v) => setDraft({ ...draft, deadline: v })} />
            <Field label={t('tax_notes')} className="sm:col-span-2">
              <Textarea value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
            </Field>
            {includeSample && draft.isSample && <Badge tone="gold">{t('sample')}</Badge>}
          </div>
        )}
      </Modal>
    </div>
  )
}
