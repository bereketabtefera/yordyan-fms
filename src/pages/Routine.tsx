import { useI18n } from '../i18n/LanguageContext'
import type { TKey } from '../i18n/strings'
import { Card, PageHeader } from '../components/ui'

const GROUPS: { title: TKey; items: TKey[]; tone: string }[] = [
  { title: 'rout_daily', items: ['rout_d1', 'rout_d2', 'rout_d3', 'rout_d4'], tone: 'border-l-brand-500' },
  { title: 'rout_weekly', items: ['rout_w1', 'rout_w2', 'rout_w3', 'rout_w4', 'rout_w5'], tone: 'border-l-gold-500' },
  { title: 'rout_monthly', items: ['rout_m1', 'rout_m2', 'rout_m3', 'rout_m4', 'rout_m5', 'rout_m6'], tone: 'border-l-sky-400' },
]

export function Routine() {
  const { t } = useI18n()
  return (
    <div>
      <PageHeader title={t('rout_title')} />
      <div className="grid gap-4 lg:grid-cols-3">
        {GROUPS.map((g) => (
          <Card key={g.title} title={t(g.title)} className={`border-l-4 ${g.tone}`}>
            <ul className="space-y-2 text-sm text-slate-600">
              {g.items.map((i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-brand-500">•</span>
                  <span>{t(i)}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  )
}
