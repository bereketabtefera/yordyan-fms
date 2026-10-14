import { useMemo, useState } from 'react'
import { useData } from '../db/DataContext'
import { useI18n } from '../i18n/LanguageContext'
import { summarizeMonth } from '../lib/calc'
import { Card, Field, Input, PageHeader, Stat } from '../components/ui'
import { currentMonthKey, formatMoney, num, round2 } from '../lib/format'

export function Pricing() {
  const { t } = useI18n()
  const { data } = useData()

  const [material, setMaterial] = useState('')
  const [tailor, setTailor] = useState('')
  const [designer, setDesigner] = useState('')
  const [other, setOther] = useState('')
  const [overheadMode, setOverheadMode] = useState<'auto' | 'manual'>('auto')
  const [manualOverhead, setManualOverhead] = useState('')
  const [numDresses, setNumDresses] = useState('10')
  const [margin, setMargin] = useState('30')

  const monthOpex = useMemo(() => summarizeMonth(data, currentMonthKey()).opex, [data])
  const autoOverhead = useMemo(() => {
    const n = Math.max(1, num(numDresses))
    return monthOpex / n
  }, [monthOpex, numDresses])

  const overhead = overheadMode === 'auto' ? autoOverhead : num(manualOverhead)
  const direct = num(material) + num(tailor) + num(designer) + num(other)
  const totalCost = direct + overhead

  const marginPct = Math.min(95, Math.max(0, num(margin)))
  const price = marginPct < 100 ? totalCost / (1 - marginPct / 100) : totalCost
  const profit = price - totalCost
  const markup = totalCost > 0 ? (profit / totalCost) * 100 : 0

  return (
    <div>
      <PageHeader title={t('pr_title')} subtitle={t('pr_explain')} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title={t('pr_title')}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('pr_material')}>
              <Input type="number" value={material} onChange={(e) => setMaterial(e.target.value)} />
            </Field>
            <Field label={t('pr_tailor')}>
              <Input type="number" value={tailor} onChange={(e) => setTailor(e.target.value)} />
            </Field>
            <Field label={t('pr_designer')}>
              <Input type="number" value={designer} onChange={(e) => setDesigner(e.target.value)} />
            </Field>
            <Field label={t('pr_other')}>
              <Input type="number" value={other} onChange={(e) => setOther(e.target.value)} />
            </Field>

            <Field label={t('pr_overhead')} hint={overheadMode === 'auto' ? 'auto' : 'manual'}>
              <div className="flex gap-2">
                <select
                  value={overheadMode}
                  onChange={(e) => setOverheadMode(e.target.value as 'auto' | 'manual')}
                  className="rounded-lg border border-slate-300 px-2 py-2 text-sm"
                >
                  <option value="auto">auto</option>
                  <option value="manual">manual</option>
                </select>
                {overheadMode === 'auto' ? (
                  <input
                    type="number"
                    value={numDresses}
                    onChange={(e) => setNumDresses(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder={t('pr_numDresses')}
                  />
                ) : (
                  <Input type="number" value={manualOverhead} onChange={(e) => setManualOverhead(e.target.value)} />
                )}
              </div>
            </Field>
            <Field label={t('pr_targetMargin')}>
              <Input type="number" value={margin} onChange={(e) => setMargin(e.target.value)} />
            </Field>
          </div>

          {overheadMode === 'auto' && (
            <p className="mt-3 text-xs text-slate-400">
              {t('pr_overhead')}: {formatMoney(round2(autoOverhead))} = {t('dash_operating')} ({formatMoney(monthOpex)}) ÷ {num(numDresses) || 1} {t('pr_numDresses')}.
            </p>
          )}
        </Card>

        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Stat label={t('pr_totalCost')} value={formatMoney(round2(totalCost))} tone="slate" />
            <Stat label={t('pr_suggested')} value={formatMoney(round2(price))} tone="green" />
            <Stat label={t('pr_profit')} value={formatMoney(round2(profit))} tone="blue" />
            <Stat label={t('pr_markup')} value={`${round2(markup)}%`} tone="gold" />
          </div>

          <Card title={t('pr_title')}>
            <ul className="space-y-1.5 text-sm">
              <li className="flex justify-between">
                <span className="text-slate-500">{t('pr_material')} + {t('pr_tailor')} + {t('pr_designer')} + {t('pr_other')}</span>
                <span>{formatMoney(round2(direct))}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-500">{t('pr_overhead')}</span>
                <span>{formatMoney(round2(overhead))}</span>
              </li>
              <li className="flex justify-between border-t border-slate-100 pt-1.5 font-semibold">
                <span>{t('pr_totalCost')}</span>
                <span>{formatMoney(round2(totalCost))}</span>
              </li>
              <li className="flex justify-between text-emerald-700">
                <span>{t('pr_suggested')}</span>
                <span className="font-semibold">{formatMoney(round2(price))}</span>
              </li>
            </ul>
            <p className="mt-3 rounded-lg bg-slate-50 p-2 text-xs text-slate-500">{t('pr_explain')}</p>
          </Card>
        </div>
      </div>
    </div>
  )
}
